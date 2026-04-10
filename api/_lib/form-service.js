const { sendToBitrix } = require("./bitrix");
const {
  normalizeB2BPayload,
  normalizeContactPayload,
  normalizeLegacyPayload,
  validateB2BPayload,
  validateContactPayload,
} = require("./forms");
const { notifyTelegram } = require("./telegram-notify");

const RATE_LIMIT = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_WINDOW = 8;

const compact = (value = "") => String(value || "").trim();

const getClientIp = (req) =>
  compact(req.headers["x-forwarded-for"] || "").split(",")[0] ||
  compact(req.socket?.remoteAddress) ||
  "unknown";

const assertRateLimit = (req, formType) => {
  const key = `${getClientIp(req)}:${formType}`;
  const now = Date.now();
  const bucket = RATE_LIMIT.get(key) || [];
  const fresh = bucket.filter((timestamp) => now - timestamp < WINDOW_MS);

  if (fresh.length >= MAX_PER_WINDOW) {
    const error = new Error("Слишком много попыток отправки. Попробуйте позже.");
    error.statusCode = 429;
    throw error;
  }

  fresh.push(now);
  RATE_LIMIT.set(key, fresh);
};

const inferFormType = (body = {}, explicitType = "") => {
  if (explicitType) return explicitType;
  if (body.formType) return body.formType;
  if (body.lead || body.company || body.order) return "legacy";
  return "contact";
};

const normalizePayload = (body, explicitType = "") => {
  const formType = inferFormType(body, explicitType);
  if (formType === "legacy") return normalizeLegacyPayload(body);
  if (formType === "b2b") return normalizeB2BPayload(body);
  return normalizeContactPayload(body);
};

const validatePayload = (payload) =>
  payload.formType === "b2b" ? validateB2BPayload(payload) : validateContactPayload(payload);

const handleB2B = async (payload) => {
  try {
    const bitrixResult = await sendToBitrix(payload);
    return {
      ok: true,
      requestId: payload.requestId,
      deliveryMode: bitrixResult.deliveryMode,
      bitrixLeadId: bitrixResult.bitrixLeadId,
      message:
        bitrixResult.deliveryMode === "mock"
          ? "Заявка принята в mock-режиме. Подключите live Bitrix webhook для production-маршрута."
          : "B2B-заявка отправлена в CRM.",
    };
  } catch (error) {
    const fallback = await notifyTelegram(payload, "b2b", "Bitrix fallback").catch(() => null);
    if (fallback?.ok) {
      return {
        ok: true,
        requestId: payload.requestId,
        deliveryMode: "telegram_fallback",
        message:
          "Bitrix временно недоступен. Заявка ушла в резервный корпоративный Telegram-канал.",
      };
    }

    const finalError = new Error(error.message || "Не удалось отправить B2B-заявку.");
    finalError.statusCode = 502;
    throw finalError;
  }
};

const handleContact = async (payload) => {
  const route = payload.route || "support";

  const notified = await notifyTelegram(payload, route).catch(() => null);
  if (notified?.ok) {
    return {
      ok: true,
      requestId: payload.requestId,
      deliveryMode: "telegram",
      message:
        route === "complaint"
          ? "Обращение отправлено в сервисный канал для претензий."
          : "Сообщение отправлено в сервисный канал бренда.",
    };
  }

  return {
    ok: true,
    requestId: payload.requestId,
    deliveryMode: "mock",
    message:
      "Внешний канал не настроен. Обращение принято в mock-режиме и может быть подключено к Telegram или CRM через env-конфигурацию.",
  };
};

const processForm = async (req, body, explicitType = "") => {
  const payload = normalizePayload(body, explicitType);
  assertRateLimit(req, payload.formType);

  const errors = validatePayload(payload);
  if (errors.length) {
    return {
      statusCode: 400,
      payload: {
        ok: false,
        error: "validation_error",
        message: errors.join(" "),
        errors,
      },
    };
  }

  const result =
    payload.formType === "b2b" ? await handleB2B(payload) : await handleContact(payload);

  return {
    statusCode: 200,
    payload: result,
  };
};

module.exports = {
  processForm,
};
