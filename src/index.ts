import 'dotenv/config';
import express from 'express';
import { prisma } from './prisma.js';
import { env, mustEnv } from './env.js';
import { isJsonValue } from './json.js';
import { getChannelMessage, isTelegramUpdate, pickMedia, verifyTelegramWebhook } from './telegram.js';

const app = express();

app.use(express.json({ limit: '2mb' }));

app.get('/healthz', (_req, res) => res.status(200).send('ok'));

app.post('/telegram/webhook', async (req, res) => {
  const verify = verifyTelegramWebhook({ headers: req.headers });
  if (!verify.ok) return res.status(401).json({ ok: false, error: verify.reason });

  if (!isTelegramUpdate(req.body)) return res.status(400).json({ ok: false, error: 'Bad update' });

  const msg = getChannelMessage(req.body);
  if (!msg) return res.status(200).json({ ok: true, skipped: 'not-channel-post' });

  const allowedChatId = env('TELEGRAM_CHANNEL_CHAT_ID');
  const chatId = String(msg.chat.id);

  const channelUsername = env('TELEGRAM_CHANNEL_USERNAME');
  const postUrl = channelUsername ? `https://t.me/${channelUsername.replace(/^@/, '')}/${msg.message_id}` : null;

  if (allowedChatId && chatId !== allowedChatId.trim()) {
    return res.status(200).json({ ok: true, skipped: 'other-chat' });
  }

  const media = pickMedia(msg);

  const date = new Date((msg.edit_date ?? msg.date) * 1000);
  const edited = Boolean(msg.edit_date);

  const entities = msg.entities;
  const captionEntities = msg.caption_entities;
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
      text: msg.text ?? null,
      caption: msg.caption ?? null,
      entities: prismaJson(entities),
      captionEntities: prismaJson(captionEntities),
      mediaType: media.mediaType,
      fileId: media.fileId,
      raw: prismaJson(raw),
    },
    update: {
      date,
      edited,
      postUrl,
      text: msg.text ?? null,
      caption: msg.caption ?? null,
      entities: prismaJson(entities),
      captionEntities: prismaJson(captionEntities),
      mediaType: media.mediaType,
      fileId: media.fileId,
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
