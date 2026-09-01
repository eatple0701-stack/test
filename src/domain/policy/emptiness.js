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
  GROUP: 'group',     // a chosen group (🔥 K-BBQ …) has nothing
  NONE: 'none',       // the app itself has no upcoming table
};

/**
 * Why is `shown` empty, or null when it is not.
 *
 * `open` is every upcoming table this reader could see before the filters —
 * the difference between "your filter hid everything" and "there is nothing".
 *
 * A bare week is checked FIRST, and that is a correction. This used to lead
 * with the filters, on the reasoning that a filter is the thing the reader can
 * undo and so the more useful answer. The reasoning does not survive the case
 * where there is nothing to undo it onto: with no upcoming tables at all, no
 * filter is hiding anything, and saying "nobody has said yet" blames a chip
 * for an empty week. Found live on 2026-09-01 — the pilot week had no tables,
 * turning on 여성 동석 replaced the true sentence with a false one, and there
 * was a test pinning the false one in place.
 *
 * Ordered most specific first after that, among explanations that are all
 * actually true.
 */
export function emptyReason({ open = [], shown = [], menuFilter = null, groupFilter = null, womenFilter = false, dayFilter = null } = {}) {
  if (shown.length > 0) return null;
  // Nothing the reader chose is hiding anything: the week is genuinely bare.
  if (open.length === 0) return EMPTY.NONE;
  if (womenFilter) return EMPTY.GENDER;
  if (dayFilter) return EMPTY.DAY;
  // A dish is narrower than its group, so it is the better explanation when
  // both are set — it is also the one undone first.
  if (menuFilter) return EMPTY.DISH;
  if (groupFilter) return EMPTY.GROUP;
  return EMPTY.DISH;
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
  const pick = (en, korean, spanish, french, arabic, chinese, japanese) => {
    if (locale === 'ko') return korean;
    if (locale === 'es' && spanish) return spanish;
    if (locale === 'fr' && french) return french;
    if (locale === 'ar' && arabic) return arabic;
    if (locale === 'zh' && chinese) return chinese;
    if (locale === 'ja' && japanese) return japanese;
    return en;
  };
  switch (reason) {
    case EMPTY.GENDER:
      return {
        title: pick('No woman is hosting this week.', '이번 주엔 여성 호스트가 없어요.', 'Esta semana no recibe ninguna mujer.', "Aucune femme ne reçoit cette semaine.", 'لا تستضيف أي امرأة هذا الأسبوع.', '这周没有女性主人。', '今週は女性のホストがいません。'),
        body: pick(
          'This filter looks at who is hosting, not at who has joined — so a woman may already be going to one of the other tables. Gender is also new here, and a host who has not filled it in will not show up.',
          '이 필터는 호스트만 봅니다. 참석자는 보지 않으니, 다른 밥상에 이미 여성이 가고 있을 수 있어요. 성별 표시도 이제 막 생긴 기능이라, 아직 적지 않은 호스트는 여기 안 나옵니다.',
          'Este filtro mira quién recibe, no quién se ha apuntado: puede que ya vaya una mujer a otra mesa. El género también es nuevo aquí, y una anfitriona que no lo haya indicado no aparecerá.',
          "Ce filtre regarde qui reçoit, pas qui s'est inscrit : une femme va peut-être déjà à une autre table. Le genre est aussi nouveau ici, et une hôtesse qui ne l'a pas renseigné n'apparaîtra pas.",
          'يَنظر هذا المرشِّح إلى من يستضيف لا إلى من سجّل، فقد تكون امرأة ذاهبة بالفعل إلى مائدة أخرى. والجنس جديد هنا أيضًا، ومن لم تذكره من المضيفات لن تظهر.',
          '这个筛选只看谁是主人，不看谁报了名 — 别的饭桌上可能已经有女生要去了。性别在这里也是新加的，没填的主人不会出现。',
          'この絞り込みが見るのはホストだけで、参加者は見ません。ほかの食卓にはすでに女性が行っているかもしれません。性別もここでは新しい項目なので、書いていないホストは出てきません。',
        ),
      };
    case EMPTY.DAY:
      return {
        title: pick('Nothing on that day yet.', '그날은 아직 아무것도 없어요.', 'Ese día todavía no hay nada.', "Rien ce jour-là pour l'instant.", 'لا شيء في ذلك اليوم بعد.', '那天目前还什么都没有。', 'その日はまだ何もありません。'),
        body: otherDays
          ? pick(
            'Other days have tables — or open one and own the evening.',
            '다른 날에는 밥상이 있어요. 아니면 직접 하나 열어서 그 저녁을 가져가셔도 됩니다.',
            'Otros días sí tienen mesas — o abre una tú y quédate con la noche.',
            "D'autres jours ont des tables — ou ouvrez-en une et prenez la soirée.",
            'في أيام أخرى موائد — أو افتح واحدة وخذ الأمسية لنفسك.',
            '别的日子有饭桌——或者自己开一张，把那个晚上拿下来。',
            'ほかの日には食卓があります——あるいは自分で一つ開いて、その夜を自分のものにしてください。',
          )
          : pick(
            'No day this week has one yet. Open a table and this is the day it happens.',
            '이번 주에는 아직 어느 날에도 없습니다. 상을 차리시면 그날이 바로 이날이 됩니다.',
            'Ningún día de esta semana tiene una todavía. Abre una mesa y ese será el día.',
            "Aucun jour de cette semaine n'en a encore. Ouvrez une table et ce sera ce jour-là.",
            'لا يوم من هذا الأسبوع فيه واحدة بعد. افتح مائدة فيكون هذا هو اليوم.',
            '这周还没有哪一天有。开一张饭桌，那天就是这一天。',
            '今週はまだどの日にもありません。食卓を開けば、その日がこの日になります。',
          ),
      };
    case EMPTY.DISH:
      return {
        title: pick('No table for this dish yet.', '이 요리로 열린 밥상이 아직 없어요.', 'Aún no hay mesa para este plato.', 'Pas encore de table pour ce plat.', 'لا مائدة لهذا الطبق بعد.', '这道菜还没有饭桌。', 'この料理の食卓はまだありません。'),
        body: pick(
          'Open it yourself and the seats are yours to fill.',
          '직접 열면 그 자리는 원하는 사람들로 채우실 수 있습니다.',
          'Ábrela tú y los sitios son tuyos para llenarlos.',
          'Ouvrez-la vous-même et les places sont à vous pour les remplir.',
          'افتحها بنفسك وتكون المقاعد لك تملؤها كما تشاء.',
          '自己开一张，位子就归你来坐满。',
          '自分で開けば、席は自分で埋めていくものになります。',
        ),
      };
    case EMPTY.GROUP:
      // The reader arrived through one of the six front-page categories and
      // the week holds nothing in it. Same answer as the dish case: the
      // first table in a category is somebody's to open.
      return {
        title: pick('No table in this category yet.', '이 카테고리로 열린 밥상이 아직 없어요.', 'Aún no hay mesa en esta categoría.', 'Pas encore de table dans cette catégorie.', 'لا مائدة في هذه الفئة بعد.', '这一类还没有饭桌。', 'このカテゴリーの食卓はまだありません。'),
        body: pick(
          'Open the first one and the seats are yours to fill.',
          '첫 상을 직접 차리시면 그 자리는 원하는 사람들로 채우실 수 있습니다.',
          'Abre tú la primera y los sitios son tuyos para llenarlos.',
          'Ouvrez la première et les places sont à vous pour les remplir.',
          'افتح الأولى بنفسك وتكون المقاعد لك تملؤها كما تشاء.',
          '自己开第一张，位子就归你来坐满。',
          '最初の一つを自分で開けば、席は自分で埋めていくものになります。',
        ),
      };
    case EMPTY.NONE:
      // The honest sentence for a week with nothing in it. It does not
      // apologise and it does not pretend a filter is in the way — and it
      // does not push an account, because everything named here is free to
      // read without one. See AccessPolicy: browsing was always open.
      return {
        title: pick('No tables open this week.', '이번 주에 열린 밥상이 없어요.', 'Esta semana no hay mesas abiertas.', "Aucune table ouverte cette semaine.", 'لا موائد مفتوحة هذا الأسبوع.', '这周没有开着的饭桌。', '今週は開いている食卓がありません。'),
        body: pick(
          'Nobody has set one yet — so the first is yours to set. The dishes, the phrases for the table and the places are all here to read meanwhile.',
          '아직 아무도 차리지 않았습니다 — 그러니 첫 상은 당신 몫이에요. 그동안 요리와, 식탁에서 쓰는 말과, 장소는 전부 여기서 읽어보실 수 있습니다.',
          'Todavía no la ha puesto nadie, así que la primera es tuya. Mientras tanto, los platos, las frases para la mesa y los sitios están aquí para leerlos.',
          "Personne ne l'a encore dressée — la première est donc à vous. En attendant, les plats, les phrases pour la table et les adresses sont là, à lire.",
          'لم يمدّها أحد بعد — فالأولى لك إذن. وفي هذه الأثناء، الأطباق وعبارات المائدة والأماكن كلّها هنا لتقرأها.',
          '还没有人摆过——所以第一张归你摆。在那之前，菜、桌上要说的话、地点，都在这儿等着看。',
          'まだ誰も整えていません——だから最初の一つはあなたのものです。そのあいだ、料理も、食卓で使う言葉も、場所も、ここで読めます。',
        ),
      };
    default:
      return null;
  }
}
