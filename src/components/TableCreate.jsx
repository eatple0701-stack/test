import React, { useMemo, useState } from 'react';
import {
  menus, menuById, CATEGORY_LABEL, defaultHourFor, eatenAtLabels,
} from '../domain/catalog/menus.js';
import { validateNewTable } from '../domain/policy/table.js';
import { MEETING_NOTE_MAX } from '../domain/policy/meeting.js';
import { GUIDES, TABLE_KIND_LABEL } from '../domain/catalog/hosts.js';
import { LANGUAGES, cleanLanguages } from '../domain/catalog/languages.js';
import { createTable } from '../data/tableRepository.js';
import { conflictsFor } from '../data/profile';
import HostBrief from './HostBrief';
import RulesConsent from './RulesConsent';
import { PURPOSE } from '../content/safety.js';
import { agreedToRules } from '../domain/policy/consent.js';
import { ChevronLeftIcon } from './Icons';

// Opening a table.
//
// The dish is chosen first and everything else follows from it, because the
// dish is the thing being offered — a host is not booking a restaurant, they
// are saying "I am eating this, there is room". Choosing the dish first also
// lets the form tell you the minimum before you pick a number of seats
// instead of rejecting you afterwards.

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function TableCreate({ profile, onProfileChange, onBack, onCreated, prefill }) {
  // A request arriving from 찾는 밥상 already named the dish and the day.
  const [menuId, setMenuId] = useState(prefill?.menuId ?? null);
  const [date, setDate] = useState(prefill?.date ?? '');
  const [time, setTime] = useState(() => defaultHourFor(prefill?.menuId) ?? '19:00');
  // Whether the host has set the time themselves. Without this, an hour the
  // app moved for 감자탕 survived a switch to 백반 — a dish with no recorded
  // time inheriting one from the dish before it, which is the app treating
  // its own guess as somebody's decision.
  const [timeTouched, setTimeTouched] = useState(false);
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
  const [hostName, setHostName] = useState(profile?.name ?? '');
  const [guides, setGuides] = useState([]);
  // Their own profile answer, so the question is not asked twice.
  const [languages, setLanguages] = useState(
    () => cleanLanguages(prefill?.languages ?? profile?.languages));
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const menu = menuId ? menuById(menuId) : null;

  const problems = useMemo(() => {
    const list = validateNewTable({ menuId, date, time, place, seats }, menu);
    if (!hostName.trim()) list.push('Add the name your guests should call you.');
    return list;
  }, [menuId, date, time, place, seats, menu, hostName]);

  const submit = async () => {
    setSubmitted(true);
    if (problems.length > 0 || saving) return;
    setSaving(true);
    const row = await createTable({
      menuId, date, time, place: place.trim(), restaurant: restaurant.trim(), guides, languages,
      seats: Number(seats), note: note.trim(), meetingNote, chatUrl,
      hostId: profile?.userId, hostName: hostName.trim(), hostNationality: profile?.nationality,
      hostGender: profile?.gender ?? null,
    });
    onProfileChange?.({ ...profile, name: hostName.trim() });
    onCreated(row.id);
  };

  // A host agrees to the same rules a guest does, and for a stronger reason:
  // they are the one setting the terms of the evening. Gating the whole form
  // rather than the submit button keeps somebody from filling in a dish, a
  // date and a place before finding out there was a condition.
  if (!agreedToRules(profile, PURPOSE.version)) {
    return (
      <section className="sheet-page" aria-label="Open a table">
        <header className="sheet-page__head">
          <button className="sheet-page__back" onClick={onBack} aria-label="Back">
            <ChevronLeftIcon size={20} />
          </button>
          <h1>상 차리기 · Open a table</h1>
        </header>
        <div className="form-block">
          <h2 className="form-label">Before your first table</h2>
          <RulesConsent
            profile={profile}
            onProfileChange={onProfileChange}
            action="open a table"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="sheet-page" aria-label="Open a table">
      <header className="sheet-page__head">
        <button className="sheet-page__back" onClick={onBack} aria-label="Back">
          <ChevronLeftIcon size={20} />
        </button>
        <h1>상 차리기 · Open a table</h1>
      </header>

      {/* Before the first field, because these are the terms of the evening
          and not a footnote to it. Removes itself once they have hosted. */}
      <HostBrief profile={profile} />

      <div className="form-block">
        <h2 className="form-label">What are you eating?</h2>
        <div className="dish-grid">
          {menus.map(m => (
            <button
              key={m.id}
              className={`dish-option${menuId === m.id ? ' is-on' : ''}`}
              onClick={() => {
                setMenuId(m.id);
                // Never leave a seat count below the dish's own minimum.
                setSeats(s => Math.max(Number(s) || 0, m.minPeople, 2));
                // 감자탕 at 19:00 was the form's guess, not the dish's. Only
                // moved where the catalog actually knows — a dish with no
                // recorded time keeps whatever the host already set.
                if (!timeTouched) setTime(defaultHourFor(m.id) ?? '19:00');
              }}
            >
              <span className="dish-option__kr">{m.nameKo}</span>
              <span className="dish-option__name">{m.name}</span>
              {/* The romanisation is a sound, not a meaning. Testers could not
                  tell what half these words were until they opened one. */}
              <span className="dish-option__gloss">{m.gloss}</span>
              <span className="dish-option__min">
                {m.minPeople > 1 ? `${m.minPeople}+ people` : 'Any size'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {menu && (
        <div className="form-block">
          <div className="dish-brief">
            <span className="dish-brief__cat">{CATEGORY_LABEL[menu.category]?.en}</span>
            <p className="dish-brief__how">{menu.howItWorks}</p>
            {eatenAtLabels(menu.id).length > 0 && (
              <p className="dish-brief__when">
                주로 {eatenAtLabels(menu.id).map(l => l.kr).join(' · ')} ·
                {' '}Usually eaten in the {eatenAtLabels(menu.id).map(l => l.en).join(' or ')}
              </p>
            )}
            {menu.contains.length > 0 && (
              <p className="dish-brief__contains">Contains {menu.contains.join(', ')}</p>
            )}
            {conflictsFor(menu, profile).length > 0 && (
              <p className="detail-conflict">
                You said you do not eat {conflictsFor(menu, profile).join(' or ')} — you can still
                host this, you just will not be eating all of it.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="form-block">
        <h2 className="form-label">When and where?</h2>
        <div className="field-row">
          <label className="field">
            <span className="field__label">Date</span>
            <input type="date" value={date} min={todayISO()} onChange={e => setDate(e.target.value)} />
          </label>
          <label className="field">
            <span className="field__label">Time</span>
            <input
              type="time"
              value={time}
              onChange={e => { setTime(e.target.value); setTimeTouched(true); }}
            />
          </label>
        </div>
        <label className="field">
          <span className="field__label">Where you will meet</span>
          <input
            type="text"
            value={place}
            placeholder="Exit 4, Jongno 3-ga station"
            onChange={e => setPlace(e.target.value)}
          />
        </label>

        {/* The shop, which is not the same as the meeting point. A table that
            named a station exit and nothing else left a guest with no idea
            where they were actually eating. Optional on purpose — a host who
            has not decided says so, rather than inventing a name. */}
        <label className="field">
          <span className="field__label">Which restaurant? (optional)</span>
          <input
            type="text"
            value={restaurant}
            placeholder="Sae Ma Eul Sikdang, or leave blank to decide together"
            onChange={e => setRestaurant(e.target.value)}
          />
        </label>
      </div>

      <div className="form-block">
        <h2 className="form-label">How many at the table?</h2>
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
          Counting you. {menu && menu.minPeople > 1
            ? `${menu.name} needs ${menu.minPeople} or more.`
            : 'A table needs at least two.'}
        </p>
      </div>

      {/* The single fact a traveller weighs hardest and the app never printed.
          Pre-filled from the host's own profile, because they have already
          answered this once and being asked twice is how a form stops feeling
          like it is on your side. */}
      <div className="form-block">
        <h2 className="form-label">언어 · What will this table run in?</h2>
        <p className="form-label__hint">
          Shown on your table. Somebody deciding whether to sit with four strangers
          is mostly deciding whether they will understand anything.
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
                {l}
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
        <h2 className="form-label">문화 가이드 · What will you walk the table through?</h2>
        <p className="form-label__hint">
          Optional. Whatever you tick is shown on your table, in your guests&rsquo; language,
          so they know what to expect before they ask for a seat.
        </p>

        {/* The consequence of the ticks, said while they are being ticked.
            The two kinds are derived from this rather than asked separately,
            so a host should be able to see which one they are making. */}
        <p className="kind-preview">
          <span className={`kind-preview__tag is-${guides.length > 0 ? 'hosted' : 'mates'}`}>
            {guides.length > 0 ? TABLE_KIND_LABEL.hosted.kr : TABLE_KIND_LABEL.mates.kr}
          </span>
          {guides.length > 0
            ? ' — you are offering to walk the table through it.'
            : ' — tick nothing and yours is a table where everyone works it out together. That is a real table too.'}
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
            이게 이 앱이 하는 일입니다 · This is the part of 밥친구 that is not
            just a group booking — a Korean host teaching a stranger their
            own food, in a language the stranger understands.
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
        <h2 className="form-label">Your name</h2>
        <label className="field">
          <input
            type="text"
            value={hostName}
            /* Was "What people should look for", which asked the recognition
               question on the name field and then had nowhere to put the
               answer. A host taking it at its word would have called
               themselves "red jacket by the stairs". The real question is the
               field below. */
            placeholder="What your guests should call you"
            onChange={e => setHostName(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field__label">How will they spot you? (optional)</span>
          <input
            type="text"
            value={meetingNote}
            maxLength={MEETING_NOTE_MAX}
            placeholder="Green jacket, by the CU on the corner"
            onChange={e => setMeetingNote(e.target.value)}
          />
          <span className="field__note">
            Only people with a seat see this — not everyone browsing. The app has no chat and no
            phone numbers, so this is how somebody finds you at {place.trim() || 'the meeting point'}.
          </span>
        </label>
        <label className="field">
          <span className="field__label">오픈채팅 링크 · Open chat link (optional)</span>
          <input
            type="url"
            value={chatUrl}
            placeholder="https://open.kakao.com/o/..."
            onChange={e => setChatUrl(e.target.value)}
          />
          <span className="field__note">
            Make a KakaoTalk open chat and paste its link — your confirmed guests
            see it, nobody else does. It is the "running 10 minutes late" channel
            the app itself does not have. https links only.
          </span>
        </label>
        <label className="field">
          <span className="field__label">Anything to say? (optional)</span>
          <textarea
            rows={3}
            value={note}
            placeholder="First time grilling is fine — I will do the scissors."
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
          {saving ? 'Opening…' : '테이블 열기 · Open the table'}
        </button>
      </div>
    </section>
  );
}
