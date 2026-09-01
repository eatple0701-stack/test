// What a page may say when it has no table to show.
//
// ── The twenty minutes this is here for ─────────────────────────────────
//
// 2026-09-01, during 2차 운영. A client shipped ahead of its migration, so
// every read of `signups` came back 400 — and the table page told a stranger
//
//     이 밥상은 사라졌어요.
//     This table is no longer here.
//
// about a table two people were sitting at. The page could not tell a failed
// lookup from an absence and picked the worse of the two to assert. A
// traveller reading it would have concluded their dinner was cancelled.
//
// Two separate faults, and both are worth naming because only one of them is
// about wording:
//
//   1. `Promise.all([getTable, listSignups, listReviews])` rejects as one
//      unit. The table had loaded. The guest list had not. The page threw
//      away the table it already had.
//
//   2. `if (!table)` was doing double duty — "not loaded yet", "could not
//      load" and "does not exist" are three states, and it had one branch.
//
// ── The rule ────────────────────────────────────────────────────────────
//
// Absence is a claim about the world. Say it only when the database
// answered and the answer was nothing. Anything else is about this app
// failing, which is a different sentence and a different thing for the
// reader to do — one of them has a retry button and the other does not.

export const TABLE_VIEW = {
  LOADING: 'loading',   // no answer yet
  ERROR: 'error',       // asked, and could not be told
  GONE: 'gone',         // asked, and there is nothing there
  READY: 'ready',
};

/**
 * Which of the four a table page is in.
 *
 * `error` beats `gone` deliberately: when a lookup failed we do not know
 * whether the table exists, and the honest sentence is the one that does not
 * pretend to.
 */
export function tableViewState({ error = null, table = null, menu = null } = {}) {
  if (error) return TABLE_VIEW.ERROR;
  if (table === null || table === undefined) return TABLE_VIEW.LOADING;
  // A table whose dish is unknown to this build cannot be rendered, and that
  // is a gap in the app rather than a missing table — but it is also not
  // something a reader can retry, so it reads as gone.
  if (!menu) return TABLE_VIEW.GONE;
  return TABLE_VIEW.READY;
}

/**
 * What each state is allowed to say.
 *
 * `locale` is here for the reason it is on emptyText: the sentence is chosen
 * by the policy, not handed to a component to translate afterwards.
 */
export function tableViewText(state, { locale = 'both' } = {}) {
  const pick = (en, ko, es, fr, ar, zh, ja) => {
    if (locale === 'ko') return ko;
    if (locale === 'es' && es) return es;
    if (locale === 'fr' && fr) return fr;
    if (locale === 'ar' && ar) return ar;
    if (locale === 'zh' && zh) return zh;
    if (locale === 'ja' && ja) return ja;
    return en;
  };
  switch (state) {
    case TABLE_VIEW.ERROR:
      return {
        title: pick('We could not load this table.', '이 밥상을 불러오지 못했어요.',
          'No hemos podido cargar esta mesa.', "Nous n'avons pas pu charger cette table.",
          'تعذّر تحميل هذه المائدة.', '没能载入这张饭桌。', 'この食卓を読み込めませんでした。'),
        // Says what is NOT known, because the reader's real question is
        // whether their dinner is still happening.
        body: pick(
          'The table may well still be there — we just could not reach it. Try again in a moment.',
          '밥상이 없어진 것이 아니라, 지금 불러오지 못한 것입니다. 잠시 뒤 다시 시도해 주세요.',
          'Puede que la mesa siga ahí: simplemente no hemos podido consultarla. Inténtalo de nuevo en un momento.',
          "La table est probablement toujours là : nous n'avons pas pu la joindre. Réessayez dans un instant.",
          'قد تكون المائدة موجودة، لكننا لم نتمكن من الوصول إليها. حاول بعد قليل.',
          '饭桌很可能还在，只是这次没能读到。请稍后再试。',
          '食卓はおそらくまだあります。読み込めなかっただけです。少ししてからもう一度お試しください。'),
        retry: true,
      };
    case TABLE_VIEW.GONE:
      return {
        title: pick('This table is no longer here.', '이 밥상은 사라졌어요.',
          'Esta mesa ya no está aquí.', "Cette table n'est plus là.",
          'لم تعد هذه المائدة هنا.', '这张饭桌已经不在了。', 'この食卓はもうありません。'),
        body: pick('Other tables are open.', '다른 밥상이 열려 있어요.',
          'Hay otras mesas abiertas.', "D'autres tables sont ouvertes.",
          'هناك موائد أخرى مفتوحة.', '还有别的饭桌开着。', 'ほかの食卓が開いています。'),
        retry: false,
      };
    case TABLE_VIEW.LOADING:
      return {
        title: pick('Loading…', '불러오는 중…', 'Cargando…', 'Chargement…', '…جارٍ التحميل', '载入中…', '読み込み中…'),
        body: '',
        retry: false,
      };
    default:
      return null;
  }
}

/**
 * The guest list could not be read, but the table could.
 *
 * Rendering an empty list here would repeat the original mistake one place
 * down: "nobody has taken a seat" is a claim, and a failed read is not
 * evidence for it.
 */
export function whoListText({ locale = 'both' } = {}) {
  const pick = (en, ko, es, fr, ar, zh, ja) => {
    if (locale === 'ko') return ko;
    if (locale === 'es' && es) return es;
    if (locale === 'fr' && fr) return fr;
    if (locale === 'ar' && ar) return ar;
    if (locale === 'zh' && zh) return zh;
    if (locale === 'ja' && ja) return ja;
    return en;
  };
  return pick(
    'We could not read who is going. This does not mean nobody is.',
    '누가 가는지 불러오지 못했어요. 아무도 없다는 뜻은 아닙니다.',
    'No hemos podido leer quién va. Eso no significa que no vaya nadie.',
    "Nous n'avons pas pu lire qui vient. Cela ne veut pas dire que personne ne vient.",
    'تعذّر معرفة من سيأتي. وهذا لا يعني أن لا أحد سيأتي.',
    '没能读到谁会来。这不代表没有人来。',
    '誰が来るか読み込めませんでした。誰もいないという意味ではありません。');
}
