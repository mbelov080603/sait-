const BOT_DESCRIPTION =
  "Global Basket — теплый и надежный бренд натуральных продуктов. В боте можно открыть маркетплейсы, узнать о бренде и написать нам напрямую.";
const BOT_SHORT_DESCRIPTION =
  "Маркетплейсы, канал бренда и быстрый контакт с Global Basket.";

const readArg = (name) => {
  const index = process.argv.indexOf(name);
  if (index === -1) return "";
  return process.argv[index + 1] || "";
};

const botToken = process.env.TELEGRAM_BOT_TOKEN || readArg("--token");
const siteUrl = (process.env.SITE_URL || readArg("--site-url")).replace(/\/$/, "");
let adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID || readArg("--admin-chat-id");
let ownerUserId = process.env.TELEGRAM_OWNER_USER_ID || readArg("--owner-user-id");
let complaintsChatId = process.env.TELEGRAM_COMPLAINT_CHAT_ID || readArg("--complaints-chat-id");

if (!botToken || !siteUrl) {
  console.error("Usage: node scripts/setup-telegram-bot.mjs --token <BOT_TOKEN> --site-url <SITE_URL> [--owner-user-id <USER_ID>] [--complaints-chat-id <CHAT_ID>] [--admin-chat-id <CHAT_ID>]");
  process.exit(1);
}

const callTelegram = async (method, payload = {}) => {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    throw new Error(data.description || `Telegram API error in ${method}`);
  }

  return data.result;
};

const getPersistedWebhookConfig = async () => {
  const info = await callTelegram("getWebhookInfo");
  if (!info.url) return {};

  try {
    const url = new URL(info.url);
    return {
      ownerUserId:
        url.searchParams.get("ownerUserId") ||
        url.searchParams.get("adminChatId") ||
        "",
      complaintsChatId:
        url.searchParams.get("complaintsChatId") ||
        url.searchParams.get("adminChatId") ||
        "",
    };
  } catch {
    return {};
  }
};

const persistedConfig = await getPersistedWebhookConfig();

if (!ownerUserId) {
  ownerUserId = persistedConfig.ownerUserId || "";
}

if (!complaintsChatId) {
  complaintsChatId = persistedConfig.complaintsChatId || "";
}

if (!complaintsChatId && adminChatId) {
  complaintsChatId = adminChatId;
}

if (!ownerUserId && adminChatId) {
  ownerUserId = adminChatId;
}

const webhookUrl = new URL(`${siteUrl}/api/telegram-webhook`);
webhookUrl.searchParams.set("token", botToken);
if (ownerUserId) webhookUrl.searchParams.set("ownerUserId", ownerUserId);
if (complaintsChatId) webhookUrl.searchParams.set("complaintsChatId", complaintsChatId);

await callTelegram("setMyCommands", {
  commands: [
    { command: "start", description: "Открыть меню Global Basket" },
    { command: "menu", description: "Показать главное меню" },
    { command: "channel", description: "Открыть канал Global Basket" },
  ],
});

await callTelegram("setMyDescription", {
  description: BOT_DESCRIPTION,
});

await callTelegram("setMyShortDescription", {
  short_description: BOT_SHORT_DESCRIPTION,
});

await callTelegram("setWebhook", {
  url: webhookUrl.toString(),
  allowed_updates: ["message"],
});

console.log(
  JSON.stringify(
    {
      ok: true,
      webhookUrl: webhookUrl.toString(),
      ownerUserId: ownerUserId || null,
      complaintsChatId: complaintsChatId || null,
    },
    null,
    2,
  ),
);
