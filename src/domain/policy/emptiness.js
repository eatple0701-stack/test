// Why the list is empty — which is a different question each time.
//
// An empty screen is the one a new product spends most of its life showing,
// and on 2026-08-04 this app became a live example: twelve seeded demo tables
// were deleted and exactly one real table was left. The day after it passes,
// the Tables tab is empty for everybody.
//
// The screen had three empty states and they were nearly right. Two things
// were wrong, both of the same kind — a sentence asserting something nobody
// had checked:
//
//   1. "No table for this one yet." — the fall-through case, shown whenever
//      nothing matched and no day or gender filter was on. "This one" means a
//      dish, and it read correctly while a dish filter was the only way to get
//      there. With no tables at all the dish filter does not even render
//      (TablesTab only offers chips for dishes somebody is eating), so a first
//      visitor to an empty app read a sentence about a dish they never chose.
//
//   2. "Other days have tables" — printed under a day with nothing on it.
//      True while the week held something. On an empty week it is the app
//      telling somebody to go look at days it knows are also empty.
//
// So the reason is derived rather than assumed, the same way tableKind is.
// The copy lives with it because the wording *is* the judgement here: what
// separates these cases is only what you are honestly allowed to say.

export const EMPTY = {
  GENDER: 'gender',   // the 여성 동석 filter emptied it
  DAY: 'day',         // a chosen day has nothing
  DISH: 'dish',       // a chosen dish has nothing
  NONE: 'none',       // the app itself has no upcoming table
};

/**
 * Why is `shown` empty, or null when it is not.
 *
 * `open` is every upcoming table this reader could see before the filters —
 * the difference between "your filter hid everything" and "there is nothing".
 * Ordered most specific first: a filter the reader set is a better
 * explanation than the state of the whole app, because it is the one they can
 * undo.
 */
export function emptyReason({ open = [], shown = [], menuFilter = null, womenFilter = false, dayFilter = null } = {}) {
  if (shown.length > 0) return null;
  if (womenFilter) return EMPTY.GENDER;
  if (dayFilter) return EMPTY.DAY;
  if (menuFilter) return EMPTY.DISH;
  // Nothing the reader chose is hiding anything: the week is genuinely bare.
  return open.length === 0 ? EMPTY.NONE : EMPTY.DISH;
}

/** Are there tables on days other than the one being looked at? */
export const hasOtherDays = (open = [], dayFilter = null) =>
  open.some(t => t.date !== dayFilter);

/**
 * What an empty screen may say.
 *
 * `otherDays` is passed in rather than assumed so the day case can stop
 * promising tables elsewhere when there are none. Every string here is
 * something the caller has actually established.
 *
 * `locale` is here for the same reason it is on reasonFor: these sentences
 * are chosen by the policy, not handed to the component as finished text, so
 * there is nothing for a caller to translate after the fact. Korean is
 * returned only when Korean is asked for.
 */
export function emptyText(reason, { otherDays = false, locale = 'both' } = {}) {
  const pick = (en, korean, spanish, french, arabic, chinese) => {
    if (locale === 'ko') return korean;
    if (locale === 'es' && spanish) return spanish;
    if (locale === 'fr' && french) return french;
    if (locale === 'ar' && arabic) return arabic;
    if (locale === 'zh' && chinese) return chinese;
    return en;
  };
  switch (reason) {
    case EMPTY.GENDER:
      return {
        title: pick('Nobody has said yet.', '아직 아무도 밝히지 않았어요.', 'Todavía no lo ha indicado nadie.', "Personne ne l'a encore indiqué.", 'لم يذكره أحد بعد.', '还没有人说过。'),
        body: pick(
          'Gender is new here — no host or guest has declared one yet. That is not the same as no table like this existing.',
          '성별 표시는 이제 막 생긴 기능이라, 호스트도 참석자도 아직 아무도 적지 않았습니다. 그런 밥상이 없다는 뜻은 아니에요.',
          'El género es nuevo aquí: ningún anfitrión ni invitado lo ha declarado todavía. Eso no significa que no exista una mesa así.',
          "Le genre est nouveau ici : aucun hôte ni invité ne l'a encore déclaré. Cela ne veut pas dire qu'une telle table n'existe pas.",
          'الجنس جديد هنا: لم يذكره بعد أي مضيف ولا ضيف. وهذا لا يعني أن مائدة كهذه غير موجودة.',
          '性别在这里是新加的，还没有哪位主人或客人填过。这不等于没有这样的饭桌。',
        ),
      };
    case EMPTY.DAY:
      return {
        title: pick('Nothing on that day yet.', '그날은 아직 아무것도 없어요.', 'Ese día todavía no hay nada.', "Rien ce jour-là pour l'instant.", 'لا شيء في ذلك اليوم بعد.', '那天目前还什么都没有。'),
        body: otherDays
          ? pick(
            'Other days have tables — or open one and own the evening.',
            '다른 날에는 밥상이 있어요. 아니면 직접 하나 열어서 그 저녁을 가져가셔도 됩니다.',
            'Otros días sí tienen mesas — o abre una tú y quédate con la noche.',
            "D'autres jours ont des tables — ou ouvrez-en une et prenez la soirée.",
            'في أيام أخرى موائد — أو افتح واحدة وخذ الأمسية لنفسك.',
            '别的日子有饭桌——或者自己开一张，把那个晚上拿下来。',
          )
          : pick(
            'No day this week has one yet. Open a table and this is the day it happens.',
            '이번 주에는 아직 어느 날에도 없습니다. 상을 차리시면 그날이 바로 이날이 됩니다.',
            'Ningún día de esta semana tiene una todavía. Abre una mesa y ese será el día.',
            "Aucun jour de cette semaine n'en a encore. Ouvrez une table et ce sera ce jour-là.",
            'لا يوم من هذا الأسبوع فيه واحدة بعد. افتح مائدة فيكون هذا هو اليوم.',
            '这周还没有哪一天有。开一张饭桌，那天就是这一天。',
          ),
      };
    case EMPTY.DISH:
      return {
        title: pick('No table for this dish yet.', '이 요리로 열린 밥상이 아직 없어요.', 'Aún no hay mesa para este plato.', 'Pas encore de table pour ce plat.', 'لا مائدة لهذا الطبق بعد.', '这道菜还没有饭桌。'),
        body: pick(
          'Open it yourself and the seats are yours to fill.',
          '직접 열면 그 자리는 원하는 사람들로 채우실 수 있습니다.',
          'Ábrela tú y los sitios son tuyos para llenarlos.',
          'Ouvrez-la vous-même et les places sont à vous pour les remplir.',
          'افتحها بنفسك وتكون المقاعد لك تملؤها كما تشاء.',
          '自己开一张，位子就归你来坐满。',
        ),
      };
    case EMPTY.NONE:
      // The honest sentence for a week with nothing in it. It does not
      // apologise and it does not pretend a filter is in the way — and it
      // does not push an account, because everything named here is free to
      // read without one. See AccessPolicy: browsing was always open.
      return {
        title: pick('No tables open this week.', '이번 주에 열린 밥상이 없어요.', 'Esta semana no hay mesas abiertas.', "Aucune table ouverte cette semaine.", 'لا موائد مفتوحة هذا الأسبوع.', '这周没有开着的饭桌。'),
        body: pick(
          'Nobody has set one yet — so the first is yours to set. The dishes, the phrases for the table and the places are all here to read meanwhile.',
          '아직 아무도 차리지 않았습니다 — 그러니 첫 상은 당신 몫이에요. 그동안 요리와, 식탁에서 쓰는 말과, 장소는 전부 여기서 읽어보실 수 있습니다.',
          'Todavía no la ha puesto nadie, así que la primera es tuya. Mientras tanto, los platos, las frases para la mesa y los sitios están aquí para leerlos.',
          "Personne ne l'a encore dressée — la première est donc à vous. En attendant, les plats, les phrases pour la table et les adresses sont là, à lire.",
          'لم يمدّها أحد بعد — فالأولى لك إذن. وفي هذه الأثناء، الأطباق وعبارات المائدة والأماكن كلّها هنا لتقرأها.',
          '还没有人摆过——所以第一张归你摆。在那之前，菜、桌上要说的话、地点，都在这儿等着看。',
        ),
      };
    default:
      return null;
  }
}
