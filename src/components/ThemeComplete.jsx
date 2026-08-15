import React, { useEffect } from 'react';
import { COMPLETION_KIND } from '../domain/policy/completion.js';
import { useText } from './localeText.js';

// The moment a culture is finished.
//
// Completing a theme used to change a progress line from 2/3 to 3/3 and
// nothing else — the one point in the app where a traveller has genuinely
// done something passed without being marked. This marks it: a stamp lands,
// the culture is named, and the next thing to do is offered while the sense
// of having finished is still fresh.
//
// Deliberately restrained. It is a stamp pressed into a page, not confetti:
// one animation, under a second, and it never blocks — tapping anywhere or
// pressing Escape closes it, and it closes itself if left alone.
export default function ThemeComplete({
  theme, remaining = 0, kind = null, next, nextReason, onClose, onOpenNext,
}) {
  const say = useText();
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!theme) return null;

  return (
    <div className="complete-scrim" onClick={onClose} role="presentation">
      <div
        className="complete-card"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-live="polite"
        aria-label={`${theme.title} complete`}
      >
        <div className="complete-stamp" aria-hidden="true">
          <span className="complete-stamp__mark">✓</span>
        </div>

        {/* A theme finishes when one of its narratives does, so there can be
            experiences left inside a theme the model calls complete. Saying
            "culture complete" there would overstate it — and the traveller
            would notice, because Explore still offers to continue this very
            theme. What finished is the path they walked. */}
        <p className="complete-eyebrow">
          {remaining > 0
            ? say('Path complete', '길 완주', 'Camino completado', 'Chemin terminé', 'اكتمل الطريق', '这条路走完了', '道を歩き終えました')
            : say('Culture complete', '문화 완주', 'Cultura completada', 'Culture terminée', 'اكتملت الثقافة', '这个文化走完了', '文化を歩き終えました')}
        </p>
        <h2 className="complete-title">{say(theme.title, theme.titleKo, theme.titleEs, theme.titleFr, theme.titleAr, theme.titleZh, theme.titleJa)}</h2>
        {/* The Korean name under the title is the stamp itself, so it stays
            in every setting — it is what a passport stamp would actually
            read. The heading above it follows the language. */}
        {theme.titleKo && <p className="complete-title-ko" translate="no">{theme.titleKo}</p>}
        <p className="complete-note">
          {remaining > 0
            ? say(
              `Stamped into your passport. There ${remaining === 1 ? 'is 1 experience' : `are ${remaining} experiences`} left in this one if you want more of it.`,
              `여권에 찍혔습니다. 더 보고 싶으시면 이 문화에 ${remaining}개가 남아 있어요.`,
              `Sellado en tu pasaporte. ${remaining === 1 ? 'Queda 1 experiencia' : `Quedan ${remaining} experiencias`} en esta si quieres más.`,
              `Tamponné dans votre passeport. ${remaining === 1 ? 'Il reste 1 expérience' : `Il reste ${remaining} expériences`} dans celle-ci si vous en voulez plus.`,
              `خُتم في جواز سفرك. ${remaining === 1 ? 'بقيت تجربة واحدة' : `بقيت ${remaining} تجارب`} في هذه إن أردت المزيد منها.`,
              `盖进你的护照了。这一条里还剩 ${remaining} 个体验，想继续的话。`,
              `パスポートに押しました。もっと見たければ、この文化にはあと${remaining}の体験が残っています。`,
            )
            : say('Stamped into your passport.', '여권에 찍혔습니다.', 'Sellado en tu pasaporte.', 'Tamponné dans votre passeport.', 'خُتم في جواز سفرك.', '盖进你的护照了。', 'パスポートに押しました。')}
        </p>

        {/* Said on the stamp itself, because this is the moment the claim is
            made. A theme still in preview has no verified venue anywhere in
            it, so every step falls to the traveller's own word — which a
            tester noticed and called skimming. Their word is accepted; it is
            simply not the same sentence as having eaten at four places, and
            the app was printing one sentence for both. */}
        {kind === COMPLETION_KIND.DECLARED && (
          <p className="complete-basis">
            {say(
              'Recorded on your word — none of these had a verified place to visit yet.',
              '본인 확인으로 기록되었습니다 — 이 중에는 아직 확인된 방문 장소가 없어요.',
              'Registrado bajo tu palabra: ninguna de estas tenía todavía un sitio verificado que visitar.',
              "Enregistré sur votre parole — aucune de celles-ci n'avait encore d'adresse vérifiée à visiter.",
              'سُجّل على كلمتك — لم يكن لأيّ من هذه مكان موثّق يُزار بعد.',
              '凭你的话记下的——这些里还没有一个有确认过的地方可以去。',
              'あなたの言葉で記録しました——このどれにも、まだ訪ねられる確認済みの場所がありませんでした。',
            )}
          </p>
        )}
        {kind === COMPLETION_KIND.MIXED && (
          <p className="complete-basis">
            {say('Part visited, part on your own word.',
              '일부는 방문으로, 일부는 본인 확인으로.',
              'En parte visitado, en parte bajo tu palabra.', 'En partie visité, en partie sur votre parole.', 'بعضه بالزيارة وبعضه على كلمتك.', '一部分是去过的，一部分是凭你的话记的。', '一部は訪問、一部はあなたの言葉によります。')}
          </p>
        )}

        {next && (
          <div className="complete-next">
            <p className="complete-next__label">{say('Where to next', '다음은 어디로', 'Y ahora dónde', 'Et maintenant, où', 'وإلى أين الآن', '接下来去哪儿', '次はどこへ')}</p>
            <button className="complete-next__btn" onClick={() => onOpenNext(next)}>
              <span className="complete-next__name">{say(next.title, next.titleKo, next.titleEs, next.titleFr, next.titleAr, next.titleZh, next.titleJa)}</span>
              {nextReason && <span className="complete-next__reason">{nextReason}</span>}
            </button>
          </div>
        )}

        <button className="complete-dismiss" onClick={onClose}>
          {say('Not now', '나중에', 'Ahora no', 'Pas maintenant', 'ليس الآن', '先不用', 'いまはしない')}
        </button>

      </div>
    </div>
  );
}
