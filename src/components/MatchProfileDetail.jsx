import React, { useEffect } from 'react';
import {
  XIcon, ClockIcon, MapPinIcon, BookIcon, BowlIcon, LinkIcon, SparkleIcon, CompassIcon,
} from './Icons';
import { commonInterests } from '../data/travelers';

function SectionHead({ Icon, title }) {
  return (
    <div className="section-head">
      <span className="section-head__icon" aria-hidden="true"><Icon size={17} /></span>
      <h3>{title}</h3>
    </div>
  );
}

function TagRow({ items }) {
  return (
    <ul className="fact-row" aria-label={undefined}>
      {items.map(i => <li key={i} className="fact">{i}</li>)}
    </ul>
  );
}

export default function MatchProfileDetail({ traveler, onClose, onStartChat }) {
  useEffect(() => {
    if (!traveler) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [traveler, onClose]);

  if (!traveler) return null;

  const shared = commonInterests(traveler);

  return (
    <>
      <div className="detail-backdrop" onClick={onClose} />
      <div className="detail-sheet" role="dialog" aria-modal="true" aria-label={traveler.name} tabIndex={-1}>
        <button className="detail-close" aria-label="Close" onClick={onClose}>
          <XIcon size={18} />
        </button>

        <div className="detail-scroll">
          <div className="profile-detail-hero" style={{ background: traveler.color }}>
            <span className="profile-detail-hero__initial">{traveler.name.slice(0, 1)}</span>
            {traveler.availableToday && (
              <span className="match-card__available profile-detail-hero__available">Free today</span>
            )}
          </div>

          <div className="detail-content">
            <header className="detail-header">
              <h2>{traveler.name}, {traveler.age}</h2>
              <p className="detail-meta">
                {traveler.flag} {traveler.nationality}
                <span aria-hidden="true"> · </span>
                <MapPinIcon size={13} /> {traveler.currentLocation}
              </p>
            </header>

            <section className="detail-section" style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px' }}>
              <SectionHead Icon={SparkleIcon} title="Trust & Safety Score: 98%" />
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#333', fontSize: '14px' }}>
                <li>✅ Identity Verified</li>
                <li>✅ Email Verified</li>
                <li>🎓 University Verified</li>
                <li>🤝 12 Completed Meetups</li>
                <li>⭐ 99% Reliability</li>
                <li>🗣️ Speaks: {traveler.languages.join(', ')}</li>
              </ul>
            </section>

            <section className="detail-section">
              <SectionHead Icon={BookIcon} title="Introduction" />
              <p className="detail-body">{traveler.bio}</p>
            </section>

            <section className="detail-section">
              <SectionHead Icon={SparkleIcon} title="Taste" />
              <TagRow items={traveler.interests} />
            </section>

            <section className="detail-section">
              <SectionHead Icon={ClockIcon} title="Travel Itinerary" />
              <p className="detail-body">
                {traveler.tripDates} · {traveler.daysLeft} day{traveler.daysLeft === 1 ? '' : 's'} left in Korea
                {traveler.availableToday ? ' · free to meet today' : ' · not free today'}
              </p>
            </section>

            <section className="detail-section">
              <SectionHead Icon={BowlIcon} title="Preferred Food" />
              <TagRow items={traveler.foodPreferences} />
            </section>

            <section className="detail-section">
              <SectionHead Icon={LinkIcon} title="Language" />
              <TagRow items={traveler.languages} />
            </section>

            <section className="detail-section">
              <SectionHead Icon={MapPinIcon} title="Places to Go Together" />
              <TagRow items={traveler.wantToVisit} />
            </section>

            <section className="detail-section">
              <SectionHead Icon={CompassIcon} title="Common Interests" />
              {shared.length > 0 ? (
                <TagRow items={shared} />
              ) : (
                <p className="detail-body">No overlap yet on paper — say hello and find some in person.</p>
              )}
            </section>
            <section className="detail-section">
              <SectionHead Icon={SparkleIcon} title="Conversation Starters" />
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#555', fontSize: '14px', fontStyle: 'italic' }}>
                <li>"What Korean food do you want to try?"</li>
                <li>"Have you ever eaten Kimchi?"</li>
                <li>"Where are you travelling from?"</li>
                <li>"How long are you staying in Korea?"</li>
              </ul>
            </section>
          </div>
        </div>

        <div className="profile-detail-footer">
          <button className="btn-primary" onClick={() => onStartChat(traveler)}>
            Start Chat
          </button>
        </div>
      </div>
    </>
  );
}
