// The eight one-line culture cards, shared by the CultureCards viewer and by
// the Places teaser row that links into it.
//
// `id` is the photograph's filename: public/images/culture/<id>.jpg. One list,
// so a card and its picture cannot drift apart — adding a card and dropping a
// file in is the whole job — kept in one place so the two
// surfaces cannot drift into contradicting each other.
//
// Split out of CultureCards.jsx because a module that exports both a component
// and a constant breaks fast refresh: editing the copy reloaded the whole tree
// instead of the component.
//
// Deliberately qualitative. Nothing here carries a number, a date or a
// superlative, because this file has no source registry behind it the way
// quiz.js does — see src/content/sources.js. If a card ever needs to make a
// checkable claim, source it there first.
const ALL = [
  { id: 'kimchi', title: 'Kimchi', titleKo: '김치', desc: 'A staple in Korean cuisine, is a traditional side dish of salted and fermented vegetables.', descKo: '한국 밥상의 기본입니다. 채소를 절이고 발효시켜 만드는 전통 반찬이에요.', titleEs: "Kimchi", descEs: "El pilar de la mesa coreana: una guarnición tradicional de verduras saladas y fermentadas.",
    descFr: "Le pilier de la table coréenne : un accompagnement traditionnel de légumes salés et fermentés.", titleFr: "Kimchi",
    descAr: "عماد المائدة الكورية: طبق جانبي تقليدي من خضار مملّحة ومخمّرة.", titleAr: "كيمتشي",
descZh: "韩国餐桌的根本：一道用盐腌并发酵的传统小菜。", titleZh: "泡菜",
    descJa: "韓国の食卓の基本。野菜を塩漬けにして発酵させた伝統的なおかずです。", titleJa: "キムチ", },
  { id: 'hanjeongsik', title: 'Hanjeongsik', titleKo: '한정식', desc: 'A full-course Korean meal with an array of savory side dishes.', descKo: '여러 가지 반찬이 한꺼번에 깔리는 한식 정찬입니다.', titleEs: "Hanjeongsik", descEs: "Un menú coreano completo con una tanda de guarniciones saladas.",
    descFr: "Un repas coréen complet avec une série d'accompagnements salés.", titleFr: "Hanjeongsik",
    descAr: "وجبة كورية كاملة مع سلسلة من الأطباق الجانبية المالحة.", titleAr: "هانجونغسيك",
descZh: "一整套韩式正餐，配上一排咸口小菜。", titleZh: "韩定食",
    descJa: "たくさんのおかずが一度に並ぶ韓国のフルコースです。", titleJa: "韓定食", },
  { id: 'temple-cuisine', title: 'Temple Cuisine', titleKo: '사찰음식', desc: 'Buddhist temple food that is vegan and avoids five pungent vegetables.', descKo: '절에서 먹는 음식으로, 채식이며 오신채를 쓰지 않습니다.', titleEs: "Cocina de templo", descEs: "Comida budista de templo, vegana y sin las cinco verduras picantes.",
    descFr: "Cuisine bouddhiste de temple, végétalienne et sans les cinq légumes piquants.", titleFr: "Cuisine de temple",
    descAr: "طعام معبد بوذي، نباتي صرف وبلا الخضار الخمس الحرّيفة.", titleAr: "مطبخ المعبد",
descZh: "佛寺的斋饭，纯素，且不用五辛。", titleZh: "寺院饮食",
    descJa: "寺の精進料理。完全菜食で、五辛を使いません。", titleJa: "寺の料理", },
  { id: 'makgeolli', title: 'Makgeolli', titleKo: '막걸리', desc: 'A traditional slightly sweet and milky Korean rice wine.', descKo: '뿌옇고 살짝 단맛이 도는 한국의 전통 쌀술입니다.', titleEs: "Makgeolli", descEs: "Un vino de arroz coreano tradicional, ligeramente dulce y lechoso.",
    descFr: "Un vin de riz coréen traditionnel, légèrement sucré et laiteux.", titleFr: "Makgeolli",
    descAr: "نبيذ أرز كوري تقليدي، حلو قليلًا ولبنيّ.", titleAr: "ماكغولي",
descZh: "韩国传统米酒，微甜，乳白。", titleZh: "马格利",
    descJa: "ほんのり甘く、白く濁った韓国の伝統的な米の酒です。", titleJa: "マッコリ", },
  { id: 'bbq-etiquette', title: 'Korean BBQ Etiquette', titleKo: '고깃집 예절', desc: 'Usually the youngest grills. The kimchi goes on too, cooked in the fat the pork gives off.', descKo: '보통 제일 어린 사람이 굽습니다. 김치도 같이 올려, 고기에서 나온 기름에 구워 먹어요.', titleEs: "Etiqueta en la parrilla", descEs: "Suele asar el más joven. El kimchi también va a la parrilla, hecho en la grasa que suelta el cerdo.",
    descFr: "C'est en général le plus jeune qui grille. Le kimchi passe aussi sur le gril, cuit dans la graisse rendue par le porc.", titleFr: "Étiquette au gril",
    descAr: "الأصغر سنًّا هو من يشوي عادةً. والكيمتشي يوضع على الشواية أيضًا، ينضج في الدهن الذي يسيل من اللحم.", titleAr: "آداب الشواية",
descZh: "一般是最年轻的人烤肉。泡菜也一起放上去，用五花肉渗出的油煎着吃。", titleZh: "烤肉桌上的规矩",
    descJa: "焼くのはたいてい年下の人です。キムチも一緒にのせ、肉から出た脂で焼いて食べます。", titleJa: "焼肉の作法", },
  { id: 'drinking-culture', title: 'Drinking Culture', titleKo: '술자리 문화', desc: 'Drink is poured and received with two hands. When glasses meet, the younger person holds theirs slightly lower.', descKo: '술은 두 손으로 따르고 두 손으로 받습니다. 잔을 부딪칠 때는 어린 쪽이 잔을 조금 낮춰 들어요.', titleEs: "Cultura del brindis", descEs: "La bebida se sirve y se recibe con las dos manos. Al chocar los vasos, el más joven mantiene el suyo algo más bajo.",
    descFr: "On sert et on reçoit à boire à deux mains. En trinquant, le plus jeune tient son verre un peu plus bas.", titleFr: "Culture du toast",
    descAr: "يُسكب الشراب ويُتناول بكلتا اليدين. وعند قرع الكؤوس يُبقي الأصغر كأسه أخفض قليلًا.", titleAr: "ثقافة النخب",
descZh: "倒酒和接酒都要用双手。碰杯时，年纪小的人把杯子放低一点。", titleZh: "酒桌文化",
    descJa: "お酒は両手で注ぎ、両手で受けます。杯を合わせるときは、年下の人が自分の杯を少し低く持ちます。", titleJa: "酒席の文化", },
  { id: 'street-food', title: 'Street Food', titleKo: '길거리 음식', desc: 'Tteokbokki, Hotteok, Odeng — good late-night food, and usually eaten standing up.', descKo: '떡볶이, 호떡, 오뎅 — 밤늦게 먹기 좋고, 보통 선 채로 먹습니다.', titleEs: "Comida callejera", descEs: "Tteokbokki, hotteok, odeng: buena comida nocturna, y casi siempre de pie.",
    descFr: "Tteokbokki, hotteok, odeng : de quoi bien manger tard, et presque toujours debout.", titleFr: "Cuisine de rue",
    descAr: "توكبوكي، هوتوك، أودينغ: طعام ليل جيّد، ويُؤكل واقفًا في الغالب.", titleAr: "طعام الشارع",
descZh: "炒年糕、糖饼、鱼糕——很好的夜宵，而且多半是站着吃的。", titleZh: "街头小吃",
    descJa: "トッポキ、ホットク、おでん。夜遅くに向いていて、たいてい立ったまま食べます。", titleJa: "屋台の料理", },
  // "Jeonju for Bibimbap" is about where to eat the famous local version, not
  // about where the dish began — the quiz answers that second question with a
  // flat no, and the two must not be read as contradicting each other.
  { id: 'regional-foods', hidden: true, title: 'Regional Foods', titleKo: '지역 음식', desc: 'Jeonju for its bibimbap, Jeju for black pork, Busan for seafood.', descKo: '비빔밥은 전주, 흑돼지는 제주, 해산물은 부산.', titleEs: "Comida por regiones", descEs: "Jeonju por su bibimbap, Jeju por el cerdo negro, Busan por el marisco.",
    descFr: "Jeonju pour son bibimbap, Jeju pour le porc noir, Busan pour les fruits de mer.", titleFr: "Spécialités régionales",
    descAr: "جونجو لبيبيمباب، وجيجو للخنزير الأسود، وبوسان للمأكولات البحرية.", titleAr: "أطباق الأقاليم",
descZh: "拌饭去全州，黑猪肉去济州，海鲜去釜山。", titleZh: "各地名菜",
    descJa: "ビビンバは全州、黒豚は済州、海のものは釜山。", titleJa: "地方の料理", },
];

/**
 * Every card, including the ones not currently shown. Nothing here is deleted
 * — `hidden` is a decision about today's deck, and the writing and its seven
 * translations stay where they are so bringing a card back is one word.
 */
export const ALL_CULTURE_CARDS = ALL;

/**
 * The deck as it is drawn.
 *
 * 지역 음식 is hidden as of 2026-09-09, at the team's word: the photographs
 * were generated for the other seven and a card with an empty picture frame
 * beside seven filled ones reads as a fault rather than as a card. Drop
 * regional-foods.jpg in and remove the flag.
 */
export const CULTURE_CARDS = ALL.filter(c => !c.hidden);
