import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, MapPinIcon, CheckIcon } from './Icons';
import { experienceById, experienceIdsOfTheme, narrativesOfTheme, stepsOfNarrative, hasAnchor } from '../domain/catalog/index.js';
import { experienceDone } from '../domain/policy/completion.js';
import { restaurants } from '../data/restaurants';
import { traditionalMarkets } from '../data/experiences';
import { isQuarantined } from '../data/verification';
import { useText } from './localeText.js';

// A Theme as a journey in progress, not a list of experiences.
//
// A real trip is walked one step at a time, so the page leads with the single
// next thing and files the rest around it: what is done, what remains. The
// list is still there — it is just no longer the first thing asked of the
// traveller.
//
// A theme can hold several narratives. The one being walked is the
// most-progressed; the others are offered underneath as alternate paths
// rather than interleaved, which would make "next" ambiguous.
// The pacing values are ids — half-day, full-day, one-evening — and were
// printed with the dash swapped for a space, which happens to read as
// English and stayed English in every setting. An unknown value falls back
// to that same swap rather than to nothing.
const PACING = {
  'half-day': ['Half day', '반나절', 'Media jornada', 'Une demi-journée', 'نصف يوم', '半天'],
  'full-day': ['Full day', '하루 종일', 'Día completo', 'Journée entière', 'يوم كامل', '一整天'],
  evening: ['Evening', '저녁', 'Una noche', 'Une soirée', 'أمسية', '一个晚上'],
};
const pacingLabel = (pacing, say) => {
  const found = PACING[pacing];
  return found ? say(found[0], found[1], found[2], found[3], found[4], found[5]) : String(pacing ?? '').replace('-', ' ');
};

export default function ThemePage({
  theme, journey, onBack, onOpenRestaurant, onToggleAttestation,
  visitedMarkets = [], onToggleMarket, onFindTable,
}) {
  const say = useText();
  const [expandDone, setExpandDone] = useState(false);
  if (!theme) return null;

  const isDone = (exp) => (journey && exp ? experienceDone(exp, journey) : false);

  const narratives = narrativesOfTheme(theme.id);
  const paths = narratives.map(n => {
    const steps = stepsOfNarrative(n.id).map(s => ({ ...s, experience: experienceById(s.experienceId) }));
    const done = steps.filter(s => isDone(s.experience)).length;
    return { narrative: n, steps, done, total: steps.length };
  });

  // The path with the most behind it is the one the traveller is on. Ties go
  // to the first authored, which keeps the choice stable between renders.
  const active = paths.slice().sort((a, b) => b.done - a.done)[0] ?? null;
  const alternates = paths.filter(p => p !== active);

  const stepIds = new Set(paths.flatMap(p => p.steps.map(s => s.experienceId)));
  const loose = experienceIdsOfTheme(theme.id)
    .filter(id => !stepIds.has(id))
    .map(id => ({ experience: experienceById(id), required: false }));

  const activeSteps = active ? active.steps : [];
  const completed = activeSteps.filter(s => isDone(s.experience));
  const remaining = activeSteps.filter(s => !isDone(s.experience));
  const next = remaining[0] ?? null;

  const themeDone = activeSteps.length > 0 && remaining.length === 0;
  const totalDone = experienceIdsOfTheme(theme.id).filter(id => isDone(experienceById(id))).length;
  const totalAll = experienceIdsOfTheme(theme.id).length;
  const pct = totalAll === 0 ? 0 : Math.round((totalDone / totalAll) * 100);

  const venuesFor = (exp) =>
    exp.restaurantIds.map(id => restaurants.find(r => r.id === id)).filter(r => r && !isQuarantined(r));

  // A step anchored to a market used to render as a dead end: no restaurant to
  // open, no attestation allowed, and a hint saying the places were still
  // being verified — which was untrue. The market is verified, the traveller
  // just had no way to say they had been. Marking one is the same action the
  // Explore feed already offers; it belongs on the step that asks for it.
  const marketsFor = (exp) =>
    exp.marketIds.map(id => traditionalMarkets.find(m => m.id === id)).filter(Boolean);

  const marketVisited = (id) => visitedMarkets.some(e => e.id === id);

  // Attestation is the completion route for an experience with nothing to
  // visit. The policy refuses it for anchored experiences on purpose — it
  // must not become a way to tick off a restaurant you never went to — so the
  // control only appears where it is genuinely the intended path.
  const canAttest = (exp) => exp.acceptsSelfAttest && !hasAnchor(exp);

  const renderNextCard = (step) => {
    const exp = step.experience;
    const venues = venuesFor(exp);
    const markets = marketsFor(exp);
    return (
      <div className="next-step">
        <span className="next-step__label">{say('Next step', '다음 단계', 'Siguiente paso', 'Étape suivante', 'الخطوة التالية', '下一步')}</span>
        <h3 className="next-step__title">
          {say(exp.title, exp.titleKo, exp.titleEs, exp.titleFr, exp.titleAr, exp.titleZh)}
          {/* The Korean name under the heading is a gloss, so it goes when the
              heading is already that word — otherwise Korean-only reads
              "사찰음식 사찰음식". */}
          {exp.titleKo && say(exp.title, exp.titleKo, exp.titleEs, exp.titleFr, exp.titleAr, exp.titleZh) !== exp.titleKo && (
            <span className="next-step__kr" translate="no">{exp.titleKo}</span>
          )}
        </h3>
        {step.transition && (
          <p className="next-step__transition">
            {say(step.transition, step.transitionKo, step.transitionEs, step.transitionFr, step.transitionAr, step.transitionZh)}
          </p>
        )}
        <p className="next-step__why">{say(exp.whyItMatters, exp.whyItMattersKo, exp.whyItMattersEs, exp.whyItMattersFr, exp.whyItMattersAr, exp.whyItMattersZh)}</p>

        <div className="next-step__mission">
          <span className="next-step__mission-label">{say('Mission', '미션', 'Misión', 'Mission', 'مهمّة', '任务')}</span>
          <p>
            <strong>{say(exp.mission, exp.missionKo, exp.missionEs, exp.missionFr, exp.missionAr, exp.missionZh).title}</strong>
            {' — '}
            {say(exp.mission, exp.missionKo, exp.missionEs, exp.missionFr, exp.missionAr, exp.missionZh).detail}
          </p>
        </div>

        {venues.length > 0 && (
          <div className="next-step__venues">
            {venues.map(v => (
              <button key={v.id} className="theme-venue" onClick={() => onOpenRestaurant(v)}>
                <MapPinIcon size={14} />
                <span>{v.name.split('(')[0].trim()}</span>
                <ChevronRightIcon size={14} />
              </button>
            ))}
            <p className="next-step__hint">
              {say('Mark a place visited to complete this step.',
                '장소를 가봤다고 표시하면 이 단계가 완료됩니다.',
                'Marca un sitio como visitado para completar este paso.', 'Marquez une adresse comme visitée pour terminer cette étape.', 'ضع علامة زُرت مكانًا لإتمام هذه الخطوة.', '把一个地方标记为去过，就完成这一步。')}
            </p>
          </div>
        )}

        {markets.length > 0 && onToggleMarket && (
          <div className="next-step__venues">
            {markets.map(m => (
              <button
                key={m.id}
                className={`next-step__done${marketVisited(m.id) ? ' is-done' : ''}`}
                onClick={() => onToggleMarket(m.id)}
              >
                <CheckIcon size={17} />{' '}
                {marketVisited(m.id)
                  ? `${m.name} — visited`
                  : `방문 체크 · I have been to ${m.name}`}
              </button>
            ))}
          </div>
        )}

        {canAttest(exp) && (
          <button
            className="next-step__done"
            onClick={() => onToggleAttestation(exp.id)}
          >
            <CheckIcon size={17} /> 완료 체크 · Mark this done
          </button>
        )}

        {!venues.length && !markets.length && !canAttest(exp) && (
          <p className="next-step__hint">
            {say('No verified place yet, and this step needs one — it will open up as venues are confirmed.',
              '아직 확인된 장소가 없고 이 단계에는 장소가 필요합니다 — 장소가 확인되는 대로 열립니다.',
              'Aún no hay un sitio verificado y este paso lo necesita: se abrirá según se confirmen locales.', "Pas encore d'adresse vérifiée, et cette étape en demande une : elle s'ouvrira à mesure que des lieux seront confirmés.", 'لا مكان موثّقًا بعد، وهذه الخطوة تحتاج واحدًا: ستُفتح كلّما تأكّدت أماكن.', '还没有确认过的地方，而这一步需要一个：随着场所陆续确认，它会打开。')}
          </p>
        )}
      </div>
    );
  };

  const renderRow = (item, { done }) => {
    const exp = item.experience;
    if (!exp) return null;
    // Rows offer the market tick only where there is exactly one market to
    // mean — with two anchors a single tick would be guessing which one.
    const rowMarkets = marketsFor(exp);
    const soleMarket = rowMarkets.length === 1 ? rowMarkets[0] : null;
    return (
      <li key={exp.id} className={`step-row${done ? ' is-done' : ''}`}>
        <span className="step-row__mark" aria-hidden="true">
          {done ? <CheckIcon size={12} /> : <span className="step-row__dot" />}
        </span>
        <div className="step-row__body">
          <span className="step-row__title">{say(exp.title, exp.titleKo, exp.titleEs, exp.titleFr, exp.titleAr, exp.titleZh)}</span>
          {item.required === false && (
            <span className="step-row__optional">{say('optional', '선택', 'opcional', 'facultatif', 'اختياري', '可选')}</span>
          )}
        </div>
        {!done && canAttest(exp) && (
          <button
            className="step-row__check"
            aria-label={`Mark ${exp.title} done`}
            onClick={() => onToggleAttestation(exp.id)}
          >
            <CheckIcon size={14} />
          </button>
        )}
        {!done && !canAttest(exp) && soleMarket && onToggleMarket && (
          <button
            className="step-row__check"
            aria-label={`Mark ${soleMarket.name} visited`}
            onClick={() => onToggleMarket(soleMarket.id)}
          >
            <CheckIcon size={14} />
          </button>
        )}
        {done && canAttest(exp) && (
          <button
            className="step-row__undo"
            onClick={() => onToggleAttestation(exp.id)}
          >
            {say('undo', '되돌리기', 'deshacer', 'annuler', 'تراجع', '撤销')}
          </button>
        )}
      </li>
    );
  };

  return (
    <section className="theme-page" aria-label={theme.title}>
      <header className="theme-page__nav">
        <button className="theme-page__back" onClick={onBack}>
          <ChevronLeftIcon size={18} />
          <span>{say('Explore', '문화', 'Cultura', 'Culture', 'ثقافة', '文化')}</span>
        </button>
      </header>

      <div className="theme-page__hero">
        <span className="theme-page__emoji">{theme.emoji}</span>
        <h1>{say(theme.title, theme.titleKo, theme.titleEs, theme.titleFr, theme.titleAr, theme.titleZh)}</h1>
        <p className="theme-page__tagline">{say(theme.tagline, theme.taglineKo, theme.taglineEs, theme.taglineFr, theme.taglineAr, theme.taglineZh)}</p>
        {theme.status === 'preview' && (
          <span className="theme-page__badge">
            {say('Preview · venues still being verified',
              '미리보기 · 장소는 아직 확인 중',
              'Vista previa · sitios aún en verificación', 'Aperçu · adresses encore en vérification', 'معاينة · أماكن ما زالت قيد التوثيق', '预览 · 场所仍在确认中')}
          </span>
        )}
        <div className="theme-page__progress">
          <div className="theme-page__bar"><div style={{ width: `${pct}%` }} /></div>
          <span>
            {say(`${totalDone} / ${totalAll} experiences`,
              `경험 ${totalAll}개 중 ${totalDone}개`,
              `${totalDone} / ${totalAll} experiencias`, `${totalDone} / ${totalAll} expériences`, `${totalDone} / ${totalAll} تجربة`, `${totalDone} / ${totalAll} 个体验`)}
          </span>
        </div>
      </div>

      <div className="theme-page__body">
        {/* Where you are — the single next thing, or the finish */}
        {themeDone ? (
          <div className="theme-complete">
            <span className="theme-complete__mark"><CheckIcon size={22} /></span>
            <h3>{say('Theme complete', '이 문화 완주', 'Cultura completada', 'Culture terminée', 'اكتملت الثقافة', '这个文化走完了')}</h3>
            <p>
              {active
                ? say(active.narrative.outro, active.narrative.outroKo, active.narrative.outroEs, active.narrative.outroFr, active.narrative.outroAr, active.narrative.outroZh)
                : say('You have walked this path end to end.',
                  '이 길을 끝까지 걸으셨습니다.',
                  'Has recorrido este camino de principio a fin.', "Vous avez parcouru ce chemin d'un bout à l'autre.", 'مشيتَ هذا الطريق من طرفه إلى طرفه.', '这条路你从头走到了尾。')}
            </p>
          </div>
        ) : next ? (
          renderNextCard(next)
        ) : (
          <p className="theme-page__intro">
            {say('This theme has no path authored yet.',
              '이 문화에는 아직 걸을 길이 만들어지지 않았어요.',
              'Esta cultura todavía no tiene un camino escrito.', "Cette culture n'a pas encore de chemin écrit.", 'هذه الثقافة ليس لها طريق مكتوب بعد.', '这个文化还没有写好的路。')}
          </p>
        )}

        {active && (
          <p className="theme-page__pathname">
            {say('On the path: ', '걷는 길: ', 'En el camino: ', 'Sur le chemin : ', 'على الطريق: ', '在这条路上：')}
            <strong>{say(active.narrative.title, active.narrative.titleKo, active.narrative.titleEs, active.narrative.titleFr, active.narrative.titleAr, active.narrative.titleZh)}</strong>
            <span className="theme-page__pacing">{pacingLabel(active.narrative.pacing, say)}</span>
          </p>
        )}

        {/* What is left */}
        {remaining.length > 1 && (
          <section className="theme-page__section">
            <div className="theme-page__section-head">
              <h2>{say('Still to come', '아직 남은 것', 'Lo que queda', 'Ce qui reste', 'ما تبقّى', '还剩下')}</h2>
            </div>
            <ol className="step-rows">{remaining.slice(1).map(s => renderRow(s, { done: false }))}</ol>
          </section>
        )}

        {/* What is behind you */}
        {completed.length > 0 && (
          <section className="theme-page__section">
            <div className="theme-page__section-head">
              <h2>{say('Completed', '완료', 'Completado', 'Terminé', 'اكتمل', '已完成')}</h2>
              <button className="theme-page__toggle" onClick={() => setExpandDone(v => !v)}>
                {expandDone ? 'Hide' : `Show ${completed.length}`}
              </button>
            </div>
            {expandDone && (
              <ol className="step-rows">{completed.map(s => renderRow(s, { done: true }))}</ol>
            )}
          </section>
        )}

        {alternates.length > 0 && (
          <section className="theme-page__section">
            <div className="theme-page__section-head">
              <h2>{say('Another way through', '다른 길로 가기', 'Otro camino', 'Un autre chemin', 'طريق آخر', '另一条路')}</h2>
            </div>
            {alternates.map(p => (
              <div key={p.narrative.id} className="alt-path">
                <h3>{say(p.narrative.title, p.narrative.titleKo, p.narrative.titleEs, p.narrative.titleFr, p.narrative.titleAr, p.narrative.titleZh)}</h3>
                <p>{say(p.narrative.intro, p.narrative.introKo, p.narrative.introEs, p.narrative.introFr, p.narrative.introAr, p.narrative.introZh)}</p>
                <span className="alt-path__meta">
                  {p.done}/{p.total} · {pacingLabel(p.narrative.pacing, say)}
                </span>
              </div>
            ))}
          </section>
        )}

        {loose.length > 0 && (
          <section className="theme-page__section">
            <div className="theme-page__section-head">
              <h2>{say('Also part of this theme', '이 문화에 속한 다른 것', 'También parte de esta cultura', 'Fait aussi partie de cette culture', 'جزء أيضًا من هذه الثقافة', '也属于这个文化')}</h2>
            </div>
            <ol className="step-rows">
              {loose.map(item => renderRow(item, { done: isDone(item.experience) }))}
            </ol>
          </section>
        )}

        {/* The way out of a culture and into the product.
            A theme page had three controls: back, and two restaurant names.
            Somebody reading why a monk leaves nothing on the plate, and
            wanting to go and find out, had no route to the one thing this app
            does. The link is to the table list rather than to any particular
            dish — claiming a culture maps onto a menu would be a connection
            the catalog does not make for most of these. */}
        {onFindTable && (
          <section className="theme-page__section">
            <button className="theme-cta" onClick={() => onFindTable(theme.id)}>
              <span className="theme-cta__title" translate="no">
                {say('같이 먹을 사람 찾기', '같이 먹을 사람 찾기', 'Busca con quién comer', 'Trouver avec qui manger', 'ابحث عمّن تأكل معه', '找人一起吃')}
              </span>
              <span className="theme-cta__sub">
                {say('Most of this is better with somebody. See who has a table open.',
                  '이 중 대부분은 누군가와 함께일 때 더 좋습니다. 누가 상을 열어 뒀는지 보세요.',
                  'Casi todo esto es mejor acompañado. Mira quién tiene una mesa abierta.', 'Presque tout cela est meilleur à plusieurs. Regardez qui a une table ouverte.', 'معظم هذا أفضل مع الناس. انظر من عنده مائدة مفتوحة.', '这里大半的事，有人一起会更好。看看谁开着饭桌。')}
              </span>
            </button>
          </section>
        )}
      </div>
    </section>
  );
}
