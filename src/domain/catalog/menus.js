// Menu catalog — the Korean dishes you cannot order alone.
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

/**
 * When a dish is actually eaten.
 *
 * Korean food has a clock. 감자탕 is a night-shift meal and a hangover
 * breakfast; 삼겹살 is the first round of a 회식 after work. The app showed
 * the same thing at three in the afternoon and three in the morning, and
 * defaulted every table anybody opened to 19:00 regardless of the dish.
 *
 * Set on three dishes out of ten, and deliberately not on the other seven.
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

export const MENU_CATEGORY = {
  GRILL: 'grill',       // 구이 — cooked at the table
  STEW: 'stew',         // 찌개·전골 — one pot, many spoons
  SET: 'set',           // 한 상 — a spread of shared dishes
  PLATTER: 'platter',   // 접시 — served whole, carved or torn at the table
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
    zones: ['Jongno, Seoul', 'Mapo, Seoul', 'Gangnam, Seoul'],
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
    zones: ['Sinchon, Seoul', 'Hongdae, Seoul'],
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
      'Pork spine simmered with potato and perilla leaf. You pull the meat off the bone with chopsticks; it is expected to be slow and messy.',
    howItWorksKo:
      '돼지 등뼈를 감자와 깻잎을 넣고 오래 끓입니다. 젓가락으로 뼈에서 살을 발라 먹고, 원래 느리고 지저분하게 먹는 음식이에요.',
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
    zones: ['Jongno, Seoul', 'Dongdaemun, Seoul'],
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
    zones: ['Itaewon, Seoul', 'Uijeongbu'],
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
    zones: ['Jongno, Seoul', 'Mapo, Seoul'],
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
    zones: ['Jangchung, Seoul', 'Gongdeok, Seoul'],
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
      '간장에 담근 생 게',
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
      'Raw crab cured in soy sauce. You eat it with your hands, and the shell is meant to be filled with rice at the end — that last mouthful is the point of the dish.',
    howItWorksKo:
      '생 게를 간장에 담가 삭힙니다. 손으로 먹고, 마지막에 등딱지에 밥을 비벼 먹으라고 남겨 두는데 — 그 마지막 한 입이 이 음식의 핵심이에요.',
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
    zones: ['Sinsa, Seoul', 'Mapo, Seoul'],
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
    zones: ['Insadong, Seoul', 'Jongno, Seoul'],
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
    // The honest exception, and it earns its place: this one you *can* order
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
    zones: ['Wangsimni, Seoul', 'Euljiro, Seoul'],
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
  [MENU_CATEGORY.SET]: { en: 'A full table', ko: '한 상', kr: '한 상', es: 'Una mesa entera', fr: 'Une table entière', ar: 'مائدة كاملة', zh: '一整桌', ja: 'ひと膳' },
  [MENU_CATEGORY.PLATTER]: { en: 'One platter', ko: '접시', kr: '접시', es: 'Una fuente', fr: 'Un grand plat', ar: 'صحن واحد', zh: '一大盘', ja: '大皿ひとつ' },
};
