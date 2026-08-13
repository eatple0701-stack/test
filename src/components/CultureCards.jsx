import React, { useState } from 'react';

import { CULTURE_CARDS } from '../content/cultureCards.js';
import { useText } from './localeText.js';

export default function CultureCards({ onClose, startIndex = 0 }) {
  const say = useText();
  const [index, setIndex] = useState(startIndex);

  const next = () => setIndex(i => (i + 1) % CULTURE_CARDS.length);
  const prev = () => setIndex(i => (i - 1 + CULTURE_CARDS.length) % CULTURE_CARDS.length);

  return (
    <div className="match-modal-backdrop" role="dialog" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="match-modal" onClick={e => e.stopPropagation()} style={{ padding: '40px 20px', minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h2 style={{ fontSize: 28, marginBottom: 16 }}>{CULTURE_CARDS[index].title}</h2>
        <p style={{ fontSize: 16, color: 'var(--ink-body)', flex: 1 }}>{CULTURE_CARDS[index].desc}</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn-secondary" onClick={prev} style={{flex: 1}}>{say('Previous', '이전', 'Anterior')}</button>
          <button className="btn-primary" onClick={next} style={{flex: 1}}>{say('Next Card', '다음 카드', 'Siguiente ficha')}</button>
        </div>
        <button className="btn-secondary" onClick={onClose} style={{ marginTop: 10 }}>Close</button>
      </div>
    </div>
  );
}
