import React from 'react';
import { PURPOSE, RULES, agreeLabel } from '../content/safety.js';
import { rulesAgreement } from '../domain/policy/consent.js';
import { useText } from './localeText.js';

// The 동의 교수님 asked for, at the moment it means something.
//
// One component for both sides of a table — a guest asking for a seat and a
// host opening one are agreeing to the same rules, and two copies of this
// wording would drift the first time somebody edited one of them.
//
// Deliberately not a modal, and deliberately not on the way into the app.
// A consent wall at launch gets dismissed by somebody who has not yet
// decided to do anything, which is agreement in form only. This sits in the
// flow it governs, immediately above the button it gates, so the sentence
// being agreed to is on screen at the moment the decision is real.
export default function RulesConsent({ onAgree, action }) {
  const say = useText();
  // Throws on an unknown key rather than falling back to English, which is
  // what the old `action` prop did by being English in the first place.
  const label = agreeLabel(action);
  return (
    <div className="rules-consent">
      <p className="rules-consent__head">
        <span className="rules-consent__kr">{PURPOSE.kr}</span>
        <span className="rules-consent__en">{PURPOSE.en}</span>
      </p>

      {/* key is the English arm rather than the rendered text: the rendered
          text changes with the language setting, and a key that changes
          remounts every item on a setting change. */}
      <ul className="rules-consent__list">
        {RULES.map(r => <li key={r.en}>{say(r.en, r.ko, r.es, r.fr, r.ar, r.zh, r.ja)}</li>)}
      </ul>

      {/* A button rather than a checkbox with a separate submit: the extra
          step buys nothing here, and a checkbox somebody ticks and then
          forgets to submit reads as consent already given. */}
      <button
        className="form-submit"
        onClick={() => onAgree?.(rulesAgreement(PURPOSE.version))}
      >
        {say(label.en, label.ko, label.es, label.fr, label.ar, label.zh, label.ja)}
      </button>

      {/* Said plainly, because the alternative is somebody discovering it
          only when they look for the button and there isn't one. */}
      <p className="rules-consent__note">
        {say('Asked once. You can read this again any time under 도움이 필요하면.',
          '한 번만 여쭙니다. 도움이 필요하면 메뉴에서 언제든 다시 읽으실 수 있어요.',
          'Se pregunta una sola vez. Puedes volver a leerlo cuando quieras en 도움이 필요하면.', 'Demandé une seule fois. Vous pouvez le relire à tout moment dans 도움이 필요하면.', 'يُسأل مرة واحدة. وتستطيع قراءته مجددًا في أي وقت تحت 도움이 필요하면.', '只问一次。你随时可以在 도움이 필요하면 里再读一遍。', '一度だけ尋ねます。도움이 필요하면 からいつでも読み返せます。')}
      </p>
    </div>
  );
}
