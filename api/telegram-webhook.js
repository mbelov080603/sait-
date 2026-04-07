const {
  ADMIN_CLAIM_COMMAND,
  BOT_URL,
  BOT_USERNAME,
  CHANNEL_URL,
  CHANNEL_USERNAME,
  COMPLAINT_GROUP_BIND_COMMAND,
  COMPANY_DESCRIPTION,
  COMPLAINT_PROMPT,
  GENERAL_CONTACT_PROMPT,
  MAIN_KEYBOARD,
  MARKETPLACES,
  WELCOME_TEXT,
} = require("./_lib/bot-content");
const { buildWebhookUrl, callTelegram, escapeHtml, parseUpdate } = require("./_lib/telegram");

const MARKETPLACE_BY_BUTTON = Object.fromEntries(
  MARKETPLACES.map((item) => [item.button, item]),
);

const START_PAYLOADS = {
  complaint: "Жалобу удобно оставить здесь же. Нажмите кнопку ниже или ответьте на следующее сообщение.",
  site_contact: "Вы перешли с сайта. Напишите вопрос одним сообщением, и мы увидим его в Telegram.",
  site_home: "Вы перешли с главной страницы. Если хотите, просто напишите вопрос следующим сообщением.",
  site_featured: "Вы перешли из товарного блока. Напишите, что хотите уточнить по продукту или покупке.",
  site_footer: "Вы перешли из footer сайта. Напишите вопрос, и мы получим его здесь.",
};

const json = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
};

const inlineUrl = (text, url) => ({
  inline_keyboard: [[{ text, url }]],
});

const sendMessage = (token, chatId, text, extra = {}) =>
  callTelegram(token, "sendMessage", {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
    ...extra,
  });

const sendMenu = (token, chatId, text) =>
  sendMessage(token, chatId, text, {
    reply_markup: MAIN_KEYBOARD,
  });

const sendComplaintPrompt = (token, chatId) =>
  sendMessage(token, chatId, COMPLAINT_PROMPT, {
    reply_markup: {
      force_reply: true,
      selective: true,
      input_field_placeholder: "Опишите жалобу",
    },
  });

const updateWebhookRouting = async (req, token, ownerUserId, complaintsChatId) => {
  const webhookUrl = buildWebhookUrl(req, token, {
    ownerUserId,
    complaintsChatId,
  });
  await callTelegram(token, "setWebhook", {
    url: webhookUrl,
    allowed_updates: ["message"],
  });
  return webhookUrl;
};

const normalizeMessageText = (message) => (message.text || message.caption || "").trim();

const getComplaintId = () => {
  const stamp = new Date().toISOString().replaceAll(/[-:TZ.]/g, "").slice(2, 12);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GB-${stamp}-${suffix}`;
};

const isReplyToPrompt = (message, prompt) => {
  const reply = message.reply_to_message;
  if (!reply || !reply.from || !reply.from.is_bot) return false;
  const replyText = [reply.text, reply.caption].filter(Boolean).join(" ");
  return replyText.includes(prompt);
};

const formatUserLine = (message) => {
  const parts = [
    [message.from.first_name, message.from.last_name].filter(Boolean).join(" ").trim(),
    message.from.username ? `@${message.from.username}` : "",
    `id ${message.from.id}`,
  ].filter(Boolean);

  return parts.join(" • ");
};

const formatForwardText = (kindLabel, message, complaintId) => {
  const text = normalizeMessageText(message);
  const lines = [
    `<b>${kindLabel}</b>`,
    `<b>Номер:</b> ${escapeHtml(complaintId)}`,
    `<b>Пользователь:</b> ${escapeHtml(formatUserLine(message))}`,
    `<b>Чат:</b> ${escapeHtml(message.chat.type)}`,
  ];

  if (text) {
    lines.push("", escapeHtml(text));
  }

  return lines.join("\n");
};

const forwardToAdmin = async (token, adminChatId, kindLabel, message, complaintId) => {
  const summary = formatForwardText(kindLabel, message, complaintId);

  if (Array.isArray(message.photo) && message.photo.length) {
    const largest = message.photo[message.photo.length - 1];
    await callTelegram(token, "sendPhoto", {
      chat_id: adminChatId,
      photo: largest.file_id,
      caption: summary.slice(0, 1024),
      parse_mode: "HTML",
    });
    return;
  }

  await sendMessage(token, adminChatId, summary, { parse_mode: "HTML" });
};

const handleStart = async (token, chatId, payload, adminConfigured) => {
  const extraLine = START_PAYLOADS[payload] ? `\n\n${START_PAYLOADS[payload]}` : "";
  await sendMenu(token, chatId, `${WELCOME_TEXT}${extraLine}`);

  if (payload === "complaint") {
    if (!adminConfigured) {
      await sendMenu(token, chatId, "Чтобы принимать жалобы, этот чат должен быть назначен админским. Нажмите «Оставить жалобу» ещё раз, и бот подключит его автоматически.");
      return;
    }
    await sendComplaintPrompt(token, chatId);
  }

  if (payload && payload.startsWith("site_") && payload !== "complaint") {
    await sendMessage(token, chatId, GENERAL_CONTACT_PROMPT, {
      reply_markup: MAIN_KEYBOARD,
    });
  }
};

const sendChannelCard = async (token, chatId) =>
  sendMessage(
    token,
    chatId,
    `Канал Global Basket\nПодписывайтесь на @${CHANNEL_USERNAME} — там можно публиковать новости, полезные материалы и карточки продукта.`,
    {
      reply_markup: inlineUrl("Открыть канал", CHANNEL_URL),
    },
  );

module.exports = async (req, res) => {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const token = url.searchParams.get("token");
  const legacyAdminChatId = url.searchParams.get("adminChatId") || "";
  const ownerUserId = url.searchParams.get("ownerUserId") || legacyAdminChatId;
  const complaintsChatId = url.searchParams.get("complaintsChatId") || legacyAdminChatId;

  if (!token) {
    return json(res, 400, { ok: false, error: "Missing token" });
  }

  if (req.method === "GET") {
    return json(res, 200, {
      ok: true,
      bot: BOT_USERNAME,
      adminConfigured: Boolean(complaintsChatId),
      ownerConfigured: Boolean(ownerUserId),
      channel: CHANNEL_URL,
    });
  }

  if (req.method !== "POST") {
    return json(res, 405, { ok: false, error: "Method not allowed" });
  }

  const update = parseUpdate(req);
  const message = update.message;

  if (!message || !message.chat) {
    return json(res, 200, { ok: true, skipped: true });
  }

  const chatId = message.chat.id;
  const text = normalizeMessageText(message);

  try {
    if (text === ADMIN_CLAIM_COMMAND || text === COMPLAINT_GROUP_BIND_COMMAND) {
      const senderId = String(message.from?.id || "");
      const unauthorizedOwner = ownerUserId && senderId !== ownerUserId;
      if (unauthorizedOwner) {
        await sendMessage(token, chatId, "Этот бот уже привязан к другому владельцу. Подключить новый чат может только текущий владелец.");
        return json(res, 200, { ok: true });
      }

      const nextOwnerUserId = ownerUserId || senderId;
      if (text === COMPLAINT_GROUP_BIND_COMMAND && message.chat.type === "private") {
        await sendMenu(
          token,
          chatId,
          "Эту команду нужно отправить в группе, куда должны приходить жалобы и новые сообщения из бота.",
        );
        return json(res, 200, { ok: true });
      }

      const nextComplaintsChatId =
        text === ADMIN_CLAIM_COMMAND && message.chat.type === "private"
          ? complaintsChatId || String(chatId)
          : String(chatId);

      await updateWebhookRouting(req, token, nextOwnerUserId, nextComplaintsChatId);
      await sendMenu(
        token,
        chatId,
        message.chat.type === "private"
          ? "Этот личный чат назначен владельцем Global Basket. Жалобы и входящие сообщения можно направить сюда или отдельно привязать группу командой /link_complaints_here."
          : "Эта группа назначена получателем жалоб и входящих сообщений из бота Global Basket.",
      );
      return json(res, 200, {
        ok: true,
        adminConfigured: true,
        ownerUserId: nextOwnerUserId,
        complaintsChatId: nextComplaintsChatId,
      });
    }

    if (text.startsWith("/start")) {
      const payload = text.split(" ").slice(1).join(" ").trim();
      await handleStart(token, chatId, payload, Boolean(complaintsChatId));
      return json(res, 200, { ok: true });
    }

    if (text === "/menu" || text === "/help") {
      await sendMenu(token, chatId, WELCOME_TEXT);
      return json(res, 200, { ok: true });
    }

    if (text === "/channel" || text === "Канал") {
      await sendChannelCard(token, chatId);
      return json(res, 200, { ok: true });
    }

    if (MARKETPLACE_BY_BUTTON[text]) {
      const marketplace = MARKETPLACE_BY_BUTTON[text];
      await sendMessage(
        token,
        chatId,
        `${marketplace.title}\n${marketplace.description.map((item) => `• ${item}`).join("\n")}`,
        {
          reply_markup: inlineUrl(`Открыть на ${marketplace.title}`, marketplace.url),
        },
      );
      return json(res, 200, { ok: true });
    }

    if (text === "Кто мы") {
      await sendMenu(token, chatId, COMPANY_DESCRIPTION);
      return json(res, 200, { ok: true });
    }

    if (text === "Оставить жалобу") {
      if (!complaintsChatId) {
        if (message.chat.type !== "private") {
          await sendMenu(
            token,
            chatId,
            "Админский чат можно назначить только в личном диалоге с ботом. Откройте @global_basket_bot в личных сообщениях и нажмите «Оставить жалобу» ещё раз.",
          );
          return json(res, 200, { ok: true });
        }

        const senderId = String(message.from?.id || chatId);
        await updateWebhookRouting(req, token, senderId, String(chatId));
        await sendMenu(
          token,
          chatId,
          "Этот чат подключён как админский для жалоб и входящих обращений Global Basket.",
        );
        await sendComplaintPrompt(token, chatId);
        return json(res, 200, { ok: true });
      }
      await sendComplaintPrompt(token, chatId);
      return json(res, 200, { ok: true });
    }

    if (isReplyToPrompt(message, COMPLAINT_PROMPT)) {
      if (!complaintsChatId) {
        await sendMenu(
          token,
          chatId,
          "Жалобу пока нельзя передать администратору: админ-чат ещё не подключён.",
        );
        return json(res, 200, { ok: true });
      }

      const complaintId = getComplaintId();
      await forwardToAdmin(token, complaintsChatId, "Новая жалоба Global Basket", message, complaintId);
      await sendMenu(
        token,
        chatId,
        `Жалоба принята. Номер обращения: ${complaintId}. Мы передали её администратору и вернемся с ответом в рабочее время.`,
      );
      return json(res, 200, { ok: true });
    }

    if (text || (Array.isArray(message.photo) && message.photo.length)) {
      if (!complaintsChatId) {
        await sendMenu(token, chatId, `${WELCOME_TEXT}\n\n${GENERAL_CONTACT_PROMPT}`);
        return json(res, 200, { ok: true });
      }

      const inquiryId = getComplaintId();
      await forwardToAdmin(token, complaintsChatId, "Новое сообщение с бота Global Basket", message, inquiryId);
      await sendMenu(
        token,
        chatId,
        `Сообщение получено. Номер обращения: ${inquiryId}. Мы увидим его в Telegram и ответим в рабочее время.`,
      );
      return json(res, 200, { ok: true });
    }

    await sendMenu(token, chatId, WELCOME_TEXT);
    return json(res, 200, { ok: true });
  } catch (error) {
    console.error("telegram-webhook error", error);
    return json(res, 200, { ok: false, error: error.message });
  }
};
