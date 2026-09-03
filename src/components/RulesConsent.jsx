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
          only when they look for the button and there isn't one.

          It said "Asked once" until 2026-09-03, and that stopped being true
          the same day: the agreement is recorded when a table is actually
          opened or a seat actually asked for, so anybody who backs out of the
          form sees this again. The sentence says what happens now.

          It also said "under 도움이 필요하면", in all seven. That label is a
          `journal-tool__kr` span, and index.css:11739 hides every `__kr` class
          outside Korean — measured against the shipping stylesheet, the button
          renders with no heading at all in en, es, fr, ar, zh and ja, so six
          readers out of seven were being sent to look for words that are not
          on their screen. All seven now name the Passport tab, which TabBar
          does translate. Korean uses it too rather than the section heading
          inside it: one signpost for everybody is worth more than a shorter
          walk for one of them. */}
      <p className="rules-consent__note">
        {say('Asked until you open a table or ask for a seat — then not again. You can read this any time on your Passport.',
          '상을 차리거나 자리를 요청하실 때까지 여쭙고, 그 뒤로는 묻지 않습니다. 여권에서 언제든 다시 읽으실 수 있어요.',
          'Te lo preguntamos hasta que abras una mesa o pidas sitio; después, no más. Puedes leerlo cuando quieras en tu Pasaporte.', "Demandé jusqu'à ce que vous ouvriez une table ou demandiez une place — ensuite, plus jamais. Vous pouvez le relire à tout moment dans votre Passeport.", 'نسألك حتى تفتح مائدة أو تطلب مقعدًا، ثم لا نسأل بعدها. وتستطيع قراءته في أي وقت من الجواز.', '在你开一张饭桌或申请一个位子之前，每次都会问；之后就不再问了。你随时可以在护照里再读一遍。', '食卓を開くか席をリクエストするまではそのつどお尋ねし、そのあとは尋ねません。パスポートからいつでも読み返せます。')}
      </p>
    </div>
  );
}
