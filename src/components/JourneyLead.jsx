import React from 'react';
import { ChevronRightIcon, SparkleIcon } from './Icons';
import { useText } from './localeText.js';

// The first thing on Explore, and the app's answer to "what do I do today?".
//
// A theme grid asks the traveller to browse a taxonomy. This asks nothing:
// either you are partway through something and it offers the next step, or
// you have not started and it offers one concrete place to begin.
//
// Two states, because a first-run traveller has no journey and an empty
// progress card would be worse than no card at all.
export default function JourneyLead({
  continueTheme,     // { themeId, title, done, total, pct } | null
  nextExperience,    // { id, title } | null
  suggestedTheme,    // a published theme record, for the start state
  onOpenTheme,
  onOpenSummary,
}) {
  const say = useText();
  const resuming = Boolean(continueTheme);
  const theme = resuming ? continueTheme : suggestedTheme;
  if (!theme) return null;

  return (
    <div className="journey-lead">
      <div className="journey-lead__top">
        <span className="journey-lead__eyebrow">
          {resuming
            ? say('🔥 Continue your journey', '🔥 이어서 걷기', '🔥 Sigue tu recorrido', '🔥 Poursuivre votre parcours', '🔥 واصِل رحلتك', '🔥 接着走你的旅程')
            : say('✨ Start your journey', '✨ 여정 시작하기', '✨ Empieza tu recorrido', '✨ Commencer votre parcours', '✨ ابدأ رحلتك', '✨ 开始你的旅程')}
        </span>
        {onOpenSummary && resuming && (
          <button className="journey-lead__summary" onClick={onOpenSummary}>
            {say('Passport', '여권', 'Pasaporte', 'Passeport', 'جواز السفر', '护照')} <ChevronRightIcon size={13} />
          </button>
        )}
      </div>

      <h2 className="journey-lead__title">
        {resuming
          ? say(continueTheme.title, continueTheme.titleKo, continueTheme.titleEs, continueTheme.titleFr, continueTheme.titleAr, continueTheme.titleZh)
          : say(suggestedTheme.title, suggestedTheme.titleKo, suggestedTheme.titleEs, suggestedTheme.titleFr, suggestedTheme.titleAr, suggestedTheme.titleZh)}
      </h2>

      {resuming ? (
        <>
          <p className="journey-lead__line">
            {say(`${continueTheme.done} of ${continueTheme.total} experiences done`,
              `경험 ${continueTheme.total}개 중 ${continueTheme.done}개 완료`,
              `${continueTheme.done} de ${continueTheme.total} experiencias hechas`, `${continueTheme.done} expériences sur ${continueTheme.total} faites`, `${continueTheme.done} من ${continueTheme.total} تجارب تمّت`, `${continueTheme.total} 个体验里完成了 ${continueTheme.done} 个`)}
            {nextExperience && (
              <>
                {say(' · next up ', ' · 다음은 ', ' · a continuación ', ' · ensuite ', ' · التالي ', ' · 接下来 ')}
                <strong>{say(nextExperience.title, nextExperience.titleKo, nextExperience.titleEs, nextExperience.titleFr, nextExperience.titleAr, nextExperience.titleZh)}</strong>
              </>
            )}
          </p>
          <div className="journey-lead__bar">
            <div className="journey-lead__fill" style={{ width: `${continueTheme.pct}%` }} />
          </div>
        </>
      ) : (
        <p className="journey-lead__line">
          {say(suggestedTheme.tagline, suggestedTheme.taglineKo, suggestedTheme.taglineEs, suggestedTheme.taglineFr, suggestedTheme.taglineAr, suggestedTheme.taglineZh)}{' '}
          {say('Pick this up and your Passport starts filling itself.',
            '여기서 시작하면 여권이 저절로 채워지기 시작합니다.', 'Empieza por aquí y tu Pasaporte se llenará solo.', 'Reprenez ici et votre Passeport se remplira tout seul.', 'ابدأ من هنا وسيملأ جواز سفرك نفسه.', '从这儿接着走，你的护照就会自己填满。')}
        </p>
      )}

      <button
        className="journey-lead__cta"
        onClick={() => onOpenTheme(resuming ? continueTheme.themeId : suggestedTheme.id)}
      >
        {resuming ? '계속하기 · Continue' : '시작하기 · Start here'}
        <ChevronRightIcon size={16} />
      </button>
    </div>
  );
}

// A second, lighter card: one theme picked for today, so the traveller who
// does not want to resume still gets a single answer rather than a grid.
// Deterministic by date, so it does not shuffle on every render.
export function TodaysPick({ theme, reason, onOpenTheme }) {
  const say = useText();
  if (!theme) return null;
  return (
    <button className="todays-pick" onClick={() => onOpenTheme(theme.id)}>
      <span className="todays-pick__label">
        <SparkleIcon size={14} /> {say('Today\u2019s recommendation', '오늘의 추천', 'La recomendación de hoy', 'La recommandation du jour', 'توصية اليوم', '今天的推荐')}
      </span>
      <span className="todays-pick__title">{theme.emoji} {say(theme.title, theme.titleKo, theme.titleEs, theme.titleFr, theme.titleAr, theme.titleZh)}</span>
      {/* The reason is the point: a pick without one is just a card. It is
          derived from the date, the clock or the traveller's own record —
          never from anything the app cannot actually check. */}
      {reason && <span className="todays-pick__reason">{reason}</span>}
      <span className="todays-pick__cta">
        {say('See the path', '길 보기', 'Ver el camino', 'Voir le chemin', 'انظر الطريق', '看这条路')} <ChevronRightIcon size={14} />
      </span>
    </button>
  );
}
