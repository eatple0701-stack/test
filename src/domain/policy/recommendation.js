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
  },
  'busan-seafood': {
    months: [6, 7, 8],
    line: 'Summer is the season this one is written for, and the market opens at dawn.',
    lineKo: '이 이야기는 여름을 위해 쓰였고, 시장은 새벽에 문을 엽니다.',
    lineEs: 'Esta historia está escrita para el verano, y el mercado abre al amanecer.',
  },
  'street-food': {
    months: [10, 11, 12, 1, 2],
    line: 'Winter is when the griddles come out — the season the stalls are built for.',
    lineKo: '겨울이면 철판이 나옵니다. 노점이 만들어진 이유가 되는 계절입니다.',
    lineEs: 'En invierno salen las planchas: la estación para la que existen los puestos.',
  },
  'cafe-hopping': {
    months: [12, 1, 2],
    line: 'The season for staying indoors over one long coffee.',
    lineKo: '커피 한 잔을 길게 붙들고 실내에 머무는 계절입니다.',
    lineEs: 'La estación de quedarse dentro con un café largo.',
  },
};

/** Themes that read differently after dark. */
const EVENING = {
  'seoul-after-dark': {
    line: 'It is evening — this is the hour the theme is about.',
    lineKo: '지금은 저녁입니다. 이 이야기가 다루는 바로 그 시간이에요.',
    lineEs: 'Es de noche: justo la hora de la que trata esta historia.',
  },
  // Not "busiest now": how full a market is at this moment is not something
  // the app can see. When the stalls are open is a fact about the theme.
  'street-food': {
    line: 'The stalls are open — most of this one does not exist before dark.',
    lineKo: '노점이 문을 열 시간입니다. 이 이야기의 대부분은 해가 지기 전에는 존재하지 않아요.',
    lineEs: 'Los puestos están abiertos: casi todo esto no existe antes de que anochezca.',
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
  const pick = (en, korean, spanish) => {
    if (ko && korean) return korean;
    if (es && spanish) return spanish;
    return en;
  };
  // Theme and collection names have their own Korean and Spanish in the
  // catalogue; a collection with neither falls back to its English title.
  const name = (x) => {
    if (ko && x?.titleKo) return x.titleKo;
    if (es && x?.titleEs) return x.titleEs;
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
      )
      : pick(
        `You have just finished ${justFinished.title} — this goes somewhere different.`,
        `방금 ${name(justFinished)}을(를) 마치셨어요. 이건 조금 다른 곳으로 갑니다.`,
        `Acabas de terminar ${name(justFinished)} — esto va a otra parte.`,
      );
  }

  if (inSeason(theme.id, month)) {
    return pick(SEASON[theme.id].line, SEASON[theme.id].lineKo, SEASON[theme.id].lineEs);
  }

  if (hour >= 18 && EVENING[theme.id]) {
    return pick(EVENING[theme.id].line, EVENING[theme.id].lineKo, EVENING[theme.id].lineEs);
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
      );
    }
  }

  // Untouched, but only worth saying to someone who has touched something —
  // to a traveller on their first day every theme is unvisited, and pointing
  // it out says nothing.
  if (untouched && hasAnyProgress) {
    return pick('You have not opened this one yet.', '이건 아직 열어보지 않으셨어요.', 'Esta todavía no la has abierto.');
  }

  if (!hasStarted && theme.status === STATUS.PUBLISHED) {
    return pick(
      'Every stop on this one has a verified place to eat, so it is an easy first path.',
      '이 길은 모든 지점에 확인된 식당이 있어서, 처음 걷기에 편합니다.',
      'Cada parada de esta ruta tiene un sitio verificado donde comer, así que es un primer camino fácil.',
    );
  }

  if (theme.status === STATUS.PREVIEW) {
    return pick(
      'The culture is written up in full; the places are still being verified.',
      '이야기는 다 쓰였고, 장소는 아직 확인 중입니다.',
      'La historia está escrita entera; los sitios siguen en verificación.',
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
    );
  }
  return pick('A short path you can finish in an afternoon.', '오후 한나절이면 끝나는 짧은 길입니다.', 'Un camino corto que puedes terminar en una tarde.');
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
