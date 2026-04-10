const { callTelegram, escapeHtml } = require("./telegram");

const compact = (value = "") => String(value || "").trim();

const getToken = () => compact(process.env.TELEGRAM_BOT_TOKEN);

const resolveChatId = (route) => {
  if (route === "b2b") {
    return (
      compact(process.env.TELEGRAM_LEADS_CHAT_ID) ||
      compact(process.env.TELEGRAM_ADMIN_CHAT_ID)
    );
  }

  if (route === "complaint") {
    return (
      compact(process.env.TELEGRAM_COMPLAINT_CHAT_ID) ||
      compact(process.env.TELEGRAM_ADMIN_CHAT_ID)
    );
  }

  return (
    compact(process.env.TELEGRAM_SUPPORT_CHAT_ID) ||
    compact(process.env.TELEGRAM_ADMIN_CHAT_ID)
  );
};

const buildMessage = (payload, route, note = "") => {
  const heading =
    route === "b2b"
      ? "Новая B2B-заявка"
      : route === "complaint"
        ? "Новая претензия / complaint"
        : "Новое обращение с сайта";

  const lines = [
    `<b>${escapeHtml(heading)}</b>`,
    `<b>Request ID:</b> ${escapeHtml(payload.requestId)}`,
    `<b>Intent:</b> ${escapeHtml(payload.intent)}`,
    payload.contact.companyName ? `<b>Компания:</b> ${escapeHtml(payload.contact.companyName)}` : "",
    payload.contact.contactName ? `<b>Контакт:</b> ${escapeHtml(payload.contact.contactName)}` : "",
    payload.contact.phone ? `<b>Телефон:</b> ${escapeHtml(payload.contact.phone)}` : "",
    payload.contact.email ? `<b>Email:</b> ${escapeHtml(payload.contact.email)}` : "",
    payload.contact.city ? `<b>Город:</b> ${escapeHtml(payload.contact.city)}` : "",
    payload.contact.businessType ? `<b>Тип бизнеса:</b> ${escapeHtml(payload.contact.businessType)}` : "",
    payload.request.topic ? `<b>Тема:</b> ${escapeHtml(payload.request.topic)}` : "",
    payload.request.productInterest ? `<b>Интерес:</b> ${escapeHtml(payload.request.productInterest)}` : "",
    payload.request.estimatedVolume ? `<b>Объём:</b> ${escapeHtml(payload.request.estimatedVolume)}` : "",
    payload.request.frequency ? `<b>Частота:</b> ${escapeHtml(payload.request.frequency)}` : "",
    payload.context.source ? `<b>Source:</b> ${escapeHtml(payload.context.source)}` : "",
    payload.context.pageType ? `<b>Страница:</b> ${escapeHtml(payload.context.pageType)}` : "",
    payload.context.pageUrl ? `<b>URL:</b> ${escapeHtml(payload.context.pageUrl)}` : "",
    note ? `<b>Заметка:</b> ${escapeHtml(note)}` : "",
    payload.request.comment ? `\n${escapeHtml(payload.request.comment)}` : "",
  ].filter(Boolean);

  return lines.join("\n");
};

const notifyTelegram = async (payload, route, note = "") => {
  const token = getToken();
  const chatId = resolveChatId(route);

  if (!token || !chatId) {
    return { ok: false, skipped: true };
  }

  await callTelegram(token, "sendMessage", {
    chat_id: chatId,
    text: buildMessage(payload, route, note),
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });

  return {
    ok: true,
    deliveryMode: "telegram",
    routedTo: chatId,
  };
};

module.exports = {
  notifyTelegram,
};
