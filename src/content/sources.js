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
// testable assertions, and docs/sources-todo.md lists which of them make hard
// claims that still need backing.

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
};

export const sourceById = (id) => SOURCES[id] ?? null;

/** The sources behind a claim, dropping any id that is not in the registry. */
export const sourcesFor = (ids = []) => ids.map(sourceById).filter(Boolean);

/** Has this claim got anything behind it? */
export const isSourced = (item) => sourcesFor(item?.sources).length > 0;
