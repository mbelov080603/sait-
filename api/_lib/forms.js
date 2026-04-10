const MAX_SHORT = 120;
const MAX_MEDIUM = 240;
const MAX_LONG = 2000;

const INTENTS = new Set([
  "support",
  "complaint",
  "product_question",
  "wholesale",
  "corporate_gifts",
  "horeca",
  "distribution",
]);

const FREQUENCIES = new Set([
  "",
  "Разовый запрос",
  "Ежемесячно",
  "Регулярный график",
  "Нужно обсудить",
]);

const trimTo = (value, max = MAX_MEDIUM) => String(value || "").trim().slice(0, max);

const normalizePhone = (value) => {
  const raw = trimTo(value, MAX_SHORT);
  const compact = raw.replace(/[^\d+]/g, "");
  return compact.startsWith("+") ? compact : raw;
};

const normalizeEmail = (value) => trimTo(value, MAX_SHORT).toLowerCase();

const normalizeTimestamp = (value) => {
  const safe = trimTo(value, MAX_SHORT);
  return safe || new Date().toISOString();
};

const emailLooksValid = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const phoneLooksValid = (value) => /\d{10,}/.test(value.replace(/[^\d]/g, ""));

const getRequestId = (prefix = "GB") => {
  const stamp = new Date().toISOString().replaceAll(/[-:TZ.]/g, "").slice(2, 14);
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${stamp}-${suffix}`;
};

const readPath = (root, dottedPath) =>
  dottedPath.split(".").reduce((value, key) => (value && value[key] !== undefined ? value[key] : ""), root);

const pickRoute = ({ formType, intent, request }) => {
  if (formType === "b2b") return "b2b";

  const topic = trimTo(request.topic || "", MAX_SHORT).toLowerCase();
  const intentValue = trimTo(intent || "", MAX_SHORT).toLowerCase();
  if (intentValue === "complaint" || topic.includes("претенз")) return "complaint";
  return "support";
};

const normalizeContext = (context = {}) => ({
  source: trimTo(context.source, MAX_SHORT),
  pageType: trimTo(context.pageType, MAX_SHORT),
  pageSlug: trimTo(context.pageSlug, MAX_SHORT),
  pageUrl: trimTo(context.pageUrl, MAX_MEDIUM),
  referrer: trimTo(context.referrer, MAX_MEDIUM),
  productId: trimTo(context.productId, MAX_SHORT),
  productName: trimTo(context.productName, MAX_MEDIUM),
  categoryId: trimTo(context.categoryId, MAX_SHORT),
  sessionId: trimTo(context.sessionId, MAX_SHORT),
  timestamp: normalizeTimestamp(context.timestamp),
});

const normalizeAttribution = (attribution = {}) => ({
  utmSource: trimTo(attribution.utmSource, MAX_SHORT),
  utmMedium: trimTo(attribution.utmMedium, MAX_SHORT),
  utmCampaign: trimTo(attribution.utmCampaign, MAX_SHORT),
  utmContent: trimTo(attribution.utmContent, MAX_SHORT),
  utmTerm: trimTo(attribution.utmTerm, MAX_SHORT),
  firstUtmSource: trimTo(attribution.firstUtmSource, MAX_SHORT),
  firstUtmMedium: trimTo(attribution.firstUtmMedium, MAX_SHORT),
  firstUtmCampaign: trimTo(attribution.firstUtmCampaign, MAX_SHORT),
});

const normalizeB2BPayload = (payload = {}) => {
  const normalized = {
    formType: "b2b",
    requestId: getRequestId("GB-B2B"),
    intent: trimTo(payload.intent || "wholesale", MAX_SHORT),
    contact: {
      companyName: trimTo(payload.contact?.companyName, MAX_MEDIUM),
      contactName: trimTo(payload.contact?.contactName, MAX_SHORT),
      phone: normalizePhone(payload.contact?.phone),
      email: normalizeEmail(payload.contact?.email),
      city: trimTo(payload.contact?.city, MAX_SHORT),
      businessType: trimTo(payload.contact?.businessType, MAX_SHORT),
      preferredContact: trimTo(payload.contact?.preferredContact, MAX_SHORT),
    },
    request: {
      productInterest: trimTo(payload.request?.productInterest, MAX_MEDIUM),
      estimatedVolume: trimTo(payload.request?.estimatedVolume, MAX_MEDIUM),
      frequency: trimTo(payload.request?.frequency, MAX_SHORT),
      comment: trimTo(payload.request?.comment, MAX_LONG),
    },
    consent: {
      accepted: Boolean(payload.consent?.accepted),
      acceptedAt: normalizeTimestamp(payload.consent?.acceptedAt),
    },
    context: normalizeContext(payload.context),
    attribution: normalizeAttribution(payload.attribution),
    honeypot: trimTo(payload.honeypot, MAX_SHORT),
  };

  normalized.route = pickRoute(normalized);
  return normalized;
};

const normalizeContactPayload = (payload = {}) => {
  const normalized = {
    formType: "contact",
    requestId: getRequestId("GB-CON"),
    intent: trimTo(payload.intent || "support", MAX_SHORT),
    contact: {
      contactName: trimTo(payload.contact?.contactName, MAX_SHORT),
      phone: normalizePhone(payload.contact?.phone),
      email: normalizeEmail(payload.contact?.email),
      preferredContact: trimTo(payload.contact?.preferredContact, MAX_SHORT),
    },
    request: {
      topic: trimTo(payload.request?.topic, MAX_SHORT),
      comment: trimTo(payload.request?.comment, MAX_LONG),
    },
    consent: {
      accepted: Boolean(payload.consent?.accepted),
      acceptedAt: normalizeTimestamp(payload.consent?.acceptedAt),
    },
    context: normalizeContext(payload.context),
    attribution: normalizeAttribution(payload.attribution),
    honeypot: trimTo(payload.honeypot, MAX_SHORT),
  };

  normalized.route = pickRoute(normalized);
  return normalized;
};

const normalizeLegacyPayload = (payload = {}) => {
  const lead = payload.lead || {};
  const company = payload.company || {};
  const context = payload.context || {};
  const order = payload.order || {};
  const delivery = payload.delivery || {};
  const utm = payload.utm || {};

  const looksB2B = Boolean(company.name || order.quantityKg || delivery.address);

  if (looksB2B) {
    return normalizeB2BPayload({
      formType: "b2b",
      intent: context.source === "wholesale" ? "wholesale" : "distribution",
      contact: {
        companyName: company.name,
        contactName: lead.name,
        phone: lead.phone,
        email: lead.email,
        city: delivery.address,
        businessType: company.purchaseFormat || "legacy_b2b",
        preferredContact: lead.preferredContact,
      },
      request: {
        productInterest: payload.product?.name || "Global Basket",
        estimatedVolume: order.quantityKg ? `${order.quantityKg} кг` : "",
        frequency: company.purchaseFormat,
        comment: [lead.message, delivery.address].filter(Boolean).join("\n"),
      },
      consent: {
        accepted: Boolean(lead.consent),
        acceptedAt: context.submittedAt,
      },
      context: {
        source: context.source,
        pageType: context.page,
        pageSlug: context.page,
        pageUrl: context.landingUrl,
        referrer: context.referrer,
        productId: payload.product?.id,
        productName: payload.product?.name,
        categoryId: payload.product?.category,
        sessionId: context.sessionId,
        timestamp: context.submittedAt,
      },
      attribution: {
        utmSource: utm.source,
        utmMedium: utm.medium,
        utmCampaign: utm.campaign,
        utmContent: utm.content,
        utmTerm: utm.term,
      },
    });
  }

  return normalizeContactPayload({
    formType: "contact",
    intent: lead.topic === "Претензия" ? "complaint" : "support",
    contact: {
      contactName: lead.name,
      phone: lead.phone,
      email: lead.email,
      preferredContact: lead.preferredContact,
    },
    request: {
      topic: lead.topic || "Поддержка",
      comment: lead.message,
    },
    consent: {
      accepted: Boolean(lead.consent),
      acceptedAt: context.submittedAt,
    },
    context: {
      source: context.source,
      pageType: context.page,
      pageSlug: context.page,
      pageUrl: context.landingUrl,
      referrer: context.referrer,
      productId: payload.product?.id,
      productName: payload.product?.name,
      categoryId: payload.product?.category,
      sessionId: context.sessionId,
      timestamp: context.submittedAt,
    },
    attribution: {
      utmSource: utm.source,
      utmMedium: utm.medium,
      utmCampaign: utm.campaign,
      utmContent: utm.content,
      utmTerm: utm.term,
    },
  });
};

const validateB2BPayload = (payload) => {
  const errors = [];

  if (!INTENTS.has(payload.intent)) errors.push("Укажите корректный тип корпоративного запроса.");
  if (!payload.contact.companyName) errors.push("Укажите компанию.");
  if (!payload.contact.contactName) errors.push("Укажите контактное лицо.");
  if (!payload.contact.phone || !phoneLooksValid(payload.contact.phone)) {
    errors.push("Укажите корректный телефон.");
  }
  if (!payload.contact.email || !emailLooksValid(payload.contact.email)) {
    errors.push("Укажите корректный email.");
  }
  if (!payload.contact.city) errors.push("Укажите город.");
  if (!payload.contact.businessType) errors.push("Укажите тип бизнеса.");
  if (!payload.request.productInterest) errors.push("Укажите интерес к продукту.");
  if (payload.request.frequency && !FREQUENCIES.has(payload.request.frequency)) {
    errors.push("Укажите корректную частоту закупки.");
  }
  if (!payload.consent.accepted) errors.push("Нужно согласие на обработку данных.");
  if (payload.honeypot) errors.push("Подозрительная активность формы.");

  return errors;
};

const validateContactPayload = (payload) => {
  const errors = [];

  if (!payload.contact.contactName) errors.push("Укажите имя.");
  if (!payload.contact.phone || !phoneLooksValid(payload.contact.phone)) {
    errors.push("Укажите корректный телефон.");
  }
  if (!payload.contact.email || !emailLooksValid(payload.contact.email)) {
    errors.push("Укажите корректный email.");
  }
  if (!payload.request.topic) errors.push("Укажите тему обращения.");
  if (!payload.consent.accepted) errors.push("Нужно согласие на обработку данных.");
  if (payload.honeypot) errors.push("Подозрительная активность формы.");

  return errors;
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
