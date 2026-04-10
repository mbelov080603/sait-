const path = require("node:path");
const { pathToFileURL } = require("node:url");

const MAX_SHORT = 120;
const MAX_MEDIUM = 240;
const MAX_LONG = 2000;

const CONTACT_TOPICS = new Set([
  "Вопрос по товару",
  "Оптовый запрос",
  "Где купить",
  "Поддержка",
  "Претензия",
  "Запрос документов",
  "Другое",
]);

const compact = (value = "", max = MAX_MEDIUM) =>
  String(value ?? "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, max);

const normalizePhone = (value = "") => {
  const raw = compact(value, MAX_SHORT);
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `+7${digits}`;
  if (digits.length === 11 && digits.startsWith("8")) return `+7${digits.slice(1)}`;
  if (digits.length >= 11 && raw.startsWith("+")) return `+${digits}`;
  return `+${digits}`;
};

const normalizeEmail = (value = "") => compact(value, MAX_SHORT).toLowerCase();
const normalizeTimestamp = (value = "") => compact(value, MAX_SHORT) || new Date().toISOString();

const emailLooksValid = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const phoneLooksValid = (value) => value.replace(/\D/g, "").length >= 11;

const getRequestId = (prefix = "GB") => {
  const stamp = new Date().toISOString().replaceAll(/[-:TZ.]/g, "").slice(2, 14);
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${stamp}-${suffix}`;
};

const readPath = (root, dottedPath) =>
  dottedPath.split(".").reduce((value, key) => (value && value[key] !== undefined ? value[key] : ""), root);

const leadSharedModuleUrl = pathToFileURL(
  path.resolve(__dirname, "../../scripts/lead-form-shared.mjs"),
).href;

let leadSharedPromise;
const loadLeadShared = async () => {
  leadSharedPromise ||= import(leadSharedModuleUrl);
  return leadSharedPromise;
};

const normalizeContactPayload = (payload = {}) => {
  const contact = payload.contact || {};
  const request = payload.request || {};
  const context = payload.context || {};
  const attribution = payload.attribution || {};

  return {
    formType: "contact",
    requestId: compact(payload.requestId, MAX_SHORT) || getRequestId("GB-CON"),
    intent: compact(payload.intent || "support", MAX_SHORT),
    contact: {
      contactName: compact(payload.contactName || contact.contactName, MAX_SHORT),
      phone: normalizePhone(payload.phone || contact.phone),
      email: normalizeEmail(payload.email || contact.email),
      preferredContact: compact(
        payload.preferredContact || payload.preferredContactMethod || contact.preferredContact,
        MAX_SHORT,
      ),
    },
    request: {
      topic: compact(payload.topic || request.topic, MAX_SHORT),
      comment: compact(payload.comment || request.comment, MAX_LONG),
    },
    consent: {
      accepted: Boolean(payload.consent ?? payload.consentAccepted ?? payload.consent?.accepted),
      acceptedAt: normalizeTimestamp(
        payload.consentAcceptedAt || payload.consent?.acceptedAt || context.submittedAt,
      ),
    },
    context: {
      source: compact(context.source || context.sourceParam, MAX_SHORT),
      pageType: compact(context.pageType, MAX_SHORT),
      pageSlug: compact(context.pageSlug, MAX_SHORT),
      pageUrl: compact(context.pageUrl, MAX_MEDIUM),
      pageTitle: compact(context.pageTitle, MAX_MEDIUM),
      referrer: compact(context.referrer, MAX_MEDIUM),
      sessionId: compact(context.sessionId, MAX_SHORT),
      submittedAt: normalizeTimestamp(context.submittedAt),
    },
    attribution: {
      utmSource: compact(attribution.utmSource || attribution.utm_source, MAX_SHORT),
      utmMedium: compact(attribution.utmMedium || attribution.utm_medium, MAX_SHORT),
      utmCampaign: compact(attribution.utmCampaign || attribution.utm_campaign, MAX_SHORT),
      utmContent: compact(attribution.utmContent || attribution.utm_content, MAX_SHORT),
      utmTerm: compact(attribution.utmTerm || attribution.utm_term, MAX_SHORT),
    },
    honeypot: compact(payload.honeypot || payload.companyWebsite || payload.company_website, MAX_SHORT),
    route: "support",
  };
};

const validateContactPayload = (payload) => {
  const fieldErrors = {};
  const formErrors = [];

  if (!payload.contact.contactName) fieldErrors.contact_name = "Укажите имя.";
  if (!payload.request.topic || !CONTACT_TOPICS.has(payload.request.topic)) {
    fieldErrors.topic = "Выберите тему обращения.";
  }

  const hasPhone = Boolean(payload.contact.phone);
  const hasEmail = Boolean(payload.contact.email);
  if (!hasPhone && !hasEmail) {
    formErrors.push("Оставьте телефон или email для ответа.");
  }
  if (hasPhone && !phoneLooksValid(payload.contact.phone)) {
    fieldErrors.phone = "Проверьте формат телефона.";
  }
  if (hasEmail && !emailLooksValid(payload.contact.email)) {
    fieldErrors.email = "Проверьте email.";
  }
  if (!payload.consent.accepted) {
    fieldErrors.consent = "Подтвердите согласие на обработку данных.";
  }
  if (payload.honeypot) {
    formErrors.push("Подозрительная активность формы.");
  }

  return {
    valid: Object.keys(fieldErrors).length === 0 && formErrors.length === 0,
    fieldErrors,
    formErrors,
    errors: [...formErrors, ...Object.values(fieldErrors)],
  };
};

const normalizeB2BPayload = async (payload = {}) => {
  const shared = await loadLeadShared();
  const normalized = shared.normalizeLeadRequestInput(payload);
  return {
    ...normalized,
    requestId: compact(payload.requestId, MAX_SHORT) || getRequestId("GB-B2B"),
    route: "b2b",
  };
};

const validateB2BPayload = async (payload) => {
  const shared = await loadLeadShared();
  return shared.validateLeadRequest(payload);
};

const normalizeLegacyPayload = async (payload = {}) => {
  const lead = payload.lead || {};
  const company = payload.company || {};
  const context = payload.context || {};
  const order = payload.order || {};
  const delivery = payload.delivery || {};
  const utm = payload.utm || {};

  const looksB2B = Boolean(company.name || order.quantityKg || delivery.address);

  if (looksB2B) {
    return normalizeB2BPayload({
      requestType: context.source === "wholesale" ? "wholesale_purchase" : "partnership",
      businessType: company.purchaseFormat || "Другое",
      productInterest: payload.product?.name ? [payload.product.name] : ["consultation_catalog"],
      estimatedVolume: order.quantityKg ? "100–500 кг" : "До 20 кг",
      exactVolumeKg: order.quantityKg || "",
      city: delivery.address || "",
      purchaseFrequency: "Пока изучаем",
      companyName: company.name || "",
      contactName: lead.name || "",
      preferredContactMethod: lead.preferredContact || "Телефон",
      phone: lead.phone || "",
      email: lead.email || "",
      comment: [lead.message, delivery.address].filter(Boolean).join("\n"),
      consent: Boolean(lead.consent),
      context: {
        sourceParam: context.source || "",
        pageType: context.page || "",
        pageSlug: context.page || "",
        pageUrl: context.landingUrl || "",
        referrer: context.referrer || "",
        productId: payload.product?.id || "",
        productSlug: payload.product?.slug || "",
        productName: payload.product?.name || "",
        categoryContext: payload.product?.category || "",
        submittedAt: context.submittedAt || "",
        locale: "ru",
        timezone: "",
      },
      attribution: {
        utmSource: utm.source || "",
        utmMedium: utm.medium || "",
        utmCampaign: utm.campaign || "",
        utmContent: utm.content || "",
        utmTerm: utm.term || "",
      },
    });
  }

  return normalizeContactPayload({
    intent: lead.topic === "Претензия" ? "complaint" : "support",
    contactName: lead.name || "",
    phone: lead.phone || "",
    email: lead.email || "",
    preferredContact: lead.preferredContact || "",
    topic: lead.topic || "Поддержка",
    comment: lead.message || "",
    consent: Boolean(lead.consent),
    context: {
      source: context.source || "",
      pageType: context.page || "",
      pageSlug: context.page || "",
      pageUrl: context.landingUrl || "",
      referrer: context.referrer || "",
      submittedAt: context.submittedAt || "",
    },
    attribution: {
      utmSource: utm.source || "",
      utmMedium: utm.medium || "",
      utmCampaign: utm.campaign || "",
      utmContent: utm.content || "",
      utmTerm: utm.term || "",
    },
  });
};

const applyFieldMap = (payload, fieldMap = {}) =>
  Object.fromEntries(
    Object.entries(fieldMap)
      .map(([fieldName, dottedPath]) => [fieldName, readPath(payload, dottedPath)])
      .filter(([, value]) => value !== "" && value !== undefined && value !== null),
  );

module.exports = {
  applyFieldMap,
  normalizeB2BPayload,
  normalizeContactPayload,
  normalizeLegacyPayload,
  validateB2BPayload,
  validateContactPayload,
};
