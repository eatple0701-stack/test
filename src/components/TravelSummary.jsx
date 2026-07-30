import React, { useEffect, useState } from 'react';
import { menuById } from '../domain/catalog/menus.js';
import { isPast } from '../domain/policy/table.js';
import { listTables, listAllSignups } from '../data/tableRepository.js';
import { XIcon, CheckIcon } from './Icons';

// The shareable end of the loop — 계획서 핵심기능 5, the thing that actually
// leaves the app and lands on somebody's feed.
//
// It used to summarise the restaurant-finder: foods, districts, markets,
// cuisines, and a challenge tally. None of that is what happened. What
// happened is that somebody sat down with a stranger and ate a dish they
// could not have ordered on their own, and that is what a card carrying this
// project's name outward should say.
//
// Plain text under the hood on purpose: the card gets screenshotted and the
// copied text carries the same numbers, so nothing is claimed on the way out
// that the app cannot back.
function summaryText(s) {
  const lines = [
    '🇰🇷 밥친구 · Solo trip, shared table',
    `${s.tables} ${s.tables === 1 ? 'table' : 'tables'} shared with people I had not met`,
    s.dishes > 0 ? `${s.dishes} ${s.dishes === 1 ? 'dish' : 'dishes'} I could not have ordered alone` : null,
    s.people > 0 ? `${s.people} ${s.people === 1 ? 'person' : 'people'} met over a meal` : null,
    s.cultures > 0 ? `${s.cultures} Korean food ${s.cultures === 1 ? 'culture' : 'cultures'} walked` : null,
  ].filter(Boolean);
  return lines.join('\n');
}

export default function TravelSummary({ journey, profile, onClose }) {
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ tables: 0, dishes: 0, people: 0, dishNames: [] });

  // Read the same way every other screen reads tables, so the Supabase swap
  // reaches the shared card too.
  useEffect(() => {
    let alive = true;
    (async () => {
      const [tables, signups] = await Promise.all([listTables(), listAllSignups()]);
      const mine = tables.filter(t =>
        isPast(t) && (
          t.hostId === profile?.userId ||
          signups.some(s => s.tableId === t.id && s.userId === profile?.userId)));
      const names = new Set();
      const people = new Set();
      for (const t of mine) {
        const menu = menuById(t.menuId);
        if (menu) names.add(menu.name);
        if (t.hostId !== profile?.userId) people.add(`host-${t.id}`);
        for (const s of signups.filter(x => x.tableId === t.id && x.userId !== profile?.userId)) {
          people.add(s.userId || s.id);
        }
      }
      if (alive) {
        setStats({ tables: mine.length, dishes: names.size, people: people.size, dishNames: [...names] });
      }
    })();
    return () => { alive = false; };
  }, [profile]);

  const summary = { ...stats, cultures: journey.experienceCount };
  const nothingYet = stats.tables === 0;

  const handleShare = async () => {
    const text = summaryText(summary);
    if (navigator.share) {
      try {
        await navigator.share({ title: '밥친구 · Solo trip, shared table', text });
        return;
      } catch { /* user dismissed the sheet — fall through to copy */ }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch { /* clipboard blocked; the card itself is still screenshottable */ }
  };

  return (
    <div className="match-modal-backdrop" role="dialog" aria-label="Travel summary" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="summary-sheet" onClick={e => e.stopPropagation()}>
        <button className="summary-sheet__close" aria-label="Close" onClick={onClose}>
          <XIcon size={18} />
        </button>

        <div className="summary-card">
          <p className="summary-card__eyebrow">밥친구 · Eatple</p>
          <h2 className="summary-card__title">Solo trip, shared table</h2>

          <div className="summary-card__grid">
            <div>
              <span className="summary-card__num">{summary.tables}</span>
              <span className="summary-card__label">Tables shared</span>
            </div>
            <div>
              <span className="summary-card__num">{summary.dishes}</span>
              <span className="summary-card__label">Dishes I could not order alone</span>
            </div>
            <div>
              <span className="summary-card__num">{summary.people}</span>
              <span className="summary-card__label">People met</span>
            </div>
            <div>
              <span className="summary-card__num">{summary.cultures}</span>
              <span className="summary-card__label">Cultures walked</span>
            </div>
          </div>

          <div className="summary-card__stamps">
            {stats.dishNames.map(n => (
              <span key={n} className="summary-card__stamp">{n}</span>
            ))}
            {nothingYet && (
              <span className="summary-card__stamp summary-card__stamp--empty">
                No shared table yet. There is nothing to post about a meal that
                has not happened.
              </span>
            )}
          </div>

          <p className="summary-card__footer">
            {nothingYet ? 'The trip is still young.' : "Don't just visit Korea."}
          </p>
        </div>

        <button className="btn-primary" onClick={handleShare} style={{ width: '100%' }}>
          {copied ? <><CheckIcon size={17} /> Copied</> : 'Share my journey'}
        </button>
        <p className="summary-sheet__hint">Or screenshot the card above.</p>
      </div>
    </div>
  );
}
