FROM alpine:3.20

RUN apk add --no-cache postfix bash curl ca-certificates opendkim opendkim-utils openssl \
  && adduser -D -H -s /sbin/nologin mailhook \
  && (id -u opendkim >/dev/null 2>&1 || adduser -D -H -s /sbin/nologin opendkim)

COPY scripts/mailhook.sh /usr/local/bin/mailhook
COPY scripts/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/mailhook /usr/local/bin/entrypoint.sh

ENV MAILHOOK_URL="http://api:8000/incoming"

EXPOSE 25

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
