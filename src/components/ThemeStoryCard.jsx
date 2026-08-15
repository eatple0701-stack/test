import React from 'react';
import { editorialFor } from '../content/exploreEditorial.js';
import { useText } from './localeText.js';

// A culture, presented as something to wonder about rather than something to
// browse.
//
// The card this replaces was emoji + title + tagline + progress: four pieces
// of information, none of which gave a reason to care. It described. This one
// asks. The title has moved to an eyebrow because a name is not a reason —
// nobody chose "Temple Life" off a menu; they chose the question underneath it
// and found out what it was called on the way in.
//
// The artwork is the Korean word. This product has eight placeholder
// illustrations shared across forty restaurants, so a photographic card would
// be four cultures wearing the same drawing. One true word, set large enough
// to be a texture rather than a label, says more and lies less.
export default function ThemeStoryCard({ theme, progress, onOpen }) {
  const say = useText();
  const editorial = editorialFor(theme.id);
  const done = progress?.done ?? 0;
  const total = progress?.total ?? 0;
  const started = done > 0;

  // Two different kinds of "finished", and conflating them puts the card at
  // odds with the resume card sitting directly above it. A theme is `complete`
  // when one of its narratives is walked end to end — but experiences can
  // remain inside it, and Explore will still offer to continue. Only an
  // exhausted theme has nothing left to say.
  const pathDone = Boolean(progress?.complete);
  const exhausted = pathDone && done >= total;

  return (
    <button
      className={`story-card${exhausted ? ' is-complete' : ''}`}
      onClick={() => onOpen(theme.id)}
      aria-label={editorial
        ? `${say(editorial.question, editorial.questionKo, editorial.questionEs, editorial.questionFr, editorial.questionAr, editorial.questionZh, editorial.questionJa)} — ${say(theme.title, theme.titleKo, theme.titleEs, theme.titleFr, theme.titleAr, theme.titleZh, theme.titleJa)}`
        : say(theme.title, theme.titleKo, theme.titleEs, theme.titleFr, theme.titleAr, theme.titleZh, theme.titleJa)}
    >
      {/* Cropped by the card edge on purpose: a word that fits inside its box
          reads as a label, and a word that runs out of room reads as print. */}
      {editorial && (
        <span className="story-card__word" aria-hidden="true">{editorial.word}</span>
      )}

      <span className="story-card__eyebrow">
        {say(theme.title, theme.titleKo, theme.titleEs, theme.titleFr, theme.titleAr, theme.titleZh, theme.titleJa)}
        {theme.status === 'preview' && (
          <span className="story-card__flag">{say('Preview', '미리보기', 'Vista previa', 'Aperçu', 'معاينة', '预览', 'プレビュー')}</span>
        )}
      </span>

      {/* The question is the card. Everything else is scale and quiet. */}
      <span className="story-card__question">
        {editorial
          ? say(editorial.question, editorial.questionKo, editorial.questionEs, editorial.questionFr, editorial.questionAr, editorial.questionZh, editorial.questionJa)
          : say(theme.tagline, theme.taglineKo, theme.taglineEs, theme.taglineFr, theme.taglineAr, theme.taglineZh, theme.taglineJa)}
      </span>

      <span className="story-card__foot">
        {exhausted
          ? say('You have walked this one', '이 문화는 다 걸어보셨어요', 'Ya has recorrido esta', 'Vous avez déjà parcouru celle-ci', 'سبق أن مشيتَ هذه', '这一条你已经走过了', 'これはもう歩きました')
          : pathDone
            ? say(`A path done · ${total - done} more here`, `한 갈래 완주 · 여기 ${total - done}개 더`,
              `Un camino hecho · ${total - done} más aquí`, `Un chemin fait · ${total - done} de plus ici`, `طريق تمّ · ${total - done} أخرى هنا`, `走完一条 · 这里还有 ${total - done} 条`, `道をひとつ完了 · ここにあと${total - done}`)
            : started
              ? say(`${done} of ${total} done`, `${total}개 중 ${done}개 완료`, `${done} de ${total} hechas`, `${done} sur ${total} faites`, `${done} من ${total} تمّت`, `${total} 个里完成了 ${done} 个`, `${total}のうち${done}を完了`)
              : say(`${total} ${total === 1 ? 'experience' : 'experiences'}`, `경험 ${total}개`,
                `${total} ${total === 1 ? 'experiencia' : 'experiencias'}`, `${total} ${total === 1 ? 'expérience' : 'expériences'}`, `${total} ${total === 1 ? 'تجربة' : 'تجارب'}`, `${total} 个体验`, `${total}の体験`)}
      </span>

      {/* Progress is a hairline, not a widget. It belongs to the traveller,
          not to the invitation, so it sits at the very bottom edge. */}
      {started && !exhausted && (
        <span className="story-card__rule" aria-hidden="true">
          <span className="story-card__rule-fill" style={{ width: `${progress.pct}%` }} />
        </span>
      )}
    </button>
  );
}
