#!/usr/bin/env bash
set -euo pipefail

SMTP_HOST="${SMTP_HOST:-mail}"
SMTP_PORT="${SMTP_PORT:-25}"
MAIL_DOMAIN="${MAIL_DOMAIN:-adventuremeets.apps.fringecoding.com}"
RECIPIENT="${RECIPIENT:-test@${MAIL_DOMAIN}}"
SENDER="${SENDER:-noreply@${MAIL_DOMAIN}}"

echo "==> Following logs (mail)..."
docker compose logs -f --tail=50 mail &
LOG_PID=$!
trap 'kill ${LOG_PID} >/dev/null 2>&1 || true' EXIT

echo "==> Sending test outbound message via API container SMTP client"
docker compose exec -T api sh -lc \
  "SMTP_HOST='${SMTP_HOST}' SMTP_PORT='${SMTP_PORT}' RECIPIENT='${RECIPIENT}' SENDER='${SENDER}' node -e \"\
const nodemailer=require('nodemailer');\
const host=process.env.SMTP_HOST||'mail';\
const port=parseInt(process.env.SMTP_PORT||'25',10);\
const to=process.env.RECIPIENT;\
const from=process.env.SENDER;\
const transport=nodemailer.createTransport({host,port,secure:false});\
transport.sendMail({to,from,subject:'Outgoing test '+new Date().toISOString(),text:'Hello from test-outgoing.sh'}).then(()=>{\
  console.log('sent');\
}).catch((err)=>{\
  console.error(err);process.exit(1);\
});\""

echo "==> Done. If everything is wired, you should see mail + API logs above."
