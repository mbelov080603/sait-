const { applyFieldMap } = require("./forms");

const compact = (value = "") => String(value || "").trim();
const requestTypeLabels = {
  wholesale_purchase: "Оптовая закупка",
  regular_supply: "Регулярные поставки",
  commercial_offer: "Запрос условий / КП",
  partnership: "Обсудить сотрудничество",
  other: "Другое",
};

const parseJsonEnv = (name, fallback = {}) => {
  const raw = compact(process.env[name]);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const getMode = () => {
  const explicit = compact(process.env.BITRIX_MODE).toLowerCase();
  if (explicit === "live") return "lead";
  if (explicit) return explicit;
  return compact(process.env.BITRIX_WEBHOOK_URL) ? "lead" : "mock";
};

const normalizeBitrixConfig = () => ({
  mode: getMode(),
  webhookUrl: compact(process.env.BITRIX_WEBHOOK_URL),
  timeoutMs: Number(process.env.BITRIX_TIMEOUT_MS) || 15000,
  entityTypeId: Number(process.env.BITRIX_ENTITY_TYPE_ID || process.env.BITRIX_ITEM_ENTITY_TYPE_ID) || null,
  assignedById: Number(process.env.BITRIX_ASSIGNED_BY_ID) || null,
  categoryId: Number(process.env.BITRIX_CATEGORY_ID) || null,
  stageId: compact(process.env.BITRIX_STAGE_ID),
  leadSource: compact(process.env.BITRIX_LEAD_SOURCE) || "WEB",
  titlePrefix: compact(process.env.BITRIX_TITLE_PREFIX) || "[Site][B2B]",
  fieldMaps: {
    lead:
      parseJsonEnv("BITRIX_LEAD_FIELD_MAP_JSON", null) ||
      parseJsonEnv("BITRIX_FIELD_MAP_JSON", {}),
    item:
      parseJsonEnv("BITRIX_ITEM_FIELD_MAP_JSON", null) ||
      parseJsonEnv("BITRIX_FIELD_MAP_JSON", {}),
  },
});

const humanizeProductInterest = (values = [], context = {}) =>
  values.map((item) => {
    if (item === "consultation_catalog") return "Нужна консультация по ассортименту";
    if (item.startsWith("product:")) {
      const productId = item.slice("product:".length);
      if (context.productId === productId && context.productName) return context.productName;
      return productId.replaceAll("-", " ");
    }
    return item;
  });

const buildLeadDescription = (payload) => {
  const interest = humanizeProductInterest(payload.productInterest || [], payload.context || {}).join(", ");
  return [
    `Request ID: ${payload.requestId}`,
    payload.requestType
      ? `Тип запроса: ${requestTypeLabels[payload.requestType] || payload.requestType}`
      : "",
    payload.businessType ? `Тип бизнеса: ${payload.businessType}` : "",
    payload.companyName ? `Компания: ${payload.companyName}` : "",
    payload.contactName ? `Контакт: ${payload.contactName}` : "",
    payload.preferredContactMethod
      ? `Предпочтительный канал: ${payload.preferredContactMethod}`
      : "",
    payload.phone ? `Телефон: ${payload.phone}` : "",
    payload.email ? `Email: ${payload.email}` : "",
    payload.telegramUsername ? `Telegram: ${payload.telegramUsername}` : "",
    payload.inn ? `ИНН: ${payload.inn}` : "",
    interest ? `Интерес к продукту: ${interest}` : "",
    payload.estimatedVolume ? `Оценка объёма: ${payload.estimatedVolume}` : "",
    payload.exactVolumeKg ? `Точный объём: ${payload.exactVolumeKg} кг` : "",
    payload.purchaseFrequency ? `Частота: ${payload.purchaseFrequency}` : "",
    payload.city ? `Город / регион: ${payload.city}` : "",
    payload.deliveryFormat ? `Формат поставки: ${payload.deliveryFormat}` : "",
    payload.targetDate ? `Желаемый срок: ${payload.targetDate}` : "",
    payload.packagingNeeds ? `Фасовка / формат: ${payload.packagingNeeds}` : "",
    payload.needCommercialOffer ? `Коммерческое предложение: да` : "",
    payload.fullAddress ? `Адрес: ${payload.fullAddress}` : "",
    payload.comment ? `Комментарий:\n${payload.comment}` : "",
    "",
    payload.context?.sourceParam ? `Source: ${payload.context.sourceParam}` : "",
    payload.context?.pageType ? `Page type: ${payload.context.pageType}` : "",
    payload.context?.formVariant ? `Form variant: ${payload.context.formVariant}` : "",
    payload.context?.pageUrl ? `Page URL: ${payload.context.pageUrl}` : "",
    payload.context?.pageTitle ? `Page title: ${payload.context.pageTitle}` : "",
    payload.context?.referrer ? `Referrer: ${payload.context.referrer}` : "",
    payload.context?.productId ? `Product ID: ${payload.context.productId}` : "",
    payload.context?.productSlug ? `Product slug: ${payload.context.productSlug}` : "",
    payload.context?.productName ? `Product: ${payload.context.productName}` : "",
    payload.context?.categoryContext ? `Category: ${payload.context.categoryContext}` : "",
    payload.context?.locale ? `Locale: ${payload.context.locale}` : "",
    payload.context?.timezone ? `Timezone: ${payload.context.timezone}` : "",
    payload.attribution?.utmSource ? `UTM source: ${payload.attribution.utmSource}` : "",
    payload.attribution?.utmMedium ? `UTM medium: ${payload.attribution.utmMedium}` : "",
    payload.attribution?.utmCampaign ? `UTM campaign: ${payload.attribution.utmCampaign}` : "",
    payload.attribution?.utmContent ? `UTM content: ${payload.attribution.utmContent}` : "",
    payload.attribution?.utmTerm ? `UTM term: ${payload.attribution.utmTerm}` : "",
    payload.attribution?.firstUtmSource
      ? `First UTM source: ${payload.attribution.firstUtmSource}`
      : "",
    payload.attribution?.firstUtmMedium
      ? `First UTM medium: ${payload.attribution.firstUtmMedium}`
      : "",
    payload.attribution?.firstUtmCampaign
      ? `First UTM campaign: ${payload.attribution.firstUtmCampaign}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
};

const buildMappingPayload = (payload, config) => ({
  ...payload,
  crm: {
    title: `${config.titlePrefix} ${requestTypeLabels[payload.requestType] || payload.requestType || "B2B запрос"} — ${
      payload.companyName || payload.contactName || "без названия"
    }`,
    description: buildLeadDescription(payload),
    productInterestText: humanizeProductInterest(payload.productInterest || [], payload.context || {}).join(", "),
  },
});

const cleanFields = (fields = {}) => {
  const output = { ...fields };
  Object.keys(output).forEach((key) => {
    const value = output[key];
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0) ||
      Number.isNaN(value)
    ) {
      delete output[key];
    }
  });
  return output;
};

const mapLeadRequestToBitrix = (payload, config = normalizeBitrixConfig()) => {
  const mappedPayload = buildMappingPayload(payload, config);

  if (config.mode === "item") {
    if (!config.entityTypeId) {
      throw new Error("Для режима BITRIX_MODE=item нужен BITRIX_ENTITY_TYPE_ID.");
    }

    const fields = cleanFields({
      title: mappedPayload.crm.title,
      assignedById: config.assignedById || undefined,
      categoryId: config.categoryId || undefined,
      stageId: config.stageId || undefined,
      ...applyFieldMap(mappedPayload, config.fieldMaps.item),
    });

    return {
      method: "crm.item.add",
      body: {
        entityTypeId: config.entityTypeId,
        fields,
      },
    };
  }

  const fields = cleanFields({
    TITLE: mappedPayload.crm.title,
    NAME: payload.contactName || "",
    COMPANY_TITLE: payload.companyName || "",
    PHONE: payload.phone ? [{ VALUE: payload.phone, VALUE_TYPE: "WORK" }] : undefined,
    EMAIL: payload.email ? [{ VALUE: payload.email, VALUE_TYPE: "WORK" }] : undefined,
    COMMENTS: mappedPayload.crm.description,
    SOURCE_ID: config.leadSource,
    SOURCE_DESCRIPTION: payload.context?.sourceParam || payload.context?.pageUrl || "",
    OPENED: "Y",
    ADDRESS_CITY: payload.city || "",
    ASSIGNED_BY_ID: config.assignedById || undefined,
    CATEGORY_ID: config.categoryId || undefined,
    STATUS_ID: config.stageId || undefined,
    ...applyFieldMap(mappedPayload, config.fieldMaps.lead),
  });

  return {
    method: "crm.lead.add",
    body: {
      fields,
      params: {
        REGISTER_SONET_EVENT: "N",
      },
    },
  };
};

const buildWebhookEndpoint = (baseUrl, method) => {
  const safeBase = compact(baseUrl).replace(/\/+$/, "");
  if (!safeBase) return "";
  if (/\.json$/i.test(safeBase)) return safeBase;
  return `${safeBase}/${method}.json`;
};

const submitLeadRequestToBitrix = async (mappedRequest, config = normalizeBitrixConfig()) => {
  if (config.mode === "mock") {
    return {
      ok: true,
      deliveryMode: "mock",
      crmId: null,
      requestPayload: mappedRequest,
    };
  }

  if (config.mode === "disabled") {
    throw new Error("Bitrix-интеграция отключена.");
  }

  if (!config.webhookUrl) {
    throw new Error("Не настроен BITRIX_WEBHOOK_URL.");
  }

  const endpoint = buildWebhookEndpoint(config.webhookUrl, mappedRequest.method);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(mappedRequest.body),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.error) {
      const error = new Error(data.error_description || data.error || "Bitrix не принял заявку.");
      error.code = "bitrix_rejected";
      throw error;
    }

    const crmId =
      data.result?.item?.id || data.result?.id || data.result?.ID || data.result || null;

    return {
      ok: true,
      deliveryMode: config.mode === "item" ? "bitrix_item" : "bitrix_lead",
      crmId,
      requestPayload: mappedRequest,
    };
  } finally {
    clearTimeout(timeoutId);
  }
};

const sendToBitrix = async (payload) => {
  const config = normalizeBitrixConfig();
  const mappedRequest = mapLeadRequestToBitrix(payload, config);
  return submitLeadRequestToBitrix(mappedRequest, config);
};

module.exports = {
  mapLeadRequestToBitrix,
  normalizeBitrixConfig,
  submitLeadRequestToBitrix,
  sendToBitrix,
};
