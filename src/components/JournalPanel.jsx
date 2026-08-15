import React, { useEffect, useMemo, useState } from 'react';
import { restaurants } from '../data/restaurants';
import { isQuarantined } from '../data/verification';
import { traditionalMarkets } from '../data/experiences';
import { menuById } from '../domain/catalog/menus.js';
import { isPast, didHappen } from '../domain/policy/table.js';
import { isAccepted, isPending, hasLapsed } from '../domain/policy/seatRequest.js';
import { countsAsMet } from '../domain/policy/attendance.js';
import { isCancelled } from '../domain/policy/cancellation.js';
import { isMember, gateText } from '../domain/policy/access.js';
import { listTables, listAllSignups, listBlocks, deleteBlock, listReviews } from '../data/tableRepository.js';
import { experienceById, themeIdsOfExperience, themeById, themes } from '../domain/catalog/index.js';
import { themeCompletionKind, COMPLETION_KIND } from '../domain/policy/completion.js';
import { ChevronRightIcon } from './Icons';
import ProfileSheet from './ProfileSheet';
import PhraseSheet from './PhraseSheet';
import SafetySheet from './SafetySheet';
import { restrictionLabel, dietById } from '../data/profile';
import { languageLine } from '../domain/catalog/languages.js';
import { useText, useLocale } from './localeText.js';
import AnimalAvatar from './AnimalAvatar.jsx';
import { dateLocale } from '../domain/policy/locale.js';

function formatStampDate(ts) {
  if (!ts) return null;
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// The heading of a day in the record. Full and unambiguous, because this is
// the line a traveller reads back later to remember when something happened.
function formatDayHeading(ts) {
  return new Date(ts).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

const dayKey = (ts) => new Date(ts).toDateString();

export default function JournalPanel({
  // companions, mapCenter and onOpenTables were declared here and never read.
  // App.jsx still passes companions, and journeyFromLegacy still reads it, so
  // the value is not dead everywhere — it is just dead on this screen.
  bookmarks, onRestaurantClick, onNavigate, journey,
  attestations = [], visitedMarkets = [], profile, onProfileChange,
  onOpenSummary, onOpenTheme, domainJourney, auth, onSignOut, onRequireAuth,
  // What the app is allowed to claim about the last profile change.
  saveState = 'idle',
}) {
  const say = useText();
  const locale = useLocale();
  // Tables live behind the async repository rather than in React state, so
  // they are fetched here the same way the Tables tab fetches them. When that
  // repository becomes Supabase this call does not change.
  const [myTables, setMyTables] = useState([]);
  // My own one-line reviews, keyed by table id. The record shows the line
  // under the meal it remembers — written on the table page, read back here,
  // because this panel is where remembering happens.
  const [memories, setMemories] = useState({});
  const isMemberAuth = isMember(auth);
  const [blocks, setBlocks] = useState([]);
  const [phrasesOpen, setPhrasesOpen] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Every culture this traveller finished, with what backed each one.
  // Computed from the same policy the stamp uses, so the two cannot drift.
  const walkedThemes = useMemo(() => (domainJourney ? themes
    .map(theme => ({ theme, kind: themeCompletionKind(theme.id, domainJourney) }))
    .filter(w => w.kind !== null) : []), [domainJourney]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [tables, signups] = await Promise.all([listTables(), listAllSignups()]);
      const mine = tables
        .filter(t =>
          t.hostId === profile?.userId ||
          signups.some(s => s.tableId === t.id && s.userId === profile?.userId))
        .map(t => ({
          ...t,
          hosted: t.hostId === profile?.userId,
          // Everyone who actually shared the table, except the person reading
          // this page.
          //
          // This used to be every signup row, which meant the Passport filed
          // three kinds of people under "you met them": somebody still waiting
          // on the host, somebody the host turned down, and somebody who
          // confirmed and then never came. None of them were at the meal. The
          // record is the one part of this app that is supposed to be a memory
          // rather than a claim, and it was inventing all three.
          //
          // isAccepted reads a row written before approval existed as
          // accepted, so nobody's real dinner disappears from their Passport.
          people: [
            ...(t.hostId === profile?.userId
              ? []
              : [{ key: `host-${t.id}`, name: t.hostName, nationality: t.hostNationality || '' }]),
            ...signups
              .filter(s => s.tableId === t.id && s.userId !== profile?.userId)
              .filter(s => isAccepted(s) && countsAsMet(s))
              .map(s => ({ key: s.userId || s.id, name: s.name, nationality: s.nationality || '' })),
          ].filter(p => p.name),
          // My own seat at this table, or null if I am its host. Carried so
          // "Coming up" can tell a booking from a request — approval created
          // a waiting state, and a screen that lists both as the same thing
          // has a traveller keeping an evening free for a seat nobody gave
          // them yet.
          myRequest: t.hostId === profile?.userId
            ? null
            : signups.find(s => s.tableId === t.id && s.userId === profile?.userId) ?? null,
          // What this host still owes an answer to. A pending request holds a
          // seat, so a host who never looks freezes their own table; the
          // Passport is where they will look.
          waiting: t.hostId === profile?.userId
            ? signups.filter(s => s.tableId === t.id && isPending(s) && !hasLapsed(s, t)).length
            : 0,
        }));
      if (alive) setMyTables(mine);

      // My line about each meal that happened, fetched only for tables where
      // I held a seat — a host has no signup to have written under. A missing
      // reviews table degrades to no lines, which is also what it means.
      const reviewable = mine.filter(t => didHappen(t) && t.myRequest);
      if (reviewable.length > 0) {
        const sets = await Promise.all(
          reviewable.map(t => listReviews(t.id).catch(() => [])),
        );
        const found = {};
        reviewable.forEach((t, i) => {
          const r = sets[i].find(x => x.signupId === t.myRequest.id);
          if (r) found[t.id] = r.body;
        });
        if (alive) setMemories(found);
      }
    })();
    return () => { alive = false; };
  }, [profile]);

  useEffect(() => {
    let alive = true;
    // Caught rather than left to reject uncaught: a project whose schema
    // has not picked up the blocks table yet should show an empty "Blocked"
    // section (i.e. none, since it's only rendered when non-empty), not an
    // unhandled rejection in the console.
    (async () => { const b = await listBlocks().catch(() => []); if (alive) setBlocks(b); })();
    return () => { alive = false; };
  }, []);

  const unblock = async (blockedId) => {
    // Optimistic: the row disappearing is the confirmation, and there is
    // nothing more specific to say if the delete fails than what refetching
    // would already tell the next time this screen opens.
    setBlocks(prev => prev.filter(b => b.blockedId !== blockedId));
    await deleteBlock(blockedId);
  };

  // A meal you have not eaten yet is a plan, not a memory. The record below
  // is what happened; a table on Sunday belongs above it as something still
  // to come. Filing it as history would have the Passport claiming a dinner
  // that has not been served.
  const upcomingTables = useMemo(
    () => myTables.filter(t => !isPast(t)).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
    [myTables],
  );
  const byId = useMemo(() => Object.fromEntries(restaurants.map(r => [r.id, r])), []);

  const stamped = useMemo(() =>
    bookmarks
      .map(b => ({ ...b, place: byId[b.id] }))
      .filter(b => b.place && !isQuarantined(b.place))
      .sort((a, b) => (a.savedAt ?? 0) - (b.savedAt ?? 0)),
  [bookmarks, byId]);

  const visitedList = stamped.filter(s => s.visitedAt != null);
  const savedList = stamped.filter(s => s.visitedAt == null);

  // The people you actually shared a meal with.
  //
  // This used to read a list written by a swipe deck of eighty procedurally
  // generated travellers — names assembled from arrays, matched by tapping a
  // card. Nobody was ever met. It now comes from the tables you sat at, where
  // the other names are people who asked for a seat at a real meal.
  const metPeople = useMemo(() => {
    const seen = new Map();
    for (const t of myTables) {
      if (!didHappen(t)) continue;              // a booking is not a meeting, and a cancelled one is not either
      const at = new Date(`${t.date}T${t.time || '00:00'}`).getTime();
      for (const person of t.people) {
        // First shared meal wins, so a regular does not appear twice.
        if (!seen.has(person.key)) seen.set(person.key, { ...person, metAt: at });
      }
    }
    return [...seen.values()].sort((a, b) => b.metAt - a.metAt);
  }, [myTables]);

  // The record: what happened, in the order it happened, grouped by day.
  //
  // This used to be a twelve-item tail of places and matches at the bottom of
  // the panel, under four counters. A trip is not a set of counters — the
  // thing worth keeping is that on one particular Tuesday you ate temple food
  // at Balwoo, had the tea afterwards, and met someone. So every kind of
  // completion the app knows about lands here: cultures finished, places
  // visited and saved, markets walked, people met.
  //
  // Nothing is capped. A traveller who did twenty things should see twenty.
  const days = useMemo(() => {
    const marketById = Object.fromEntries(traditionalMarkets.map(m => [m.id, m]));

    // An experience is remembered as the culture it belongs to, because that
    // is what was chosen on Explore — "Temple Life", not "temple-tea".
    const themeOf = (experienceId) => {
      const themeId = themeIdsOfExperience(experienceId)[0];
      return themeId ? themeById(themeId) : null;
    };

    // A meal that has happened, timestamped by when it was eaten rather than
    // when it was booked — the record is a diary, and the day that matters is
    // the day you sat down.
    const tableItems = myTables
      .filter(t => didHappen(t))
      .map(t => {
        const menu = menuById(t.menuId);
        if (!menu) return null;
        const at = new Date(`${t.date}T${t.time || '00:00'}`);
        return {
          type: 'table',
          ts: Number.isFinite(at.getTime()) ? at.getTime() : 0,
          key: `table-${t.id}`,
          title: menu.name,
          subtitle: t.people.length > 0
            ? `with ${t.people.map(p => p.name).join(', ')}`
            : (t.hosted ? 'your table' : t.place),
          // The line I left on the table page, carried into the diary the
          // evening belongs to.
          memory: memories[t.id] ?? null,
        };
      })
      .filter(Boolean);

    const items = [
      ...tableItems,
      ...attestations
        .map(a => ({ entry: a, exp: experienceById(a.id) }))
        .filter(({ exp }) => exp)
        .map(({ entry, exp }) => ({
          type: 'experience', ts: entry.at, key: `exp-${exp.id}`,
          title: exp.title, subtitle: themeOf(exp.id)?.title ?? exp.zones[0] ?? null,
        })),
      ...visitedMarkets
        .map(m => ({ entry: m, market: marketById[m.id] }))
        .filter(({ market }) => market)
        .map(({ entry, market }) => ({
          type: 'market', ts: entry.at, key: `market-${market.id}`,
          title: market.name, subtitle: market.zone,
        })),
      ...visitedList.map(v => ({
        type: 'visit', ts: v.visitedAt, key: `visit-${v.place.id}`,
        title: v.place.name.split('(')[0].trim(), subtitle: v.place.zone,
        place: v.place,
      })),
      ...savedList.map(v => ({
        type: 'save', ts: v.savedAt, key: `save-${v.place.id}`,
        title: v.place.name.split('(')[0].trim(), subtitle: v.place.zone,
      })),
      ...metPeople.map(p => ({
        type: 'match', ts: p.metAt, key: `met-${p.key}`,
        title: `Met ${p.name}`, subtitle: p.nationality || null,
      })),
    ];

    // Entries saved before completions carried a timestamp have ts 0. They are
    // real and still count; they just cannot be placed on a specific day, so
    // they collect at the end rather than claiming 1 January 1970.
    const dated = items.filter(i => i.ts > 0).sort((a, b) => b.ts - a.ts);
    const undated = items.filter(i => !(i.ts > 0));

    const grouped = [];
    for (const item of dated) {
      const key = dayKey(item.ts);
      const last = grouped[grouped.length - 1];
      if (last && last.key === key) last.items.push(item);
      else grouped.push({ key, heading: formatDayHeading(item.ts), items: [item] });
    }
    if (undated.length > 0) grouped.push({ key: 'undated', heading: 'Earlier', items: undated });
    return grouped;
  }, [attestations, visitedMarkets, visitedList, savedList, metPeople, myTables, memories]);

  const recordCount = useMemo(
    () => days.reduce((n, d) => n + d.items.length, 0),
    [days],
  );

  // Badge counts come from the journey engine, not from a second tally kept
  // here. They used to be measured off this panel's own visited list, which
  // is why a theme finished by attestation left the Passport reading zero:
  // the engine knew, and the Passport was counting something else.
  //
  // Nationalities stay local — the engine models companions but not where
  // they are from, and inventing a count it does not hold would put the two
  // back out of step for the sake of one badge.
  const distinctNationalities = useMemo(
    () => new Set(metPeople.map(p => p.nationality).filter(Boolean)).size,
    [metPeople],
  );
  // Meals that have actually happened, and how many different dishes they
  // covered — the two numbers this product is about.
  const eaten = useMemo(() => myTables.filter(t => didHappen(t)), [myTables]);
  const dishesShared = useMemo(
    () => new Set(eaten.map(t => t.menuId)).size,
    [eaten],
  );

  // One goal list, not two.
  //
  // The Passport carried five badges and six challenges — eleven goals, all
  // of them from the restaurant-finder this used to be. "Taste three kinds of
  // Korean kitchen", "Eat something fermented", "Explore three districts":
  // a tourist checklist that says nothing about sitting down with somebody.
  // Four remain, and each one is the product's own sentence.
  const goals = useMemo(() => [
    {
      id: 'first-table',
      name: 'Share one table',
      nameKo: '밥상 하나를 함께하기',
      nameEs: 'Compartir una mesa',
      nameFr: 'Partager une table',
      nameAr: 'شارِك مائدة واحدة',
      nameZh: '一起吃一张饭桌',
      nameJa: '食卓をひとつ共にする',
      hint: 'The whole idea, once.',
      hintKo: '이 앱의 전부를, 한 번.',
      hintEs: 'La idea entera, una vez.',
      hintFr: "L'idée entière, une fois.",
      hintAr: 'الفكرة كلّها، مرة واحدة.',
      hintZh: '这个应用的全部，做一次。',
      hintJa: 'このアプリのすべてを、一度。',
      current: eaten.length, target: 1,
    },
    {
      id: 'three-dishes',
      name: 'Three dishes you could not have ordered alone',
      nameKo: '혼자서는 못 시켰을 요리 세 가지',
      nameEs: 'Tres platos que no habrías podido pedir solo',
      nameFr: "Trois plats que vous n'auriez pas pu commander seul",
      nameAr: 'ثلاثة أطباق ما كنت لتطلبها وحدك',
      nameZh: '三道你一个人点不了的菜',
      nameJa: 'ひとりでは頼めなかった料理を三つ',
      hint: 'Different dishes, not repeats.',
      hintKo: '같은 요리 말고, 서로 다른 것으로.',
      hintEs: 'Platos distintos, sin repetir.',
      hintFr: 'Des plats différents, pas des répétitions.',
      hintAr: 'أطباق مختلفة، لا تكرارًا.',
      hintZh: '要不同的菜，不是重复的。',
      hintJa: '別々の料理で。同じものの繰り返しではなく。',
      current: dishesShared, target: 3,
    },
    {
      id: 'two-countries',
      name: 'Eat with people from two countries',
      nameKo: '두 나라 사람과 함께 먹기',
      nameEs: 'Comer con gente de dos países',
      nameFr: 'Manger avec des gens de deux pays',
      nameAr: 'كُل مع أناس من بلدين',
      nameZh: '和来自两个国家的人一起吃',
      nameJa: '二つの国の人と一緒に食べる',
      hint: 'Counted from who was at your tables.',
      hintKo: '당신의 밥상에 실제로 앉았던 사람들로 셉니다.',
      hintEs: 'Se cuenta por quién estuvo en tus mesas.',
      hintFr: 'Compté selon qui était à vos tables.',
      hintAr: 'يُحسب بمن جلس فعلًا إلى موائدك.',
      hintZh: '按真正坐到你饭桌上的人来算。',
      hintJa: 'あなたの食卓に実際に座った人で数えます。',
      current: distinctNationalities, target: 2,
    },
    {
      id: 'one-culture',
      name: 'Walk one culture end to end',
      nameKo: '문화 하나를 끝까지 걷기',
      nameEs: 'Recorrer una cultura de principio a fin',
      nameFr: "Parcourir une culture d'un bout à l'autre",
      nameAr: 'امشِ ثقافة من طرفها إلى طرفها',
      nameZh: '把一个文化从头走到尾',
      nameJa: '文化をひとつ、端から端まで歩く',
      hint: 'Any theme on Explore, finished.',
      hintKo: '문화 탭의 아무 이야기나, 끝까지.',
      hintEs: 'Cualquier historia de Cultura, terminada.',
      hintFr: "N'importe quelle histoire de Culture, terminée.",
      hintAr: 'أي حكاية في تبويب الثقافة، مكتملة.',
      hintZh: '文化那一栏里的任何一个故事，走完。',
      hintJa: '文化タブのどの話でも、最後まで。',
      current: journey.experienceCount, target: 2,
    },
  ].map(g => ({
    ...g,
    done: g.current >= g.target,
    remaining: Math.max(g.target - g.current, 0),
  })), [eaten, dishesShared, distinctNationalities, journey]);

  const goalsDone = goals.filter(g => g.done).length;

  // A traveller with a table booked for Sunday has not done nothing — showing
  // them "your memories are waiting" underneath it would be the page arguing
  // with itself.
  const isEmpty = recordCount === 0 && upcomingTables.length === 0;

  return (
    <section className="journal-panel" aria-label={say('Journal', '여권', 'Pasaporte', 'Passeport', 'جواز السفر', '护照', 'パスポート')}>
      <header className="screen-head screen-head--dark">
        <div className="screen-head__row">
          <div>
            <span className="screen-head__kr">여권</span>
            <h1 className="screen-head__title">
              {say('What this trip has been so far.', '이번 여행이 지금까지 어땠는지.', 'Lo que ha sido este viaje hasta ahora.', "Ce qu'a été ce voyage jusqu'ici.", 'ما كانته هذه الرحلة حتى الآن.', '这趟旅行到目前为止是什么样。', 'この旅がここまでどうだったか。')}
            </h1>
          </div>
          {onOpenSummary && (
            <button className="screen-head__link" onClick={onOpenSummary}>
              {say('Share', '공유', 'Compartir', 'Partager', 'مشاركة', '分享', '共有')}
            </button>
          )}
        </div>
        {/* The masthead counted the record and nothing else, so a traveller
            who had just taken a seat was told nothing had happened directly
            above a section listing what was happening on Sunday. The same
            argument the isEmpty check below avoids, one element higher. */}
        <p className="screen-head__sub">
          {recordCount > 0
            ? say(`${recordCount} moment${recordCount === 1 ? '' : 's'} recorded.`,
              `기록된 순간 ${recordCount}개.`,
              `${recordCount} ${recordCount === 1 ? 'momento registrado' : 'momentos registrados'}.`, `${recordCount} ${recordCount === 1 ? 'moment enregistré' : 'moments enregistrés'}.`, `${recordCount} ${recordCount === 1 ? 'لحظة مسجّلة' : 'لحظات مسجّلة'}.`, `${recordCount} 个瞬间已记录。`, `これまでに${recordCount}の瞬間が記録されました。`)
            : upcomingTables.length > 0
              ? say(`Nothing recorded yet — ${upcomingTables.length === 1
                  ? 'one table booked. It lands here after.'
                  : `${upcomingTables.length} tables booked. They land here after.`}`,
              `아직 기록은 없어요 — 잡아 둔 밥상 ${upcomingTables.length}개가 끝나면 여기로 옵니다.`,
              `Todavía no hay nada registrado — ${upcomingTables.length === 1
                  ? 'una mesa reservada. Aparecerá aquí después.'
                  : `${upcomingTables.length} mesas reservadas. Aparecerán aquí después.`}`,
              `Rien d'enregistré pour l'instant — ${upcomingTables.length === 1
                  ? 'une table réservée. Elle arrivera ici ensuite.'
                  : `${upcomingTables.length} tables réservées. Elles arriveront ici ensuite.`}`, `لا شيء مسجّل بعد — ${upcomingTables.length === 1 ? 'مائدة واحدة محجوزة. ستصل إلى هنا بعدها.' : `${upcomingTables.length} موائد محجوزة. ستصل إلى هنا بعدها.`}`, `还没有记录——${upcomingTables.length === 1 ? '已经订了一张饭桌，之后会出现在这里。' : `已经订了 ${upcomingTables.length} 张饭桌，之后会出现在这里。`}`, `まだ記録はありません——${upcomingTables.length === 1 ? '食卓を一つ予約しています。そのあとここに残ります。' : `食卓を${upcomingTables.length}つ予約しています。そのあとここに残ります。`}`)
              : say('Nothing recorded yet — whatever you do lands here.',
                '아직 기록이 없어요 — 무엇을 하시든 여기에 남습니다.', 'Todavía no hay nada registrado — lo que hagas aparecerá aquí.', "Rien d'enregistré pour l'instant — ce que vous ferez apparaîtra ici.", 'لا شيء مسجّل بعد — وما تفعله سيظهر هنا.', '还没有记录——你做的事都会落在这里。', 'まだ記録はありません——何をしても、ここに残ります。')}
        </p>
      </header>

      {/* The person first, then the two tools, then the record — asked for on
          2026-08-05 and it reverses 8/4's ordering, which put the phrasebook
          and the safety sheet above everything on the grounds that they are
          what somebody standing at a counter opens this tab for.

          That reason still holds and is the price of this change, so here it
          is measured rather than waved at: on a 375x812 screen 식탁에서 now
          starts at 0.82 of a screen and 도움이 필요하면 at 1.00 — the help
          sheet's own row has crossed the fold. It is one thumb-flick away
          rather than visible on arrival.

          What buys that back is that this tab is also where a person's own
          details live, and a screen called 여권 opening on somebody else's
          phrasebook instead of on the holder's own name reads like a manual
          rather than a passport. If the emergency numbers ever need to be
          reachable without scrolling, the answer is a place in the app chrome,
          not this screen's running order — this one only ever had room for
          whichever block came first. */}

      {/* A member sees the values every
          table reads — set during signup, editable here, which is the "개개인이
          설정한 설정값을 볼 수 있게" half of the 8/4 direction. A guest sees
          the door those values live behind: 나만의 프로필 만들기, where 만들기
          means signing up, because the profile fields are written as part of
          joining now rather than on this screen. */}
      {isMemberAuth ? (
        <div className="journal-settings">
          <div className="journal-section-header">
            <h3>{say('프로필 · Profile', '프로필', 'Perfil', 'Profil', 'الملف', '资料', 'プロフィール')}</h3>
            {saveState === 'saved' && <span className="save-state is-saved" role="status">{say('✓ 저장됨 · Saved', '✓ 저장됨', '✓ Guardado', '✓ Enregistré', '✓ محفوظ', '✓ 已保存', '✓ 保存済み')}</span>}
            {saveState === 'device' && (
              <span className="save-state is-offline">{say('이 기기에만 저장됨 · Saved here, will sync', '이 기기에만 저장됨', 'Guardado aquí, se sincronizará', 'Enregistré ici, sera synchronisé', 'محفوظ هنا، وسيُزامَن', '已存在本机，之后会同步', 'この端末に保存、あとで同期')}</span>
            )}
          </div>

          {/* What a table will see, read back — and a button to change it.
              The whole form used to sit here permanently, auto-saving, which
              buried the record this screen exists for under nine fields
              nobody was editing. A summary answers the question people
              actually have on this screen ("what does the table know about
              me?") in four lines. */}
          <dl className="profile-summary">
            <div className="profile-summary__row">
              <dt>{say('Name', '이름', 'Nombre', 'Nom', 'الاسم', '名字', '名前')}</dt>
              <dd>{profile?.name?.trim() || <span className="profile-summary__empty">{say('not yet', '아직 없음', 'todavía no', 'pas encore', 'ليس بعد', '还没有', 'まだありません')}</span>}</dd>
            </div>
            <div className="profile-summary__row">
              <dt>{say('From', '출신', 'De dónde', "D'où", 'من أين', '来自', '出身')}</dt>
              <dd>{profile?.nationality?.trim() || <span className="profile-summary__empty">{say('not yet', '아직 없음', 'todavía no', 'pas encore', 'ليس بعد', '还没有', 'まだありません')}</span>}</dd>
            </div>
            <div className="profile-summary__row">
              <dt>{say('Languages', '언어', 'Idiomas', 'Langues', 'اللغات', '语言', '言語')}</dt>
              <dd>
                {(profile?.languages ?? []).length > 0
                  ? languageLine(profile.languages)
                  : <span className="profile-summary__empty">{say('not yet', '아직 없음', 'todavía no', 'pas encore', 'ليس بعد', '还没有', 'まだありません')}</span>}
              </dd>
            </div>
            <div className="profile-summary__row">
              <dt>{say('Does not eat', '못 먹는 것', 'No come', 'Ne mange pas', 'لا يأكل', '不吃', '食べないもの')}</dt>
              <dd>
                {(profile?.avoids ?? []).length > 0 || (profile?.diets ?? []).length > 0 || profile?.allergyNote
                  ? [
                    ...(profile.avoids ?? []).map(restrictionLabel),
                    ...(profile.diets ?? []).map(d => dietById(d)?.kr).filter(Boolean),
                    profile.allergyNote,
                  ].filter(Boolean).join(', ')
                  : <span className="profile-summary__empty">{say('nothing', '없음', 'nada', 'rien', 'لا شيء', '没有', 'ありません')}</span>}
              </dd>
            </div>
          </dl>

          <button className="profile-edit" onClick={() => setProfileOpen(true)} translate="no">
            {say('프로필 설정 · Edit profile', '프로필 설정', 'Editar perfil', 'Modifier le profil', 'تعديل الملف', '编辑资料', 'プロフィールを編集')}
          </button>

          {/* The account row. The email is the one the team can reach;
              showing it back is the only receipt the unverified signup ever
              issues, so a typo at least has somewhere to be seen. */}
          <div className="account-block">
            {profile?.avatarUrl ? (
              <img className="account-avatar" src={profile.avatarUrl} alt="" />
            ) : (
              <AnimalAvatar className="account-avatar" seed={profile?.userId} animal={profile?.avatarAnimal} size={44} />
            )}
            <div className="account-block__body">
              <span className="account-block__email">{auth.email || say('(no email on file)', '(등록된 이메일 없음)', '(sin correo registrado)', '(aucune adresse enregistrée)', '(لا بريد مسجَّل)', '（没有登记邮箱）', '（登録されたメールなし）')}</span>
              <button className="account-signout" onClick={onSignOut}>
                {say('로그아웃 · Sign out', '로그아웃', 'Cerrar sesión', 'Se déconnecter', 'تسجيل الخروج', '退出登录', 'ログアウト')}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="member-gate member-gate--inline">
          <h3 className="member-gate__title">
            <span className="member-gate__title-kr" translate="no">{gateText('passport').titleKr}</span>
            <span className="member-gate__title-en">
              {say(gateText('passport').titleEn, null, gateText('passport').titleEs, gateText('passport').titleFr, gateText('passport').titleAr, gateText('passport').titleZh, gateText('passport').titleJa)}
            </span>
          </h3>
          <p className="member-gate__body">{say(gateText('passport').body, gateText('passport').bodyKo, gateText('passport').bodyEs, gateText('passport').bodyFr, gateText('passport').bodyAr, gateText('passport').bodyZh, gateText('passport').bodyJa)}</p>
          <button className="auth-primary" translate="no" onClick={() => onRequireAuth?.('passport')}>
            {say(gateText('passport').cta, null, gateText('passport').ctaEs, gateText('passport').ctaFr, gateText('passport').ctaAr, gateText('passport').ctaZh, gateText('passport').ctaJa)}
          </button>
        </div>
      )}

      {/* The two tools, under the person they belong to. Both still work
          signed out — a guest sees the gate above and these below it, so the
          sentence somebody needs at a counter is never behind an account. */}
      <button className="journal-tool" onClick={() => setPhrasesOpen(true)}>
        <span className="journal-tool__kr" translate="no">식탁에서</span>
        <span className="journal-tool__body">
          {say('What to say — ordering, what you cannot eat, and something to ask the table. Works with or without a meal booked.',
            '무슨 말을 할지 — 주문할 때, 못 먹는 것을 말할 때, 같이 앉은 사람에게 물어볼 때. 잡아 둔 밥상이 없어도 됩니다.', 'Qué decir: para pedir, para explicar lo que no puedes comer y para preguntar algo en la mesa. Funciona con o sin comida reservada.', "Quoi dire : pour commander, pour expliquer ce que vous ne pouvez pas manger, et pour poser une question à table. Fonctionne avec ou sans repas réservé.", 'ماذا تقول: للطلب، ولشرح ما لا تستطيع أكله، ولتسأل شيئًا على المائدة. يعمل مع وجبة محجوزة أو بدونها.', '该说什么：点菜时、说明自己不能吃什么时、还有想问桌上的人点什么时。有没有订到饭都能用。', '何を言えばいいか——注文するとき、食べられないものを伝えるとき、食卓で何かを尋ねるとき。食事の予約があってもなくても使えます。')}
        </span>
      </button>

      {/* The emergency numbers, the leave-at-any-point line and the report
          channel. No use behind a door you can only find while shopping for a
          specific dinner — which is where they used to live. */}
      <button className="journal-tool journal-tool--help" onClick={() => setSafetyOpen(true)}>
        <span className="journal-tool__kr" translate="no">도움이 필요하면</span>
        <span className="journal-tool__body">
          {say('112, 119, the 24-hour travel helpline, and how to reach the Eatple team. You can leave any meal at any point.',
            '112, 119, 24시간 관광통역안내, 그리고 밥친구 팀에 연락하는 방법. 어느 식사든 언제라도 자리를 뜨셔도 됩니다.', '112, 119, la línea de ayuda al viajero 24 horas y cómo contactar con el equipo de Eatple. Puedes irte de cualquier comida en cualquier momento.', "112, 119, la ligne d'assistance aux voyageurs 24h/24, et comment joindre l'équipe Eatple. Vous pouvez quitter n'importe quel repas à n'importe quel moment.", '112 و119 وخط مساعدة المسافرين على مدار الساعة، وكيف تصل إلى فريق Eatple. تستطيع مغادرة أي وجبة في أي لحظة.', '112、119、24小时旅游咨询热线，以及怎么联系 Eatple 团队。任何一顿饭，你随时都可以离席。', '112、119、24時間の旅行者向け案内、そして Eatple チームへの連絡方法。どの食事でも、いつでも席を立って構いません。')}
        </span>
      </button>

      {/* Above the record, because it has not happened yet. This is also the
          only place a traveller can check what they agreed to — a seat taken
          three days ago is easy to forget and expensive to miss. */}
      {upcomingTables.length > 0 && (
        <div className="journal-section">
          <div className="journal-section-header">
            <h3>{say('Coming up', '다가오는 밥상', 'Próximamente', 'À venir', 'قادم', '即将到来', 'これから')}</h3>
            <span className="journal-badge-count">{upcomingTables.length}</span>
          </div>
          <div className="upcoming-list">
            {upcomingTables.map(t => {
              const menu = menuById(t.menuId);
              if (!menu) return null;
              return (
                <div key={t.id} className="upcoming-row">
                  <span className="upcoming-row__kr" aria-hidden="true">{menu.nameKo}</span>
                  <div className="upcoming-row__body">
                    <span className="upcoming-row__dish">
                      {menu.name}
                      {t.hosted && <span className="upcoming-row__badge">{say('you host', '내가 호스트', 'eres anfitrión', 'vous êtes hôte', 'أنت المضيف', '你是主人', 'あなたがホスト')}</span>}
                      {/* A seat you asked for is not a seat you have. Said
                          on the row itself, because the date and place sit
                          right beneath it and read as a plan either way. */}
                      {t.myRequest && isPending(t.myRequest) && !hasLapsed(t.myRequest, t) && (
                        <span className="upcoming-row__pending">{say('waiting on the host', '호스트 응답 대기', 'esperando al anfitrión', "en attente de l'hôte", 'في انتظار المضيف', '等主人回应', 'ホストの返事待ち')}</span>
                      )}
                      {t.myRequest && hasLapsed(t.myRequest, t) && (
                        <span className="upcoming-row__lapsed">{say('no answer — seat released', '응답 없음 — 자리 풀림', 'sin respuesta: sitio liberado', 'sans réponse : place libérée', 'بلا ردّ: أُفرج عن المقعد', '没有回应：位子已放开', '返事なし：席は解放されました')}</span>
                      )}
                      {t.waiting > 0 && !isCancelled(t) && (
                        <span className="upcoming-row__pending">
                          {say(`${t.waiting} waiting on you`, `${t.waiting}명이 답을 기다림`,
                            `${t.waiting} esperan tu respuesta`, `${t.waiting} en attente de vous`,
                            `${t.waiting} ينتظرون ردّك`, `${t.waiting} 人在等你`, `${t.waiting}人が待っています`)}
                        </span>
                      )}
                      {/* The row stays in "Coming up" rather than vanishing,
                          which is the entire reason cancelling stopped
                          deleting. A line that disappears tells nobody
                          anything; this one is the only warning there is. */}
                      {isCancelled(t) && (
                        <span className="upcoming-row__cancelled">{say('called off — do not go', '취소됨 — 가지 마세요', 'cancelada: no vayas', "annulée : n'y allez pas", 'أُلغيت: لا تذهب', '已取消：别去了', '中止：行かないでください')}</span>
                      )}
                    </span>
                    <span className="upcoming-row__when">
                      {new Date(`${t.date}T00:00`).toLocaleDateString(dateLocale(locale), { weekday: 'short', day: 'numeric', month: 'short' })}
                      {' · '}{t.time} · {t.place}
                    </span>
                    {t.people.length > 0 && (
                      <span className="upcoming-row__who">{say(
                        `with ${t.people.map(p => p.name).join(', ')}`,
                        `${t.people.map(p => p.name).join(', ')}님과 함께`,
                        `con ${t.people.map(p => p.name).join(', ')}`,
                        `avec ${t.people.map(p => p.name).join(', ')}`,
                        `مع ${t.people.map(p => p.name).join('، ')}`,
                        `和${t.people.map(p => p.name).join('、')}一起`,
                        `${t.people.map(p => p.name).join('、')}さんと`)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {days.length > 0 && (
        <div className="journal-section">
          <div className="journal-section-header">
            <h3>{say('Your record', '내 기록', 'Tu registro', 'Votre registre', 'سجلّك', '你的记录', 'あなたの記録')}</h3>
            <span className="journal-badge-count">{say(`${recordCount} moments`, `${recordCount}번`,
              `${recordCount} momentos`, `${recordCount} moments`, `${recordCount} لحظة`,
              `${recordCount} 个瞬间`, `${recordCount}回`)}</span>
          </div>
          <div className="record">
            {days.map(day => (
              <div key={day.key} className="record-day">
                <h4 className="record-day__date">{day.heading}</h4>
                <ul className="record-day__items">
                  {day.items.map(item => (
                    <li key={item.key} className={`record-item record-item--${item.type}`}>
                      <span className="record-item__mark" aria-hidden="true">
                        {item.type === 'save' ? '☆' : '✓'}
                      </span>
                      <span className="record-item__title">{item.title}</span>
                      {item.subtitle && (
                        <span className="record-item__sub">{item.subtitle}</span>
                      )}
                      {/* The diary speaking in its owner's voice — the one
                          line they left on the table afterwards. */}
                      {item.memory && (
                        <span className="record-item__memory">“{item.memory}”</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Moved here from the bottom of the screen on 2026-08-05, and rewritten
          on the way.

          It sat below four counters reading 0 and a goal list reading 0/4 —
          2.2 screens down, so somebody who had just made an account scrolled
          past every zero the app could show before reaching the sentence that
          says what to do about them. The order was backwards: this is the one
          block that is *for* an empty Passport, so it goes where the record
          would have been.

          What it said was inherited too. A stock photograph from
          images.unsplash.com — somebody else's travel, on a public-diplomacy
          project, loaded from a host the service worker passes straight
          through, so the empty state broke on exactly the connection that
          produced it. A title-cased English headline with no Korean beside it,
          on the screen a traveller opens to read Korean. And every rule inline
          rather than in the stylesheet. All of it dates from the K-Food Map
          shell this repo grew out of.

          It keeps both doors, because those were right. */}
      {isEmpty && (
        <div className="journal-empty">
          <p className="journal-empty__kr" translate="no">아직 아무것도 없어요</p>
          <p className="journal-empty__en">
            {say(
              'This fills itself. Ask for a seat at a table, or read your way through a culture — whatever you do lands here, with the date it happened.',
              null,
              'Esto se llena solo. Pide sitio en una mesa, o recorre una cultura leyendo — hagas lo que hagas aparece aquí, con la fecha en que pasó.',
              "Cela se remplit tout seul. Demandez une place à une table, ou parcourez une culture en lisant — quoi que vous fassiez, cela arrive ici, avec la date.",
              'يمتلئ هذا من تلقاء نفسه. اطلب مقعدًا على مائدة، أو اقرأ ثقافة من أوّلها إلى آخرها — ومهما فعلت فإنه يصل إلى هنا، ومعه تاريخ حدوثه.',
              '这里会自己填满。申请一张饭桌的位子，或者把一个文化读完——不管你做什么，它都会带着发生的日期落到这儿。',
              'ここは自分で埋まっていきます。食卓の席をリクエストするか、文化をひとつ読み通すか——何をしても、起きた日付とともにここに残ります。',
            )}
          </p>
          {onNavigate && (
            <div className="journal-empty__ways">
              <button className="journal-empty__cta" translate="no" onClick={() => onNavigate('match')}>
                {say('밥상 찾기 · Find a table', '밥상 찾기', 'Buscar una mesa', 'Trouver une table', 'ابحث عن مائدة', '找一张饭桌', '食卓を探す')}
              </button>
              <button className="journal-empty__ask" translate="no" onClick={() => onNavigate('home')}>
                {say('문화 읽기 · Read a culture', '문화 읽기', 'Leer una cultura', 'Lire une culture', 'اقرأ ثقافة', '读一个文化', '文化を読む')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Four counts, and each one is something this app helped cause.
          "Areas" and "Saved" were here before — a district total is a tourist
          statistic, and a wishlist is not an achievement. */}
      <div className="journal-section passport-summary">
        <div className="journal-section-header">
          <h3>{say('This trip so far', '이번 여행, 지금까지', 'Este viaje hasta ahora', "Ce voyage jusqu'ici", 'هذه الرحلة حتى الآن', '这趟旅行到现在', 'この旅、ここまで')}</h3>
        </div>
        <div className="passport-stats">
          <div className="stat-box">
            <span className="stat-num">{eaten.length}</span>
            <span className="stat-label">{say('밥상 · tables', '밥상', 'mesas', 'tables', 'موائد', '饭桌', '食卓')}</span>
          </div>
          <div className="stat-box">
            <span className="stat-num">{metPeople.length}</span>
            <span className="stat-label">{say('사람 · met', '사람', 'personas', 'rencontres', 'لقاءات', '认识的人', '出会い')}</span>
          </div>
          <div className="stat-box">
            <span className="stat-num">{journey.experienceCount}</span>
            <span className="stat-label">{say('문화 · done', '문화', 'culturas', 'cultures', 'ثقافات', '文化', '文化')}</span>
          </div>
          <div className="stat-box">
            <span className="stat-num">{journey.foodCount}</span>
            <span className="stat-label">{say('장소 · visited', '장소', 'sitios', 'lieux', 'أماكن', '地点', '場所')}</span>
          </div>
        </div>
      </div>

      {/* Where the 저장 button actually puts things. It used to sit last on
          a 2.7-screen page — measured 1804px down on 2026-08-04, after the
          record, the stats, the goals and the people — and it was titled
          "Saved for Later" while the button that fills it says 저장. Two
          names for one thing, at opposite ends of a long scroll, is why the
          8/4 review said "내가 추가한 리스트들이 어디있는지 안보인다". */}
      {savedList.length > 0 && (
        <div className="journal-section">
          <div className="journal-section-header">
            <h3>{say('저장한 곳 · Saved places', '저장한 곳', 'Sitios guardados', 'Lieux enregistrés', 'الأماكن المحفوظة', '保存的地点', '保存した場所')}</h3>
          </div>
          <p className="journal-settings__hint">
            {say(
              `${savedList.length} saved from a place page. Tap one to open it again.`,
              `${savedList.length}곳을 패스포트에 저장했어요. 눌러서 다시 열 수 있어요.`,
              `${savedList.length} guardados desde una página de sitio. Toca uno para abrirlo otra vez.`,
              `${savedList.length} enregistrés depuis une fiche de lieu. Touchez pour rouvrir.`,
              `${savedList.length} محفوظة من صفحات الأماكن. اضغط على أيّها لفتحه من جديد.`,
              `从地点页保存了 ${savedList.length} 处。点一下就能再打开。`,
              `場所のページから${savedList.length}件を保存しました。タップするともう一度開けます。`)}
          </p>
          <div className="journal-grid">
            {savedList.map(({ place, savedAt }) => (
              <button
                key={place.id}
                className="stamp stamp--saved"
                onClick={() => onRestaurantClick(place)}
              >
                <span className="stamp-ring">
                  <img src={place.image} alt="" />
                </span>
                <span className="stamp-name">{place.name.split('(')[0].trim()}</span>
                <span className="stamp-zone">{place.zone}</span>
                {savedAt && <span className="stamp-date">{formatStampDate(savedAt)}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="journal-section">
        <div className="journal-section-header">
          <h3>{say('Worth doing', '해볼 만한 것', 'Merece la pena', 'À faire', 'يستحقّ الفعل', '值得做的', 'やってみる価値')}</h3>
          <span className="journal-badge-count">{goalsDone}/{goals.length}</span>
        </div>
        <ul className="goal-list">
          {goals.map(g => (
            <li key={g.id} className={`goal${g.done ? ' is-done' : ''}`}>
              <span className="goal__mark" aria-hidden="true">{g.done ? '✓' : ''}</span>
              <span className="goal__body">
                <span className="goal__name">{say(g.name, g.nameKo, g.nameEs, g.nameFr, g.nameAr, g.nameZh, g.nameJa)}</span>
                <span className="goal__hint">
                  {g.done
                    ? say('Done.', '완료.', 'Hecho.', 'Fait.', 'تمّ.', '完成。', '完了。')
                    : `${say(g.hint, g.hintKo, g.hintEs, g.hintFr, g.hintAr, g.hintZh, g.hintJa)} ${g.current}/${g.target}`}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {metPeople.length > 0 && (
        <div className="journal-section">
          <div className="journal-section-header">
            <h3>{say('People Met', '만난 사람', 'Personas conocidas', 'Personnes rencontrées', 'من قابلت', '认识的人', '出会った人')}</h3>
          </div>
          <div className="companion-list">
            {metPeople.map(p => (
              <div key={p.key} className="companion-card">
                <AnimalAvatar className="companion-card__avatar" seed={p.key} size={44} />
                <div className="companion-card__body">
                  <span className="companion-card__name">{p.name}</span>
                  <span className="companion-card__meta">
                    {p.nationality ? `${p.nationality} · ` : ''}
                    {say(`shared a table ${formatStampDate(p.metAt)}`, `${formatStampDate(p.metAt)}에 같은 밥상`,
                      `compartió mesa ${formatStampDate(p.metAt)}`, `a partagé une table ${formatStampDate(p.metAt)}`,
                      `شارك مائدة ${formatStampDate(p.metAt)}`, `${formatStampDate(p.metAt)} 同桌`,
                      `${formatStampDate(p.metAt)}に同じ食卓`)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {visitedList.length > 0 && (
        <div className="journal-section">
          <div className="journal-section-header">
            <h3>{say('Visited Places', '가본 곳', 'Sitios visitados', 'Lieux visités', 'أماكن زرتها', '去过的地方', '訪れた場所')}</h3>
          </div>
          <div className="journal-grid">
            {visitedList.map(({ place, visitedAt }) => (
              <button
                key={place.id}
                className="stamp"
                onClick={() => onRestaurantClick(place)}
              >
                <span className="stamp-ring">
                  <img src={place.image} alt="" />
                </span>
                <span className="stamp-name">{place.name.split('(')[0].trim()}</span>
                <span className="stamp-zone">{place.zone}</span>
                {visitedAt && <span className="stamp-date">{formatStampDate(visitedAt)}</span>}
              </button>
            ))}
          </div>
        </div>
      )}


      {/* "cannot review cultures i read through in passport" — a tester's
          note, and they were right: a theme you finished disappeared from
          this screen entirely. Finishing something and then having no way
          back to it is the shape of a reward that is not one.

          Each row says what backed it, using the same three words the stamp
          uses, so the record and the moment agree. */}
      {walkedThemes.length > 0 && (
        <div className="journal-section">
          <div className="journal-section-header">
            <h3>{say('Cultures you walked', '걸어본 문화', 'Culturas recorridas', 'Cultures parcourues', 'ثقافات مشيتها', '走过的文化', '歩いた文化')}</h3>
            <span className="journal-badge-count">{walkedThemes.length}</span>
          </div>
          <div className="walked-list">
            {walkedThemes.map(w => (
              <button
                key={w.theme.id}
                className="walked-row"
                onClick={() => onOpenTheme?.(w.theme.id)}
              >
                <span className="walked-row__body">
                  <span className="walked-row__title">{say(w.theme.title, w.theme.titleKo, w.theme.titleEs, w.theme.titleFr, w.theme.titleAr, w.theme.titleZh, w.theme.titleJa)}</span>
                  {w.theme.titleKo && <span className="walked-row__ko">{w.theme.titleKo}</span>}
                  <span className="walked-row__basis">
                    {w.kind === COMPLETION_KIND.VISITED
                      ? say('Visited', '가봄', 'Visitado', 'Visité', 'زُرتَه', '去过', '行きました')
                      : w.kind === COMPLETION_KIND.MIXED
                        ? say('Part visited, part on your word', '일부는 가봄, 일부는 본인 확인', 'En parte visitado, en parte por tu palabra', 'En partie visité, en partie sur votre parole', 'زُرتَ بعضه، وبعضه على كلمتك', '一部分去过，一部分凭你自己说', '一部は訪問、一部はご自身の申告')
                        : say('On your own word', '본인 확인', 'Por tu palabra', 'Sur votre parole', 'على كلمتك', '凭你自己说', 'ご自身の申告')}
                  </span>
                </span>
                <ChevronRightIcon size={14} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Only appears once there is something to undo — an empty "Blocked"
          section would be a screen explaining a feature nobody has used yet.
          Reversible on purpose: a block made in a bad moment, or the wrong
          row tapped by mistake, should not need the team to fix it. */}
      {blocks.length > 0 && (
        <div className="journal-section">
          <div className="journal-section-header">
            <h3>{say('Blocked', '차단됨', 'Bloqueado', 'Bloqué', 'محظور', '已拉黑', 'ブロック中')}</h3>
            <span className="journal-badge-count">{blocks.length}</span>
          </div>
          <ul className="blocked-list">
            {blocks.map(b => (
              <li key={b.blockedId} className="blocked-row">
                <span className="blocked-row__name">{b.blockedName || say('Someone', '어떤 사람', 'Alguien', "Quelqu'un", 'شخص ما', '某个人', 'ある人')}</span>
                <button className="blocked-row__undo" onClick={() => unblock(b.blockedId)}>
                  {say('Unblock', '차단 해제', 'Desbloquear', 'Débloquer', 'إلغاء الحظر', '解除拉黑', 'ブロックを解除')}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {phrasesOpen && <PhraseSheet avoids={profile?.avoids} onClose={() => setPhrasesOpen(false)} />}
      {safetyOpen && <SafetySheet onClose={() => setSafetyOpen(false)} />}
      {profileOpen && (
        <ProfileSheet
          profile={profile}
          onSave={onProfileChange}
          onClose={() => setProfileOpen(false)}
        />
      )}
    </section>
  );
}
