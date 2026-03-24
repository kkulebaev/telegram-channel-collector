export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
};

export type TelegramMessage = {
  message_id: number;
  date: number;
  edit_date?: number;
  chat: {
    id: number;
    type: 'private' | 'group' | 'supergroup' | 'channel';
    title?: string;
    username?: string;
  };

  text?: string;
  entities?: unknown;

  caption?: string;
  caption_entities?: unknown;

  photo?: Array<{ file_id: string }>; // ascending sizes
  video?: { file_id: string };
  document?: { file_id: string; mime_type?: string };
};
