import React, { useState } from 'react';
import { LANGUAGES, languageLabel } from '../domain/catalog/languages.js';
import { GENDERS } from '../domain/catalog/genders.js';
import { RESTRICTIONS, restrictionLabel, DIETS } from '../data/profile';
import { useText } from './localeText.js';

// The four things the app actually does something with about you.
//
// This was its own tab. The 8/2 meeting decided to merge it into the Passport,
// and a foreign tester wrote the same thing independently — "merge passport
// and profile" — so it is a section now rather than a destination.
//
// It was never a settings screen in the usual sense. What was here originally
// was: "Countries Visited: 3" as a typed-in literal, interests nobody had been
// asked about, and pickers wired to onChange={() => {}}. Everything below is
// either typed by the person reading it or not shown at all, and each field
// changes something visible on another screen — which is the only reason a
// setting deserves a row.

/**
 * One question on the profile.
 *
 * `control` marks the three questions answered by a single box rather than a
 * row of chips. Those render as a real <label> wrapped around the input, so
 * the words above it are the box's name rather than text that happens to sit
 * nearby — measured 2026-08-04, all three were unlabelled, which meant a
 * screen reader announced "edit text, Aya" and nothing else. Chip rows stay a
 * <div>: a label pointing at seven buttons names none of them.
 */
function Field({ label, hint, children, control }) {
  const Tag = control ? 'label' : 'div';
  return (
    <Tag className="profile-field">
      <span className="profile-field__label">{label}</span>
      {children}
      {hint && <p className="profile-field__hint">{hint}</p>}
    </Tag>
  );
}

// Saved on every keystroke rather than on blur. Blur never fires if somebody
// types their name and taps straight to Tables, and losing it there means
// being asked for it again at the next table — which is the exact thing this
// exists to stop.
export default function ProfileFields({ profile, onProfileChange }) {
  const say = useText();
  const [name, setName] = useState(profile?.name ?? '');
  const [nationality, setNationality] = useState(profile?.nationality ?? '');
  const [allergyNote, setAllergyNote] = useState(profile?.allergyNote ?? '');
  const languages = profile?.languages ?? [];
  const avoids = profile?.avoids ?? [];
  const diets = profile?.diets ?? [];
  const gender = profile?.gender ?? null;
  const save = (patch) => onProfileChange?.({ ...profile, ...patch });

  const toggle = (list, value) =>
    list.includes(value) ? list.filter(v => v !== value) : [...list, value];

  return (
    <div className="profile-body">
        <Field
          control
          label={say('이름 · Your name', '이름', 'Tu nombre', 'Votre nom', 'اسمك', '你的名字', 'あなたの名前')}
          hint={say('What the table looks for when you arrive.', '밥상에서 상대가 찾을 이름이에요.', 'Lo que la mesa busca cuando llegas.', "Ce que la table cherche à votre arrivée.", 'ما تبحث عنه المائدة حين تصل.', '同桌的人到时候就找这个名字。', '食卓の人が探すのはこの名前です。')}
        >
          <input
            type="text"
            className="profile-input"
            value={name}
            placeholder="Aya"
            onChange={e => { setName(e.target.value); save({ name: e.target.value.trim() }); }}
          />
        </Field>

        <Field control label={say('출신 · Where you are from', '출신', 'De dónde eres', "D'où vous venez", 'من أين أنت', '你从哪儿来', '出身')} hint={say('Optional. Only the table sees it.', '선택이에요. 밥상에서만 보입니다.', 'Opcional. Solo lo ve la mesa.', 'Facultatif. Seule la table le voit.', 'اختياري. لا يراه إلا أهل المائدة.', '可以不填。只有同桌的人看得到。', '任意です。食卓の人にだけ見えます。')}>
          <input
            type="text"
            className="profile-input"
            value={nationality}
            placeholder={say('Japan', '일본', 'Japón', 'Japon', 'اليابان', '日本', '日本')}
            onChange={e => { setNationality(e.target.value); save({ nationality: e.target.value.trim() }); }}
          />
        </Field>

        <Field
          label={say('할 수 있는 언어 · Languages you speak', '할 수 있는 언어', 'Idiomas que hablas', 'Langues que vous parlez', 'اللغات التي تتحدّثها', '你会说的语言', '話せる言語')}
          hint={say('So a host knows what the table will run in.', '밥상이 어떤 언어로 돌아갈지 호스트가 알 수 있게요.', 'Para que el anfitrión sepa en qué idioma irá la mesa.', "Pour que l'hôte sache dans quelle langue se passera la table.", 'ليعرف المضيف بأيّ لغة ستدور المائدة.', '让主人知道这桌会用什么语言。', 'この食卓が何語で進むか、ホストが分かるように。')}
        >
          <div className="chip-row">
            {LANGUAGES.map(l => (
              <button
                key={l}
                className={`chip${languages.includes(l) ? ' active' : ''}`}
                aria-pressed={languages.includes(l)}
                onClick={() => save({ languages: toggle(languages, l) })}
              >
                {/* Own script first, so somebody finds their own language by
                    shape; the English name under it, so they can also read
                    the six they are not looking for. */}
                <span className="chip__native" translate="no">{l}</span>
                {languageLabel(l).en && (
                  <span className="chip__en">{languageLabel(l).en}</span>
                )}
              </button>
            ))}
          </div>
        </Field>

        {/* Optional and self-declared, exactly like nationality — never
            verified, never used by the app to decide anything about a dish.
            The one place it changes another screen: the Tables filter
            (TablesTab.jsx), which is the feature this field exists for. */}
        <Field
          label={say('성별 · Gender (optional)', '성별 (선택)', 'Género (opcional)', 'Genre (facultatif)', 'الجنس (اختياري)', '性别（可选）', '性別（任意）')}
          hint={say('Not verified. Lets you filter for tables with another woman.', '확인하지 않습니다. 여성이 있는 밥상만 골라 보는 데 쓰여요.', 'Sin verificar. Sirve para filtrar mesas donde hay otra mujer.', "Non vérifié. Sert à filtrer les tables où il y a une autre femme.", 'غير مُتحقَّق منه. يُستخدم لتصفية الموائد التي فيها امرأة أخرى.', '不做核实。用来筛选有其他女性的饭桌。', '確認はしません。女性がいる食卓を絞り込むのに使います。')}
        >
          <div className="chip-row">
            {GENDERS.map(g => (
              <button
                key={g}
                className={`chip${gender === g ? ' active' : ''}`}
                aria-pressed={gender === g}
                onClick={() => save({ gender: gender === g ? null : g })}
              >
                {g}
              </button>
            ))}
          </div>
        </Field>

        {/* The one setting that changes what other screens say. A dish whose
            ingredients you have excluded is flagged on the table list, on the
            table itself, and while opening one — the plan calls this 개인
            조건에 적합한 한식 메뉴 우선 제시, and a preference the app never
            acts on is decoration. */}
        <Field
          label={say('못 먹는 것 · What you do not eat', '못 먹는 것', 'Lo que no comes', 'Ce que vous ne mangez pas', 'ما لا تأكله', '你不吃什么', '食べないもの')}
          hint={say('Tables serving these are flagged before you ask. Nothing is hidden — the warning is on the card.', '이걸 내는 밥상은 요청 전에 표시됩니다. 감추지 않고, 카드에 적어 둡니다.', 'Las mesas que los sirven se marcan antes de pedir sitio. No se oculta nada: el aviso está en la tarjeta.', "Les tables qui en servent sont signalées avant votre demande. Rien n'est caché — l'avertissement est sur la carte.", 'تُعلَّم الموائد التي تقدّمها قبل أن تطلب مقعدًا. لا شيء مخفيّ — التنبيه على البطاقة.', '上这些菜的饭桌，在你申请之前就会标出来。什么都不藏——提示就在卡片上。', 'これを出す食卓は、申し込む前に印がつきます。隠しません——カードに書いてあります。')}
        >
          <div className="chip-row">
            {RESTRICTIONS.map(r => (
              <button
                key={r}
                className={`chip${avoids.includes(r) ? ' active' : ''}`}
                aria-pressed={avoids.includes(r)}
                onClick={() => save({ avoids: toggle(avoids, r) })}
              >
                {restrictionLabel(r)}
              </button>
            ))}
          </div>
        </Field>

        {/* The five boxes above are a fixed list on purpose — see
            RESTRICTIONS's own comment — and a fixed list always has an edge
            somebody falls off. A nut or sesame allergy has nowhere to go
            above this line. This does not check anything either, same as
            the boxes above it; it is carried to the host as a sentence
            instead of five checkboxes. */}
        <Field
          control
          label={say('그 밖에 못 먹는 것 · Anything else you cannot eat? (optional)', '그 밖에 못 먹는 것 (선택)', '¿Algo más que no puedas comer? (opcional)', 'Autre chose que vous ne pouvez pas manger ? (facultatif)', 'أشيء آخر لا تستطيع أكله؟ (اختياري)', '还有别的不能吃的吗？（可选）', 'ほかに食べられないものはありますか？（任意）')}
          hint={say('Free text, sent to the host with your request. Not checked against any menu.', '자유롭게 적으시면 요청과 함께 호스트에게 갑니다. 메뉴와 대조하지는 않습니다.', 'Texto libre, va al anfitrión con tu solicitud. No se contrasta con ninguna carta.', "Texte libre, transmis à l'hôte avec votre demande. Non recoupé avec une carte.", 'نصّ حرّ يصل إلى المضيف مع طلبك. لا يُقابَل بأيّ قائمة طعام.', '随便写，会跟着申请一起给主人。不会拿去和菜单对照。', '自由に書けます。申し込みと一緒にホストへ届きます。品書きとの照合はしません。')}
        >
          <textarea
            rows={2}
            className="profile-input"
            value={allergyNote}
            placeholder={say('Severe shellfish allergy, and no sesame please', '갑각류 알레르기가 심하고, 참깨는 빼 주세요', 'Alergia grave al marisco, y sin sésamo por favor', "Allergie grave aux fruits de mer, et sans sésame s'il vous plaît", 'حساسية شديدة من المحار، ومن فضلك بلا سمسم', '对贝类严重过敏，另外请不要放芝麻', '甲殻類に重いアレルギーがあります。ごまも抜いてください')}
            onChange={e => {
              setAllergyNote(e.target.value);
              save({ allergyNote: e.target.value.trim() });
            }}
          />
        </Field>

        {/* Deliberately a separate question from the one above, and worded so
            the difference is visible. The boxes above change what the app
            says about a dish; this one changes what the *host* is told. The
            app cannot rule on whether a 한상 is halal and does not try — it
            passes the word to somebody who can ask the kitchen. */}
        <Field
          label={say('식사 방식 · How you eat', '식사 방식', 'Cómo comes', 'Comment vous mangez', 'كيف تأكل', '你怎么吃', '食べ方')}
          hint={say('Sent to the host with your request. The app does not judge dishes by it — the host can ask the kitchen.', '요청과 함께 호스트에게 갑니다. 앱이 이걸로 요리를 판정하지는 않아요 — 주방에 물어볼 수 있는 사람은 호스트입니다.', 'Va al anfitrión con tu solicitud. La app no juzga platos con esto: el anfitrión puede preguntar en la cocina.', "Transmis à l'hôte avec votre demande. L'app ne juge pas les plats là-dessus — l'hôte peut demander en cuisine.", 'يصل إلى المضيف مع طلبك. لا يحكم التطبيق على الأطباق بناءً عليه — المضيف هو من يستطيع سؤال المطبخ.', '跟着申请一起给主人。应用不拿这个去判定菜——能问厨房的是主人。', '申し込みと一緒にホストへ届きます。アプリがこれで料理を判定することはありません——厨房に聞けるのはホストです。')}
        >
          <div className="chip-row">
            {DIETS.map(d => (
              <button
                key={d.id}
                className={`chip${diets.includes(d.id) ? ' active' : ''}`}
                aria-pressed={diets.includes(d.id)}
                onClick={() => save({ diets: toggle(diets, d.id) })}
              >
                {d.kr} · {d.en}
              </button>
            ))}
          </div>
        </Field>

        {/* Appearance used to sit here and was the odd one out — every field
            above changes what a host learns about you; that one only changed
            your own screen. It has its own tab now (SettingsTab), which is
            also what lets this form double as a signup step: everything left
            on it is something a table genuinely reads. */}
    </div>
  );
}
