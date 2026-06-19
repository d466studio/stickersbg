// Translation system for BG STICKERS website
// Supports English (en) and Bulgarian (bg)

(function () {
  "use strict";

  const TRANSLATIONS = {
    en: {
      // Navigation
      nav: {
        start: "START",
        design: "DESIGN",
        assets: "ASSETS",
        shop: "SHOP",
        nachalo: "HOME",
        galeria: "GALLERY",
        nadpisi: "TEXT",
        stikeri: "STICKERS",
        avto: "AUTO",
        print: "PRINT STICKER",
        "za-nas": "ABOUT"
      },
      // Brand
      brandTag: "studio-made • vinyl • stickers",
      assets: {
        title: "ASSETS",
        subtitle: "Curated SVG designs — click “Use in designer” to add instantly."
      },

      // Home page
      home: {
        title: "Create a sticker. We will re-produce it perfectly.",
        description: "A one-of-a-kind sticker designer with <b>live preview</b> — create it your own way.",
        betaNotice: "⚠️ Beta version: this website is currently under construction. Some features may change.",
        ctaDesign: "Start designing",
        ctaShop: "Browse stickers",
        chips: {
          preview: "Live preview",
          rules: "Creativity Unlimited!",
          minimal: "Minimal, premium"
        },
        howItWorks: "How it works",
        howItWorksSteps: [
          "Choose a ready option or make a request",
          "Send size/colors/example",
          "Receive confirmation and offer"
        ],
        important: "Important",
        importantPoints: [
          "Vinyl: works best with <b>clean text/shapes</b>",
          "Custom stickers: from provided example + description",
          "Print stickers: external print, max <b>A4</b>"
        ],
        siteAccepts: "The site accepts <b>requests</b> (no payments). You send details → we confirm price/deadline."
      },

      // Designer
      design: {
        title: "DESIGN",
        description: "Web designer with live preview, sizes, colors, quantities.... Our Photoshop for Stickers :)",
        betaNotice: "⚠️ Beta designer: Some functions may not work as intented!",
        orderTitle: "Design your sticker",
        modeText: "Text",
        modeUpload: "Upload",
        form: {
          text: "Text (max 2 lines)",
          textHint: "Up to 2 lines • 20 characters per line.",
          upload: "Upload artwork",
          uploadHint: "High resolution recommended. Low quality files may be blocked.",
          size: "Size (width, cm)",
          quantity: "Quantity",
          font: "Font",
          color: "Color",
          background: "Background",
          finish: "Finish",
          bgColor: "Background color",
          bgSize: "Background size",
          bgFinish: "Background finish",
          notes: "Notes (optional)",
          contact: "Contact",
          submit: "Order sticker"
        },
        previewTitle: "Live preview",
        previewHint: "Preview shows text/color and a thumbnail of uploaded artwork.",
        priceNote: "Estimated price updates automatically."
      },

      shop: {
        title: "SHOP",
        description: "Ready-made stickers and packs (coming soon).",
        coming: "Coming soon",
        comingText: "We’re building a curated shop experience. For now, use the designer.",
        ctaDesign: "Start designing"
      },
      // Gallery
      gallery: {
        title: "GALLERY",
        description: "A selection of finished projects and custom sticker work.",
        projects: "Projects",
        filterByTag: "Filter by tag",
        tag: "Tag:",
        all: "All",
        noProjects: "No projects (add to gallery.json)."
      },
      // Text (Nadpisi)
      nadpisi: {
        title: "TEXT",
        description: "Vinyl text (cut vinyl). Ready options + custom text order.",
        tabs: {
          popular: "POPULAR",
          custom: "CUSTOM"
        },
        orderTitle: "Order text",
        popularNotice: "Ready text (no personalization). Choose only size and color.",
        wantCustom: "I want custom text",
        form: {
          text: "Text",
          textPlaceholder: "Example: LOW & SLOW",
          width: "Size (width, cm)",
          height: "Height (cm, optional)",
          heightPlaceholder: "auto",
          font: "Font",
          mainColor: "Main color (for preview)",
          extraColors: "Extra colors (optional)",
          extraColorsHint: "If 2+ colors, specify which letters/parts should be in different color.",
          estimatedPrice: "Estimated price:",
          contact: "Contact (phone/Instagram)",
          contactPlaceholder: "@stickers.studio.bg or +359...",
          note: "Note (optional)",
          notePlaceholder: "Where will it be applied? If extra colors: which letters/parts...",
          submit: "Submit request"
        },
        previewTitle: "Live preview",
        previewHint: "Preview shows only the <b>main color</b>.",
        readyText: "ready text"
      },
      // Stickers
      stikeri: {
        title: "STICKERS",
        description: "Custom stickers (from provided example). +2€ to base.",
        orderTitle: "Custom sticker",
        form: {
          uploadExample: "Upload example (image/sketch) *",
          text: "Text (if any)",
          textPlaceholder: "Example: BG STICKERS",
          width: "Size (width, cm)",
          height: "Height (cm, optional)",
          heightPlaceholder: "auto",
          font: "Font",
          mainColor: "Main color (for preview)",
          extraColors: "Extra colors (optional)",
          extraColorsSelect: "Select extra colors",
          extraColorsHint: "If 2+ colors, describe which parts should be in different color.",
          estimatedPrice: "Estimated price:",
          description: "Description",
          descriptionPlaceholder: "Where is it applied? Quantity? Outline/shape? If extra colors: which parts...",
          contact: "Contact (phone/Instagram)",
          contactPlaceholder: "@stickers.studio.bg or +359...",
          submit: "Submit request"
        },
        previewTitle: "Live preview",
        previewHint: "Preview shows only the <b>main color</b>. Thumbnail shows uploaded file.",
        priceNote: "Price is +2€ to base (design)."
      },
      // Auto
      avto: {
        title: "AUTO",
        description: "Tuning decals, banners, side text. Ready options + request from example.",
        popular: "POPULAR",
        brand: "Brand:",
        custom: "CUSTOM",
        form: {
          uploadExample: "Upload example (image/sketch) *",
          size: "Size (cm)",
          sizePlaceholder: "Example: 120x15",
          color: "Color",
          description: "Description",
          descriptionPlaceholder: "Where is it applied? What style? Text, position, quantity...",
          contact: "Contact (phone/Instagram)",
          contactPlaceholder: "@stickers.studio.bg or +359...",
          submit: "Submit request"
        }
      },
      // Print sticker
      print: {
        title: "PRINT STICKER",
        description: "Full-color print sticker (external print). <b>Max size: A4</b>.",
        orderTitle: "Print request",
        form: {
          uploadImage: "Upload image *",
          size: "Size (cm) — max A4",
          sizePlaceholder: "Example: 20x25",
          finish: "Lamination / finish (optional)",
          finishNone: "none",
          finishGloss: "gloss",
          finishMatte: "matte",
          description: "Description",
          descriptionPlaceholder: "Quantity, cutout outline/rectangle...",
          contact: "Contact (phone/Instagram)",
          contactPlaceholder: "@stickers.studio.bg or +359...",
          submit: "Submit request"
        },
        notes: "Notes",
        notesPoints: [
          "Best result: high resolution image",
          "Max size: <b>A4</b> (21×29.7 cm)"
        ]
      },
      // About
      about: {
        title: "ABOUT",
        description: "Contact us for custom sticker projects, branding and vinyl work.",
        whoWeAre: "Who are we? The idea for the first-of-its-kind Sticker Studio.",
        whoWeAreText: "<b>stickers.studio</b> — minimalist studio for custom vinyl stickers, decals and branding. We focus on clean design, precise production and clear communication.",
        contact: "Contact",
        instagram: "Instagram:",
        phone: "Phone:",
        workHours: "(during work hours only)"
      },
      // Common
      common: {
        availableColors: "Available colors:",
        fontUploadHint: "You can upload your own font (TTF/OTF/WOFF). It will appear immediately in the list.",
        fontUploading: "Loading font…",
        fontAdded: "✅ Font added: ",
        fontError: "❌ Could not load this font. Try another file (woff2/ttf).",
        browserNoFonts: "This browser does not support loading fonts directly.",
        pleaseUploadFont: "Please upload TTF/OTF/WOFF/WOFF2 file.",
        uploaded: "Uploaded",
        popular: "Popular",
        classic: "Classic (system)",
        cooler: "Cooler (Google)",
        extraColorsSelected: "Extra colors: {count} selected",
        selectExtraColors: "Select extra colors",
        base: "base",
        extra: "extra",
        for: "for",
        additional: "additional",
        cm: "cm",
        euro: "€",
        copied: "📋 Copied!",
        copyError: "❌ Could not copy.",
        sending: "Sending...",
        sent: "✅ Request sent!",
        sendError: "❌ Error sending.",
        connectionError: "❌ No connection / endpoint problem.",
        noEndpoint: "⚠️ No formEndpoint. Add endpoint in app.js. Meanwhile: ",
        readyText: "Ready text"
      },
      // Summary texts
      summary: {
        nadpisi: "BG STICKERS • CUSTOM TEXT ORDER",
        stikeri: "BG STICKERS • CUSTOM STICKERS ORDER",
        avto: "BG STICKERS • CUSTOM AUTO ORDER (see fields)",
        print: "BG STICKERS • PRINT STICKER ORDER (see fields)",
        text: "Text: ",
        size: "Size: ",
        font: "Font: ",
        mainColor: "Main color: ",
        extraColors: "Extra colors: ",
        none: "none",
        note: "Note: ",
        description: "Description: ",
        price: "Price (est.): "
      },
      // Popular items meta
      popularMeta: {
        textClean: "Text • clean",
        textSport: "Text • sport",
        shortAggressive: "Short • aggressive",
        shortClean: "Short • clean",
        trackText: "Track • text",
        textMinimal: "Text • minimal"
      },
      // Popular pills
      pills: {
        singleColor: "single color",
        compact: "compact",
        popular: "popular",
        banner: "banner",
        sport: "sport",
        minimal: "minimal",
        small: "small",
        clean: "clean",
        universal: "universal"
      },
      // Auto brands meta
      autoMeta: {
        windshield: "Windshield",
        side: "Side",
        rear: "Rear",
        front: "Front"
      }
    },
    bg: {
      // Navigation
      nav: {
        start: "НАЧАЛО",
        design: "ДИЗАЙН",
        assets: "АСЕТИ",
        shop: "МАГАЗИН",
        nachalo: "НАЧАЛО",
        galeria: "ГАЛЕРИЯ",
        nadpisi: "НАДПИСИ",
        stikeri: "СТИКЕРИ",
        avto: "АВТО",
        print: "ПРИНТ СТИКЕР",
        "za-nas": "ЗА НАС"
      },
      // Brand
      brandTag: "studio-made • винил • стикери",
      assets: {
        title: "ASSETS",
        subtitle: "Curated SVG designs — click “Use in designer” to add instantly."
      },

      // Home page
      home: {
        title: "Създай стикер. Ние ще го превърнем в реалност!",
        description: "Единствен по рода си стикер дизайнер с <b>live preview</b> — създай по собствен вкус.",
        betaNotice: "⚠️ Beta версия: сайтът в момента е в процес на разработка. Някои функции може да се променят.",
        ctaDesign: "Започни дизайн",
        ctaShop: "Разгледай стикери",
        chips: {
          preview: "Live preview",
          rules: "Creativity Unlimited!",
          minimal: "Минимално, премиум"
        },
        howItWorks: "Как работи",
        howItWorksSteps: [
          "Избираш готов вариант или правиш заявка",
          "Изпращаш размер/цветове/пример",
          "Получаваш потвърждение и оферта"
        ],
        important: "Важно",
        importantPoints: [
          "Винил: най-добре работи с <b>чист текст/форми</b>",
          "Стикери по поръчка: по предоставен пример + описание",
          "Принт стикери: външен печат, макс <b>A4</b>"
        ],
        siteAccepts: "Дизайн → преглед → поръчка. Плащанията идват скоро."
      },

      design: {
        title: "ДИЗАЙН",
        description: "Уеб дизайнер с live preview, размери, цветове, бройки.... Нашият фотошоп за Стикери :)",
        betaNotice: "⚠️ Beta дизайнер: Някои функционалности може да не работят правилно!",
        orderTitle: "Създай своя стикер",
        modeText: "Текст",
        modeUpload: "Качи файл",
        form: {
          text: "Текст (макс 2 реда)",
          textHint: "До 2 реда • 20 символа на ред.",
          upload: "Качи изображение",
          uploadHint: "Препоръчваме висока резолюция. Ниски качества могат да бъдат блокирани.",
          size: "Размер (ширина, см)",
          quantity: "Брой",
          font: "Шрифт",
          color: "Цвят",
          background: "Фон",
          finish: "Финиш",
          bgColor: "Цвят на фона",
          bgSize: "Размер на фона",
          bgFinish: "Финиш на фона",
          notes: "Бележки (по избор)",
          contact: "Контакт",
          submit: "Поръчай стикер"
        },
        previewTitle: "Live preview",
        previewHint: "Показва текст/цвят и миниатюра на качения файл.",
        priceNote: "Ориентировъчната цена се обновява автоматично."
      },

      shop: {
        title: "МАГАЗИН",
        description: "Готови стикери и пакети (скоро).",
        coming: "Скоро",
        comingText: "Подготвяме подбран магазин. Засега използвай дизайнера.",
        ctaDesign: "Започни дизайн"
      },
      // Gallery
      gallery: {
        title: "ГАЛЕРИЯ",
        description: "Селекция от завършени проекти и персонализирани стикери.",
        projects: "Проекти",
        filterByTag: "Филтър по таг",
        tag: "Таг:",
        all: "Всички",
        noProjects: "Няма проекти (добави в gallery.json)."
      },
      // Text (Nadpisi)
      nadpisi: {
        title: "НАДПИСИ",
        description: "Винил надписи (рязано фолио). Готови предложения + поръчка на текст.",
        tabs: {
          popular: "ПОПУЛЯРНИ",
          custom: "ПО ПОРЪЧКА"
        },
        orderTitle: "Поръчай надпис",
        popularNotice: "Готов надпис (без персонализация). Избери само размер и цвят.",
        wantCustom: "Искам персонализиран текст",
        form: {
          text: "Текст",
          textPlaceholder: "Пример: LOW & SLOW",
          width: "Размер (ширина, см)",
          height: "Височина (см, по желание)",
          heightPlaceholder: "auto",
          font: "Шрифт",
          mainColor: "Основен цвят (за preview)",
          extraColors: "Доп. цветове (по желание)",
          extraColorsHint: "Ако са 2+ цвята, напиши кои букви/части да са в различен цвят.",
          estimatedPrice: "Ориентировъчна цена:",
          contact: "Контакт (телефон/Instagram)",
          contactPlaceholder: "@stickers.studio.bg или +359...",
          note: "Бележка (по желание)",
          notePlaceholder: "Къде ще се лепи? Ако има доп. цветове: кои букви/части...",
          submit: "Изпрати заявка"
        },
        previewTitle: "Live preview",
        previewHint: "Preview показва само <b>основния цвят</b>.",
        readyText: "готов надпис"
      },
      // Stickers
      stikeri: {
        title: "СТИКЕРИ",
        description: "Стикери по поръчка (по предоставен пример). +2€ към базата.",
        orderTitle: "Стикер по поръчка",
        form: {
          uploadExample: "Качи пример (снимка/скица) *",
          text: "Текст (ако има)",
          textPlaceholder: "Пример: BG STICKERS",
          width: "Размер (ширина, см)",
          height: "Височина (см, по желание)",
          heightPlaceholder: "auto",
          font: "Шрифт",
          mainColor: "Основен цвят (за preview)",
          extraColors: "Доп. цветове (по желание)",
          extraColorsSelect: "Избери доп. цветове",
          extraColorsHint: "Ако са 2+ цвята, опиши кои части да са в различен цвят.",
          estimatedPrice: "Ориентировъчна цена:",
          description: "Описание",
          descriptionPlaceholder: "Къде се лепи? Брой? Контур/форма? Ако има доп. цветове: кои части...",
          contact: "Контакт (телефон/Instagram)",
          contactPlaceholder: "@stickers.studio.bg или +359...",
          submit: "Изпрати заявка"
        },
        previewTitle: "Live preview",
        previewHint: "Preview показва само <b>основния цвят</b>. Thumbnail показва качения файл.",
        priceNote: "Цената е +2€ към базата (дизайн)."
      },
      // Auto
      avto: {
        title: "АВТО",
        description: "Тунинг декали, банери, странични надписи. Готови предложения + заявка по пример.",
        popular: "ПОПУЛЯРНИ",
        brand: "Марка:",
        custom: "ПО ПОРЪЧКА",
        form: {
          uploadExample: "Качи пример (снимка/скица) *",
          size: "Размер (см)",
          sizePlaceholder: "Пример: 120x15",
          color: "Цвят",
          description: "Описание",
          descriptionPlaceholder: "Къде се лепи? Какъв стил? Текст, позиция, брой...",
          contact: "Контакт (телефон/Instagram)",
          contactPlaceholder: "@stickers.studio.bg или +359...",
          submit: "Изпрати заявка"
        }
      },
      // Print sticker
      print: {
        title: "ПРИНТ СТИКЕР",
        description: "Пълноцветен принт стикер (външен печат). <b>Макс размер: A4</b>.",
        orderTitle: "Заявка за принт",
        form: {
          uploadImage: "Качи изображение *",
          size: "Размер (см) — макс A4",
          sizePlaceholder: "Пример: 20x25",
          finish: "Ламинация / финиш (по желание)",
          finishNone: "без",
          finishGloss: "гланц",
          finishMatte: "мат",
          description: "Описание",
          descriptionPlaceholder: "Брой, изрязване по контур/правоъгълник...",
          contact: "Контакт (телефон/Instagram)",
          contactPlaceholder: "@stickers.studio.bg или +359...",
          submit: "Изпрати заявка"
        },
        notes: "Бележки",
        notesPoints: [
          "Най-добър резултат: изображение с висока резолюция",
          "Макс размер: <b>A4</b> (21×29.7 см)"
        ]
      },
      // About
      about: {
        title: "ЗА НАС",
        description: "Свържете се с нас за персонализирани стикери, брандиране и винилни проекти.",
        whoWeAre: "Кои сме? Идеята за първото по рода си Стикер Студио.",
        whoWeAreText: "<b>stickers.studio</b> — Първият по рода си бранд - студио за персонализирани винилни стикери, декали и брандиране. Фокусът ни е върху чист дизайн, прецизна изработка и ясна комуникация за вашия дизайн. Нашите дизайнери могат да създадат всяка идея, която имате, във стикер. Но това не е достатъчно. Решихме да създадем този първи по рода си Уеб дизайнер, защото когато става въпрос за продукт, изцяло вдъхновен от въображението на клиентите, най-важното е да бъде визуализирана идеята, преди изпълнението.",
        contact: "Контакт",
        instagram: "Instagram:",
        phone: "Телефон:",
        workHours: "(само в работно време)"
      },
      // Common
      common: {
        availableColors: "Налични цветове:",
        fontUploadHint: "Може да качиш свой шрифт (TTF/OTF/WOFF). Ще се появи веднага в списъка.",
        fontUploading: "Зареждам шрифта…",
        fontAdded: "✅ Добавен шрифт: ",
        fontError: "❌ Не успях да заредя този шрифт. Опитай друг файл (woff2/ttf).",
        browserNoFonts: "Този браузър не поддържа зареждане на шрифтове директно.",
        pleaseUploadFont: "Моля качи TTF/OTF/WOFF/WOFF2 файл.",
        uploaded: "Качени",
        popular: "Популярни",
        classic: "Класически (системни)",
        cooler: "По-яки (Google)",
        extraColorsSelected: "Доп. цветове: {count} избрани",
        selectExtraColors: "Избери доп. цветове",
        base: "база",
        extra: "доп.",
        for: "за",
        additional: "дополнителни",
        cm: "см",
        euro: "€",
        copied: "📋 Копирано!",
        copyError: "❌ Не успях да копирам.",
        sending: "Изпращане...",
        sent: "✅ Заявката е изпратена!",
        sendError: "❌ Грешка при изпращане.",
        connectionError: "❌ Няма връзка / endpoint проблем.",
        noEndpoint: "⚠️ Няма formEndpoint. Добави endpoint в app.js. Междувременно: ",
        readyText: "готов надпис"
      },
      // Summary texts
      summary: {
        nadpisi: "BG STICKERS • НАДПИСИ ПО ПОРЪЧКА",
        stikeri: "BG STICKERS • СТИКЕРИ ПО ПОРЪЧКА",
        avto: "BG STICKERS • АВТО ПО ПОРЪЧКА (виж полетата)",
        print: "BG STICKERS • ПРИНТ СТИКЕР (виж полетата)",
        text: "Текст: ",
        size: "Размер: ",
        font: "Шрифт: ",
        mainColor: "Основен цвят: ",
        extraColors: "Доп. цветове: ",
        none: "няма",
        note: "Бележка: ",
        description: "Описание: ",
        price: "Цена (ориент.): "
      },
      // Popular items meta
      popularMeta: {
        textClean: "Текст • clean",
        textSport: "Текст • спорт",
        shortAggressive: "Късо • агресивно",
        shortClean: "Късо • clean",
        trackText: "Писта • текст",
        textMinimal: "Текст • минимал"
      },
      // Popular pills
      pills: {
        singleColor: "едноцветно",
        compact: "компактно",
        popular: "популярно",
        banner: "банер",
        sport: "спорт",
        minimal: "минимал",
        small: "малък",
        clean: "clean",
        universal: "универсален"
      },
      // Auto brands meta
      autoMeta: {
        windshield: "Предно стъкло",
        side: "Странично",
        rear: "Задно",
        front: "Предно"
      }
    }
  };

  // Get current language from localStorage or default to 'en'
  function getCurrentLanguage() {
    try {
      const saved = localStorage.getItem("bg_stickers_lang");
      return saved === "bg" ? "bg" : "en";
    } catch {
      return "en";
    }
  }

  // Set current language
  function setCurrentLanguage(lang) {
    try {
      localStorage.setItem("bg_stickers_lang", lang);
    } catch {}
  }

  // Get translation
  function t(path, params) {
    const lang = getCurrentLanguage();
    const keys = path.split(".");
    let value = TRANSLATIONS[lang];
    for (let i = 0; i < keys.length; i++) {
      if (value && typeof value === "object") {
        value = value[keys[i]];
      } else {
        return path; // Fallback to path if translation not found
      }
    }
    if (typeof value === "string" && params) {
      return value.replace(/\{(\w+)\}/g, function (match, key) {
        return params[key] !== undefined ? params[key] : match;
      });
    }
    return value !== undefined ? value : path;
  }

  // Expose translation functions globally
  window.TRANSLATIONS = TRANSLATIONS;
  window.getCurrentLanguage = getCurrentLanguage;
  window.setCurrentLanguage = setCurrentLanguage;
  window.t = t;
})();
