const { applyFieldMap } = require("./forms");

const getMode = () => {
  if (process.env.BITRIX_MODE) return process.env.BITRIX_MODE;
  return process.env.BITRIX_WEBHOOK_URL ? "live" : "mock";
};

const parseFieldMap = () => {
  try {
    return JSON.parse(process.env.BITRIX_FIELD_MAP_JSON || "{}");
  } catch {
    return {};
  }
};

const compact = (value) => String(value || "").trim();

const buildComments = (payload) => {
  const lines = [
    `Request ID: ${payload.requestId}`,
    `Form type: ${payload.formType}`,
    `Intent: ${payload.intent}`,
    payload.contact.companyName ? `Company: ${payload.contact.companyName}` : "",
    payload.contact.contactName ? `Contact: ${payload.contact.contactName}` : "",
    payload.contact.phone ? `Phone: ${payload.contact.phone}` : "",
    payload.contact.email ? `Email: ${payload.contact.email}` : "",
    payload.contact.city ? `City: ${payload.contact.city}` : "",
    payload.contact.businessType ? `Business type: ${payload.contact.businessType}` : "",
    payload.request.productInterest ? `Product interest: ${payload.request.productInterest}` : "",
    payload.request.estimatedVolume ? `Estimated volume: ${payload.request.estimatedVolume}` : "",
    payload.request.frequency ? `Frequency: ${payload.request.frequency}` : "",
    payload.context.source ? `Source: ${payload.context.source}` : "",
    payload.context.pageType ? `Page type: ${payload.context.pageType}` : "",
    payload.context.pageUrl ? `Page URL: ${payload.context.pageUrl}` : "",
    payload.context.referrer ? `Referrer: ${payload.context.referrer}` : "",
    payload.attribution.utmSource ? `UTM source: ${payload.attribution.utmSource}` : "",
    payload.attribution.utmMedium ? `UTM medium: ${payload.attribution.utmMedium}` : "",
    payload.attribution.utmCampaign ? `UTM campaign: ${payload.attribution.utmCampaign}` : "",
    payload.request.comment ? `Comment:\n${payload.request.comment}` : "",
  ].filter(Boolean);

  return lines.join("\n");
};

const buildBitrixLead = (payload) => {
  const prefix = compact(process.env.BITRIX_TITLE_PREFIX) || "Global Basket";
  const fields = {
    TITLE: `${prefix}: ${payload.contact.companyName || payload.request.topic || payload.intent || payload.formType}`,
    NAME: payload.contact.contactName || "",
    COMPANY_TITLE: payload.contact.companyName || "",
    PHONE: payload.contact.phone
      ? [{ VALUE: payload.contact.phone, VALUE_TYPE: "WORK" }]
      : undefined,
    EMAIL: payload.contact.email
      ? [{ VALUE: payload.contact.email, VALUE_TYPE: "WORK" }]
      : undefined,
    COMMENTS: buildComments(payload),
    SOURCE_ID: compact(process.env.BITRIX_LEAD_SOURCE) || "WEB",
    SOURCE_DESCRIPTION: payload.context.source || payload.context.pageUrl || "",
    OPENED: "Y",
    ADDRESS_CITY: payload.contact.city || "",
  };

  const assignedById = compact(process.env.BITRIX_ASSIGNED_BY_ID);
  const categoryId = compact(process.env.BITRIX_CATEGORY_ID);
  const stageId = compact(process.env.BITRIX_STAGE_ID);

  if (assignedById) fields.ASSIGNED_BY_ID = Number(assignedById);
  if (categoryId) fields.CATEGORY_ID = Number(categoryId);
  if (stageId) fields.STATUS_ID = stageId;

  const mappedFields = applyFieldMap(payload, parseFieldMap());
  Object.assign(fields, mappedFields);

  Object.keys(fields).forEach((key) => {
    if (fields[key] === undefined || fields[key] === "" || Number.isNaN(fields[key])) {
      delete fields[key];
    }
  });

  return {
    fields,
    params: {
      REGISTER_SONET_EVENT: "N",
    },
  };
};

const sendToBitrix = async (payload) => {
  const mode = getMode();
  if (mode === "mock") {
    return {
      ok: true,
      deliveryMode: "mock",
      bitrixLeadId: null,
      requestPayload: buildBitrixLead(payload),
    };
  }

  if (mode === "disabled") {
    throw new Error("Bitrix-интеграция отключена.");
  }

  const webhookUrl = compact(process.env.BITRIX_WEBHOOK_URL);
  if (!webhookUrl) {
    throw new Error("Не настроен BITRIX_WEBHOOK_URL.");
  }

  const requestPayload = buildBitrixLead(payload);
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(requestPayload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    throw new Error(data.error_description || data.error || "Bitrix не принял заявку.");
  }

  return {
    ok: true,
    deliveryMode: "bitrix",
    bitrixLeadId: data.result || null,
    requestPayload,
  };
};

module.exports = {
  buildBitrixLead,
  sendToBitrix,
};
