import React, { useCallback, useEffect, useRef, useState } from 'react';
import DishSwipe, { SUMMARY } from './DishSwipe';
import FoodMbti from './FoodMbti';
import { FIRST_RUN, FIRST_RUN_EXIT, stepAfter } from '../domain/policy/firstRun.js';
import { useText } from './localeText.js';

// The opening sequence: the name, then the deck, then a choice.
//
// Why the deck and not a tour: a tour tells somebody what the app does, and
// this hands them something instead — after three cards there is a map with
// their own answers in it, and what comes next is a choice about that map
// rather than about the app.
//
// The choice is the deck's own. A pair of buttons was written for this screen
// first — 음식 MBTI 하러 가기 / 밥상 보러 가기 — and put back on 2026-09-09
// after being looked at: the map already ends in 이 음식들로 열려 있는 밥상
// 보기 and 음식 MBTI 검사하기, so the sequence was drawing seven buttons and
// two pairs of them went to the same two places. Both of the deck's doors are
// wired to end the sequence instead, which is all this screen ever needed to
// add.
//
// One screen throughout. The test used to open as a sheet over the map, and
// before that it replaced the whole sequence; both were wrong for the same
// reason — this is a sequence of screens, and a dialog on top of one is a
// second surface where there should be a next screen. Choosing the test puts
// the test where the deck was, and every handoff is the same two beats: what
// is leaving fades, then what is arriving rises.
//
// 건너뛰기 is on every screen and never moves. Somebody who came to find out
// whether real dinners exist is one tap from them at all times; that is the
// condition under which putting anything at all in front of the tables is
// allowed.
const LOGO_MS = 2200;
const LEAVE_MS = 320;

export default function FirstRun({ onDone }) {
  const say = useText();
  const [step, setStep] = useState(FIRST_RUN.logo);
  const [leaving, setLeaving] = useState(false);
  const leavingNow = useRef(false);

  // Every change of screen goes through here: the one leaving is marked, and
  // the swap happens a beat later. A ref rather than the state guards it, so
  // a second tap during a fade does nothing instead of stacking another
  // timer behind the first.
  const handoff = useCallback((next) => {
    if (leavingNow.current || !next) return;
    leavingNow.current = true;
    setLeaving(true);
    window.setTimeout(() => {
      setStep(next);
      setLeaving(false);
      leavingNow.current = false;
    }, LEAVE_MS);
  }, []);

  // The logo screen plays rather than waits. There is nothing to decide on
  // it, and a screen with no question should not need a tap to leave — but it
  // can be left early by tapping it and skipped outright, so the timer is
  // never the only way out.
  useEffect(() => {
    if (step !== FIRST_RUN.logo) return undefined;
    const t = window.setTimeout(() => handoff(stepAfter(FIRST_RUN.logo)), LOGO_MS);
    return () => window.clearTimeout(t);
  }, [step, handoff]);

  const flight = (name) => `first-run__${name}${leaving ? ' is-leaving' : ''}`;

  return (
    <div className="first-run" role="dialog" aria-modal="true"
      aria-label={say('Welcome', '처음 오셨네요', 'Bienvenido', 'Bienvenue', 'أهلًا بك', '欢迎', 'ようこそ')}>

      <button type="button" className="first-run__skip" onClick={() => onDone?.(FIRST_RUN_EXIT.app)}>
        {say('Skip', '건너뛰기', 'Saltar', 'Passer', 'تخطٍّ', '跳过', 'スキップ')}
      </button>

      {step === FIRST_RUN.logo && (
        <button type="button" className={flight('logo-screen')}
          onClick={() => handoff(stepAfter(FIRST_RUN.logo))}>
          <img className="first-run__logo" src="/images/eatple-logo.jpg" alt="" width="96" height="96" />
          <span className="first-run__wordmark" translate="no">밥친구 잇플 · Eatple</span>
          <span className="first-run__tagline">
            {say('Don\u2019t just visit Korea. Share a Korean table.',
              '혼자 먹기 아쉬운 한 끼, 같이.',
              'No solo visites Corea. Comparte una mesa coreana.',
              'Ne visitez pas seulement la Corée. Partagez une table coréenne.',
              'لا تزُر كوريا فحسب. شارك مائدة كورية.',
              '不只是来韩国，还要一起吃顿饭。',
              '韓国を訪れるだけでなく、食卓を囲む。')}
          </span>
        </button>
      )}

      {step === FIRST_RUN.taste && (
        <div className={flight('taste')}>
          <DishSwipe
            inline
            /* The payoff of fourteen cards just answered, and there is no
               passport to have sent the pictures to yet. */
            summary={SUMMARY.dishes}
            onOpenTables={() => onDone?.(FIRST_RUN_EXIT.app)}
            onOpenMbti={() => handoff(FIRST_RUN.mbti)}
          />
        </div>
      )}

      {step === FIRST_RUN.mbti && (
        <div className={flight('mbti')}>
          <FoodMbti inline onClose={() => onDone?.(FIRST_RUN_EXIT.mbti)} />
        </div>
      )}
    </div>
  );
}
