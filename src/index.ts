import 'dotenv/config';
import express from 'express';
import { prisma } from './prisma.js';
import { env, mustEnv } from './env.js';
import { isJsonValue } from './json.js';
import { getChannelMessage, isTelegramUpdate, verifyTelegramWebhook } from './telegram.js';

const app = express();

// Basic request logging (method, path, status, duration). No bodies/headers.
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl || req.url} -> ${res.statusCode} (${ms}ms)`);
  });
  next();
});

app.use(express.json({ limit: '2mb' }));

app.get('/healthz', (_req, res) => res.status(200).send('ok'));

app.post('/telegram/webhook', async (req, res) => {
  const verify = verifyTelegramWebhook({ headers: req.headers });
  if (!verify.ok) {
    console.warn('webhook rejected', { reason: verify.reason });
    return res.status(401).json({ ok: false, error: verify.reason });
  }

  if (!isTelegramUpdate(req.body)) {
    console.warn('bad update payload');
    return res.status(400).json({ ok: false, error: 'Bad update' });
  }

  const msg = getChannelMessage(req.body);
  if (!msg) {
    console.log('skip update (not channel_post)', { updateId: req.body.update_id });
    return res.status(200).json({ ok: true, skipped: 'not-channel-post' });
  }

  const allowedChatId = env('TELEGRAM_CHANNEL_CHAT_ID');
  const chatId = String(msg.chat.id);

  const channelUsername = env('TELEGRAM_CHANNEL_USERNAME');
  const postUrl = channelUsername ? `https://t.me/${channelUsername.replace(/^@/, '')}/${msg.message_id}` : null;

  if (allowedChatId && chatId !== allowedChatId.trim()) {
    console.log('skip update (other chat)', { updateId: req.body.update_id, chatId });
    return res.status(200).json({ ok: true, skipped: 'other-chat' });
  }

  console.log('store post', {
    updateId: req.body.update_id,
    chatId,
    messageId: msg.message_id,
    edited: Boolean(msg.edit_date),
    hasText: Boolean(msg.text),
    hasCaption: Boolean(msg.caption),
  });

  const date = new Date((msg.edit_date ?? msg.date) * 1000);
  const edited = Boolean(msg.edit_date);

  // For photo/video posts, Telegram puts the content into `caption` instead of `text`.
  // We want to treat caption as the source of truth when it exists.
  const rawText = msg.caption ?? msg.text ?? null;
  const parts = rawText === null ? null : rawText.split(/\n\n/);

  const headline = parts === null ? null : (parts[0]?.trim() || null);
  const text = parts === null ? null : (parts.slice(1).join('\n\n').trim() || null);

  const entities = msg.entities;
  const raw = req.body;

  const prismaJson = (x: unknown) => {
    if (!isJsonValue(x) || x === null) return undefined;
    return x;
  };

  await prisma.telegramPost.upsert({
    where: { chatId_messageId: { chatId, messageId: msg.message_id } },
    create: {
      chatId,
      messageId: msg.message_id,
      date,
      edited,
      postUrl,
      headline,
      text,
      entities: prismaJson(entities),
      raw: prismaJson(raw),
    },
    update: {
      date,
      edited,
      postUrl,
      headline,
      text,
      entities: prismaJson(entities),
      raw: prismaJson(raw),
    },
  });

  res.status(200).json({ ok: true });
});

const port = Number(env('PORT') || '3000');

async function main() {
  mustEnv('DATABASE_URL');
  mustEnv('TELEGRAM_BOT_TOKEN');

  app.listen(port, () => {
    console.log(`listening on :${port}`);
  });
}

main().catch((e) => {
  console.error('ERROR', e);
  process.exitCode = 1;
});
