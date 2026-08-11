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
  [EATEN_AT.MORNING]: { kr: '아침', en: 'morning' },
  [EATEN_AT.LUNCH]: { kr: '점심', en: 'lunch' },
  [EATEN_AT.EVENING]: { kr: '저녁', en: 'evening' },
  [EATEN_AT.LATE]: { kr: '늦은 밤', en: 'late night' },
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
    nameKo: '삼겹살',
    romanization: 'sam-gyeop-sal',
    category: MENU_CATEGORY.GRILL,
    minPeople: 2,
    // Why a stranger is worth finding for this dish.
    whyShared:
      'Almost every grill house prices pork belly from two servings up, and the meat is cooked in the middle of the table rather than in a kitchen — somebody has to turn it while somebody else cuts.',
    whySharedKo:
      '거의 모든 고깃집이 2인분부터 값을 매기고, 고기는 주방이 아니라 식탁 한가운데서 익습니다. 누군가는 뒤집어야 하고, 누군가는 잘라야 해요.',
    // What the table actually does, for a traveller who has never sat at one.
    howItWorks:
      'Raw pork belly comes to a grill set into the table. You cook it yourself, cut it with scissors, then wrap a piece in lettuce with garlic, ssamjang and rice.',
    howItWorksKo:
      '생삼겹살이 식탁에 박힌 불판 위로 나옵니다. 직접 굽고, 가위로 자르고, 상추에 마늘과 쌈장과 밥을 얹어 싸 먹습니다.',
    themeId: 'seoul-after-dark',
    culture:
      "The grill in the middle is a job, not a decoration: somebody turns the meat, somebody cuts it, and wrapping a piece in lettuce and handing it to the person beside you is a small act of care Koreans do without mentioning it. This is the first round of a 회식 — the after-work dinner that built most Korean working relationships.",
    cultureKo:
      '가운데 불판은 장식이 아니라 할 일입니다. 누군가는 고기를 뒤집고, 누군가는 자르고, 한 점을 상추에 싸서 옆 사람에게 건네는 건 한국 사람들이 말없이 하는 작은 배려예요. 회식의 1차, 한국의 직장 관계 대부분을 만들어 온 바로 그 자리이기도 합니다.',
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
    nameKo: '닭갈비',
    romanization: 'dak-gal-bi',
    category: MENU_CATEGORY.GRILL,
    minPeople: 2,
    whyShared:
      'It is stir-fried on one wide iron plate in the centre of the table, and the plate does not come in a one-person size.',
    whySharedKo:
      '식탁 한가운데 넓은 철판 하나에서 볶는데, 그 철판에는 1인분 크기가 없습니다.',
    howItWorks:
      'Marinated chicken, cabbage and rice cake are fried in front of you. When the meat is gone, rice is fried in what is left in the pan — that second course is the part regulars come for.',
    howItWorksKo:
      '양념한 닭고기와 양배추, 떡을 눈앞에서 볶아 줍니다. 고기가 없어지면 남은 양념에 밥을 볶는데, 단골들이 오는 이유는 사실 그 두 번째 순서예요.',
    themeId: null,
    culture:
      "It comes from Chuncheon, where it started in the bars in the late 1960s and filled the back alleys through the 1970s — cheap enough by then that students called it 대학생갈비, student ribs. When the meat is gone the staff fry rice in what is left in the pan, and leaving before that second course is considered a waste of a good dinner.",
    cultureKo:
      '춘천에서 왔습니다. 1960년대 말 술집에서 시작해 1970년대 뒷골목을 채웠고, 그때쯤에는 값이 싸서 학생들이 대학생갈비라고 불렀어요. 고기가 다 없어지면 남은 양념에 밥을 볶아 주는데, 그 볶음밥 전에 일어서는 건 좋은 저녁을 낭비하는 일로 칩니다.',
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
    nameKo: '감자탕',
    romanization: 'gam-ja-tang',
    category: MENU_CATEGORY.STEW,
    minPeople: 2,
    whyShared:
      'The pot sits on a burner in the middle of the table and is ladled out by whoever is nearest. Shops list it by pot size — small is still two people.',
    whySharedKo:
      '식탁 가운데 버너 위에 냄비째 올라가고, 가까이 앉은 사람이 국자로 떠 줍니다. 가게는 냄비 크기로 파는데, 제일 작은 것도 2인용이에요.',
    howItWorks:
      'Pork spine simmered with potato and perilla leaf. You pull the meat off the bone with chopsticks; it is expected to be slow and messy.',
    howItWorksKo:
      '돼지 등뼈를 감자와 깻잎을 넣고 오래 끓입니다. 젓가락으로 뼈에서 살을 발라 먹고, 원래 느리고 지저분하게 먹는 음식이에요.',
    themeId: 'seoul-after-dark',
    culture:
      "Long a night-shift and market-worker meal, eaten late and slowly because the meat has to be worked off the bone by hand. It doubles as 해장 — the food Koreans eat the morning after drinking, which is its own recognised category here.",
    cultureKo:
      '오래도록 야간 노동자와 시장 사람들의 밥이었습니다. 뼈에서 살을 손으로 발라야 하니 늦게, 천천히 먹었어요. 해장 음식이기도 한데, 해장은 한국에서 그 자체로 하나의 음식 분류입니다.',
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
    nameKo: '부대찌개',
    romanization: 'bu-dae-jji-gae',
    category: MENU_CATEGORY.STEW,
    minPeople: 2,
    whyShared:
      'Cooked at the table in a shallow pan everyone eats out of directly, and ordered by the number of people rather than by the bowl.',
    whySharedKo:
      '식탁에서 얕은 전골 냄비 하나를 놓고 다 같이 떠먹고, 그릇 단위가 아니라 사람 수로 주문합니다.',
    howItWorks:
      'A stew built after the Korean War from what American bases had to spare — spam, sausage, baked beans — over a Korean broth. Instant noodles go in near the end.',
    howItWorksKo:
      '한국전쟁 뒤 미군 부대에서 남던 것들 — 스팸, 소시지, 콩 통조림 — 을 한국식 육수에 넣어 만든 찌개입니다. 라면 사리는 마지막쯤에 들어가요.',
    themeId: null,
    culture:
      "Built after the Korean War around Uijeongbu, from surplus the American bases had and Korean kitchens did not: spam, sausage, baked beans. A dish assembled out of scarcity became one the country now eats by choice, which is roughly the shape of post-war Korea in a single pan.",
    cultureKo:
      '한국전쟁 뒤 의정부에서, 미군 부대에는 있고 한국 부엌에는 없던 것들로 만들어졌습니다. 스팸, 소시지, 콩 통조림. 궁핍에서 조립된 음식이 이제는 일부러 찾아 먹는 음식이 되었는데, 그게 대략 전후 한국의 모양이기도 합니다.',
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
    nameKo: '보쌈',
    romanization: 'bo-ssam',
    category: MENU_CATEGORY.PLATTER,
    minPeople: 2,
    whyShared:
      'It arrives as one platter of sliced pork with a pile of leaves and a bowl of kimchi to build from. The smallest platter on most menus feeds two.',
    whySharedKo:
      '수육 한 접시에 잎채소 한 무더기와 김치 한 보시기가 함께 나와서 직접 싸 먹습니다. 메뉴판에서 제일 작은 접시가 대개 2인분이에요.',
    howItWorks:
      'Boiled pork belly, served cool, that you wrap yourself in napa cabbage with radish salad and salted shrimp.',
    howItWorksKo:
      '삶아서 식힌 삼겹살을 배추에 무생채, 새우젓과 함께 직접 싸 먹습니다.',
    themeId: null,
    culture:
      "Traditionally eaten on 김장 day, when families gather to make a winter's worth of kimchi together — UNESCO lists that gathering as intangible cultural heritage. The pork is what the household eats standing up, wrapped in leaves, while the work is still going on.",
    cultureKo:
      '전통적으로 김장하는 날 먹었습니다. 가족이 모여 한 겨울치 김치를 담그는 그 자리요 — 유네스코는 김장을 무형문화유산으로 올려 두었습니다. 보쌈은 일이 아직 끝나지 않았을 때 선 채로 잎에 싸서 먹던 고기예요.',
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
    nameKo: '족발',
    romanization: 'jok-bal',
    category: MENU_CATEGORY.PLATTER,
    minPeople: 2,
    whyShared:
      'Sold by the whole trotter. There is no half order, and a whole one defeats one person.',
    whySharedKo:
      '족 한 짝 단위로 팝니다. 반 개 주문은 없고, 한 짝은 혼자서 감당이 안 돼요.',
    howItWorks:
      'Pig trotter braised in soy, cinnamon and ginger until the skin turns to gelatin, then sliced and eaten wrapped in leaves.',
    howItWorksKo:
      '돼지 족을 간장, 계피, 생강에 껍질이 젤라틴이 될 때까지 조린 뒤 썰어서 쌈에 싸 먹습니다.',
    themeId: 'seoul-after-dark',
    culture:
      "The Jangchung-dong alley that made it famous was built by families displaced by the Korean War. It is 야식 food — the late meal ordered to a home or an office after everything else has closed, and almost never eaten by one person.",
    cultureKo:
      '족발로 유명해진 장충동 골목은 한국전쟁으로 터전을 잃은 사람들이 만들었습니다. 야식 음식이에요. 다른 데가 다 닫은 뒤 집이나 사무실로 시키는 늦은 끼니이고, 혼자 먹는 일은 거의 없습니다.',
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
    nameKo: '간장게장',
    romanization: 'gan-jang-ge-jang',
    category: MENU_CATEGORY.SET,
    minPeople: 2,
    whyShared:
      'Served as a set with rice and a spread of side dishes, priced per crab and usually listed from two people up.',
    whySharedKo:
      '밥과 여러 반찬을 곁들인 한 상으로 나오고, 게 마리 수로 값을 매기며 보통 2인분부터 적혀 있습니다.',
    howItWorks:
      'Raw crab cured in soy sauce. You eat it with your hands, and the shell is meant to be filled with rice at the end — that last mouthful is the point of the dish.',
    howItWorksKo:
      '생 게를 간장에 담가 삭힙니다. 손으로 먹고, 마지막에 등딱지에 밥을 비벼 먹으라고 남겨 두는데 — 그 마지막 한 입이 이 음식의 핵심이에요.',
    themeId: null,
    culture:
      "Koreans call it 밥도둑, the rice thief, because the salt in it makes you eat more rice than you meant to. The last step is filling the empty shell with rice and mixing it in — the dish is built around that final mouthful rather than the crab itself.",
    cultureKo:
      '한국에서는 밥도둑이라고 부릅니다. 짠맛 때문에 생각보다 밥을 더 먹게 되거든요. 마지막 순서는 빈 등딱지에 밥을 넣고 비비는 것인데, 이 음식은 게 자체보다 그 마지막 한 입을 중심으로 짜여 있습니다.',
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
    nameKo: '한정식',
    romanization: 'han-jeong-sik',
    category: MENU_CATEGORY.SET,
    minPeople: 2,
    whyShared:
      'A full course of shared dishes brought out together. Most houses take the booking for two or more, and many ask for it a day ahead.',
    whySharedKo:
      '나눠 먹는 요리들이 한꺼번에 나오는 정찬입니다. 대부분 2인 이상으로 예약을 받고, 하루 전에 미리 말해 달라는 집도 많아요.',
    howItWorks:
      'A formal spread — soups, grilled fish, jeon, a dozen or more banchan — laid across the table at once rather than in courses. Everything in the middle is for everyone.',
    howItWorksKo:
      '국, 생선구이, 전, 열 가지가 넘는 반찬이 코스가 아니라 한 상에 한꺼번에 깔립니다. 가운데 있는 건 전부 모두의 것이에요.',
    themeId: null,
    culture:
      "It descends from the 반상, the formally counted Korean table: dishes were served in sets of three, five, seven or nine, and the number marked the household. Everything arrives at once rather than in courses, so nothing is anybody's alone.",
    cultureKo:
      '격식을 갖춰 가짓수를 세던 반상에서 내려왔습니다. 반찬을 3첩, 5첩, 7첩, 9첩으로 냈고 그 숫자가 그 집을 나타냈어요. 코스가 아니라 한꺼번에 나오기 때문에, 어느 것도 누구 한 사람의 것이 아닙니다.',
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
    howItWorks:
      'A home-style set: rice, soup, and whatever side dishes the kitchen made that morning. Often there is no menu — you sit down and it comes.',
    howItWorksKo:
      '집밥 같은 한 상입니다. 밥, 국, 그리고 그날 아침 주방에서 만든 반찬. 메뉴판이 아예 없는 집도 많아요 — 앉으면 나옵니다.',
    themeId: null,
    culture:
      "The everyday table — 집밥, home food, served in shops that often have no menu at all. What arrives is what the kitchen made that morning, and refills of the side dishes are free and expected, which is why asking for more is a compliment rather than an imposition.",
    cultureKo:
      '매일의 밥상, 집밥입니다. 메뉴판이 아예 없는 가게에서 나오는 경우가 많아요. 나오는 건 그날 아침에 만든 것이고, 반찬 리필은 공짜이자 당연한 것이라 더 달라고 하는 게 실례가 아니라 오히려 칭찬이 됩니다.',
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
    nameKo: '곱창',
    romanization: 'gop-chang',
    category: MENU_CATEGORY.GRILL,
    minPeople: 2,
    whyShared:
      'Priced by the serving with a two-serving minimum almost everywhere, and grilled at the table where it needs watching.',
    whySharedKo:
      '인분 단위로 팔고 거의 어디서나 2인분부터이며, 식탁에서 구워야 해서 계속 지켜봐야 합니다.',
    howItWorks:
      'Beef or pork intestine grilled over charcoal until the fat inside renders. Regulars finish with fried rice in the same pan.',
    howItWorksKo:
      '소나 돼지 곱창을 숯불에 안쪽 기름이 녹아 나올 때까지 굽습니다. 단골들은 같은 불판에 볶음밥으로 마무리해요.',
    themeId: 'seoul-after-dark',
    culture:
      "Offal was poverty food within living memory and is now among the more expensive things on a Korean grill — a change most people eating it can remember happening. It is drinking food, cooked slowly, and the table it belongs to is one nobody is in a hurry to leave.",
    cultureKo:
      '내장은 사람들이 기억하는 시간 안에서 가난한 음식이었다가, 지금은 한국 고깃집에서 비싼 축에 듭니다. 그 변화를 지금 먹고 있는 사람 대부분이 직접 겪었어요. 술안주이고, 천천히 굽고, 이 상은 아무도 서둘러 일어나지 않는 자리입니다.',
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
  [MENU_CATEGORY.GRILL]: { en: 'Grilled at the table', ko: '구이' },
  [MENU_CATEGORY.STEW]: { en: 'One pot', ko: '찌개·전골' },
  [MENU_CATEGORY.SET]: { en: 'A full table', ko: '한 상' },
  [MENU_CATEGORY.PLATTER]: { en: 'One platter', ko: '접시' },
};
