import React, { useState } from 'react';
import { menus, menuById } from '../domain/catalog/menus.js';
import { useText } from './localeText.js';

// Pick a dish for somebody who cannot decide.
//
// This shipped with a hardcoded list of its own — BBQ, Bibimbap, Jjimdak,
// Dakgalbi, Tteokbokki, Naengmyeon, Kalguksu, Jokbal — written before this app
// was this app, and by 2026-08-05 it contradicted the product outright:
//
//   Two of the eight were in the catalogue. The app knew nothing about the
//   other six — no gloss, no culture, no page to open, nothing to say if
//   somebody asked why that one.
//
//   Four of them — bibimbap, tteokbokki, naengmyeon, kalguksu — are dishes one
//   person orders for one person. This whole product exists because a solo
//   traveller is shut out of food that starts at two servings. Telling them to
//   go and eat bibimbap is telling them to do the thing they could already do
//   alone, inside the app built for the opposite.
//
//   And the wheel did not turn: `animation: spin` was set inline against a
//   @keyframes spin that has never existed in this stylesheet, so 🔄 sat
//   perfectly still for a second and a half.
//
// It draws from the catalogue now, so every result is a dish the app can talk
// about and does. 백반 is excluded on purpose rather than quietly reclassified
// — the catalogue calls it the honest exception you *can* order alone, and a
// wheel promising otherwise would be the same lie in a smaller font.

const WHEEL = menus.filter(m => m.minPeople > 1);
const SPIN_MS = 900;

export default function FoodRoulette({ onClose, onOpenTables }) {
  const say = useText();
  const [spinning, setSpinning] = useState(false);
  const [resultId, setResultId] = useState(null);
  const result = resultId ? menuById(resultId) : null;

  const spin = () => {
    setSpinning(true);
    setResultId(null);
    setTimeout(() => {
      setResultId(WHEEL[Math.floor(Math.random() * WHEEL.length)].id);
      setSpinning(false);
    }, SPIN_MS);
  };

  return (
    <div className="match-modal-backdrop" role="dialog" aria-label={say('Pick a dish', '요리 고르기', 'Elegir un plato', 'Choisir un plat')} onClick={onClose}>
      <div className="match-modal roulette" onClick={e => e.stopPropagation()}>
        <h2 className="roulette__title">
          <span translate="no">오늘 뭐 먹지</span>
          <span className="roulette__title-en">{say('Cannot decide? Let it pick one.', '못 고르겠나요? 대신 골라 드릴게요.', '¿No te decides? Deja que elija por ti.', 'Vous hésitez ? Laissez-le choisir.')}</span>
        </h2>

        <div className="roulette__stage" aria-live="polite">
          {spinning && <span className="roulette__idle">{say('고르는 중 · Picking…', '고르는 중', 'Eligiendo…', 'Choix en cours…')}</span>}
          {!spinning && result && (
            <>
              <span className="roulette__dish-kr" translate="no">{result.nameKo}</span>
              <span className="roulette__dish-en">{result.name}</span>
              <span className="roulette__gloss">{say(result.gloss, result.glossKo, result.glossEs, result.glossFr)}</span>
              {/* The reason, in the dish's own words from the catalogue. A
                  wheel that names a dish and stops is a slot machine; this is
                  the line that makes it an answer. */}
              <span className="roulette__why">{say(result.whyShared, result.whySharedKo, result.whySharedEs, result.whySharedFr)}</span>
            </>
          )}
          {!spinning && !result && (
            <span className="roulette__idle">
              {WHEEL.length} dishes, and not one of them is served for one.
            </span>
          )}
        </div>

        <button className="roulette__spin" onClick={spin} disabled={spinning} translate="no">
          {result ? '다시 · Again' : '골라줘 · Pick one'}
        </button>
        {result && onOpenTables && (
          <button className="roulette__go" translate="no" onClick={() => onOpenTables(result.id)}>
            {say('이 요리 밥상 보기 · See tables for this', '이 요리 밥상 보기', 'Ver mesas de este plato', 'Voir les tables pour ce plat')}
          </button>
        )}
        <button className="roulette__close" onClick={onClose} translate="no">{say('닫기 · Close', '닫기', 'Cerrar', 'Fermer')}</button>
      </div>
    </div>
  );
}
