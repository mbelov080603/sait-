const MAX_SHORT = 120;
const MAX_MEDIUM = 240;
const MAX_LONG = 1500;
const MAX_ADDRESS = 320;

export const leadRequestTypes = [
  {
    value: "wholesale_purchase",
    label: "Оптовая закупка",
    description: "Разовый или стартовый запрос на поставку.",
  },
  {
    value: "regular_supply",
    label: "Регулярные поставки",
    description: "Нужен повторяющийся формат поставки или график.",
  },
  {
    value: "commercial_offer",
    label: "Запрос условий / КП",
    description: "Нужно получить коммерческое предложение и уточнить условия.",
  },
  {
    value: "partnership",
    label: "Обсудить сотрудничество",
    description: "Партнёрский, дистрибьюторский или специальный формат работы.",
  },
  {
    value: "other",
    label: "Другое",
    description: "Если ваш сценарий не укладывается в типовые варианты.",
  },
];

export const leadBusinessTypes = [
  "Магазин / розница",
  "HoReCa",
  "Офис / корпоративные закупки",
  "Дистрибуция / опт",
  "Продавец на маркетплейсах",
  "Другое",
];

export const leadPreferredContactMethods = ["Телефон", "Email", "Telegram"];

export const leadEstimatedVolumeOptions = [
  "До 20 кг",
  "20–100 кг",
  "100–500 кг",
  "500+ кг",
];

export const leadPurchaseFrequencyOptions = [
  "Разово",
  "Регулярно",
  "Сезонно",
  "Пока изучаем",
];

export const leadDeliveryFormatOptions = ["Доставка", "Самовывоз", "Обсудить"];

export const leadPackagingNeedsOptions = [
  "Стандартная фасовка",
  "Нужна определённая фасовка",
  "Нужно обсудить формат",
];

export const leadQuoteDrivenRequestTypes = new Set(["commercial_offer"]);
export const leadCommentDrivenRequestTypes = new Set(["other"]);
export const leadFrequencyDrivenRequestTypes = new Set(["regular_supply"]);

export const compact = (value = "", max = MAX_MEDIUM) =>
  String(value ?? "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, max);

export const normalizeEmail = (value = "") => compact(value, MAX_SHORT).toLowerCase();

export const normalizePhone = (value = "") => {
  const raw = compact(value, MAX_SHORT);
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `+7${digits}`;
  if (digits.length === 11 && digits.startsWith("8")) return `+7${digits.slice(1)}`;
  if (digits.length >= 11 && raw.trim().startsWith("+")) return `+${digits}`;
  return `+${digits}`;
};

export const normalizeTelegramUsername = (value = "") => {
  const raw = compact(value, MAX_SHORT).replace(/\s+/g, "");
  if (!raw) return "";
  const cleaned = raw.replace(/^@+/, "").replace(/[^\w]/g, "");
  return cleaned ? `@${cleaned}` : "";
};

export const normalizeInn = (value = "") => compact(value, MAX_SHORT).replace(/\D/g, "").slice(0, 12);

export const normalizeNumber = (value = "") => {
  const raw = compact(value, MAX_SHORT).replace(",", ".");
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const normalizeDateValue = (value = "") => {
  const raw = compact(value, MAX_SHORT);
  if (!raw) return "";
  const stamp = Date.parse(raw);
  if (!Number.isFinite(stamp)) return "";
  return new Date(stamp).toISOString().slice(0, 10);
};

export const sanitizeComment = (value = "") =>
  compact(value, MAX_LONG)
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n");

export const normalizeMultiValue = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => compact(item, MAX_MEDIUM)).filter(Boolean);
  }
  const single = compact(value, MAX_MEDIUM);
  return single ? [single] : [];
};

export const buildLeadProductOptions = (products = [], { includeConsultation = true } = {}) => {
  const options = [];
  if (includeConsultation) {
    options.push({
      value: "consultation_catalog",
      label: "Нужна консультация по ассортименту",
      description: "Поможем подобрать формат под вашу задачу.",
    });
  }

  products.forEach((product) => {
    if (!product?.id || !product?.name) return;
    options.push({
      value: `product:${product.id}`,
      label: product.name,
      description: product.excerpt || product.lead || "",
    });
  });

  return options;
};

export const buildProductInterestSelection = ({
  selectedValues = [],
  defaultProductId = "",
  defaultProductName = "",
} = {}) => {
  const normalized = Array.from(new Set(normalizeMultiValue(selectedValues)));
  if (normalized.length) return normalized;
  if (defaultProductId) return [`product:${defaultProductId}`];
  if (defaultProductName) return [defaultProductName];
  return [];
};

export const normalizeLeadRequestInput = (raw = {}) => {
  const context = raw.context || {};
  const attribution = raw.attribution || {};
  const request = raw.request || {};
  const contact = raw.contact || {};

  const productInterest = buildProductInterestSelection({
    selectedValues: raw.productInterest ?? request.productInterest,
    defaultProductId: context.productId,
    defaultProductName: context.productName,
  });

  return {
    formType: "b2b",
    requestType: compact(raw.requestType || request.requestType || request.type, MAX_SHORT),
    businessType: compact(raw.businessType || contact.businessType || contact.companyType, MAX_SHORT),
    productInterest,
    estimatedVolume: compact(raw.estimatedVolume || request.estimatedVolume, MAX_SHORT),
    exactVolumeKg: normalizeNumber(raw.exactVolumeKg || request.exactVolumeKg),
    purchaseFrequency: compact(raw.purchaseFrequency || request.purchaseFrequency || request.frequency, MAX_SHORT),
    city: compact(raw.city || contact.city, MAX_SHORT),
    deliveryFormat: compact(raw.deliveryFormat || request.deliveryFormat, MAX_SHORT),
    targetDate: normalizeDateValue(raw.targetDate || request.targetDate),
    packagingNeeds: compact(raw.packagingNeeds || request.packagingNeeds, MAX_SHORT),
    needCommercialOffer: Boolean(
      raw.needCommercialOffer ??
        request.needCommercialOffer ??
        raw.needDetailedQuote ??
        request.needDetailedQuote,
    ),
    fullAddress: compact(raw.fullAddress || request.fullAddress, MAX_ADDRESS),
    comment: sanitizeComment(raw.comment || request.comment),
    companyName: compact(raw.companyName || contact.companyName, MAX_MEDIUM),
    contactName: compact(raw.contactName || contact.contactName, MAX_SHORT),
    preferredContactMethod: compact(
      raw.preferredContactMethod || contact.preferredContactMethod || contact.preferredContact,
      MAX_SHORT,
    ),
    phone: normalizePhone(raw.phone || contact.phone),
    email: normalizeEmail(raw.email || contact.email),
    telegramUsername: normalizeTelegramUsername(raw.telegramUsername || contact.telegramUsername),
    inn: normalizeInn(raw.inn || contact.inn),
    consent: Boolean(raw.consent ?? raw.consentAccepted ?? raw.consent?.accepted),
    honeypot: compact(raw.honeypot || raw.companyWebsite || raw.company_website, MAX_SHORT),
    context: {
      sourceParam: compact(context.sourceParam || context.source, MAX_SHORT),
      pageType: compact(context.pageType, MAX_SHORT),
      pageSlug: compact(context.pageSlug, MAX_SHORT),
      formVariant: compact(context.formVariant, MAX_SHORT),
      pageUrl: compact(context.pageUrl, MAX_ADDRESS),
      pageTitle: compact(context.pageTitle, MAX_MEDIUM),
      referrer: compact(context.referrer, MAX_ADDRESS),
      productId: compact(context.productId, MAX_SHORT),
      productSlug: compact(context.productSlug, MAX_SHORT),
      productName: compact(context.productName, MAX_MEDIUM),
      categoryContext: compact(context.categoryContext || context.categoryId, MAX_SHORT),
      submittedAt: compact(context.submittedAt || context.timestamp, MAX_SHORT) || new Date().toISOString(),
      locale: compact(context.locale || "ru", MAX_SHORT),
      timezone: compact(context.timezone, MAX_SHORT),
    },
    attribution: {
      utmSource: compact(attribution.utmSource || attribution.utm_source, MAX_SHORT),
      utmMedium: compact(attribution.utmMedium || attribution.utm_medium, MAX_SHORT),
      utmCampaign: compact(attribution.utmCampaign || attribution.utm_campaign, MAX_SHORT),
      utmContent: compact(attribution.utmContent || attribution.utm_content, MAX_SHORT),
      utmTerm: compact(attribution.utmTerm || attribution.utm_term, MAX_SHORT),
      firstUtmSource: compact(attribution.firstUtmSource || attribution.first_utm_source, MAX_SHORT),
      firstUtmMedium: compact(attribution.firstUtmMedium || attribution.first_utm_medium, MAX_SHORT),
      firstUtmCampaign: compact(attribution.firstUtmCampaign || attribution.first_utm_campaign, MAX_SHORT),
    },
  };
};

export const humanizeProductInterest = (items = [], context = {}) =>
  normalizeMultiValue(items).map((item) => {
    if (item === "consultation_catalog") return "Нужна консультация по ассортименту";
    if (item.startsWith("product:")) {
      const productId = item.slice("product:".length);
      if (context.productId === productId && context.productName) return context.productName;
      return productId.replaceAll("-", " ");
    }
    return item;
  });

export const buildLeadRequestSummary = (payload) => {
  const interest = humanizeProductInterest(payload.productInterest, payload.context || {}).join(", ");
  return [
    payload.requestType ? `Тип запроса: ${payload.requestType}` : "",
    payload.businessType ? `Тип бизнеса: ${payload.businessType}` : "",
    interest ? `Интерес к продукту: ${interest}` : "",
    payload.estimatedVolume ? `Оценка объёма: ${payload.estimatedVolume}` : "",
    payload.exactVolumeKg ? `Точный объём: ${payload.exactVolumeKg} кг` : "",
    payload.purchaseFrequency ? `Частота: ${payload.purchaseFrequency}` : "",
    payload.city ? `Город / регион: ${payload.city}` : "",
    payload.deliveryFormat ? `Формат поставки: ${payload.deliveryFormat}` : "",
    payload.targetDate ? `Желаемый срок: ${payload.targetDate}` : "",
    payload.packagingNeeds ? `Фасовка / формат: ${payload.packagingNeeds}` : "",
    payload.inn ? `ИНН: ${payload.inn}` : "",
    payload.comment ? `Комментарий: ${payload.comment}` : "",
  ]
    .filter(Boolean)
    .join("\n");
};

export const validateLeadRequest = (payload) => {
  const fieldErrors = {};
  const formErrors = [];

  const addFieldError = (name, message) => {
    if (!fieldErrors[name]) fieldErrors[name] = message;
  };

  const allowedRequestTypes = new Set(leadRequestTypes.map((item) => item.value));
  const allowedBusinessTypes = new Set(leadBusinessTypes);
  const allowedContacts = new Set(leadPreferredContactMethods);
  const allowedVolumes = new Set(leadEstimatedVolumeOptions);
  const allowedFrequencies = new Set(["", ...leadPurchaseFrequencyOptions]);
  const allowedDeliveryFormats = new Set(["", ...leadDeliveryFormatOptions]);
  const allowedPackaging = new Set(["", ...leadPackagingNeedsOptions]);

  if (!allowedRequestTypes.has(payload.requestType)) {
    addFieldError("request_type", "Выберите тип запроса.");
  }

  if (!payload.companyName) addFieldError("company_name", "Укажите компанию или бренд.");
  if (!payload.contactName) addFieldError("contact_name", "Укажите контактное лицо.");

  if (!allowedContacts.has(payload.preferredContactMethod)) {
    addFieldError("preferred_contact_method", "Выберите удобный способ связи.");
  }

  const hasAnyContact = Boolean(payload.phone || payload.email || payload.telegramUsername);
  if (!hasAnyContact) {
    formErrors.push("Нужен хотя бы один рабочий канал связи.");
    addFieldError("preferred_contact_method", "Добавьте телефон, email или Telegram.");
  }

  if (payload.preferredContactMethod === "Телефон" && !payload.phone) {
    addFieldError("phone", "Укажите телефон для связи.");
  }
  if (payload.preferredContactMethod === "Email" && !payload.email) {
    addFieldError("email", "Укажите email для связи.");
  }
  if (payload.preferredContactMethod === "Telegram" && !payload.telegramUsername) {
    addFieldError("telegram_username", "Укажите Telegram username.");
  }

  if (payload.phone && payload.phone.replace(/\D/g, "").length < 11) {
    addFieldError("phone", "Проверьте формат телефона.");
  }

  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    addFieldError("email", "Проверьте email.");
  }

  if (payload.telegramUsername && !/^@[A-Za-z0-9_]{5,}$/.test(payload.telegramUsername)) {
    addFieldError("telegram_username", "Укажите Telegram username в формате @username.");
  }

  if (!allowedBusinessTypes.has(payload.businessType)) {
    addFieldError("business_type", "Выберите тип бизнеса.");
  }

  if (!payload.productInterest.length) {
    addFieldError("product_interest", "Выберите товар или консультацию по ассортименту.");
  }

  if (!allowedVolumes.has(payload.estimatedVolume)) {
    addFieldError("estimated_volume", "Выберите ориентир по объёму.");
  }

  if (!payload.city) addFieldError("city", "Укажите город или регион поставки.");

  if (payload.purchaseFrequency && !allowedFrequencies.has(payload.purchaseFrequency)) {
    addFieldError("purchase_frequency", "Выберите корректную частоту.");
  }

  if (payload.deliveryFormat && !allowedDeliveryFormats.has(payload.deliveryFormat)) {
    addFieldError("delivery_format", "Выберите корректный формат поставки.");
  }

  if (payload.packagingNeeds && !allowedPackaging.has(payload.packagingNeeds)) {
    addFieldError("packaging_needs", "Выберите корректный вариант фасовки.");
  }

  if (payload.inn && !/^\d{10}(\d{2})?$/.test(payload.inn)) {
    addFieldError("inn", "Проверьте ИНН.");
  }

  if (payload.exactVolumeKg !== null && payload.exactVolumeKg <= 0) {
    addFieldError("exact_volume_kg", "Укажите объём больше нуля.");
  }

  if (leadQuoteDrivenRequestTypes.has(payload.requestType) && !payload.email) {
    addFieldError("email", "Для коммерческого предложения укажите email.");
  }

  if (leadFrequencyDrivenRequestTypes.has(payload.requestType) && !payload.purchaseFrequency) {
    addFieldError("purchase_frequency", "Для регулярных поставок укажите частоту.");
  }

  if (leadCommentDrivenRequestTypes.has(payload.requestType) && !payload.comment) {
    addFieldError("comment", "Коротко опишите задачу.");
  }

  if (payload.needCommercialOffer && payload.email === "" && payload.phone === "" && payload.telegramUsername === "") {
    addFieldError("preferred_contact_method", "Нужен хотя бы один контакт для коммерческого предложения.");
  }

  if (!payload.consent) {
    addFieldError("consent", "Подтвердите согласие на обработку данных.");
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
