import React, { useMemo, useState } from 'react';
import {
  emptyAnswers, recordAnswer, mbtiProgress, nextQuestion, mbtiType,
} from '../domain/policy/foodMbti.js';
import { MBTI_AXES } from '../content/foodMbti.js';
import { mbtiTypeLabel, mbtiPoleLabel, mbtiAxisLabel } from '../domain/policy/dishLabels.js';
import { getStoredMbti, storeMbti, clearMbti } from '../data/foodMbti.js';
import { useText, useLocale } from './localeText.js';

// 음식 MBTI — twelve questions, one at a time, two answers each.
//
// It opens from the taste map's result and not before it. The deck asks
// fourteen questions already, and a second set of twelve in front of somebody
// who has not yet been given anything is a form, not a game. After the map
// there is something to add to.
//
// Questions rather than cards: the deck is a swipe because a dish is a
// picture, and these are sentences. Two buttons, stacked, both the same size
// — neither answer is the recommended one, and a layout that makes one look
// like the default would be answering the question for the reader.
export default function FoodMbti({ onClose, inline = false, member = false }) {
  const say = useText();
  const locale = useLocale();
  const [answers, setAnswers] = useState(getStoredMbti);

  const progress = useMemo(() => mbtiProgress(answers), [answers]);
  const card = useMemo(() => nextQuestion(answers), [answers]);
  const type = useMemo(() => mbtiType(answers), [answers]);

  const answer = (pole) => {
    if (!card) return;
    const next = recordAnswer(answers, card.id, pole);
    setAnswers(next);
    storeMbti(next);
  };

  const startOver = () => {
    clearMbti();
    setAnswers(emptyAnswers());
  };

  const t = (table) => (table ? table[locale] ?? table.en ?? '' : '');

  const label = say('Food MBTI', '음식 MBTI', 'MBTI gastronómico', 'MBTI culinaire',
    'إم بي تي آي الطعام', '饮食 MBTI', 'フード MBTI');

  // Two shapes, one component. As a sheet it is a dialog over whatever it
  // was opened from; on 첫 화면 it is the screen itself, taking the place the
  // deck was in — asked for on 2026-09-09, "따로 창으로 뜨는 게 아니고 기존
  // 화면 창에서". Inline drops the backdrop, the sheet chrome, and its own
  // close button: the sequence's 건너뛰기 is already in that corner and two
  // of them is one too many.
  const body = (
      <div className={`mbti${inline ? ' mbti--inline' : ''}`}
        onClick={inline ? undefined : (e => e.stopPropagation())}>
        <div className="mbti__head">
          <span className="mbti__title">{label}</span>
          {!inline && (
            <button type="button" className="mbti__close" onClick={onClose}
              aria-label={say('Close', '닫기', 'Cerrar', 'Fermer', 'إغلاق', '关闭', '閉じる')}>×</button>
          )}
        </div>

        {card ? (
          <>
            <p className="mbti__progress">
              <span className="mbti__progress-bar" aria-hidden="true">
                <span className="mbti__progress-fill"
                  style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }} />
              </span>
              <span className="mbti__progress-text">
                {say(`${progress.done} of ${progress.total} answered`,
                  `${progress.total}개 중 ${progress.done}개 답함`,
                  `${progress.done} de ${progress.total} respondidas`,
                  `${progress.done} sur ${progress.total} répondues`,
                  `${progress.done} من ${progress.total} تمّت`,
                  `已答 ${progress.done} / ${progress.total}`,
                  `${progress.total}問中${progress.done}問`)}
              </span>
            </p>

            <p className="mbti__stem">{t(card.stem)}</p>
            <div className="mbti__options">
              {card.options.map(option => (
                <button key={option.pole} type="button" className="mbti__option"
                  onClick={() => answer(option.pole)}>
                  {t(option.text)}
                </button>
              ))}
            </div>
          </>
        ) : type && (
          <div className="mbti__result">
            <p className="taste-type">
              <span className="taste-type__code" translate="no">{type.code}</span>
              <span className="taste-type__name">{mbtiTypeLabel(type.code, locale)}</span>
            </p>

            {/* The four axes, each named beside the pole it landed on. The
                chips on the deck's own type card are unlabelled because three
                short phrases read as a sentence; four with a code each do
                not, so these say which axis they came from. */}
            <ul className="mbti__axes">
              {MBTI_AXES.map(axis => (
                <li key={axis.id} className="mbti__axis">
                  <span className="mbti__axis-name">{mbtiAxisLabel(axis.id, locale)}</span>
                  <span className="mbti__axis-pole">{mbtiPoleLabel(axis.id, type.axes[axis.id], locale)}</span>
                </li>
              ))}
            </ul>

            {/* Where the answers are, as it is for the person reading: on
                the account for a member since 2026-09-11 (see
                domain/policy/tasteSync.js), and in this browser for a guest,
                with the one thing that would change that. */}
            <p className="mbti__where">
              {member
                ? say('Saved to your account — sign in on another device and it is there.',
                  '계정에 저장돼요. 다른 기기에서 로그인해도 그대로 보여요.',
                  'Guardado en tu cuenta: entra desde otro dispositivo y ahí estará.',
                  'Enregistré sur votre compte : connectez-vous sur un autre appareil, il y sera.',
                  'محفوظ في حسابك: سجّل الدخول من جهاز آخر وستجده هناك.',
                  '已保存到你的账号——在别的设备上登录也能看到。',
                  'アカウントに保存されます。別の端末でログインしても、そのまま見られます。')
                : say('Only in this browser for now — sign in and it is kept on your account, on every device.',
                  '지금은 이 브라우저에만 있어요. 로그인하면 계정에 저장돼서 다른 기기에서도 볼 수 있어요.',
                  'Por ahora solo en este navegador: inicia sesión y se guardará en tu cuenta, en todos tus dispositivos.',
                  'Pour l’instant dans ce navigateur seulement : connectez-vous et il sera gardé sur votre compte, sur tous vos appareils.',
                  'محفوظ في هذا المتصفّح وحده الآن: سجّل الدخول ليُحفَظ في حسابك على كل أجهزتك.',
                  '目前只存在这个浏览器里——登录后会保存到你的账号，换设备也能看。',
                  'いまはこのブラウザにだけ保存されています。ログインするとアカウントに保存され、どの端末でも見られます。')}
            </p>

            <div className="mbti__foot">
              <button type="button" className="mbti__again" onClick={startOver}>
                {say('Take it again', '다시 하기', 'Hacerlo otra vez', 'Recommencer',
                  'أعد الاختبار', '再做一次', 'もう一度')}
              </button>
              <button type="button" className="mbti__done" onClick={onClose}>
                {say('Done', '닫기', 'Listo', 'Terminé', 'تمّ', '完成', '閉じる')}
              </button>
            </div>
          </div>
        )}
      </div>
  );

  if (inline) return body;

  return (
    <div className="match-modal-backdrop mbti-backdrop" role="dialog" aria-label={label} onClick={onClose}>
      {body}
    </div>
  );
}
