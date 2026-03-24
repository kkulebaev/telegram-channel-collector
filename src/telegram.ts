import crypto from 'node:crypto';
import type { IncomingHttpHeaders } from 'node:http';
import { env } from './env.js';
import type { TelegramUpdate } from './telegram-types.js';

type VerifyWebhookOk = { ok: true; reason: 'ok' | 'no-secret-configured' };
type VerifyWebhookBad = { ok: false; reason: 'missing-secret-token' | 'bad-secret-token' };

export function verifyTelegramWebhook(args: { headers: IncomingHttpHeaders }): VerifyWebhookOk | VerifyWebhookBad {
  const secret = env('TELEGRAM_WEBHOOK_SECRET');
  if (!secret) return { ok: true, reason: 'no-secret-configured' };

  const header = args.headers['x-telegram-bot-api-secret-token'];
  const token = Array.isArray(header) ? header[0] : header;

  if (!token) return { ok: false, reason: 'missing-secret-token' };
  if (token.length !== secret.length) return { ok: false, reason: 'bad-secret-token' };

  const ok = crypto.timingSafeEqual(Buffer.from(token), Buffer.from(secret));
  if (!ok) return { ok: false, reason: 'bad-secret-token' };

  return { ok: true, reason: 'ok' };
}

export function isTelegramUpdate(x: unknown): x is TelegramUpdate {
  return Boolean(x && typeof x === 'object' && 'update_id' in x);
}

export function getChannelMessage(update: TelegramUpdate) {
  return update.edited_channel_post ?? update.channel_post ?? null;
}

export function pickMedia(message: { photo?: Array<{ file_id: string }>; video?: { file_id: string } }) {
  if (message.video?.file_id) return { mediaType: 'video', fileId: message.video.file_id };

  const lastPhoto = message.photo?.[message.photo.length - 1];
  if (lastPhoto?.file_id) return { mediaType: 'photo', fileId: lastPhoto.file_id };

  return { mediaType: null, fileId: null };
}
