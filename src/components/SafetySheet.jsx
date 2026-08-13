import React from 'react';
import {
  SAFETY_STEPS, NOT_YET_BUILT, REPORT_CHANNEL, reportingConfigured, PURPOSE,
} from '../content/safety.js';
import { ChevronLeftIcon } from './Icons';
import { useText } from './localeText.js';

// The sheet you open when the evening is going wrong.
//
// Reachable from the table page rather than buried in settings, because the
// moment somebody needs it they are sitting at that table. The numbers come
// first: 112 and 119 work whether or not this app does.
//
// It says out loud what it cannot do. An app that offers a safety screen and
// silently has no reporting channel has traded a real duty for the appearance
// of one, and a traveller would find that out at the worst possible time.
export default function SafetySheet({ onClose }) {
  const say = useText();
  return (
    <div className="phrase-sheet" role="dialog" aria-label={say('Safety', '안전', 'Seguridad', 'Sécurité')}>
      <header className="sheet-page__head">
        <button className="sheet-page__back" onClick={onClose} aria-label="Close">
          <ChevronLeftIcon size={20} />
        </button>
        <h1>{say('도움 · Getting help', '도움', 'Cómo pedir ayuda', "Obtenir de l'aide")}</h1>
      </header>

      {/* Above the emergency numbers, because most of what this screen is
          reached for is not an emergency — it is somebody wanting to know
          what the rules are before they decide. */}
      <div className="safety-purpose">
        <p className="safety-purpose__head">
          <span className="safety-purpose__kr">{PURPOSE.kr}</span>
          <span className="safety-purpose__en">{PURPOSE.en}</span>
        </p>
        <p className="safety-purpose__rule">{PURPOSE.rule}</p>
        <p className="safety-purpose__broken">{PURPOSE.ifBroken}</p>
      </div>

      <div className="safety">
        <a className="safety__call" href="tel:112">
          <span className="safety__call-num">112</span>
          <span className="safety__call-label">{say('Police', '경찰', 'Policía', 'Police')}</span>
        </a>
        <a className="safety__call" href="tel:119">
          <span className="safety__call-num">119</span>
          <span className="safety__call-label">{say('Fire · ambulance', '화재 · 구급', 'Bomberos y ambulancia', 'Pompiers et ambulance')}</span>
        </a>
        <a className="safety__call safety__call--wide" href="tel:1330">
          <span className="safety__call-num">1330</span>
          <span className="safety__call-label">{say('Korea Travel Helpline · 24h, English', '관광통역안내 · 24시간', 'Línea de ayuda al viajero · 24 h, en inglés', 'Assistance aux voyageurs · 24 h, en anglais')}</span>
        </a>
      </div>

      <div className="phrase-list">
        {SAFETY_STEPS.map(s => (
          <div key={s.id} className="safety-step">
            <p className="safety-step__title">{s.title}</p>
            <p className="safety-step__body">{s.body}</p>
          </div>
        ))}

        {reportingConfigured() ? (
          <a className="safety__report" href={REPORT_CHANNEL.href} target="_blank" rel="noreferrer">
            {say('Report to ', '신고 보내기: ', 'Informar a ', 'Signaler à ')}{REPORT_CHANNEL.label}
          </a>
        ) : (
          /* Not a button. A report that goes nowhere is worse than none,
             because somebody trusted it at the moment they needed it. */
          <p className="safety__unwired">
            {say('In-app reporting is not connected yet. Until it is, tell the Eatple team directly — during the pilot somebody from the team is reachable at the meeting point.',
              '앱 내 신고는 아직 연결되지 않았습니다. 그때까지는 밥친구 팀에 직접 알려 주세요 — 파일럿 기간에는 만나는 자리에 팀 사람이 있습니다.',
              'Los informes dentro de la app aún no están conectados. Hasta entonces, díselo directamente al equipo de Eatple: durante el piloto hay alguien del equipo localizable en el punto de encuentro.', "Le signalement dans l'application n'est pas encore branché. En attendant, dites-le directement à l'équipe Eatple : pendant le pilote, quelqu'un de l'équipe est joignable au point de rendez-vous.")}
          </p>
        )}

        <div className="safety__owed">
          <p className="safety__owed-label">{say('Not built yet', '아직 준비 중', 'Todavía sin construir', 'Pas encore construit')}</p>
          <ul>
            {NOT_YET_BUILT.map(item => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
