import React, { useEffect, useMemo, useRef, useState } from 'react';
import { menus, menuById } from '../domain/catalog/menus.js';
import {
  matchRequest, requestAsTable, isEmptyRequest, shouldOfferToHost, MATCH,
} from '../domain/policy/matching.js';
import { seatsRemaining } from '../domain/policy/table.js';
import { listTables, listAllSignups, listBlocks } from '../data/tableRepository.js';
import { visibleTables } from '../domain/policy/blocking.js';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';
import { bookable } from '../domain/policy/cancellation.js';
import { useText } from './localeText.js';

// Asking for a meal that may not exist.
//
// Everything else in this tab answers "what is open". This answers "what do
// you want", which is the only question that still works on a week with three
// tables in it — and 17 August is that week.
//
// The empty result is the important screen, not the failure case. In this
// product the person who wants 곱창 on Saturday is exactly the person who can
// open 곱창 on Saturday, so a want that matches nothing is handed straight to
// the create form with everything they just said already filled in.

const dayLabel = (date) => {
  const d = new Date(`${date}T00:00`);
  if (!Number.isFinite(d.getTime())) return date;
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
};

const iso = (offsetDays) =>
  new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);

export default function TableRequest({ profile, onBack, onOpenTable, onOpenAsHost }) {
  const say = useText();
  const [menuId, setMenuId] = useState(null);
  const [from, setFrom] = useState(iso(0));
  const [to, setTo] = useState(iso(7));
  const [place, setPlace] = useState('');
  const [tables, setTables] = useState(null);
  const [signups, setSignups] = useState([]);
  const [asked, setAsked] = useState(0);
  const resultsRef = useRef(null);

  // The answer lands below the fold of a screen four dish-rows tall, so
  // pressing the button looked like it did nothing: measured, the results
  // heading appeared at 716px in an 812px viewport with one of nine rows on
  // screen. Counting the presses rather than flipping a flag is what makes a
  // second search scroll too — and the effect, rather than the click handler,
  // is what makes it fire after the rows exist to scroll to.
  useEffect(() => {
    if (asked === 0) return;
    resultsRef.current?.scrollIntoView({ block: 'start' });
  }, [asked]);

  useEffect(() => {
    let alive = true;
    (async () => {
      // Same rule as Tables (src/components/TablesTab.jsx): a want should
      // never be answered by matching it to a table this traveller has
      // already said they do not want to sit at — and listBlocks() is caught
      // on its own for the same reason it is there: a project whose schema
      // has not caught up yet must not turn matching off entirely.
      const [t, s] = await Promise.all([listTables(), listAllSignups()]);
      const b = await listBlocks().catch(() => []);
      if (alive) { setTables(visibleTables(bookable(t), b.map(x => x.blockedId))); setSignups(s); }
    })();
    return () => { alive = false; };
  }, []);

  const request = useMemo(
    () => ({ menuId, from, to, place, languages: profile?.languages ?? [] }),
    [menuId, from, to, place, profile],
  );

  const matches = useMemo(
    () => (tables === null ? [] : matchRequest(request, tables, signups, profile?.userId)),
    [request, tables, signups, profile],
  );

  const exact = matches.filter(m => m.kind === MATCH.EXACT);
  const near = matches.filter(m => m.kind !== MATCH.EXACT);
  const wanted = menuId ? menuById(menuId) : null;

  return (
    <section className="sheet-page" aria-label={say('Ask for a table', '밥상 요청하기', 'Pedir una mesa', 'Demander une table', 'اطلب مائدة', '申请一张饭桌', '食卓をリクエストする')}>
      <header className="sheet-page__head">
        <button className="sheet-page__back" onClick={onBack} aria-label={say('Back', '뒤로', 'Atrás', 'Retour', 'رجوع', '返回', '戻る')}>
          <ChevronLeftIcon size={20} />
        </button>
        <h1>{say('찾는 밥상 · What are you after?', '찾는 밥상', '¿Qué buscas?', 'Que cherchez-vous ?', 'عمّ تبحث؟', '你在找什么？', '何をお探しですか？')}</h1>
      </header>

      <div className="form-block">
        <h2 className="form-label">{say('What do you want to eat?', '무엇을 드시고 싶나요?', '¿Qué te apetece comer?', 'Que voulez-vous manger ?', 'ماذا تريد أن تأكل؟', '你想吃什么？', '何を食べたいですか？')}</h2>
        <div className="dish-grid">
          {/* First, and a real answer. "Anything" is what most people want on
              a first night, and a dish-first app is worst at exactly that. */}
          <button
            className={`dish-option${menuId === null ? ' is-on' : ''}`}
            onClick={() => setMenuId(null)}
          >
            <span className="dish-option__kr">아무거나</span>
            <span className="dish-option__name">{say('Anything', '아무거나', 'Lo que sea', "N'importe quoi", 'أيّ شيء', '都行', '何でも')}</span>
            <span className="dish-option__min">{say('Surprise me', '알아서 골라주세요', 'Sorpréndeme', 'Surprenez-moi', 'فاجئني', '给我个惊喜', 'おまかせ')}</span>
          </button>
          {menus.map(m => (
            <button
              key={m.id}
              className={`dish-option${menuId === m.id ? ' is-on' : ''}`}
              onClick={() => setMenuId(m.id)}
            >
              <span className="dish-option__kr">{m.nameKo}</span>
              <span className="dish-option__name">{m.name}</span>
              <span className="dish-option__gloss">{say(m.gloss, m.glossKo, m.glossEs, m.glossFr, m.glossAr, m.glossZh, m.glossJa)}</span>
              <span className="dish-option__min">
                {m.minPeople > 1
                  ? say(`${m.minPeople}+ people`, `${m.minPeople}명 이상`, `${m.minPeople}+ personas`,
                    `${m.minPeople}+ personnes`, `${m.minPeople} فأكثر`, `${m.minPeople} 人以上`, `${m.minPeople}人以上`)
                  : say('Any size', '인원 제한 없음', 'Cualquier número', 'Sans minimum', 'أيّ عدد', '几个人都行', '人数は自由')}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="form-block">
        <h2 className="form-label">{say('When are you free?', '언제 시간이 되나요?', '¿Cuándo tienes hueco?', 'Quand êtes-vous libre ?', 'متى تكون متفرّغًا؟', '你什么时候有空？', 'いつなら空いていますか？')}</h2>
        <div className="field-row">
          <label className="field">
            <span className="field__label">{say('From', '부터', 'Desde', 'À partir de', 'من', '从', 'から')}</span>
            <input type="date" value={from} min={iso(0)} onChange={e => setFrom(e.target.value)} />
          </label>
          <label className="field">
            <span className="field__label">{say('Until', '까지', 'Hasta', "Jusqu'à", 'حتى', '到', 'まで')}</span>
            <input type="date" value={to} min={from} onChange={e => setTo(e.target.value)} />
          </label>
        </div>
        <label className="field">
          <span className="field__label">{say('Where would suit you? (optional)', '어디가 좋으세요? (선택)', '¿Dónde te vendría bien? (opcional)', 'Où cela vous arrangerait ? (facultatif)', 'أين يناسبك؟ (اختياري)', '你方便在哪儿？（可选）', 'どのあたりが都合よいですか？（任意）')}</span>
          <input
            type="text"
            value={place}
            placeholder={say('Hongdae, or anywhere on line 2', '홍대, 또는 2호선 어디든', 'Hongdae, o cualquier sitio de la línea 2', "Hongdae, ou n'importe où sur la ligne 2", 'هونغداي، أو أي مكان على الخط 2', '弘大，或者2号线上任何地方', '弘大、または2号線のどこか')}
            onChange={e => setPlace(e.target.value)}
          />
        </label>
      </div>

      <div className="form-actions">
        <button
          className="form-submit"
          onClick={() => setAsked(n => n + 1)}
          disabled={tables === null || isEmptyRequest(request)}
        >
          {tables === null
            ? say('Looking…', '찾는 중…', 'Buscando…', 'Recherche…', 'جارٍ البحث…', '正在找…', '探しています…')
            : say('Find me a table', '찾아보기', 'Búscame una mesa', 'Trouvez-moi une table', 'ابحث لي عن مائدة', '帮我找一张饭桌', '食卓を探す')}
        </button>
      </div>

      {asked > 0 && (
        <div className="req-results" ref={resultsRef}>
          {exact.length > 0 && (
            <>
              <h2 className="req-results__head">
                {exact.length === 1
                  ? say('One table fits.', '맞는 밥상이 하나 있어요.', 'Encaja una mesa.', 'Une table correspond.', 'مائدة واحدة تناسب.', '有一张饭桌合适。', '合う食卓がひとつあります。')
                  : say(`${exact.length} tables fit.`, `맞는 밥상이 ${exact.length}개 있어요.`,
                    `Encajan ${exact.length} mesas.`, `${exact.length} tables correspondent.`,
                    `${exact.length} موائد تناسب.`, `有 ${exact.length} 张饭桌合适。`, `合う食卓が${exact.length}あります。`)}
              </h2>
              {exact.map(m => <Row key={m.table.id} m={m} signups={signups} onOpen={onOpenTable} />)}
            </>
          )}

          {exact.length === 0 && near.length > 0 && (
            <>
              <h2 className="req-results__head">{say('Nothing exactly, but these are close.', '딱 맞는 건 없지만, 이런 것들이 가깝습니다.', 'Nada exacto, pero estas se acercan.', "Rien d'exact, mais celles-ci s'en approchent.", 'لا شيء مطابق تمامًا، لكن هذه قريبة.', '没有完全对上的，但这几个接近。', 'ぴったりのものはありませんが、これらが近いです。')}</h2>
              {/* Offered rather than hidden: somebody who wanted 곱창 on
                  Saturday will often take 곱창 on Sunday, and dropping it
                  would show a blank screen beside a table they would have
                  said yes to. */}
              {near.map(m => <Row key={m.table.id} m={m} signups={signups} onOpen={onOpenTable} />)}
            </>
          )}

          {/* Whenever nothing *exactly* fits — not only when the screen is
              blank. Any table inside the chosen days counts as a near miss, so
              asking for 족발 on a night somebody happens to be eating 삼겹살
              was burying the offer this whole screen exists to make. The near
              misses stay on screen above it; they are alternatives, not an
              answer to what was asked for. */}
          {shouldOfferToHost(matches) && (
            <div className="req-none">
              <p className="req-none__title">
                {say(
                  `${near.length > 0 ? 'Still, nobody' : 'Nobody'} has set ${wanted ? wanted.name : 'a table'} for those days.`,
                  `${near.length > 0 ? '그래도 ' : ''}그 날짜에 ${wanted ? wanted.name : '밥상'}을(를) 차린 사람이 없어요.`,
                  `${near.length > 0 ? 'Aun así, nadie' : 'Nadie'} ha puesto ${wanted ? wanted.name : 'una mesa'} para esos días.`,
                  `${near.length > 0 ? "Pourtant, personne" : 'Personne'} n'a dressé ${wanted ? wanted.name : 'de table'} pour ces jours-là.`,
                  `${near.length > 0 ? 'ومع ذلك، لم يمدّ أحد' : 'لم يمدّ أحد'} ${wanted ? wanted.name : 'مائدة'} في تلك الأيام.`,
                  `那几天${near.length > 0 ? '还是' : ''}没有人摆${wanted ? wanted.name : '饭桌'}。`,
                  `その日に${wanted ? wanted.name : '食卓'}を用意した人は${near.length > 0 ? 'やはり' : ''}いません。`)}
              </p>
              {/* The point of this screen. Not an apology — the want is
                  already a table, it has just not been offered yet. */}
              <p className="req-none__body">
                {say('Which makes you the person who can. Everything you just said is carried over — pick a time and it is open.',
                  '그러니 열 수 있는 사람이 당신입니다. 방금 적으신 내용은 그대로 넘어가니, 시간만 고르시면 열립니다.',
                  'Lo que te convierte en quien puede. Todo lo que acabas de decir se traslada: elige una hora y queda abierta.', 'Ce qui fait de vous la personne qui peut. Tout ce que vous venez de dire est repris — choisissez une heure et elle est ouverte.', 'وهذا ما يجعلك أنت من يستطيع. كل ما قلته للتوّ يُنقل معك — اختر وقتًا وتصير مفتوحة.', '那能开的人就是你了。你刚才说的都会带过去——挑个时间，它就开着了。', 'つまり、開けるのはあなたです。いま書いたことはそのまま引き継がれます——時間を選べば、それで開きます。')}
              </p>
              <button
                className="form-submit"
                onClick={() => onOpenAsHost(requestAsTable(request))}
              >
                {say('상 차리기 · Open it myself', '상 차리기', 'Abrirla yo mismo', "L'ouvrir moi-même", 'أفتحها بنفسي', '我自己开一张', '自分で開く')}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Row({ m, signups, onOpen }) {
  const say = useText();
  const menu = menuById(m.table.menuId);
  if (!menu) return null;
  const left = seatsRemaining(m.table, signups.filter(s => s.tableId === m.table.id));
  return (
    <button className="req-row" onClick={() => onOpen(m.table.id)}>
      <span className="req-row__kr" aria-hidden="true">{menu.nameKo}</span>
      <span className="req-row__body">
        <span className="req-row__dish">{menu.name}</span>
        <span className="req-row__when">
          {dayLabel(m.table.date)} · {m.table.time} · {m.table.place}
        </span>
        {m.shared.length > 0 && (
          <span className="req-row__shared">{say(
            `You both have ${m.shared.join(' and ')}`, `둘 다 ${m.shared.join(', ')}`,
            `Ambos habláis ${m.shared.join(' y ')}`, `Vous parlez tous deux ${m.shared.join(' et ')}`,
            `كلاكما يتكلّم ${m.shared.join(' و')}`, `你们都会${m.shared.join('和')}`,
            `どちらも${m.shared.join('と')}が話せます`)}</span>
        )}
      </span>
      <span className="req-row__seats">
        {say(`${left} left`, `${left}자리 남음`, `quedan ${left}`, `${left} restante${left === 1 ? '' : 's'}`,
          `بقي ${left}`, `还剩 ${left}`, `残り${left}`)} <ChevronRightIcon size={13} />
      </span>
    </button>
  );
}
