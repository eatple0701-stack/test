// What the table will run in.
//
// The Profile screen has collected languages since it was built, and its own
// hint says why: "So a host knows what the table will run in." Nothing ever
// showed them to a host, or to anybody. The app asked a question, stored the
// answer, and delivered none of the thing it promised in return.
//
// It matters more than the field's size suggests. A traveller deciding
// whether to sit down with four strangers is not mainly afraid of the food.
// They are afraid of ninety minutes of not understanding anything, and this
// is the one fact that answers it — the sibling prototype in this same team
// puts it on every table card for exactly that reason.
//
// The list is deliberately short and written in each language's own script,
// because somebody scanning for their own language finds 日本語 faster than
// they find "Japanese".
//
// That reasoning was right and only half the job, which a reviewer named on
// 2026-08-07: "언어 종류라던가 음식명만 더 읽고 이해하기 쉬우면". Own-script
// is how you find *your* language. It is also how a Spanish speaker reads
// "Hosted by 조강민 · 한국어" and learns nothing — the one fact that decides
// whether they sit down, printed in an alphabet they cannot read.
//
// So each language now carries both: the native name it is stored and
// scanned by, and an English name anyone can read. The stored value stays
// the native string, because profiles in the database already hold '한국어'
// and a catalogue that renames its own keys silently un-sets everybody's
// languages.

/** The stored values. Order is the order every list renders in. */
export const LANGUAGES = ['English', '한국어', '日本語', '中文', 'Español', 'Français', 'العربية'];

/**
 * The English name for each. English's own entry is null rather than
 * "English · English", which is the sort of thing that makes an interface
 * look like it is not paying attention.
 */
export const LANGUAGE_EN = {
  English: null,
  '한국어': 'Korean',
  '日本語': 'Japanese',
  '中文': 'Chinese',
  'Español': 'Spanish',
  'Français': 'French',
  'العربية': 'Arabic',
};

export const isLanguage = (l) => LANGUAGES.includes(l);

/**
 * One language, ready to print: `{ native, en }`.
 *
 * `en` is null when the native name already is English, so a caller can
 * write `native + (en ? ` · ${en}` : '')` and never produce a doubled label.
 */
export const languageLabel = (l) => ({ native: l, en: LANGUAGE_EN[l] ?? null });

/**
 * A list of languages as one readable line: "한국어 Korean · English".
 *
 * Used wherever a reader meets somebody else's languages rather than
 * choosing their own — a host card, a table's own line — because that is
 * where the English half is doing the work.
 */
export const languageLine = (list) =>
  cleanLanguages(list)
    .map(l => (LANGUAGE_EN[l] ? `${l} ${LANGUAGE_EN[l]}` : l))
    .join(' · ');

/** Only languages this catalog knows, in catalog order so lists read alike. */
export const cleanLanguages = (list) =>
  Array.isArray(list) ? LANGUAGES.filter(l => list.includes(l)) : [];

/**
 * What a traveller shares with a table.
 *
 * Returns the overlap rather than a yes/no, because the useful sentence names
 * the language: "English works here" beats "compatible".
 */
export const sharedWith = (tableLanguages, mine) => {
  const table = cleanLanguages(tableLanguages);
  const own = cleanLanguages(mine);
  return table.filter(l => own.includes(l));
};

/**
 * The one line to print about language, given what both sides said.
 *
 * Four states, and three of them are not "yes" — which is the point. A table
 * that never said, or a traveller who never said, is not the same as a table
 * with nothing in common, and flattening them would either invent a warning
 * or hide a real one.
 */
export const LANGUAGE_FIT = {
  SHARED: 'shared',
  NONE: 'none',
  TABLE_UNSAID: 'table-unsaid',
  MINE_UNSAID: 'mine-unsaid',
};

export function languageFit(tableLanguages, mine) {
  const table = cleanLanguages(tableLanguages);
  const own = cleanLanguages(mine);
  if (table.length === 0) return { fit: LANGUAGE_FIT.TABLE_UNSAID, shared: [] };
  if (own.length === 0) return { fit: LANGUAGE_FIT.MINE_UNSAID, shared: [] };
  const shared = table.filter(l => own.includes(l));
  return { fit: shared.length > 0 ? LANGUAGE_FIT.SHARED : LANGUAGE_FIT.NONE, shared };
}
