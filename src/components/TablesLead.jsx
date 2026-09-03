import React, { useEffect, useState } from 'react';
import { menuById } from '../domain/catalog/menus.js';
import { seatsRemaining, isPast, canJoin } from '../domain/policy/table.js';
import { listTables, listAllSignups, seedSampleTables } from '../data/tableRepository.js';
import { ChevronRightIcon } from './Icons';
import { bookable } from '../domain/policy/cancellation.js';
import { useText } from './localeText.js';

// Open tables, on the Explore screen.
//
// Explore could describe seven cultures without ever mentioning that the app
// can seat you at a table — the one thing it exists to do lived behind a tab
// nobody had a reason to press. A discovery screen that never names the core
// action is not discovery, it is a brochure.
//
// It sits directly under the cover because of what each answers: the cover
// says what is interesting today, this says what you can actually do this
// week, and the cultures below say what else there is. A concrete invitation
// outranks browsing.

const dayLabel = (date) => {
  const d = new Date(`${date}T00:00`);
  if (!Number.isFinite(d.getTime())) return date;
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
};

export default function TablesLead({ onOpenTables, onOpenTable, onCreateTable, onRequestTable, profile }) {
  const say = useText();
  const [tables, setTables] = useState(null);
  const [signups, setSignups] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      await seedSampleTables();
      const [t, s] = await Promise.all([listTables(), listAllSignups()]);
      if (alive) { setTables(bookable(t)); setSignups(s); }
    })();
    return () => { alive = false; };
  }, []);

  if (tables === null) return null;

  // Only tables *this reader* could still join, which is a different question
  // from whether a seat exists. The heading promises tables you could join and
  // the card counts seats left, so listing one you already have a seat at
  // invites somebody to something they have already done — and the detail
  // screen then correctly tells them they are going. The policy has always
  // known the difference; this section was the one place not asking it.
  const joinable = tables.filter(t =>
    canJoin(t, signups.filter(s => s.tableId === t.id), profile?.userId));
  const open = joinable.slice(0, 3);

  // A table that exists but is closed to this reader is not "nobody has set a
  // table" — that would call the host's dinner nothing on the screen of the
  // guest who is going to it.
  const anyUpcoming = tables.some(t => !isPast(t));

  return (
    <section className="tables-lead" aria-label={say('Open tables', '열린 밥상', 'Mesas abiertas', 'Tables ouvertes', 'موائد مفتوحة', '开着的饭桌', '開いている食卓')}>
      <div className="tables-lead__head">
        <div>
          {/* The 밥친구 label above this heading is gone: the wordmark is in
              the app chrome now, four lines up the screen, and printing the
              product's own name twice in one viewport is the section
              introducing an app the reader is already inside. */}
          {/* Every other tab opens with a Korean word over its English
              sentence — 밥친구, 여권 — and Explore was the one screen that
              did not. The Korean is a label rather than a translation, which
              is the same thing 밥친구 and 여권 are: it names the section, and
              the sentence under it does the explaining. */}
          <span className="tables-lead__kr" translate="no">이번 주 밥상</span>
          {/* Written twice rather than once. These sentences were English
              only, so a Korean-only interface kept the label above them and
              lost everything that said what was actually going on this week
              — which is the whole section. */}
          <h2 className="tables-lead__title l-ko-only" translate="no">
            {open.length > 0
              ? '이번 주에 앉을 수 있는 밥상'
              : anyUpcoming
                ? '열려 있는 밥상에는 이미 다 들어가 계세요'
                : '아직 아무도 밥상을 차리지 않았어요'}
          </h2>
          <h2 className="tables-lead__title tables-lead__title-en">
            {open.length > 0
              ? say('Tables you could join this week', null, 'Mesas a las que podrías unirte esta semana', 'Des tables où vous pourriez vous asseoir cette semaine', 'موائد تستطيع الجلوس إليها هذا الأسبوع', '这周你可以坐进去的饭桌', '今週あなたが座れる食卓')
              : anyUpcoming
                ? say('You are in every table that is open', null, 'Ya estás en todas las mesas abiertas', 'Vous êtes déjà à toutes les tables ouvertes', 'أنت بالفعل على كل مائدة مفتوحة', '开着的饭桌你都已经在里面了', '開いている食卓には、もう全部入っています')
                : say('Nobody has set a table yet', null, 'Todavía nadie ha puesto una mesa', "Personne n'a encore dressé de table", 'لم يمدّ أحد مائدة بعد', '还没有人摆过饭桌', 'まだ誰も食卓を整えていません')}
          </h2>
        </div>
        <button className="tables-lead__all" onClick={onOpenTables}>
          <span className="l-ko-only" translate="no">전체</span>
          <span className="tables-lead__all-en">{say('All', null, 'Todas', 'Toutes', 'الكل', '全部', 'すべて')}</span>
          <ChevronRightIcon size={13} />
        </button>
      </div>

      {open.length === 0 ? (
        /* Was a single dashed button whose only affordance was the box
           itself: a sentence, no verb to press, and the one thing a reader
           can actually do here — open the first table — was not offered.
           An empty week in a pilot is the strongest host-recruiting surface
           the app has, so it now asks directly. */
        <div className="tables-lead__empty">
          {/* Three layers, and until 2026-09-03 the middle one said what the
              other two had already said.

              The heading above states the fact — 아직 아무도 밥상을 차리지
              않았어요 / Nobody has set a table yet, in all seven. The two
              buttons below offer the two verbs. So the only thing left for
              this line is the invitation, and in the nobody-yet case that is
              the whole of it: you are first.

              What was here instead: Korean opened by repeating its own
              heading almost word for word (밥상을 차리지 않았어요 above,
              상을 차리지 않았어요 here), and every other language opened
              with "삼겹살은 2인분부터" — the fact the hero blob already
              carries as a tag — then closed with "open a table and see who
              comes", which is the second button, spelled out. Nobody read a
              new word in either language.

              Kept from Korean rather than cut to nothing, because Korean was
              the one carrying something the rest of the screen does not: an
              invitation. The other six now say that instead of the two things
              they were repeating. */}
          <span className="l-ko-only" translate="no">
            {anyUpcoming
              ? '이번 주에 더 청할 밥상은 없어요. 직접 상을 차리고 누가 오는지 보세요.'
              : '그러니 첫 번째는 당신입니다.'}
          </span>
          <span className="tables-lead__empty-en">
            {anyUpcoming
              ? say('Nothing else to ask for this week. Open a table of your own and see who comes.', null,
                'Nada más que pedir esta semana. Abre una mesa tuya y mira quién viene.',
                "Rien d'autre à demander cette semaine. Ouvrez votre propre table et voyez qui vient.", 'لا شيء آخر تطلبه هذا الأسبوع. افتح مائدتك أنت وانظر من يأتي.', '这周没有别的可以申请了。自己开一张，看看谁来。', '今週これ以上リクエストできるものはありません。自分の食卓を開いて、誰が来るか見てみてください。')
              : say('So the first one is yours.', null,
                'Así que la primera es tuya.',
                'La première sera donc la vôtre.', 'فلتكن الأولى لك.', '那么，第一张就是你的。', 'だから、最初のひとつはあなたのものです。')}
          </span>
          {/* The order here is the whole point. A tester who had been in
              Korea for one day wrote that "open a table yourself" asks the
              person with the least information in the room to pick a dish, a
              restaurant, a neighbourhood and a time and hope strangers come.
              Saying what you want is the thing a newcomer can actually do,
              and the request flow already existed — it was just never
              offered here. Hosting stays, one step quieter. */}
          <span className="tables-lead__empty-acts">
            <button className="tables-lead__empty-cta" translate="no" onClick={onRequestTable ?? onOpenTables}>
              {say('Tell us what you want to eat', '먹고 싶은 걸 말해주세요', 'Dinos qué te apetece comer', 'Dites-nous ce que vous voulez manger', 'قل لنا ماذا تريد أن تأكل', '告诉我们你想吃什么', '食べたいものを教えてください')}
            </button>
            <button className="tables-lead__empty-alt" translate="no" onClick={onCreateTable ?? onOpenTables}>
              {say('Or open a table yourself', '직접 상 차리기', 'O abre una mesa tú', 'Ou ouvrez une table vous-même', 'أو افتح مائدة بنفسك', '或者自己开一张', '自分で食卓を開く')}
            </button>
          </span>
        </div>
      ) : (
        <div className="tables-lead__row">
          {open.map(t => {
            const menu = menuById(t.menuId);
            if (!menu) return null;
            const left = seatsRemaining(t, signups.filter(s => s.tableId === t.id));
            return (
              /* Opens this table, not the list. A card that names a dish, a
                 night and a seat count is a specific invitation, and sending
                 it to a directory instead was the app quietly refusing the
                 thing it had just offered. */
              <button
                key={t.id}
                className="lead-table"
                onClick={() => (onOpenTable ? onOpenTable(t.id) : onOpenTables())}
              >
                <span className="lead-table__kr" aria-hidden="true">{menu.nameKo}</span>
                <span className="lead-table__dish">{menu.name}</span>
                <span className="lead-table__rom" translate="no" data-no-locale>{menu.romanization}</span>
                <span className="lead-table__when">{dayLabel(t.date)} · {t.time}</span>
                <span className="lead-table__seats">
                  {say(`${left} seat${left === 1 ? '' : 's'} left`, `${left}자리 남음`,
                    `${left} sitio${left === 1 ? '' : 's'} libre${left === 1 ? '' : 's'}`,
                    `${left} place${left === 1 ? '' : 's'} libre${left === 1 ? '' : 's'}`,
                    `بقي ${left} مقعد`, `还剩 ${left} 个位子`, `残り${left}席`)}
                  {/* The table list has said `sample` since the day these were
                      seeded; this screen never did, which meant the first
                      three tables anybody ever saw were invented and unlabelled
                      on the highest-traffic screen in the app. */}
                  {t.isSample && <span className="lead-table__sample">{say('sample', '샘플', 'ejemplo', 'exemple', 'مثال', '示例', 'サンプル')}</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
