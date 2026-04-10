# Global Basket: B2B lead form and Bitrix integration

## What this flow does

The B2B form is the primary lead capture path for business clients on Global Basket.

It is used on:

- `/b2b/` as the full corporate form
- `/contacts/` as a compact business form
- product pages as a compact product-context form

The form:

1. collects lead qualification data
2. normalizes and validates it on the client and server
3. enriches it with page and attribution context
4. submits it to Bitrix server-side
5. falls back to Telegram only if Bitrix is unavailable and fallback routing is configured

The public HTML does not expose Bitrix webhook URLs or credentials.

## Main files

- `/Users/belo/Desktop/орехи /orehi /scripts/lead-form-shared.mjs`
  Shared field options, normalization helpers and validation rules.
- `/Users/belo/Desktop/орехи /orehi /scripts/build.mjs`
  Static page generator and reusable `renderLeadRequestForm()` renderer.
- `/Users/belo/Desktop/орехи /orehi /scripts/app.js`
  Client-side controller: conditional UX, validation, analytics and submit flow.
- `/Users/belo/Desktop/орехи /orehi /api/_lib/forms.js`
  Server-side normalization and validation entry point.
- `/Users/belo/Desktop/орехи /orehi /api/_lib/form-service.js`
  Rate limit, duplicate guard, delivery orchestration and response shaping.
- `/Users/belo/Desktop/орехи /orehi /api/_lib/bitrix.js`
  Bitrix adapter with `lead` and `item` modes.
- `/Users/belo/Desktop/орехи /orehi /api/b2b-request.js`
  Main endpoint for B2B requests.

## Payload shape

The normalized server payload contains:

- `requestType`
- `businessType`
- `productInterest[]`
- `estimatedVolume`
- `exactVolumeKg`
- `purchaseFrequency`
- `city`
- `deliveryFormat`
- `targetDate`
- `packagingNeeds`
- `needCommercialOffer`
- `fullAddress`
- `comment`
- `companyName`
- `contactName`
- `preferredContactMethod`
- `phone`
- `email`
- `telegramUsername`
- `inn`
- `consent`
- `context`
- `attribution`

## Bitrix modes

### 1. Lead mode

Use when the Bitrix account still works through classic leads.

Set:

- `BITRIX_MODE=lead`
- `BITRIX_WEBHOOK_URL`

The adapter sends `crm.lead.add`.

Built-in lead fields are populated automatically:

- `TITLE`
- `NAME`
- `COMPANY_TITLE`
- `PHONE`
- `EMAIL`
- `COMMENTS`
- `SOURCE_ID`
- `SOURCE_DESCRIPTION`
- `ADDRESS_CITY`
- `ASSIGNED_BY_ID`
- `CATEGORY_ID`
- `STATUS_ID`

### 2. Item mode

Use when the project stores requests in a Smart Process or another CRM item entity.

Set:

- `BITRIX_MODE=item`
- `BITRIX_WEBHOOK_URL`
- `BITRIX_ENTITY_TYPE_ID`

The adapter sends `crm.item.add`.

In item mode the adapter always sets:

- `title`
- `assignedById` when configured
- `categoryId` when configured
- `stageId` when configured

Additional fields are expected to be mapped explicitly through env config.

## Environment variables

Required or commonly used:

- `SITE_URL`
- `BITRIX_MODE`
- `BITRIX_WEBHOOK_URL`
- `BITRIX_LEAD_SOURCE`
- `BITRIX_ENTITY_TYPE_ID`
- `BITRIX_CATEGORY_ID`
- `BITRIX_STAGE_ID`
- `BITRIX_ASSIGNED_BY_ID`
- `BITRIX_TITLE_PREFIX`
- `BITRIX_TIMEOUT_MS`
- `BITRIX_LEAD_FIELD_MAP_JSON`
- `BITRIX_ITEM_FIELD_MAP_JSON`
- `FORM_RATE_LIMIT_WINDOW_MS`
- `FORM_RATE_LIMIT_MAX`
- `FORM_DEDUPE_ENABLED`
- `FORM_DEDUPE_WINDOW_MS`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_LEADS_CHAT_ID`
- `TELEGRAM_ADMIN_CHAT_ID`

## Custom field mapping

Custom site fields should not be hardcoded in JSX or client code.

Map them centrally with JSON env vars:

- `BITRIX_LEAD_FIELD_MAP_JSON`
- `BITRIX_ITEM_FIELD_MAP_JSON`

The value is a JSON object:

```json
{
  "UF_CRM_GB_REQUEST_TYPE": "requestType",
  "UF_CRM_GB_BUSINESS_TYPE": "businessType",
  "UF_CRM_GB_PRODUCTS": "crm.productInterestText",
  "UF_CRM_GB_VOLUME": "estimatedVolume",
  "UF_CRM_GB_CITY": "city",
  "UF_CRM_GB_PREFERRED_CONTACT": "preferredContactMethod",
  "UF_CRM_GB_PAGE_URL": "context.pageUrl",
  "UF_CRM_GB_SOURCE": "context.sourceParam",
  "UF_CRM_GB_UTM_SOURCE": "attribution.utmSource"
}
```

The adapter exposes computed mapping helpers too:

- `crm.title`
- `crm.description`
- `crm.productInterestText`

This makes it possible to map readable summaries into custom Bitrix fields.

## Bitrix fields you may need to create manually

If these custom fields do not exist yet in Bitrix, create them manually before switching from `mock`:

- request type
- business type
- product interest
- estimated volume
- exact volume
- purchase frequency
- city / region
- delivery format
- target date
- packaging needs
- INN
- preferred contact method
- Telegram username
- source / page context
- UTM fields

In `lead` mode most of the lead can still be stored even without custom fields because the readable summary is written to `COMMENTS`.

In `item` mode explicit custom field mapping is strongly recommended.

## Error handling and fallback

Primary sink for B2B forms is Bitrix.

If Bitrix is temporarily unavailable:

- the server logs the failure
- the form tries Telegram fallback through `TELEGRAM_LEADS_CHAT_ID`
- the user receives a human-readable fallback message instead of a raw server error

The public response never exposes webhook URLs, field IDs or CRM credentials.

## Anti-spam and reliability

Implemented:

- honeypot field
- server-side validation
- in-memory rate limit
- in-memory duplicate guard for recent B2B submissions
- submit button lock while pending
- preserved form data on client-side and server-side errors

## Recommended rollout

1. Keep preview and local environments in `BITRIX_MODE=mock`.
2. Create required custom fields in Bitrix.
3. Configure either `BITRIX_LEAD_FIELD_MAP_JSON` or `BITRIX_ITEM_FIELD_MAP_JSON`.
4. Set real `BITRIX_WEBHOOK_URL`.
5. Switch production to `BITRIX_MODE=lead` or `BITRIX_MODE=item`.
6. Keep Telegram lead routing configured as operational fallback.
