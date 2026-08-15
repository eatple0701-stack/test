import { bookable } from '../domain/policy/cancellation.js';
import React, { useEffect, useState } from 'react';
import { menuById } from '../domain/catalog/menus.js';
import { listTables, listAllSignups } from '../data/tableRepository.js';
import { ChevronRightIcon } from './Icons';
import { useText } from './localeText.js';

// The banner for a meal that is today.
//
// Taking a seat used to end the app's usefulness: a confirmation line, and
// then nothing until you somehow remembered the details yourself. There are
// no push notifications here and there will not be before the pilot, so the
// only reminder that can exist is the app being unmissable about it when you
// open it.
//
// Everything on it is what somebody standing at a station exit needs, in the
// order they need it: the time, the exit, the name to look for. 토스 words
// this as answering the user's question in three seconds — and "where am I
// going tonight" is the question this app had no answer to.
export default function TodayTable({ profile, onOpenTable }) {
  const say = useText();
  const [mine, setMine] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [tables, signups] = await Promise.all([listTables(), listAllSignups()]);
      const now = new Date();
      const todayKey = now.toDateString();

      const rows = bookable(tables)
        .filter(t =>
          t.hostId === profile?.userId ||
          signups.some(s => s.tableId === t.id && s.userId === profile?.userId))
        .map(t => ({ ...t, at: new Date(`${t.date}T${t.time || '00:00'}`) }))
        // Today only, and not one that finished hours ago. A lunch at 12:30
        // is not news at 11pm, so it drops off two hours after it starts.
        .filter(t =>
          Number.isFinite(t.at.getTime()) &&
          t.at.toDateString() === todayKey &&
          t.at.getTime() > now.getTime() - 2 * 60 * 60 * 1000)
        .sort((a, b) => a.at - b.at)
        .map(t => ({
          ...t,
          hosted: t.hostId === profile?.userId,
          others: [
            ...(t.hostId === profile?.userId ? [] : [t.hostName]),
            ...signups
              .filter(s => s.tableId === t.id && s.userId !== profile?.userId)
              .map(s => s.name),
          ].filter(Boolean),
        }));

      if (alive) setMine(rows);
    })();
    return () => { alive = false; };
  }, [profile]);

  if (mine.length === 0) return null;

  return (
    <>
      {mine.map(t => {
        const menu = menuById(t.menuId);
        if (!menu) return null;
        return (
          <button key={t.id} className="today-table" onClick={() => onOpenTable(t.id)}>
            <span className="today-table__kr" aria-hidden="true">{menu.nameKo}</span>
            <span className="today-table__eyebrow">
              {say(`Today · ${t.time}`, `오늘 · ${t.time}`, `Hoy · ${t.time}`, `Aujourd'hui · ${t.time}`,
                `اليوم · ${t.time}`, `今天 · ${t.time}`, `今日 · ${t.time}`)}
              {t.hosted && <span className="today-table__badge">{say('you host', '내가 호스트', 'eres anfitrión', 'vous êtes hôte', 'أنت المضيف', '你是主人', 'あなたがホスト')}</span>}
            </span>
            <span className="today-table__dish">{menu.name}</span>

            {/* The two lines somebody actually reads at a station exit. */}
            <span className="today-table__where">{t.place}</span>
            {t.others.length > 0 && (
              <span className="today-table__who">{say(
                `Look for ${t.others.join(', ')}`, `${t.others.join(', ')}님을 찾으세요`,
                `Busca a ${t.others.join(', ')}`, `Cherchez ${t.others.join(', ')}`,
                `ابحث عن ${t.others.join('، ')}`, `找${t.others.join('、')}`,
                `${t.others.join('、')}さんを探してください`)}</span>
            )}
            {t.restaurant && (
              <span className="today-table__shop">{say(
                `Eating at ${t.restaurant}`, `${t.restaurant}에서 먹어요`, `Comemos en ${t.restaurant}`,
                `On mange à ${t.restaurant}`, `نأكل في ${t.restaurant}`, `在${t.restaurant}吃`,
                `${t.restaurant}で食べます`)}</span>
            )}

            <span className="today-table__cta">
              {say('Everything about tonight', '오늘 저녁 자세히', 'Todo sobre esta noche', 'Tout sur ce soir', 'كلّ شيء عن هذه الليلة', '今晚的全部', '今夜のすべて')} <ChevronRightIcon size={14} />
            </span>
          </button>
        );
      })}
    </>
  );
}
