# telegram-channel-collector

<p align="center">
  <img src="./assets/telegram-collector-banner.svg" alt="Telegram Channel Collector — Collect and archive posts from Telegram channels" width="1000" />
</p>

<p align="center">
  <a href="https://github.com/kkulebaev/telegram-channel-collector"><img alt="repo" src="https://img.shields.io/badge/repo-github-111827?logo=github" /></a>
  <img alt="typescript" src="https://img.shields.io/badge/typescript-3178C6?logo=typescript&logoColor=white" />
  <img alt="prisma" src="https://img.shields.io/badge/prisma-2D3748?logo=prisma&logoColor=white" />
  <img alt="postgres" src="https://img.shields.io/badge/postgres-4169E1?logo=postgresql&logoColor=white" />
  <img alt="telegram" src="https://img.shields.io/badge/telegram-bot-26A5E4?logo=telegram&logoColor=white" />
</p>

Webhook service that collects posts from a Telegram channel and stores them in a database.

## What it stores

Each incoming update is stored as a single record keyed by channel and message id.

- The latest version of a post (new or edited)
- Extracted text content (headline + body) when available
- A permalink to the post (optional, if channel username is configured)
- The original Telegram update payload for debugging/backfills

## Environment variables

- `DATABASE_URL` — Postgres connection string
- `TELEGRAM_BOT_TOKEN` — token from @BotFather
- `TELEGRAM_WEBHOOK_SECRET` — secret token used to validate webhook calls
- `TELEGRAM_CHANNEL_CHAT_ID` (optional) — if set, only messages from this `chat.id` are stored
- `TELEGRAM_CHANNEL_USERNAME` (optional) — if set, `postUrl` is built as `https://t.me/<username>/<messageId>`
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
