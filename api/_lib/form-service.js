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
const DEDUPE_BUCKET = new Map();

const compact = (value = "") => String(value || "").trim();

const getEnvNumber = (name, fallback) => {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
};

const WINDOW_MS = getEnvNumber("FORM_RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000);
const MAX_PER_WINDOW = getEnvNumber("FORM_RATE_LIMIT_MAX", 8);
const DEDUPE_WINDOW_MS = getEnvNumber("FORM_DEDUPE_WINDOW_MS", 15 * 60 * 1000);
const DEDUPE_ENABLED = process.env.FORM_DEDUPE_ENABLED !== "false";

const getClientIp = (req) =>
  compact(req.headers["x-forwarded-for"] || "").split(",")[0] ||
  compact(req.socket?.remoteAddress) ||
  "unknown";

const buildCorrelationId = (prefix = "GB-ERR") => {
  const stamp = new Date().toISOString().replaceAll(/[-:TZ.]/g, "").slice(2, 14);
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${stamp}-${suffix}`;
};

const cleanupBucket = (bucket, windowMs, now = Date.now()) =>
  bucket.filter((timestamp) => now - timestamp < windowMs);

const assertRateLimit = (req, formType) => {
  const key = `${getClientIp(req)}:${formType}`;
  const now = Date.now();
  const bucket = cleanupBucket(RATE_LIMIT.get(key) || [], WINDOW_MS, now);

  if (bucket.length >= MAX_PER_WINDOW) {
    const error = new Error("Слишком много попыток отправки. Попробуйте позже.");
    error.statusCode = 429;
    error.code = "rate_limited";
    throw error;
  }

  bucket.push(now);
  RATE_LIMIT.set(key, bucket);
};

const buildDedupeFingerprint = (payload) => {
  if (payload.formType !== "b2b") return "";

  return [
    payload.companyName,
    payload.contactName,
    payload.phone,
    payload.email,
    payload.inn,
    payload.requestType,
    payload.city,
  ]
    .map((value) => compact(value).toLowerCase())
    .filter(Boolean)
    .join("|");
};

const assertNoDuplicateLead = (payload) => {
  if (!DEDUPE_ENABLED || payload.formType !== "b2b") return;

  const fingerprint = buildDedupeFingerprint(payload);
  if (!fingerprint) return;

  const now = Date.now();
  const bucket = cleanupBucket(DEDUPE_BUCKET.get(fingerprint) || [], DEDUPE_WINDOW_MS, now);
  if (bucket.length) {
    const error = new Error(
      "Похоже, похожая заявка уже была отправлена недавно. Если нужно, обновите комментарий и попробуйте ещё раз или свяжитесь с нами напрямую.",
    );
    error.statusCode = 409;
    error.code = "duplicate_submission";
    throw error;
  }

  bucket.push(now);
  DEDUPE_BUCKET.set(fingerprint, bucket);
};

const inferFormType = (body = {}, explicitType = "") => {
  if (explicitType) return explicitType;
  if (body.formType) return body.formType;
  if (body.lead || body.company || body.order) return "legacy";
  return "contact";
};

const normalizePayload = async (body, explicitType = "") => {
  const formType = inferFormType(body, explicitType);
  if (formType === "legacy") return normalizeLegacyPayload(body);
  if (formType === "b2b") return normalizeB2BPayload(body);
  return normalizeContactPayload(body);
};

const validatePayload = async (payload) =>
  payload.formType === "b2b" ? validateB2BPayload(payload) : validateContactPayload(payload);

const handleB2B = async (payload, correlationId) => {
  try {
    const bitrixResult = await sendToBitrix(payload);
    return {
      ok: true,
      requestId: payload.requestId,
      crmId: bitrixResult.crmId || bitrixResult.bitrixLeadId || null,
      deliveryMode: bitrixResult.deliveryMode,
      message:
        "Менеджер Global Basket свяжется с вами, чтобы уточнить объём, формат поставки и дальнейшие условия.",
    };
  } catch (error) {
    console.error("bitrix_submission_failed", {
      correlationId,
      code: error.code || "bitrix_failed",
      message: error.message,
      formType: payload.formType,
    });

    const fallback = await notifyTelegram(payload, "b2b", "Bitrix fallback").catch((notifyError) => {
      console.error("telegram_fallback_failed", {
        correlationId,
        code: notifyError.code || "telegram_failed",
        message: notifyError.message,
      });
      return null;
    });

    if (fallback?.ok) {
      return {
        ok: true,
        requestId: payload.requestId,
        crmId: null,
        deliveryMode: "telegram_fallback",
        message:
          "Заявка получена. Если Bitrix недоступен, мы принимаем её через резервный канал и свяжемся с вами вручную.",
      };
    }

    const finalError = new Error(
      "Не удалось сохранить заявку. Попробуйте ещё раз через несколько минут или используйте резервные каналы связи.",
    );
    finalError.statusCode = 502;
    finalError.code = "lead_delivery_failed";
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
          ? "Обращение отправлено. Мы проверим детали и вернёмся с ответом."
          : "Сообщение отправлено. Мы вернёмся с ответом по указанным контактам.",
    };
  }

  return {
    ok: true,
    requestId: payload.requestId,
    deliveryMode: "mock",
    message: "Обращение принято. Мы вернёмся с ответом по указанным контактам.",
  };
};

const processForm = async (req, body, explicitType = "") => {
  const payload = await normalizePayload(body, explicitType);
  assertRateLimit(req, payload.formType);

  const validation = await validatePayload(payload);
  if (!validation.valid) {
    return {
      statusCode: 400,
      payload: {
        ok: false,
        error: "validation_error",
        message: validation.errors[0] || "Проверьте форму и попробуйте ещё раз.",
        errors: validation.errors,
        fieldErrors: validation.fieldErrors,
        formErrors: validation.formErrors,
      },
    };
  }

  assertNoDuplicateLead(payload);

  const correlationId = buildCorrelationId();
  const result =
    payload.formType === "b2b"
      ? await handleB2B(payload, correlationId)
      : await handleContact(payload, correlationId);

  return {
    statusCode: 200,
    payload: {
      ...result,
      correlationId,
    },
  };
};

module.exports = {
  processForm,
};
