# telegram-channel-collector

Webhook service that collects posts from a Telegram channel and stores them in Postgres.

## What it stores

- `channel_post` and `edited_channel_post`
- text posts (`text`)
- media posts (`photo`/`video`) with `caption` + `file_id`
- `entities` / `caption_entities` as JSON (when present)

## Environment variables

- `DATABASE_URL` — Postgres connection string
- `TELEGRAM_BOT_TOKEN` — token from @BotFather
- `TELEGRAM_WEBHOOK_SECRET` — secret token used to validate webhook calls
- `TELEGRAM_CHANNEL_CHAT_ID` (optional) — if set, only messages from this `chat.id` are stored
- `PORT` (optional) — default `3000`

## Setup

1) Add the bot as an **admin** in the channel.
2) Deploy the service (e.g. Railway).
3) Set the webhook (example):

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=https://<YOUR_DOMAIN>/telegram/webhook" \
  -d "secret_token=$TELEGRAM_WEBHOOK_SECRET"
```

## Local dev

```bash
npm i
npm run prisma:generate
npm run dev
```

## DB migrations

On Railway / production:

```bash
npm run prisma:migrate
```
