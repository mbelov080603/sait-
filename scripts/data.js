window.GlobalBasketData = {
  contact: {
    phone: "8 (977) 338-46-40",
    email: "hello@globalbasket.ru",
    hours: "ПН-ПТ 09:00-18:00",
  },
  promo: [
    "Премиальная макадамия из Кении",
    "Вакуумная упаковка и чистый состав",
    "Каталог готов к расширению",
  ],
  utilityLinks: [
    { label: "Москва", href: "/contacts/" },
    { label: "Ваши вопросы и возвраты", href: "/contacts/" },
    { label: "Новинки", href: "/catalog/" },
    { label: "Подарочная карта", href: "/delivery/" },
  ],
  headerLinks: [
    { label: "Главная", href: "/" },
    { label: "О бренде", href: "/about/" },
    { label: "Журнал", href: "/journal/" },
    { label: "Доставка и оплата", href: "/delivery/" },
    { label: "Контакты", href: "/contacts/" },
  ],
  nav: [
    { key: "home", label: "Главная", href: "/" },
    { key: "catalog", label: "Каталог", href: "/catalog/" },
    { key: "category", label: "Премиальные орехи", href: "/categories/premium-nuts/" },
    { key: "journal", label: "Журнал", href: "/journal/" },
    { key: "about", label: "О бренде", href: "/about/" },
    { key: "delivery", label: "Доставка и оплата", href: "/delivery/" },
    { key: "contacts", label: "Контакты", href: "/contacts/" },
  ],
  categories: [
    {
      name: "Премиальные орехи",
      href: "/categories/premium-nuts/",
      status: "1 активная SKU",
      description: "Стартовый раздел с макадамией и архитектурой под будущие SKU.",
    },
    {
      name: "Сухофрукты",
      href: "/catalog/",
      status: "Скоро",
      description: "Раздел под натуральные сухофрукты без сахара и подарочные подборки.",
    },
    {
      name: "Смеси и superfood",
      href: "/catalog/",
      status: "Скоро",
      description: "Готовим линейку функциональных смесей, семян и premium-snack сценариев.",
    },
    {
      name: "Подарочные наборы",
      href: "/catalog/",
      status: "Roadmap",
      description: "Категория для сезонных наборов, retail-витрин и корпоративных подборок.",
    },
  ],
  products: [
    {
      id: "macadamia",
      shortName: "Очищенная макадамия",
      name: "Орехи сушеные ядра макадамии очищенные",
      href: "/catalog/macadamia/",
      category: "Премиальные орехи",
      image: "/assets/first-photo.png",
      altImage: "/assets/catalog-front.png",
      lifestyleImage: "/assets/lifestyle.png",
      detailImage: "/assets/product-front.png",
      price: "Цена по запросу",
      availability: "В наличии",
      weight: "250 г",
      origin: "Кения",
      packaging: "Вакуумная упаковка",
      composition: "100% ядра макадамии",
      badge: "Хит запуска",
      excerpt:
        "Натуральный продукт без соли и сахара в теплой премиальной подаче Global Basket.",
      description:
        "Стартовая SKU для витрины бренда, retail-сценариев, маркетплейс-ассортимента и будущего расширения каталога.",
      benefits: [
        "Без соли и сахара",
        "Премиальная подача",
        "Аккуратная фасовка",
        "Подходит для retail и gifting",
      ],
      nutrients: [
        { code: "MG", name: "Магний", text: "Сильный аргумент в блоке пользы и повседневного рациона." },
        { code: "B", name: "Витамины B", text: "Поддерживают ощущение насыщенного и натурального продукта." },
        { code: "FE", name: "Железо", text: "Добавляет фактурности nutritive-истории без перегруза текстом." },
        { code: "K", name: "Калий", text: "Работает как часть полноценного визуального набора микроэлементов." },
      ],
      specs: [
        { label: "Происхождение", value: "Кения" },
        { label: "Формат", value: "250 г" },
        { label: "Упаковка", value: "Вакуумный пакет" },
        { label: "Состав", value: "Только очищенные ядра" },
      ],
      gallery: [
        { src: "/assets/first-photo.png", alt: "Hero-фото макадамии Global Basket" },
        { src: "/assets/product-front.png", alt: "Фронтальный packshot продукта" },
        { src: "/assets/nuts-pile.png", alt: "Крупный план макадамии" },
        { src: "/assets/nuts-bits.png", alt: "Фактура ядра на белом фоне" },
        { src: "/assets/closeup-logo.png", alt: "Орехи вокруг логотипа Global Basket" },
        { src: "/assets/lifestyle.png", alt: "Lifestyle-сцена с продуктом" },
      ],
      faq: [
        {
          question: "Есть ли в составе добавки, соль или сахар?",
          answer: "Нет. В текущем MVP мы подаем продукт как чистый состав: только очищенные ядра макадамии.",
        },
        {
          question: "Почему цена указана по запросу?",
          answer: "Сайт сделан как витрина магазина и бренда. Розничную или оптовую цену можно подключить отдельно, когда будет утвержден прайс.",
        },
        {
          question: "Можно ли расширить каталог без переделки структуры?",
          answer: "Да. Весь каркас уже собран как магазин с категориями, полками и отдельной PDP-страницей.",
        },
      ],
    },
  ],
  shelves: {
    featured: {
      title: "Хиты витрины",
      eyebrow: "Лучшие предложения",
      description:
        "Главный товар запуска и соседние направления каталога собраны в первую коммерческую полку магазина.",
      cta: { label: "Смотреть каталог", href: "/catalog/" },
      items: [
        { type: "product", productId: "macadamia", label: "Хит бренда" },
        {
          type: "teaser",
          title: "Сухофрукты без сахара",
          description: "Натуральная линейка для следующего наполнения каталога.",
          href: "/catalog/",
          status: "Скоро",
        },
        {
          type: "teaser",
          title: "Подарочные наборы",
          description: "Категория для сезонных подборок и retail-витрин.",
          href: "/catalog/",
          status: "Roadmap",
        },
        {
          type: "teaser",
          title: "Смеси и superfood",
          description: "Будущая ветка каталога под смеси орехов, семян и ягод.",
          href: "/catalog/",
          status: "Скоро",
        },
      ],
    },
    novelty: {
      title: "Новинки каталога",
      eyebrow: "Новые поступления",
      description:
        "Даже стартовый ассортимент выглядит живым, когда рядом есть подборки, сценарии покупки и новые направления.",
      cta: { label: "Все новинки", href: "/catalog/" },
      items: [
        { type: "product", productId: "macadamia", label: "Новинка каталога", imageKey: "detailImage" },
        {
          type: "collection",
          title: "Для retail",
          description: "Сценарий для marketplace и полок с premium-snack подачей.",
          href: "/catalog/macadamia/",
        },
        {
          type: "collection",
          title: "Для gifting",
          description: "Основа для подарочного набора, десертной подачи и сезонной коллекции.",
          href: "/catalog/macadamia/",
        },
        {
          type: "collection",
          title: "Для опта",
          description: "Раздел под будущий оптовый прайс, фасовки и сервисные условия.",
          href: "/delivery/",
        },
      ],
    },
    related: {
      title: "Полезные разделы магазина",
      eyebrow: "Навигация по сайту",
      description: "Не копируем чужой ассортимент, а показываем направление развития магазина.",
      cta: { label: "Открыть разделы", href: "/about/" },
      items: [
        {
          type: "collection",
          title: "Премиальные орехи",
          description: "Редакционный категорийный раздел с макадамией в центре.",
          href: "/categories/premium-nuts/",
        },
        {
          type: "collection",
          title: "О бренде Global Basket",
          description: "Страница про происхождение, подачу и визуальный язык бренда.",
          href: "/about/",
        },
        {
          type: "collection",
          title: "Доставка и оплата",
          description: "Сервисный раздел, который делает сайт похожим на реальный магазин.",
          href: "/delivery/",
        },
      ],
    },
  },
  home: {
    intro: {
      title: "Global Basket",
      text:
        "Магазин собран как полноценная витрина: поиск, каталог, сервисные страницы и отдельная карточка главного продукта уже работают как единая система.",
    },
    quickCategories: [
      { mark: "ОР", label: "Орехи", note: "Активная категория", href: "/categories/premium-nuts/" },
      { mark: "СФ", label: "Сухофрукты", note: "Скоро", href: "/catalog/" },
      { mark: "СМ", label: "Смеси", note: "Roadmap", href: "/catalog/" },
      { mark: "ПН", label: "Наборы", note: "Праздничные SKU", href: "/catalog/" },
    ],
    merchBand: [
      {
        eyebrow: "Retail",
        title: "Для маркетплейсов и retail-полки",
        text: "Стартовая подача уже выглядит как готовая коммерческая витрина.",
        href: "/catalog/macadamia/",
        cta: "Retail-сценарий",
      },
      {
        eyebrow: "Сервис",
        title: "Опт, логистика и упаковка",
        text: "Отдельный блок под условия закупки и расширение ассортимента.",
        href: "/delivery/",
        cta: "Сервисные условия",
      },
      {
        eyebrow: "Бренд",
        title: "Чистый состав и спокойная айдентика",
        text: "Ленточные промо-блоки поддерживают продажи и брендовый контекст.",
        href: "/about/",
        cta: "О бренде",
      },
    ],
    banners: [
      {
        variant: "primary",
        title: "Премиальная очищенная макадамия",
        text: "Чистый состав, вакуумная упаковка и спокойная premium-подача для главной витрины магазина.",
        image: "/assets/catalog-front.png",
        href: "/catalog/macadamia/",
        cta: "Карточка товара",
        ribbon: "Любимая позиция для первой полки и главного экрана магазина",
      },
      {
        variant: "side",
        title: "Каталог с логикой магазина",
        text: "Категории, полки и сервисные маршруты вместо лендинговой простыни.",
        image: "/assets/basket.png",
        href: "/catalog/",
        cta: "В каталог",
      },
      {
        variant: "side",
        title: "Польза, упаковка и lifestyle",
        text: "Контентный слой поддерживает витрину и делает бренд объемнее.",
        image: "/assets/benefits-card.png",
        href: "/about/",
        cta: "О бренде",
      },
    ],
    serviceNote:
      "После hero пользователь сразу должен видеть подборки и полки каталога, а не проваливаться в слишком длинный editorial-flow.",
  },
  journal: {
    posts: [
      {
        title: "Как выглядит сильная карточка товара для premium-snack бренда",
        excerpt: "Разбираем, почему фото упаковки, продуктовая фактура и короткие аргументы продают лучше шаблонной ленты преимуществ.",
        href: "/journal/",
      },
      {
        title: "Макадамия как якорная SKU для запуска каталога",
        excerpt: "Одна позиция может открыть магазин, если вокруг нее собрана правильная структура категорий и разделов.",
        href: "/journal/",
      },
      {
        title: "Как готовить ассортимент без ощущения пустого магазина",
        excerpt: "Editorial-категории, roadmap-карточки и service-страницы помогают запустить сайт еще до расширения линейки.",
        href: "/journal/",
      },
    ],
  },
  categoryPage: {
    title: "Премиальные орехи",
    eyebrow: "Category page",
    lead:
      "Раздел собран по логике большой категории: с hero-зоной, полкой хитов, roadmap-карточками и editorial-слоем между товарами.",
    introCards: [
      {
        title: "Якорная SKU",
        text: "Макадамия открывает категорию и задает уровень качества для всей ветки орехов.",
      },
      {
        title: "Roadmap без пустоты",
        text: "Будущие позиции показаны честно как roadmap, а не как фейковый ассортимент.",
      },
      {
        title: "Магазинный ритм",
        text: "Баннеры, полки и подсекции делают категорию объемной даже в MVP.",
      },
    ],
  },
  aboutPage: {
    hero:
      "Global Basket строится как премиальный food-бренд: с теплой айдентикой, реальными packshot-фото и понятной магазинной структурой.",
    pillars: [
      {
        title: "Собственный визуальный язык",
        text: "Бежевые, медовые и шоколадные тона создают узнаваемую premium-подачу без копирования чужих магазинов.",
      },
      {
        title: "Каталоговая логика с первого дня",
        text: "Даже одна SKU размещается в системе категорий, сервисных страниц и editorial-слоев.",
      },
      {
        title: "Опора на реальные фото",
        text: "Продукт, упаковка, lifestyle и фактура ядра работают как полноценные merchandising-блоки.",
      },
      {
        title: "Рост без пересборки",
        text: "Следующие орехи, сухофрукты и наборы можно добавлять поверх уже собранной архитектуры.",
      },
    ],
  },
  deliveryPage: {
    cards: [
      {
        title: "Упаковка",
        text: "Стартуем с вакуумной упаковки и аккуратной визуальной подачей, подходящей для retail и каталога.",
      },
      {
        title: "Отгрузка",
        text: "Условия по объему и логистике можно подключить отдельно, не меняя структуру сайта.",
      },
      {
        title: "Оплата",
        text: "Цена и сценарии оплаты пока остаются по запросу, но сервисная страница уже готова под эти блоки.",
      },
      {
        title: "Для бизнеса",
        text: "Сервисный раздел связывает товарную страницу с оптовыми и retail-сценариями, как в полноценном магазине.",
      },
    ],
    steps: [
      "Клиент приходит из витрины в карточку товара или сервисную страницу.",
      "Дальше переходит к запросу условий, фасовки и коммерческого сценария.",
      "На следующем этапе подключаются реальные цены, способы оплаты и логистика.",
    ],
  },
  contactsPage: {
    cards: [
      {
        title: "Основной канал в MVP",
        text: "Сайт уже готов собирать обращения через формы на страницах каталога, продукта и сервиса.",
      },
      {
        title: "Следующий этап",
        text: "Подключение email, Telegram, CRM и рабочих телефонов можно сделать без переделки маршрутов и экранов.",
      },
      {
        title: "Для retail и опта",
        text: "Страница контактов связывает розничный каталог, PDP и сервисные разделы в единую коммерческую воронку.",
      },
    ],
  },
  footer: {
    columns: [
      {
        title: "Каталог",
        links: [
          { label: "Каталог", href: "/catalog/" },
          { label: "Премиальные орехи", href: "/categories/premium-nuts/" },
          { label: "Карточка макадамии", href: "/catalog/macadamia/" },
        ],
      },
      {
        title: "Покупателям",
        links: [
          { label: "О бренде", href: "/about/" },
          { label: "Доставка и оплата", href: "/delivery/" },
          { label: "Контакты", href: "/contacts/" },
        ],
      },
      {
        title: "Сервис",
        links: [
          { label: "Оптовые условия", href: "/delivery/" },
          { label: "Retail-сценарии", href: "/catalog/macadamia/" },
          { label: "Написать нам", href: "/contacts/" },
        ],
      },
      {
        title: "Контент",
        links: [
          { label: "Журнал", href: "/journal/" },
          { label: "Истории о продукте", href: "/journal/" },
          { label: "Новости витрины", href: "/catalog/" },
        ],
      },
    ],
  },
};
