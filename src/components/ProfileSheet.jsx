import React, { useState } from 'react';
import ProfileFields from './ProfileFields';
import { XIcon } from './Icons';
import { useText } from './localeText.js';

// Editing your profile, the way every site does it: open a form, change what
// you came to change, press Save.
//
// The Passport used to hold the whole form open, permanently, saving on every
// keystroke. Two things were wrong with that. It buried the record — the
// thing the Passport is actually for — under nine fields nobody was editing;
// and an auto-saving form with no button leaves people asking "설정만 하고
// 저장은 어떻게 해?", which is exactly what happened on 2026-08-04.
//
// So the edits live in a draft here and are written once, when Save is
// pressed. Closing without saving keeps what was there before, which is the
// other half of what a Save button promises: that not pressing it means
// nothing happened.

export default function ProfileSheet({ profile, onSave, onClose }) {
  const say = useText();
  const [draft, setDraft] = useState(profile ?? {});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    await onSave?.(draft);
    onClose?.();
  };

  return (
    <div className="auth-backdrop" role="dialog" aria-modal="true" aria-label={say('Edit profile', '프로필 수정', 'Editar perfil', 'Modifier le profil')}>
      <div className="auth-sheet profile-sheet">
        <button className="auth-close" onClick={onClose} aria-label="Close">
          <XIcon size={18} />
        </button>

        <h2 className="auth-title">프로필 설정</h2>
        <p className="auth-note profile-sheet__note">
          이 값들은 밥상에서 상대가 보게 되는 정보입니다. 저장을 눌러야 반영됩니다.
        </p>

        {/* The same fields the signup step uses, pointed at a draft instead of
            at storage — ProfileFields merges every change into whatever object
            it was handed, so it needs no idea which of the two it is in. */}
        <ProfileFields profile={draft} onProfileChange={setDraft} />

        <div className="profile-sheet__foot">
          <button className="auth-switch" onClick={onClose} disabled={saving}>
            취소 · Cancel
          </button>
          <button className="auth-primary" onClick={save} disabled={saving} translate="no">
            {saving ? '저장 중…' : '저장하기 · Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
