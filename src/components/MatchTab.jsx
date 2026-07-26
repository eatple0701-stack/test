import React, { useMemo, useRef, useState } from 'react';
import { travelers } from '../data/travelers';
import { ClockIcon, MapPinIcon } from './Icons';
import MatchProfileDetail from './MatchProfileDetail';
import MeetupPlannerModal from './MeetupPlannerModal';
import ChatModal from './ChatModal';
const SWIPE_THRESHOLD = 110;

function getInitials(name) {
  return name.slice(0, 1).toUpperCase();
}

function TravelerCard({ traveler, style, onPointerDown, onPointerMove, onPointerUp, dragging, dragX }) {
  const tilt = dragX / 18;
  return (
    <article
      className="match-card"
      style={{
        ...style,
        transform: `translateX(${dragX}px) rotate(${tilt}deg)`,
        transition: dragging ? 'none' : 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="match-card__photo" style={{ background: traveler.color }}>
        <span className="match-card__initial">{getInitials(traveler.name)}</span>
        {traveler.availableToday && <span className="match-card__available">Free today</span>}
        {dragX > 40 && <span className="match-card__stamp match-card__stamp--like">LIKE</span>}
        {dragX < -40 && <span className="match-card__stamp match-card__stamp--pass">PASS</span>}
      </div>
      <div className="match-card__body">
        <div className="match-card__headline">
          <h2>{traveler.name}, {traveler.age}</h2>
          <span className="match-card__flag">{traveler.flag} {traveler.nationality}</span>
        </div>
        <p className="match-card__trip">
          <ClockIcon size={14} /> {traveler.tripDates} · {traveler.daysLeft} day{traveler.daysLeft === 1 ? '' : 's'} left
        </p>
        <p className="match-card__trip">
          <MapPinIcon size={14} /> Currently in {traveler.currentLocation}
        </p>
        <p className="match-card__bio">{traveler.bio}</p>

        <div className="match-card__tags">
          {traveler.interests.map(i => (
            <span key={i} className="tag-chip">{i}</span>
          ))}
        </div>

        <div className="match-card__row">
          <span className="match-card__label">Food</span>
          <span className="match-card__value">{traveler.foodPreferences.join(', ')}</span>
        </div>
        <div className="match-card__row">
          <span className="match-card__label">Speaks</span>
          <span className="match-card__value">{traveler.languages.join(', ')}</span>
        </div>
        
        <div style={{ background: '#e8f5e9', padding: '10px', borderRadius: '8px', marginTop: '12px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#2e7d32', fontWeight: 'bold' }}>✨ Why you match</p>
          <p style={{ margin: 0, fontSize: '12px', color: '#1b5e20' }}>
            You both love Korean BBQ and are free this weekend.
          </p>
        </div>
      </div>
    </article>
  );
}

export default function MatchTab({ onMatch, onNavigate }) {
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [matchedTraveler, setMatchedTraveler] = useState(null);
  const [requestStatus, setRequestStatus] = useState(null); // 'sending', 'accepted'
  const [viewingProfile, setViewingProfile] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const startX = useRef(0);

  const deck = useMemo(
    () => (onlyAvailable ? travelers.filter(t => t.availableToday) : travelers),
    [onlyAvailable],
  );
  const current = deck[cursor] ?? null;
  const upNext = deck[cursor + 1] ?? null;

  const advance = () => {
    setDragX(0);
    setCursor(c => c + 1);
  };

  const handlePointerDown = (e) => {
    startX.current = e.clientX;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const handlePointerMove = (e) => {
    if (!dragging) return;
    setDragX(e.clientX - startX.current);
  };
  const handlePointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    if (Math.abs(dragX) > SWIPE_THRESHOLD) {
      advance();
    } else {
      setDragX(0);
    }
  };

  const handleEatTogether = () => {
    if (!current) return;
    setRequestStatus('sending');
    setTimeout(() => {
      setRequestStatus('accepted');
      setMatchedTraveler(current);
    }, 2000);
  };
  const closeMatch = () => {
    setRequestStatus(null);
    if (matchedTraveler) onMatch(matchedTraveler);
    setMatchedTraveler(null);
    advance();
  };

  const handleStartChat = (traveler) => {
    setViewingProfile(null);
    setActiveChat(traveler);
  };

  const handleConfirmMeetup = (details) => {
    if (matchedTraveler) onMatch(matchedTraveler);
    // Optionally save details here
    setMatchedTraveler(null);
    setRequestStatus(null);
    advance();
    onNavigate('explore');
  };

  return (
    <section className="match-tab" aria-label="Match">
      <div className="match-tab__header">
        <h1>Match</h1>
        <button
          className={`chip${onlyAvailable ? ' active' : ''}`}
          onClick={() => { setOnlyAvailable(v => !v); setCursor(0); }}
        >
          Free today
        </button>
      </div>

      <div className="match-deck">
        {!current && (
          <div className="match-empty" style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <img src="https://images.unsplash.com/photo-1529156069898-49953eb1b5ea?auto=format&fit=crop&q=80&w=200&h=200" alt="No matches" style={{ width: 150, height: 150, borderRadius: '50%', objectFit: 'cover', marginBottom: '20px' }} />
            <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>You're all caught up!</h3>
            <p style={{ color: '#666', marginBottom: '24px', lineHeight: '1.5' }}>
              You've seen everyone available for today. Check back later for new travelers, or widen your search.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              <button className="btn-primary" onClick={() => onNavigate('explore')} style={{ width: '100%' }}>Explore Restaurants</button>
              <button className="btn-secondary" onClick={() => setOnlyAvailable(false)} style={{ width: '100%' }}>View Offline Travelers</button>
            </div>
          </div>
        )}

        {upNext && (
          <TravelerCard
            traveler={upNext}
            style={{ transform: 'scale(0.96) translateY(10px)', zIndex: 1 }}
            dragX={0}
            dragging={false}
            onPointerDown={() => {}}
            onPointerMove={() => {}}
            onPointerUp={() => {}}
          />
        )}

        {current && (
          <TravelerCard
            traveler={current}
            style={{ zIndex: 2 }}
            dragX={dragX}
            dragging={dragging}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
        )}
      </div>

      {current && (
        <div className="match-drag-surface">
          <div className="match-actions">
            <button className="btn-secondary match-action-btn--view" onClick={() => setViewingProfile(current)}>
              View Profile
            </button>
            <button className="btn-primary match-action-btn--eat" onClick={handleEatTogether}>
              Let's Eat Together
            </button>
          </div>
        </div>
      )}

      <MatchProfileDetail
        traveler={viewingProfile}
        onClose={() => setViewingProfile(null)}
        onStartChat={handleStartChat}
      />

      {requestStatus === 'sending' && (
        <div className="match-modal-backdrop" role="dialog" aria-modal="true">
          <div className="match-modal" style={{ textAlign: 'center' }}>
            <h2>Sending Request...</h2>
            <p>Waiting for {current?.name} to accept.</p>
            <div className="spinner" style={{ fontSize: '32px', margin: '20px' }}>⏳</div>
            <div style={{ background: '#fff3e0', padding: '12px', borderRadius: '8px', textAlign: 'left', marginTop: '20px' }}>
              <p style={{ margin: 0, fontWeight: 'bold', color: '#e65100', fontSize: '14px' }}>🛡️ Safety Tips</p>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#e65100', fontSize: '12px' }}>
                <li>Meet in public places.</li>
                <li>Verify their identity upon meeting.</li>
                <li>Share your location with a friend.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {requestStatus === 'accepted' && matchedTraveler && (
        <MeetupPlannerModal 
          traveler={matchedTraveler} 
          onClose={closeMatch} 
          onConfirm={handleConfirmMeetup} 
        />
      )}

      {activeChat && <ChatModal traveler={activeChat} onClose={() => setActiveChat(null)} />}
    </section>
  );
}
