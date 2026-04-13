const readArg = (name) => {
  const index = process.argv.indexOf(name);
  if (index === -1) return "";
  return process.argv[index + 1] || "";
};

const botToken = process.env.TELEGRAM_BOT_TOKEN || readArg("--token");
const chatId = process.env.TELEGRAM_CHANNEL_ID || readArg("--chat-id") || "@Global_Basket";
const text = process.env.TELEGRAM_POST_TEXT || readArg("--text");
const photo = process.env.TELEGRAM_POST_PHOTO || readArg("--photo");
const buttonLabel = process.env.TELEGRAM_POST_BUTTON_LABEL || readArg("--button-label");
const buttonUrl = process.env.TELEGRAM_POST_BUTTON_URL || readArg("--button-url");
const parseMode = process.env.TELEGRAM_PARSE_MODE || readArg("--parse-mode") || "HTML";
const silent = (process.env.TELEGRAM_POST_SILENT || readArg("--silent") || "").toLowerCase() === "true";

if (!botToken || !text) {
  console.error("Usage: node scripts/post-channel-update.mjs --token <BOT_TOKEN> --text <TEXT> [--chat-id @Global_Basket] [--photo URL] [--button-label TEXT --button-url URL]");
  process.exit(1);
}

const replyMarkup =
  buttonLabel && buttonUrl
    ? {
        inline_keyboard: [[{ text: buttonLabel, url: buttonUrl }]],
      }
    : undefined;

const payload = {
  chat_id: chatId,
  disable_notification: silent,
  parse_mode: parseMode,
  disable_web_page_preview: !photo,
};

let method = "sendMessage";

if (photo) {
  method = "sendPhoto";
  payload.photo = photo;
  payload.caption = text;
} else {
  payload.text = text;
}

if (replyMarkup) {
  payload.reply_markup = replyMarkup;
}

const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify(payload),
});

const data = await response.json().catch(() => ({}));
if (!response.ok || !data.ok) {
  console.error(data);
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      method,
      chatId,
      messageId: data.result?.message_id || null,
    },
    null,
    2,
  ),
);
