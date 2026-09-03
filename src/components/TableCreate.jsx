import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  menuById, defaultHourFor, eatenAtLabels,
} from '../domain/catalog/menus.js';
import { PICK } from '../domain/policy/dishGroupPicker.js';
import { categoryLabel, containsLine, conflictLine } from '../domain/policy/dishLabels.js';
import { validateNewTable } from '../domain/policy/table.js';
import { MEETING_NOTE_MAX } from '../domain/policy/meeting.js';
import { GUIDES, TABLE_KIND_LABEL } from '../domain/catalog/hosts.js';
import { LANGUAGES, cleanLanguages, languageLabel } from '../domain/catalog/languages.js';
import { createTable } from '../data/tableRepository.js';
import { conflictsFor } from '../data/profile';
import DishGroupAccordion from './DishGroupAccordion';
import HostBrief from './HostBrief';
import PlacePicker from './PlacePicker';
import RulesConsent from './RulesConsent';
import { PURPOSE, AGREE_ACTION } from '../content/safety.js';
import { showsRulesGate, consentToRecord, rulesAgreement } from '../domain/policy/consent.js';
import { ChevronLeftIcon } from './Icons';
import { useText, useLocale } from './localeText.js';

// Opening a table.
//
// The dish is chosen first and everything else follows from it, because the
// dish is the thing being offered — a host is not booking a restaurant, they
// are saying "I am eating this, there is room". Choosing the dish first also
// lets the form tell you the minimum before you pick a number of seats
// instead of rejecting you afterwards.

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function TableCreate({ profile, onProfileChange, onAgree, onBack, onCreated, prefill }) {
  const say = useText();
  const locale = useLocale();
  // A request arriving from 찾는 밥상 already named the dish and the day.
  const [menuId, setMenuId] = useState(prefill?.menuId ?? null);
  const [date, setDate] = useState(prefill?.date ?? '');
  const [time, setTime] = useState(() => defaultHourFor(prefill?.menuId) ?? '19:00');
  // Whether the host has set the time themselves. Without this, an hour the
  // app moved for 감자탕 survived a switch to 백반 — a dish with no recorded
  // time inheriting one from the dish before it, which is the app treating
  // its own guess as somebody's decision.
  const [timeTouched, setTimeTouched] = useState(false);
  // "떡볶이가 먹고 싶다" on the host's side too. Local to the form: it
  // narrows what the picker shows and nothing that gets submitted.
  const [dishQuery, setDishQuery] = useState('');
  // Arriving from a restaurant fills in the two things that place already
  // knows. The dish is still asked, because a restaurant's category is not a
  // menu and guessing one would put the wrong word on somebody's table.
  const [place, setPlace] = useState(prefill?.place ?? '');
  const [restaurant, setRestaurant] = useState(prefill?.restaurant ?? '');
  const [seats, setSeats] = useState(
    () => Math.max(4, menuById(prefill?.menuId)?.minPeople ?? 0));
  const [note, setNote] = useState('');
  const [meetingNote, setMeetingNote] = useState('');
  // Optional 오픈채팅 link — the day-of channel the app deliberately does
  // not build itself. Validated by MeetingPolicy on the way to storage.
  const [chatUrl, setChatUrl] = useState('');
  // Where the host will stand, pointed at rather than geocoded from the
  // place text. Optional; a table without it stays in the list, off the map.
  // Prefilled when the host arrived from a venue page, which already knows
  // exactly where it is. Dropping them on an empty map to find a restaurant
  // the app has the coordinates for was the 8/4 report.
  const [point, setPoint] = useState(
    () => (prefill?.point ? { ...prefill.point } : { lat: null, lng: null }),
  );
  const [hostName, setHostName] = useState(profile?.name ?? '');
  const [guides, setGuides] = useState([]);
  // Their own profile answer, so the question is not asked twice.
  const [languages, setLanguages] = useState(
    () => cleanLanguages(prefill?.languages ?? profile?.languages));
  const [submitted, setSubmitted] = useState(false);
  // Bumped on every failed attempt, so the scroll-to-first-error effect runs
  // again when somebody presses the button twice without fixing anything.
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  // Passing the gate opens this form and nothing else. It is component
  // state on purpose: leaving unmounts the screen, the value goes with it,
  // and the gate is back next time. It reaches the profile only from
  // submit(), once the table exists.
  const [agreedHere, setAgreedHere] = useState(null);

  const menu = menuId ? menuById(menuId) : null;

  const problems = useMemo(() => {
    const list = validateNewTable({ menuId, date, time, place, seats }, menu);
    if (!hostName.trim()) list.push('Add the name your guests should call you.');
    return list;
  }, [menuId, date, time, place, seats, menu, hostName]);

  // Which fields are empty, so the form can mark them where they stand.
  //
  // The summary list at the foot of the form is kept — it says everything at
  // once — but on its own it made somebody read "Pick a date" at 3356px and
  // then hunt for the date field 2000px above it, unmarked. This covers the
  // required-and-empty cases, which are every problem a person actually hits;
  // the seat rules stay with validateNewTable, which owns them.
  const bad = useMemo(() => (submitted ? {
    menu: !menuId,
    date: !date,
    time: !time,
    place: !place.trim(),
    hostName: !hostName.trim(),
  } : {}), [submitted, menuId, date, time, place, hostName]);

  // The first field in reading order that is wrong, so submitting scrolls to
  // the top of the problem rather than to the middle of it.
  const firstBadRef = useRef(null);
  const claimed = useRef(false);
  claimed.current = false;
  const refFor = (key) => (node) => {
    if (!bad[key] || claimed.current || !node) return;
    claimed.current = true;
    firstBadRef.current = node;
  };

  // Take them to the first thing that is wrong, after the marks exist.
  //
  // The problem list renders beside the button at the foot of a form four
  // screens tall (3459px, measured 2026-08-04), naming fields up to 2000px
  // above it. "Pick a date" at the bottom of an unmarked form is a scavenger
  // hunt, so the page goes to the field and the field says so itself.
  //
  // In an effect rather than in submit(): the marks only exist once
  // `submitted` is true, and reading the ref inside the handler read it one
  // render too early — the first attempt scrolled nowhere. The counter makes
  // a second identical attempt still fire.
  useEffect(() => {
    if (attempt === 0) return;
    firstBadRef.current?.scrollIntoView({ block: 'center' });
  }, [attempt]);

  const submit = async () => {
    setSubmitted(true);
    if (problems.length > 0 || saving) {
      setAttempt(n => n + 1);
      return;
    }
    setSaving(true);
    const row = await createTable({
      menuId, date, time, place: place.trim(), restaurant: restaurant.trim(), guides, languages,
      seats: Number(seats), note: note.trim(), meetingNote, chatUrl,
      lat: point.lat, lng: point.lng,
      hostId: profile?.userId, hostName: hostName.trim(), hostNationality: profile?.nationality,
      hostGender: profile?.gender ?? null,
    });
    onProfileChange?.({ ...profile, name: hostName.trim() });
    // Here, and not at the button. The table exists; the agreement that got
    // them to it is now a record. Walking away from this form leaves the
    // profile untouched and the gate standing next time — reported and fixed
    // on 2026-09-03, after the button had been writing it.
    const consent = consentToRecord(agreedHere);
    if (consent) onAgree?.(consent);
    onCreated(row.id);
  };

  // A host agrees to the same rules a guest does, and for a stronger reason:
  // they are the one setting the terms of the evening. Gating the whole form
  // rather than the submit button keeps somebody from filling in a dish, a
  // date and a place before finding out there was a condition.
  if (showsRulesGate(agreedHere !== null)) {
    return (
      <section className="sheet-page" aria-label={say('Open a table', '상 차리기', 'Abrir una mesa', 'Ouvrir une table', 'افتح مائدة', '开一张饭桌', '食卓を開く')}>
        <header className="sheet-page__head">
          <button className="sheet-page__back" onClick={onBack} aria-label={say('Back', '뒤로', 'Atrás', 'Retour', 'رجوع', '返回', '戻る')}>
            <ChevronLeftIcon size={20} />
          </button>
          <h1>{say('상 차리기 · Open a table', '상 차리기', 'Abrir una mesa', 'Ouvrir une table', 'افتح مائدة', '开一张饭桌', '食卓を開く')}</h1>
        </header>
        <div className="form-block">
          <h2 className="form-label">{say('Before you open a table', '상을 차리기 전에', 'Antes de abrir una mesa', "Avant d'ouvrir une table", 'قبل أن تفتح مائدة', '在你开一张饭桌之前', '食卓を開く前に')}</h2>
          <RulesConsent
            onAgree={() => setAgreedHere(rulesAgreement(PURPOSE.version))}
            action={AGREE_ACTION.OPEN_TABLE}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="sheet-page" aria-label={say('Open a table', '상 차리기', 'Abrir una mesa', 'Ouvrir une table', 'افتح مائدة', '开一张饭桌', '食卓を開く')}>
      <header className="sheet-page__head">
        <button className="sheet-page__back" onClick={onBack} aria-label={say('Back', '뒤로', 'Atrás', 'Retour', 'رجوع', '返回', '戻る')}>
          <ChevronLeftIcon size={20} />
        </button>
        <h1>{say('상 차리기 · Open a table', '상 차리기', 'Abrir una mesa', 'Ouvrir une table', 'افتح مائدة', '开一张饭桌', '食卓を開く')}</h1>
      </header>

      {/* Before the first field, because these are the terms of the evening
          and not a footnote to it. Removes itself once they have hosted. */}
      <HostBrief profile={profile} />

      <div className={`form-block${bad.menu ? ' is-bad' : ''}`} ref={refFor('menu')}>
        <h2 className="form-label">{say('무엇을 먹나요 · What are you eating?', '무엇을 먹나요', '¿Qué vais a comer?', 'Que mangerez-vous ?', 'ماذا ستأكلون؟', '你们要吃什么？', '何を食べますか？')}</h2>
        {/* What the venue actually serves, when the host came from its page.
            Not a choice — the dish below is one of the twenty-four in the
            catalogue, and a temple kitchen serves none of them, so these two lists
            genuinely do not line up. Shown anyway because the host standing in
            front of that menu should not have to remember it, and hiding it is
            how a page looks like it forgot where you came from. Names only:
            this app does not print prices it cannot verify. */}
        {prefill?.venueMenus?.length > 0 && (
          <div className="venue-menu-hint">
            <p className="venue-menu-hint__head">
              {say(`On the menu at ${prefill.venueName}`, `${prefill.venueName}에서 파는 것`,
                `En la carta de ${prefill.venueName}`, `À la carte de ${prefill.venueName}`,
                `من قائمة ${prefill.venueName}`, `${prefill.venueName}的菜单上`, `${prefill.venueName}のお品書き`)}
            </p>
            <p className="venue-menu-hint__list">{prefill.venueMenus.join(' · ')}</p>
            <p className="venue-menu-hint__note">
              {say('밥친구의 요리 목록과는 별개예요 · Pick the shared dish below; this is just what the kitchen lists.',
                '밥친구의 요리 목록과는 별개예요. 함께 먹을 요리는 아래에서 고르세요.',
                'Elige abajo el plato que compartiréis; esto es solo lo que ofrece la cocina.',
                "Choisissez ci-dessous le plat partagé ; ceci n'est que ce que propose la cuisine.", 'اختر أدناه الطبق الذي ستتشاركونه؛ هذا ليس إلا ما يقدّمه المطبخ.', '在下面挑你们要分着吃的那道菜；这里只是这家厨房有什么。', '分け合う料理は下から選んでください。ここにあるのは、この店が出しているものです。')}
            </p>
          </div>
        )}
        {bad.menu && <p className="field__error">{say('요리를 하나 골라 주세요 · Choose a dish.', '요리를 하나 골라 주세요', 'Elige un plato.', 'Choisissez un plat.', 'اختر طبقًا.', '挑一道菜。', '料理をひとつ選んでください。')}</p>}
        {/* Twenty-four dishes in one flat grid was every dish at once and no
            way in for somebody who does not already know them. Six rows now,
            all shut, opened one at a time — and the same component the guest
            browses with, so a dish that moves group moves on both screens.
            The search box above it is part of that component: a host who
            knows the word should not have to find its category first. */}
        <DishGroupAccordion
          mode={PICK.DISH}
          query={dishQuery}
          onQueryChange={setDishQuery}
          selectedMenuId={menuId}
          onPickDish={(m) => {
            setMenuId(m.id);
            // Never leave a seat count below the dish's own minimum.
            setSeats(s => Math.max(Number(s) || 0, m.minPeople, 2));
            // 감자탕 at 19:00 was the form's guess, not the dish's. Only
            // moved where the catalog actually knows — a dish with no
            // recorded time keeps whatever the host already set.
            if (!timeTouched) setTime(defaultHourFor(m.id) ?? '19:00');
          }}
        />
      </div>

      {menu && (
        <div className="form-block">
          <div className="dish-brief">
            <span className="dish-brief__cat">{categoryLabel(menu.category, locale)}</span>
            <p className="dish-brief__how">{say(menu.howItWorks, menu.howItWorksKo, menu.howItWorksEs, menu.howItWorksFr, menu.howItWorksAr, menu.howItWorksZh, menu.howItWorksJa)}</p>
            {eatenAtLabels(menu.id).length > 0 && (
              <p className="dish-brief__when">
                {say(
                  `Usually eaten in the ${eatenAtLabels(menu.id).map(l => l.en).join(' or ')}`,
                  `주로 ${eatenAtLabels(menu.id).map(l => l.kr).join(' · ')}에 먹어요`,
                  `Se come sobre todo en ${eatenAtLabels(menu.id).map(l => l.es).join(' o ')}`,
                  `On le mange surtout ${eatenAtLabels(menu.id).map(l => l.fr).join(' ou ')}`,
                  `يُؤكل عادة في ${eatenAtLabels(menu.id).map(l => l.ar).join(' أو ')}`,
                  `一般在${eatenAtLabels(menu.id).map(l => l.zh).join('、')}吃`,
                  `ふだんは${eatenAtLabels(menu.id).map(l => l.ja).join('・')}に食べます`)}
              </p>
            )}
            <p className="dish-brief__contains">{containsLine(menu, locale).text}</p>
            {conflictsFor(menu, profile).length > 0 && (
              <p className="detail-conflict">
                {conflictLine(conflictsFor(menu, profile), locale)}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="form-block">
        <h2 className="form-label">{say('언제, 어디서 · When and where?', '언제, 어디서', '¿Cuándo y dónde?', 'Quand et où ?', 'متى وأين؟', '什么时候，在哪儿？', 'いつ、どこで？')}</h2>
        <div className="field-row">
          <label className={`field${bad.date ? ' is-bad' : ''}`} ref={refFor('date')}>
            <span className="field__label">{say('날짜 · Date', '날짜', 'Fecha', 'Date', 'التاريخ', '日期', '日付')}</span>
            <input type="date" value={date} min={todayISO()} onChange={e => setDate(e.target.value)} />
            {bad.date && <span className="field__error">{say('날짜를 골라 주세요 · Pick a date.', '날짜를 골라 주세요', 'Elige una fecha.', 'Choisissez une date.', 'اختر تاريخًا.', '挑一个日期。', '日付を選んでください。')}</span>}
          </label>
          <label className={`field${bad.time ? ' is-bad' : ''}`} ref={refFor('time')}>
            <span className="field__label">{say('시간 · Time', '시간', 'Hora', 'Heure', 'الوقت', '时间', '時刻')}</span>
            <input
              type="time"
              value={time}
              onChange={e => { setTime(e.target.value); setTimeTouched(true); }}
            />
            {bad.time && <span className="field__error">{say('시간을 골라 주세요 · Pick a time.', '시간을 골라 주세요', 'Elige una hora.', 'Choisissez une heure.', 'اختر وقتًا.', '挑一个时间。', '時刻を選んでください。')}</span>}
          </label>
        </div>
        <label className={`field${bad.place ? ' is-bad' : ''}`} ref={refFor('place')}>
          <span className="field__label">{say('만나는 곳 · Where you will meet', '만나는 곳', 'Dónde os veréis', 'Où vous vous retrouverez', 'أين ستلتقون', '你们在哪儿见', '待ち合わせ場所')}</span>
          <input
            type="text"
            value={place}
            placeholder={say('Exit 4, Jongno 3-ga station', '종로3가역 4번 출구', 'Salida 4, estación de Jongno 3-ga', 'Sortie 4, station Jongno 3-ga', 'المخرج 4، محطة جونغنو 3-غا', '钟路3街站4号出口', '鍾路3街駅 4番出口')}
            onChange={e => setPlace(e.target.value)}
          />
          {bad.place && <span className="field__error">{say('만날 곳을 적어 주세요 · Say where you will meet.', '만날 곳을 적어 주세요', 'Di dónde os veréis.', 'Indiquez où vous vous retrouverez.', 'اذكر أين ستلتقون.', '写一下你们在哪儿见。', '待ち合わせ場所を書いてください。')}</span>}
        </label>

        {/* The shop, which is not the same as the meeting point. A table that
            named a station exit and nothing else left a guest with no idea
            where they were actually eating. Optional on purpose — a host who
            has not decided says so, rather than inventing a name. */}
        <label className="field">
          <span className="field__label">{say('Which restaurant? (optional)', '어느 식당인가요? (선택)', '¿Qué restaurante? (opcional)', 'Quel restaurant ? (facultatif)', 'أيّ مطعم؟ (اختياري)', '哪家餐厅？（可选）', 'どのお店ですか？（任意）')}</span>
          <input
            type="text"
            value={restaurant}
            placeholder={say('Sae Ma Eul Sikdang, or leave blank to decide together', '새마을식당, 또는 비워 두고 함께 정하기', 'Sae Ma Eul Sikdang, o déjalo en blanco para decidirlo juntos', 'Sae Ma Eul Sikdang, ou laissez vide pour décider ensemble', 'ساي ما إيول سيكدانغ، أو اتركه فارغًا لتقرّروا معًا', '세마을식당，或者留空一起决定', '세마을식당、または空欄にして一緒に決める')}
            onChange={e => setRestaurant(e.target.value)}
          />
        </label>
      </div>

      <div className="form-block">
        <h2 className="form-label">{say('How many at the table?', '몇 명이 앉나요?', '¿Cuántos en la mesa?', 'Combien à table ?', 'كم عددكم على المائدة؟', '这桌坐几个人？', '何人の食卓ですか？')}</h2>
        <div className="seat-picker">
          {[2, 3, 4, 5, 6].map(n => (
            <button
              key={n}
              className={`seat-option${Number(seats) === n ? ' is-on' : ''}`}
              disabled={Boolean(menu && n < menu.minPeople)}
              onClick={() => setSeats(n)}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="field__hint">
          {say('Counting you.', '본인 포함이에요.', 'Contándote a ti.', 'Vous compris.', 'أنت محسوب.', '包括你自己。', 'ご本人を含みます。')}
          {' '}
          {menu && menu.minPeople > 1
            ? say(`${menu.name} needs ${menu.minPeople} or more.`, `${menu.name}은(는) ${menu.minPeople}명 이상이어야 해요.`,
              `${menu.name} necesita ${menu.minPeople} o más.`, `${menu.name} demande ${menu.minPeople} personnes ou plus.`,
              `${menu.name} يحتاج ${menu.minPeople} أو أكثر.`, `${menu.name}需要 ${menu.minPeople} 个人以上。`,
              `${menu.name}は${menu.minPeople}人以上必要です。`)
            : say('A table needs at least two.', '밥상은 최소 두 명이에요.', 'Una mesa necesita al menos dos.', 'Une table demande au moins deux personnes.', 'المائدة تحتاج اثنين على الأقل.', '一张饭桌至少要两个人。', '食卓には少なくとも二人必要です。')}
        </p>
      </div>

      {/* The single fact a traveller weighs hardest and the app never printed.
          Pre-filled from the host's own profile, because they have already
          answered this once and being asked twice is how a form stops feeling
          like it is on your side. */}
      <div className="form-block">
        <h2 className="form-label">{say('언어 · What will this table run in?', '언어', '¿En qué idioma será esta mesa?', 'Dans quelle langue se passera cette table ?', 'بأي لغة ستكون هذه المائدة؟', '这张饭桌会用什么语言？', 'この食卓は何語で進みますか？')}</h2>
        <p className="form-label__hint">
          {say('Shown on your table. Somebody deciding whether to sit with four strangers is mostly deciding whether they will understand anything.',
            '당신의 밥상에 표시됩니다. 처음 보는 네 사람과 앉을지 고민하는 사람은, 사실 말이 통할지를 고민하는 겁니다.',
            'Se muestra en tu mesa. Quien está decidiendo si se sienta con cuatro desconocidos está decidiendo, sobre todo, si va a entender algo.', "Affiché sur votre table. Quelqu'un qui se demande s'il va s'asseoir avec quatre inconnus se demande surtout s'il va comprendre quelque chose.", 'يُعرض على مائدتك. ومن يفكّر في الجلوس مع أربعة غرباء إنما يفكّر قبل كل شيء في أنه هل سيفهم شيئًا.', '会显示在你的饭桌上。一个人在想要不要和四个陌生人坐下时，多半是在想自己能不能听懂。', 'あなたの食卓に表示されます。知らない四人と座るか迷っている人は、たいてい「話が分かるだろうか」を迷っています。')}
        </p>
        <div className="lang-picks">
          {LANGUAGES.map(l => {
            const on = languages.includes(l);
            return (
              <button
                key={l}
                type="button"
                className={`lang-pick${on ? ' is-on' : ''}`}
                aria-pressed={on}
                onClick={() => setLanguages(cur =>
                  cur.includes(l) ? cur.filter(x => x !== l) : [...cur, l])}
              >
                <span className="lang-pick__native" translate="no">{l}</span>
                {languageLabel(l).en && (
                  <span className="lang-pick__en">{languageLabel(l).en}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* The plan's 문화 큐레이터, asked as a question the host can answer.
          Everything above this point describes a booking; this is the part
          that makes the evening an exchange rather than four people eating.
          Optional on purpose — a host who ticks nothing still hosts, and a
          box nobody can honestly tick would be worse than no box. */}
      <div className="form-block">
        <h2 className="form-label">{say('문화 가이드 · What will you walk the table through?', '문화 가이드', '¿Qué le explicarás a la mesa?', 'Que ferez-vous découvrir à la table ?', 'ماذا ستعرّف المائدة به؟', '你会带这桌了解什么？', '食卓に何を案内しますか？')}</h2>
        <p className="form-label__hint">
          {say('Optional. Whatever you tick is shown on your table, in your guests\u2019 language, so they know what to expect before they ask for a seat.',
            '선택입니다. 체크하신 것은 손님들의 언어로 밥상에 표시되어, 자리를 청하기 전에 무엇을 기대할지 알 수 있게 합니다.',
            'Opcional. Lo que marques se muestra en tu mesa, en el idioma de tus invitados, para que sepan qué esperar antes de pedir sitio.', "Facultatif. Ce que vous cochez s'affiche sur votre table, dans la langue de vos invités, pour qu'ils sachent à quoi s'attendre avant de demander une place.", 'اختياري. ما تؤشّر عليه يُعرض على مائدتك بلغة ضيوفك، ليعرفوا ما ينتظرهم قبل أن يطلبوا مقعدًا.', '可选。你勾的会用客人的语言显示在你的饭桌上，让他们在申请位子之前就知道会遇到什么。', '任意です。選んだものは、招く人の言語であなたの食卓に表示されます。席をリクエストする前に、何が待っているか分かるように。')}
        </p>

        {/* The consequence of the ticks, said while they are being ticked.
            The two kinds are derived from this rather than asked separately,
            so a host should be able to see which one they are making. */}
        <p className="kind-preview">
          <span className={`kind-preview__tag is-${guides.length > 0 ? 'hosted' : 'mates'}`}>
            {guides.length > 0
              ? say(TABLE_KIND_LABEL.hosted.en, TABLE_KIND_LABEL.hosted.kr, TABLE_KIND_LABEL.hosted.es, TABLE_KIND_LABEL.hosted.fr, TABLE_KIND_LABEL.hosted.ar, TABLE_KIND_LABEL.hosted.zh, TABLE_KIND_LABEL.hosted.ja)
              : say(TABLE_KIND_LABEL.mates.en, TABLE_KIND_LABEL.mates.kr, TABLE_KIND_LABEL.mates.es, TABLE_KIND_LABEL.mates.fr, TABLE_KIND_LABEL.mates.ar, TABLE_KIND_LABEL.mates.zh, TABLE_KIND_LABEL.mates.ja)}
          </span>
          {guides.length > 0
            ? say(' — you are offering to walk the table through it.', ' — 상을 이끌어 주시겠다는 뜻이에요.', ' — te ofreces a guiar la mesa.', " — vous proposez de guider la table.", ' — أنت تعرض أن تقود المائدة.', ' — 你是在提出带着这桌人走一遍。', ' — 食卓を案内すると申し出ることになります。')
            : say(' — tick nothing and yours is a table where everyone works it out together. That is a real table too.', ' — 아무것도 고르지 않으면 다 같이 알아서 하는 밥상이 됩니다. 그것도 훌륭한 밥상이에요.', ' — si no marcas nada, la tuya es una mesa donde todos se apañan juntos. También es una mesa de verdad.', " — si vous ne cochez rien, la vôtre est une table où chacun se débrouille avec les autres. C'est une vraie table aussi.", ' — إن لم تختر شيئًا فمائدتك مائدة يتدبّر فيها الجميع الأمر معًا. وهي مائدة حقيقية أيضًا.', ' — 什么都不勾，你这桌就是大家一起摸索着来。那也是一张真正的饭桌。', ' — 何も選ばなければ、みんなで一緒に考えていく食卓になります。それも立派な食卓です。')}
        </p>
        {/* The professor's note, answered to the person who can actually act
            on it: a host deciding whether to tick a box. Everything above
            this point in the form is a booking; ticking one guide is what
            turns it into the exchange the plan is actually funded to make
            happen. Only shown once they have ticked something — telling a
            host who ticked nothing that they are doing public diplomacy
            wrong would be exactly the "lesser table" framing the codebase
            has deliberately avoided elsewhere (see TABLE_KIND_LABEL.mates). */}
        {guides.length > 0 && (
          <p className="host-why">
            {say('이게 이 앱이 하는 일입니다 · This is the part of 밥친구 that is not just a group booking — a Korean host teaching a stranger their own food, in a language the stranger understands.',
              '이게 이 앱이 하는 일입니다. 단체 예약이 아니라, 한국인 호스트가 처음 보는 사람에게 자기 음식을 그 사람이 알아듣는 말로 알려주는 것.',
              'Esto es lo que hace esta app y no una reserva de grupo: un anfitrión coreano enseñando su propia comida a un desconocido, en un idioma que el desconocido entiende.',
              "C'est ce que fait cette application, et ce n'est pas une réservation de groupe : un hôte coréen fait découvrir sa propre cuisine à un inconnu, dans une langue que l'inconnu comprend.", 'هذا ما يفعله هذا التطبيق، وليس حجزًا جماعيًّا: مضيف كوري يعرّف غريبًا بطعامه هو، بلغة يفهمها الغريب.', '这就是这个应用在做的事，而不是一次团体订位：一位韩国主人用陌生人听得懂的语言，讲自己的食物。', 'これがこのアプリのしていることで、団体予約ではありません。韓国人のホストが、知らない人に自分の食べものを、その人の分かる言葉で伝える。')}
          </p>
        )}
        <div className="guide-picks">
          {GUIDES.map(g => {
            const on = guides.includes(g.id);
            return (
              <button
                key={g.id}
                type="button"
                className={`guide-pick${on ? ' is-on' : ''}`}
                aria-pressed={on}
                /* Functional, not `[...guides, g.id]`. Two taps close enough
                   together to land in one React batch both read the same
                   captured array, and the second silently drops the first. */
                onClick={() => setGuides(cur =>
                  cur.includes(g.id) ? cur.filter(x => x !== g.id) : [...cur, g.id])}
              >
                <span className="guide-pick__kr">{g.kr}</span>
                <span className="guide-pick__en">{g.en}</span>
                <span className="guide-pick__say">{g.hostAsk}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="form-block">
        <h2 className="form-label">{say('이름 · Your name', '이름', 'Tu nombre', 'Votre nom', 'اسمك', '你的名字', 'あなたの名前')}</h2>
        <label className={`field${bad.hostName ? ' is-bad' : ''}`} ref={refFor('hostName')}>
          {/* This field had a placeholder and no label at all — the only one
              in the form. A placeholder disappears the moment somebody types,
              so the question vanishes exactly when they might want to check
              it, and a screen reader had nothing to announce. */}
          <span className="field__label">{say('손님이 부를 이름 · What your guests should call you', '손님이 부를 이름', 'Cómo deben llamarte tus invitados', 'Comment vos invités doivent vous appeler', 'ما ينبغي أن يناديك به ضيوفك', '客人该怎么称呼你', '招く人にどう呼ばれたいか')}</span>
          <input
            type="text"
            value={hostName}
            /* Was "What people should look for", which asked the recognition
               question on the name field and then had nowhere to put the
               answer. A host taking it at its word would have called
               themselves "red jacket by the stairs". The real question is the
               field below. */
            placeholder={say('Minsu', '민수', 'Minsu', 'Minsu', 'مينسو', '민수', '민수')}
            onChange={e => setHostName(e.target.value)}
          />
          {bad.hostName && <span className="field__error">{say('이름을 적어 주세요 · Add a name.', '이름을 적어 주세요', 'Añade un nombre.', 'Ajoutez un nom.', 'أضِف اسمًا.', '写一个名字。', '名前を入れてください。')}</span>}
        </label>
        <label className="field">
          <span className="field__label">{say('How will they spot you? (optional)', '어떻게 알아볼까요 (선택)', '¿Cómo te reconocerán? (opcional)', 'Comment vous reconnaîtront-ils ? (facultatif)', 'كيف يعرفونك؟ (اختياري)', '他们怎么认出你？（可选）', 'どうやって見つけてもらいますか（任意）')}</span>
          <input
            type="text"
            value={meetingNote}
            maxLength={MEETING_NOTE_MAX}
            placeholder={say('Green jacket, by the CU on the corner', '초록 자켓, 모퉁이 CU 앞', 'Chaqueta verde, junto al CU de la esquina', 'Veste verte, à côté du CU du coin', 'سترة خضراء، بجانب متجر CU على الناصية', '绿色外套，在拐角 CU 旁边', '緑のジャケット、角の CU のそば')}
            onChange={e => setMeetingNote(e.target.value)}
          />
          <span className="field__note">
            {say(
              `Only people with a seat see this — not everyone browsing. The app has no chat and no phone numbers, so this is how somebody finds you at ${place.trim() || 'the meeting point'}.`,
              `자리를 잡은 사람만 볼 수 있어요 — 둘러보는 사람에게는 안 보입니다. 이 앱에는 채팅도 전화번호도 없어서, ${place.trim() || '약속 장소'}에서 이걸 보고 찾습니다.`,
              `Solo lo ven quienes tienen sitio, no todo el que mira. La app no tiene chat ni teléfonos, así que así te encontrarán en ${place.trim() || 'el punto de encuentro'}.`,
              `Seules les personnes ayant une place le voient, pas les curieux. L'app n'a ni messagerie ni numéros, c'est donc ainsi qu'on vous trouvera à ${place.trim() || 'le point de rendez-vous'}.`,
              `لا يراه إلا من له مقعد، لا كلّ من يتصفّح. لا محادثة في التطبيق ولا أرقام هواتف، فبهذا يجدك أحدهم عند ${place.trim() || 'مكان اللقاء'}.`,
              `只有拿到位子的人看得到——不是所有浏览的人。这个应用没有聊天也没有电话号码，所以别人就靠这个在${place.trim() || '约定地点'}找到你。`,
              `席を取った人だけが見られます——見て回っているだけの人には見えません。このアプリには チャット も電話番号もないので、${place.trim() || '待ち合わせ場所'}ではこれを頼りに見つけてもらいます。`)}
          </span>
        </label>
        {/* The map answers a question words cannot: "can I get there from
            where I am sleeping". 부장님's 모임 장소 표시, asked of the one
            person who actually knows where they will be standing. */}
        <PlacePicker value={point} onChange={setPoint} />

        <label className="field">
          <span className="field__label">{say('오픈채팅 링크 · Open chat link (optional)', '오픈채팅 링크 (선택)', 'Enlace de chat abierto (opcional)', 'Lien de chat ouvert (facultatif)', 'رابط محادثة مفتوحة (اختياري)', '开放聊天链接（可选）', 'オープンチャットのリンク（任意）')}</span>
          <input
            type="url"
            value={chatUrl}
            placeholder={say('https://open.kakao.com/o/…', 'https://open.kakao.com/o/…', 'https://open.kakao.com/o/…', 'https://open.kakao.com/o/…', 'https://open.kakao.com/o/…', 'https://open.kakao.com/o/…', 'https://open.kakao.com/o/…')}
            onChange={e => setChatUrl(e.target.value)}
          />
          <span className="field__note">
            {say('Make a KakaoTalk open chat and paste its link — your confirmed guests see it, nobody else does. It is the "running 10 minutes late" channel the app itself does not have. https links only.',
              '카카오톡 오픈채팅을 만들어 링크를 붙여 넣으세요. 승인된 손님에게만 보이고 다른 사람에게는 보이지 않습니다. 앱에는 없는 "10분 늦어요" 채널이에요. https 링크만 됩니다.',
              'Crea un chat abierto de KakaoTalk y pega el enlace: lo ven tus invitados confirmados y nadie más. Es el canal de "llego diez minutos tarde" que la app no tiene. Solo enlaces https.', "Créez un chat ouvert KakaoTalk et collez le lien : vos invités confirmés le voient, personne d'autre. C'est le canal « j'ai dix minutes de retard » que l'application n'a pas. Liens https uniquement.", 'أنشئ محادثة مفتوحة على كاكاوتوك والصق الرابط: يراه ضيوفك المؤكَّدون ولا يراه غيرهم. إنها قناة «تأخّرت عشر دقائق» التي لا يملكها التطبيق. روابط https فقط.', '开一个 KakaoTalk 开放聊天，把链接贴进来：只有确认的客人看得到，别人看不到。这就是那个「我要迟到十分钟」的渠道，应用本身没有。只收 https 链接。', 'KakaoTalk のオープンチャットをつくってリンクを貼ってください。確定した参加者だけが見られ、ほかの人には見えません。アプリ自体が持っていない「10分遅れます」の通り道です。https のリンクのみ。')}
          </span>
        </label>
        <label className="field">
          <span className="field__label">{say('Anything to say? (optional)', '하고 싶은 말이 있나요? (선택)', '¿Algo que decir? (opcional)', 'Quelque chose à dire ? (facultatif)', 'أشيء تريد قوله؟ (اختياري)', '有什么要说的吗？（可选）', '何か伝えたいことはありますか？（任意）')}</span>
          <textarea
            rows={3}
            value={note}
            placeholder={say('First time grilling is fine — I will do the scissors.', '처음 구워도 괜찮아요 — 가위는 제가 들게요.', 'No pasa nada si es tu primera parrilla: yo me encargo de las tijeras.', "Première fois au gril, aucun souci — je m'occupe des ciseaux.", 'أول مرة على الشواية؟ لا بأس — أنا أتولّى المقص.', '第一次烤肉也没关系——剪刀我来。', '焼くのが初めてでも大丈夫です——ハサミは私がやります。')}
            onChange={e => setNote(e.target.value)}
          />
        </label>
      </div>

      {submitted && problems.length > 0 && (
        <ul className="form-problems">
          {problems.map(p => <li key={p}>{p}</li>)}
        </ul>
      )}

      <div className="form-actions">
        <button className="form-submit" onClick={submit} disabled={saving}>
          {saving
            ? say('Opening…', '여는 중…', 'Abriendo…', 'Ouverture…', 'جارٍ الفتح…', '正在打开…', '開いています…')
            : say('Open the table', '테이블 열기', 'Abrir la mesa', 'Ouvrir la table', 'افتح المائدة', '打开饭桌', '食卓を開く')}
        </button>
      </div>
    </section>
  );
}
