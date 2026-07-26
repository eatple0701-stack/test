import React, { useState } from 'react';

export default function MeetupPlannerModal({ traveler, onClose, onConfirm }) {
  const [date, setDate] = useState('2026-07-24');
  const [time, setTime] = useState('19:00');
  const [location, setLocation] = useState('Hongdae Station');
  const [food, setFood] = useState('Korean BBQ');
  const [budget, setBudget] = useState('$$');
  const [travelStyle, setTravelStyle] = useState('Foodie');
  const [language, setLanguage] = useState('English');

  return (
    <div className="match-modal-backdrop" role="dialog" aria-modal="true">
      <div className="match-modal" style={{ width: '90%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="match-modal__photo" style={{ background: traveler.color, margin: '0 auto 1rem', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#fff', fontWeight: 'bold' }}>
          <span>{traveler.name.slice(0,1)}</span>
        </div>
        <h2>Meetup Planner</h2>
        <p>Plan your meetup with {traveler.name}</p>
        
        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '10px', margin: '20px 0' }}>
          <label><strong>Meeting date</strong><br/><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{width: '100%', padding: '8px', marginTop: '4px'}} /></label>
          <label><strong>Meeting time</strong><br/><input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{width: '100%', padding: '8px', marginTop: '4px'}} /></label>
          <label><strong>Meeting location</strong><br/><input type="text" value={location} onChange={(e) => setLocation(e.target.value)} style={{width: '100%', padding: '8px', marginTop: '4px'}} /></label>
          <label><strong>Preferred food</strong><br/><input type="text" value={food} onChange={(e) => setFood(e.target.value)} style={{width: '100%', padding: '8px', marginTop: '4px'}} /></label>
          <label><strong>Budget</strong><br/><select value={budget} onChange={(e) => setBudget(e.target.value)} style={{width: '100%', padding: '8px', marginTop: '4px'}}><option>$</option><option>$$</option><option>$$$</option></select></label>
          <label><strong>Travel style</strong><br/><input type="text" value={travelStyle} onChange={(e) => setTravelStyle(e.target.value)} style={{width: '100%', padding: '8px', marginTop: '4px'}} /></label>
          <label><strong>Conversation language</strong><br/><input type="text" value={language} onChange={(e) => setLanguage(e.target.value)} style={{width: '100%', padding: '8px', marginTop: '4px'}} /></label>
        </div>

        <button className="btn-primary" onClick={() => onConfirm({ date, time, location, food, budget, travelStyle, language })} style={{width: '100%', marginBottom: '10px'}}>
          Confirm Meetup
        </button>
        <button className="btn-secondary" onClick={onClose} style={{width: '100%'}}>
          Cancel
        </button>
      </div>
    </div>
  );
}
