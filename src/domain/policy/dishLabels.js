// What a card says about a dish's category and ingredients, in the reader's
// language.
//
// ── Why this is a function and not a lookup in the component ────────────
//
// Until 2026-09-02, TableDetail and TablesTab printed the category chip as
// `CATEGORY_LABEL[menu.category]?.en` — English to every reader — and four
// screens built the ingredient line as `${menu.contains.join(', ')} 들어감`,
// which put the raw id inside a translated sentence: "pork, shellfish 들어감"
// on a Korean screen, "含有pork、shellfish" on a Chinese one.
//
// scripts/audit-i18n.mjs could not see either. It reads string literals and
// say() calls; a member access is neither, and an interpolated value is
// invisible inside a frame that is itself correctly translated. So both
// passed with 0 for as long as they existed. The fix that holds is the one
// this file is: every word comes out of one function, that function is what
// the tests call, and dishLabels.test.mjs refuses a component that reaches
// into the tables itself.
//
// `locale` is one of LOCALE's values. BOTH — the two-language default the app
// has always shown — takes the English half, the same choice useText() makes.

import { CATEGORY_LABEL, CONTAINS_LABEL } from '../catalog/menus.js';
import { LOCALE } from './locale.js';

const pick = (locale, t) => {
  if (locale === LOCALE.KO) return t.ko ?? t.kr ?? t.en;
  if (locale === LOCALE.ES && t.es) return t.es;
  if (locale === LOCALE.FR && t.fr) return t.fr;
  if (locale === LOCALE.AR && t.ar) return t.ar;
  if (locale === LOCALE.ZH && t.zh) return t.zh;
  if (locale === LOCALE.JA && t.ja) return t.ja;
  return t.en;
};

/** The category chip, or '' for a category nothing declared. */
export function categoryLabel(category, locale) {
  const t = CATEGORY_LABEL[category];
  return t ? pick(locale, t) ?? '' : '';
}

/**
 * What a dish is, in one phrase, in the reader's language.
 *
 * The catalogue spells the seven as `gloss`, `glossKo`, `glossEs` … rather
 * than as a `{en, ko, es}` table, so this is the adapter and not a second
 * translation. Written on 2026-09-03 because the front page's category cards
 * printed `DISH_NAME[].en` — "grilled pork belly · grilled beef short rib" —
 * to Spanish, French, Arabic, Chinese and Japanese readers, on a card with no
 * English anywhere else on it. Same family as the four bugs in the note at
 * the top of this file: the label came from a table, and only one language
 * came with it.
 */
export function dishGloss(menu, locale) {
  if (!menu) return '';
  return pick(locale, {
    en: menu.gloss,
    ko: menu.glossKo,
    es: menu.glossEs,
    fr: menu.glossFr,
    ar: menu.glossAr,
    zh: menu.glossZh,
    ja: menu.glossJa,
  }) ?? '';
}

/**
 * The ingredient chips, one per value, in order.
 *
 * A value with no label comes back as its own id rather than being dropped:
 * dropping it would render a shorter list than the dish declares, which is
 * the silence-reads-as-safety failure one level down. The raw id is ugly and
 * honest, and catalogComplete.test.mjs fails the build before it ships.
 */
export function ingredientLabels(contains, locale) {
  return (contains ?? []).map(c => {
    const t = CONTAINS_LABEL[c];
    return t ? pick(locale, t) : String(c);
  });
}

// How a list of ingredients is joined when it is read as one line. Arabic
// and the CJK languages have their own list comma.
const LIST_SEP = { [LOCALE.AR]: '، ', [LOCALE.ZH]: '、', [LOCALE.JA]: '、' };
const joinList = (items, locale) => items.join(LIST_SEP[locale] ?? ', ');

/**
 * The one line under "what happens at the table".
 *
 * Three cases, decided by the data and never by the screen:
 *
 *   list      — the dish is normally made of these
 *   house     — the list is empty and `varies` is true: what goes in is the
 *               house's call. A fact about the dish, in the dish's voice.
 *   unlisted  — the list is empty and `varies` is false: nobody has written
 *               this one up. A fact about the catalogue, and one the
 *               catalogue tests keep at zero dishes, so it should never be
 *               seen. It is kept distinct rather than merged into `house`
 *               because "the house decides" is a claim, and a dish nobody
 *               checked must not make it.
 *
 * Until 2026-09-02 the empty case said only "the catalogue does not
 * enumerate what goes into this one" — the app talking about itself to a
 * traveller who wanted to know about the food.
 */
export function containsLine(menu, locale) {
  const list = menu?.contains ?? [];
  if (list.length > 0) {
    const items = joinList(ingredientLabels(list, locale), locale);
    return {
      kind: 'list',
      text: pick(locale, {
        en: `Contains ${items}`,
        ko: `${items} 들어감`,
        es: `Contiene ${items}`,
        fr: `Contient ${items}`,
        ar: `يحتوي على ${items}`,
        zh: `含有${items}`,
        ja: `${items}が入っています`,
      }),
    };
  }
  if (menu?.varies) {
    return {
      kind: 'house',
      text: pick(locale, {
        en: "What goes in is the house's call, on the day.",
        ko: '무엇이 들어가는지는 그 집이 그날 정합니다.',
        es: 'Lo que lleva lo decide la casa, ese día.',
        fr: "Ce qu'il contient, c'est la maison qui le décide, le jour même.",
        ar: 'ما يدخل فيه يقرّره المحل في ذلك اليوم.',
        zh: '里面放什么，由那家店当天决定。',
        ja: '何が入るかは、その店がその日に決めます。',
      }),
    };
  }
  return {
    kind: 'unlisted',
    text: pick(locale, {
      en: 'The catalogue does not enumerate what goes into this one.',
      ko: '이 요리에 무엇이 들어가는지는 카탈로그에 적혀 있지 않습니다.',
      es: 'El catálogo no detalla qué lleva este plato.',
      fr: "Le catalogue ne détaille pas ce qu'il y a dedans.",
      ar: 'لا يعدّد الفهرس ما يدخل في هذا الطبق.',
      zh: '这道菜里有什么，目录里没有列。',
      ja: 'この料理に何が入るかは、カタログに書かれていません。',
    }),
  };
}

/**
 * The caveat a dish with `varies` shows under "at the table".
 *
 * It used to say the side dishes change by the house and the day, which was
 * right for 백반 and wrong for 전골 — where it is the pot itself, not what
 * comes beside it, that differs. The definition settled on 2026-09-02 covers
 * both: what comes with the dish, or what the dish is, is the house's
 * decision rather than a recipe's, and cannot be checked in advance.
 */
export function variesLine(locale) {
  return pick(locale, {
    en: 'What comes with this — or what it turns out to be — is decided by the house, not by a recipe, so it cannot be checked in advance. Ask before you sit down.',
    ko: '무엇이 함께 나오는지, 또는 무엇으로 나오는지는 레시피가 아니라 그 집이 정합니다. 미리 확인할 수가 없어요. 앉기 전에 물어보세요.',
    es: 'Lo que acompaña a esto —o en qué acaba consistiendo— lo decide la casa, no una receta, así que no se puede comprobar de antemano. Pregunta antes de sentarte.',
    fr: "Ce qui l'accompagne — ou ce que c'est au bout du compte — dépend de la maison, pas d'une recette, et ne peut donc pas être vérifié à l'avance. Demandez avant de vous asseoir.",
    ar: 'ما يأتي مع هذا — أو ما يكون عليه في النهاية — يقرّره المحل لا الوصفة، فلا يمكن التحقّق منه مسبقًا. اسأل قبل أن تجلس.',
    zh: '这道菜配什么——或者它到底是什么——由店家而不是菜谱决定，所以没法提前确认。坐下之前先问一句。',
    ja: 'これに何がつくか——あるいはこれが何になるか——は、レシピではなくその店が決めます。前もって確かめることはできません。座る前に尋ねてください。',
  });
}

/**
 * "You said you do not eat X" — the conflict sentence on the open-a-table
 * form, with X in the reader's language. The ids come from conflictsFor();
 * this only puts words to them.
 */
export function conflictLine(conflicts, locale) {
  const items = joinList(ingredientLabels(conflicts, locale), locale);
  return pick(locale, {
    en: `You said you do not eat ${items} — you can still host this, you just will not be eating all of it.`,
    ko: `${items}은(는) 안 드신다고 하셨죠 — 그래도 이 상을 차리실 수 있고, 다만 전부를 드시지는 못합니다.`,
    es: `Dijiste que no comes ${items}: puedes ser anfitrión igualmente, solo que no comerás todo.`,
    fr: `Vous avez dit ne pas manger ${items} — vous pouvez quand même recevoir, vous n'en mangerez simplement pas tout.`,
    ar: `قلت إنك لا تأكل ${items} — ما زال بإمكانك استضافة هذه المائدة، لكنك لن تأكل كلّ ما فيها.`,
    zh: `你说过你不吃${items}——你还是可以摆这张桌子，只是不会全都吃。`,
    ja: `${items}は食べないとおっしゃっていました——それでもこの食卓は開けます。ただ、全部は召し上がらないというだけです。`,
  });
}
