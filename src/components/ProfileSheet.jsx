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
    <div className="auth-backdrop" role="dialog" aria-modal="true" aria-label={say('Edit profile', '프로필 수정', 'Editar perfil', 'Modifier le profil', 'تعديل الملف', '编辑资料', 'プロフィールを編集')}>
      <div className="auth-sheet profile-sheet">
        <button className="auth-close" onClick={onClose} aria-label="Close">
          <XIcon size={18} />
        </button>

        <h2 className="auth-title">{say('Profile', '프로필 설정', 'Perfil', 'Profil', 'الملف الشخصي', '个人资料', 'プロフィール設定')}</h2>
        <p className="auth-note profile-sheet__note">
          {say(
            'These are what the people at a table see about you. Nothing changes until you press Save.',
            '이 값들은 밥상에서 상대가 보게 되는 정보입니다. 저장을 눌러야 반영됩니다.',
            'Esto es lo que ven de ti quienes están en una mesa. No cambia nada hasta que pulses Guardar.',
            "C'est ce que les gens à une table voient de vous. Rien ne change tant que vous n'avez pas appuyé sur Enregistrer.",
            'هذا ما يراه عنك من يجلسون إلى المائدة. لا يتغيّر شيء حتى تضغط حفظ.',
            '这些是同桌的人会看到的关于你的信息。你按了保存才会生效。',
            'これは食卓にいる人があなたについて見る内容です。保存を押すまで何も変わりません。')}
        </p>

        {/* The same fields the signup step uses, pointed at a draft instead of
            at storage — ProfileFields merges every change into whatever object
            it was handed, so it needs no idea which of the two it is in. */}
        <ProfileFields profile={draft} onProfileChange={setDraft} />

        <div className="profile-sheet__foot">
          <button className="auth-switch" onClick={onClose} disabled={saving}>
            {say('취소 · Cancel', '취소', 'Cancelar', 'Annuler', 'إلغاء', '取消', 'キャンセル')}
          </button>
          <button className="auth-primary" onClick={save} disabled={saving} translate="no">
            {saving
              ? say('Saving…', '저장 중…', 'Guardando…', 'Enregistrement…', 'جارٍ الحفظ…', '正在保存…', '保存しています…')
              : say('Save', '저장하기', 'Guardar', 'Enregistrer', 'احفظ', '保存', '保存する')}
          </button>
        </div>
      </div>
    </div>
  );
}
