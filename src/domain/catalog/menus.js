// Menu catalog — the Korean dishes you would rather not eat alone.
//
// This is the catalog the whole product turns on. The business plan's finding
// is that a solo foreign traveller is shut out of a large part of Korean food
// not by language or price but by portion: 삼겹살 starts at two servings,
// 감자탕 arrives in a pot sized for a table, 한정식 is booked for two. The
// traveller gives up and eats something they could have eaten anywhere.
//
// So `minPeople` is not a detail here, it is the reason the app exists, and
// `whyShared` is the sentence that has to earn a stranger's afternoon. Each
// one states a fact about how the dish is cooked or served — not a claim
// about how good it is, and not a claim about any particular restaurant.
//
// Deliberately absent: prices. They move, they differ by district, and this
// project does not assert things it cannot check. A traveller told "about
// 20,000 won" who is charged 34,000 has been misled by us, not by the shop.
//
// `contains` and `varies` carry the same rule into ingredients, where getting
// it wrong costs more than money. An empty `contains` used to be the app's
// only way of saying two very different things — "checked, and there is none
// of it" for a dish that is one cut of meat, and "nobody enumerated a spread
// of twelve side dishes" for 한상. On screen they were identical: no warning
// at all. A traveller avoiding pork read silence as safety.
//
// So `varies: true` marks a dish whose accompanying spread is chosen by the
// house, on the day. It never suppresses a warning — conflicts still show —
// it adds one the app could not otherwise give: this cannot be checked in
// advance, ask before you sit down. The two dishes carrying it say so in
// their own descriptions, which is where the contradiction was found.
//
// ── The four fields, defined once (2026-09-02, when the catalogue went
//    from ten dishes to twenty-four) ──────────────────────────────────────
//
// `minPeople` — the smallest portion a shop that specialises in the dish
// will sell. Not how many people should go: 백반 and 떡볶이 are 1 and are
// here anyway, because the reason to bring somebody is in `whyShared`, not
// in this number. 육회 is 1 because 광장시장 sells a small plate to one
// person; that a 정육식당 only serves it beside a two-serving grill is a fact
// about the shop, and this field cannot carry it.
//
// `spice`, 0–3 — does the intended mouthful contain chilli. A sauce served
// alongside does not count: 산낙지's 초고추장 and 튀김's tteokbokki dip are
// in the prose, where the reader can see them, and the number stays 0.
// 족발 (0, with kimchi beside it) and 삼겹살 (0, with 쌈장) already followed
// this rule. 백반 (1, for its banchan) does not, predates the rule, and is
// left as it was rather than edited to fit.
//
// `contains` — what the dish is normally made of, in six coarse values, for
// DISPLAY. It is not an allergen tool and cannot be one: there is no value
// for egg, sesame, wheat, dairy or a dozen other things, so a list that
// looks complete is not. That is why there is NO ingredient-exclusion
// filter in this app, and why one must not be added: a filter turns an
// incomplete list into a claim of safety, and the traveller it fails is the
// one who trusted it. The list is shown; the person decides. CLAUDE.md
// rule 4 was always this.
//
// `varies` — 무엇이 함께 나오는지, 또는 무엇으로 나오는지를 레시피가 아니라
// 그 집이 정한다. 미리 확인할 수 없다는 표시다. It covers both what arrives
// beside a dish (육회's raw liver, 닭발's steamed egg) and what a dish IS when
// the name is an umbrella (which 전골, which 전). It means one thing.
//
// An empty `contains` with varies:true renders "what goes in is the house's
// call that day". Two dishes reach that state for different reasons and the
// difference is worth keeping: 해물찜 is empty because the NAME already says
// seafood and only which seafood is the house's; 전골 is empty because the
// gloss says nothing about ingredients at all. Both are honest.
//
// Prose in es/fr/ar keeps a dish or drink name romanised (jeon, makgeolli)
// because that is what a traveller says out loud, and translates a shop type
// or food category (분식집, 안주) because that is a description. zh/ja
// translate everything, and use the loanword where Japanese already has one
// (チヂミ, ユッケ, 石焼き) rather than a transliteration nobody there reads.

/**
 * When a dish is actually eaten.
 *
 * Korean food has a clock. 감자탕 is a night-shift meal and a hangover
 * breakfast; 삼겹살 is the first round of a 회식 after work. The app showed
 * the same thing at three in the afternoon and three in the morning, and
 * defaulted every table anybody opened to 19:00 regardless of the dish.
 *
 * Set on three dishes out of twenty-four, and deliberately not on the rest.
 * The rule is the one this catalog already lives under: a field here may only
 * say what the dish's own prose says. 백반's record mentions a morning, but it
 * is the morning the kitchen cooked in — not a claim about when anybody eats
 * it — so 백반 has no time. Guessing the remaining seven would be inventing
 * facts about how a country eats, which is the one thing a public-diplomacy
 * app cannot afford to get casually wrong. A test enforces it.
 */
export const EATEN_AT = {
  MORNING: 'morning',
  LUNCH: 'lunch',
  EVENING: 'evening',
  LATE: 'late',
};

/** The hour a host opening this dish most likely means. */
export const DEFAULT_HOUR = {
  [EATEN_AT.MORNING]: '09:00',
  [EATEN_AT.LUNCH]: '12:30',
  [EATEN_AT.EVENING]: '19:00',
  [EATEN_AT.LATE]: '21:30',
};

export const EATEN_AT_LABEL = {
  [EATEN_AT.MORNING]: { kr: '아침', en: 'morning', es: 'la mañana', fr: 'le matin', ar: 'الصباح', zh: '早上', ja: '朝' },
  [EATEN_AT.LUNCH]: { kr: '점심', en: 'lunch', es: 'el almuerzo', fr: 'le midi', ar: 'الغداء', zh: '中午', ja: '昼' },
  [EATEN_AT.EVENING]: { kr: '저녁', en: 'evening', es: 'la cena', fr: 'le soir', ar: 'المساء', zh: '晚上', ja: '夜' },
  [EATEN_AT.LATE]: { kr: '늦은 밤', en: 'late night', es: 'la madrugada', fr: 'la nuit', ar: 'آخر الليل', zh: '深夜', ja: '夜更け' },
};

// How the food arrives — which, on this app, is the same question as why one
// person cannot order it. A category is a chip on the card and nothing more:
// nothing filters on it (the six groups in dishGroups.js do that), so its
// only job is to describe, and a describing chip that is wrong is worse than
// none.
export const MENU_CATEGORY = {
  GRILL: 'grill',       // 구이 — cooked at the table
  STEW: 'stew',         // 찌개·전골 — one pot, many spoons
  SET: 'set',           // 한 상 — a spread of shared dishes
  // 접시 — one dish in the middle, picked from or torn at the table. The
  // label (접시 / One platter / 大皿ひとつ) always meant this; the comment
  // used to say "served whole, carved or torn", which fit 보쌈 and 족발 and
  // not 산낙지 or 떡볶이, and was widened rather than a fifth value added.
  PLATTER: 'platter',
  // 한 그릇 — one bowl, one person. The one category a dish here does not
  // share. It exists for 비빔밥 alone, because the alternative was filing a
  // single bowl under "a whole spread" and printing that on its card.
  BOWL: 'bowl',
};

/**
 * What the ingredient chips say.
 *
 * `contains` values are ids; this is the only place they become words. Until
 * 2026-09-02 the chips printed the id itself — "pork, shellfish 들어감" on a
 * Korean screen — and the audit could not see it because the value was
 * interpolated into a translated frame rather than written as a string.
 *
 * Every entry is the pair a traveller would recognise, not the classification
 * word: 새우·게류 rather than 갑각류, "shrimp & crab" rather than "shellfish".
 * The English ones are concrete too, on purpose — "shellfish" in English
 * covers molluscs, so beside "squid & octopus" it would have made both
 * ambiguous. `mollusc` was added for 산낙지, which is an octopus and not a
 * crustacean; the two uses of `shellfish` that came before it were a crab and
 * salted shrimp, so the word had only ever meant crustaceans here.
 */
export const CONTAINS_LABEL = {
  beef:      { en: 'beef',            ko: '소고기',      es: 'ternera',            fr: 'bœuf',                ar: 'لحم بقر',        zh: '牛肉',      ja: '牛肉' },
  chicken:   { en: 'chicken',         ko: '닭고기',      es: 'pollo',              fr: 'poulet',              ar: 'دجاج',           zh: '鸡肉',      ja: '鶏肉' },
  fish:      { en: 'fish',            ko: '생선',        es: 'pescado',            fr: 'poisson',             ar: 'سمك',            zh: '鱼',        ja: '魚' },
  pork:      { en: 'pork',            ko: '돼지고기',    es: 'cerdo',              fr: 'porc',                ar: 'لحم خنزير',      zh: '猪肉',      ja: '豚肉' },
  shellfish: { en: 'shrimp & crab',   ko: '새우·게류',   es: 'gambas y cangrejo',  fr: 'crevettes et crabe',  ar: 'جمبري وسلطعون',  zh: '虾蟹类',    ja: 'えび・かに' },
  mollusc:   { en: 'squid & octopus', ko: '오징어·낙지류', es: 'calamar y pulpo',  fr: 'calmar et poulpe',    ar: 'حبّار وأخطبوط',  zh: '鱿鱼·章鱼类', ja: 'イカ・タコ' },
};

export const menus = [
  {
    id: 'samgyeopsal',
    name: 'Samgyeopsal',
    // What it is, in words somebody can picture without knowing the name.
    // Testers said romanisation alone is opaque for a dish they have not met:
    // "Ganjang Gejang" carries nothing, and a descriptive English name beside
    // it does. Each one is taken from this dish's own howItWorks rather than
    // written fresh, so the short name and the long one cannot drift apart.
    gloss: "Grilled pork belly",
    glossKo:
      '구워 먹는 삼겹살',
    glossEs:
      "Panceta de cerdo a la parrilla",
    glossFr:
      "Poitrine de porc grillée",
    glossAr:
      "بطن خنزير مشوي",
    glossZh:
      "炭烤五花肉",
    glossJa:
      "豚バラの炭火焼き",
    nameKo: '삼겹살',
    romanization: 'sam-gyeop-sal',
    category: MENU_CATEGORY.GRILL,
    minPeople: 2,
    // Why a stranger is worth finding for this dish.
    whyShared:
      'Almost every grill house prices pork belly from two servings up, and the meat is cooked in the middle of the table rather than in a kitchen — somebody has to turn it while somebody else cuts.',
    whySharedKo:
      '거의 모든 고깃집이 2인분부터 값을 매기고, 고기는 주방이 아니라 식탁 한가운데서 익습니다. 누군가는 뒤집어야 하고, 누군가는 잘라야 해요.',
    whySharedEs:
      "Casi todas las parrillas cobran la panceta a partir de dos raciones, y la carne se hace en el centro de la mesa y no en una cocina: alguien tiene que darle la vuelta mientras otro la corta.",
    whySharedFr:
      "Presque tous les grills facturent la poitrine à partir de deux portions, et la viande cuit au milieu de la table plutôt qu'en cuisine : il faut quelqu'un pour la retourner pendant qu'un autre la coupe.",
    whySharedAr:
      "كل مشاوي تقريبًا تُسعّر بطن الخنزير ابتداءً من حصتين، واللحم يُطهى في وسط الطاولة لا في المطبخ — لا بد أن يقلّبه أحد بينما يقصّه آخر.",
    whySharedZh:
      "几乎每家烤肉店的五花肉都从两人份起卖，而且肉是在桌子中间烤的，不是在厨房里——总得有人翻面，有人拿剪刀剪。",
    whySharedJa:
      "サムギョプサルはほとんどの焼肉店で二人前からの値づけで、しかも肉は厨房ではなくテーブルの真ん中で焼かれます。誰かが返し、誰かがハサミで切る必要がある。",
    // What the table actually does, for a traveller who has never sat at one.
    howItWorks:
      'Raw pork belly comes to a grill set into the table. You cook it yourself, cut it with scissors, then wrap a piece in lettuce with garlic, ssamjang and rice.',
    howItWorksKo:
      '생삼겹살이 식탁에 박힌 불판 위로 나옵니다. 직접 굽고, 가위로 자르고, 상추에 마늘과 쌈장과 밥을 얹어 싸 먹습니다.',
    howItWorksEs:
      "La panceta llega cruda a una parrilla encastrada en la mesa. La cocinas tú, la cortas con tijeras y envuelves un trozo en hoja de lechuga con ajo, ssamjang y arroz.",
    howItWorksFr:
      "La poitrine arrive crue sur un gril encastré dans la table. Vous la cuisez vous-même, vous la coupez aux ciseaux, puis vous enroulez un morceau dans une feuille de laitue avec de l'ail, du ssamjang et du riz.",
    howItWorksAr:
      "يصل بطن الخنزير نيئًا إلى شواية مركّبة في الطاولة. تشويه بنفسك، وتقصّه بالمقص، ثم تلفّ قطعة في ورقة خس مع الثوم وصلصة السامجانغ والأرز.",
    howItWorksZh:
      "生五花肉端到嵌在桌上的烤盘上。你自己烤，用剪刀剪开，再夹一块放进生菜里，配上蒜片、包饭酱和米饭。",
    howItWorksJa:
      "生の豚バラがテーブルに埋め込まれた鉄板に運ばれてきます。自分で焼き、ハサミで切り、サンチュに包んでニンニクとサムジャンとご飯を添えて食べます。",
    // Sourced, or absent. See src/content/sources.js — a dish whose history
    // nobody on this team has read stays without a story rather than
    // borrowing one from a blog.
    storySources: ['encykorea-samgyeopsal'],
    story: 'The name is a description: three layers, lean and fat alternating down the belly. The older word for it was 세겹살, and dedicated samgyeopsal houses only began appearing in the late 1970s. What made it national was the 1997 financial crisis — it was the meat people could still afford, and for a while it was called IMF 삼겹살.',
    storyKo: '이름 자체가 설명입니다. 살과 비계가 번갈아 세 겹. 옛말은 세겹살이었고, 삼겹살 전문점이 생긴 것은 1970년대 후반부터입니다. 전국의 음식이 된 계기는 1997년 외환위기였어요. 그때까지도 사 먹을 수 있던 고기였고, 한동안은 IMF 삼겹살이라고 불렸습니다.',
    storyEs: 'El nombre es una descripción: tres capas, magro y grasa alternándose a lo largo de la panceta. La palabra antigua era 세겹살, y los locales dedicados al samgyeopsal no aparecieron hasta finales de los años setenta. Lo que lo hizo nacional fue la crisis financiera de 1997: era la carne que todavía se podía pagar, y durante un tiempo se la llamó IMF 삼겹살.',
    storyFr: "Le nom est une description : trois couches, le maigre et le gras alternant le long de la poitrine. Le mot ancien était 세겹살, et les maisons spécialisées ne sont apparues qu'à la fin des années 1970. Ce qui l'a rendu national, c'est la crise financière de 1997 — c'était la viande encore abordable, et on l'a appelée un temps IMF 삼겹살.",
    storyAr: 'الاسم وصف: ثلاث طبقات، لحم أحمر وشحم يتناوبان على طول البطن. الكلمة الأقدم كانت 세겹살، ولم تظهر المطاعم المتخصّصة إلا في أواخر السبعينيات. وما جعله طبقًا وطنيًّا هو أزمة عام 1997 المالية — كان اللحم الذي ما زال الناس يقدرون عليه، وسُمّي حينًا IMF 삼겹살.',
    storyZh: '这个名字本身就是描述：三层，瘦肉和肥肉在五花上一层一层交替。更早的说法是세겹살，专做삼겹살的店到1970年代末才出现。让它成为全国性食物的是1997年的金融危机——那是人们还买得起的肉，有一阵子被叫作IMF 삼겹살。',
    storyJa: '名前がそのまま説明になっています。赤身と脂が交互に重なった三つの層。古い言い方は세겹살で、サムギョプサル専門店ができたのは1970年代の終わりごろからです。全国の食べ物になったきっかけは1997年の通貨危機でした。そのときもまだ手の届いた肉で、しばらくはIMF 삼겹살と呼ばれていました。',
    themeId: 'seoul-after-dark',
    culture:
      "The grill in the middle is a job, not a decoration: somebody turns the meat, somebody cuts it, and wrapping a piece in lettuce and handing it to the person beside you is a small act of care Koreans do without mentioning it. This is the first round of a 회식 — the after-work dinner that built most Korean working relationships.",
    cultureKo:
      '가운데 불판은 장식이 아니라 할 일입니다. 누군가는 고기를 뒤집고, 누군가는 자르고, 한 점을 상추에 싸서 옆 사람에게 건네는 건 한국 사람들이 말없이 하는 작은 배려예요. 회식의 1차, 한국의 직장 관계 대부분을 만들어 온 바로 그 자리이기도 합니다.',
    cultureEs:
      "La parrilla del centro es una tarea, no un adorno: alguien voltea la carne, alguien la corta, y envolver un trozo y pasárselo al de al lado es un pequeño gesto de cuidado que los coreanos hacen sin mencionarlo. Es la primera ronda de un 회식, la cena de después del trabajo sobre la que se construyó buena parte de las relaciones laborales coreanas.",
    cultureFr:
      "Le gril au centre est une tâche, pas une décoration : quelqu'un retourne la viande, quelqu'un la coupe, et envelopper un morceau pour le tendre à son voisin est un petit geste d'attention que les Coréens font sans le dire. C'est le premier tour d'un 회식, le dîner d'après-travail sur lequel s'est bâtie une bonne part des relations professionnelles coréennes.",
    cultureAr:
      "الشواية في الوسط عمل لا زينة: أحدهم يقلّب اللحم، وآخر يقصّه، ولفّ قطعة في ورقة خس ومناولتها لمن بجانبك لفتة اعتناء صغيرة يفعلها الكوريون دون أن يسمّوها. هذه هي الجولة الأولى من 회식، عشاء ما بعد العمل الذي بُنيت عليه معظم علاقات العمل في كوريا.",
    cultureZh:
      "桌子中间那口烤盘是活儿，不是摆设：有人翻肉，有人剪肉，把一块肉包进生菜递给旁边的人，是韩国人做惯了却从不提起的小体贴。这是회식的第一轮——那种下班后的聚餐，韩国大多数同事关系都是在这上面建起来的。",
    cultureJa:
      "真ん中の鉄板は飾りではなく仕事です。誰かが肉を返し、誰かが切り、一枚をサンチュに包んで隣の人に渡す——韓国の人が口に出さずにやっている小さな気づかいです。これは회식の一次会、韓国の職場の関係の多くがそこで築かれてきた、仕事帰りの食事です。",
    contains: ['pork'],
    // 'the first round of a 회식 — the after-work dinner', in its culture note.
    eatenAt: ['evening'],
    spice: 0,
    zones: ['종로', '마포', '강남'],
  },
  {
    id: 'dakgalbi',
    name: 'Dakgalbi',
    // What it is, in words somebody can picture without knowing the name.
    // Testers said romanisation alone is opaque for a dish they have not met:
    // "Ganjang Gejang" carries nothing, and a descriptive English name beside
    // it does. Each one is taken from this dish's own howItWorks rather than
    // written fresh, so the short name and the long one cannot drift apart.
    gloss: "Chicken stir-fried at the table",
    glossKo:
      '식탁에서 볶아 먹는 닭갈비',
    glossEs:
      "Pollo salteado en la mesa",
    glossFr:
      "Poulet sauté à table",
    glossAr:
      "دجاج يُقلى على الطاولة",
    glossZh:
      "在桌上现炒的鸡肉",
    glossJa:
      "テーブルで炒める鶏肉",
    nameKo: '닭갈비',
    romanization: 'dak-gal-bi',
    category: MENU_CATEGORY.GRILL,
    minPeople: 2,
    whyShared:
      'It is stir-fried on one wide iron plate in the centre of the table, and the plate does not come in a one-person size.',
    whySharedKo:
      '식탁 한가운데 넓은 철판 하나에서 볶는데, 그 철판에는 1인분 크기가 없습니다.',
    whySharedEs:
      "Se saltea en una sola plancha ancha en el centro de la mesa, y esa plancha no existe en tamaño para una persona.",
    whySharedFr:
      "Il se fait sur une seule large plaque au centre de la table, et cette plaque n'existe pas en taille pour une personne.",
    whySharedAr:
      "يُقلى على صفيحة حديد عريضة واحدة في وسط الطاولة، والصفيحة لا تأتي بمقاس شخص واحد.",
    whySharedZh:
      "它在桌子中央一整块宽铁板上翻炒，而那块铁板没有一人份的尺寸。",
    whySharedJa:
      "テーブル中央の広い一枚の鉄板で炒めます。そしてその鉄板に一人前サイズはありません。",
    howItWorks:
      'Marinated chicken, cabbage and rice cake are fried in front of you. When the meat is gone, rice is fried in what is left in the pan — that second course is the part regulars come for.',
    howItWorksKo:
      '양념한 닭고기와 양배추, 떡을 눈앞에서 볶아 줍니다. 고기가 없어지면 남은 양념에 밥을 볶는데, 단골들이 오는 이유는 사실 그 두 번째 순서예요.',
    howItWorksEs:
      "Pollo adobado, col y pastel de arroz se saltean delante de ti. Cuando se acaba la carne, se fríe arroz con lo que queda en la plancha: ese segundo plato es al que vienen los habituales.",
    howItWorksFr:
      "Poulet mariné, chou et pâte de riz sont sautés devant vous. Quand la viande a disparu, on fait revenir du riz dans ce qui reste : ce second service est ce pour quoi les habitués viennent.",
    howItWorksAr:
      "دجاج متبّل وملفوف وكعك الأرز يُقلى أمامك. وحين ينتهي اللحم، يُقلى الأرز فيما تبقّى في المقلاة — وهذا الطبق الثاني هو ما يعود من أجله المداومون.",
    howItWorksZh:
      "腌好的鸡肉、卷心菜和年糕在你面前下锅。肉吃完之后，用锅里剩下的料炒饭——常客真正冲着来的就是这第二道。",
    howItWorksJa:
      "下味をつけた鶏肉とキャベツとトッポキ餅が目の前で炒められます。肉がなくなったら、残った汁でご飯を炒める——常連が目当てにしているのはこの二皿目のほうです。",
    storySources: ['encykorea-dakgalbi'],
    story: 'It was a tavern dish in Chuncheon at the end of the 1960s: a man named Kim Yeong-seok, who had been grilling pork, marinated chicken instead and sold it as 닭불고기. A portion cost about a hundred won, which is why the nicknames stuck — 대학생갈비, student\'s ribs, and 서민갈비, ordinary people\'s ribs. Through the 1970s it filled the back lanes behind Chuncheon\'s Myeongdong, feeding soldiers on leave and students who wanted to eat a lot for very little. Chuncheon already had the poultry farms and the slaughterhouses; the dish grew where the chickens were.',
    storyKo: '1960년대 말 춘천의 한 선술집에서 시작됐습니다. 돼지구이를 팔던 김영석이라는 사람이 대신 닭을 양념에 재워 \'닭불고기\'로 내놓은 것이 처음이었어요. 한 대에 100원쯤 했고, 그래서 별명이 붙었습니다 — \'대학생갈비\', 그리고 \'서민갈비\'. 1970년대에는 춘천 명동 뒷골목을 가득 채우며 휴가 나온 군인과 대학생들을 먹였습니다. 적은 돈으로 배불리 먹을 수 있는 음식이었으니까요. 춘천에는 이미 양계장과 도계장이 많았습니다. 이 음식은 닭이 있는 곳에서 자랐습니다.',
    storyEs: 'Fue un plato de taberna en Chuncheon a finales de los años sesenta: un hombre llamado Kim Yeong-seok, que asaba cerdo, adobó pollo en su lugar y lo vendió como 닭불고기. Una ración costaba unos cien wones, y de ahí los apodos: 대학생갈비, costillas de estudiante, y 서민갈비, costillas de la gente corriente. En los setenta llenó los callejones detrás del Myeongdong de Chuncheon, alimentando a soldados de permiso y a estudiantes que querían comer mucho por muy poco. Chuncheon ya tenía las granjas avícolas y los mataderos: el plato creció donde estaban los pollos.',
    storyFr: 'C\'était un plat de taverne à Chuncheon à la fin des années 1960 : un certain Kim Yeong-seok, qui grillait du porc, a mariné du poulet à la place et l\'a vendu sous le nom de 닭불고기. Une portion coûtait une centaine de wons, d\'où les surnoms : 대학생갈비, les côtes de l\'étudiant, et 서민갈비, les côtes du petit peuple. Dans les années 1970, il a rempli les ruelles derrière le Myeongdong de Chuncheon, nourrissant les soldats en permission et les étudiants qui voulaient manger beaucoup pour presque rien. Chuncheon avait déjà les élevages et les abattoirs : le plat a poussé là où étaient les poulets.',
    storyAr: 'بدأ طبقًا في حانة بمدينة تشوncheon أواخر الستينيات: رجل اسمه كيم يونغ-سوك، كان يشوي لحم الخنزير، فتبّل الدجاج بدلًا منه وباعه باسم 닭불고기. كانت الحصة بنحو مئة وون، ومن هنا لصقت به الألقاب — 대학생갈비 أي أضلاع الطالب، و서민갈비 أي أضلاع عامّة الناس. وفي السبعينيات ملأ الأزقّة خلف ميونغ-دونغ في تشونتشون، يُطعم الجنود في إجازاتهم والطلبة الذين أرادوا أن يشبعوا بأقلّ ما يمكن. كانت تشونتشون تملك أصلًا مزارع الدواجن والمسالخ؛ نبت الطبق حيث كان الدجاج.',
    storyZh: '1960年代末，它是春川一家小酒馆的菜：一个叫金英锡的人本来烤猪肉，改用调料腌了鸡肉，起名 닭불고기 卖。一份约一百韩元，外号就是这么来的——대학생갈비（大学生排骨）、서민갈비（平民排骨）。到了七十年代，它挤满春川明洞背后的小巷，喂饱休假的士兵和想花很少钱吃很饱的学生。春川本来就有养鸡场和屠宰场：这道菜是在鸡的旁边长起来的。',
    storyJa: '1960年代の終わり、春川の居酒屋の一品でした。豚を焼いて売っていた金英錫という人が、代わりに鶏をタレに漬けて「닭불고기」として出したのが始まりです。一人前が百ウォンほどで、だからあだ名がついた——대학생갈비（大学生カルビ）、そして 서민갈비（庶民カルビ）。1970年代には春川の明洞の裏通りを埋め、休暇の兵士と、わずかな金で腹いっぱい食べたい学生たちを養いました。春川にはすでに養鶏場と食鳥処理場がありました。この料理は、鶏のいる場所で育ったのです。',
    themeId: null,
    culture:
      "It comes from Chuncheon, where it started in the bars in the late 1960s and filled the back alleys through the 1970s — cheap enough by then that students called it 대학생갈비, student ribs. When the meat is gone the staff fry rice in what is left in the pan, and leaving before that second course is considered a waste of a good dinner.",
    cultureKo:
      '춘천에서 왔습니다. 1960년대 말 술집에서 시작해 1970년대 뒷골목을 채웠고, 그때쯤에는 값이 싸서 학생들이 대학생갈비라고 불렀어요. 고기가 다 없어지면 남은 양념에 밥을 볶아 주는데, 그 볶음밥 전에 일어서는 건 좋은 저녁을 낭비하는 일로 칩니다.',
    cultureEs:
      "Viene de Chuncheon, donde empezó en los bares a finales de los sesenta y llenó los callejones en los setenta. Para entonces era tan barato que los estudiantes lo llamaban 대학생갈비, costillas de universitario. Cuando se acaba la carne fríen arroz con lo que queda, y marcharse antes de ese segundo plato se considera desaprovechar una buena cena.",
    cultureFr:
      "Le plat vient de Chuncheon, né dans les bars à la fin des années 1960 et installé dans les ruelles au cours des années 1970. Il était alors assez bon marché pour que les étudiants l'appellent 대학생갈비, les côtes d'étudiant. Quand la viande est finie, on fait sauter du riz dans le reste de sauce, et partir avant ce second service passe pour du gâchis.",
    cultureAr:
      "أصله من تشونتشون، حيث بدأ في الحانات أواخر الستينيات وملأ الأزقة الخلفية طوال السبعينيات — وصار رخيصًا بما يكفي ليسمّيه الطلبة 대학생갈비، أضلاع الطلبة. حين ينتهي اللحم يقلي العاملون الأرز فيما تبقّى في المقلاة، والمغادرة قبل هذا الطبق الثاني تُعدّ تفريطًا في عشاء جيد.",
    cultureZh:
      "它出自春川，六十年代末从酒馆里起家，七十年代填满了后巷——那时便宜到学生管它叫대학생갈비，大学生排骨。肉吃完后店员会用锅里剩下的料炒饭，在这第二道之前离席，会被当成糟蹋了一顿好饭。",
    cultureJa:
      "春川で生まれ、六〇年代末に飲み屋から始まり、七〇年代には裏通りを埋めました。その頃には学生が대학생갈비（大学生カルビ）と呼ぶほど安かった。肉がなくなると店の人が残りでご飯を炒めてくれるので、その二皿目の前に席を立つのは、いい夕飯を無駄にしたと見なされます。",
    contains: ['chicken'],
    // 'a waste of a good dinner', in its own culture note.
    eatenAt: ['evening'],
    spice: 3,
    zones: ['춘천 명동 닭갈비골목', '신촌·신림동 대학가', '용산'],
  },
  {
    id: 'gamjatang',
    name: 'Gamjatang',
    // What it is, in words somebody can picture without knowing the name.
    // Testers said romanisation alone is opaque for a dish they have not met:
    // "Ganjang Gejang" carries nothing, and a descriptive English name beside
    // it does. Each one is taken from this dish's own howItWorks rather than
    // written fresh, so the short name and the long one cannot drift apart.
    gloss: "Pork spine and potato stew",
    glossKo:
      '돼지 등뼈와 감자를 넣고 끓인 탕',
    glossEs:
      "Guiso de espinazo de cerdo y patata",
    glossFr:
      "Ragoût d’échine de porc et de pommes de terre",
    glossAr:
      "يخنة عمود فقري خنزير وبطاطس",
    glossZh:
      "猪脊骨土豆汤",
    glossJa:
      "豚の背骨とじゃがいもの鍋",
    nameKo: '감자탕',
    romanization: 'gam-ja-tang',
    category: MENU_CATEGORY.STEW,
    minPeople: 2,
    whyShared:
      'The pot sits on a burner in the middle of the table and is ladled out by whoever is nearest. Shops list it by pot size — small is still two people.',
    whySharedKo:
      '식탁 가운데 버너 위에 냄비째 올라가고, 가까이 앉은 사람이 국자로 떠 줍니다. 가게는 냄비 크기로 파는데, 제일 작은 것도 2인용이에요.',
    whySharedEs:
      "La olla va sobre un hornillo en el centro de la mesa y la sirve quien queda más cerca. Se vende por tamaño de olla, y la pequeña sigue siendo para dos.",
    whySharedFr:
      "La marmite pose sur un réchaud au milieu de la table et c'est le plus proche qui sert. Les maisons la vendent à la taille de marmite, et la petite reste pour deux.",
    whySharedAr:
      "يوضع القِدر على موقد في وسط الطاولة ويغرف منه أقرب الجالسين. تُدرج المحلات المقاس حسب حجم القِدر — والصغير يكفي شخصين.",
    whySharedZh:
      "锅坐在桌子中间的炉子上，谁离得近谁盛。店里按锅的大小标价——最小的一锅也是两个人的量。",
    whySharedJa:
      "鍋はテーブル中央のコンロに置かれ、いちばん近い人がよそいます。店は鍋の大きさで値をつけていて、小でも二人分です。",
    howItWorks:
      'Pork spine simmered with potato and perilla leaf. You work the meat off the bone with chopsticks, and it is meant to take a while — the slowness is the meal, not an inconvenience.',
    howItWorksKo:
      '돼지 등뼈를 감자와 깻잎을 넣고 오래 끓입니다. 젓가락으로 뼈에서 살을 발라 먹는데, 원래 시간이 걸리는 음식이에요. 그 느긋함이 곧 이 식사입니다.',
    howItWorksEs:
      "Espinazo de cerdo cocido largo rato con patata y hoja de perilla. La carne se separa del hueso con los palillos; se da por hecho que será lento y algo sucio.",
    howItWorksFr:
      "Échine de porc longuement mijotée avec pommes de terre et feuilles de périlla. On détache la viande de l'os aux baguettes ; c'est censé être lent et salissant.",
    howItWorksAr:
      "عمود فقري خنزير يُطهى على نار هادئة مع البطاطس وورق البريلا. تنزع اللحم عن العظم بالعيدان؛ ومن المتوقّع أن يكون الأمر بطيئًا وفوضويًا.",
    howItWorksZh:
      "猪脊骨与土豆、紫苏叶同炖。你用筷子把肉从骨头上剔下来；这本来就该是慢的、有点狼狈的。",
    howItWorksJa:
      "豚の背骨をじゃがいもとエゴマの葉と煮込みます。箸で骨から肉を外していく——ゆっくりで、多少行儀が悪くなるのが前提の料理です。",
    storySources: ['wikipedia-gamjatang-ko'],
    story: 'Koreans argue about the potato. One account says the 감자 in the name is not the vegetable but the marrow inside the pig\'s spine; the encyclopaedia prints it and then answers it — no cut of pork is actually called 감자뼈, and the word is something some butchers use to explain what a bone is for. Several other explanations compete beside it and none has won. What is not in dispute: the dish is traced to Jeolla, reached Incheon with the labourers who built the Gyeongin railway in the 1890s, and is eaten as readily at two in the morning after drinking as at dinner.',
    storyKo: '감자를 두고 한국인들끼리도 의견이 갈립니다. 이름의 \'감자\'가 채소가 아니라 돼지 등뼈 속 척수를 가리킨다는 설이 있는데, 백과사전은 그 설을 싣고 곧바로 반박합니다 — \'감자뼈\'라는 이름의 돼지뼈는 실제로 없고, 그건 일부 정육점에서 용도를 설명하려고 쓰는 말일 뿐이라고요. 다른 설도 여럿이고 아직 어느 것도 이기지 못했습니다. 다투지 않는 사실은 이것입니다. 전라도에서 비롯됐고, 1890년대 경인선 철도를 놓던 노동자들을 따라 인천으로 퍼졌으며, 저녁으로도 새벽 두 시 해장으로도 똑같이 먹습니다.',
    storyEs: 'Los coreanos discuten sobre la patata. Una versión dice que el 감자 del nombre no es la verdura sino el tuétano del espinazo del cerdo; la enciclopedia la recoge y acto seguido la refuta: no existe ningún corte de cerdo que se llame 감자뼈, y la palabra solo la usan algunas carnicerías para explicar para qué sirve un hueso. Compiten varias explicaciones más y ninguna ha ganado. Lo que nadie discute: el plato viene de Jeolla, llegó a Incheon con los obreros que construyeron el ferrocarril de Gyeongin en la década de 1890, y se come igual a las dos de la madrugada tras beber que en la cena.',
    storyFr: 'Les Coréens ne s\'entendent pas sur la pomme de terre. Une version veut que le 감자 du nom ne soit pas le légume mais la moelle de l\'échine du porc ; l\'encyclopédie la rapporte puis la réfute — aucune découpe de porc ne s\'appelle réellement 감자뼈, et le mot n\'est employé que par certains bouchers pour expliquer à quoi sert un os. Plusieurs autres explications se disputent la place et aucune ne l\'a emporté. Ce que personne ne conteste : le plat vient du Jeolla, il a gagné Incheon avec les ouvriers du chemin de fer de Gyeongin dans les années 1890, et il se mange aussi bien à deux heures du matin après avoir bu qu\'au dîner.',
    storyAr: 'يختلف الكوريون أنفسهم على البطاطا. يقول رأيٌ إنّ كلمة 감자 في الاسم ليست الخضار بل نخاع العمود الفقري للخنزير؛ تنقل الموسوعة هذا الرأي ثم تردّ عليه — فلا وجود لقطعة لحم خنزير اسمها 감자뼈، والكلمة إنما يستعملها بعض الجزّارين لشرح فائدة العظم. وتتنازع تفسيراتٌ أخرى معه ولم يحسمه أحد. أمّا ما لا خلاف عليه: أصل الطبق من جولّا، وبلغ إنتشون مع عمّال سكة حديد كيونغين في تسعينيات القرن التاسع عشر، ويُؤكل في الثانية فجرًا بعد الشرب كما يُؤكل على العشاء.',
    storyZh: '连韩国人自己也为“土豆”争论不休。有一种说法是，名字里的 감자 不是那种蔬菜，而是猪脊骨里的骨髓；百科全书把这个说法写了出来，随即又反驳它——猪肉根本没有哪一块叫 감자뼈，这个词只是某些肉铺用来说明一根骨头是做什么用的。旁边还有好几种解释在竞争，谁也没有胜出。没有争议的是：这道菜源自全罗道，1890年代随着修建京仁铁路的工人传到仁川，晚饭吃得，凌晨两点喝完酒也吃得。',
    storyJa: 'じつは韓国人どうしでも「じゃがいも」で意見が割れます。名前の 감자 は野菜ではなく豚の背骨の中の骨髄を指す、という説があり、百科事典はそれを載せたうえで、すぐに反論します——감자뼈という名の豚の骨は実際には存在せず、それは一部の精肉店が骨の使い道を説明するために使っている言葉にすぎない、と。ほかにも説がいくつも並び、まだどれも勝っていません。争いのない事実はこうです。全羅道に始まり、1890年代に京仁線を敷いた労働者たちとともに仁川へ広がり、夕食にも、飲んだあとの午前二時にも同じように食べられます。',
    themeId: 'seoul-after-dark',
    culture:
      "Long a night-shift and market-worker meal, eaten late and slowly because the meat has to be worked off the bone by hand. It doubles as 해장 — the food Koreans eat the morning after drinking, which is its own recognised category here.",
    cultureKo:
      '오래도록 야간 노동자와 시장 사람들의 밥이었습니다. 뼈에서 살을 손으로 발라야 하니 늦게, 천천히 먹었어요. 해장 음식이기도 한데, 해장은 한국에서 그 자체로 하나의 음식 분류입니다.',
    cultureEs:
      "Durante mucho tiempo fue comida de turno de noche y de gente de mercado, comida tarde y despacio porque hay que sacar la carne del hueso a mano. También es 해장, lo que los coreanos comen la mañana después de beber, que aquí es una categoría de comida reconocida por derecho propio.",
    cultureFr:
      "Longtemps le repas des équipes de nuit et des gens de marché, mangé tard et lentement parce qu'il faut détacher la viande à la main. C'est aussi un 해장, ce que les Coréens mangent le lendemain d'une soirée arrosée — une catégorie de plat reconnue comme telle ici.",
    cultureAr:
      "كان طويلًا طعام العاملين ليلًا وعمّال السوق، يُؤكل متأخرًا وببطء لأن اللحم يحتاج أن يُنزع عن العظم باليد. وهو أيضًا 해장 — ما يأكله الكوريون في صباح اليوم التالي للشرب، وهو صنف قائم بذاته هنا.",
    cultureZh:
      "长久以来它是夜班工人和市场伙计的饭，吃得晚也吃得慢，因为肉得靠手一点点剔下来。它同时也是해장——韩国人喝酒的第二天早上要吃的东西，在这里自成一类。",
    cultureJa:
      "長らく夜勤の人や市場で働く人の食事でした。骨から手で肉を外すので、遅い時間にゆっくり食べる。同時に해장——韓国の人が飲んだ翌朝に食べるもので、ここではそれ自体がひとつの分類です。",
    contains: ['pork'],
    // Both stated in its culture note: 'eaten late and slowly', and it
    // 'doubles as 해장 — the food Koreans eat the morning after drinking'.
    eatenAt: ['late', 'morning'],
    spice: 3,
    zones: ['응암동 감자국거리'],
  },
  {
    id: 'budae-jjigae',
    name: 'Budae Jjigae',
    // What it is, in words somebody can picture without knowing the name.
    // Testers said romanisation alone is opaque for a dish they have not met:
    // "Ganjang Gejang" carries nothing, and a descriptive English name beside
    // it does. Each one is taken from this dish's own howItWorks rather than
    // written fresh, so the short name and the long one cannot drift apart.
    gloss: "Sausage and noodle army stew",
    glossKo:
      '소시지와 라면을 넣은 부대찌개',
    glossEs:
      "Guiso del ejército con salchicha y fideos",
    glossFr:
      "Ragoût de l’armée, saucisse et nouilles",
    glossAr:
      "يخنة الجيش بالنقانق والشعيرية",
    glossZh:
      "香肠泡面部队锅",
    glossJa:
      "ソーセージとラーメンの部隊鍋",
    nameKo: '부대찌개',
    romanization: 'bu-dae-jji-gae',
    category: MENU_CATEGORY.STEW,
    minPeople: 2,
    whyShared:
      'Cooked at the table in a shallow pan everyone eats out of directly, and ordered by the number of people rather than by the bowl.',
    whySharedKo:
      '식탁에서 얕은 전골 냄비 하나를 놓고 다 같이 떠먹고, 그릇 단위가 아니라 사람 수로 주문합니다.',
    whySharedEs:
      "Se cocina en la mesa en una cazuela baja de la que come todo el mundo directamente, y se pide por número de personas, no por platos.",
    whySharedFr:
      "Il cuit à table dans une sauteuse peu profonde où tout le monde pioche directement, et il se commande au nombre de convives, pas au bol.",
    whySharedAr:
      "تُطهى على الطاولة في مقلاة ضحلة يأكل منها الجميع مباشرة، وتُطلب بعدد الأشخاص لا بالصحن.",
    whySharedZh:
      "在桌上一口浅锅里现煮，大家直接从锅里吃，而且按人数点，不按碗点。",
    whySharedJa:
      "テーブルの浅い鍋で煮て、全員がそこから直接食べます。注文は人数単位で、一杯単位ではありません。",
    howItWorks:
      'A stew built after the Korean War from what American bases had to spare — spam, sausage, baked beans — over a Korean broth. Instant noodles go in near the end.',
    howItWorksKo:
      '한국전쟁 뒤 미군 부대에서 남던 것들 — 스팸, 소시지, 콩 통조림 — 을 한국식 육수에 넣어 만든 찌개입니다. 라면 사리는 마지막쯤에 들어가요.',
    howItWorksEs:
      "Un guiso montado después de la Guerra de Corea con lo que sobraba en las bases estadounidenses — spam, salchichas, alubias en salsa — sobre un caldo coreano. Los fideos instantáneos entran casi al final.",
    howItWorksFr:
      "Un ragoût monté après la guerre de Corée avec ce dont les bases américaines avaient de trop — spam, saucisses, haricots en conserve — sur un bouillon coréen. Les nouilles instantanées arrivent vers la fin.",
    howItWorksAr:
      "يخنة بُنيت بعد الحرب الكورية ممّا كان يفيض عن القواعد الأمريكية — سبام ونقانق وفاصولياء معلّبة — فوق مرق كوري. وتُضاف الشعيرية سريعة التحضير قرب النهاية.",
    howItWorksZh:
      "朝鲜战争后用美军基地富余的东西搭起来的一锅——午餐肉、香肠、焗豆——底下是韩式高汤。方便面在最后才下。",
    howItWorksJa:
      "朝鮮戦争のあと、米軍基地の余りものから組み立てられた鍋——スパム、ソーセージ、ベイクドビーンズ——を韓国の出汁で。インスタントラーメンは最後のほうで入ります。",
    storySources: ['encykorea-budae'],
    story: 'The name is literally \'army-base stew\', and it means what it says: after the Korean War the food that could be had near an American base — ham, sausage, bacon, tinned beans — went into a Korean pot with kimchi and chilli. For a while it was also called 존슨탕, Johnson soup, after the American president of the day. Uijeongbu is where it settled: a woman named Heo Gi-suk was selling it from a street cart there from 1960 and registered the shop as 오뎅식당 in 1968, and the street around her is now the 부대찌개 거리. A dish made of what one country had spare, cooked the way another country cooks.',
    storyKo: '이름 그대로 \'부대(部隊)찌개\'입니다. 한국전쟁 뒤 미군 부대 근처에서 구할 수 있던 것들 — 햄, 소시지, 베이컨, 통조림 콩 — 이 김치와 고춧가루가 든 한국 냄비로 들어갔습니다. 한동안은 \'존슨탕\'이라고도 불렸어요. 당시 미국 대통령의 성을 딴 이름입니다. 자리를 잡은 곳은 의정부였습니다. 허기숙이라는 분이 1960년부터 그곳에서 포장마차로 팔았고 1968년에 \'오뎅식당\'으로 상호를 냈는데, 그 일대가 지금의 부대찌개 거리입니다. 한 나라에 남아돌던 것으로 만들어, 다른 나라의 방식으로 끓인 음식입니다.',
    storyEs: 'El nombre significa literalmente \'guiso de base militar\', y quiere decir exactamente eso: tras la Guerra de Corea, lo que se conseguía cerca de una base estadounidense —jamón, salchicha, bacon, alubias de lata— fue a parar a una olla coreana con kimchi y guindilla. Durante un tiempo se llamó también 존슨탕, sopa Johnson, por el presidente estadounidense de entonces. Se asentó en Uijeongbu: una mujer llamada Heo Gi-suk lo vendía allí desde un carrito desde 1960 y registró el local como 오뎅식당 en 1968; la calle a su alrededor es hoy la 부대찌개 거리. Un plato hecho con lo que a un país le sobraba, cocinado como cocina otro.',
    storyFr: 'Le nom signifie littéralement « ragoût de base militaire », et c\'est exactement cela : après la guerre de Corée, ce qu\'on trouvait près d\'une base américaine — jambon, saucisse, bacon, haricots en conserve — est allé dans une marmite coréenne avec du kimchi et du piment. On l\'a un temps appelé aussi 존슨탕, la soupe Johnson, du nom du président américain de l\'époque. Il s\'est fixé à Uijeongbu : une femme nommée Heo Gi-suk le vendait d\'une carriole dès 1960 et a enregistré son établissement sous le nom de 오뎅식당 en 1968 ; la rue autour d\'elle est aujourd\'hui la 부대찌개 거리. Un plat fait de ce qu\'un pays avait en trop, cuisiné à la manière d\'un autre.',
    storyAr: 'الاسم حرفيًّا «يخنة القاعدة العسكرية»، ويعني ما يقوله: بعد الحرب الكورية، ما كان يمكن الحصول عليه قرب قاعدة أمريكية — لحم مقدَّد ونقانق وبيكون وفاصولياء معلّبة — دخل قِدرًا كوريّة مع الكيمتشي والفلفل. وسُمّي زمنًا 존슨탕، «حساء جونسون»، نسبةً إلى الرئيس الأمريكي آنذاك. واستقرّ في أويجونغبو: امرأة اسمها هُو غي-سوك كانت تبيعه هناك من عربة منذ 1960 وسجّلت المحلّ باسم 오뎅식당 سنة 1968، والشارع حولها هو اليوم 부대찌개 거리. طبقٌ صُنع ممّا فاض عن بلد، وطُبخ على طريقة بلد آخر.',
    storyZh: '名字直译就是“部队汤”，意思也正是如此：朝鲜战争之后，在美军基地附近能弄到的东西——火腿、香肠、培根、罐头豆子——被放进了加了泡菜和辣椒的韩国锅里。有一阵子它还叫 존슨탕（约翰逊汤），取自当时的美国总统。它落脚在议政府：一位叫许基淑的women从1960年起在那里推车卖，1968年把店注册为 오뎅식당，她周围的那条街如今就是 부대찌개 거리。用一个国家多出来的东西做成，按另一个国家的方式煮出来的一道菜。',
    storyJa: '名前はそのまま「部隊チゲ」。意味も文字どおりです。朝鮮戦争のあと、米軍基地の近くで手に入るもの——ハム、ソーセージ、ベーコン、豆の缶詰——が、キムチと唐辛子の入った韓国の鍋に入りました。一時期は「존슨탕（ジョンソン湯）」とも呼ばれました。当時のアメリカ大統領の名前です。根を下ろしたのは議政府でした。ホ・ギスクという人が1960年からそこで屋台で売り、1968年に「오뎅식당」として店を登録します。その一帯が、いまの 부대찌개 거리 です。ある国で余っていたもので作り、別の国のやり方で煮た料理です。',
    themeId: null,
    culture:
      "Built after the Korean War around Uijeongbu, from surplus the American bases had and Korean kitchens did not: spam, sausage, baked beans. A dish assembled out of scarcity became one the country now eats by choice, which is roughly the shape of post-war Korea in a single pan.",
    cultureKo:
      '한국전쟁 뒤 의정부에서, 미군 부대에는 있고 한국 부엌에는 없던 것들로 만들어졌습니다. 스팸, 소시지, 콩 통조림. 궁핍에서 조립된 음식이 이제는 일부러 찾아 먹는 음식이 되었는데, 그게 대략 전후 한국의 모양이기도 합니다.',
    cultureEs:
      "Nació tras la Guerra de Corea en Uijeongbu, con los excedentes que tenían las bases estadounidenses y no las cocinas coreanas: spam, salchichas, alubias. Un plato montado desde la escasez que hoy el país come por gusto, que es más o menos la forma de la Corea de posguerra en una sola cazuela.",
    cultureFr:
      "Né après la guerre de Corée à Uijeongbu, avec les surplus qu'avaient les bases américaines et que les cuisines coréennes n'avaient pas : spam, saucisses, haricots. Un plat assemblé dans la pénurie que le pays mange aujourd'hui par choix — soit à peu près la forme de la Corée d'après-guerre dans une seule sauteuse.",
    cultureAr:
      "بُنيت بعد الحرب الكورية حول أويجونغبو، من فائض كان لدى القواعد الأمريكية ولم يكن لدى المطابخ الكورية: سبام، نقانق، فاصولياء معلّبة. طبق جُمع من شحّ صار البلد يأكله اليوم عن اختيار، وهذا تقريبًا شكل كوريا بعد الحرب في مقلاة واحدة.",
    cultureZh:
      "它是朝鲜战争后在议政府一带搭起来的，用的是美军基地有而韩国厨房没有的东西：午餐肉、香肠、焗豆。一道从匮乏里拼出来的菜，如今整个国家主动去吃——这大致就是战后韩国的形状，装在一口锅里。",
    cultureJa:
      "朝鮮戦争のあと議政府のあたりで、米軍基地にはあって韓国の台所にはなかったものから組み立てられました。スパム、ソーセージ、ベイクドビーンズ。欠乏から寄せ集められた料理を、いま国じゅうが自分から選んで食べている——戦後の韓国の形が、ひとつの鍋にそのまま入っています。",
    contains: ['pork', 'beef'],
    spice: 3,
    zones: ['의정부 부대찌개거리', '남영동 먹자골목'],
  },
  {
    id: 'bossam',
    name: 'Bossam',
    // What it is, in words somebody can picture without knowing the name.
    // Testers said romanisation alone is opaque for a dish they have not met:
    // "Ganjang Gejang" carries nothing, and a descriptive English name beside
    // it does. Each one is taken from this dish's own howItWorks rather than
    // written fresh, so the short name and the long one cannot drift apart.
    gloss: "Boiled pork you wrap in cabbage",
    glossKo:
      '삶은 고기를 배추에 싸 먹는 보쌈',
    glossEs:
      "Cerdo cocido para envolver en col",
    glossFr:
      "Porc bouilli à envelopper dans du chou",
    glossAr:
      "لحم خنزير مسلوق تلفّه في الملفوف",
    glossZh:
      "水煮猪肉，用白菜叶包着吃",
    glossJa:
      "茹で豚を白菜で包んで食べる",
    nameKo: '보쌈',
    romanization: 'bo-ssam',
    category: MENU_CATEGORY.PLATTER,
    minPeople: 2,
    whyShared:
      'It arrives as one platter of sliced pork with a pile of leaves and a bowl of kimchi to build from. The smallest platter on most menus feeds two.',
    whySharedKo:
      '수육 한 접시에 잎채소 한 무더기와 김치 한 보시기가 함께 나와서 직접 싸 먹습니다. 메뉴판에서 제일 작은 접시가 대개 2인분이에요.',
    whySharedEs:
      "Llega como una fuente de cerdo en lonchas con una pila de hojas y un cuenco de kimchi para montarlo tú. La fuente más pequeña de casi cualquier carta da para dos.",
    whySharedFr:
      "Il arrive en un plat de porc tranché avec un tas de feuilles et un bol de kimchi pour que vous montiez vous-même. Le plus petit plat de la plupart des cartes nourrit deux personnes.",
    whySharedAr:
      "يصل في طبق واحد من شرائح لحم الخنزير مع كومة أوراق وصحن كيمتشي تبني منه. وأصغر طبق في معظم القوائم يكفي شخصين.",
    whySharedZh:
      "它上桌是一大盘切好的猪肉，配一摞菜叶和一碗泡菜让你自己搭。大多数菜单上最小的那盘也够两个人。",
    whySharedJa:
      "スライスした豚肉が一皿、葉の山とキムチの器と一緒に来て、自分で組み立てます。たいていの店でいちばん小さい皿が二人分です。",
    howItWorks:
      'Boiled pork belly, served cool, that you wrap yourself in napa cabbage with radish salad and salted shrimp.',
    howItWorksKo:
      '삶아서 식힌 삼겹살을 배추에 무생채, 새우젓과 함께 직접 싸 먹습니다.',
    howItWorksEs:
      "Panceta cocida y servida templada, que envuelves tú mismo en col china con ensalada de rábano y camarón salado.",
    howItWorksFr:
      "Poitrine de porc bouillie, servie tiède, que vous enroulez vous-même dans du chou chinois avec une salade de radis et de la crevette salée.",
    howItWorksAr:
      "بطن خنزير مسلوق يُقدَّم باردًا، تلفّه بنفسك في ملفوف نابا مع سلطة الفجل والروبيان المملّح.",
    howItWorksZh:
      "水煮五花肉，放凉了上桌，你自己用大白菜叶包起来，加上萝卜丝和虾酱。",
    howItWorksJa:
      "茹でた豚バラを冷まして出し、白菜に大根の和えものとアミの塩辛と一緒に自分で包みます。",
    storySources: ['wikipedia-bossam-ko'],
    story: 'The 보 in the name is 보자기, the cloth Koreans wrap things in — and that is the instruction. Nothing arrives wrapped; you do the wrapping, leaf by leaf, one piece at a time. It belongs to 김장, the late-autumn making of a winter\'s kimchi: households provided pork for the people who came to help, and it was eaten with the kimchi they had just made, still unfermented. That is why the version with raw oysters beside it is the one people queue for — it is the dish still keeping the season it came from.',
    storyKo: '이름의 \'보\'는 보자기입니다. 그리고 그게 곧 먹는 방법이에요. 싸여서 나오는 건 없고, 한 장씩 직접 쌉니다. 이 음식은 김장에 속합니다. 겨울 김치를 담그러 온 사람들에게 집에서 돼지고기를 내주었고, 그날 갓 담근 아직 익지 않은 김치와 함께 먹었어요. 굴을 곁들인 굴보쌈에 줄을 서는 이유가 여기 있습니다. 이 음식은 여전히 자기가 나온 계절을 지키고 있습니다.',
    storyEs: 'El 보 del nombre es 보자기, el paño con el que los coreanos envuelven las cosas, y eso mismo es la instrucción. Nada llega envuelto: envuelves tú, hoja a hoja, trozo a trozo. Pertenece al 김장, la elaboración otoñal del kimchi de invierno: las casas ponían el cerdo para quienes venían a ayudar, y se comía con el kimchi recién hecho, todavía sin fermentar. Por eso la versión con ostras crudas al lado es por la que se hace cola: el plato sigue guardando la estación de la que viene.',
    storyFr: 'Le 보 du nom, c\'est 보자기, le tissu dans lequel les Coréens enveloppent les choses — et c\'est là le mode d\'emploi. Rien n\'arrive enveloppé : c\'est vous qui enveloppez, feuille après feuille, morceau après morceau. Le plat appartient au 김장, la confection automnale du kimchi d\'hiver : les maisons fournissaient le porc à ceux qui venaient aider, et on le mangeait avec le kimchi tout juste fait, pas encore fermenté. D\'où la file d\'attente pour la version aux huîtres crues : le plat garde encore la saison dont il vient.',
    storyAr: 'حرف 보 في الاسم هو 보자기، القماشة التي يلفّ بها الكوريون الأشياء — وهي نفسها التعليمات. لا شيء يصل ملفوفًا؛ أنت من يلفّ، ورقةً ورقة، وقطعةً قطعة. الطبق ينتمي إلى 김장، صناعة كيمتشي الشتاء في أواخر الخريف: كانت البيوت تقدّم لحم الخنزير لمن يأتي للمساعدة، ويُؤكل مع الكيمتشي الذي صُنع لتوّه ولم يختمر بعد. ولهذا يقف الناس في الصفّ من أجل النسخة التي يُقدَّم معها المحار النيّئ — الطبق ما زال يحفظ الموسم الذي جاء منه.',
    storyZh: '名字里的 보 就是 보자기，韩国人用来包东西的那块布——这也正是吃法。没有什么是包好端上来的；包是你自己做的，一片叶子一次，一块肉一次。它属于 김장，深秋腌一冬天的泡菜：人家把猪肉拿出来给来帮忙的人，配着当天刚腌好、还没发酵的泡菜一起吃。所以配生蚝的那一版才要排队——这道菜到今天还守着它出生的那个季节。',
    storyJa: '名前の 보 は 보자기、韓国で物を包むあの布のことです。そしてそれが、そのまま食べ方でもあります。包まれて出てくるものは何もなく、包むのは自分。葉を一枚ずつ、肉を一切れずつ。この料理は 김장 に属します。冬の分のキムチを漬ける晩秋、手伝いに来た人たちのために家が豚肉を出し、その日に漬けたばかりの、まだ発酵していないキムチと一緒に食べました。生牡蠣を添えた一皿に行列ができるのは、そのためです。この料理は、いまも生まれた季節を手放していません。',
    themeId: null,
    culture:
      "Traditionally eaten on 김장 day, when families gather to make a winter's worth of kimchi together — UNESCO lists that gathering as intangible cultural heritage. The pork is what the household eats standing up, wrapped in leaves, while the work is still going on.",
    cultureKo:
      '전통적으로 김장하는 날 먹었습니다. 가족이 모여 한 겨울치 김치를 담그는 그 자리요 — 유네스코는 김장을 무형문화유산으로 올려 두었습니다. 보쌈은 일이 아직 끝나지 않았을 때 선 채로 잎에 싸서 먹던 고기예요.',
    cultureEs:
      "Se comía tradicionalmente el día del 김장, cuando las familias se juntan a hacer el kimchi de todo el invierno; la UNESCO reconoce esa reunión como patrimonio inmaterial. El cerdo es lo que la casa come de pie, envuelto en hojas, mientras el trabajo sigue.",
    cultureFr:
      "Traditionnellement mangé le jour du 김장, quand les familles se réunissent pour préparer le kimchi de tout l'hiver — l'UNESCO inscrit ce rassemblement au patrimoine immatériel. Le porc est ce que la maisonnée mange debout, roulé dans une feuille, pendant que le travail continue.",
    cultureAr:
      "يُؤكل تقليديًا في يوم 김장، حين تجتمع العائلات لصنع كيمتشي شتاء كامل معًا — وتدرج اليونسكو هذا الاجتماع تراثًا ثقافيًا غير مادي. ولحم الخنزير هو ما يأكله البيت واقفًا، ملفوفًا في الأوراق، بينما العمل ما زال جاريًا.",
    cultureZh:
      "传统上它是김장那天吃的——一家人聚在一起腌够一冬天的泡菜，联合国教科文组织把这场聚会列为非物质文化遗产。而这盘猪肉，是活儿还没干完时，一家人站着用菜叶包着吃的东西。",
    cultureJa:
      "伝統的には김장の日に食べます。一家が集まってひと冬分のキムチを漬ける日で、その集まりはユネスコの無形文化遺産に登録されています。豚肉は、まだ作業が続いているあいだに、立ったまま葉に包んで食べるものです。",
    contains: ['pork', 'shellfish'],
    spice: 1,
    zones: ['종로3가 보쌈골목'],
  },
  {
    id: 'jokbal',
    name: 'Jokbal',
    // What it is, in words somebody can picture without knowing the name.
    // Testers said romanisation alone is opaque for a dish they have not met:
    // "Ganjang Gejang" carries nothing, and a descriptive English name beside
    // it does. Each one is taken from this dish's own howItWorks rather than
    // written fresh, so the short name and the long one cannot drift apart.
    gloss: "Braised pig trotter, sliced",
    glossKo:
      '간장에 조려 썬 족발',
    glossEs:
      "Manita de cerdo estofada, en lonchas",
    glossFr:
      "Pied de porc braisé, en tranches",
    glossAr:
      "كوارع خنزير مطهوّة ومقطّعة",
    glossZh:
      "卤猪蹄，切片上桌",
    glossJa:
      "豚足の醤油煮、スライス",
    nameKo: '족발',
    romanization: 'jok-bal',
    category: MENU_CATEGORY.PLATTER,
    minPeople: 2,
    whyShared:
      'Sold by the whole trotter. There is no half order, and a whole one defeats one person.',
    whySharedKo:
      '족 한 짝 단위로 팝니다. 반 개 주문은 없고, 한 짝은 혼자서 감당이 안 돼요.',
    whySharedEs:
      "Se vende por manita entera. No hay media ración, y una entera puede con una sola persona.",
    whySharedFr:
      "Il se vend au pied entier. Il n'y a pas de demi-portion, et un pied entier vient à bout d'une personne seule.",
    whySharedAr:
      "تُباع بالكارع كاملًا. لا يوجد نصف طلب، والكارع الكامل يغلب شخصًا واحدًا.",
    whySharedZh:
      "按整只猪蹄卖。没有半份，而一整只，一个人是吃不完的。",
    whySharedJa:
      "豚足まるごとで売られます。半分という注文はなく、一本は一人には多すぎます。",
    howItWorks:
      'Pig trotter braised in soy, cinnamon and ginger until the skin turns to gelatin, then sliced and eaten wrapped in leaves.',
    howItWorksKo:
      '돼지 족을 간장, 계피, 생강에 껍질이 젤라틴이 될 때까지 조린 뒤 썰어서 쌈에 싸 먹습니다.',
    howItWorksEs:
      "Manita de cerdo estofada en soja, canela y jengibre hasta que la piel se vuelve gelatina; después se lonchea y se come envuelta en hojas.",
    howItWorksFr:
      "Pied de porc braisé à la sauce soja, à la cannelle et au gingembre jusqu'à ce que la peau devienne gélatine, puis tranché et mangé enroulé dans des feuilles.",
    howItWorksAr:
      "كارع خنزير يُطهى في الصويا والقرفة والزنجبيل حتى يصير الجلد جيلاتينًا، ثم يُقطَّع ويُؤكل ملفوفًا في الأوراق.",
    howItWorksZh:
      "猪蹄用酱油、桂皮和姜卤到皮变成胶质，然后切片，用菜叶包着吃。",
    howItWorksJa:
      "豚足を醤油とシナモンと生姜で、皮がゼラチンになるまで煮てからスライスし、葉に包んで食べます。",
    storySources: ['encykorea-jokbal'],
    story: 'Jangchung-dong has a jokbal street because people who could not go home settled there. Refugees from the North came to that part of Seoul during the Korean War, and in 1961 two of them — Jeon Seung-suk and Kim Jeong-yeon — opened a shop together and called it 평안도집, the Pyeongan Province house, after the province they had left. Six years later they parted and each kept her own: 뚱뚱이할머니집 and 평남할머니집. The trotter is boiled soft with garlic, ginger, rice wine and doenjang, then simmered again in soy. Front foot and back foot are not the same: one is chewier, one softer, and regulars have a side.',
    storyKo: '장충동에 족발 골목이 있는 것은, 고향에 돌아갈 수 없던 사람들이 그곳에 자리 잡았기 때문입니다. 한국전쟁 때 이북에서 내려온 실향민들이 서울 그 일대에 정착했고, 1961년 그중 두 분 — 전승숙과 김정연 — 이 함께 가게를 열어 \'평안도집\'이라 이름 붙였습니다. 떠나온 도(道)의 이름이었어요. 6년 뒤 두 분은 갈라서 각자의 가게를 지켰습니다. 뚱뚱이할머니집과 평남할머니집입니다. 족발은 마늘·생강·청주·된장을 넣고 살이 무르도록 푹 삶은 뒤, 간장에 다시 조립니다. 앞발과 뒷발은 다릅니다. 하나는 쫀득하고 하나는 부드러워서, 단골들은 저마다 편이 있습니다.',
    storyEs: 'Jangchung-dong tiene una calle de jokbal porque allí se instalaron personas que no podían volver a casa. Refugiados del Norte llegaron a esa parte de Seúl durante la Guerra de Corea, y en 1961 dos de ellas —Jeon Seung-suk y Kim Jeong-yeon— abrieron juntas un local y lo llamaron 평안도집, la casa de la provincia de Pyeongan, por la provincia que habían dejado. Seis años después se separaron y cada una conservó el suyo: 뚱뚱이할머니집 y 평남할머니집. La pata se cuece hasta ablandarse con ajo, jengibre, vino de arroz y doenjang, y luego se glasea en salsa de soja. La delantera y la trasera no son iguales: una es más gomosa, la otra más tierna, y los clientes habituales tienen su bando.',
    storyFr: 'Jangchung-dong a une rue du jokbal parce que des gens qui ne pouvaient plus rentrer chez eux s\'y sont installés. Des réfugiés du Nord sont arrivés dans ce quartier de Séoul pendant la guerre de Corée, et en 1961 deux d\'entre elles — Jeon Seung-suk et Kim Jeong-yeon — ont ouvert ensemble une boutique qu\'elles ont appelée 평안도집, la maison de la province de Pyeongan, du nom de la province qu\'elles avaient quittée. Six ans plus tard, elles se sont séparées et chacune a gardé la sienne : 뚱뚱이할머니집 et 평남할머니집. Le pied est bouilli jusqu\'à tendreté avec ail, gingembre, alcool de riz et doenjang, puis laqué à la sauce soja. Avant et arrière ne se valent pas : l\'un est plus élastique, l\'autre plus fondant, et les habitués ont leur camp.',
    storyAr: 'في جانغتشونغ-دونغ شارعٌ لأقدام الخنزير لأنّ من لم يستطيعوا العودة إلى ديارهم استقرّوا هناك. جاء لاجئون من الشمال إلى ذلك الحيّ من سول أثناء الحرب الكورية، وفي 1961 فتحت اثنتان منهم — جون سونغ-سوك وكيم جونغ-يون — محلًّا معًا وسمّتاه 평안도집، «بيت مقاطعة بيونغان»، باسم المقاطعة التي تركتاها. وبعد ستّ سنوات افترقتا واحتفظت كلٌّ بمحلّها: 뚱뚱이할머니집 و평남할머니집. تُسلق القدم حتى تلين مع الثوم والزنجبيل ونبيذ الأرز والدوينجانغ، ثم تُطهى ثانيةً في الصويا. والقدم الأمامية غير الخلفية: إحداهما أشدّ مضغًا والأخرى أطرى، ولروّاد المحلّ في ذلك رأي.',
    storyZh: '奖忠洞有一条猪脚街，是因为回不了家的人在那里落了脚。朝鲜战争期间，从北方南下的失乡民在首尔那一带定居下来，1961年，其中两位——全承淑和金贞연——合开了一家店，取名 평안도집（平安道家），用的是她们离开的那个道的名字。六年后两人分开，各自守着自己的店：뚱뚱이할머니집 和 평남할머니집。猪脚要加蒜、姜、料酒和大酱煮到软烂，再用酱油卤一次。前蹄和后蹄不一样：一个更弹牙，一个更软，常客各有各的偏爱。',
    storyJa: '奨忠洞にチョッパルの路地があるのは、故郷に帰れなかった人たちがそこに落ち着いたからです。朝鮮戦争のとき北から南へ来た失郷民がソウルのその一帯に住みつき、1961年、そのうちの二人——チョン・スンスクとキム・ジョンヨン——が一緒に店を開き、「평안도집（平安道の家）」と名づけました。離れてきた道の名です。六年後に二人は分かれ、それぞれの店を守りました。뚱뚱이할머니집 と 평남할머니집 です。豚足はニンニク、生姜、清酒、テンジャンを入れて柔らかくなるまで茹で、それから醤油で煮つめます。前足と後足は同じではありません。片方は歯ごたえがあり、片方は柔らかく、常連にはそれぞれ贔屓があります。',
    themeId: 'seoul-after-dark',
    culture:
      "The Jangchung-dong alley that made it famous was built by families displaced by the Korean War. It is 야식 food — the late meal ordered to a home or an office after everything else has closed, and almost never eaten by one person.",
    cultureKo:
      '족발로 유명해진 장충동 골목은 한국전쟁으로 터전을 잃은 사람들이 만들었습니다. 야식 음식이에요. 다른 데가 다 닫은 뒤 집이나 사무실로 시키는 늦은 끼니이고, 혼자 먹는 일은 거의 없습니다.',
    cultureEs:
      "El callejón de Jangchung-dong que lo hizo famoso lo levantaron familias desplazadas por la Guerra de Corea. Es comida de 야식: la cena tardía que se pide a casa o a la oficina cuando ya ha cerrado todo lo demás, y casi nunca la come una sola persona.",
    cultureFr:
      "La ruelle de Jangchung-dong qui l'a rendu célèbre a été bâtie par des familles déplacées par la guerre de Corée. C'est un plat de 야식 : le repas tardif qu'on fait livrer chez soi ou au bureau quand tout le reste a fermé, et presque jamais mangé seul.",
    cultureAr:
      "الزقاق في جانغتشونغ-دونغ الذي جعله مشهورًا بنته عائلات شرّدتها الحرب الكورية. وهو طعام 야식 — الوجبة المتأخرة التي تُطلب إلى بيت أو مكتب بعد أن يُغلق كل شيء آخر، ولا يأكلها شخص واحد إلا نادرًا.",
    cultureZh:
      "让它出名的奖忠洞那条巷子，是被朝鲜战争赶出家园的人们建起来的。它属于야식——别的都打烊之后，叫到家里或办公室的那顿夜宵，而且几乎从来不是一个人吃的。",
    cultureJa:
      "これを有名にした奨忠洞の路地は、朝鮮戦争で家を失った人たちがつくったものです。야식——ほかの店が閉まったあとに家や職場へ届けてもらう遅い食事で、一人で食べることはまずありません。",
    contains: ['pork'],
    spice: 0,
    zones: ['장충동 족발골목', '공덕동 족발골목'],
  },
  {
    id: 'ganjang-gejang',
    name: 'Ganjang Gejang',
    // What it is, in words somebody can picture without knowing the name.
    // Testers said romanisation alone is opaque for a dish they have not met:
    // "Ganjang Gejang" carries nothing, and a descriptive English name beside
    // it does. Each one is taken from this dish's own howItWorks rather than
    // written fresh, so the short name and the long one cannot drift apart.
    gloss: "Raw crab cured in soy sauce",
    glossKo:
      '간장게장',
    glossEs:
      "Cangrejo crudo curado en salsa de soja",
    glossFr:
      "Crabe cru mariné à la sauce soja",
    glossAr:
      "سلطعون نيء منقوع في صلصة الصويا",
    glossZh:
      "生蟹用酱油腌成",
    glossJa:
      "生のカニを醤油に漬けたもの",
    nameKo: '간장게장',
    romanization: 'gan-jang-ge-jang',
    category: MENU_CATEGORY.SET,
    minPeople: 2,
    whyShared:
      'Served as a set with rice and a spread of side dishes, priced per crab and usually listed from two people up.',
    whySharedKo:
      '밥과 여러 반찬을 곁들인 한 상으로 나오고, 게 마리 수로 값을 매기며 보통 2인분부터 적혀 있습니다.',
    whySharedEs:
      "Se sirve como menú, con arroz y una tanda de guarniciones, se cobra por cangrejo y suele estar en la carta a partir de dos personas.",
    whySharedFr:
      "Il se sert en menu, avec du riz et une série d'accompagnements, se facture au crabe et figure généralement à la carte à partir de deux personnes.",
    whySharedAr:
      "يُقدَّم طقمًا مع الأرز وفرشة من الأطباق الجانبية، ويُسعّر بالسلطعونة وعادةً يُدرج من شخصين فأكثر.",
    whySharedZh:
      "按套上桌，配米饭和一摞小菜，按只计价，通常从两人份起。",
    whySharedJa:
      "ご飯とおかず一式のセットで、カニ一杯いくらの値づけ。たいてい二人前からの表示です。",
    howItWorks:
      'Ganjang-gejang is crab cured in soy sauce, never cooked. It is eaten by hand, and the shell is meant to be filled with rice at the end — that last mouthful is the point of the dish.',
    howItWorksKo:
      '간장게장은 게를 간장에 담가 삭힌 것으로, 익히지 않습니다. 손으로 먹고, 마지막에 등딱지에 밥을 비벼 먹으라고 남겨 두는데 — 그 마지막 한 입이 이 음식의 핵심이에요.',
    howItWorksEs:
      "Cangrejo crudo curado en salsa de soja. Se come con las manos, y el caparazón está pensado para llenarlo de arroz al final: ese último bocado es el sentido del plato.",
    howItWorksFr:
      "Du crabe cru mariné dans la sauce soja. On le mange avec les doigts, et la carapace est faite pour être remplie de riz à la fin : cette dernière bouchée est tout le propos du plat.",
    howItWorksAr:
      "سلطعون نيء منقوع في صلصة الصويا. تأكله بيديك، ويُفترض أن يُملأ الصدف بالأرز في النهاية — تلك اللقمة الأخيرة هي مقصد الطبق.",
    howItWorksZh:
      "生蟹用酱油腌制。你用手吃，最后蟹壳是要拿来盛米饭的——那最后一口才是这道菜的意思所在。",
    howItWorksJa:
      "生のカニを醤油に漬けたもの。手で食べ、最後に甲羅にご飯を入れるのが前提です——その最後のひと口がこの料理の眼目です。",
    storySources: ['wikipedia-gejang-ko'],
    story: 'A wooden slip reading 게젓 — crab pickle — was raised from a ship that sank off Mado in 1208, which puts soy-cured crab in Korea before most of what is now called Korean food. Joseon cookbooks carry it too. The nickname the language gave it is 밥도둑, the rice thief: not that it is good, but that it will make you eat far more rice than you meant to. Nothing is cooked. The crab is cured raw in soy, and which crab depends on where you are.',
    storyKo: '1208년 마도 앞바다에 가라앉은 배에서 \'게젓\'이라 적힌 죽간이 나왔습니다. 지금 한식이라 부르는 것 대부분보다 간장게장이 앞선다는 뜻입니다. 조선의 조리서에도 실려 있고요. 한국어가 이 음식에 붙여준 별명은 \'밥도둑\'입니다. 맛있다는 말이 아니라, 먹으려던 것보다 밥을 훨씬 많이 먹게 만든다는 뜻이에요. 익히지 않습니다. 게를 날로 간장에 담가 삭히고, 어떤 게를 쓰는지는 지역마다 다릅니다.',
    storyEs: 'Una tablilla de madera con la palabra 게젓 —cangrejo en salazón— se recuperó de un barco hundido frente a Mado en 1208, lo que sitúa el cangrejo curado en soja en Corea antes que casi todo lo que hoy llamamos comida coreana. Los recetarios de Joseon también lo recogen. El apodo que le puso la lengua es 밥도둑, el ladrón de arroz: no que esté bueno, sino que te hará comer mucho más arroz del que pensabas. No se cocina nada. El cangrejo se cura crudo en salsa de soja, y qué cangrejo depende de dónde estés.',
    storyFr: 'Une tablette de bois portant le mot 게젓 — crabe en saumure — a été remontée d\'un navire coulé au large de Mado en 1208, ce qui place le crabe mariné au soja en Corée avant presque tout ce qu\'on appelle aujourd\'hui cuisine coréenne. Les livres de cuisine de Joseon le mentionnent aussi. Le surnom que la langue lui a donné est 밥도둑, le voleur de riz : non pas que ce soit bon, mais que cela vous fera manger bien plus de riz que prévu. Rien n\'est cuit. Le crabe est mariné cru dans la sauce soja, et lequel dépend de l\'endroit.',
    storyAr: 'انتُشلت من سفينة غرقت قبالة مادو سنة 1208 لوحةٌ خشبية كُتب عليها 게젓، أي الكابوريا المخلَّلة — وهذا يضع كابوريا الصويا في كوريا قبل معظم ما يُسمّى اليوم طعامًا كوريًّا. وتذكره كتب الطبخ في عهد جوسون أيضًا. واللقب الذي منحته إياه اللغة هو 밥도둑، سارق الأرز: لا بمعنى أنه لذيذ، بل أنه سيجعلك تأكل من الأرز أكثر بكثير ممّا نويت. لا شيء يُطهى. تُخلَّل الكابوريا نيئة في الصويا، وأيّ كابوريا يعتمد على المكان.',
    storyZh: '1208年沉没在马岛外海的一艘船上，打捞出一枚写着 게젓（蟹酱）的木简——这说明酱蟹在朝鲜半岛的年头，比今天大多数被称作“韩餐”的东西都长。朝鲜时代的食谱里也有它。语言给它起的外号是 밥도둑，偷饭贼：不是说它好吃，而是说它会让你比原本打算的多吃好多饭。什么都不煮。螃蟹是生的，泡在酱油里腌熟，用哪种蟹则看你在什么地方。',
    storyJa: '1208年に馬島沖で沈んだ船から、게젓（カニの塩辛）と書かれた木簡が引き揚げられました。醤油漬けのカニが、いま韓国料理と呼ばれているものの大半より古いということです。朝鮮時代の料理書にも載っています。この料理に韓国語がつけた渾名は 밥도둑、ご飯泥棒。おいしいという意味ではなく、そのつもりだった量よりずっと多くご飯を食べさせてしまう、という意味です。火は通しません。カニは生のまま醤油に漬け、どのカニを使うかは土地によって変わります。',
    themeId: null,
    culture:
      "Koreans call it 밥도둑, the rice thief, because the salt in it makes you eat more rice than you meant to. The last step is filling the empty shell with rice and mixing it in — the dish is built around that final mouthful rather than the crab itself.",
    cultureKo:
      '한국에서는 밥도둑이라고 부릅니다. 짠맛 때문에 생각보다 밥을 더 먹게 되거든요. 마지막 순서는 빈 등딱지에 밥을 넣고 비비는 것인데, 이 음식은 게 자체보다 그 마지막 한 입을 중심으로 짜여 있습니다.',
    cultureEs:
      "En Corea lo llaman 밥도둑, el ladrón de arroz, porque la sal te hace comer más arroz del que pensabas. El último paso es llenar el caparazón vacío de arroz y mezclarlo; el plato está construido alrededor de ese bocado final más que del cangrejo.",
    cultureFr:
      "Les Coréens l'appellent 밥도둑, le voleur de riz, parce que le sel vous en fait manger plus que prévu. La dernière étape consiste à remplir la carapace vide de riz et à mélanger : le plat est construit autour de cette bouchée finale plus que du crabe lui-même.",
    cultureAr:
      "يسمّيه الكوريون 밥도둑، لصّ الأرز، لأن ملحه يجعلك تأكل أرزًا أكثر ممّا نويت. والخطوة الأخيرة ملء الصدفة الفارغة بالأرز وخلطه فيها — فالطبق مبنيّ حول تلك اللقمة الأخيرة لا حول السلطعون نفسه.",
    cultureZh:
      "韩国人管它叫밥도둑，偷饭贼，因为那份咸让你不知不觉多吃了饭。最后一步是把米饭盛进空蟹壳里拌开——这道菜是围着那最后一口建起来的，而不是围着蟹本身。",
    cultureJa:
      "韓国の人は밥도둑、ご飯泥棒と呼びます。塩気のせいで思っていたよりご飯が進むからです。最後は空いた甲羅にご飯を入れて混ぜる——この料理はカニそのものより、その最後のひと口を中心に組み立てられています。",
    contains: ['shellfish'],
    spice: 0,
    zones: ['신사동 간장게장골목', '장안동 게장골목'],
  },
  {
    id: 'hanjeongsik',
    name: 'Hanjeongsik',
    // What it is, in words somebody can picture without knowing the name.
    // Testers said romanisation alone is opaque for a dish they have not met:
    // "Ganjang Gejang" carries nothing, and a descriptive English name beside
    // it does. Each one is taken from this dish's own howItWorks rather than
    // written fresh, so the short name and the long one cannot drift apart.
    gloss: "A full Korean course, all at once",
    glossKo:
      '한 상에 다 나오는 한식 정찬',
    glossEs:
      "Un menú coreano completo, todo a la vez",
    glossFr:
      "Un repas coréen complet, servi d’un coup",
    glossAr:
      "مائدة كورية كاملة تصل دفعة واحدة",
    glossZh:
      "一整桌韩式套餐，一次上齐",
    glossJa:
      "韓定食、いちどに全部",
    nameKo: '한정식',
    romanization: 'han-jeong-sik',
    category: MENU_CATEGORY.SET,
    minPeople: 2,
    whyShared:
      'A full course of shared dishes brought out together. Most houses take the booking for two or more, and many ask for it a day ahead.',
    whySharedKo:
      '나눠 먹는 요리들이 한꺼번에 나오는 정찬입니다. 대부분 2인 이상으로 예약을 받고, 하루 전에 미리 말해 달라는 집도 많아요.',
    whySharedEs:
      "Un menú completo de platos para compartir que salen juntos. Casi todas las casas lo reservan a partir de dos personas, y muchas piden aviso con un día.",
    whySharedFr:
      "Un menu complet de plats à partager qui arrivent ensemble. La plupart des maisons ne réservent qu'à partir de deux, et beaucoup demandent un jour d'avance.",
    whySharedAr:
      "مائدة كاملة من أطباق مشتركة تخرج معًا. معظم البيوت تقبل الحجز لشخصين فأكثر، وكثير منها يطلبه قبل يوم.",
    whySharedZh:
      "一整套共享的菜一起端上来。多数店从两位起接，很多还要提前一天。",
    whySharedJa:
      "取り分ける料理一式がまとめて出てきます。多くの店が二人からの予約で、前日までにという店も少なくありません。",
    howItWorks:
      'A formal spread — soups, grilled fish, jeon, a dozen or more banchan — laid across the table at once rather than in courses. Everything in the middle is for everyone.',
    howItWorksKo:
      '국, 생선구이, 전, 열 가지가 넘는 반찬이 코스가 아니라 한 상에 한꺼번에 깔립니다. 가운데 있는 건 전부 모두의 것이에요.',
    howItWorksEs:
      "Una mesa formal — sopas, pescado a la parrilla, jeon, una docena larga de banchan — puesta toda a la vez en lugar de por pases. Todo lo del centro es de todos.",
    howItWorksFr:
      "Une table dressée : soupes, poisson grillé, jeon, une bonne douzaine de banchan — le tout posé d'un coup plutôt qu'en services. Ce qui est au centre est à tout le monde.",
    howItWorksAr:
      "فرشة رسمية — شوربات، سمك مشوي، جيون، اثنا عشر طبقًا جانبيًا أو أكثر — تُبسط على الطاولة دفعة واحدة لا على مراحل. وكل ما في الوسط للجميع.",
    howItWorksZh:
      "一桌正式的排场——汤、烤鱼、煎饼、十几样甚至更多小菜——一次铺满桌面，而不是一道道上。中间的一切都是大家的。",
    howItWorksJa:
      "正式な膳——汁物、焼き魚、チヂミ、十二品以上のおかず——がコースではなく一度にテーブルに広がります。真ん中のものはすべて全員のものです。",
    storySources: ['wikipedia-hanjeongsik-ko', 'encykorea-bansang', 'encykorea-surasang'],
    story: 'It looks like the oldest thing on any Korean menu and it is one of the youngest. The word came after the Korean War, when restaurants serving a set meal multiplied under shortage. What it borrows is much older: the 반상, the household table, which was counted in 첩 — the dishes beyond rice, soup and kimchi — and ran from three to twelve. Twelve was the king\'s number. So a spread arriving all at once rather than in courses is not a restaurant\'s flourish; it is how a Korean table has always been set, and hanjeongsik is that table given a price.',
    storyKo: '한식 차림 중 가장 오래돼 보이지만, 사실은 가장 젊은 축입니다. \'한정식\'이라는 말은 한국전쟁 뒤에 생겼습니다. 물자가 부족하던 시절 정식을 내는 음식점이 늘면서요. 다만 빌려온 형식은 훨씬 오래됐습니다. 집안의 밥상인 반상은 \'첩\'으로 셈했는데 — 밥·국·김치를 뺀 나머지 반찬 수입니다 — 3첩부터 12첩까지 있었습니다. 12첩은 임금의 수였고요. 그러니 코스가 아니라 한꺼번에 깔리는 상은 음식점의 멋 부림이 아닙니다. 한국의 상은 원래 그렇게 차려졌고, 한정식은 그 상에 값을 매긴 것입니다.',
    storyEs: 'Parece lo más antiguo de cualquier carta coreana y es de lo más reciente. La palabra nació después de la Guerra de Corea, cuando se multiplicaron los restaurantes de menú fijo bajo la escasez. Lo que toma prestado es mucho más viejo: el 반상, la mesa doméstica, que se contaba en 첩 —los platos aparte del arroz, la sopa y el kimchi— y iba de tres a doce. Doce era el número del rey. Así que una mesa que llega entera de golpe, y no por platos, no es una floritura de restaurante: es como siempre se ha puesto una mesa coreana, y el hanjeongsik es esa mesa con un precio.',
    storyFr: 'Cela a l\'air de la chose la plus ancienne d\'une carte coréenne, et c\'est l\'une des plus récentes. Le mot est né après la guerre de Corée, quand les restaurants à menu fixe se sont multipliés dans la pénurie. Ce qu\'il emprunte est bien plus ancien : le 반상, la table de la maison, qui se comptait en 첩 — les plats au-delà du riz, de la soupe et du kimchi — et allait de trois à douze. Douze était le chiffre du roi. Une table qui arrive d\'un coup plutôt qu\'en services n\'est donc pas une coquetterie de restaurant : c\'est ainsi qu\'on dresse une table coréenne depuis toujours, et le hanjeongsik est cette table avec un prix.',
    storyAr: 'يبدو أقدم ما في أيّ قائمة طعام كورية، وهو من أحدثها. وُلدت الكلمة بعد الحرب الكورية، حين تكاثرت المطاعم التي تقدّم وجبةً محدَّدة في زمن الشُّحّ. أمّا ما تستعيره فأقدم بكثير: 반상، مائدة البيت، التي كانت تُعدّ بـ첩 — أي الأطباق ما عدا الأرز والحساء والكيمتشي — وتتراوح من ثلاثة إلى اثني عشر. والاثنا عشر كان رقم الملك. فمائدةٌ تصل كاملةً دفعةً واحدة لا على أطباق متعاقبة ليست زخرفة مطعم؛ هكذا تُفرش المائدة الكورية منذ القدم، والهانجونغسيك هو تلك المائدة وقد وُضع لها سعر.',
    storyZh: '它看着像韩国菜单上最古老的东西，其实是最年轻的之一。“韩定食”这个词是朝鲜战争之后才有的，物资短缺的年月里，供应套餐的饭馆多了起来。但它借来的形式要老得多：반상，也就是家里的饭桌，是按 첩 来数的——除米饭、汤和泡菜之外的菜数——从三첩到十二첩。十二是国王的数。所以整桌一次性摆上来、而不是一道一道上，并不是饭馆的花样：韩国的饭桌本来就是这么摆的，韩定食不过是给这张桌子标了个价。',
    storyJa: '韓国の品書きの中でいちばん古そうに見えて、じつはいちばん新しい部類です。「韓定食」という言葉は朝鮮戦争のあとに生まれました。物が足りない時代に、定食を出す食堂が増えたのです。ただ、借りてきた形はずっと古い。家の膳である 반상 は「첩」で数えました——ご飯、汁、キムチを除いたおかずの数です——三첩から十二첩まであり、十二は王の数でした。だから、コースではなく一度に並ぶ膳は食堂の演出ではありません。韓国の膳はもともとそう据えられてきたのであり、韓定食はその膳に値をつけたものです。',
    themeId: null,
    culture:
      "It descends from the 반상, the formally counted Korean table: dishes were served in sets of three, five, seven or nine, and the number marked the household. Everything arrives at once rather than in courses, so nothing is anybody's alone.",
    cultureKo:
      '격식을 갖춰 가짓수를 세던 반상에서 내려왔습니다. 반찬을 3첩, 5첩, 7첩, 9첩으로 냈고 그 숫자가 그 집을 나타냈어요. 코스가 아니라 한꺼번에 나오기 때문에, 어느 것도 누구 한 사람의 것이 아닙니다.',
    cultureEs:
      "Desciende del 반상, la mesa coreana que se contaba formalmente: las guarniciones se servían de tres, cinco, siete o nueve, y el número señalaba a la casa. Todo llega a la vez en lugar de por pases, así que nada es de una sola persona.",
    cultureFr:
      "Le repas descend du 반상, la table coréenne que l'on comptait formellement : les accompagnements se servaient par trois, cinq, sept ou neuf, et le nombre disait la maison. Tout arrive ensemble plutôt qu'en services, donc rien n'appartient à une seule personne.",
    cultureAr:
      "ينحدر من الـ반상، المائدة الكورية المعدودة رسميًا: كانت الأطباق تُقدَّم في أطقم من ثلاثة أو خمسة أو سبعة أو تسعة، والعدد يدلّ على البيت. يصل كل شيء دفعة واحدة لا على مراحل، فلا يكون شيء ملكًا لأحد وحده.",
    cultureZh:
      "它承自반상，那张按规矩计数的韩国餐桌：菜按三、五、七、九样成套上桌，数目标示着这户人家。所有东西一次上齐而不是分道，所以没有哪一样是谁一个人的。",
    cultureJa:
      "반상、正式に数えられた韓国の膳の系譜です。おかずは三品、五品、七品、九品と揃いで出され、その数がその家を示しました。コースではなく一度に届くので、どれも誰か一人のものにはなりません。",
    // howItWorks two fields up names grilled fish. The record said this dish
    // contained nothing, so the app printed a description of fish and no
    // warning, on the same screen, to somebody who had said they avoid it.
    contains: ['fish'],
    // And the rest of the spread is a dozen banchan chosen by the house, so
    // what is *not* in it cannot be promised. See the note on `varies` at the
    // top of this file.
    varies: true,
    spice: 1,
    zones: ['인사동 골목', '세종마을 음식문화거리'],
  },
  {
    id: 'baekban',
    name: 'Baekban',
    // What it is, in words somebody can picture without knowing the name.
    // Testers said romanisation alone is opaque for a dish they have not met:
    // "Ganjang Gejang" carries nothing, and a descriptive English name beside
    // it does. Each one is taken from this dish's own howItWorks rather than
    // written fresh, so the short name and the long one cannot drift apart.
    gloss: "Rice, soup and the day's side dishes",
    glossKo:
      '밥과 국, 그날의 반찬',
    glossEs:
      "Arroz, sopa y las guarniciones del día",
    glossFr:
      "Riz, soupe et les accompagnements du jour",
    glossAr:
      "أرز وشوربة وأطباق اليوم الجانبية",
    glossZh:
      "米饭、汤，和当天的小菜",
    glossJa:
      "ご飯と汁物と、その日のおかず",
    nameKo: '백반',
    romanization: 'baek-ban',
    category: MENU_CATEGORY.SET,
    minPeople: 1,
    // One of the ten you *can* order for one, and it earns its place anyway:
    // alone. It is here because the plan names it, and because eating it
    // alone misses what it is — a menu-less home meal whose whole character
    // is the shared middle of the table.
    whyShared:
      'You can order this one alone. It is here because the banchan in the middle are refilled for the table, not the plate — with two people the spread doubles and nothing is wasted.',
    whySharedKo:
      '이건 혼자서도 시킬 수 있어요. 그런데도 여기 있는 이유는 가운데 반찬이 접시가 아니라 상 단위로 리필되기 때문입니다. 둘이면 상이 두 배가 되고, 남기는 것도 없어요.',
    whySharedEs:
      "Este sí lo puedes pedir solo. Está aquí porque los banchan del centro se rellenan para la mesa y no para el plato: con dos personas la mesa se dobla y no se desperdicia nada.",
    whySharedFr:
      "Celui-là, vous pouvez le commander seul. S'il est ici, c'est que les banchan du centre se resservent pour la table et non pour l'assiette : à deux, la table double et rien ne se perd.",
    whySharedAr:
      "يمكنك طلب هذا وحدك. وهو هنا لأن الأطباق الجانبية في الوسط تُملأ للطاولة لا للصحن — فمع شخصين تتضاعف الفرشة ولا يُهدر شيء.",
    whySharedZh:
      "这一样你可以一个人点。它出现在这里，是因为中间那些小菜是按桌续的，不是按盘续的——两个人，铺开的量就翻一倍，也不会浪费。",
    whySharedJa:
      "これは一人でも頼めます。ここに載っているのは、真ん中のおかずが皿単位ではなく卓単位でおかわりされるからです——二人なら広がりが倍になり、それでいて無駄が出ません。",
    howItWorks:
      'A home-style set: rice, soup, and whatever side dishes the kitchen made that morning. Often there is no menu — you sit down and it comes.',
    howItWorksKo:
      '집밥 같은 한 상입니다. 밥, 국, 그리고 그날 아침 주방에서 만든 반찬. 메뉴판이 아예 없는 집도 많아요 — 앉으면 나옵니다.',
    howItWorksEs:
      "Un menú de casa: arroz, sopa y las guarniciones que la cocina haya hecho esa mañana. Muchas veces no hay carta — te sientas y llega.",
    howItWorksFr:
      "Un menu de maison : du riz, une soupe, et les accompagnements que la cuisine a préparés le matin même. Souvent il n'y a pas de carte — vous vous asseyez et ça arrive.",
    howItWorksAr:
      "طقم بيتيّ: أرز وشوربة وما صنعه المطبخ من أطباق جانبية ذلك الصباح. وغالبًا لا توجد قائمة — تجلس فيأتي.",
    howItWorksZh:
      "家常的一套：米饭、汤，还有厨房当天早上做了什么小菜就是什么。常常连菜单都没有——你坐下，它就来了。",
    howItWorksJa:
      "家庭の膳一式。ご飯、汁物、そして厨房がその朝つくったおかず。品書き自体がないことも多く、座れば出てきます。",
    themeId: null,
    culture:
      "The everyday table — 집밥, home food, served in shops that often have no menu at all. What arrives is what the kitchen made that morning, and refills of the side dishes are free and expected, which is why asking for more is a compliment rather than an imposition.",
    cultureKo:
      '매일의 밥상, 집밥입니다. 메뉴판이 아예 없는 가게에서 나오는 경우가 많아요. 나오는 건 그날 아침에 만든 것이고, 반찬 리필은 공짜이자 당연한 것이라 더 달라고 하는 게 실례가 아니라 오히려 칭찬이 됩니다.',
    cultureEs:
      "La mesa de todos los días, 집밥, comida de casa, servida en locales que a menudo no tienen carta. Lo que llega es lo que la cocina hizo esa mañana, y rellenar las guarniciones es gratis y está previsto, por eso pedir más es un cumplido y no una molestia.",
    cultureFr:
      "La table de tous les jours, 집밥, la cuisine de la maison, servie dans des adresses qui n'ont souvent aucune carte. Ce qui arrive est ce que la cuisine a fait ce matin-là, et les resservis d'accompagnements sont gratuits et prévus — demander en plus est donc un compliment, pas une gêne.",
    cultureAr:
      "مائدة كل يوم — 집밥، طعام البيت، يُقدَّم في محلات كثير منها بلا قائمة أصلًا. وما يصل هو ما صنعه المطبخ ذلك الصباح، وإعادة ملء الأطباق الجانبية مجانية ومتوقّعة، ولهذا فطلب المزيد مجاملة لا إثقال.",
    cultureZh:
      "这是日常的那张桌子——집밥，家里的饭，端在很多连菜单都没有的小店里。上来的就是厨房那天早上做的，小菜免费续、也理当续，所以再要一份是恭维而不是麻烦。",
    cultureJa:
      "日常の膳——집밥、家のご飯を、品書きすらない店で出します。出てくるのは厨房がその朝つくったもので、おかずのおかわりは無料であり当然のことなので、もう一度頼むのは迷惑ではなく褒め言葉です。",
    // Rice and soup are the dish; everything else is whatever the kitchen made
    // that morning, which this catalog says itself two fields up. There is no
    // honest ingredient list for a meal decided at dawn.
    contains: [],
    varies: true,
    spice: 1,
    zones: ['Jongno, Seoul', 'Euljiro, Seoul'],
  },
  {
    id: 'gopchang',
    name: 'Gopchang',
    // What it is, in words somebody can picture without knowing the name.
    // Testers said romanisation alone is opaque for a dish they have not met:
    // "Ganjang Gejang" carries nothing, and a descriptive English name beside
    // it does. Each one is taken from this dish's own howItWorks rather than
    // written fresh, so the short name and the long one cannot drift apart.
    gloss: "Charcoal-grilled intestine",
    glossKo:
      '숯불에 구운 곱창',
    glossEs:
      "Intestino a la brasa",
    glossFr:
      "Tripes grillées au charbon",
    glossAr:
      "أمعاء مشوية على الفحم",
    glossZh:
      "炭火烤肥肠",
    glossJa:
      "炭火で焼くホルモン",
    nameKo: '곱창',
    romanization: 'gop-chang',
    category: MENU_CATEGORY.GRILL,
    minPeople: 2,
    whyShared:
      'Priced by the serving with a two-serving minimum almost everywhere, and grilled at the table where it needs watching.',
    whySharedKo:
      '인분 단위로 팔고 거의 어디서나 2인분부터이며, 식탁에서 구워야 해서 계속 지켜봐야 합니다.',
    whySharedEs:
      "Se cobra por ración con un mínimo de dos casi en todas partes, y se hace en la mesa, donde hay que estar pendiente.",
    whySharedFr:
      "Facturé à la portion avec un minimum de deux presque partout, et grillé à table, où il faut le surveiller.",
    whySharedAr:
      "تُسعَّر بالحصة بحدّ أدنى حصتين في كل مكان تقريبًا، وتُشوى على الطاولة حيث تحتاج إلى من يراقبها.",
    whySharedZh:
      "按份计价，几乎处处都是两份起，而且在桌上烤，需要有人盯着。",
    whySharedJa:
      "一人前いくらで、ほぼどこでも二人前から。しかもテーブルで焼くので、誰かが見ている必要があります。",
    howItWorks:
      'Beef or pork intestine grilled over charcoal until the fat inside renders. Regulars finish with fried rice in the same pan.',
    howItWorksKo:
      '소나 돼지 곱창을 숯불에 안쪽 기름이 녹아 나올 때까지 굽습니다. 단골들은 같은 불판에 볶음밥으로 마무리해요.',
    howItWorksEs:
      "Intestino de ternera o cerdo hecho sobre carbón hasta que la grasa de dentro se funde. Los habituales terminan friendo arroz en la misma plancha.",
    howItWorksFr:
      "Tripes de bœuf ou de porc grillées au charbon jusqu'à ce que le gras intérieur fonde. Les habitués finissent par un riz sauté dans la même plaque.",
    howItWorksAr:
      "أمعاء بقر أو خنزير تُشوى على الفحم حتى يذوب الشحم في داخلها. والمداومون يُنهون بأرز مقليّ في المقلاة نفسها.",
    howItWorksZh:
      "牛或猪的肠子在炭火上烤到里面的油脂化开。常客最后会用同一口锅炒饭。",
    howItWorksJa:
      "牛か豚の腸を、中の脂が落ちるまで炭火で焼きます。常連は最後に同じ鉄板でご飯を炒めて締めます。",
    storySources: ['wikipedia-gopchang-ko', 'namu-gopchang'],
    story: 'The 곱 is the part nobody translates: the fat and digestive matter inside the intestine, which is what melts over the charcoal and is the entire point. It was a cut people threw away, or that the ones who did the butchering ate themselves, because without refrigeration nothing else was possible with it. Better cold chains and better cleaning turned it into a delicacy — and then, having become one, it stopped being cheap. It is an expensive cut now. The order of that is worth knowing: this is not peasant food that stayed poor.',
    storyKo: '\'곱\'은 아무도 번역하지 않는 부분입니다. 창자 안쪽의 지방과 소화액이 엉긴 것인데, 숯불 위에서 녹아 나오는 바로 그것이고 이 음식의 전부입니다. 원래는 버리던 부위였습니다. 아니면 도축하는 사람들이 직접 먹던 부위였고요. 냉장 시설이 없으면 달리 방법이 없었으니까요. 냉장 유통과 손질 기술이 좋아지면서 별미가 되었고 — 별미가 되고 나자 더는 싸지 않게 됐습니다. 지금은 비싼 부위입니다. 순서를 알아두면 좋습니다. 가난한 채로 남은 서민 음식이 아닙니다.',
    storyEs: 'El 곱 es la parte que nadie traduce: la grasa y la materia digestiva del interior del intestino, que es lo que se derrite sobre las brasas y es justamente de lo que se trata. Era un corte que se tiraba, o que se comían los propios matarifes, porque sin refrigeración no cabía otra cosa. Mejores cadenas de frío y mejor limpieza lo convirtieron en un manjar, y una vez convertido dejó de ser barato. Hoy es un corte caro. Ese orden conviene saberlo: no es comida humilde que se quedó humilde.',
    storyFr: 'Le 곱 est la partie que personne ne traduit : la graisse et la matière digestive à l\'intérieur de l\'intestin, ce qui fond sur la braise et fait tout l\'intérêt de la chose. C\'était un morceau qu\'on jetait, ou que mangeaient ceux qui abattaient les bêtes, faute de froid pour en faire autre chose. De meilleures chaînes du froid et un meilleur nettoyage en ont fait un mets recherché — et, une fois recherché, il a cessé d\'être bon marché. C\'est aujourd\'hui un morceau cher. L\'ordre des choses mérite d\'être connu : ce n\'est pas une nourriture pauvre restée pauvre.',
    storyAr: 'أمّا 곱 فهو الجزء الذي لا يترجمه أحد: الدهن وما في داخل المِعى من موادّ الهضم، وهو ما يذوب فوق الفحم وهو المقصود كلّه. كانت قطعةً تُرمى، أو يأكلها من يتولّون الذبح، إذ لم يكن ممكنًا غير ذلك بلا تبريد. ثم حسّنت سلاسل التبريد وطرق التنظيف شأنها فصارت طَرَفًا نفيسًا — وحين صارت كذلك، لم تعد رخيصة. هي اليوم قطعة غالية. ويجدر معرفة هذا الترتيب: ليست طعام فقراء بقي فقيرًا.',
    storyZh: '곱 是没人翻译的那个部分：肠子里面的脂肪和消化物，正是它在炭火上化开，也正是这道菜的全部所在。这原本是丢掉的部位，或者由屠宰的人自己吃掉，因为没有冷藏就别无办法。冷链和清洗技术变好之后，它成了美味——而一旦成了美味，就不再便宜了。如今它是贵的部位。这个先后顺序值得记住：它不是一直穷下去的穷人食物。',
    storyJa: '곱 は誰も訳さない部分です。腸の内側の脂と消化液が固まったもので、炭火の上で溶け出すのがそれ、そしてそれがこの料理のすべてです。もとは捨てていた部位でした。あるいは、と畜にたずさわる人たちが自分で食べる部位でした。冷蔵がなければ、ほかにやりようがなかったからです。冷蔵流通と下処理の技術が良くなって珍味になり——珍味になったとたん、安くはなくなりました。いまでは高い部位です。この順番は知っておく値打ちがあります。貧しいまま残った庶民の food ではないのです。',
    themeId: 'seoul-after-dark',
    culture:
      "Offal was poverty food within living memory and is now among the more expensive things on a Korean grill — a change most people eating it can remember happening. It is drinking food, cooked slowly, and the table it belongs to is one nobody is in a hurry to leave.",
    cultureKo:
      '내장은 사람들이 기억하는 시간 안에서 가난한 음식이었다가, 지금은 한국 고깃집에서 비싼 축에 듭니다. 그 변화를 지금 먹고 있는 사람 대부분이 직접 겪었어요. 술안주이고, 천천히 굽고, 이 상은 아무도 서둘러 일어나지 않는 자리입니다.',
    cultureEs:
      "La casquería fue comida de pobreza dentro de la memoria de los vivos y hoy está entre lo más caro de una parrilla coreana; casi todo el que la come recuerda ese cambio. Es comida de beber, se hace despacio, y es una mesa de la que nadie tiene prisa por levantarse.",
    cultureFr:
      "Les abats étaient une nourriture de pauvreté du vivant des gens d'aujourd'hui, et figurent désormais parmi les choses les plus chères d'un gril coréen — un basculement dont la plupart de ceux qui en mangent se souviennent. C'est un plat qui accompagne l'alcool, il se grille lentement, et c'est une table dont personne n'est pressé de se lever.",
    cultureAr:
      "كانت الأحشاء طعام فقر في ذاكرة أحياء يرزقون، وصارت اليوم من أغلى ما على الشواية الكورية — تحوّل يذكر معظم من يأكلونها حدوثه. وهي طعام شرب، تُطهى ببطء، والطاولة التي تنتمي إليها طاولة لا يستعجل أحد مغادرتها.",
    cultureZh:
      "内脏在还活着的人的记忆里曾是穷人的吃食，如今是韩国烤肉里偏贵的一类——这个变化，多数正在吃它的人都亲眼见过。它是下酒的东西，烤得慢，而它所属的那张桌子，没人急着离开。",
    cultureJa:
      "ホルモンは、いま生きている人の記憶のなかでは貧しさの食べものでした。それがいまや韓国の焼き物のなかでは高いほうに入る——その変化を、食べている人の多くが自分で見てきています。酒の肴で、ゆっくり焼くもので、それが属する食卓は誰も急いで立たない食卓です。",
    contains: ['beef', 'pork'],
    spice: 1,
    zones: ['왕십리 곱창골목', '종로5가 곱창골목', '황학동 곱창골목'],
  },

  // ── The fourteen added 2026-09-02 ─────────────────────────────────────
  //
  // The front page had advertised twenty-four dishes in six groups since the
  // groups were built; the catalogue held ten, so the open-a-table form could
  // serve five groups and 분식·전 had no dish anybody could open a table for.
  // Facts were drafted, challenged claim by claim, and confirmed by 강민
  // (56 cells, all settled) before a word of prose; prose went in six batches,
  // Korean and English approved before the other five languages.
  //
  // Every id below is the group id from dishGroups.js, so MENU_ALIAS stays at
  // its two historical entries — catalogComplete.test.mjs pins that.
  //
  // `zones` is empty on all fourteen, on purpose. It means "the neighbourhoods
  // this dish is known for", and the register cannot measure that: its `d`
  // field says which shops print the name on a menu, which for 삼겹살 is a
  // quarter of Seoul. A lift-over-baseline method was tried and validated
  // against the ten hand-written lists; it recovered four. Empty renders no
  // sentence (DishSheet guards it), and no sentence beats "떡볶이는 금천구
  // 근처에서 먹어요".

  // 분식·전 — the group that was empty. Four dishes sold by the single
  // portion, in the catalogue because a 분식집 counter is built for ordering
  // several and putting them in the middle: alone you get one plate, with
  // four people you get the counter.
  {
    id: 'tteokbokki',
    name: 'Tteokbokki',
    gloss: 'Rice cakes simmered in chilli sauce',
    glossKo: '고추장 양념에 졸인 떡',
    glossEs: 'Pastelitos de arroz en salsa de chile',
    glossFr: 'Gâteaux de riz mijotés dans une sauce pimentée',
    glossAr: 'كعك أرز مطهو في صلصة الفلفل الحار',
    glossZh: '辣酱炒年糕',
    glossJa: '唐辛子だれで煮た餅',
    nameKo: '떡볶이',
    romanization: 'tteok-bok-ki',
    category: MENU_CATEGORY.PLATTER,
    minPeople: 1,
    whyShared:
      "A snack shop's counter is built for ordering four or five things at once and putting them in the middle, and the sauce is what everything else is dipped in. You can order one plate alone — and then one plate is all you get.",
    whySharedKo:
      '분식집 카운터는 네댓 가지를 한꺼번에 시켜 가운데 놓으라고 만들어져 있고, 그 양념이 나머지를 찍어 먹는 소스가 됩니다. 한 접시는 혼자서도 시킬 수 있어요 — 그런데 혼자면 딱 그 한 접시입니다.',
    whySharedEs:
      'La barra de un puesto de bocados está hecha para pedir cuatro o cinco cosas a la vez y ponerlas en el centro, y en esa salsa se moja todo lo demás. Un plato lo puedes pedir solo, y entonces un plato es todo lo que te llevas.',
    whySharedFr:
      "Le comptoir d'un snack est fait pour commander quatre ou cinq choses d'un coup et les poser au milieu, et c'est dans cette sauce que tout le reste se trempe. Une assiette, vous pouvez la commander seul — et alors une assiette, c'est tout ce que vous aurez.",
    whySharedAr:
      'طاولة محل الوجبات الخفيفة مصنوعة لطلب أربعة أو خمسة أصناف دفعة واحدة ووضعها في الوسط، وفي هذه الصلصة يُغمَس كل ما عداها. يمكنك طلب صحن واحد وحدك — وعندها يكون الصحن الواحد كل ما ستناله.',
    whySharedZh:
      '小吃店的柜台是为一次点四五样、摆在中间而设的，其余的一切，都蘸这份酱。一盘你可以一个人点——那样的话，一盘就是你能吃到的全部。',
    whySharedJa:
      '軽食屋のカウンターは四つ五つを一度に頼んで真ん中に置くためにあり、そのたれに、ほかの全部をつけて食べます。一皿なら一人でも頼めます——そうすると、一人なら一皿きりです。',
    howItWorks:
      'Cylinders of rice cake simmered in a red sauce until it thickens, usually with fish cake and boiled egg in the same pan. Many shops will fry rice in what is left.',
    howItWorksKo:
      '가래떡을 붉은 양념에 걸쭉해질 때까지 졸입니다. 보통 같은 팬에 어묵과 삶은 달걀이 함께 들어가요. 남은 양념에 밥을 볶아 주는 집도 많습니다.',
    howItWorksEs:
      'Cilindros de pastel de arroz cocidos a fuego lento en una salsa roja hasta que espesa, casi siempre con pastel de pescado y huevo cocido en la misma sartén. Muchos sitios te saltean arroz con lo que queda.',
    howItWorksFr:
      "Des bâtonnets de gâteau de riz mijotés dans une sauce rouge jusqu'à ce qu'elle épaississe, le plus souvent avec des beignets de poisson et un œuf dur dans la même poêle. Beaucoup d'adresses font ensuite sauter du riz dans ce qui reste.",
    howItWorksAr:
      'أصابع من كعك الأرز تُطهى على مهل في صلصة حمراء حتى تثخن، وغالبًا مع كعك السمك وبيض مسلوق في المقلاة نفسها. وكثير من المحال تقلي الأرز فيما تبقّى.',
    howItWorksZh:
      '条状年糕在红色酱汁里慢慢煮到收稠，同一口锅里通常还有鱼饼和水煮蛋。剩下的酱，很多店会拿来炒饭。',
    howItWorksJa:
      '棒状の餅を赤いたれでとろみが出るまで煮ます。たいてい同じ鍋に練り物とゆで卵が入ります。残ったたれでご飯を炒めてくれる店も多いです。',
    culture:
      'This is the food Koreans meet first and keep eating longest — bought at the school gate at twelve and at a counter after drinking at forty. Nobody plans an evening around it, and yet the plate in the middle is shared exactly like any other Korean table.',
    cultureKo:
      '한국 사람이 가장 먼저 만나고 가장 오래 먹는 음식입니다. 열두 살엔 학교 앞에서, 마흔엔 술 마시고 들른 카운터에서요. 이걸 먹으러 저녁을 비우는 사람은 없는데도, 가운데 놓인 접시는 여느 한국 밥상과 똑같이 나눠 먹습니다.',
    cultureEs:
      'Es la comida que un coreano conoce antes y sigue comiendo más tiempo: comprada a la puerta del colegio a los doce y en una barra, después de beber, a los cuarenta. Nadie organiza una noche alrededor de esto, y aun así el plato del centro se comparte exactamente como cualquier otra mesa coreana.',
    cultureFr:
      "C'est le plat qu'un Coréen rencontre en premier et mange le plus longtemps — acheté à la sortie de l'école à douze ans, et au comptoir après avoir bu à quarante. Personne n'organise une soirée autour, et pourtant l'assiette du milieu se partage exactement comme n'importe quelle autre table coréenne.",
    cultureAr:
      'هذا هو الطعام الذي يلتقيه الكوري أولًا ويظل يأكله أطول — يشتريه عند باب المدرسة في الثانية عشرة، وعلى طاولة بعد الشراب في الأربعين. لا أحد يرتّب أمسية حوله، ومع ذلك يُتقاسَم الصحن في الوسط تمامًا كأي مائدة كورية أخرى.',
    cultureZh:
      '这是韩国人最早遇到、也吃得最久的东西——十二岁在校门口买，四十岁喝完酒在柜台边买。没有人会为它安排一个晚上，可中间那一盘，和任何一张韩国饭桌一样，是分着吃的。',
    cultureJa:
      '韓国の人が最初に出会い、いちばん長く食べ続けるのがこれです。十二歳のときは校門の前で、四十歳のときは飲んだ帰りのカウンターで。これのために夜を空ける人はいないのに、真ん中の皿は、ほかのどの韓国の食卓とも同じように分け合います。',
    // Fish cake is in the pan by default; what the five values cannot say
    // (wheat in the rice cake, egg) is in the prose.
    contains: ['fish'],
    spice: 3,
    themeId: null,
    zones: [],
  },
  {
    id: 'jeon',
    name: 'Jeon',
    // The name is a method, not a dish — 해물파전, 김치전 and 동그랑땡 are all
    // 전 — so the gloss says the filling is the house's and `contains` is
    // empty with varies:true. Same treatment as 전골 and 튀김.
    gloss: 'Fried in batter, filling by the house',
    glossKo: '반죽에 부친 것, 속은 집마다',
    glossEs: 'Frito en masa; el relleno, según la casa',
    glossFr: 'Frit dans une pâte, garniture selon la maison',
    glossAr: 'مقلي في خليط، والحشوة حسب المحل',
    glossZh: '裹面糊煎的饼，馅看店家',
    glossJa: '衣で焼いたもの、中身は店しだい',
    nameKo: '전',
    romanization: 'jeon',
    category: MENU_CATEGORY.PLATTER,
    minPeople: 1,
    whyShared:
      'It arrives whole and gets cut apart with scissors, which is a two-hand job. Ordering one means you get one kind — seafood, or kimchi, or minced meat — so the second person is the difference between tasting one and tasting two.',
    whySharedKo:
      '통째로 나와서 가위로 잘라 나눕니다. 두 손이 필요한 일이에요. 하나를 시키면 한 종류만 먹게 되는데 — 해물이냐, 김치냐, 고기냐 — 두 번째 사람이 있으면 두 종류가 됩니다.',
    whySharedEs:
      'Llega entero y se corta con tijeras, que es cosa de dos manos. Pedir uno es quedarse con un solo tipo —marisco, o kimchi, o carne picada—, así que la segunda persona es la diferencia entre probar uno y probar dos.',
    whySharedFr:
      "Il arrive entier et se découpe aux ciseaux, ce qui demande deux mains. En commander un, c'est n'en avoir qu'une sorte — fruits de mer, ou kimchi, ou viande hachée — et la deuxième personne fait la différence entre en goûter une et en goûter deux.",
    whySharedAr:
      'يصل كاملًا ويُقطَّع بالمقص، وهذا عمل يحتاج يدين. أن تطلب واحدًا يعني أن تنال نوعًا واحدًا — بحري، أو كيمتشي، أو لحم مفروم — فالشخص الثاني هو الفرق بين تذوّق نوع واحد وتذوّق نوعين.',
    whySharedZh:
      '整张端上来，用剪刀剪开，这是件要两只手的事。点一张就只有一种——海鲜、泡菜，或者肉饼——所以第二个人，就是尝一种和尝两种的区别。',
    whySharedJa:
      '一枚まるごと来て、ハサミで切り分けます。両手のいる仕事です。一枚頼めば一種類だけ——海鮮か、キムチか、ひき肉か——だから二人目がいるかどうかで、一種類か二種類かが決まります。',
    howItWorks:
      "Ingredients bound in a thin batter and fried flat in oil. What goes in is the house's choice: spring onion and seafood, kimchi, courgette, or minced meat patties. The name is the method, not the filling.",
    howItWorksKo:
      '재료를 묽은 반죽에 버무려 기름에 납작하게 부칩니다. 무엇을 넣는지는 집이 정합니다 — 파와 해물, 김치, 애호박, 또는 동그랑땡. 이름은 재료가 아니라 부치는 방식을 가리킵니다.',
    howItWorksEs:
      'Ingredientes ligados con una masa fina y fritos planos en aceite. Lo que lleva lo decide la casa: cebolleta y marisco, kimchi, calabacín, o tortitas de carne picada. El nombre es el método, no el relleno.',
    howItWorksFr:
      "Des ingrédients liés dans une pâte fine et frits à plat dans l'huile. Ce qu'on y met, c'est la maison qui le décide : ciboule et fruits de mer, kimchi, courgette, ou galettes de viande hachée. Le nom désigne la méthode, pas la garniture.",
    howItWorksAr:
      'مكوّنات تُربط بخليط خفيف وتُقلى مسطّحة في الزيت. ما يدخل فيها من اختيار المطبخ: بصل أخضر ومأكولات بحرية، أو كيمتشي، أو كوسة، أو أقراص لحم مفروم. الاسم يصف الطريقة لا الحشوة.',
    howItWorksZh:
      '食材裹上薄面糊，摊平在油里煎。放什么由店家定：小葱和海鲜、泡菜、西葫芦，或者肉饼。这个名字说的是做法，不是馅。',
    howItWorksJa:
      '具を薄い衣でまとめ、油で平たく焼きます。何を入れるかは店しだいで、ねぎと海鮮、キムチ、ズッキーニ、ひき肉の小さな焼き物などがあります。名前が指すのは作り方であって、中身ではありません。',
    culture:
      'Rain is the cue. The sound of oil in a pan is said to resemble rain on a roof, and on a wet afternoon 전 shops fill up with people who came for exactly that. The drink beside it is 막걸리 more often than not, and it is a dish where a stranger cutting it for you is ordinary rather than forward.',
    cultureKo:
      '신호는 비입니다. 팬에서 기름 튀는 소리가 지붕에 비 떨어지는 소리를 닮았다고들 하고, 비 오는 오후의 전집은 정확히 그것 때문에 온 사람들로 찹니다. 옆에 놓이는 건 대개 막걸리이고, 처음 만난 사람이 대신 잘라 주는 것이 무례가 아니라 보통인 음식입니다.',
    cultureEs:
      'La señal es la lluvia. Dicen que el chisporroteo del aceite en la sartén suena como la lluvia en un tejado, y en una tarde mojada los locales de jeon se llenan de gente que vino justo por eso. Al lado suele haber makgeolli, y es un plato en el que que un desconocido te lo corte es lo normal, no un atrevimiento.',
    cultureFr:
      "Le signal, c'est la pluie. On dit que le grésillement de l'huile dans la poêle ressemble à la pluie sur un toit, et par un après-midi humide les adresses à jeon se remplissent de gens venus exactement pour ça. À côté, c'est du makgeolli plus souvent qu'autrement, et c'est un plat où qu'un inconnu le découpe pour vous est ordinaire, pas déplacé.",
    cultureAr:
      'الإشارة هي المطر. يُقال إن أزيز الزيت في المقلاة يشبه صوت المطر على السطح، وفي عصر ماطر تمتلئ محال الجون بمن جاؤوا لهذا بالذات. الشراب إلى جانبه هو الماكولي في الأغلب، وهو طبق يكون فيه أن يقطعه لك غريب أمرًا عاديًا لا تطفّلًا.',
    cultureZh:
      '信号是雨。都说油在锅里的滋滋声像雨打屋顶，下雨的下午，煎饼店就坐满了正是为这个来的人。旁边多半是米酒，而且在这道菜上，陌生人替你剪开，是寻常事，不是唐突。',
    cultureJa:
      '合図は雨です。油のはぜる音が屋根を打つ雨に似ているのだと言われ、雨の午後のチヂミ屋は、まさにそのために来た人でいっぱいになります。横に置かれるのはたいていマッコリで、見知らぬ人が切り分けてくれるのが失礼ではなく普通のこと、そういう料理です。',
    contains: [],
    spice: 0,
    varies: true,
    themeId: null,
    zones: [],
  },
  {
    id: 'sundae',
    name: 'Sundae',
    gloss: 'Steamed blood sausage, sliced',
    glossKo: '쪄서 썰어 내는 순대',
    glossEs: 'Morcilla al vapor, en rodajas',
    glossFr: 'Boudin à la vapeur, tranché',
    glossAr: 'نقانق دم مطهوة بالبخار ومقطّعة',
    glossZh: '蒸好切片的血肠',
    glossJa: '蒸して切った腸詰め',
    nameKo: '순대',
    romanization: 'sun-dae',
    category: MENU_CATEGORY.PLATTER,
    minPeople: 1,
    whyShared:
      'A plate is one order, but it never arrives alone — liver and lung come on the same plate, and they are the part people either love or pass along. With one person the plate is decided in advance; with two it gets divided.',
    whySharedKo:
      '한 접시가 한 주문이지만 순대만 나오는 법이 없습니다. 간과 허파가 같은 접시에 오는데, 그건 좋아하는 사람과 넘기는 사람이 갈리는 부분이에요. 혼자면 접시가 이미 정해져 나오고, 둘이면 나눠집니다.',
    whySharedEs:
      'Un plato es un pedido, pero nunca llega solo: el hígado y el pulmón vienen en el mismo plato, y son la parte que la gente o adora o pasa al de al lado. Con una persona el plato ya viene decidido; con dos, se reparte.',
    whySharedFr:
      "Une assiette, c'est une commande, mais elle n'arrive jamais seule : le foie et le poumon viennent dessus, et c'est la partie que les gens adorent ou passent au voisin. Seul, l'assiette est décidée d'avance ; à deux, elle se partage.",
    whySharedAr:
      'الصحن طلب واحد، لكنه لا يأتي وحده أبدًا — الكبد والرئة يأتيان على الصحن نفسه، وهما الجزء الذي إما يعشقه الناس أو يمرّرونه لغيرهم. مع شخص واحد يكون الصحن محسومًا سلفًا؛ ومع اثنين يُقتسم.',
    whySharedZh:
      '一盘是一份，但它从不单独上来——肝和肺放在同一盘里，那是有人爱、有人递给旁边的部分。一个人吃，这盘早就定了；两个人，就能分。',
    whySharedJa:
      '一皿が一注文ですが、それだけで来ることはありません。レバーと肺が同じ皿にのって来て、そこは大好きな人と隣に回す人とに分かれる部分です。一人なら皿の中身は決まってしまい、二人なら分けられます。',
    howItWorks:
      'Pig intestine filled with glass noodles and blood, steamed and sliced. Dipped in salt at some shops and in a seasoned sauce at others, and served with slices of liver and lung on the side.',
    howItWorksKo:
      '돼지 창자에 당면과 선지를 채워 쪄서 썹니다. 소금에 찍는 집도 있고 양념장에 찍는 집도 있어요. 간과 허파를 썰어 곁들여 냅니다.',
    howItWorksEs:
      'Tripa de cerdo rellena de fideos de cristal y sangre, cocida al vapor y cortada en rodajas. En unos sitios se moja en sal y en otros en una salsa condimentada, y se sirve con rodajas de hígado y pulmón al lado.',
    howItWorksFr:
      "Boyau de porc farci de vermicelles de patate douce et de sang, cuit à la vapeur et tranché. On le trempe dans du sel dans certaines adresses, dans une sauce assaisonnée dans d'autres, et il est servi avec des tranches de foie et de poumon à côté.",
    howItWorksAr:
      'أمعاء خنزير محشوّة بشعيرية زجاجية ودم، تُطهى بالبخار وتُقطَّع. تُغمَس في الملح في بعض المحال وفي صلصة متبّلة في غيرها، وتُقدَّم مع شرائح من الكبد والرئة إلى جانبها.',
    howItWorksZh:
      '猪肠里灌上粉条和猪血，蒸熟切片。有的店蘸盐，有的店蘸调好的酱，旁边配几片肝和肺。',
    howItWorksJa:
      '豚の腸に春雨と血を詰めて蒸し、切り分けます。塩につける店もあれば、味つけだれにつける店もあり、横にレバーと肺の薄切りが添えられます。',
    culture:
      "Market food, and old enough that regions argue about it — the casing, the filling, and how much of it is vegetable all change with the province, and 속초 stuffs a squid instead of an intestine. The glass-noodle version is what Seoul's markets sell. Ordering it says something about how far into Korean food somebody has walked, which is why a host who suggests it is usually watching to see how you take it.",
    cultureKo:
      '시장 음식이고, 지역마다 자기 것이 옳다고 다툴 만큼 오래됐습니다. 창자냐, 속이냐, 채소가 얼마나 들어가느냐가 지방마다 다르고, 속초는 창자 대신 오징어에 채웁니다. 서울 시장에서 파는 건 당면 순대예요. 이걸 시킨다는 건 한국 음식 안으로 얼마나 걸어 들어왔는지를 말해 주는 일이라, 이걸 권한 호스트는 대개 상대가 어떻게 받아들이는지 보고 있습니다.',
    cultureEs:
      'Comida de mercado, y tan antigua que las regiones discuten por ella: la tripa, el relleno y cuánta verdura lleva cambian de una provincia a otra, y en Sokcho rellenan un calamar en vez de una tripa. La versión con fideos de cristal es la de los mercados de Seúl. Pedirla dice algo de cuánto se ha adentrado alguien en la comida coreana, y por eso el anfitrión que la propone suele estar mirando a ver cómo la recibes.',
    cultureFr:
      "Un plat de marché, assez ancien pour que les régions s'en disputent : le boyau, la farce et la part de légumes changent d'une province à l'autre, et à Sokcho on farcit un calmar plutôt qu'un boyau. La version aux vermicelles est celle des marchés de Séoul. En commander dit quelque chose du chemin que quelqu'un a fait dans la cuisine coréenne, et c'est pourquoi l'hôte qui le propose vous regarde en général le recevoir.",
    cultureAr:
      'طعام أسواق، وقديم بما يكفي لتتنازع الأقاليم عليه — الغلاف والحشوة ومقدار الخضار فيه تتغير من إقليم إلى آخر، وفي سوكتشو يحشون حبّارًا بدل الأمعاء. النسخة بالشعيرية الزجاجية هي ما تبيعه أسواق سيول. أن تطلبه يقول شيئًا عن مدى توغّل المرء في الطعام الكوري، ولذلك يكون المضيف الذي يقترحه في الغالب يراقب كيف تتقبّله.',
    cultureZh:
      '市场里的东西，也老到各地会为它争：肠衣、馅料、放多少菜，一个道一个样，束草更是不用肠子，往鱿鱼里灌。首尔市场卖的是粉条那种。点它，说明一个人在韩国吃食里走了多远，所以提议它的主人，多半在看你怎么接。',
    cultureJa:
      '市場の食べもので、地方ごとに自分のが正しいと言い合うほど古いものです。腸か、中身か、野菜をどれだけ入れるかが道ごとに違い、束草では腸の代わりにイカに詰めます。ソウルの市場で売っているのは春雨の入ったものです。これを頼むというのは、その人が韓国の食べもののどこまで入ってきたかを語ることで、だからこれを勧めた主人は、たいていあなたの受け止め方を見ています。',
    contains: ['pork'],
    spice: 0,
    themeId: null,
    zones: [],
  },
  {
    id: 'twigim',
    name: 'Twigim',
    gloss: 'Whatever the shop is frying that day',
    glossKo: '그날 그 집이 튀기는 것',
    glossEs: 'Lo que la casa fríe ese día',
    glossFr: 'Ce que la maison fait frire ce jour-là',
    glossAr: 'ما يقليه المحل في ذلك اليوم',
    glossZh: '那家店当天炸什么就是什么',
    glossJa: 'その日その店が揚げているもの',
    nameKo: '튀김',
    romanization: 'twi-gim',
    category: MENU_CATEGORY.PLATTER,
    minPeople: 1,
    whyShared:
      'The point is variety and one person cannot get it — two or three pieces is a snack, a tray of six kinds is the meal. Shops sell it by the piece precisely so a table can build a mixed plate, which only works if there is a table.',
    whySharedKo:
      '여러 가지를 조금씩 먹는 게 요점인데 혼자서는 그게 안 됩니다. 두세 개는 군것질이고, 여섯 가지가 담긴 쟁반이라야 한 끼예요. 가게가 개당 파는 것도 여럿이 섞어 담으라는 뜻인데, 그러려면 상이 있어야 합니다.',
    whySharedEs:
      'La gracia es la variedad, y una persona sola no la consigue: dos o tres piezas son un tentempié, una bandeja de seis clases es la comida. Los sitios lo venden por pieza precisamente para que una mesa arme un plato mezclado, y eso solo funciona si hay mesa.',
    whySharedFr:
      "L'intérêt, c'est la variété, et seul on ne l'a pas : deux ou trois pièces, c'est un en-cas ; un plateau de six sortes, c'est le repas. Les adresses le vendent à la pièce précisément pour qu'une tablée compose une assiette mélangée — ce qui ne marche que s'il y a une tablée.",
    whySharedAr:
      'المقصود هو التنوّع، والشخص الواحد لا يناله — قطعتان أو ثلاث وجبة خفيفة، وصينية من ستة أصناف هي الوجبة. تبيعه المحال بالقطعة تحديدًا كي تُركِّب الطاولة صحنًا مشكَّلًا، وهذا لا يصلح إلا إن كانت هناك طاولة.',
    whySharedZh:
      '要的是花样，一个人办不到——两三块是零嘴，六样一托盘才是一顿。店家按个卖，正是为了让一桌人拼出一盘杂的，而这只有凑成一桌才成。',
    whySharedJa:
      '眼目はいろいろ食べることで、それは一人ではできません。二つ三つならおやつ、六種類のった盆でやっと一食です。店が一個ずつ売るのは、卓ごとに盛り合わせを作らせるためで、それは卓があってはじめて成り立ちます。',
    howItWorks:
      "Battered and deep-fried to order, or fried early and reheated in the same oil. What is in the tray is the house's choice: squid, prawn, sweet potato, courgette, seaweed rolls, whole green chillies. Most shops hand it over with a cup of tteokbokki sauce to dip it in.",
    howItWorksKo:
      '주문 즉시 튀기거나, 미리 튀겨 두고 같은 기름에 다시 데웁니다. 쟁반에 무엇이 있는지는 집이 정해요 — 오징어, 새우, 고구마, 애호박, 김말이, 통고추. 대부분 떡볶이 국물을 한 컵 같이 줍니다. 찍어 먹으라는 뜻입니다.',
    howItWorksEs:
      'Rebozado y frito al momento, o frito antes y recalentado en el mismo aceite. Lo que hay en la bandeja lo decide la casa: calamar, gamba, boniato, calabacín, rollitos de alga, guindillas verdes enteras. La mayoría te lo da con un vaso de salsa de tteokbokki para mojar.',
    howItWorksFr:
      "Pané et frit à la commande, ou frit à l'avance et réchauffé dans la même huile. Ce qu'il y a sur le plateau, c'est la maison qui le décide : calmar, crevette, patate douce, courgette, rouleaux d'algue, piments verts entiers. La plupart des adresses le donnent avec un gobelet de sauce de tteokbokki pour y tremper.",
    howItWorksAr:
      'يُغلَّف بالخليط ويُقلى عند الطلب، أو يُقلى مسبقًا ويُسخَّن في الزيت نفسه. ما في الصينية من اختيار المطبخ: حبّار، جمبري، بطاطا حلوة، كوسة، لفائف أعشاب بحرية، فلفل أخضر كامل. معظم المحال تناولك إياه مع كوب من صلصة التوكبوكي لتغمسه فيها.',
    howItWorksZh:
      '裹面糊现炸，或者提前炸好、在同一锅油里回热。托盘里有什么由店家定：鱿鱼、虾、红薯、西葫芦、紫菜卷、整根青椒。多数店会给你一杯炒年糕的酱，让你蘸着吃。',
    howItWorksJa:
      '衣をつけて注文ごとに揚げるか、先に揚げておいて同じ油で温め直します。盆に何があるかは店しだいで、イカ、えび、さつまいも、ズッキーニ、海苔巻き、青唐辛子の丸ごとなど。たいていの店はトッポッキのたれをひとカップ添えてくれます。つけて食べるためです。',
    culture:
      'Nothing here is a dish of its own; it is the thing you add to what you already ordered, which is why the tray is at the front of the shop where you can point at it. Korean fried food is also unusually democratic about what gets battered — a whole chilli, a sheet of seaweed rolled around noodles — and the answer to what is inside is usually "point and find out".',
    cultureKo:
      '여기 있는 것 중 그 자체로 한 끼인 건 없습니다. 이미 시킨 것에 더하는 것이고, 그래서 쟁반이 가게 앞쪽 손가락으로 가리킬 수 있는 자리에 있어요. 한국 튀김은 무엇을 튀기는지에 대해 유난히 관대하기도 합니다 — 통고추 하나, 당면을 만 김 한 장. 안에 뭐가 들었냐는 물음의 답은 대개 "가리켜 보고 알기"입니다.',
    cultureEs:
      'Nada de esto es un plato por sí mismo; es lo que añades a lo que ya has pedido, y por eso la bandeja está al frente del local, donde se puede señalar. La fritura coreana es además poco selectiva con lo que reboza —una guindilla entera, una hoja de alga enrollada en fideos—, y a la pregunta de qué lleva dentro se suele responder señalando y averiguándolo.',
    cultureFr:
      "Rien ici n'est un plat en soi ; c'est ce qu'on ajoute à ce qu'on a déjà commandé, et c'est pour ça que le plateau est à l'avant de la boutique, là où on peut le montrer du doigt. La friture coréenne est aussi étonnamment peu regardante sur ce qui passe dans la pâte — un piment entier, une feuille d'algue roulée autour de nouilles — et à la question de ce qu'il y a dedans, la réponse est le plus souvent « montrez, vous verrez ».",
    cultureAr:
      'لا شيء هنا طبق قائم بذاته؛ إنه ما تضيفه إلى ما طلبته أصلًا، ولهذا تكون الصينية في مقدّمة المحل حيث يمكنك الإشارة إليها. القلي الكوري متساهل على نحو لافت فيما يُغلَّف بالخليط — فلفلة كاملة، ورقة أعشاب بحرية ملفوفة على شعيرية — والجواب عمّا في الداخل هو غالبًا «أشِر واكتشف».',
    cultureZh:
      '这里没有一样是单独成菜的，都是加在你已经点的东西上的，所以托盘摆在店门口，伸手就能指。韩国的炸物对裹什么下锅也格外不挑——一整根辣椒、一张卷着粉条的紫菜——至于里面是什么，答案多半是"指一下，尝了就知道"。',
    cultureJa:
      'ここにあるものはどれも、それ一つで一皿にはなりません。すでに頼んだものに足すもので、だから盆は店の前の、指させる場所に置いてあります。韓国の揚げ物は何を衣に入れるかにもずいぶん寛容で、唐辛子を丸ごと、春雨を巻いた海苔を一枚。中身は何かと聞けば、答えはたいてい「指して、食べてみて」です。',
    contains: [],
    spice: 0,
    varies: true,
    themeId: null,
    zones: [],
  },

  // 용기가 필요한 것 — three plates sold to one person and almost never
  // eaten by one. The real hazard of 산낙지 is not an allergen but choking,
  // which no field can hold; howItWorks says it in words.
  {
    id: 'sannakji',
    name: 'San-nakji',
    gloss: 'Octopus cut up live, still moving',
    glossKo: '살아 있는 채로 썰어 내는 낙지',
    glossEs: 'Pulpo troceado vivo, aún moviéndose',
    glossFr: 'Poulpe découpé vivant, encore en mouvement',
    glossAr: 'أخطبوط يُقطَّع حيًّا ولا يزال يتحرك',
    glossZh: '活切的章鱼，还在动',
    glossJa: '生きたまま切るタコ、まだ動く',
    nameKo: '산낙지',
    romanization: 'san-nak-ji',
    category: MENU_CATEGORY.PLATTER,
    minPeople: 1,
    whyShared:
      'This is 안주 — drinking food — and the drink is usually why people are at that table. It also needs an audience: the first time, somebody who has done it before is worth more than the plate. One plate can be one order, but it is rarely ordered for one.',
    whySharedKo:
      '이건 안주예요. 대개 술이 그 자리에 앉은 이유고요. 그리고 보는 사람이 필요합니다 — 처음이라면, 먼저 먹어 본 사람이 접시보다 값집니다. 한 접시를 혼자 시킬 수는 있지만, 혼자 시키는 일은 드뭅니다.',
    whySharedEs:
      'Esto es comida de beber, y la bebida suele ser la razón de que alguien esté en esa mesa. También necesita público: la primera vez, alguien que ya lo haya hecho vale más que el plato. Un plato puede ser un pedido, pero rara vez se pide para uno.',
    whySharedFr:
      "C'est de quoi accompagner l'alcool, et l'alcool est en général la raison d'être à cette table. Il faut aussi un public : la première fois, quelqu'un qui l'a déjà fait vaut plus que l'assiette. Une assiette peut être une commande, mais on la commande rarement pour une personne.",
    whySharedAr:
      'هذا طعام يرافق الشراب، والشراب هو غالبًا سبب جلوس الناس إلى تلك الطاولة. ويحتاج أيضًا إلى من يشاهد: في المرة الأولى، شخص جرّبه من قبل يساوي أكثر من الصحن. قد يكون الصحن طلبًا واحدًا، لكنه نادرًا ما يُطلب لشخص واحد.',
    whySharedZh:
      '这是下酒菜，酒才多半是人坐在那桌的原因。它还需要观众：第一次吃，一个吃过的人比那盘菜更值。一盘可以是一份，但很少有人为一个人点它。',
    whySharedJa:
      'これは酒の肴で、その席にいる理由はたいてい酒のほうです。それに見ている人が要ります。初めてなら、先に食べたことのある人のほうが皿より値打ちがあります。一皿を一人で頼むことはできますが、一人のために頼まれることはめったにありません。',
    howItWorks:
      'A small octopus cut into pieces seconds before it reaches you, dressed in sesame oil and salt. The pieces still move and the suckers still grip. Chew each one completely before swallowing — this is not a figure of speech, it is how the dish is eaten safely.',
    howItWorksKo:
      '작은 낙지를 나오기 몇 초 전에 토막 내고 참기름과 소금을 뿌립니다. 조각은 아직 움직이고 빨판은 아직 붙습니다. 삼키기 전에 한 조각씩 완전히 씹으세요. 비유가 아니라, 이 음식을 안전하게 먹는 방법입니다.',
    howItWorksEs:
      'Un pulpo pequeño troceado segundos antes de llegarte, aliñado con aceite de sésamo y sal. Los trozos aún se mueven y las ventosas aún se agarran. Mastica cada uno del todo antes de tragar: no es una forma de hablar, es cómo se come este plato sin peligro.',
    howItWorksFr:
      "Un petit poulpe découpé quelques secondes avant d'arriver, assaisonné d'huile de sésame et de sel. Les morceaux bougent encore et les ventouses s'accrochent encore. Mâchez chacun complètement avant d'avaler — ce n'est pas une façon de parler, c'est ainsi que ce plat se mange sans danger.",
    howItWorksAr:
      'أخطبوط صغير يُقطَّع قبل وصوله إليك بثوانٍ، ويُتبَّل بزيت السمسم والملح. القطع لا تزال تتحرك والممصّات لا تزال تلتصق. امضغ كل قطعة تمامًا قبل البلع — ليس هذا تعبيرًا مجازيًا، بل هي طريقة أكل هذا الطبق بأمان.',
    howItWorksZh:
      '一只小章鱼在端给你的前几秒切成块，拌上香油和盐。块还在动，吸盘还会吸住。每一块都嚼透了再咽——这不是修辞，这是安全吃这道菜的方法。',
    howItWorksJa:
      '小さなタコを出す数秒前にぶつ切りにし、ごま油と塩をかけます。切り身はまだ動き、吸盤はまだ吸いつきます。一切れずつ、飲み込む前に完全に噛んでください。比喩ではなく、この料理を安全に食べる方法です。',
    culture:
      'The dish foreigners are shown as a dare, and one Koreans mostly eat as a side to 소주 without ceremony. The gap between those two is the whole point of sitting down with somebody local: what looks like a test from the outside is, from the inside, an ordinary evening.',
    cultureKo:
      '외국인에게는 담력 시험처럼 보여 주고, 한국 사람은 대개 소주 안주로 별일 아니게 먹는 음식입니다. 그 둘의 간극이 현지 사람과 마주 앉는 이유의 전부예요. 밖에서 보면 시험 같은 것이, 안에서는 그냥 평범한 저녁입니다.',
    cultureEs:
      'El plato que a los extranjeros se les enseña como un reto, y que los coreanos comen sobre todo de acompañamiento al soju, sin ceremonia. La distancia entre esas dos cosas es todo el sentido de sentarse con alguien de aquí: lo que desde fuera parece una prueba, desde dentro es una noche cualquiera.',
    cultureFr:
      "Le plat qu'on montre aux étrangers comme un défi, et que les Coréens mangent surtout pour accompagner le soju, sans cérémonie. L'écart entre les deux est tout l'intérêt de s'asseoir avec quelqu'un d'ici : ce qui, de l'extérieur, ressemble à une épreuve est, de l'intérieur, une soirée ordinaire.",
    cultureAr:
      'الطبق الذي يُعرض على الأجانب تحدّيًا، ويأكله الكوريون في الغالب إلى جانب السوجو بلا تكلّف. المسافة بين الاثنين هي كل ما في الجلوس مع أحد من أهل البلد: ما يبدو من الخارج اختبارًا هو من الداخل أمسية عادية.',
    cultureZh:
      '给外国人看时像是壮胆的挑战，韩国人自己多半只是就着烧酒随便吃的一道菜。这两者之间的落差，正是和本地人坐到一桌的全部意义：外面看像考验的东西，里面看不过是个平常的晚上。',
    cultureJa:
      '外国人には度胸試しのように見せ、韓国の人はたいてい焼酎の肴として何でもないように食べる料理です。その二つの隔たりこそ、土地の人と向かい合って座る意味のすべてです。外から見れば試練のようなものが、内側ではただの平凡な夜です。',
    // An octopus is a mollusc, not a crustacean; the two uses of `shellfish`
    // before this were a crab and salted shrimp. Sesame has no value here
    // and is named in the prose instead.
    contains: ['mollusc'],
    spice: 0,
    // At a 활어횟집 it arrives with whatever 스끼다시 the house has that day.
    varies: true,
    themeId: null,
    zones: [],
  },
  {
    id: 'yukhoe',
    name: 'Yukhoe',
    gloss: 'Raw beef, seasoned, with a raw yolk',
    glossKo: '양념한 생소고기와 날달걀 노른자',
    glossEs: 'Ternera cruda aliñada, con yema cruda',
    glossFr: 'Bœuf cru assaisonné, avec un jaune cru',
    glossAr: 'لحم بقر نيء متبّل مع صفار نيء',
    glossZh: '拌生牛肉，配生蛋黄',
    glossJa: '味つけした生の牛肉に生卵の黄身',
    nameKo: '육회',
    romanization: 'yuk-hoe',
    category: MENU_CATEGORY.PLATTER,
    minPeople: 1,
    whyShared:
      'The problem is what arrives unasked. Raw liver and tripe come alongside at most shops, and they are easier to face when somebody across the table is already eating them. It is not about the portion — at the specialists a small plate is sold to one person.',
    whySharedKo:
      '문제는 시키지 않아도 나오는 것입니다. 대부분의 집에서 생간과 천엽이 곁들여 나오는데, 맞은편에서 이미 먹고 있는 사람이 있으면 훨씬 쉽습니다. 양의 문제는 아니에요 — 전문점에서는 소(小) 한 접시를 혼자에게도 팝니다.',
    whySharedEs:
      'El problema es lo que llega sin pedirlo. En la mayoría de sitios el hígado y el librillo crudos vienen al lado, y se afrontan mejor cuando alguien enfrente ya los está comiendo. No va de la ración: en los especialistas venden un plato pequeño a una sola persona.',
    whySharedFr:
      "Le problème, c'est ce qui arrive sans être commandé. Dans la plupart des adresses, le foie et le feuillet crus viennent à côté, et on les affronte mieux quand quelqu'un en face est déjà en train d'en manger. Ce n'est pas une question de portion : chez les spécialistes, une petite assiette se vend à une seule personne.",
    whySharedAr:
      'المشكلة فيما يصل من غير طلب. في معظم المحال يأتي الكبد والكرش النيئان إلى جانبه، ومواجهتهما أسهل حين يكون أحدهم قبالتك يأكلهما بالفعل. الأمر ليس في مقدار الحصة — فعند المتخصصين يُباع الصحن الصغير لشخص واحد.',
    whySharedZh:
      '问题在于不点也会上来的东西。多数店会配生肝和生百叶，对面已经有人在吃的时候，要容易面对得多。这不是分量的问题——专门店里，小份一盘是卖给一个人的。',
    whySharedJa:
      '問題は、頼まなくても出てくるもののほうです。たいていの店で生のレバーとセンマイが添えられ、向かいですでに誰かが食べていれば、ずっと向き合いやすくなります。量の問題ではありません。専門店では小の一皿を一人にも売ります。',
    howItWorks:
      'Lean beef cut into strips, dressed with sesame oil, soy, garlic and sugar, and served over slivers of Korean pear with a raw egg yolk on top. You mix it at the table. It is raw beef and raw egg: if either is a concern for you, this is the dish to skip.',
    howItWorksKo:
      '기름기 없는 소고기를 채 썰어 참기름·간장·마늘·설탕에 무치고, 채 썬 배 위에 얹어 날달걀 노른자를 올립니다. 상에서 비벼 먹어요. 생소고기와 날달걀입니다. 둘 중 하나라도 걱정된다면 이건 건너뛰어야 할 음식입니다.',
    howItWorksEs:
      'Ternera magra en tiras, aliñada con aceite de sésamo, soja, ajo y azúcar, servida sobre pera coreana en juliana con una yema cruda encima. Se mezcla en la mesa. Es ternera cruda y huevo crudo: si cualquiera de las dos cosas te preocupa, este es el plato que hay que saltarse.',
    howItWorksFr:
      "Du bœuf maigre en lanières, assaisonné d'huile de sésame, de soja, d'ail et de sucre, servi sur de la poire coréenne en julienne avec un jaune d'œuf cru par-dessus. On le mélange à table. C'est du bœuf cru et de l'œuf cru : si l'un ou l'autre vous inquiète, c'est le plat à laisser passer.",
    howItWorksAr:
      'لحم بقر خالٍ من الدهن مقطّع شرائح، متبّل بزيت السمسم والصويا والثوم والسكر، يُقدَّم فوق شرائح رفيعة من الإجاص الكوري مع صفار بيضة نيء فوقه. تخلطه على الطاولة. إنه لحم نيء وبيض نيء: إن كان أيٌّ منهما يقلقك، فهذا هو الطبق الذي تتخطّاه.',
    howItWorksZh:
      '瘦牛肉切条，用香油、酱油、蒜和糖拌匀，铺在切丝的韩国梨上，顶上放一个生蛋黄。在桌上拌开吃。这是生牛肉加生鸡蛋：两样里有一样让你担心，这道菜就该跳过。',
    howItWorksJa:
      '赤身の牛肉を細く切り、ごま油・醤油・にんにく・砂糖であえて、細切りの梨の上にのせ、生卵の黄身を落とします。卓上で混ぜて食べます。生の牛肉と生の卵です。どちらかでも気になるなら、これは避けるべき料理です。',
    culture:
      'Korea eats raw beef the way other places eat raw fish, and the alley of 육회 shops in 광장시장 is where that is most visible — a row of counters, a line of people, and plates that arrive almost as soon as you sit. It does not need a special occasion, which surprises people who expected it to.',
    cultureKo:
      '한국은 다른 데서 생선회를 먹듯 소고기를 날로 먹고, 광장시장 육회골목이 그게 가장 잘 보이는 곳입니다. 카운터가 줄지어 있고, 사람이 줄 서 있고, 접시는 앉자마자 나와요. 특별한 날이 필요하지 않다는 게, 그럴 줄 알았던 사람들을 놀라게 합니다.',
    cultureEs:
      'Corea come ternera cruda como otros sitios comen pescado crudo, y el callejón de puestos de yukhoe del mercado de Gwangjang es donde mejor se ve: una fila de barras, una cola de gente, y platos que llegan casi al sentarte. No necesita una ocasión especial, y eso sorprende a quien daba por hecho que sí.',
    cultureFr:
      "La Corée mange du bœuf cru comme ailleurs on mange du poisson cru, et la ruelle des comptoirs à yukhoe du marché de Gwangjang est l'endroit où cela se voit le mieux — une rangée de comptoirs, une file de gens, et des assiettes qui arrivent presque dès qu'on s'assoit. Il ne faut pas d'occasion particulière, ce qui surprend ceux qui s'y attendaient.",
    cultureAr:
      'تأكل كوريا لحم البقر نيئًا كما تأكل بلاد أخرى السمك نيئًا، وزقاق محال اليوخوي في سوق كوانغجانغ هو حيث يظهر ذلك أوضح ما يكون — صف من الطاولات، وطابور من الناس، وصحون تصل ما إن تجلس تقريبًا. لا يحتاج إلى مناسبة خاصة، وهذا يفاجئ من توقّع العكس.',
    cultureZh:
      '韩国吃生牛肉，就像别处吃生鱼片，广藏市场的生拌牛肉巷是看得最清楚的地方——一排柜台，一列排队的人，盘子几乎一坐下就上。它不需要什么特别的日子，这让以为需要的人吃了一惊。',
    cultureJa:
      '韓国は、よそが生の魚を食べるように生の牛肉を食べます。それがいちばんよく見えるのが広蔵市場のユッケ横丁で、カウンターが並び、人が並び、皿は座るとほぼ同時に出てきます。特別な日は要らない。そのことが、要ると思っていた人を驚かせます。',
    // Raw egg has no value here; howItWorks says it in words.
    contains: ['beef'],
    spice: 0,
    // 간·천엽 arrive unasked at the specialists — the house decides.
    varies: true,
    themeId: null,
    zones: [],
  },
  {
    id: 'dakbal',
    name: 'Dakbal',
    gloss: 'Chicken feet in a hot red glaze',
    glossKo: '매운 양념에 볶은 닭발',
    glossEs: 'Patas de pollo en un glaseado rojo picante',
    glossFr: 'Pattes de poulet dans un glaçage rouge piquant',
    glossAr: 'أرجل دجاج في صلصة حمراء حارّة لامعة',
    glossZh: '辣酱炒鸡爪',
    glossJa: '辛い赤だれをからめた鶏の足',
    nameKo: '닭발',
    romanization: 'dak-bal',
    category: MENU_CATEGORY.PLATTER,
    minPeople: 1,
    whyShared:
      'It comes with steamed egg to cool your mouth and rice balls to fill it, and those arrive for the table, not the person. This is drinking food more often than not, and drinking food tends to get ordered for a table. Sold by the portion, and a single portion is enough for one — it is just rarely eaten that way.',
    whySharedKo:
      '입을 식힐 계란찜과 배를 채울 주먹밥이 같이 나오는데, 그건 사람이 아니라 상에 나오는 것입니다. 대개 술과 같이 시키는 음식이고, 술안주는 상 단위로 시키게 돼요. 인분으로 팔고 1인분이면 혼자 먹기엔 충분합니다 — 그렇게 먹는 사람이 드물 뿐이에요.',
    whySharedEs:
      'Viene con huevo al vapor para calmar la boca y bolas de arroz para llenarla, y eso llega para la mesa, no para la persona. Casi siempre es comida de beber, y la comida de beber suele pedirse para la mesa. Se vende por ración y una ración basta para uno; solo que rara vez se come así.',
    whySharedFr:
      "Il vient avec de l'œuf à la vapeur pour calmer la bouche et des boulettes de riz pour la remplir, et ceux-là arrivent pour la table, pas pour la personne. C'est le plus souvent de quoi accompagner l'alcool, et cela se commande plutôt pour la tablée. Vendu à la portion, et une portion suffit pour une personne — c'est juste rarement mangé ainsi.",
    whySharedAr:
      'يأتي مع بيض على البخار يهدّئ الفم وكرات أرز تملؤه، وهذه تصل للطاولة لا للشخص. هو في الغالب طعام يرافق الشراب، وطعام الشراب يُطلب عادةً للطاولة. يُباع بالحصة وحصة واحدة تكفي شخصًا — لكنه نادرًا ما يُؤكل هكذا.',
    whySharedZh:
      '配着上来的有降辣的蒸蛋和垫肚子的饭团，那些是给这一桌的，不是给一个人的。它多半是下酒的，而下酒菜往往是按桌点的。按份卖，一份够一个人吃——只是很少有人那样吃。',
    whySharedJa:
      '口を冷ます茶碗蒸しと腹を満たすおにぎりがついてきて、それは人にではなく卓に出るものです。たいていは酒の肴で、肴は卓ごとに頼むことになります。一人前単位で売られ、一人前で一人には足ります。ただ、そうやって食べる人はめったにいません。',
    howItWorks:
      'Chicken feet, bones in or out depending on the shop, cooked down in a thick chilli paste glaze until they are sticky. Eaten with the fingers. The heat is real and it is the point — steamed egg is served beside it for a reason.',
    howItWorksKo:
      '닭발을 집에 따라 뼈째 또는 뼈를 발라서, 걸쭉한 고추장 양념에 끈적해질 때까지 졸입니다. 손으로 먹어요. 매운 건 진짜고 그게 요점입니다. 계란찜이 옆에 나오는 데는 이유가 있어요.',
    howItWorksEs:
      'Patas de pollo, con hueso o deshuesadas según el sitio, reducidas en un glaseado espeso de pasta de chile hasta quedar pegajosas. Se comen con los dedos. El picante es de verdad y es la gracia: el huevo al vapor va al lado por algo.',
    howItWorksFr:
      "Des pattes de poulet, avec ou sans os selon l'adresse, réduites dans un glaçage épais de pâte de piment jusqu'à devenir collantes. Ça se mange avec les doigts. Le piquant est réel et c'est le but — l'œuf à la vapeur est servi à côté pour une raison.",
    howItWorksAr:
      'أرجل دجاج، بعظمها أو من دونه حسب المحل، تُطهى في صلصة ثخينة من معجون الفلفل حتى تصير لزجة. تُؤكل بالأصابع. الحرارة حقيقية وهي المقصود — وللبيض على البخار إلى جانبها سبب.',
    howItWorksZh:
      '鸡爪，带骨还是去骨看店，在浓稠的辣椒酱里收到发黏。用手吃。辣是真辣，而这就是要的——旁边配蒸蛋，是有道理的。',
    howItWorksJa:
      '鶏の足を、店によって骨つきか骨なしで、濃いコチュジャンだれでべたつくまで煮詰めます。手で食べます。辛さは本物で、それが眼目です。横に茶碗蒸しが出るのには理由があります。',
    culture:
      'Drinking food, late and loud, from the 포장마차 tents and the shops that grew out of them. The shape is the obstacle — there is very little meat on a foot and getting it takes patience — and the obstacle is the pleasure, the same way a crab is. People who love it love it for the work.',
    cultureKo:
      '술안주입니다. 늦게, 시끄럽게, 포장마차와 거기서 자라난 가게들에서요. 모양이 곧 장애물이에요. 발에는 살이 얼마 없고 그걸 발라내는 데 인내가 필요한데, 그 장애물이 곧 재미입니다. 게가 그런 것처럼요. 이걸 좋아하는 사람은 그 수고 때문에 좋아합니다.',
    cultureEs:
      'Comida de beber, tarde y ruidosa, de las carpas callejeras y de los locales que salieron de ellas. La forma es el obstáculo —en una pata hay muy poca carne y sacarla lleva paciencia—, y el obstáculo es el placer, igual que con un cangrejo. Quien lo adora, lo adora por el trabajo.',
    cultureFr:
      "De quoi accompagner l'alcool, tard et bruyamment, venu des tentes de rue et des adresses qui en sont sorties. La forme est l'obstacle — il y a très peu de chair sur une patte et l'atteindre demande de la patience — et l'obstacle est le plaisir, exactement comme avec un crabe. Ceux qui l'adorent l'adorent pour le travail.",
    cultureAr:
      'طعام شراب، متأخر وصاخب، من خيام الشارع والمحال التي خرجت منها. الشكل هو العقبة — اللحم على الرِّجل قليل جدًّا والوصول إليه يحتاج صبرًا — والعقبة هي المتعة، تمامًا كما مع السلطعون. من يعشقه يعشقه من أجل ذلك الجهد.',
    cultureZh:
      '下酒菜，又晚又吵，来自路边的帐篷摊和从那里长出来的店。形状本身就是障碍——一只爪上没多少肉，剔出来要耐心——而障碍就是乐趣，跟吃螃蟹一样。爱它的人，爱的就是这份费事。',
    cultureJa:
      '酒の肴です。遅く、騒がしく、屋台とそこから育った店で。形そのものが障害で、足には肉がほとんどなく、ほじり出すには根気がいります。そしてその障害こそが楽しみです。蟹がそうであるように。これが好きな人は、その手間のために好きなのです。',
    contains: ['chicken'],
    spice: 3,
    // 계란찜·주먹밥·콩나물국 — what comes beside it differs by shop.
    varies: true,
    themeId: null,
    zones: [],
  },

  // 전골·탕 — two pots for a table. 전골 is a form, not a dish, and says so.
  {
    id: 'dakhanmari',
    name: 'Dak-hanmari',
    gloss: 'A whole chicken in broth, at the table',
    glossKo: '상에서 끓이는 닭 한 마리',
    glossEs: 'Un pollo entero en caldo, en la mesa',
    glossFr: 'Un poulet entier dans son bouillon, à table',
    glossAr: 'دجاجة كاملة في مرق، على المائدة',
    glossZh: '一整只鸡在桌上煮着',
    glossJa: '卓上で煮る鶏一羽',
    nameKo: '닭한마리',
    romanization: 'dak-han-ma-ri',
    category: MENU_CATEGORY.STEW,
    minPeople: 2,
    whyShared:
      'The unit is the bird. One chicken, whole, in a pot for the table — there is no half order, and the pot keeps cooking while you eat, which is a job for more than one pair of hands.',
    whySharedKo:
      '단위가 닭 한 마리예요. 통째로 한 냄비에 담겨 상에 나오고, 반 마리는 없습니다. 먹는 동안에도 계속 끓어서, 한 사람 손으로는 모자라는 일이에요.',
    whySharedEs:
      'La unidad es el ave. Un pollo, entero, en una olla para la mesa: no hay medio pedido, y la olla sigue cociendo mientras comes, que es trabajo para más de un par de manos.',
    whySharedFr:
      "L'unité, c'est la bête. Un poulet, entier, dans une marmite pour la table — il n'y a pas de demi-commande, et la marmite continue de cuire pendant qu'on mange, ce qui est un travail pour plus d'une paire de mains.",
    whySharedAr:
      'الوحدة هي الطائر. دجاجة واحدة، كاملة، في قِدر للطاولة — لا طلب نصفي، والقِدر تواصل الطهي وأنت تأكل، وهذا عمل يحتاج أكثر من يدين.',
    whySharedZh:
      '单位是一只鸡。一整只，放在一口给整桌的锅里——没有半份这回事，而且吃的时候锅还在煮，这不是一双手忙得过来的事。',
    whySharedJa:
      '単位は鶏一羽です。まるごと一羽が卓の鍋に入っていて、半分という注文はありません。食べているあいだも鍋は煮え続け、それは一人の手では足りない仕事です。',
    howItWorks:
      'A whole chicken simmered in a clear broth on a burner in the middle of the table. You pull the meat apart with scissors and tongs, dip it in a sauce you mix yourself from soy, vinegar, mustard and chilli, and add noodles or rice cake to the broth as it goes. What goes into the pot alongside — potato, rice cake, dumplings — differs by shop.',
    howItWorksKo:
      '닭 한 마리를 맑은 국물에 넣고 상 가운데 버너에서 끓입니다. 가위와 집게로 살을 발라 간장·식초·겨자·고추를 직접 섞은 소스에 찍고, 국물에는 먹으면서 칼국수나 떡을 넣어요. 냄비에 감자·떡·만두 중 무엇이 같이 들어가는지는 집마다 다릅니다.',
    howItWorksEs:
      'Un pollo entero cocido a fuego lento en un caldo claro sobre un hornillo en medio de la mesa. Se desmenuza con tijeras y pinzas, se moja en una salsa que mezclas tú mismo con soja, vinagre, mostaza y chile, y al caldo se le van añadiendo fideos o pastel de arroz. Lo que entra en la olla además —patata, pastel de arroz, empanadillas— cambia de un sitio a otro.',
    howItWorksFr:
      "Un poulet entier mijoté dans un bouillon clair sur un réchaud au milieu de la table. On détache la chair aux ciseaux et à la pince, on la trempe dans une sauce qu'on compose soi-même avec soja, vinaigre, moutarde et piment, et on ajoute au bouillon des nouilles ou du gâteau de riz au fil du repas. Ce qui va dans la marmite en plus — pomme de terre, gâteau de riz, raviolis — change selon l'adresse.",
    howItWorksAr:
      'دجاجة كاملة تُطهى على مهل في مرق صافٍ فوق موقد في وسط الطاولة. تفكّك اللحم بالمقص والملقط، وتغمسه في صلصة تخلطها بنفسك من الصويا والخل والخردل والفلفل الحار، وتضيف إلى المرق شعيرية أو كعك أرز أثناء الأكل. ما يدخل القِدر إلى جانبها — بطاطا، كعك أرز، فطائر — يختلف من محل إلى آخر.',
    howItWorksZh:
      '一整只鸡在清汤里，放在桌子中间的炉子上慢慢煮。用剪刀和夹子把肉撕开，蘸自己用酱油、醋、芥末和辣椒调的酱，汤里则边吃边下面条或年糕。锅里另外放什么——土豆、年糕、饺子——一家一个样。',
    howItWorksJa:
      '鶏一羽を澄んだスープで、卓の真ん中のコンロで煮ます。ハサミとトングで肉をほぐし、醤油・酢・からし・唐辛子を自分で混ぜたたれにつけ、食べながらスープに麺や餅を足します。鍋にほかに何が入るか——じゃがいも、餅、餃子——は店ごとに違います。',
    culture:
      "동대문 has a street of these, said to have opened for the market's night workers and still full at hours when other restaurants have closed. It is Seoul food rather than old Korean food — a restaurant invention, not a home one — and it has the loyal, argumentative following of a dish that belongs to a city.",
    cultureKo:
      '동대문에 이 집들이 늘어선 골목이 있습니다. 시장의 밤일꾼들을 위해 열었다고들 하고, 다른 식당이 문 닫은 시간에도 아직 차 있어요. 오래된 한국 음식이라기보다 서울 음식입니다. 집이 아니라 식당에서 만들어진 것이고요. 그리고 한 도시에 속한 음식 특유의, 충성스럽고 논쟁 잘하는 단골들이 있습니다.',
    cultureEs:
      'Dongdaemun tiene una calle entera de estos sitios; se dice que abrieron para los trabajadores nocturnos del mercado, y siguen llenos a horas en que otros restaurantes ya han cerrado. Es comida de Seúl más que comida coreana antigua —un invento de restaurante, no de casa—, y tiene el público fiel y discutidor de un plato que pertenece a una ciudad.',
    cultureFr:
      "Dongdaemun en a toute une rue ; on dit qu'elles ont ouvert pour les travailleurs de nuit du marché, et elles sont encore pleines à des heures où les autres restaurants ont fermé. C'est de la cuisine de Séoul plutôt que de la vieille cuisine coréenne — une invention de restaurant, pas de maison — et elle a le public fidèle et querelleur d'un plat qui appartient à une ville.",
    cultureAr:
      'في دونغديمون شارع كامل من هذه المحال؛ يُقال إنها فُتحت لعمّال الليل في السوق، وما زالت ممتلئة في ساعات أغلقت فيها المطاعم الأخرى. هو طعام سيول أكثر منه طعامًا كوريًّا قديمًا — ابتكار مطاعم لا بيوت — وله جمهور وفيّ مجادل كما لطبق ينتمي إلى مدينة.',
    cultureZh:
      '东大门有一整条街都是这个；据说是为市场的夜班工人开的，别的饭馆早已打烊的钟点，这里还坐得满满的。它是首尔的吃食，而不是什么古老的韩国菜——是饭馆发明的，不是家里的——也有着一道属于某座城市的菜才会有的那种忠实又爱争的拥趸。',
    cultureJa:
      '東大門にはこの店が一筋並んでいます。市場の夜勤の人たちのために開いたのだと言われ、ほかの店が閉まった時間にもまだ席が埋まっています。古い韓国料理というより、ソウルの料理です。家ではなく食堂で生まれたもので、ひとつの都市に属する料理ならではの、忠実で口うるさい常連がついています。',
    contains: ['chicken'],
    // The broth is plain; the chilli is in the sauce you mix, which the
    // prose says. Same rule as 삼겹살 and its 쌈장.
    spice: 0,
    // Potato, rice cake, dumplings, the 다대기 — what goes in beside the bird
    // differs by shop.
    varies: true,
    storySources: ['wikipedia-dakhanmari-ko'],
    story: 'The name is an order, not a description: \'one chicken\'. It came out of Dongdaemun market in Seoul in the 1960s, and the encyclopaedia gives two accounts of the name without choosing — that customers in a hurry shouted for one whole chicken, or that it says you will be eating the whole thing. Both are about the same fact: nothing is portioned. A whole bird goes into the pot with potato, spring onion and garlic; you pull it apart at the table, dip it in soy, vinegar and mustard, and when the meat is gone noodles go into what is left.',
    storyKo: '이름은 설명이 아니라 주문입니다. \'닭 한 마리\'. 1960년대 서울 동대문시장에서 나왔고, 백과사전은 이름의 유래를 두 가지로 전하면서 어느 쪽도 고르지 않습니다 — 바쁜 손님들이 \'닭 한 마리 빨리 달라\'고 외쳤다는 설, 그리고 한 마리를 통째로 먹는 방식을 가리킨다는 설입니다. 둘 다 같은 사실을 말합니다. 나눠서 담아 나오는 게 없다는 것. 닭 한 마리가 통째로 감자·대파·마늘과 함께 냄비에 들어가고, 식탁에서 직접 뜯어 간장·식초·겨자에 찍어 먹습니다. 고기가 없어지면 남은 국물에 국수를 넣습니다.',
    storyEs: 'El nombre es un pedido, no una descripción: \'un pollo\'. Salió del mercado de Dongdaemun, en Seúl, en los años sesenta, y la enciclopedia da dos versiones del nombre sin decidirse: que los clientes con prisa pedían a gritos un pollo entero, o que indica que te lo vas a comer entero. Ambas dicen lo mismo: no se raciona nada. Un ave entera va a la olla con patata, cebolleta y ajo; la deshaces en la mesa, la mojas en soja, vinagre y mostaza, y cuando se acaba la carne se echan fideos a lo que queda.',
    storyFr: 'Le nom est une commande, pas une description : « un poulet ». Il est sorti du marché de Dongdaemun, à Séoul, dans les années 1960, et l\'encyclopédie donne deux versions du nom sans trancher : des clients pressés réclamant un poulet entier, ou l\'idée que vous allez le manger en entier. Les deux disent la même chose : rien n\'est portionné. Une volaille entière va dans la marmite avec pomme de terre, ciboule et ail ; on la défait à table, on la trempe dans soja, vinaigre et moutarde, et quand la viande a disparu on met des nouilles dans ce qui reste.',
    storyAr: 'الاسم طلبٌ لا وصف: «دجاجة واحدة». خرج من سوق دونغدايمون في سول في الستينيات، وتنقل الموسوعة روايتين للاسم دون أن ترجّح إحداهما — أنّ الزبائن المستعجلين كانوا ينادون بدجاجة كاملة، أو أنّه يشير إلى أنّك ستأكلها كلّها. وكلتاهما تقولان الشيء نفسه: لا شيء يُقسَّم إلى حصص. تدخل الدجاجة كاملةً القِدر مع البطاطا والبصل الأخضر والثوم؛ تفكّكها على المائدة وتغمسها في الصويا والخلّ والخردل، وحين ينفد اللحم تُوضع المعكرونة فيما بقي.',
    storyZh: '这个名字是一句点单，不是描述：“一只鸡”。它出自1960年代首尔的东大门市场，百科全书给了两种说法却不作取舍——赶时间的客人喊“来一只鸡”，或者说它指的是你会把整只吃掉。两种说法讲的是同一件事：什么都不分份。整只鸡连同土豆、大葱、蒜下锅；你在桌上自己撕开，蘸酱油、醋和芥末，肉吃完了，再把面下进剩下的汤里。',
    storyJa: '名前は説明ではなく注文です。「鶏一羽」。1960年代、ソウルの東大門市場から出てきました。百科事典は名前の由来を二つ挙げて、どちらとも決めていません——急いでいる客が「鶏一羽、早く」と叫んだという説と、一羽まるごと食べる食べ方を指すという説です。どちらも同じ事実を言っています。取り分けられて出てくるものが何もない、ということ。鶏が一羽そのまま、じゃがいも、長ねぎ、にんにくと鍋に入り、食卓で自分でほぐし、醤油と酢とからしにつけて食べます。肉がなくなったら、残った汁に麺を入れます。',
    themeId: null,
    zones: ['동대문 닭한마리골목'],
  },
  {
    id: 'jeongol',
    name: 'Jeongol',
    // An umbrella: 버섯전골 and 곱창전골 are different foods. `contains` is
    // empty because the gloss says nothing about ingredients at all — which
    // is a different reason from 해물찜's, whose name already says seafood.
    gloss: "Hotpot — the kind is the house's call",
    glossKo: '무엇을 넣는지는 집이 정하는 전골',
    glossEs: 'Una olla caliente; de qué, lo decide la casa',
    glossFr: "Une marmite — laquelle, c'est la maison qui décide",
    glossAr: 'قِدر ساخنة — أيّ نوع، يقرّره المحل',
    glossZh: '一锅，放什么由店家定',
    glossJa: '鍋もの、何の鍋かは店しだい',
    nameKo: '전골',
    romanization: 'jeon-gol',
    category: MENU_CATEGORY.STEW,
    minPeople: 2,
    whyShared:
      'There is no single serving of a hotpot. The smallest is for two, and the pan is sized for the table it is put on. The cooking happens in front of everyone at once.',
    whySharedKo:
      '전골에 1인분은 없어요. 제일 작은 게 2인용이고, 냄비는 놓이는 상에 맞춰 크기가 정해집니다. 끓는 건 모두 앞에서 한꺼번에 일어나요.',
    whySharedEs:
      'No hay ración individual de olla caliente. La más pequeña es para dos, y la cazuela va del tamaño de la mesa en la que se pone. La cocción ocurre delante de todos a la vez.',
    whySharedFr:
      "Il n'y a pas de portion individuelle de marmite. La plus petite est pour deux, et le plat est dimensionné pour la table où on le pose. La cuisson se fait devant tout le monde en même temps.",
    whySharedAr:
      'لا حصة فردية للقِدر الساخنة. أصغرها لشخصين، والإناء بحجم الطاولة التي يوضع عليها. والطهي يجري أمام الجميع في آنٍ واحد.',
    whySharedZh:
      '火锅没有单人份。最小的也是两人份，锅的大小按摆上去的那张桌子来。煮，是当着所有人的面一起煮的。',
    whySharedJa:
      '鍋ものに一人前はありません。いちばん小さいもので二人用、鍋の大きさは置かれる卓に合わせて決まります。煮えるのはみんなの目の前で、いっぺんにです。',
    howItWorks:
      "Ingredients arranged raw in a wide shallow pan, broth poured over, and the whole thing brought to a boil at the table. The name is the pan, not the filling: mushroom, beef intestine, seafood, kimchi, dumplings — the shop's sign tells you which.",
    howItWorksKo:
      '넓고 얕은 냄비에 재료를 날것으로 둘러 담고 육수를 부어 상에서 끓입니다. 이름은 냄비를 가리키지 속을 가리키지 않아요. 버섯, 곱창, 해물, 김치, 만두 — 무엇인지는 그 집 간판이 말해 줍니다.',
    howItWorksEs:
      'Los ingredientes se disponen crudos en una cazuela ancha y baja, se cubren de caldo y todo se lleva a ebullición en la mesa. El nombre es la cazuela, no el relleno: setas, tripa de ternera, marisco, kimchi, empanadillas; el letrero del local te dice cuál.',
    howItWorksFr:
      "Les ingrédients sont disposés crus dans un plat large et peu profond, le bouillon est versé dessus, et le tout est porté à ébullition à table. Le nom désigne le plat, pas la garniture : champignons, tripes de bœuf, fruits de mer, kimchi, raviolis — l'enseigne de la boutique vous dit lequel.",
    howItWorksAr:
      'تُرتَّب المكوّنات نيئة في مقلاة واسعة ضحلة، ويُصبّ المرق فوقها، ويُغلى الكل على الطاولة. الاسم يصف الإناء لا الحشوة: فطر، أمعاء بقر، مأكولات بحرية، كيمتشي، فطائر — ولافتة المحل تقول لك أيّها.',
    howItWorksZh:
      '食材生着在宽浅的锅里摆好，浇上汤，整锅端到桌上煮开。这个名字说的是锅，不是里面的东西：蘑菇、牛肠、海鲜、泡菜、饺子——是哪一种，看那家店的招牌。',
    howItWorksJa:
      '広く浅い鍋に具を生のまま並べ、だしを注ぎ、卓上で煮立てます。名前が指すのは鍋であって中身ではありません。きのこ、牛ホルモン、海鮮、キムチ、餃子——どれなのかは、店の看板が教えてくれます。',
    culture:
      'The most social shape Korean food takes: the table watches one pot, reaches into one pot, and whoever is nearest the burner ends up in charge without being asked. A hotpot restaurant seats people around the flame as much as across from each other, and the meal takes as long as the pot does.',
    cultureKo:
      '한국 음식이 취하는 가장 사교적인 모양입니다. 상 전체가 같은 냄비를 보고, 같은 냄비에 손을 뻗고, 버너에 제일 가까운 사람이 시키지 않아도 담당이 돼요. 전골집은 마주보게 앉히는 만큼 불을 둘러싸게도 앉히고, 식사는 냄비가 걸리는 만큼 걸립니다.',
    cultureEs:
      'La forma más social que toma la comida coreana: la mesa mira una sola olla, mete la cuchara en una sola olla, y quien queda más cerca del hornillo acaba al mando sin que nadie se lo pida. Un local de olla caliente sienta a la gente alrededor del fuego tanto como frente a frente, y la comida dura lo que dura la olla.',
    cultureFr:
      "La forme la plus sociale que prenne la cuisine coréenne : la tablée regarde une seule marmite, pioche dans une seule marmite, et celui qui est le plus près du réchaud se retrouve aux commandes sans qu'on le lui demande. Une adresse à marmite installe les gens autour de la flamme autant que face à face, et le repas dure ce que dure la marmite.",
    cultureAr:
      'أكثر الأشكال اجتماعيةً التي يتخذها الطعام الكوري: الطاولة تراقب قِدرًا واحدة، وتمدّ يدها إلى قِدر واحدة، ومن يكون أقرب إلى الموقد يصير المسؤول من دون أن يُطلب منه. يُجلس مطعم القِدر الساخنة الناس حول اللهب بقدر ما يُجلسهم متقابلين، والوجبة تدوم ما تدومه القِدر.',
    cultureZh:
      '韩国吃食里最热闹的一种样子：一桌人盯着一口锅，伸筷子进同一口锅，离炉子最近的那个人，不用谁开口就成了掌勺的。火锅店安排座位，围着火坐和面对面坐一样多，而这顿饭有多长，看锅有多长。',
    cultureJa:
      '韓国の食べもののなかでいちばん人の集まる形です。卓のみんなが一つの鍋を見て、一つの鍋に箸を伸ばし、コンロにいちばん近い人が頼まれもしないのに係になります。鍋の店は人を向かい合わせるのと同じくらい火を囲ませて座らせ、食事は鍋がかかるだけの時間かかります。',
    contains: [],
    spice: 0,
    varies: true,
    storySources: ['wikipedia-jeongol-ko'],
    story: 'What makes it a 전골 and not a 찌개 is that it does not turn on one thing. A stew is built around an ingredient; this is built around several, laid raw in the pan by colour before the broth goes over them — the arranging is part of the dish, which is why it arrives before it is food and finishes in front of you. The encyclopaedia records an origin story worth repeating even as a story: that soldiers of Goguryeo, Baekje and Silla, short of pots on campaign, cooked in their helmets. Whatever the truth of it, the shape survives — a shallow wide pan in the middle of a table, and everybody\'s chopsticks in it.',
    storyKo: '전골이 찌개가 아닌 이유는, 한 가지 재료를 중심으로 돌지 않기 때문입니다. 찌개는 주재료 하나를 두고 끓이지만, 전골은 여러 재료를 색을 맞춰 전골틀에 날것으로 담고 그 위에 육수를 붓습니다. 담는 일 자체가 요리의 일부라서, 음식이 되기 전에 상에 오고 눈앞에서 완성됩니다. 백과사전에는 이야기로만이라도 옮길 만한 유래담이 실려 있습니다. 고구려·백제·신라의 군사들이 전장에서 조리기구가 부족해 철모에 끓여 먹었다는 것입니다. 사실 여부와 무관하게 그 형태는 남았습니다. 상 한가운데 놓인 넓고 얕은 판, 그리고 거기 함께 들어가는 모두의 젓가락.',
    storyEs: 'Lo que lo hace 전골 y no 찌개 es que no gira sobre una sola cosa. Un guiso se construye alrededor de un ingrediente; esto se construye alrededor de varios, colocados crudos en la sartén por colores antes de verter el caldo: la colocación es parte del plato, por eso llega antes de ser comida y se termina delante de ti. La enciclopedia recoge un relato de origen que merece repetirse aunque sea como relato: que los soldados de Goguryeo, Baekje y Silla, sin ollas en campaña, cocinaban en sus cascos. Sea cierto o no, la forma ha sobrevivido: una sartén ancha y baja en medio de la mesa, y en ella los palillos de todos.',
    storyFr: 'Ce qui en fait un 전골 et non un 찌개, c\'est qu\'il ne tourne pas autour d\'une seule chose. Un ragoût se construit autour d\'un ingrédient ; celui-ci se construit autour de plusieurs, disposés crus dans la poêle par couleurs avant qu\'on verse le bouillon — la disposition fait partie du plat, c\'est pourquoi il arrive avant d\'être un plat et s\'achève devant vous. L\'encyclopédie rapporte un récit d\'origine qui mérite d\'être répété ne serait-ce que comme récit : les soldats de Goguryeo, Baekje et Silla, à court de marmites en campagne, cuisinaient dans leurs casques. Vrai ou non, la forme a survécu : une poêle large et basse au milieu de la table, et les baguettes de tout le monde dedans.',
    storyAr: 'ما يجعله 전골 لا 찌개 أنّه لا يدور حول شيء واحد. اليخنة تُبنى حول مكوّنٍ واحد؛ وهذا يُبنى حول عدّة مكوّنات تُرصّ نيّئةً في المقلاة بحسب الألوان قبل أن يُصبّ فوقها المرق — والترتيب نفسه جزء من الطبق، ولذلك يصل قبل أن يكون طعامًا ويكتمل أمامك. وتنقل الموسوعة روايةً عن أصله تستحقّ أن تُروى ولو بوصفها رواية: أنّ جنود غوغوريو وبيكجي وشيلا، حين أعوزتهم القدور في الحملات، طبخوا في خوذهم. وسواء صحّ ذلك أم لا، فالشكل بقي: مقلاة عريضة ضحلة في وسط المائدة، وفيها عيدان الجميع.',
    storyZh: '它之所以是 전골 而不是 찌개，是因为它不围着某一样东西转。찌개 是围绕一种主料煮出来的；这个是围绕好几种，生的按颜色码在锅里，然后浇上高汤——摆盘本身就是这道菜的一部分，所以它是在还不算食物的时候就端上桌，在你面前完成的。百科全书记着一个哪怕当故事听也值得转述的来历：高句丽、百济、新罗的士兵在行军中缺锅，就用头盔煮饭。不论真假，那个形状留下来了——桌子中间一口又宽又浅的锅，还有所有人伸进去的筷子。',
    storyJa: 'これが 찌개 ではなく 전골 であるのは、ひとつの素材を軸に回らないからです。찌개 はひとつの主材を中心に組み立てますが、こちらは何種類もを、生のまま色を合わせて鍋に並べ、その上から出汁を注ぎます。並べること自体が料理の一部なので、まだ食べ物になる前に膳に上がり、目の前で仕上がるのです。百科事典には、物語としてでも伝える値打ちのある由来が載っています。高句麗・百済・新羅の兵士たちが、遠征で鍋が足りず兜で煮炊きしたというもの。真偽はともかく、その形は残りました。食卓の真ん中の、浅くて広い鍋。そこに集まる全員の箸。',
    themeId: null,
    zones: ['삼각지 대구탕골목', '종로3가 순대골목'],
  },

  // 나눠 먹는 상 — two things that arrive once, in the middle, finished.
  {
    id: 'jjimdak',
    name: 'Jjimdak',
    gloss: 'Chicken braised in soy, served to share',
    glossKo: '간장에 졸여 나눠 먹는 닭',
    glossEs: 'Pollo guisado en soja, para compartir',
    glossFr: 'Poulet braisé à la sauce soja, à partager',
    glossAr: 'دجاج مطهو بالصويا، يُقدَّم للمشاركة',
    glossZh: '酱油炖鸡，分着吃',
    glossJa: '醤油で煮た鶏、分け合って食べる',
    nameKo: '찜닭',
    romanization: 'jjim-dak',
    category: MENU_CATEGORY.PLATTER,
    minPeople: 2,
    whyShared:
      'It arrives finished, in one wide dish. A whole bird, cut up and braised over potato and glass noodles, so it is not portioned — it lands once, in the middle, and you eat from it until it is gone.',
    whySharedKo:
      '완성된 채로 넓은 접시 하나에 나옵니다. 닭 한 마리를 토막 내서 감자와 당면을 깔고 졸인 것이라 나눠 담지 않아요 — 한 번 가운데 나오고, 없어질 때까지 거기서 먹습니다.',
    whySharedEs:
      'Llega terminado, en una fuente ancha. Un pollo entero troceado y guisado sobre patata y fideos de cristal, así que no se raciona: cae una vez, en el centro, y se come de ahí hasta que se acaba.',
    whySharedFr:
      "Il arrive fini, dans un seul grand plat. Un poulet entier, découpé et braisé sur des pommes de terre et des vermicelles, donc pas de portions — il est posé une fois, au milieu, et on y mange jusqu'à ce qu'il n'y ait plus rien.",
    whySharedAr:
      'يصل جاهزًا في صحن واسع واحد. دجاجة كاملة مقطّعة ومطهوة فوق بطاطا وشعيرية زجاجية، فلا تُقسَّم حصصًا — تُوضع مرة واحدة في الوسط، وتأكل منها حتى تنفد.',
    whySharedZh:
      '做好了才上，装在一个宽盘里。一整只鸡切块，垫着土豆和粉条炖，所以不分份——放到中间一次，吃到没有为止。',
    whySharedJa:
      '仕上がった状態で、広い皿ひとつに来ます。鶏一羽をぶつ切りにして、じゃがいもと春雨の上で煮たものなので、取り分けはしません。真ん中に一度置かれ、なくなるまでそこから食べます。',
    howItWorks:
      'Chicken pieces braised in soy, sugar and garlic with potato, carrot and sweet-potato noodles, served in a wide dish. Sweet before it is anything else. The default carries a few dried chillies and stays mild; a hot version is ordered by name.',
    howItWorksKo:
      '닭 토막을 간장·설탕·마늘에 감자·당근·당면과 함께 졸여 넓은 접시에 냅니다. 무엇보다 먼저 달아요. 기본에는 마른 고추가 몇 개 들어가 순한 편이고, 매운 것은 따로 이름을 불러 시킵니다.',
    howItWorksEs:
      'Trozos de pollo guisados en soja, azúcar y ajo con patata, zanahoria y fideos de boniato, servidos en una fuente ancha. Dulce antes que cualquier otra cosa. La versión normal lleva unos pocos chiles secos y se queda suave; la picante se pide por su nombre.',
    howItWorksFr:
      "Des morceaux de poulet braisés dans la sauce soja, le sucre et l'ail avec pommes de terre, carottes et vermicelles de patate douce, servis dans un grand plat. Sucré avant toute chose. La version de base contient quelques piments séchés et reste douce ; la version forte se commande par son nom.",
    howItWorksAr:
      'قطع دجاج مطهوة بالصويا والسكر والثوم مع بطاطا وجزر وشعيرية البطاطا الحلوة، تُقدَّم في صحن واسع. حلوة قبل أي شيء آخر. النسخة الأساسية فيها بضع فلفلات مجففة وتبقى معتدلة؛ والحارّة تُطلب باسمها.',
    howItWorksZh:
      '鸡块用酱油、糖和蒜，和土豆、胡萝卜、红薯粉条一起炖，装在宽盘里。首先是甜的。基本款里放几个干辣椒，不怎么辣；辣的那种要指名点。',
    howItWorksJa:
      '鶏のぶつ切りを醤油・砂糖・にんにくで、じゃがいも・にんじん・さつまいも春雨と煮て、広い皿に盛ります。何よりまず甘い。基本のものには乾燥唐辛子が数本入るだけで穏やかで、辛いものは名前を言って頼みます。',
    culture:
      "안동 has it as a named specialty and the rest of the country has it as a delivery order — a dish that moved from one market's alley to every university neighbourhood within a generation. It is more rice food than drinking food: the noodles and the sauce are there to be spooned over a bowl, and the dish tends to empty in that order.",
    cultureKo:
      '안동에서는 이름 붙은 특산이고 나머지 지역에서는 배달 메뉴입니다. 한 시장 골목에서 한 세대 안에 전국 대학가로 퍼진 음식이에요. 술안주라기보다 밥 음식입니다. 당면과 양념은 밥 위에 끼얹으라고 있는 것이고, 접시는 대개 그 순서로 비워집니다.',
    cultureEs:
      'Andong lo tiene como especialidad con nombre propio y el resto del país como pedido a domicilio: un plato que pasó del callejón de un mercado a todos los barrios universitarios en una generación. Es más comida de arroz que de beber: los fideos y la salsa están para echarlos sobre el cuenco, y la fuente suele vaciarse en ese orden.',
    cultureFr:
      "Andong l'a comme spécialité à son nom, et le reste du pays comme plat à livrer — un plat passé de la ruelle d'un marché à tous les quartiers étudiants en une génération. C'est plus un plat pour le riz que pour l'alcool : les vermicelles et la sauce sont là pour être versés sur le bol, et le plat a tendance à se vider dans cet ordre.",
    cultureAr:
      'في أندونغ هو تخصّص يحمل اسمها، وفي بقية البلاد طلبُ توصيل — طبق انتقل من زقاق سوق واحد إلى كل أحياء الجامعات في جيل واحد. هو طعام أرز أكثر منه طعام شراب: الشعيرية والصلصة موجودتان لتُسكبا فوق الوعاء، والصحن يميل إلى أن يفرغ بهذا الترتيب.',
    cultureZh:
      '安东把它当作有名有姓的特产，其余地方把它当外卖——一道菜，一代人的工夫，从一个市场的巷子传到了全国的大学城。它更像下饭菜而不是下酒菜：粉条和酱汁是用来浇在饭碗上的，这盘也往往就按这个顺序空下去。',
    cultureJa:
      '安東では名前のついた名物で、ほかの地方では出前の一品です。ひとつの市場の路地から、一世代のうちに全国の大学街へ広まった料理です。酒の肴というよりご飯の料理で、春雨とたれは丼にかけるためにあり、皿はたいていその順に空いていきます。',
    contains: ['chicken'],
    // A few dried chillies in the soy braise: present, mild. 매운찜닭 is
    // another order.
    spice: 1,
    storySources: ['wikipedia-jjimdak-ko'],
    story: 'It was made in one alley, in one market, in one city. Andong\'s old market had a 통닭골목 — a whole-chicken alley — that turned into a 찜닭골목 through the 1970s and 80s, moving from fried chicken to garlic chicken to this. Three accounts of the name compete and the encyclopaedia keeps all three, one of them simply that the alley needed an answer to fried chicken spreading everywhere. It reached Seoul in the 2000s, and a television programme in 2001 did the rest. The glass noodles at the bottom are not a side: they are where the sauce ends up, and they are the reason the dish is ordered for a table.',
    storyKo: '한 도시의, 한 시장의, 한 골목에서 만들어졌습니다. 안동 구시장에는 \'통닭골목\'이 있었는데, 1970~80년대를 지나며 튀김통닭에서 마늘통닭으로, 다시 찜닭으로 옮겨가 \'찜닭골목\'이 되었습니다. 이름의 유래는 세 가지 설이 경쟁하고 백과사전은 셋 다 그대로 둡니다. 그중 하나는 그저 프라이드 치킨이 퍼져나가는 데 대한 골목의 대답이 필요했다는 것이고요. 서울에 올라온 것은 2000년대, 2001년 방송이 나머지를 했습니다. 바닥의 당면은 곁들이가 아닙니다. 양념이 결국 모이는 자리이고, 이 음식을 여럿이 시키는 이유입니다.',
    storyEs: 'Se hizo en un callejón, en un mercado, en una ciudad. El mercado viejo de Andong tenía un 통닭골목 —el callejón del pollo entero— que se convirtió en 찜닭골목 a lo largo de los setenta y ochenta, pasando del pollo frito al pollo al ajo y de ahí a esto. Compiten tres versiones del nombre y la enciclopedia conserva las tres; una de ellas es sencillamente que el callejón necesitaba una respuesta a la expansión del pollo frito. Llegó a Seúl en los 2000, y un programa de televisión en 2001 hizo el resto. Los fideos de batata del fondo no son un acompañamiento: son donde acaba la salsa, y la razón por la que se pide para una mesa.',
    storyFr: 'Il a été inventé dans une ruelle, d\'un marché, d\'une ville. Le vieux marché d\'Andong avait un 통닭골목 — la ruelle du poulet entier — devenue 찜닭골목 au fil des années 1970 et 1980, en passant du poulet frit au poulet à l\'ail puis à ceci. Trois versions du nom se disputent et l\'encyclopédie les garde toutes les trois ; l\'une d\'elles est simplement que la ruelle avait besoin d\'une réponse à la diffusion du poulet frit. Il a gagné Séoul dans les années 2000, et une émission de télévision en 2001 a fait le reste. Les vermicelles au fond ne sont pas un accompagnement : c\'est là que la sauce finit, et c\'est pour cela qu\'on le commande pour une tablée.',
    storyAr: 'صُنع في زقاقٍ واحد، في سوقٍ واحد، في مدينةٍ واحدة. كان في السوق القديم بمدينة أندونغ 통닭골목، أي زقاق الدجاج الكامل، فصار 찜닭골목 عبر السبعينيات والثمانينيات، منتقلًا من الدجاج المقلي إلى دجاج الثوم إلى هذا. تتنازع ثلاث روايات على الاسم وتحتفظ الموسوعة بالثلاث؛ إحداها ببساطة أنّ الزقاق احتاج جوابًا على انتشار الدجاج المقلي. وبلغ سول في العقد الأول من الألفية، وأتمّ برنامجٌ تلفزيوني سنة 2001 ما تبقّى. أمّا الشعيرية في القاع فليست طبقًا جانبيًّا: هناك تنتهي الصلصة، ولذلك يُطلب هذا الطبق لمائدة.',
    storyZh: '它是在一座城、一个市场、一条巷子里做出来的。安东旧市场原本有一条 통닭골목（整鸡巷），在七八十年代一路变成了 찜닭골목，从炸鸡到蒜香鸡，再到这个。关于名字有三种说法在竞争，百科全书三种都留着；其中一种不过是说，那条巷子需要一个应对炸鸡到处开花的答案。它2000年代进了首尔，2001年的一档电视节目做完了剩下的事。底下那层粉条不是配菜：那是酱汁最后落脚的地方，也是这道菜要一桌人一起点的理由。',
    storyJa: 'ひとつの都市の、ひとつの市場の、ひとつの路地で生まれました。安東の旧市場には「통닭골목（丸鶏の路地）」があり、1970〜80年代を通じて、フライドチキンからにんにく鶏へ、そしてこれへと移って「찜닭골목」になりました。名前の由来は三つの説が競い、百科事典は三つとも残しています。そのひとつは、フライドチキンが広がっていくのに対して路地なりの答えが要った、というだけのものです。ソウルに上がってきたのは2000年代、2001年のテレビ番組が残りを済ませました。底の春雨は付け合わせではありません。タレが最後にたどり着く場所であり、この料理を大勢で頼む理由です。',
    themeId: null,
    zones: ['안동 구시장 찜닭골목'],
  },
  {
    id: 'haemuljjim',
    name: 'Haemul-jjim',
    // Empty `contains` because the NAME already says seafood, and only which
    // seafood is the house's — different from 전골, where the gloss says
    // nothing about ingredients. Both are honest; the comment says which.
    gloss: 'Seafood steamed in chilli, mix varies',
    glossKo: '고춧가루에 찐 해물, 종류는 집마다',
    glossEs: 'Marisco al vapor con chile; la mezcla la decide la casa',
    glossFr: 'Fruits de mer à la vapeur au piment — le mélange, c\'est la maison',
    glossAr: 'مأكولات بحرية مطهوة بالبخار مع الفلفل الحار — والخليط من اختيار المحل',
    glossZh: '辣蒸海鲜，配什么由店家定',
    glossJa: '唐辛子で蒸した海鮮、組み合わせは店しだい',
    nameKo: '해물찜',
    romanization: 'hae-mul-jjim',
    category: MENU_CATEGORY.PLATTER,
    minPeople: 2,
    whyShared:
      'It comes as a mound on one platter, and the smallest mound is for two. Half of it is bean sprouts, which sounds like a trick until you see how much seafood is under them — and the point is that the table works down through it together.',
    whySharedKo:
      '한 접시에 산처럼 쌓여 나오고, 제일 작은 산이 2인용입니다. 절반은 콩나물이라 속임수 같지만 그 밑에 해물이 얼마나 있는지 보면 아니에요. 요점은 상 전체가 그걸 같이 파내려가는 것입니다.',
    whySharedEs:
      'Llega como una montaña en una sola fuente, y la montaña más pequeña es para dos. La mitad son brotes de soja, lo que parece una trampa hasta que ves cuánto marisco hay debajo; y la gracia es que la mesa lo va excavando junta.',
    whySharedFr:
      "Il arrive en montagne sur un seul plat, et la plus petite montagne est pour deux. La moitié, ce sont des germes de soja, ce qui a l'air d'une ruse jusqu'à ce qu'on voie ce qu'il y a de fruits de mer dessous — et l'intérêt, c'est que la tablée creuse dedans ensemble.",
    whySharedAr:
      'يصل كومةً على صحن واحد، وأصغر كومة لشخصين. نصفه براعم فول الصويا، وهذا يبدو خدعة حتى ترى كم من المأكولات البحرية تحتها — والمقصود أن الطاولة تحفر فيه معًا.',
    whySharedZh:
      '堆成一座山装在一个盘里上来，最小的那座山也是两人份。一半是豆芽，看着像糊弄，直到你看到底下埋了多少海鲜——而要紧的是，一桌人一起往下挖。',
    whySharedJa:
      '一枚の皿に山のように盛られて来て、いちばん小さな山で二人用です。半分は豆もやしで、ごまかしのように見えますが、その下にどれだけ海鮮があるかを見れば違います。肝心なのは、卓のみんなでそれを掘り進むことです。',
    howItWorks:
      'Bean sprouts and seafood steamed together under a thick, very hot chilli paste — crab, prawns, clams, squid, octopus, sometimes monkfish, in whatever mix the shop uses. You wear plastic gloves, and rice is fried in the pan at the end. Do not expect to taste much besides chilli.',
    howItWorksKo:
      '콩나물과 해물을 걸쭉하고 아주 매운 고추 양념 아래에서 같이 찝니다. 게, 새우, 조개, 오징어, 낙지, 때로 아구 — 무엇이 섞이는지는 그 집이 정해요. 비닐장갑을 끼고 먹고, 마지막에 팬에 밥을 볶습니다. 고추 말고 다른 맛을 많이 기대하지 마세요.',
    howItWorksEs:
      'Brotes de soja y marisco cocidos al vapor juntos bajo una pasta de chile espesa y muy picante: cangrejo, gambas, almejas, calamar, pulpo, a veces rape, en la mezcla que use la casa. Se come con guantes de plástico, y al final se saltea arroz en la misma sartén. No esperes saborear mucho más que el chile.',
    howItWorksFr:
      "Germes de soja et fruits de mer cuits à la vapeur ensemble sous une pâte de piment épaisse et très forte — crabe, crevettes, palourdes, calmar, poulpe, parfois lotte, dans le mélange qu'utilise la maison. On mange avec des gants en plastique, et à la fin on fait sauter du riz dans le plat. N'espérez pas goûter grand-chose d'autre que le piment.",
    howItWorksAr:
      'براعم فول الصويا ومأكولات بحرية تُطهى بالبخار معًا تحت معجون فلفل ثخين حارّ جدًّا — سلطعون، جمبري، محار، حبّار، أخطبوط، وأحيانًا سمك أبو الشص، بالخليط الذي يستعمله المحل. تأكل بقفازات بلاستيكية، وفي النهاية يُقلى الأرز في المقلاة. لا تتوقع أن تتذوق كثيرًا سوى الفلفل الحار.',
    howItWorksZh:
      '豆芽和海鲜一起，在又稠又辣的辣椒酱下面蒸——螃蟹、虾、蛤蜊、鱿鱼、章鱼，有时还有安康鱼，配法看那家店。戴塑料手套吃，最后在锅里炒饭。别指望尝出辣以外的多少味道。',
    howItWorksJa:
      '豆もやしと海鮮を、濃くてとても辛い唐辛子だれの下でいっしょに蒸します。かに、えび、あさり、イカ、タコ、ときにアンコウ——組み合わせは店しだいです。ビニール手袋をはめて食べ、最後に鍋でご飯を炒めます。唐辛子のほかの味はあまり期待しないでください。',
    culture:
      'Built for a group and for a drink, and honest about both — it is hard to find in a single serving and hard to eat quietly. 마산 claims the monkfish version and Seoul has shops that sell nothing else. It is one of the dishes where the chilli is a decision rather than a seasoning: people order the level, and the level is part of the story afterwards.',
    cultureKo:
      '여럿과 술을 위해 만들어진 음식이고, 둘 다 숨기지 않습니다. 1인분은 찾기 어렵고 조용히 먹기도 어려워요. 마산은 아구찜 판본을 자기 것이라 하고, 서울에는 이것만 파는 집들이 있습니다. 고추가 양념이 아니라 결정인 음식이에요. 맵기 단계를 골라 시키고, 그 단계가 나중에 이야깃거리가 됩니다.',
    cultureEs:
      'Hecho para un grupo y para beber, y honesto con ambas cosas: cuesta encontrarlo en ración individual y cuesta comerlo en silencio. Masan reclama la versión de rape, y en Seúl hay locales que no venden otra cosa. Es de esos platos en los que el chile es una decisión y no un condimento: se pide el nivel, y el nivel forma parte de la historia después.',
    cultureFr:
      "Fait pour un groupe et pour boire, et honnête sur les deux : difficile à trouver en portion individuelle, difficile à manger en silence. Masan revendique la version à la lotte, et Séoul a des adresses qui ne vendent rien d'autre. C'est un de ces plats où le piment est une décision et non un assaisonnement : on commande le niveau, et le niveau fait partie de l'histoire après.",
    cultureAr:
      'صُنع لجماعة وللشراب، وصادق في الأمرين — يصعب أن تجده حصة فردية ويصعب أن تأكله بهدوء. تدّعي ماسان نسخة سمك أبو الشص، وفي سيول محال لا تبيع سواه. هو من الأطباق التي يكون فيها الفلفل الحار قرارًا لا توابل: تطلب الدرجة، والدرجة تصير جزءًا من الحكاية بعد ذلك.',
    cultureZh:
      '为一群人和为喝酒而生，两样都不藏着：单人份不好找，安安静静地吃也难。马山说安康鱼那种是他们的，首尔则有只卖这一样的店。它属于那种辣不是调味而是决定的菜：点的时候选辣度，而那个辣度，事后会成为故事的一部分。',
    cultureJa:
      '大勢と酒のためにできた料理で、その二つを隠しません。一人前は見つけにくく、静かに食べるのも難しい。馬山はアンコウのものを自分たちのだと言い、ソウルにはこれしか出さない店があります。唐辛子が調味ではなく決断になる料理のひとつで、辛さの段階を選んで頼み、その段階があとで話の種になります。',
    contains: [],
    spice: 3,
    varies: true,
    storySources: ['wikipedia-agujjim-ko'],
    story: 'Its closest documented relative is 아귀찜, and that one has a beginning: fishermen in Masan brought what they had landed to a tavern and asked for it to be made into something to drink over. Monkfish was widely discarded until about thirty years ago — it went into the pot because nobody else wanted it. The method is the part that carries over: bean sprouts and 미더덕 and 미나리 steamed under a chilli paste thick enough to coat rather than pour. What arrives under it changes with the day\'s catch, which is why nobody can tell you in advance exactly what you are ordering.',
    storyKo: '기록으로 확인되는 가장 가까운 친척은 아귀찜이고, 그쪽에는 시작이 있습니다. 마산의 어부들이 잡아 온 것을 선술집에 가져가 술안주로 만들어 달라고 부탁한 데서 나왔습니다. 아귀는 30여 년 전까지도 버려지는 경우가 많았습니다. 아무도 원하지 않아서 냄비에 들어간 생선이었어요. 이어진 것은 방식입니다. 콩나물과 미더덕과 미나리를, 부어지는 게 아니라 입혀지는 정도로 되직한 고춧양념 아래에서 함께 찌는 것. 그 밑에 무엇이 들어 있는지는 그날 잡힌 것에 따라 달라집니다. 그래서 무엇을 시키는 것인지 아무도 미리 정확히 말해줄 수 없습니다.',
    storyEs: 'Su pariente documentado más cercano es el 아귀찜, y ese sí tiene un comienzo: los pescadores de Masan llevaban lo que habían capturado a una taberna y pedían que se lo prepararan para acompañar la bebida. El rape se desechaba con frecuencia hasta hace unos treinta años: fue a la olla porque nadie más lo quería. Lo que se hereda es el método: brotes de soja, 미더덕 y 미나리 al vapor bajo una pasta de guindilla lo bastante espesa para cubrir en vez de verterse. Lo que hay debajo cambia con la pesca del día, y por eso nadie puede decirte de antemano qué estás pidiendo exactamente.',
    storyFr: 'Son parent documenté le plus proche est l\'아귀찜, et celui-là a un commencement : les pêcheurs de Masan apportaient leur prise à une taverne et demandaient qu\'on en fasse de quoi accompagner à boire. La baudroie était largement jetée il y a encore une trentaine d\'années — elle est allée dans la marmite parce que personne n\'en voulait. Ce qui se transmet, c\'est la méthode : germes de soja, 미더덕 et 미나리 cuits à la vapeur sous une pâte de piment assez épaisse pour napper plutôt que couler. Ce qu\'il y a dessous change avec la pêche du jour, et c\'est pourquoi personne ne peut vous dire à l\'avance ce que vous commandez exactement.',
    storyAr: 'أقرب قريبٍ موثَّق له هو 아귀찜، ولذاك بداية: كان صيّادو ماسان يحملون ما اصطادوه إلى حانة ويطلبون أن يُصنع منه ما يُشرب عليه. وكان سمك المنك يُرمى كثيرًا حتى قبل نحو ثلاثين سنة — دخل القِدر لأنّ لا أحد أراده. أمّا ما انتقل فهو الطريقة: براعم الفول و미더덕 و미나리 تُطهى بالبخار تحت معجون فلفل كثيف يكسو ولا يُسكب. وما تحته يتغيّر بحسب صيد اليوم، ولذلك لا يستطيع أحد أن يخبرك سلفًا بما تطلبه بالضبط.',
    storyZh: '有据可查的最近的亲戚是 아귀찜，而那一道是有开头的：马山的渔民把打上来的鱼拿到小酒馆，请人做成下酒的菜。安康鱼直到三十来年前还常常被扔掉——它进锅，是因为没有别人要它。传下来的是做法：豆芽、미더덕 和 미나리 一起蒸，上面盖着稠到能挂住而不是浇下去的辣酱。底下是什么，随当天的渔获而变，所以没有人能事先告诉你，你点的到底是什么。',
    storyJa: '記録でたどれるいちばん近い親戚は 아귀찜 で、そちらには始まりがあります。馬山の漁師たちが獲ってきたものを居酒屋に持ち込み、酒の肴に仕立ててくれと頼んだ——そこから出てきました。アンコウは三十年ほど前まで、捨てられることの多い魚でした。誰も欲しがらなかったから鍋に入ったのです。受け継がれたのはやり方のほうです。豆もやしと 미더덕 と 미나리 を、かけるというより纏わせるほど濃い唐辛子だれの下で一緒に蒸すこと。その下に何が入っているかは、その日に揚がったもので変わります。だから、自分が何を頼んでいるのか、誰も前もって正確には言えません。',
    themeId: null,
    zones: ['낙원동 아구찜골목'],
  },

  // 한 상 — a spread you build yourself, and the one bowl you do not share.
  {
    id: 'ssambap',
    name: 'Ssambap',
    gloss: 'Rice wrapped in leaves, house fillings',
    glossKo: '잎에 싸 먹는 밥, 속은 집마다',
    glossEs: 'Arroz para envolver en hojas, con los rellenos de la casa',
    glossFr: 'Du riz à envelopper dans des feuilles, avec les garnitures de la maison',
    glossAr: 'أرز تلفّه في أوراق، مع حشوات المحل',
    glossZh: '用叶子包着吃的饭，馅看店家',
    glossJa: '葉に包んで食べるご飯、具は店しだい',
    nameKo: '쌈밥',
    romanization: 'ssam-bap',
    category: MENU_CATEGORY.SET,
    minPeople: 1,
    whyShared:
      "A basket of leaves and a few fillings land in the middle, and everyone builds their own parcels by hand, one at a time. The basket is filled for the table rather than the person — two people get twice the spread — and what the fillings are is the house's call. You can eat it alone; the basket just arrives sized for company.",
    whySharedKo:
      '잎채소 한 바구니와 속거리 몇 가지가 상 가운데 놓이고, 각자 손으로 한 쌈씩 싸 먹습니다. 바구니는 사람이 아니라 상 단위로 채워져서 둘이면 두 배가 되고, 그 속거리가 무엇인지는 집이 정해요. 혼자서도 되는 밥이지만, 바구니는 원래 여럿 몫으로 나옵니다.',
    whySharedEs:
      'Una cesta de hojas y unos cuantos rellenos aterrizan en el centro, y cada uno arma sus paquetitos a mano, de uno en uno. La cesta se llena para la mesa y no para la persona —dos personas, el doble de despliegue—, y qué rellenos son lo decide la casa. Se puede comer solo; la cesta simplemente llega pensada para compañía.',
    whySharedFr:
      "Un panier de feuilles et quelques garnitures atterrissent au milieu, et chacun compose ses bouchées à la main, une par une. Le panier se remplit pour la table et non pour la personne — à deux, le double — et ce que sont les garnitures, c'est la maison qui le décide. On peut le manger seul ; le panier arrive simplement à la taille d'une compagnie.",
    whySharedAr:
      'سلّة من الأوراق وبضع حشوات تحطّ في الوسط، وكلٌّ يلفّ لقيماته بيده، واحدةً واحدة. تُملأ السلّة للطاولة لا للشخص — مع اثنين تتضاعف الفرشة — وما الحشوات فمن قرار المحل. يمكنك أكله وحدك؛ إنما تصل السلّة بحجم يناسب الرفقة.',
    whySharedZh:
      '一篮叶子和几样馅落在中间，每个人自己动手，一个一个地包。篮子是按桌续的不是按人——两个人，铺开的就是两倍——馅是什么，由店家定。一个人也能吃；只是那篮子上来时，本来就是按几个人的量。',
    whySharedJa:
      '葉の籠と具が二つ三つ、真ん中に置かれ、めいめいが手で一つずつ包んで食べます。籠は人にではなく卓に対して満たされ、二人なら倍になります。具が何かは店しだいです。一人でも食べられます。ただ籠は、もともと連れのいる分量で出てきます。',
    howItWorks:
      'Rice, a pile of lettuce, perilla and cabbage leaves, 쌈장 to smear on them, and whatever the kitchen sends to go inside — often grilled pork or a fish, sometimes only vegetables. Wrap, fold, eat in one bite. The leaves are refilled without asking.',
    howItWorksKo:
      '밥, 상추·깻잎·양배추 잎 한 무더기, 잎에 바를 쌈장, 그리고 주방이 속으로 내주는 것 — 제육이나 생선이 흔하고, 채소만인 집도 있어요. 싸서, 접어서, 한입에 넣습니다. 잎은 말하지 않아도 채워 줍니다.',
    howItWorksEs:
      'Arroz, un montón de hojas de lechuga, perilla y col, ssamjang para untar en ellas, y lo que la cocina mande para meter dentro: a menudo cerdo a la plancha o un pescado, a veces solo verdura. Envolver, doblar, comer de un bocado. Las hojas se reponen sin pedirlo.',
    howItWorksFr:
      "Du riz, une pile de feuilles de laitue, de périlla et de chou, du ssamjang à étaler dessus, et ce que la cuisine envoie pour mettre dedans — souvent du porc grillé ou un poisson, parfois seulement des légumes. Envelopper, plier, manger d'une bouchée. Les feuilles sont resservies sans qu'on le demande.",
    howItWorksAr:
      'أرز، وكومة من أوراق الخسّ والشيسو والملفوف، وصلصة الساميانغ لتدهنها عليها، وما يرسله المطبخ ليوضع داخلها — غالبًا لحم خنزير مشوي أو سمكة، وأحيانًا خضار فقط. لفّ، اطوِ، كُل بلقمة واحدة. تُعاد الأوراق من غير أن تطلب.',
    howItWorksZh:
      '饭，一堆生菜、苏子叶和卷心菜叶，抹在叶子上的包饭酱，还有厨房给的往里放的东西——常见是烤猪肉或一条鱼，有的店只有蔬菜。包起来，折好，一口吃掉。叶子不用说，会续。',
    howItWorksJa:
      'ご飯と、サンチュ・えごまの葉・キャベツの葉の山、葉に塗るサムジャン、それに厨房が中身として出してくるもの——焼いた豚肉か魚が多く、野菜だけの店もあります。包んで、折って、ひと口で食べます。葉は言わなくても足してくれます。',
    culture:
      'Wrapping is a habit that runs through Korean eating — the lettuce beside the grill, the leaf around the boiled pork — and 쌈밥 is that habit served as a whole meal on its own. It is also one of the few Korean tables where the polite bite is the big one: a parcel is meant to go in whole, and halving it is how newcomers give themselves away.',
    cultureKo:
      '싸 먹는 건 한국 식사 전체에 흐르는 습관입니다. 불판 옆의 상추, 수육을 싸는 잎. 쌈밥은 그 습관을 한 끼 통째로 낸 것이에요. 그리고 한국 상에서 드물게 큰 한입이 예의인 자리입니다. 쌈은 통째로 넣으라고 있는 것이고, 반으로 잘라 먹는 게 처음 온 사람이 하는 일입니다.',
    cultureEs:
      'Envolver es un hábito que atraviesa toda la comida coreana —la lechuga junto a la parrilla, la hoja alrededor del cerdo hervido—, y el ssambap es ese hábito servido como comida entera por sí mismo. Es también una de las pocas mesas coreanas en las que el bocado educado es el grande: el paquete está hecho para entrar entero, y partirlo por la mitad es como se delatan los recién llegados.',
    cultureFr:
      "Envelopper est une habitude qui traverse toute la cuisine coréenne — la laitue à côté du gril, la feuille autour du porc bouilli — et le ssambap, c'est cette habitude servie comme repas entier à part entière. C'est aussi l'une des rares tables coréennes où la bouchée polie est la grosse : la bouchée est faite pour entrer entière, et la couper en deux est ce à quoi on reconnaît les nouveaux venus.",
    cultureAr:
      'اللفّ عادة تسري في الأكل الكوري كله — الخسّ إلى جانب الشواية، والورقة حول لحم الخنزير المسلوق — والسامباب هو تلك العادة مقدَّمةً وجبةً كاملة قائمة بذاتها. وهو أيضًا من الموائد الكورية القليلة التي تكون فيها اللقمة المهذّبة هي الكبيرة: اللفّة مصنوعة لتدخل كاملة، وقسمُها نصفين هو ما يفضح القادمين الجدد.',
    cultureZh:
      '包着吃是贯穿整个韩国吃食的习惯——烤肉旁的生菜，裹着白切肉的叶子——包饭就是把这个习惯单独端成一整顿。它也是韩国饭桌上少有的、大口才算礼貌的地方：一个包是要整个放进嘴里的，掰成两半吃，就是新来的人露馅的时候。',
    cultureJa:
      '包んで食べるのは韓国の食べもの全体に流れる習慣です。焼き肉のそばのサンチュ、ゆで豚を包む葉。この料理はその習慣を、それだけで一食として出したものです。そして韓国の食卓ではめずらしく、大きなひと口が礼儀にかなう席でもあります。包みはまるごと口に入れるためのもので、半分に切って食べるのは、来たばかりの人がすることです。',
    contains: [],
    spice: 0,
    varies: true,
    themeId: null,
    zones: [],
  },
  {
    id: 'bibimbap',
    name: 'Bibimbap',
    gloss: 'Rice with vegetables, mixed in the bowl',
    glossKo: '그릇에서 비비는 밥',
    glossEs: 'Arroz con verduras, mezclado en el cuenco',
    glossFr: 'Du riz aux légumes, mélangé dans le bol',
    glossAr: 'أرز مع خضار، يُخلط في الوعاء',
    glossZh: '在碗里拌的菜饭',
    glossJa: '碗の中で混ぜる野菜のご飯',
    nameKo: '비빔밥',
    romanization: 'bi-bim-bap',
    // The only category with one dish in it, and the only dish here that is
    // not shared. Filing a single bowl under "a whole spread" would have put
    // that on its card.
    category: MENU_CATEGORY.BOWL,
    minPeople: 1,
    // "The one dish you can eat alone" was the first draft and was false —
    // nine dishes here have minPeople 1. What is unique is that it is not
    // shared: one bowl, one person. The catalogue's own data caught it.
    whyShared:
      'The one dish on this list that is not shared: one bowl, one person, and probably the way you have already eaten it. It is here so the difference shows — a bowl for one, next to everything here that cannot be. Company still changes it: the side dishes come for the table, and with different bowls ordered, spoonfuls get traded.',
    whySharedKo:
      '이 목록에서 유일하게 나눠 먹지 않는 음식이에요. 한 사람에 한 그릇이고, 아마 이미 그렇게 드셔 봤을 겁니다. 여기 있는 이유는 그 차이를 보이게 하려는 것이에요 — 혼자 먹는 한 그릇이, 그럴 수 없는 것들 옆에. 그래도 같이 가면 달라지는 게 있습니다. 반찬은 상 단위로 나오고, 그릇마다 다른 걸 시켜 한 술씩 나누게 돼요.',
    whySharedEs:
      'El único plato de esta lista que no se comparte: un cuenco, una persona, y seguramente así es como ya lo has comido. Está aquí para que se vea la diferencia: un cuenco para uno, junto a todo lo demás que no puede serlo. La compañía lo cambia igualmente: las guarniciones llegan para la mesa, y con cuencos distintos pedidos, las cucharadas se intercambian.',
    whySharedFr:
      "Le seul plat de cette liste qui ne se partage pas : un bol, une personne, et probablement la façon dont vous l'avez déjà mangé. Il est ici pour que la différence se voie — un bol pour un, à côté de tout ce qui, ici, ne peut pas l'être. La compagnie le change quand même : les accompagnements arrivent pour la table, et avec des bols différents commandés, les cuillerées s'échangent.",
    whySharedAr:
      'الطبق الوحيد في هذه القائمة الذي لا يُتقاسَم: وعاء واحد لشخص واحد، وعلى الأرجح هكذا أكلته من قبل. هو هنا لكي يظهر الفرق — وعاء لواحد، إلى جانب كل ما هنا لا يمكن أن يكون كذلك. ومع ذلك تغيّره الرفقة: الأطباق الجانبية تأتي للطاولة، ومع أوعية مختلفة مطلوبة، تُتبادَل الملاعق.',
    whySharedZh:
      '这个单子上唯一一道不分着吃的菜：一碗，一个人，而且多半你已经这么吃过了。它在这里，是为了让差别看得见——一个人的一碗，旁边是这里所有做不到这样的东西。有人一起，它还是会不一样：小菜是给一桌的，各人点了不同的碗，就会你一勺我一勺地换着尝。',
    whySharedJa:
      'この一覧で唯一、分け合わないで食べる料理です。ひと碗にひとり、そしてたぶん、すでにそうやって食べたことがあるでしょう。ここにあるのは、その違いが見えるようにするためです。ひとりで食べるひと碗が、ここにあるそうはいかないもののそばに。それでも連れがいると変わります。おかずは卓に出ますし、それぞれ違う碗を頼めば、ひとさじずつ交換することになります。',
    howItWorks:
      'Rice under a fan of seasoned vegetables, usually with beef and a fried or raw egg, and 고추장 on the side or already in. Mix it all together before eating — the name means exactly that. What the vegetables are and whether there is meat changes by house and by version: 산채 is vegetables only, 돌솥 comes in a hot stone bowl that crisps the rice.',
    howItWorksKo:
      '밥 위에 양념한 나물을 둘러 얹고, 보통 소고기와 달걀 부침 또는 날달걀이 올라가며, 고추장은 곁들이거나 이미 들어 있습니다. 먹기 전에 전부 비비세요 — 이름이 정확히 그 뜻입니다. 나물이 무엇이고 고기가 있는지는 집과 판본에 따라 달라요. 산채는 나물만, 돌솥은 뜨거운 돌그릇에 나와 밥이 눌어붙습니다.',
    howItWorksEs:
      'Arroz bajo un abanico de verduras aliñadas, normalmente con ternera y un huevo frito o crudo, y gochujang aparte o ya dentro. Mézclalo todo antes de comer: el nombre significa exactamente eso. Qué verduras son y si lleva carne cambia según la casa y la versión: sanchae es solo verdura, dolsot viene en un cuenco de piedra caliente que tuesta el arroz.',
    howItWorksFr:
      "Du riz sous un éventail de légumes assaisonnés, en général avec du bœuf et un œuf au plat ou cru, et du gochujang à côté ou déjà dedans. Mélangez tout avant de manger — le nom veut dire exactement ça. Ce que sont les légumes et s'il y a de la viande change selon la maison et la version : sanchae, c'est légumes seuls ; dolsot arrive dans un bol de pierre brûlant qui fait croustiller le riz.",
    howItWorksAr:
      'أرز تحت مروحة من الخضار المتبّلة، غالبًا مع لحم بقر وبيضة مقلية أو نيئة، ومعجون الغوتشوجانغ إلى جانبه أو فيه أصلًا. اخلط كل شيء قبل الأكل — الاسم يعني هذا بالضبط. ما الخضار وهل فيه لحم يختلف باختلاف المحل والنسخة: السانتشيه خضار فقط، والدولسوت يأتي في وعاء حجري ساخن يحمّص الأرز.',
    howItWorksZh:
      '饭上铺一圈拌好的菜，通常有牛肉和一个煎蛋或生蛋，辣椒酱另放或已经放进去了。吃之前全拌开——这个名字就是这个意思。菜是什么、有没有肉，看店家和看是哪一种：山菜的只有菜，石锅的装在滚烫的石碗里，把饭烤出锅巴。',
    howItWorksJa:
      'ご飯の上に味つけした野菜を扇のように並べ、たいてい牛肉と目玉焼きか生卵がのり、コチュジャンは添えるか、もう入っています。食べる前に全部混ぜてください——名前がまさにその意味です。野菜が何で、肉が入るかは店と種類で違います。山菜のものは野菜だけ、石焼きは熱い石の器で来て、ご飯がおこげになります。',
    culture:
      'The Korean dish most widely known abroad, and the one that needs the least explaining — which is exactly why it is not the point of this app. It stands for a way of eating in which everything on the table ends up in one bowl: the last night of a spread, when the leftover side dishes get mixed with rice, is 비빔밥 by another name.',
    cultureKo:
      '한국 음식 중 밖에 가장 널리 알려졌고, 설명이 가장 덜 필요한 음식입니다. 바로 그래서 이 앱의 요점이 아니에요. 상 위의 모든 것이 결국 한 그릇으로 들어가는 먹는 방식을 대표합니다. 한 상 차림의 마지막 날, 남은 반찬을 밥과 비비는 것이 이름만 다른 비빔밥입니다.',
    cultureEs:
      'El plato coreano más conocido fuera, y el que menos explicación necesita; exactamente por eso no es el propósito de esta app. Representa una manera de comer en la que todo lo que hay en la mesa acaba en un solo cuenco: la última noche de una mesa llena, cuando las guarniciones que sobran se mezclan con arroz, es bibimbap con otro nombre.',
    cultureFr:
      "Le plat coréen le plus connu à l'étranger, et celui qui a le moins besoin d'explication — c'est exactement pour ça qu'il n'est pas le propos de cette appli. Il représente une façon de manger où tout ce qui est sur la table finit dans un seul bol : le dernier soir d'une grande tablée, quand les restes d'accompagnements se mélangent au riz, c'est du bibimbap sous un autre nom.",
    cultureAr:
      'الطبق الكوري الأوسع شهرةً في الخارج، والأقلّ حاجةً إلى شرح — ولهذا بالضبط ليس هو غاية هذا التطبيق. يمثّل طريقة في الأكل ينتهي فيها كل ما على الطاولة في وعاء واحد: الليلة الأخيرة لمائدة عامرة، حين تُخلط بقايا الأطباق الجانبية بالأرز، هي بيبيمباب باسم آخر.',
    cultureZh:
      '在国外最有名的韩国菜，也是最不需要解释的一道——正因为这样，它不是这个应用的重点。它代表的是一种吃法：桌上所有东西最后都归到一只碗里。一桌菜的最后一晚，把剩下的小菜和饭拌在一起，那就是换了个名字的拌饭。',
    cultureJa:
      '海外でいちばん知られた韓国料理で、いちばん説明のいらない料理です。だからこそ、このアプリの要点ではありません。食卓の上のすべてが最後にひとつの碗に入る、そういう食べ方を代表しています。並んだ料理の最後の晩、残ったおかずをご飯と混ぜるのは、名前の違うビビンバです。',
    // 산채 has no meat, 육회비빔밥 has raw beef, most have beef and egg — which
    // version is the house's, so the list is empty and varies is true.
    contains: [],
    // 고추장 goes into the bowl and is mixed through: in the mouthful.
    spice: 1,
    varies: true,
    themeId: null,
    zones: [],
  },

  // K-BBQ — the one the group was missing. 소갈비, marinated in soy: the id
  // means beef rib, 돼지갈비 would duplicate 삼겹살, and spice 0 is the soy
  // version (a 고추장 one exists and is ordered by name).
  {
    id: 'galbi',
    name: 'Galbi',
    gloss: 'Beef short rib, grilled at the table',
    glossKo: '상에서 굽는 소갈비',
    glossEs: 'Costilla de ternera a la parrilla, en la mesa',
    glossFr: 'Côte de bœuf grillée à table',
    glossAr: 'أضلاع بقر تُشوى على المائدة',
    glossZh: '桌上烤的牛排骨',
    glossJa: '卓上で焼く牛カルビ',
    nameKo: '갈비',
    romanization: 'gal-bi',
    category: MENU_CATEGORY.GRILL,
    minPeople: 2,
    // 삼겹살 and 곱창, the other two K-BBQ entries, both open on price and
    // servings; this one opens on the bone so the three cards read apart.
    whyShared:
      'It comes on the bone. You cut the meat off it with scissors as it grills, and the marinade is sweet enough to burn, so nobody can look away for long. Priced by the serving with a two-serving minimum at most shops — and this is the cut people order to eat with somebody in the first place.',
    whySharedKo:
      '뼈째 나옵니다. 불판 위에서 살을 뼈에서 가위로 잘라 내며 굽는데, 양념이 달아 금방 타서 손을 뗄 수가 없어요. 값은 인분으로 매기고 2인분이 최소인 집이 대부분입니다 — 그리고 이 부위는 애초에 누군가와 먹으려고 시키는 고기입니다.',
    whySharedEs:
      'Viene con hueso. Se va cortando la carne del hueso con tijeras mientras se hace, y el adobo es tan dulce que se quema, así que nadie puede apartar la vista mucho rato. Se cobra por ración con un mínimo de dos en la mayoría de sitios; y este es el corte que la gente pide, para empezar, para comerlo con alguien.',
    whySharedFr:
      "Il arrive sur l'os. On découpe la viande de l'os aux ciseaux pendant qu'elle grille, et la marinade est assez sucrée pour brûler — personne ne peut détourner les yeux longtemps. Facturé à la portion avec un minimum de deux dans la plupart des adresses, et c'est de toute façon le morceau qu'on commande pour le manger avec quelqu'un.",
    whySharedAr:
      'يصل على العظم. تقطع اللحم عنه بالمقص وهو يُشوى، والتتبيلة حلوة بما يكفي لتحترق، فلا يستطيع أحد أن يشيح بنظره طويلًا. يُسعَّر بالحصة بحدّ أدنى حصتين في معظم المحال — وهذه أصلًا القطعة التي يطلبها الناس ليأكلوها مع أحد.',
    whySharedZh:
      '带着骨头上来。一边烤一边用剪刀把肉从骨头上剪下来，腌料甜到容易焦，所以谁也不能久不看它。按份计价，多数店两份起——而且这本来就是人们为了和谁一起吃才点的那块肉。',
    whySharedJa:
      '骨つきで来ます。焼きながらハサミで肉を骨から切り離し、たれは甘くて焦げやすいので、誰も長くは目を離せません。一人前いくらで、たいていの店で二人前から。そしてこれはそもそも、誰かと食べるために頼む肉です。',
    howItWorks:
      'Beef short rib, sliced thin along the bone and marinated in soy, sugar, garlic and pear, then grilled over charcoal or gas at the table. Wrap it in lettuce with 쌈장, or eat it plain off the scissors. The unmarinated version, 생갈비, is ordered by name.',
    howItWorksKo:
      '소갈비를 뼈를 따라 얇게 저며 간장·설탕·마늘·배에 재운 뒤 상 위 숯불이나 가스불에 굽습니다. 상추에 쌈장과 싸 먹거나, 가위에서 바로 집어 먹어요. 재우지 않은 생갈비는 따로 이름을 불러 시킵니다.',
    howItWorksEs:
      'Costilla de ternera cortada fina a lo largo del hueso y marinada en soja, azúcar, ajo y pera, luego hecha a la brasa o al gas en la mesa. Se envuelve en lechuga con ssamjang, o se come tal cual de las tijeras. La versión sin marinar se pide por su nombre.',
    howItWorksFr:
      "De la côte de bœuf tranchée fine le long de l'os et marinée dans le soja, le sucre, l'ail et la poire, puis grillée au charbon ou au gaz à table. On l'enveloppe dans de la laitue avec du ssamjang, ou on la mange telle quelle, prise aux ciseaux. La version non marinée se commande par son nom.",
    howItWorksAr:
      'أضلاع بقر مقطّعة رقيقة على طول العظم ومتبّلة بالصويا والسكر والثوم والإجاص، ثم تُشوى على الفحم أو الغاز على المائدة. تلفّها في الخسّ مع صلصة الساميانغ، أو تأكلها كما هي من المقص. النسخة غير المتبّلة تُطلب باسمها.',
    howItWorksZh:
      '牛排骨顺着骨头切薄，用酱油、糖、蒜和梨腌过，在桌上用炭火或煤气烤。用生菜配包饭酱包着吃，或者直接从剪刀上夹了吃。不腌的那种，要指名点。',
    howItWorksJa:
      '牛の骨つきカルビを骨に沿って薄く切り、醤油・砂糖・にんにく・梨に漬け込んでから、卓上の炭火かガスで焼きます。サンチュにサムジャンを添えて包むか、ハサミから直接つまんで食べます。漬け込まないものは、別の名前で頼みます。',
    culture:
      'The celebration cut. 삼겹살 is an ordinary weeknight; 갈비 is the dinner somebody is paying for — a promotion, a visiting relative, two families meeting for the first time — and many of the shops that serve it are built for that, with rooms as well as tables. 수원 has a whole style of it named after the city. If a Korean host suggests 갈비, they are telling you the evening matters.',
    cultureKo:
      '축하하는 부위입니다. 삼겹살이 평일 저녁이라면 갈비는 누군가 사는 저녁이에요 — 승진, 찾아온 친척, 양가 첫 상견례. 갈비집 중에는 그걸 위해 지어져서 테이블만큼 방이 있는 집이 많습니다. 수원에는 도시 이름을 딴 갈비 양식이 통째로 있고요. 한국 호스트가 갈비를 제안한다면, 이 저녁이 중요하다는 말을 하고 있는 것입니다.',
    cultureEs:
      'El corte de celebrar. El samgyeopsal es una noche cualquiera entre semana; el galbi es la cena que alguien está pagando —un ascenso, un pariente de visita, dos familias que se conocen—, y muchos de los sitios que lo sirven están hechos para eso, con reservados además de mesas. Suwon tiene todo un estilo con el nombre de la ciudad. Si un anfitrión coreano propone galbi, te está diciendo que la noche importa.',
    cultureFr:
      "Le morceau des grandes occasions. Le samgyeopsal, c'est un soir de semaine ordinaire ; le galbi, c'est le dîner que quelqu'un paie — une promotion, un parent de passage, deux familles qui se rencontrent — et beaucoup des adresses qui le servent sont faites pour ça, avec des salons en plus des tables. Suwon en a tout un style qui porte le nom de la ville. Si un hôte coréen propose du galbi, il vous dit que la soirée compte.",
    cultureAr:
      'قطعة الاحتفال. السامغيوبسال أمسية عادية في منتصف الأسبوع؛ أما الغالبي فهو العشاء الذي يدفع ثمنه أحدهم — ترقية، قريب زائر، عائلتان تلتقيان أول مرة — وكثير من المحال التي تقدّمه مبنية لذلك، بغرف إلى جانب الطاولات. ولسوون طراز كامل منه يحمل اسم المدينة. إن اقترح مضيف كوري الغالبي، فهو يقول لك إن هذه الأمسية مهمة.',
    cultureZh:
      '庆祝用的那一块。五花肉是寻常的工作日晚上；牛排骨是有人请客的晚饭——升职、来访的亲戚、两家人第一次见面——而卖它的店，不少就是为这个建的，除了桌子还有包间。水原有一整套以城市命名的做法。要是韩国的主人提议吃牛排骨，那是在告诉你，这个晚上要紧。',
    cultureJa:
      '祝いの肉です。サムギョプサルがふつうの平日の夜なら、カルビは誰かがおごる夕食で——昇進、訪ねてきた親戚、両家の初めての顔合わせ——それを出す店の多くはそのために作られていて、テーブルのほかに個室があります。水原には市の名を冠したカルビの流儀がまるごとあります。韓国の主人がカルビを提案したら、それはこの夜が大事だと言っているのです。',
    contains: ['beef'],
    spice: 0,
    storySources: ['hansik-galbi'],
    story: 'Until recently this was a cut you tasted at a holiday or a wedding and not otherwise — cattle were scarce under Joseon slaughter bans, and ribs were the part a family saved an occasion for. The older word is 가리, which meant beef ribs until liberation; 시의전서, 임원십육지 and 조선무쌍신식요리제법 all record the cut. Selling ribs by the piece began at a Pyongyang-naengmyeon house in Seoul\'s Nagwon-dong around 1939, and the word 갈비 dates from about then. The regional versions are arguments about seasoning: Suwon\'s are 10 to 13cm and salted only, on the grounds that a rib this good needs nothing; Haeundae\'s are marinated in soy; Pocheon\'s 이동갈비 came up in the 1950s and 60s.',
    storyKo: '얼마 전까지도 갈비는 명절이나 잔치가 아니면 맛보기 어려운 부위였습니다. 조선의 도축 금지령 아래 소는 귀했고, 갈비는 집안이 날을 잡아 두는 자리였어요. 옛말은 \'가리\'인데, 해방 전까지는 소갈비를 뜻했습니다. 《시의전서》, 《임원십육지》, 《조선무쌍신식요리제법》에 모두 이 부위가 실려 있고요. 갈비를 낱개로 팔기 시작한 것은 1939년 무렵 서울 낙원동의 평양냉면집이었고, \'갈비\'라는 이름도 그때부터입니다. 지역마다 다른 갈비는 결국 양념을 두고 벌이는 논쟁입니다. 수원은 10~13cm에 소금만 씁니다. 이만한 갈비면 다른 것이 필요 없다는 뜻이죠. 해운대는 간장 양념이고, 포천의 이동갈비는 1950~60년대에 자리 잡았습니다.',
    storyEs: 'Hasta hace poco era un corte que se probaba en una fiesta o una boda y no en otro momento: el ganado escaseaba bajo las prohibiciones de sacrificio de Joseon, y las costillas eran la parte para la que una familia guardaba una ocasión. La palabra antigua es 가리, que significó costilla de vacuno hasta la liberación; 시의전서, 임원십육지 y 조선무쌍신식요리제법 registran el corte. Venderlas por pieza empezó en una casa de naengmyeon de Pyongyang en Nagwon-dong, Seúl, hacia 1939, y de entonces data la palabra 갈비. Las versiones regionales son discusiones sobre el adobo: las de Suwon miden de 10 a 13 cm y solo llevan sal, porque una costilla así no necesita nada más; las de Haeundae se marinan en soja; el 이동갈비 de Pocheon surgió en los años cincuenta y sesenta.',
    storyFr: 'Jusqu\'à récemment, c\'était un morceau qu\'on goûtait lors d\'une fête ou d\'un mariage et pas autrement : le bétail était rare sous les interdictions d\'abattage de Joseon, et les côtes étaient la part pour laquelle une famille gardait une occasion. Le mot ancien est 가리, qui désignait les côtes de bœuf jusqu\'à la libération ; 시의전서, 임원십육지 et 조선무쌍신식요리제법 consignent tous ce morceau. La vente à la pièce a commencé dans une maison de naengmyeon de Pyongyang à Nagwon-dong, Séoul, vers 1939, et le mot 갈비 date de là. Les versions régionales sont des querelles de marinade : celles de Suwon font 10 à 13 cm et ne reçoivent que du sel, au motif qu\'une côte pareille n\'a besoin de rien ; celles de Haeundae marinent dans le soja ; le 이동갈비 de Pocheon s\'est formé dans les années 1950 et 1960.',
    storyAr: 'حتى وقت قريب كانت هذه قطعةً تُذاق في عيد أو عُرس لا في غيرهما — فقد كانت الأبقار نادرة في ظلّ مناهي الذبح في عهد جوسون، وكانت الأضلاع الجزء الذي تدّخر له العائلة مناسبة. الكلمة الأقدم هي 가리، وقد عنت أضلاع البقر حتى التحرير؛ وتذكر 시의전서 و임원십육지 و조선무쌍신식요리제법 هذه القطعة جميعًا. وبدأ بيع الأضلاع بالقطعة في بيتٍ لنينغميون البيونغيانغي في حيّ ناغوون-دونغ بسول نحو سنة 1939، ومن ذلك الحين كلمة 갈비. أمّا النسخ المحلّية فهي خلافٌ على التتبيلة: أضلاع سوون من 10 إلى 13 سنتيمترًا وبالملح وحده، بحجّة أنّ ضلعًا بهذه الجودة لا يحتاج شيئًا؛ وأضلاع هيونداي تُنقع في الصويا؛ و이동갈비 في بوتشون تكوّن في الخمسينيات والستينيات.',
    storyZh: '直到不久以前，这还是只有过节或办喜事才尝得到的部位——朝鲜时代有禁屠令，牛稀罕，排骨是一家人特意留着等日子的那一块。旧称是 가리，光复以前指的就是牛排骨；《是议全书》《林园十六志》《朝鲜无双新式料理制法》都记着这个部位。按块卖排骨，是1939年前后从首尔乐园洞一家平壤冷面馆开始的，“갈비”这个叫法也是从那时起。各地的做法，说到底是在为调味争论：水原的长10到13厘米，只用盐，理由是这么好的排骨不需要别的；海云台的用酱油腌；抱川的移动排骨是1950、60年代成的形。',
    storyJa: 'つい最近まで、これは祝日か婚礼でなければ口にしにくい部位でした。朝鮮時代の屠畜禁止令のもとで牛は貴重で、カルビは家が日を選んで取っておく場所だったのです。古い言い方は「가리」で、解放前までは牛カルビを指しました。《是議全書》《林園十六志》《朝鮮無雙新式料理製法》のいずれにもこの部位が載っています。カルビを一枚ずつ売りはじめたのは1939年ごろ、ソウル楽園洞の平壌冷麺店でのことで、「갈비」という名もそのころからです。地方ごとの違いは、つまるところ味つけをめぐる議論です。水原は10〜13センチ、塩だけ——これだけのカルビに他は要らない、という理屈です。海雲台は醤油だれ、抱川の李東カルビは1950〜60年代に形になりました。',
    themeId: null,
    zones: ['수원 왕갈비', '성수동 갈비골목', '마포 돼지갈비'],
  },
];

const byId = new Map(menus.map(m => [m.id, m]));

export const menuById = (id) => byId.get(id);

/** Dishes that genuinely cannot be ordered by one person. */
export const sharedOnlyMenus = () => menus.filter(m => m.minPeople > 1);

/**
 * The hour a host opening this dish most likely means, or null when the
 * catalog has no business guessing. Null keeps the form's own 19:00 rather
 * than inventing a time for a dish nobody said anything about.
 */
export function defaultHourFor(menuId) {
  const when = menuById(menuId)?.eatenAt?.[0];
  return when ? DEFAULT_HOUR[when] ?? null : null;
}

/** Every slot this dish is eaten in, resolved to labels. Empty when unknown. */
export function eatenAtLabels(menuId) {
  return (menuById(menuId)?.eatenAt ?? []).map(w => EATEN_AT_LABEL[w]).filter(Boolean);
}

/** Category label for a chip, in both languages the app speaks. */
export const CATEGORY_LABEL = {
  [MENU_CATEGORY.GRILL]: { en: 'Grilled at the table', ko: '구이', kr: '구이', es: 'A la parrilla en la mesa', fr: 'Grillé à table', ar: 'يُشوى على المائدة', zh: '桌上现烤', ja: '卓上で焼く' },
  [MENU_CATEGORY.STEW]: { en: 'One pot', ko: '찌개·전골', kr: '찌개·전골', es: 'Una olla', fr: 'Un seul pot', ar: 'قِدر واحدة', zh: '一锅', ja: 'ひと鍋' },
  // Every other label here names how the food arrives — a grill, a pot, a
  // platter. This one named the furniture, and in this app 'table' is the
  // word for the gathering itself: on a card it sat directly above
  // '1자리 남음' and read as 'this table is full'. Found by a tester on
  // 2026-09-01 doing exactly that. Korean, Chinese and Japanese never had
  // the ambiguity — 한 상 is a spread of dishes and nothing else — so only
  // the languages that reused the furniture word changed.
  [MENU_CATEGORY.SET]: { en: 'A whole spread', ko: '한 상', kr: '한 상', es: 'Una comida completa', fr: 'Un repas complet', ar: 'وجبة كاملة', zh: '一整桌', ja: 'ひと膳' },
  [MENU_CATEGORY.PLATTER]: { en: 'One platter', ko: '접시', kr: '접시', es: 'Una fuente', fr: 'Un grand plat', ar: 'صحن واحد', zh: '一大盘', ja: '大皿ひとつ' },
  [MENU_CATEGORY.BOWL]: { en: 'One bowl', ko: '한 그릇', kr: '한 그릇', es: 'Un cuenco', fr: 'Un bol', ar: 'وعاء واحد', zh: '一碗', ja: 'ひと碗' },
};

/**
 * Where a dish's photograph is.
 *
 * One line, but two screens draw the same rail now — the deck's result moved
 * to the passport on 2026-09-09 — and a second copy of the path is how they
 * quietly end up pointing at different folders.
 */
export const dishPhoto = (id) => `/images/dishes/${id}.jpg`;
