// RecommendationPolicy — which theme to put forward, and why.
//
// The "why" matters as much as the pick: a recommendation without a reason
// is just a card. But a reason is a claim, and this project does not make
// claims it cannot support. Every reason below is derived from something the
// app genuinely knows — the date, the clock, the traveller's own records, the
// catalogue. Nothing is inferred from data we do not have.
//
// Deliberately absent: weather. "Recommended because it is raining" reads
// well and would be fabrication — there is no weather source wired in. If one
// is added later it becomes another entry in REASONS and nothing else changes.

import {
  themes, experienceIdsOfTheme, experienceById, collectionIdsOfTheme, collectionById,
} from '../catalog/index.js';
import { STATUS } from '../types.js';

/**
 * Months a theme is at its best, where that is a real seasonal fact.
 *
 * These lines are keyed off the calendar, which the app has, and they must not
 * drift into describing conditions, which it does not. "Coastal weather is
 * kindest now" and "cold enough that a griddle is the warmest place" both read
 * beautifully and both assert today's weather from a month number — the same
 * fabrication as reading out a forecast we never fetched. What is left says
 * what the season is for.
 */
const SEASON = {
  'spring-picnic': {
    months: [3, 4, 5],
    line: 'Blossom season is short — this is the fortnight it is worth planning around.',
    lineKo: '벚꽃철은 짧습니다. 계획을 세워 볼 만한 두 주가 바로 지금입니다.',
    lineEs: 'La temporada de los cerezos es corta: estas son las dos semanas por las que merece la pena organizarse.',
    lineFr: "La saison des cerisiers est courte — c'est la quinzaine autour de laquelle il vaut la peine de s'organiser.",
    lineAr: 'موسم أزهار الكرز قصير — وهذان الأسبوعان يستحقّان أن تُرتّب حولهما.',
    lineZh: '樱花季很短——这两周值得围着它安排。',
    lineJa: '桜の季節は短く、この二週間は予定を寄せる価値があります。',
  },
  'busan-seafood': {
    months: [6, 7, 8],
    line: 'Summer is the season this one is written for, and the market opens at dawn.',
    lineKo: '이 이야기는 여름을 위해 쓰였고, 시장은 새벽에 문을 엽니다.',
    lineEs: 'Esta historia está escrita para el verano, y el mercado abre al amanecer.',
    lineFr: "Cette histoire est écrite pour l'été, et le marché ouvre à l'aube.",
    lineAr: 'هذه الحكاية مكتوبة للصيف، والسوق يفتح مع الفجر.',
    lineZh: '这个故事是为夏天写的，而市场天亮就开。',
    lineJa: 'この話は夏のために書かれていて、市場は夜明けに開きます。',
  },
  'street-food': {
    months: [10, 11, 12, 1, 2],
    line: 'Winter is when the griddles come out — the season the stalls are built for.',
    lineKo: '겨울이면 철판이 나옵니다. 노점이 만들어진 이유가 되는 계절입니다.',
    lineEs: 'En invierno salen las planchas: la estación para la que existen los puestos.',
    lineFr: "L'hiver, les plaques sortent — la saison pour laquelle les étals existent.",
    lineAr: 'في الشتاء تخرج الصفائح — الموسم الذي وُجدت البسطات من أجله.',
    lineZh: '冬天铁板才出来——摊子本来就是为这个季节存在的。',
    lineJa: '冬になると鉄板が出ます——屋台はこの季節のためにあります。',
  },
  'cafe-hopping': {
    months: [12, 1, 2],
    line: 'The season for staying indoors over one long coffee.',
    lineKo: '커피 한 잔을 길게 붙들고 실내에 머무는 계절입니다.',
    lineEs: 'La estación de quedarse dentro con un café largo.',
    lineFr: "La saison où l'on reste à l'intérieur autour d'un long café.",
    lineAr: 'موسم البقاء في الداخل حول قهوة طويلة.',
    lineZh: '适合守着一杯咖啡待在室内的季节。',
    lineJa: '一杯のコーヒーを長く、屋内で過ごす季節です。',
  },
};

/** Themes that read differently after dark. */
const EVENING = {
  'seoul-after-dark': {
    line: 'It is evening — this is the hour the theme is about.',
    lineKo: '지금은 저녁입니다. 이 이야기가 다루는 바로 그 시간이에요.',
    lineEs: 'Es de noche: justo la hora de la que trata esta historia.',
    lineFr: "C'est le soir — l'heure même dont parle cette histoire.",
    lineAr: 'إنه المساء — الساعة التي تتحدّث عنها هذه الحكاية بالضبط.',
    lineZh: '现在是晚上——正是这个故事讲的那个时辰。',
    lineJa: 'いまは夜——この話が扱っているのは、まさにこの時間です。',
  },
  // Not "busiest now": how full a market is at this moment is not something
  // the app can see. When the stalls are open is a fact about the theme.
  'street-food': {
    line: 'The stalls are open — most of this one does not exist before dark.',
    lineKo: '노점이 문을 열 시간입니다. 이 이야기의 대부분은 해가 지기 전에는 존재하지 않아요.',
    lineEs: 'Los puestos están abiertos: casi todo esto no existe antes de que anochezca.',
    lineFr: "Les étals sont ouverts — presque rien de tout cela n'existe avant la tombée du jour.",
    lineAr: 'البسطات مفتوحة — ولا يكاد شيء من هذا يوجد قبل المغيب.',
    lineZh: '摊子都开着——这里的大半，天黑之前根本不存在。',
    lineJa: '屋台は開いています——ここのほとんどは、日が暮れる前には存在しません。',
  },
};

const inSeason = (themeId, month) => SEASON[themeId]?.months.includes(month);

/** The collection, if any, that holds both of these themes. */
const sharedCollection = (a, b) => {
  const held = new Set(collectionIdsOfTheme(b));
  const id = collectionIdsOfTheme(a).find(c => held.has(c));
  return id ? collectionById(id) : null;
};

/**
 * A one-line, honest justification for surfacing this theme now.
 *
 * @param {object} theme
 * @param {{
 *   at: Date,
 *   visitedZones: string[],
 *   hasStarted: boolean,        is any theme underway
 *   justFinished: object|null,  a theme completed during this session
 *   untouched: boolean,         has nothing in THIS theme been done
 *   hasAnyProgress: boolean,    has the traveller done anything at all
 *   locale: 'both'|'ko'|'en',   which language to answer in
 * }} context
 * @returns {string}
 *
 * The locale is a parameter rather than something the caller translates after
 * the fact, because these sentences are assembled from theme and collection
 * names and a count — there is no finished string to hand to a translator,
 * only the pieces. Korean is returned only when Korean is asked for; the
 * bilingual default answers in English, like the rest of the app's prose.
 */
export function reasonFor(theme, {
  at = new Date(), visitedZones = [], hasStarted = false,
  justFinished = null, untouched = false, hasAnyProgress = false,
  locale = 'both',
} = {}) {
  const month = at.getMonth() + 1;
  const hour = at.getHours();
  const ko = locale === 'ko';
  const es = locale === 'es';
  const fr = locale === 'fr';
  const ar = locale === 'ar';
  const zh = locale === 'zh';
  const ja = locale === 'ja';
  const pick = (en, korean, spanish, french, arabic, chinese, japanese) => {
    if (ko && korean) return korean;
    if (es && spanish) return spanish;
    if (fr && french) return french;
    if (ar && arabic) return arabic;
    if (zh && chinese) return chinese;
    if (ja && japanese) return japanese;
    return en;
  };
  // Theme and collection names have their own Korean and Spanish in the
  // catalogue; a collection with neither falls back to its English title.
  const name = (x) => {
    if (ko && x?.titleKo) return x.titleKo;
    if (es && x?.titleEs) return x.titleEs;
    if (fr && x?.titleFr) return x.titleFr;
    if (ar && x?.titleAr) return x.titleAr;
    if (zh && x?.titleZh) return x.titleZh;
    if (ja && x?.titleJa) return x.titleJa;
    return x?.title;
  };

  // What just happened outranks everything else. A traveller who has this
  // second finished a culture is asking "so what now" — answering with the
  // season would be answering a question they did not ask.
  if (justFinished && justFinished.id !== theme.id) {
    const collection = sharedCollection(theme.id, justFinished.id);
    // "It follows on" is only said where the catalogue actually places the two
    // together. Otherwise it is a change of direction, and says so.
    return collection
      ? pick(
        `You have just finished ${justFinished.title}. This carries on through ${collection.title}.`,
        `방금 ${name(justFinished)}을(를) 마치셨어요. 이건 ${name(collection)}(으)로 이어집니다.`,
        `Acabas de terminar ${name(justFinished)}. Esto continúa por ${name(collection)}.`,
        `Vous venez de terminer ${name(justFinished)}. Cela se poursuit par ${name(collection)}.`,
        `أنهيتَ للتوّ ${name(justFinished)}. وهذا يمتدّ عبر ${name(collection)}.`,
        `你刚走完${name(justFinished)}。这条路会经由${name(collection)}接下去。`,
        `${name(justFinished)}をいま終えたところですね。ここから${name(collection)}へ続きます。`,
      )
      : pick(
        `You have just finished ${justFinished.title} — this goes somewhere different.`,
        `방금 ${name(justFinished)}을(를) 마치셨어요. 이건 조금 다른 곳으로 갑니다.`,
        `Acabas de terminar ${name(justFinished)} — esto va a otra parte.`,
        `Vous venez de terminer ${name(justFinished)} — celle-ci va ailleurs.`,
        `أنهيتَ للتوّ ${name(justFinished)} — وهذه تذهب إلى مكان آخر.`,
        `你刚走完${name(justFinished)}——这一条通向别的地方。`,
        `${name(justFinished)}をいま終えたところですね——これは別のほうへ向かいます。`,
      );
  }

  if (inSeason(theme.id, month)) {
    return pick(SEASON[theme.id].line, SEASON[theme.id].lineKo, SEASON[theme.id].lineEs, SEASON[theme.id].lineFr, SEASON[theme.id].lineAr, SEASON[theme.id].lineZh, SEASON[theme.id].lineJa);
  }

  if (hour >= 18 && EVENING[theme.id]) {
    return pick(EVENING[theme.id].line, EVENING[theme.id].lineKo, EVENING[theme.id].lineEs, EVENING[theme.id].lineFr, EVENING[theme.id].lineAr, EVENING[theme.id].lineZh, EVENING[theme.id].lineJa);
  }

  // Proximity, from zones the traveller has actually been to.
  if (visitedZones.length > 0) {
    const themeZones = experienceIdsOfTheme(theme.id)
      .flatMap(id => experienceById(id)?.zones ?? []);
    const shared = themeZones.find(z => visitedZones.includes(z));
    if (shared) {
      const where = shared.split(',')[0];
      return pick(
        `You have already eaten in ${where} — this picks up where you were.`,
        `${where}에서 이미 드셔 보셨죠. 그 자리에서 이어집니다.`,
        `Ya has comido en ${where} — esto retoma donde lo dejaste.`,
        `Vous avez déjà mangé à ${where} — ceci reprend là où vous en étiez.`,
        `سبق أن أكلتَ في ${where} — وهذا يواصل من حيث كنت.`,
        `你已经在${where}吃过了——这条从你停下的地方接着走。`,
        `${where}ではもう食べていますね——これはその続きから始まります。`,
      );
    }
  }

  // Untouched, but only worth saying to someone who has touched something —
  // to a traveller on their first day every theme is unvisited, and pointing
  // it out says nothing.
  if (untouched && hasAnyProgress) {
    return pick('You have not opened this one yet.', '이건 아직 열어보지 않으셨어요.', 'Esta todavía no la has abierto.', "Vous n'avez pas encore ouvert celle-ci.", 'لم تفتح هذه بعد.', '这一条你还没打开过。', 'これはまだ開いていません。');
  }

  if (!hasStarted && theme.status === STATUS.PUBLISHED) {
    return pick(
      'Every stop on this one has a verified place to eat, so it is an easy first path.',
      '이 길은 모든 지점에 확인된 식당이 있어서, 처음 걷기에 편합니다.',
      'Cada parada de esta ruta tiene un sitio verificado donde comer, así que es un primer camino fácil.',
      "Chaque étape de ce chemin a une adresse vérifiée où manger : un premier parcours facile.",
      'كل محطة في هذا الطريق لها مكان أكل موثّق، فهو مسار أول سهل.',
      '这条路上每一站都有确认过的吃饭地方，所以适合作为第一条路走。',
      'この道はどの地点にも確認済みの店があるので、最初に歩く道として楽です。',
    );
  }

  if (theme.status === STATUS.PREVIEW) {
    return pick(
      'The culture is written up in full; the places are still being verified.',
      '이야기는 다 쓰였고, 장소는 아직 확인 중입니다.',
      'La historia está escrita entera; los sitios siguen en verificación.',
      "L'histoire est écrite en entier ; les adresses sont encore en cours de vérification.",
      'الحكاية مكتوبة بتمامها؛ أمّا الأماكن فما زالت قيد التوثيق.',
      '故事已经写完了；地点还在确认当中。',
      '話は最後まで書かれていて、場所はまだ確認中です。',
    );
  }

  // Last resort still says something true and checkable rather than repeating
  // the tagline the card already shows.
  const venues = new Set(
    experienceIdsOfTheme(theme.id).flatMap(id => experienceById(id)?.restaurantIds ?? []),
  ).size;
  if (venues > 0) {
    return pick(
      `${venues} verified ${venues === 1 ? 'place' : 'places'} to eat across this theme — you could walk it today.`,
      `이 이야기 전체에 확인된 식당이 ${venues}곳 있어요. 오늘 안에 다 걸어볼 수 있습니다.`,
      `${venues} ${venues === 1 ? 'sitio verificado' : 'sitios verificados'} donde comer en esta historia — podrías recorrerla hoy.`,
      `${venues} ${venues === 1 ? 'adresse vérifiée' : 'adresses vérifiées'} où manger sur ce thème — vous pourriez le parcourir aujourd'hui.`,
      `${venues} ${venues === 1 ? 'مكان موثّق' : 'أماكن موثّقة'} للأكل في هذه الحكاية — تستطيع أن تمشيها اليوم.`,
      `这个故事里有 ${venues} 处确认过的吃饭地方——今天就能走完。`,
      `この話には確認済みの店が${venues}か所あります——今日じゅうに歩けます。`,
    );
  }
  return pick('A short path you can finish in an afternoon.', '오후 한나절이면 끝나는 짧은 길입니다.', 'Un camino corto que puedes terminar en una tarde.', "Un chemin court que vous pouvez finir en un après-midi.", 'طريق قصير تستطيع إنهاءه في بعد ظهر واحد.', '一条短路，一个下午就能走完。', '午後ひとつで歩き終えられる短い道です。');
}

/**
 * Today's theme, stable for the day so it does not shuffle on every render.
 * Prefers a theme that is genuinely in season, then a published one.
 */
export function themeOfTheDay({ at = new Date(), exclude = [] } = {}) {
  const month = at.getMonth() + 1;
  // Excludes what the traveller is already on and anything they have
  // finished: recommending a completed theme is the fastest way to make a
  // suggestion feel like it is not paying attention.
  const skip = new Set(Array.isArray(exclude) ? exclude : [exclude].filter(Boolean));
  const pool = themes.filter(t => !skip.has(t.id) && t.status !== STATUS.PLANNED);
  if (pool.length === 0) return null;

  const seasonal = pool.filter(t => inSeason(t.id, month));
  if (seasonal.length > 0) {
    const day = Math.floor(at.getTime() / 86400000);
    return seasonal[day % seasonal.length];
  }

  const published = pool.filter(t => t.status === STATUS.PUBLISHED);
  const candidates = published.length > 0 ? published : pool;
  const day = Math.floor(at.getTime() / 86400000);
  return candidates[day % candidates.length];
}
