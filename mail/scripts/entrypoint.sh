#!/usr/bin/env sh
set -eu

:
: "${MAIL_DOMAIN:=localhost}"
: "${MAIL_HOSTNAME:=mail.${MAIL_DOMAIN}}"
: "${MAIL_SMTP_HELO:=${MAIL_HOSTNAME}}"
: "${MYNETWORKS:=127.0.0.0/8 [::1]/128}"
: "${DKIM_DOMAIN:=${MAIL_DOMAIN}}"
: "${DKIM_SELECTOR:=default}"
: "${DKIM_PRIVATE_KEY:=}"
: "${DKIM_PRIVATE_KEY_BASE64:=}"
: "${MAILHOOK_LOCALPART_PREFIX:=meet+}"

HOST_IP="$(getent hosts host.docker.internal 2>/dev/null | awk 'NR==1{print $1}')"
if [ -n "${HOST_IP}" ] && echo "${HOST_IP}" | grep -q '\.'; then
  MYNETWORKS="${MYNETWORKS} ${HOST_IP}/32"
fi

postconf -e "myhostname = ${MAIL_SMTP_HELO}"
postconf -e "mydomain = ${MAIL_DOMAIN}"
postconf -e "myorigin = ${MAIL_DOMAIN}"
postconf -e "mydestination = ${MAIL_HOSTNAME}, localhost.${MAIL_DOMAIN}, localhost"
postconf -e "relay_domains = ${MAIL_DOMAIN}"
postconf -e "mynetworks = ${MYNETWORKS}"
postconf -e "inet_interfaces = all"
postconf -e "inet_protocols = all"
postconf -e "maillog_file = /dev/stdout"
postconf -e "smtpd_recipient_restrictions = permit_mynetworks,reject_unauth_destination"
postconf -e "smtpd_reject_unlisted_recipient = no"
postconf -e "smtpd_sasl_auth_enable = no"
postconf -e "debug_peer_level = 2"
postconf -e "smtpd_tls_loglevel = 1"
postconf -e "local_recipient_maps="
postconf -e "transport_maps = regexp:/etc/postfix/transport_regexp"

if [ -n "${DKIM_DOMAIN}" ]; then
  mkdir -p /etc/opendkim/keys/${DKIM_DOMAIN}
  chown -R opendkim:opendkim /etc/opendkim
  if [ -n "${DKIM_PRIVATE_KEY_BASE64}" ]; then
    echo "${DKIM_PRIVATE_KEY_BASE64}" | base64 -d > "/etc/opendkim/keys/${DKIM_DOMAIN}/${DKIM_SELECTOR}.private"
    chown opendkim:opendkim "/etc/opendkim/keys/${DKIM_DOMAIN}/${DKIM_SELECTOR}.private"
    chmod 600 "/etc/opendkim/keys/${DKIM_DOMAIN}/${DKIM_SELECTOR}.private"
  elif [ -n "${DKIM_PRIVATE_KEY}" ]; then
    printf "%b" "${DKIM_PRIVATE_KEY}" > "/etc/opendkim/keys/${DKIM_DOMAIN}/${DKIM_SELECTOR}.private"
    chown opendkim:opendkim "/etc/opendkim/keys/${DKIM_DOMAIN}/${DKIM_SELECTOR}.private"
    chmod 600 "/etc/opendkim/keys/${DKIM_DOMAIN}/${DKIM_SELECTOR}.private"
  elif [ ! -f "/etc/opendkim/keys/${DKIM_DOMAIN}/${DKIM_SELECTOR}.private" ]; then
    opendkim-genkey -b 2048 -D /etc/opendkim/keys/${DKIM_DOMAIN} -d "${DKIM_DOMAIN}" -s "${DKIM_SELECTOR}"
    chown opendkim:opendkim "/etc/opendkim/keys/${DKIM_DOMAIN}/${DKIM_SELECTOR}.private"
  fi

  cat > /etc/opendkim.conf <<EOF
Syslog                  yes
UMask                   002
Mode                    sv
Canonicalization        relaxed/simple
UserID                  opendkim:postfix
AutoRestart             yes
AutoRestartRate         10/1h
KeyTable                /etc/opendkim/key.table
SigningTable            /etc/opendkim/signing.table
ExternalIgnoreList      /etc/opendkim/trusted.hosts
InternalHosts           /etc/opendkim/trusted.hosts
Socket                  local:/var/spool/postfix/opendkim/opendkim.sock
EOF

  cat > /etc/opendkim/key.table <<EOF
${DKIM_SELECTOR}._domainkey.${DKIM_DOMAIN} ${DKIM_DOMAIN}:${DKIM_SELECTOR}:/etc/opendkim/keys/${DKIM_DOMAIN}/${DKIM_SELECTOR}.private
EOF

  cat > /etc/opendkim/signing.table <<EOF
*@${DKIM_DOMAIN} ${DKIM_SELECTOR}._domainkey.${DKIM_DOMAIN}
EOF

  cat > /etc/opendkim/trusted.hosts <<EOF
127.0.0.1
localhost
${MAIL_HOSTNAME}
EOF

  mkdir -p /var/spool/postfix/opendkim
  chown opendkim:postfix /var/spool/postfix/opendkim
  chmod 775 /var/spool/postfix/opendkim

  postconf -e "milter_default_action = accept"
  postconf -e "milter_protocol = 6"
  postconf -e "smtpd_milters = local:/var/spool/postfix/opendkim/opendkim.sock"
  postconf -e "non_smtpd_milters = local:/var/spool/postfix/opendkim/opendkim.sock"

  opendkim -x /etc/opendkim.conf
fi

if [ -n "${RELAYHOST:-}" ]; then
  postconf -e "relayhost = ${RELAYHOST}"
fi

if [ -z "${MAILHOOK_URL:-}" ]; then
  echo "MAILHOOK_URL must be set" >&2
  exit 1
fi

MAIL_DOMAIN_REGEX="$(printf '%s' "${MAIL_DOMAIN}" | sed 's/[.[\*^$()+?{|]/\\&/g')"
MAILHOOK_LOCALPART_REGEX="$(printf '%s' "${MAILHOOK_LOCALPART_PREFIX}" | sed 's/[.[\*^$()+?{|]/\\&/g')"

cat > /etc/postfix/transport_regexp <<EOF
/^${MAILHOOK_LOCALPART_REGEX}[^@]*@${MAIL_DOMAIN_REGEX}$/ mailhook:
EOF

if ! grep -q "^mailhook" /etc/postfix/master.cf; then
  cat >> /etc/postfix/master.cf <<EOF
mailhook unix - n n - - pipe
  flags=Rq user=mailhook argv=/usr/local/bin/mailhook --url=${MAILHOOK_URL} --recipient=\${recipient} --sender=\${sender} --client_address=\${client_address}
EOF
fi

exec /usr/sbin/postfix start-fg
