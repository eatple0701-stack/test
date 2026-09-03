import React, { useEffect, useState } from 'react';
import { menuById } from '../domain/catalog/menus.js';
import { didHappen } from '../domain/policy/table.js';
import { listTables, listAllSignups } from '../data/tableRepository.js';
import { XIcon, CheckIcon } from './Icons';
import { useText } from './localeText.js';

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
    s.dishes > 0 ? `${s.dishes} ${s.dishes === 1 ? 'dish' : 'dishes'} I didn't want to eat alone` : null,
    s.people > 0 ? `${s.people} ${s.people === 1 ? 'person' : 'people'} met over a meal` : null,
    s.cultures > 0 ? `${s.cultures} Korean food ${s.cultures === 1 ? 'culture' : 'cultures'} walked` : null,
  ].filter(Boolean);
  return lines.join('\n');
}

export default function TravelSummary({ journey, profile, onClose }) {
  const say = useText();
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ tables: 0, dishes: 0, people: 0, dishNames: [] });

  // Read the same way every other screen reads tables, so the Supabase swap
  // reaches the shared card too.
  useEffect(() => {
    let alive = true;
    (async () => {
      const [tables, signups] = await Promise.all([listTables(), listAllSignups()]);
      const mine = tables.filter(t =>
        didHappen(t) && (
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
    <div className="match-modal-backdrop" role="dialog" aria-label={say('Travel summary', '여행 요약', 'Resumen del viaje', 'Résumé du voyage', 'ملخّص الرحلة', '旅行小结', '旅のまとめ')} onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="summary-sheet" onClick={e => e.stopPropagation()}>
        <button className="summary-sheet__close" aria-label="Close" onClick={onClose}>
          <XIcon size={18} />
        </button>

        <div className="summary-card">
          <p className="summary-card__eyebrow">밥친구 잇플 · Eatple</p>
          <h2 className="summary-card__title">{say('Solo trip, shared table', '혼자 온 여행, 함께한 밥상', 'Viaje en solitario, mesa compartida', 'Voyage en solo, table partagée', 'رحلة وحدك، ومائدة مشتركة', '一个人来，一桌人吃', 'ひとりの旅、分け合った食卓')}</h2>

          <div className="summary-card__grid">
            <div>
              <span className="summary-card__num">{summary.tables}</span>
              <span className="summary-card__label">{say('Tables shared', '함께한 밥상', 'Mesas compartidas', 'Tables partagées', 'موائد شاركتها', '一起吃过的饭桌', '一緒にした食卓')}</span>
            </div>
            <div>
              <span className="summary-card__num">{summary.dishes}</span>
              <span className="summary-card__label">{say("Dishes I didn't want to eat alone", '혼자 먹고 싶지 않던 요리', 'Platos que no quería comer a solas', 'Plats que je ne voulais pas manger en solo', 'أطباق لم أرغب في أكلها وحدي', '我不想一个人吃的菜', 'ひとりでは食べたくなかった料理')}</span>
            </div>
            <div>
              <span className="summary-card__num">{summary.people}</span>
              <span className="summary-card__label">{say('People met', '만난 사람', 'Personas conocidas', 'Personnes rencontrées', 'من قابلت', '认识的人', '出会った人')}</span>
            </div>
            <div>
              <span className="summary-card__num">{summary.cultures}</span>
              <span className="summary-card__label">{say('Cultures walked', '걸어본 문화', 'Culturas recorridas', 'Cultures parcourues', 'ثقافات مشيتها', '走过的文化', '歩いた文化')}</span>
            </div>
          </div>

          <div className="summary-card__stamps">
            {stats.dishNames.map(n => (
              <span key={n} className="summary-card__stamp">{n}</span>
            ))}
            {nothingYet && (
              <span className="summary-card__stamp summary-card__stamp--empty">
                {say('No shared table yet. There is nothing to post about a meal that has not happened.',
                  '아직 함께한 밥상이 없어요. 일어나지 않은 식사에 대해서는 올릴 것이 없습니다.',
                  'Todavía no hay ninguna mesa compartida. No hay nada que publicar sobre una comida que no ha ocurrido.', "Pas encore de table partagée. Il n'y a rien à publier sur un repas qui n'a pas eu lieu.", 'لا مائدة مشتركة بعد. لا شيء يُنشَر عن وجبة لم تحدث.', '还没有一起吃过饭。一顿没发生的饭，没什么可发的。', 'まだ一緒にした食卓がありません。起きていない食事について書くことはありません。')}
              </span>
            )}
          </div>

          <p className="summary-card__footer">
            {nothingYet
              ? say('The trip is still young.', '여행은 아직 시작이에요.', 'El viaje acaba de empezar.', 'Le voyage ne fait que commencer.', 'الرحلة ما زالت في أوّلها.', '旅程才刚开始。', '旅はまだこれからです。')
              : say("Don't just visit Korea.", '한국을 구경만 하지 마세요.', 'No te limites a visitar Corea.', 'Ne faites pas que visiter la Corée.', 'لا تكتفِ بزيارة كوريا.', '不要只是来看看韩国。', '韓国を、ただ訪れるだけにしないで。')}
          </p>
        </div>

        <button className="btn-primary" onClick={handleShare} style={{ width: '100%' }}>
          {copied
            ? <><CheckIcon size={17} /> {say('Copied', '복사됨', 'Copiado', 'Copié', 'نُسخ', '已复制', 'コピーしました')}</>
            : say('Share my journey', '내 여정 공유하기', 'Compartir mi recorrido', 'Partager mon parcours', 'شارِك رحلتي', '分享我的旅程', '旅を共有する')}
        </button>
        <p className="summary-sheet__hint">{say('Or screenshot the card above.', '또는 위 카드를 캡처하세요.', 'O haz una captura de la tarjeta de arriba.', 'Ou faites une capture de la carte ci-dessus.', 'أو التقط صورة للبطاقة أعلاه.', '或者把上面这张卡截图。', 'または上のカードを画面に保存してください。')}</p>
      </div>
    </div>
  );
}
