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

export const LANGUAGES = ['English', '한국어', '日本語', '中文', 'Español', 'Français', 'العربية'];

export const isLanguage = (l) => LANGUAGES.includes(l);

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
