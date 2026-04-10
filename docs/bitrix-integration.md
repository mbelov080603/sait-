# Global Basket: Bitrix and Forms Integration

## What Changed

- `/api/b2b-request` is the primary endpoint for corporate and wholesale requests.
- `/api/contact-request` handles retail questions, support requests and complaints.
- B2B requests try Bitrix first and fall back to Telegram only if Bitrix fails and a fallback channel is configured.
- Contact/support requests route to dedicated Telegram chats when configured, otherwise they succeed in mock mode.

## Modes

- `BITRIX_MODE=live`
  Uses `BITRIX_WEBHOOK_URL` and sends a real `crm.lead.add` request.
- `BITRIX_MODE=mock`
  Returns a successful response without calling Bitrix. Use this for local work and preview deployments.
- `BITRIX_MODE=disabled`
  Disables Bitrix delivery. B2B requests then rely on Telegram fallback if configured.

If `BITRIX_MODE` is not set, the API uses `live` when `BITRIX_WEBHOOK_URL` exists and `mock` otherwise.

## Required Env Vars

### Bitrix

- `BITRIX_MODE`
- `BITRIX_WEBHOOK_URL`
- `BITRIX_LEAD_SOURCE`
- `BITRIX_CATEGORY_ID`
- `BITRIX_STAGE_ID`
- `BITRIX_ASSIGNED_BY_ID`
- `BITRIX_TITLE_PREFIX`
- `BITRIX_FIELD_MAP_JSON`

### Telegram Fallback

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_SUPPORT_CHAT_ID`
- `TELEGRAM_LEADS_CHAT_ID`
- `TELEGRAM_COMPLAINT_CHAT_ID`
- `TELEGRAM_ADMIN_CHAT_ID`

## Routing Rules

- `b2b-request`
  - Primary route: Bitrix
  - Fallback route: `TELEGRAM_LEADS_CHAT_ID`
- `contact-request`
  - `support` route: `TELEGRAM_SUPPORT_CHAT_ID`
  - `complaint` route: `TELEGRAM_COMPLAINT_CHAT_ID`
  - Legacy fallback: `TELEGRAM_ADMIN_CHAT_ID`

## Payload Shape

### B2B

```json
{
  "formType": "b2b",
  "intent": "wholesale",
  "contact": {
    "companyName": "Example LLC",
    "contactName": "Иван",
    "phone": "+7 900 000 00 00",
    "email": "sales@example.com",
    "city": "Москва",
    "businessType": "Розничный магазин",
    "preferredContact": "Телефон"
  },
  "request": {
    "productInterest": "Очищенная макадамия 250 г",
    "estimatedVolume": "Регулярные поставки",
    "frequency": "Ежемесячно",
    "comment": "Нужен B2B-контакт"
  },
  "consent": {
    "accepted": true,
    "acceptedAt": "2026-04-10T10:00:00.000Z"
  },
  "context": {
    "source": "wholesale",
    "pageType": "b2b",
    "pageSlug": "b2b",
    "pageUrl": "https://example.com/b2b/",
    "referrer": "",
    "productId": "macadamia",
    "productName": "Очищенная макадамия 250 г",
    "categoryId": "premium-nuts",
    "sessionId": "gb-abc123",
    "timestamp": "2026-04-10T10:00:00.000Z"
  },
  "attribution": {
    "utmSource": "google",
    "utmMedium": "cpc",
    "utmCampaign": "brand",
    "utmContent": "",
    "utmTerm": "",
    "firstUtmSource": "google",
    "firstUtmMedium": "cpc",
    "firstUtmCampaign": "brand"
  }
}
```

### Contact / Support

```json
{
  "formType": "contact",
  "intent": "support",
  "contact": {
    "contactName": "Иван",
    "phone": "+7 900 000 00 00",
    "email": "hello@example.com",
    "preferredContact": "Telegram"
  },
  "request": {
    "topic": "Поддержка",
    "comment": "Есть вопрос по товару"
  },
  "consent": {
    "accepted": true,
    "acceptedAt": "2026-04-10T10:00:00.000Z"
  },
  "context": {
    "source": "pdp",
    "pageType": "contacts",
    "pageSlug": "contacts",
    "pageUrl": "https://example.com/contacts/?source=pdp",
    "referrer": "",
    "productId": "",
    "productName": "",
    "categoryId": "",
    "sessionId": "gb-abc123",
    "timestamp": "2026-04-10T10:00:00.000Z"
  },
  "attribution": {
    "utmSource": "",
    "utmMedium": "",
    "utmCampaign": "",
    "utmContent": "",
    "utmTerm": "",
    "firstUtmSource": "",
    "firstUtmMedium": "",
    "firstUtmCampaign": ""
  }
}
```

## Bitrix Field Mapping

By default the API sends only standard lead fields and puts extra information into `COMMENTS`.

If you need custom fields, use `BITRIX_FIELD_MAP_JSON`.

Example:

```json
{
  "UF_CRM_GB_SOURCE": "context.source",
  "UF_CRM_GB_PRODUCT": "request.productInterest",
  "UF_CRM_GB_VOLUME": "request.estimatedVolume"
}
```

## Rollout Plan

1. Keep `BITRIX_MODE=mock` in preview and local environments.
2. Set up the real Bitrix webhook and fill `BITRIX_WEBHOOK_URL`.
3. Add dedicated Telegram chat IDs for support, leads and complaints.
4. Switch production to `BITRIX_MODE=live`.
5. If custom CRM fields are needed, populate `BITRIX_FIELD_MAP_JSON`.
