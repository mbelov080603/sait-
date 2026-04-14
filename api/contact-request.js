const { callTelegram, escapeHtml } = require("./_lib/telegram");
const { resolveDistanceFromMoscow } = require("./_lib/geocode");

let localRuntimeConfig = {};
try {
  localRuntimeConfig = require("./_lib/runtime-telegram-local");
} catch {
  localRuntimeConfig = {};
}

const MAX_MESSAGE_LENGTH = 3900;
const CONTACT_BASE_PRICE_PER_KG = 700;

const json = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
};

const parseJsonBody = (req) => {
  if (!req.body) return {};
  if (Buffer.isBuffer(req.body)) {
    try {
      return JSON.parse(req.body.toString("utf8"));
    } catch {
      return {};
    }
  }
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
};

const normalizePositiveNumber = (value) => {
  const parsed = Number.parseFloat(String(value ?? "").replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
};

const getDiscountRate = (quantityKg) => {
  if (quantityKg >= 1000) return 0.2;
  if (quantityKg >= 500) return 0.15;
  if (quantityKg >= 100) return 0.1;
  return 0;
};

const getDistanceBlocks = (distanceKm) => Math.floor(normalizePositiveNumber(distanceKm) / 1000);

const calculateContactQuote = ({
  quantityKg,
  distanceKm,
  basePricePerKg = CONTACT_BASE_PRICE_PER_KG,
}) => {
  const normalizedQuantity = normalizePositiveNumber(quantityKg);
  const normalizedDistance = normalizePositiveNumber(distanceKm);
  const discountRate = getDiscountRate(normalizedQuantity);
  const distanceBlocks1000 = getDistanceBlocks(normalizedDistance);
  const distanceMarkupRate = distanceBlocks1000 * 0.05;
  const subtotalBase = normalizedQuantity * basePricePerKg;
  const subtotalAfterDiscount = subtotalBase * (1 - discountRate);
  const totalEstimate = subtotalAfterDiscount * (1 + distanceMarkupRate);
  const estimatedPricePerKg = normalizedQuantity ? totalEstimate / normalizedQuantity : 0;

  return {
    quantityKg: normalizedQuantity,
    distanceKm: normalizedDistance,
    basePricePerKg,
    discountRate,
    distanceBlocks1000,
    distanceMarkupRate,
    subtotalBase,
    subtotalAfterDiscount,
    totalEstimate,
    estimatedPricePerKg,
  };
};

const resolvePreferredContactKey = (value = "") => {
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "email") return "email";
  if (normalized === "telegram") return "telegram";
  return "phone";
};

const formatRub = (value = 0) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));

const getRequestId = () => {
  const stamp = new Date().toISOString().replaceAll(/[-:TZ.]/g, "").slice(2, 12);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GB-SITE-${stamp}-${suffix}`;
};

const getWebhookRouteConfig = async (token) => {
  const info = await callTelegram(token, "getWebhookInfo");
  if (!info?.url) return {};

  try {
    const url = new URL(info.url);
    return {
      ownerUserId:
        url.searchParams.get("ownerUserId") ||
        url.searchParams.get("adminChatId") ||
        "",
      complaintsChatId:
        url.searchParams.get("complaintsChatId") ||
        url.searchParams.get("adminChatId") ||
        "",
    };
  } catch {
    return {};
  }
};

const getBotToken = () => process.env.TELEGRAM_BOT_TOKEN || localRuntimeConfig.botToken || "";

const validatePayload = (payload = {}) => {
  const errors = [];
  const lead = payload.lead || {};
  const company = payload.company || {};
  const delivery = payload.delivery || {};
  const order = payload.order || {};

  const preferredContact = resolvePreferredContactKey(lead.preferredContact);
  const hasPhone = Boolean(String(lead.phone || "").trim());
  const hasEmail = Boolean(String(lead.email || "").trim());
  const hasTelegram = Boolean(String(lead.telegramUsername || "").trim());

  if (!lead.name) errors.push("Укажите имя");
  if (!lead.consent) errors.push("Нужно согласие на обработку данных");
  if (!hasPhone && !hasEmail && !hasTelegram) {
    errors.push("Укажите хотя бы один контактный канал");
  }

  if (preferredContact === "email" && !hasEmail) {
    errors.push("Укажите email");
  }

  if (preferredContact === "telegram" && !hasTelegram) {
    errors.push("Укажите Telegram username");
  }

  if (preferredContact === "phone" && !hasPhone) {
    errors.push("Укажите телефон");
  }

  const isQuoteRequest =
    payload.context?.page === "contacts" ||
    Number.isFinite(order.quantityKg) ||
    Boolean(company.name) ||
    Boolean(delivery.address);

  if (isQuoteRequest) {
    if (!company.name) errors.push("Укажите юридическое лицо или ИП");
    if (!order.quantityKg) errors.push("Укажите объём закупки в килограммах");
    if (!delivery.address) errors.push("Укажите адрес доставки");
  }

  return errors;
};

const line = (label, value) =>
  value === null || value === undefined || value === ""
    ? ""
    : `<b>${escapeHtml(label)}:</b> ${escapeHtml(value)}`;

const formatTargets = (targets = []) => (Array.isArray(targets) ? targets.join(", ") : "");

const getBitrixLeadWebhook = () =>
  process.env.BITRIX_LEAD_WEBHOOK || localRuntimeConfig.bitrixLeadWebhook || "";

const buildBitrixWebhookRequest = (payload, requestId) => {
  const lead = payload.integration?.bitrixLead || {};
  const fields = {
    ...(lead.fields || {}),
    TITLE: lead.fields?.TITLE || lead.title || `Заявка Global Basket: ${requestId}`,
    COMMENTS: [lead.fields?.COMMENTS, `Request ID: ${requestId}`].filter(Boolean).join("\n"),
  };

  return /crm\.lead\.add/i.test(getBitrixLeadWebhook())
    ? {
        fields,
        params: {
          REGISTER_SONET_EVENT: "Y",
        },
      }
    : {
        ...lead,
        requestId,
        fields,
      };
};

const sendBitrixLead = async (payload, requestId) => {
  const webhook = getBitrixLeadWebhook();
  if (!webhook) {
    return {
      ok: false,
      configured: false,
      skipped: true,
    };
  }

  const requestBody = buildBitrixWebhookRequest(payload, requestId);
  const response = await fetch(webhook, {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
      accept: "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const responseText = await response.text();
  let parsedBody = {};
  try {
    parsedBody = responseText ? JSON.parse(responseText) : {};
  } catch {
    parsedBody = {
      raw: responseText.slice(0, 400),
    };
  }

  if (!response.ok) {
    throw new Error(`Bitrix webhook returned ${response.status}`);
  }

  return {
    ok: true,
    configured: true,
    forwarded: true,
    status: response.status,
    body: parsedBody,
  };
};

const buildTelegramMessage = (payload, requestId) => {
  const lead = payload.lead || {};
  const company = payload.company || {};
  const context = payload.context || {};
  const product = payload.product || {};
  const order = payload.order || {};
  const delivery = payload.delivery || {};
  const pricing = payload.pricing || {};
  const utm = payload.utm || {};
  const integration = payload.integration || {};
  const account = payload.account || {};

  const lines = [
    "<b>Новая заявка с сайта Global Basket</b>",
    line("Номер обращения", requestId),
    line("Источник", context.source || "site"),
    line("Страница", context.page || "site"),
    "",
    "<b>Контакт</b>",
    line("Имя", lead.name),
    line("Телефон", lead.phone),
    line("Email", lead.email),
    line("Telegram", lead.telegramUsername),
    line("Предпочтительный канал", lead.preferredContact),
    "",
    "<b>Компания и запрос</b>",
    line("Юридическое лицо / ИП", company.name),
    line("ИНН", company.inn),
    line("Формат закупки", company.purchaseFormat),
    line("Тема", lead.topic || order.topic),
    line(
      "Объём",
      Number.isFinite(order.quantityKg) && order.quantityKg > 0 ? `${order.quantityKg} кг` : "",
    ),
    "",
    "<b>Доставка</b>",
    line("Адрес", delivery.address),
    line(
      "Расстояние от Москвы",
      Number.isFinite(delivery.distanceKm) && delivery.distanceKm > 0
        ? `${delivery.distanceKm} км`
        : Number.isFinite(delivery.distanceKm)
          ? "0 км"
          : "",
    ),
    line(
      "Полные блоки по 1000 км",
      Number.isFinite(delivery.distanceBlocks1000) ? String(delivery.distanceBlocks1000) : "",
    ),
    "",
    "<b>Предварительный расчёт</b>",
    line(
      "Базовая цена",
      pricing.basePricePerKg ? `${formatRub(pricing.basePricePerKg)} / кг` : "",
    ),
    line("Скидка", pricing.discountTier),
    line(
      "Надбавка за расстояние",
      Number.isFinite(pricing.distanceMarkupRate) && pricing.distanceMarkupRate > 0
        ? `+${Math.round(pricing.distanceMarkupRate * 100)}%`
        : Number.isFinite(pricing.distanceMarkupRate)
          ? "+0%"
          : "",
    ),
    line(
      "Цена за кг после расчёта",
      pricing.estimatedPricePerKg ? `${formatRub(pricing.estimatedPricePerKg)} / кг` : "",
    ),
    line("Предварительная сумма", pricing.totalEstimate ? formatRub(pricing.totalEstimate) : ""),
    "",
    "<b>Товар и контекст</b>",
    line("Товар", product.name),
    line("Категория", product.category),
    line("Вариант", product.variant),
    line("Landing URL", context.landingUrl),
    line("Referrer", context.referrer),
    line("Session ID", context.sessionId),
    line("Payload version", integration.payloadVersion),
    line("Integration targets", formatTargets(integration.targets)),
    line("UTM source", utm.source),
    line("UTM medium", utm.medium),
    line("UTM campaign", utm.campaign),
    line("UTM content", utm.content),
    line("UTM term", utm.term),
    "",
    "<b>Аккаунт и предпочтения</b>",
    line("Профиль", account.profileId),
    line("Предпочтительный канал", account.preferredContact),
    line("Режим хранения", account.storageMode),
    line(
      "Корзина",
      Array.isArray(account.cartItems) && account.cartItems.length
        ? account.cartItems
            .map((item) => `${item.shortName} x ${Math.max(1, Number(item.quantity) || 1)}`)
            .join(", ")
        : "",
    ),
    line(
      "Избранное",
      Array.isArray(account.favoriteItems) && account.favoriteItems.length
        ? account.favoriteItems.map((item) => item.shortName).join(", ")
        : "",
    ),
    line(
      "Интересующие разделы",
      Array.isArray(account.interestLabels) && account.interestLabels.length
        ? account.interestLabels.join(", ")
        : "",
    ),
    "",
    "<b>Комментарий</b>",
    escapeHtml(lead.message || "—"),
  ].filter(Boolean);

  const text = lines.join("\n");
  return text.length > MAX_MESSAGE_LENGTH ? `${text.slice(0, MAX_MESSAGE_LENGTH - 1)}…` : text;
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return json(res, 405, { ok: false, error: "Method not allowed" });
  }

  try {
    const payload = parseJsonBody(req);
    const delivery = payload.delivery || {};
    const order = payload.order || {};
    const pricing = payload.pricing || {};
    const integration = payload.integration || {};

    if (delivery.address) {
      try {
        const resolvedDistance = await resolveDistanceFromMoscow(delivery.address);
        if (resolvedDistance && Number.isFinite(resolvedDistance.distanceKm)) {
          delivery.distanceKm = resolvedDistance.distanceKm;
          delivery.distanceBlocks1000 = getDistanceBlocks(resolvedDistance.distanceKm);
          delivery.resolvedAddress = resolvedDistance.displayName;

          const recalculatedQuote = calculateContactQuote({
            quantityKg: order.quantityKg,
            distanceKm: resolvedDistance.distanceKm,
            basePricePerKg: pricing.basePricePerKg || CONTACT_BASE_PRICE_PER_KG,
          });

          payload.pricing = {
            ...pricing,
            basePricePerKg: recalculatedQuote.basePricePerKg,
            discountRate: recalculatedQuote.discountRate,
            discountTier: `${Math.round(recalculatedQuote.discountRate * 100)}%`,
            distanceMarkupRate: recalculatedQuote.distanceMarkupRate,
            subtotalBase: recalculatedQuote.subtotalBase,
            subtotalAfterDiscount: recalculatedQuote.subtotalAfterDiscount,
            totalEstimate: recalculatedQuote.totalEstimate,
            estimatedPricePerKg: recalculatedQuote.estimatedPricePerKg,
            currency: pricing.currency || "RUB",
            isEstimate: true,
          };
        }
      } catch (error) {
        console.error("contact-request distance resolve failed", error);
      }
    }

    const errors = validatePayload(payload);

    if (errors.length) {
      return json(res, 400, {
        ok: false,
        error: "validation_error",
        message: errors.join(". "),
      });
    }

    const token = getBotToken();
    const complaintsChatId =
      process.env.TELEGRAM_COMPLAINT_CHAT_ID ||
      (await getWebhookRouteConfig(token)).complaintsChatId;

    if (!token || !complaintsChatId) {
      return json(res, 500, {
        ok: false,
        error: "telegram_route_missing",
        message: "Telegram-маршрут для заявок не настроен.",
      });
    }

    const requestId = getRequestId();
    const text = buildTelegramMessage(payload, requestId);

    await callTelegram(token, "sendMessage", {
      chat_id: complaintsChatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });

    let bitrix = {
      ok: false,
      configured: false,
      skipped: true,
    };

    try {
      bitrix = await sendBitrixLead(payload, requestId);
    } catch (bitrixError) {
      console.error("contact-request bitrix forward failed", bitrixError);
      bitrix = {
        ok: false,
        configured: Boolean(getBitrixLeadWebhook()),
        skipped: false,
        message: bitrixError.message,
      };
    }

    return json(res, 200, {
      ok: true,
      requestId,
      routedTo: complaintsChatId,
      bitrixLead: integration.bitrixLead || null,
      bitrix,
    });
  } catch (error) {
    console.error("contact-request error", error);
    return json(res, 500, {
      ok: false,
      error: "request_send_failed",
      message: "Не удалось отправить заявку в Telegram.",
    });
  }
};
