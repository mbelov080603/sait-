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

  const productInterest = Array.isArray(payload.productInterest)
    ? payload.productInterest
        .map((item) => {
          if (item === "consultation_catalog") return "Нужна консультация по ассортименту";
          return item.startsWith("product:") ? item.slice("product:".length) : item;
        })
        .join(", ")
    : payload.request?.productInterest || "";

  const lines = [
    `<b>${escapeHtml(heading)}</b>`,
    `<b>Request ID:</b> ${escapeHtml(payload.requestId)}`,
    `<b>Intent:</b> ${escapeHtml(payload.intent || payload.requestType || "")}`,
    payload.companyName || payload.contact?.companyName
      ? `<b>Компания:</b> ${escapeHtml(payload.companyName || payload.contact?.companyName)}`
      : "",
    payload.contactName || payload.contact?.contactName
      ? `<b>Контакт:</b> ${escapeHtml(payload.contactName || payload.contact?.contactName)}`
      : "",
    payload.phone || payload.contact?.phone
      ? `<b>Телефон:</b> ${escapeHtml(payload.phone || payload.contact?.phone)}`
      : "",
    payload.email || payload.contact?.email
      ? `<b>Email:</b> ${escapeHtml(payload.email || payload.contact?.email)}`
      : "",
    payload.city || payload.contact?.city
      ? `<b>Город:</b> ${escapeHtml(payload.city || payload.contact?.city)}`
      : "",
    payload.businessType || payload.contact?.businessType
      ? `<b>Тип бизнеса:</b> ${escapeHtml(payload.businessType || payload.contact?.businessType)}`
      : "",
    payload.request.topic ? `<b>Тема:</b> ${escapeHtml(payload.request.topic)}` : "",
    productInterest ? `<b>Интерес:</b> ${escapeHtml(productInterest)}` : "",
    payload.estimatedVolume || payload.request?.estimatedVolume
      ? `<b>Объём:</b> ${escapeHtml(payload.estimatedVolume || payload.request?.estimatedVolume)}`
      : "",
    payload.purchaseFrequency || payload.request?.frequency
      ? `<b>Частота:</b> ${escapeHtml(payload.purchaseFrequency || payload.request?.frequency)}`
      : "",
    payload.context?.sourceParam || payload.context?.source
      ? `<b>Source:</b> ${escapeHtml(payload.context?.sourceParam || payload.context?.source)}`
      : "",
    payload.context?.pageType ? `<b>Страница:</b> ${escapeHtml(payload.context.pageType)}` : "",
    payload.context?.pageUrl ? `<b>URL:</b> ${escapeHtml(payload.context.pageUrl)}` : "",
    note ? `<b>Заметка:</b> ${escapeHtml(note)}` : "",
    payload.comment || payload.request?.comment
      ? `\n${escapeHtml(payload.comment || payload.request?.comment)}`
      : "",
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
