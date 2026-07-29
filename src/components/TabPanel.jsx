import React, { useState } from 'react';
import { ChevronRightIcon } from './Icons';


const LANGUAGE_OPTIONS = ['English', '한국어', '日本語', '中文', 'Español'];
const FOOD_OPTIONS = ['No preference', 'Mild', 'Spicy', 'Fermented-lover', 'Street food fan'];
const DIETARY_OPTIONS = ['No restriction', 'Vegan', 'Vegetarian', 'Halal', 'Pescatarian'];
const MATCH_RADIUS_OPTIONS = ['Same neighborhood', 'Anywhere in Seoul', 'Anywhere in Korea'];

function SettingsRow({ icon, label, value, action, expanded, children }) {
  return (
    <div className="settings-item-wrap">
      <div className={`settings-item${action ? ' settings-item--clickable' : ''}`} onClick={action}>
        <span className="settings-icon">{icon}</span>
        <div className="settings-text">
          <span className="settings-label">{label}</span>
        </div>
        {value && <span className="settings-value">{value}</span>}
        {action && <ChevronRightIcon size={18} />}
      </div>
      {expanded && <div className="settings-expand">{children}</div>}
    </div>
  );
}

function OptionPicker({ options, value, onChange }) {
  return (
    <div className="chip-row">
      {options.map(opt => (
        <button
          key={opt}
          className={`chip${value === opt ? ' active' : ''}`}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <span className={`toggle-switch${checked ? ' on' : ''}`} onClick={() => onChange(!checked)}>
        <span className="toggle-switch__knob" />
      </span>
    </label>
  );
}

function ProfileTab({ onNavigate }) {
  const [openSection, setOpenSection] = useState(null);
  const [language, setLanguage] = useState('English');
  const [foodPref, setFoodPref] = useState('No preference');
  const [dietaryPref, setDietaryPref] = useState('No restriction');
  const [matchRadius, setMatchRadius] = useState('Anywhere in Seoul');
  const [notifyMatches, setNotifyMatches] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [notifyGatherings, setNotifyGatherings] = useState(false);

  const toggleSection = (key) => setOpenSection(s => (s === key ? null : key));

  return (
    <section className="tab-panel profile-panel">
      <header className="screen-head">
        <span className="screen-head__kr">설정</span>
        <h1 className="screen-head__title">How the app should treat you.</h1>
        <p className="screen-head__sub">Language, what you eat, and what you would rather not.</p>
      </header>

      <div className="settings-list">
        <SettingsRow
          icon="🌐"
          label="Language"
          value={language}
          action={() => toggleSection('language')}
          expanded={openSection === 'language'}
        >
          <OptionPicker options={LANGUAGE_OPTIONS} value={language} onChange={setLanguage} />
        </SettingsRow>

        <SettingsRow
          icon="🍲"
          label="Food Preferences"
          value={foodPref}
          action={() => toggleSection('food')}
          expanded={openSection === 'food'}
        >
          <OptionPicker options={FOOD_OPTIONS} value={foodPref} onChange={setFoodPref} />
        </SettingsRow>

        <SettingsRow
          icon="🌱"
          label="Dietary Preferences"
          value={dietaryPref}
          action={() => toggleSection('dietary')}
          expanded={openSection === 'dietary'}
        >
          <OptionPicker options={DIETARY_OPTIONS} value={dietaryPref} onChange={setDietaryPref} />
        </SettingsRow>

        <SettingsRow
          icon="✈️"
          label="Travel Style"
          value="Foodie, Cultural"
          action={() => toggleSection('travelstyle')}
          expanded={openSection === 'travelstyle'}
        >
          <OptionPicker options={['Foodie', 'Cultural', 'Adventure', 'Relaxation', 'Nightlife']} value="Foodie" onChange={() => {}} />
        </SettingsRow>

        <SettingsRow
          icon="🌍"
          label="Countries Visited"
          value="3"
        />

        <SettingsRow
          icon="⭐"
          label="Interests"
          value="Photography, History, Cafe Hopping"
        />

        <SettingsRow
          icon="📅"
          label="Availability"
          value="Weekends"
          action={() => toggleSection('availability')}
          expanded={openSection === 'availability'}
        >
          <OptionPicker options={['Weekdays', 'Weekends', 'Anytime', 'Evenings only']} value="Weekends" onChange={() => {}} />
        </SettingsRow>

        <SettingsRow
          icon="🤝"
          label="Match Preferences"
          value={matchRadius}
          action={() => toggleSection('matching')}
          expanded={openSection === 'matching'}
        >
          <p className="settings-expand__hint">Who shows up in your Match deck.</p>
          <OptionPicker options={MATCH_RADIUS_OPTIONS} value={matchRadius} onChange={setMatchRadius} />
        </SettingsRow>

        <SettingsRow
          icon="🔔"
          label="Notifications"
          action={() => toggleSection('notifications')}
          expanded={openSection === 'notifications'}
        >
          <ToggleRow label="New matches" checked={notifyMatches} onChange={setNotifyMatches} />
          <ToggleRow label="Messages" checked={notifyMessages} onChange={setNotifyMessages} />
          <ToggleRow label="Gatherings near me" checked={notifyGatherings} onChange={setNotifyGatherings} />
        </SettingsRow>

        <SettingsRow
          icon="❤️"
          label="Saved Places"
          value="View Journal"
          action={() => onNavigate('journal')}
        />

        <SettingsRow icon="ℹ️" label="About TableMate" value="v2.0" />
        <SettingsRow icon="🔒" label="Privacy Policy" />
      </div>
    </section>
  );
}

export default function TabPanel({ tab, onNavigate }) {
  if (tab === 'profile') return <ProfileTab onNavigate={onNavigate} />;
  return null;
}
