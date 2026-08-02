// Where the app's factual claims come from.
//
// The business plan schedules "신뢰할 수 있는 한식 정보 출처 선정 및 데이터
// 검수" for the second week of August, and the note from 감부장님 is blunter:
// 공신력 있는 데이터 선정 후 할루시네이션 방지. This is that, made structural
// rather than promised.
//
// Two rules, and the second one is the machinery:
//
// 1. Every entry below was fetched and read. None of them was inferred from a
//    title, and none was added because it looked like the sort of page that
//    would say the thing. A citation nobody checked is worse than no citation,
//    because it converts a guess into an apparent fact.
//
// 2. A quiz question with no source does not reach a traveller. `quizFor`
//    filters on it and a test fails if anything unsourced escapes. The claim
//    stays in the file so somebody can source it later; it just cannot be
//    taught to a foreigner in the meantime.
//
// What is deliberately NOT here: sources for most of the `culture` prose in
// the menu catalog. Those paragraphs are editorial context rather than
// testable assertions, and docs/sources-status.md lists which of them make
// hard claims that still need backing.
//
// The filter now passes everything — all sixteen questions are sourced. That
// is not a reason to remove it. Reading the sources changed four of the
// questions, because the app had been saying more than its sources did, and
// the next question somebody adds will arrive unsourced like all the others.

export const SOURCES = {
  'unesco-kimjang': {
    title: 'Kimjang, making and sharing kimchi in the Republic of Korea',
    publisher: 'UNESCO Intangible Cultural Heritage',
    url: 'https://ich.unesco.org/en/RL/kimjang-making-and-sharing-kimchi-in-the-republic-of-korea-00881',
    // Read directly: inscribed 2013 on the Representative List, and the entry
    // says "Late autumn is Kimjang season, when communities collectively make
    // and share large quantities of kimchi".
    supports: 'Kimjang is UNESCO-listed (2013), happens in late autumn, and is collective.',
  },
  'encykorea-bossam-kimchi': {
    title: '보쌈김치(褓쌈김치)',
    publisher: '한국민족문화대백과사전 · 한국학중앙연구원',
    url: 'https://encykorea.aks.ac.kr/Article/E0023454',
    supports: 'The word 보쌈 originally named a luxury Kaesong kimchi wrapped in a bundle, traced to royal court cuisine — not the pork dish it now means.',
  },
  'wikipedia-bibimbap-ko': {
    title: '비빔밥',
    publisher: '위키백과 (Korean Wikipedia)',
    url: 'https://ko.wikipedia.org/wiki/비빔밥',
    supports: 'The origin of bibimbap is not settled: 음복설, 궁중음식설, 농번기음식설 and others compete, and the dish appears in Joseon-era records as 혼돈반 and 골동반.',
  },
  'khan-bibimbap-invented': {
    title: '비빔밥은 ‘발명된 전통’',
    publisher: '경향신문',
    url: 'https://www.khan.co.kr/article/201011121848215',
    supports: 'Jeonju bibimbap as a distinct branded tradition is substantially a modern construction.',
  },
  'facts-korea-dining': {
    title: 'Eating and Drinking Customs in Korea',
    publisher: 'Facts and Details',
    url: 'https://factsanddetails.com/korea/South_Korea/People_2/entry-7230.html',
    supports: 'Korean table manners: the rice bowl stays on the table unlike in China or Japan; you do not pour your own drink; you turn away from an elder to drink.',
  },
  'encykorea-samgyeopsal': {
    title: '삼겹살구이',
    publisher: '한국민족문화대백과사전 · 한국학중앙연구원',
    url: 'https://encykorea.aks.ac.kr/Article/E0079961',
    // Read directly: "삼겹살은 살코기와 지방이 삼겹을 형성하고 있어서 붙은
    // 이름이며 과거에는 세겹살로 불리웠다."
    supports: 'The name describes lean and fat forming three layers, and the older form of the word was 세겹살.',
  },
  'encykorea-budae': {
    title: '부대찌개',
    publisher: '한국민족문화대백과사전 · 한국학중앙연구원',
    url: 'https://encykorea.aks.ac.kr/Article/E0079968',
    // Read directly: after the war, food sent for American soldiers could be
    // got near the bases; a vendor in 의정부 was selling it from 1960 using
    // sausage, ham and bacon from the base nearby.
    supports: 'Budae jjigae came out of scarcity after the Korean War, built from ham, sausage and bacon obtained near US army bases, and Uijeongbu is where it was first sold.',
  },
  'encykorea-jokbal': {
    title: '족발',
    publisher: '한국민족문화대백과사전 · 한국학중앙연구원',
    url: 'https://encykorea.aks.ac.kr/Article/E0079965',
    // Read directly: "돼지족을 간장 양념으로 조린 음식", boiled with garlic
    // and ginger then braised in soy; created by refugees from the North who
    // settled in 장충동, the first shop 평안도집 opening in 1961.
    supports: 'Jokbal is pig trotters braised in soy with garlic and ginger, and the Jangchung-dong trade was started by North Korean refugees who settled there after the war.',
  },
  'encykorea-dakgalbi': {
    title: '닭갈비',
    publisher: '한국민족문화대백과사전 · 한국학중앙연구원',
    url: 'https://encykorea.aks.ac.kr/Article/E0067943',
    // Read directly: began in Chuncheon bars in the late 1960s; through the
    // 1970s the Myeongdong back alleys filled with it and it drew soldiers on
    // leave and students — "별명이 '대학생갈비', '서민갈비'라 불렸다".
    supports: 'Dakgalbi began in Chuncheon in the late 1960s and was nicknamed 대학생갈비 as a cheap filling meal for students in the 1970s.',
  },
  'encykorea-bansang': {
    title: '반상',
    publisher: '한국민족문화대백과사전 · 한국학중앙연구원',
    url: 'https://encykorea.aks.ac.kr/Article/E0021491',
    // Read directly: "반상에는 반찬의 가짓수에 따라서 3첩∼12첩까지 있다", and
    // the count is of banchan only — rice, soup and kimchi are not 첩.
    //
    // Note what this source does NOT say: it does not reserve 12첩 for the
    // king. An earlier draft of the quiz claimed it did. See encykorea-surasang.
    supports: 'A 반상 is counted in 첩 — side dishes beyond rice, soup and kimchi — and runs from three to twelve.',
  },
  'encykorea-surasang': {
    title: '수라상',
    publisher: '한국민족문화대백과사전 · 한국학중앙연구원',
    url: 'https://encykorea.aks.ac.kr/Article/E0031301',
    // Read directly: "수라상은 기본음식 외에 12가지 찬품이 올려지는 12첩반상을
    // 원칙으로 한다", with the page adding that going beyond it was allowed.
    supports: 'The king and queen’s 수라상 was set at twelve 첩 as a matter of principle, though more was permitted.',
  },
  'encykorea-kimchi': {
    title: '김치',
    publisher: '한국민족문화대백과사전 · 한국학중앙연구원',
    url: 'https://encykorea.aks.ac.kr/Article/E0010822',
    // Read directly: "조선시대 중엽에 들어와서 고추가 수입되면서 우리나라
    // 김치에는 일대 혁명이 일어난다", and the northern varieties 백김치 and
    // 동치미 use little or no chilli.
    //
    // The page says 조선시대 중엽, not a century. The quiz reveal used to say
    // "the 16th century" and now says what this source says.
    supports: 'Chilli arrived partway through the Joseon dynasty and changed kimchi; 백김치 and 동치미 are made with little or no chilli.',
  },
  'encykorea-haejangguk': {
    title: '해장국',
    publisher: '한국민족문화대백과사전 · 한국학중앙연구원',
    url: 'https://encykorea.aks.ac.kr/Article/E0062730',
    // Read directly: "술로 시달린 속을 풀기 위하여 먹는 국물음식", with 해장
    // from 해정(解酲) — 解 to undo, 酲 the after-effect of drink.
    //
    // Does not name 감자탕. That claim rests on wikipedia-gamjatang-ko.
    supports: '해장국 is a category of broth eaten to undo the effects of drinking, from 해정(解酲).',
  },
  'wikipedia-gopchang-ko': {
    title: '곱창',
    publisher: '위키백과 (Korean Wikipedia)',
    url: 'https://ko.wikipedia.org/wiki/곱창',
    // Read directly: "곱창은 소나 돼지의 작은창자로 만든 요리이다", served at
    // 포장마차 and specialist restaurants.
    supports: 'Gopchang is the small intestine of cattle or pig, eaten at street stalls and dedicated restaurants.',
  },
  'wikipedia-gejang-ko': {
    title: '게장',
    publisher: '위키백과 (Korean Wikipedia)',
    url: 'https://ko.wikipedia.org/wiki/게장',
    // Read directly: "참게장은 '밥도둑'이라는 별명도 있는데, 입맛을 돋워 밥을
    // 많이 먹게 할 만큼 맛있는 음식이라는 의미이다."
    //
    // Scope worth keeping honest: the page attaches the nickname to 참게장,
    // the mitten-crab soy version, rather than to soy-cured crab in general.
    supports: 'Soy-cured crab carries the nickname 밥도둑 — rice thief — meaning food good enough to make you eat far more rice; the page attests it for 참게장.',
  },
  'wikipedia-gamjatang-ko': {
    title: '감자탕',
    publisher: '위키백과 (Korean Wikipedia)',
    url: 'https://ko.wikipedia.org/wiki/감자탕',
    // Read directly: "한국에서는 해장국, 식사메뉴, 야식, 술안주 등으로 인기가
    // 있는 요리에 해당한다."
    //
    // Note this is the dish's use, not its name. The argument over whether
    // 감자 means potato or a cut of spine stays out of the quiz, as the note
    // at the top of quiz.js explains.
    supports: 'Gamjatang is eaten as 해장국 as well as a meal, late-night food and drinking food.',
  },
  'koreatimes-banchan': {
    title: 'Inflation, hygiene woes hit Korean banchan culture',
    publisher: 'The Korea Times · 7 February 2026',
    url: 'https://www.koreatimes.co.kr/lifestyle/travel-food/20260207/inflation-hygiene-woes-hit-korean-banchan-culture',
    // Read directly: free refills are still the norm and still expected —
    // charging is described as something owners are "increasingly discussing"
    // and as risking looking stingy, not as current practice.
    //
    // Kept as a source rather than a footnote because it dates the claim. A
    // traveller reading this app in 2026 should know the custom is under
    // pressure, and the quiz reveal now says so.
    supports: 'Free unlimited banchan refills remain the norm in Korea as of February 2026, while agricultural inflation has restaurant owners debating an end to the practice.',
  },
};

export const sourceById = (id) => SOURCES[id] ?? null;

/** The sources behind a claim, dropping any id that is not in the registry. */
export const sourcesFor = (ids = []) => ids.map(sourceById).filter(Boolean);

/** Has this claim got anything behind it? */
export const isSourced = (item) => sourcesFor(item?.sources).length > 0;
