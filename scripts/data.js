window.GlobalBasketData = {
  contact: {
    phone: "8 (977) 338-46-40",
    phoneHref: "tel:+79773384640",
    email: "hello@globalbasket.ru",
    emailHref: "mailto:hello@globalbasket.ru",
    hours: "Пн-Пт 09:00-18:00",
  },
  noticeBar: {
    items: [
      { label: "Оптовые запросы", href: "/contacts/?source=wholesale" },
      { label: "Упаковка: вакуум" },
      { label: "Происхождение: Кения" },
    ],
  },
  searchScopes: [
    { value: "catalog", label: "Каталог" },
    { value: "nuts", label: "Орехи" },
    { value: "sections", label: "Разделы" },
  ],
  primaryNav: [
    { label: "Каталог", href: "/catalog/", match: ["/catalog/", "/categories/"] },
    { label: "О бренде", href: "/about/", match: ["/about/"] },
    { label: "Доставка и оплата", href: "/delivery/", match: ["/delivery/"] },
    { label: "Журнал", href: "/journal/", match: ["/journal/"] },
    { label: "Контакты", href: "/contacts/", match: ["/contacts/"] },
  ],
  headerIcons: [
    { label: "Избранное", href: "/favorites/", icon: "heart" },
    { label: "Аккаунт", href: "/account/", icon: "user" },
    { label: "Корзина", href: "/cart/", icon: "bag" },
  ],
  categories: [
    {
      name: "Премиальные орехи",
      description: "Основной раздел каталога с очищенной макадамией.",
      href: "/categories/premium-nuts/",
      status: "active",
      statusLabel: "В наличии",
    },
    {
      name: "Сухофрукты",
      description: "Натуральные сухофрукты для следующего расширения витрины.",
      status: "coming",
      statusLabel: "Скоро",
    },
    {
      name: "Ореховые смеси",
      description: "Смеси для повседневной подачи и подарочных сценариев.",
      status: "coming",
      statusLabel: "Скоро",
    },
    {
      name: "Подарочные наборы",
      description: "Подборки для сезонного спроса и аккуратной премиальной подачи.",
      status: "coming",
      statusLabel: "Скоро",
    },
  ],
  product: {
    id: "macadamia",
    shortName: "Очищенная макадамия",
    fullName: "Очищенная макадамия 250 г",
    href: "/catalog/macadamia/",
    badge: "В наличии",
    badgeTone: "active",
    category: "Премиальные орехи",
    subtitle: "Кения / 250 г",
    price: "Цена по запросу",
    requestText: "Добавить в запрос",
    priceNote: "Стоимость уточняем после обсуждения объёма и формата заказа.",
    availability: "В наличии",
    origin: "Кения",
    weight: "250 г",
    packaging: "Вакуумная упаковка",
    composition: "Только очищенные ядра",
    lead:
      "Натуральный продукт без соли и сахара в тёплой премиальной подаче Global Basket.",
    excerpt:
      "Очищенные ядра макадамии в вакуумной упаковке. Чистый состав, мягкий вкус и понятный путь к заказу.",
    description:
      "Макадамия — центральный товар витрины Global Basket: спокойная подача, аккуратная упаковка и собранный интерфейс без визуального шума.",
    images: {
      hero: "/assets/catalog-front.png",
      packshot: "/assets/product-front.png",
      main: "/assets/first-photo.png",
      lifestyle: "/assets/lifestyle.png",
      benefits: "/assets/benefits-card.png",
      basket: "/assets/basket.png",
      pile: "/assets/nuts-pile.png",
      bits: "/assets/nuts-bits.png",
      logo: "/assets/closeup-logo.png",
    },
    gallery: [
      { src: "/assets/first-photo.png", alt: "Главное фото очищенной макадамии" },
      { src: "/assets/product-front.png", alt: "Фронтальный вид упаковки" },
      { src: "/assets/catalog-front.png", alt: "Упаковка продукта на белом фоне" },
      { src: "/assets/lifestyle.png", alt: "Фото продукта в подаче" },
    ],
    pills: ["Кения", "250 г", "Вакуумная упаковка", "Только очищенные ядра"],
    factCards: [
      {
        icon: "dot",
        title: "Состав",
        text: "Только очищенные ядра",
      },
      {
        icon: "package",
        title: "Упаковка",
        text: "Вакуумный пакет",
      },
      {
        icon: "globe",
        title: "Происхождение",
        text: "Кения",
      },
      {
        icon: "scale",
        title: "Формат",
        text: "250 г",
      },
    ],
    benefitCards: [
      { code: "MG", title: "Магний", text: "Поддерживает сбалансированный рацион." },
      { code: "B", title: "Витамины B", text: "Делают продукт более ценным в ежедневном рационе." },
      { code: "FE", title: "Железо", text: "Усиливает практическую пользу продукта." },
      { code: "K", title: "Калий", text: "Подчеркивает натуральный и насыщенный состав." },
    ],
    faq: [
      {
        question: "Есть ли в составе соль, сахар или добавки?",
        answer:
          "Нет. В составе только очищенные ядра макадамии без соли, сахара и других добавок.",
      },
      {
        question: "Как узнать стоимость?",
        answer:
          "Нажмите «Добавить в запрос» или свяжитесь с нами напрямую. Мы уточним стоимость после короткого обсуждения объёма и формата заказа.",
      },
      {
        question: "Можно ли заказать продукт для розницы и закупки?",
        answer:
          "Да. Мы подскажем условия как для единичного заказа, так и для закупки для магазина или регулярных поставок.",
      },
    ],
  },
  marketplaces: [
    {
      name: "Ozon",
      href: "https://www.ozon.ru/product/makadamiya-ochishchennaya-250g-3396255889/?abt_att=1&origin_referer=seller.ozon.ru",
      bullets: [
        "Очищенная макадамия 250 г",
        "Кения / вакуумная упаковка",
        "Без соли и сахара",
      ],
      cta: "Смотреть на Ozon",
    },
    {
      name: "Wildberries",
      href: "https://www.wildberries.ru/catalog/802096885/detail.aspx?targetUrl=GP",
      bullets: [
        "Очищенные ядра макадамии",
        "250 г / вакуумная упаковка",
        "Чистый состав",
      ],
      cta: "Смотреть на Wildberries",
    },
    {
      name: "Яндекс.Маркет",
      href: "https://market.yandex.ru/card/makadamiya-ochishchennaya-250g/5247197846?do-waremd5=A0BYwL-92pfpOCTZ9s_Jkg&businessId=216714756&ogV=-12",
      bullets: [
        "Очищенная макадамия 250 г",
        "Продукт без лишнего",
        "Чистый состав",
      ],
      cta: "Смотреть на Яндекс.Маркете",
    },
  ],
  trustCards: [
    {
      title: "График",
      text: "ПН-ПТ 09:00-18:00",
    },
    {
      title: "Опт и розница",
      text: "Подскажем по розничному заказу и обсудим поставку для магазина.",
      href: "/contacts/?source=retail",
    },
    {
      title: "Возвраты",
      text: "Вопросы по возвратам и сопровождению заказа собраны на сервисной странице.",
      href: "/delivery/#returns",
    },
  ],
  home: {
    hero: {
      title: "Очищенная макадамия",
      text:
        "Натуральный продукт без соли и сахара в тёплой премиальной подаче Global Basket.",
      primaryCta: {
        label: "Добавить в запрос",
        href: "/contacts/?source=home",
      },
      secondaryCta: {
        label: "Смотреть где купить",
        href: "#marketplaces",
      },
    },
  },
  catalogPage: {
    intro:
      "В каталоге собраны товар и разделы, которые помогают быстро перейти от выбора к обращению.",
    filters: [
      { label: "Все", value: "all" },
      { label: "В наличии", value: "active" },
      { label: "Разделы", value: "sections" },
    ],
    sorts: [
      { value: "featured", label: "Сначала главное" },
      { value: "available", label: "Сначала в наличии" },
      { value: "coming", label: "Сначала новые разделы" },
    ],
    support: [
      {
        title: "О бренде",
        description: "Узнайте, как фирменная подача Global Basket поддерживает доверие к продукту.",
        href: "/about/",
        badge: "Материал",
        tone: "editorial",
      },
      {
        title: "Доставка и оплата",
        description: "Посмотрите, как мы сопровождаем запрос, доставку и дальнейшее оформление заказа.",
        href: "/delivery/",
        badge: "Покупателям",
        tone: "service",
      },
      {
        title: "Контакты",
        description: "Перейдите к следующему шагу и отправьте запрос по товару, закупке или доставке.",
        href: "/contacts/?source=catalog",
        badge: "Покупателям",
        tone: "service",
      },
    ],
  },
  contactsPage: {
    intro:
      "Эта страница собирает запрос в один следующий шаг: товар, объём, формат поставки и площадка, где вам удобнее покупать.",
    leftCards: [
      {
        title: "Розница",
        text: "Если нужен розничный заказ, подскажем по товару, наличию и удобному каналу покупки.",
      },
      {
        title: "Опт",
        text: "Если вам нужна поставка для магазина, обсудим объём и формат сотрудничества.",
      },
      {
        title: "Маркетплейсы",
        text: "Товар уже можно посмотреть на Ozon, Wildberries и Яндекс.Маркете как дополнительный аргумент доверия.",
      },
    ],
    form: {
      title: "Добавить в запрос",
      text: "Оставьте тему обращения и контакт. Мы ответим в рабочее время и подскажем следующий шаг.",
      submit: "Отправить запрос",
    },
  },
  utilityPages: {
    favorites: {
      title: "Избранное",
      text: "Сохраняйте интересные товары и возвращайтесь к ним позже. Сейчас в каталоге доступна очищенная макадамия.",
      primary: { label: "В каталог", href: "/catalog/" },
      secondary: { label: "Добавить в запрос", href: "/contacts/?source=favorites" },
    },
    account: {
      title: "Аккаунт",
      text: "Личный кабинет появится позже. Пока все вопросы по заказу и сопровождению решаем напрямую через контакты.",
      primary: { label: "Связаться", href: "/contacts/?source=account" },
      secondary: { label: "В каталог", href: "/catalog/" },
    },
    cart: {
      title: "Корзина",
      text: "Сейчас заказ оформляется через запрос с уточнением объёма и условий поставки.",
      primary: { label: "Добавить в запрос", href: "/contacts/?source=cart" },
      secondary: { label: "Смотреть товар", href: "/catalog/macadamia/" },
    },
  },
  aboutPage: {
    pillars: [
      {
        title: "Тёплая палитра",
        text: "Пергаментный фон, янтарные акценты и тёмно-шоколадный текст собирают узнаваемый образ бренда.",
      },
      {
        title: "Натуральная подача",
        text: "Сайт говорит о продукте мягко и ясно, не превращая каждую секцию в отдельный постер.",
      },
      {
        title: "Каталожная логика",
        text: "Главная ведёт к товару, товар — к запросу или к маркетплейсам, а вспомогательные страницы помогают быстро получить ответ.",
      },
    ],
  },
  deliveryPage: {
    cards: [
      { title: "Стоимость", text: "Стоимость уточняем после короткого обсуждения объёма и формата заказа." },
      { title: "Упаковка", text: "Продукт поставляется в вакуумной упаковке, которая поддерживает аккуратную подачу." },
      { title: "Доставка", text: "Детали доставки согласовываем после обращения, чтобы предложить подходящий вариант." },
      { title: "Закупка", text: "Если нужен объём для магазина или регулярных поставок, отдельно обсудим условия." },
    ],
    returns: {
      title: "Возвраты и вопросы",
      text: "Если нужно уточнить возврат, сопровождение или детали уже оформленного запроса, свяжитесь с нами через контакты. Мы подскажем следующий шаг в рабочее время.",
      cta: { label: "Перейти в контакты", href: "/contacts/?source=returns" },
    },
  },
  journal: {
    posts: [
      {
        slug: "packaging",
        title: "Как аккуратная упаковка усиливает впечатление от продукта",
        excerpt: "Почему визуально собранная подача работает на доверие ещё до первого обращения.",
        href: "/journal/packaging/",
        lead:
          "Когда продукт подан спокойно и аккуратно, пользователь быстрее считывает его уровень и легче переходит к следующему действию.",
        sections: [
          {
            title: "Упаковка как первая точка доверия",
            text: "Для food e-commerce упаковка — это часть первого впечатления. Если продукт выглядит собранно, карточка товара воспринимается серьёзнее.",
          },
          {
            title: "Почему это важно для премиального сегмента",
            text: "Премиальный продукт должен выглядеть уверенно, но не крикливо. Тёплая палитра и аккуратный вид упаковки создают нужное ощущение без перегруза.",
          },
        ],
      },
      {
        slug: "macadamia-start",
        title: "Почему макадамия хорошо подходит для старта премиальной витрины",
        excerpt: "Один сильный товар может задать тон всему магазину, если вокруг него собрана понятная структура.",
        href: "/journal/macadamia-start/",
        lead:
          "Макадамия помогает запустить каталог без ощущения пустоты: продукт сам по себе выглядит цельно и даёт достаточно поводов для сильной первой витрины.",
        sections: [
          {
            title: "Один товар, который не выглядит случайным",
            text: "У макадамии выразительный внешний вид, понятный состав и сильная ассоциация с премиальным продуктом. Поэтому она хорошо работает как стартовая позиция.",
          },
          {
            title: "Карточка товара становится сильнее",
            text: "Даже один товар может выглядеть убедительно, если у него есть хорошие фотографии, ясные характеристики и честный переход к заказу.",
          },
        ],
      },
      {
        slug: "catalog-growth",
        title: "Как расширять ассортимент и не перегружать витрину",
        excerpt: "Как добавлять новые категории постепенно и при этом сохранять цельный интерфейс магазина.",
        href: "/journal/catalog-growth/",
        lead:
          "Рост ассортимента не должен превращать магазин в шумный набор блоков. Важно расширять каталог так, чтобы пользователь по-прежнему быстро понимал, где он находится и что делать дальше.",
        sections: [
          {
            title: "Новые категории должны быть честными",
            text: "Если раздел ещё не запущен, лучше показать его как «Скоро», чем вести пользователя в пустую или условную страницу.",
          },
          {
            title: "Главная не должна брать на себя всё сразу",
            text: "Главная продаёт идею магазина и ведёт к ключевому товару. Остальная навигация и подробности должны жить на внутренних страницах.",
          },
        ],
      },
    ],
  },
  footer: {
    columns: [
      {
        title: "Каталог",
        links: [
          { label: "В каталог", href: "/catalog/" },
          { label: "Премиальные орехи", href: "/categories/premium-nuts/" },
          { label: "Очищенная макадамия", href: "/catalog/macadamia/" },
        ],
      },
      {
        title: "Покупателям",
        links: [
          { label: "Контакты", href: "/contacts/" },
          { label: "Доставка и оплата", href: "/delivery/" },
          { label: "Возвраты", href: "/delivery/#returns" },
        ],
      },
      {
        title: "Маркетплейсы",
        links: [
          { label: "Ozon", href: "https://www.ozon.ru/product/makadamiya-ochishchennaya-250g-3396255889/?abt_att=1&origin_referer=seller.ozon.ru" },
          { label: "Wildberries", href: "https://www.wildberries.ru/catalog/802096885/detail.aspx?targetUrl=GP" },
          { label: "Яндекс.Маркет", href: "https://market.yandex.ru/card/makadamiya-ochishchennaya-250g/5247197846?do-waremd5=A0BYwL-92pfpOCTZ9s_Jkg&businessId=216714756&ogV=-12" },
        ],
      },
    ],
  },
};
