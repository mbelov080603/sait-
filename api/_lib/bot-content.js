const BOT_USERNAME = "global_basket_bot";
const BOT_URL = `https://t.me/${BOT_USERNAME}`;
const ADMIN_CLAIM_COMMAND = "/claim_global_basket_admin";
const COMPLAINT_GROUP_BIND_COMMAND = "/link_complaints_here";
const CHANNEL_USERNAME = "Global_Basket";
const CHANNEL_URL = `https://t.me/${CHANNEL_USERNAME}`;

const COMPANY_DESCRIPTION =
  "Global Basket - это теплый, честный и надежный бренд натуральных продуктов со всего мира, который делает ставку на реальное качество, долгосрочную пользу для человека и доступность здорового выбора. Наша корпоративная идентичность строится на сочетании глобального ассортимента, домашнего образа, высокого стандарта качества, честного отношения к покупателю и убежденности в том, что хорошая еда должна быть не исключением, а нормой.";

const MARKETPLACES = [
  {
    key: "ozon",
    button: "Ozon",
    title: "Ozon",
    url: "https://www.ozon.ru/product/makadamiya-ochishchennaya-250g-3396255889/",
    description: [
      "Очищенная макадамия 250 г",
      "Кения / вакуумная упаковка",
      "Без соли и сахара",
    ],
  },
  {
    key: "wildberries",
    button: "Wildberries",
    title: "Wildberries",
    url: "https://www.wildberries.ru/catalog/802096885/detail.aspx?targetUrl=GP",
    description: [
      "Очищенные ядра макадамии",
      "250 г / вакуумная упаковка",
      "Чистый состав",
    ],
  },
  {
    key: "market",
    button: "Яндекс.Маркет",
    title: "Яндекс.Маркет",
    url: "https://market.yandex.ru/card/makadamiya-ochishchennaya-250g/5247197846?do-waremd5=A0BYwL-92pfpOCTZ9s_Jkg&businessId=216714756&ogV=-12",
    description: [
      "Очищенная макадамия 250 г",
      "Продукт без лишнего",
      "Чистый состав",
    ],
  },
];

const MAIN_KEYBOARD = {
  keyboard: [
    [{ text: "Ozon" }, { text: "Wildberries" }],
    [{ text: "Яндекс.Маркет" }, { text: "Канал" }],
    [{ text: "Сайт" }, { text: "Кто мы" }],
    [{ text: "Оставить жалобу" }],
  ],
  resize_keyboard: true,
  is_persistent: true,
  input_field_placeholder: "Выберите действие или напишите сообщение",
};

const COMPLAINT_PROMPT =
  "Опишите, пожалуйста, жалобу одним сообщением. Если нужно, можно ответить на это сообщение текстом или текстом с фото.";

const GENERAL_CONTACT_PROMPT =
  "Напишите ваш вопрос одним сообщением. Мы получим его в Telegram, а новые публикации из канала Global Basket будут приходить сюда тем, кто уже открыл бота.";

const WELCOME_TEXT =
  "Здравствуйте! Это бот Global Basket. Здесь можно быстро перейти к маркетплейсам, открыть канал бренда, перейти на сайт, узнать о компании и написать нам напрямую. Если бот уже открыт у пользователя, новые посты из канала можно дублировать сюда автоматически.";

module.exports = {
  ADMIN_CLAIM_COMMAND,
  BOT_URL,
  BOT_USERNAME,
  CHANNEL_URL,
  CHANNEL_USERNAME,
  COMPLAINT_GROUP_BIND_COMMAND,
  COMPANY_DESCRIPTION,
  COMPLAINT_PROMPT,
  GENERAL_CONTACT_PROMPT,
  MAIN_KEYBOARD,
  MARKETPLACES,
  WELCOME_TEXT,
};
