import React, { useState } from 'react';

const FOODS = ['BBQ', 'Bibimbap', 'Jjimdak', 'Dakgalbi', 'Tteokbokki', 'Naengmyeon', 'Kalguksu', 'Jokbal'];

export default function FoodRoulette({ onClose }) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);

  const spin = () => {
    setSpinning(true);
    setResult(null);
    setTimeout(() => {
      setResult(FOODS[Math.floor(Math.random() * FOODS.length)]);
      setSpinning(false);
    }, 1500);
  };

  return (
    <div className="match-modal-backdrop" role="dialog" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="match-modal" onClick={e => e.stopPropagation()}>
        <h2>Food Roulette</h2>
        <p>Can't decide? Let fate choose.</p>
        <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
          {spinning ? <span className="spinner" style={{ animation: 'spin 1s linear infinite' }}>🔄 Spinning...</span> : result ? <span>🍽️ {result}</span> : <span>❓</span>}
        </div>
        <button className="btn-primary" onClick={spin} disabled={spinning} style={{width:'100%', marginBottom: 10}}>
          Spin the Wheel
        </button>
        <button className="btn-secondary" onClick={onClose} style={{width:'100%'}}>Close</button>
      </div>
    </div>
  );
}
