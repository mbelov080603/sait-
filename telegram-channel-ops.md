# Global Basket: Telegram Bot + Channel + Complaints Group

## Схема

- `@global_basket_bot` — основной входящий канал: вопросы, жалобы, ссылки на маркетплейсы, описание бренда.
- `@Global_Basket` — канал для новостей, постов и брендовых публикаций.
- private group — служебный чат, куда бот пересылает жалобы и входящие обращения.

## Что уже умеет бот

- Кнопки `Ozon`, `Wildberries`, `Яндекс.Маркет`
- Кнопка `Канал`
- Кнопка `Кто мы`
- Кнопка `Оставить жалобу`
- Форвард жалоб и входящих сообщений в назначенный служебный чат
- Автодублирование новых постов из канала в личные сообщения тем пользователям, которые уже открыли бота

## Нужные права

### Для канала `@Global_Basket`

Добавьте `@global_basket_bot` в админы канала с правами:

- `Post Messages`
- `Edit Messages`
- `Delete Messages`

### Для private complaints group

Добавьте `@global_basket_bot` в группу, куда должны приходить жалобы и новые сообщения из бота.

Боту достаточно права отправлять сообщения в группу.

## Как назначить complaints group

1. Убедитесь, что бот уже открыт у владельца в личном Telegram.
2. Если личный чат владельца ещё не привязан, отправьте боту:

```text
/claim_global_basket_admin
```

3. Добавьте бота в private group.
4. Из аккаунта владельца отправьте в этой группе:

```text
/link_complaints_here
```

После этого жалобы и новые сообщения из бота будут приходить в эту группу.

## Ручная публикация в канал

```bash
cd '/Users/belo/Desktop/орехи /orehi '
TELEGRAM_BOT_TOKEN='ВАШ_ТОКЕН' \
npm run telegram:post -- \
  --text '<b>Global Basket</b>\nНовая публикация в канале.' \
  --button-label 'Открыть бота' \
  --button-url 'https://t.me/global_basket_bot?start=channel_post'
```

## Публикация в канал с фото

```bash
cd '/Users/belo/Desktop/орехи /orehi '
TELEGRAM_BOT_TOKEN='ВАШ_ТОКЕН' \
npm run telegram:post -- \
  --photo 'https://example.com/image.jpg' \
  --text '<b>Global Basket</b>\nФото-публикация в канале.' \
  --button-label 'Открыть сайт' \
  --button-url 'https://globalbasket.ru'
```

## Перенастройка webhook

```bash
cd '/Users/belo/Desktop/орехи /orehi '
TELEGRAM_BOT_TOKEN='ВАШ_ТОКЕН' \
SITE_URL='https://ВАШ_DEPLOY' \
npm run telegram:setup
```

Скрипт сохранит текущего владельца и текущий complaints chat, если они уже были записаны в webhook URL.
