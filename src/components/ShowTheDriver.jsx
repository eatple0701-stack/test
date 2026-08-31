import React, { useState } from 'react';
import { CopyIcon, CheckIcon, TrainIcon } from './Icons';
import { useText } from './localeText.js';
import { isRegistryPlace } from '../data/seoulRegistry.js';

// The block you hold up to a taxi driver.
//
// ── Why this exists ─────────────────────────────────────────────────────
//
// Every way this app has of handing somebody over to a map is compromised
// in Korea, and a research pass on 2026-08-31 established how far. Google
// has no driving or walking directions here at all — transit only, and the
// last few hundred metres come back as a dotted line. Naver's web link
// redirects into a Korean app-install promo and overrides the parameter
// meant to stop it. Kakao's route link does the same and its map link is
// still untested on a phone.
//
// So the fallback has to be something that works when every link fails, and
// the thing that has always worked in Seoul is a phone screen with the
// Korean name and the Korean address on it, held up to a driver.
//
// ── What it will not print ──────────────────────────────────────────────
//
// The obvious fourth line is the nearest subway exit, and it is missing on
// purpose. `exit` is null for 19 of the 20 curated places: the routing API
// did not return it, restaurants.js says so in its own evidence note, and
// one listing that mentioned "exit 6" was recorded as unconfirmed rather
// than used. Somebody standing at the wrong exit for twenty minutes because
// this app guessed is the specific failure it exists to avoid.
//
// Each line renders only where the record actually holds it, which is not
// symmetric: the 8,118 register places have a Korean name and a Korean road
// address and no transit; the 20 curated ones have a Korean name and a
// station and a romanised address only. Nothing is filled in from the other
// side.

/** The Korean sign, from either record shape. */
const koreanName = (place) => {
  if (isRegistryPlace(place)) return place.name;          // already the sign
  // Curated records read "Balwoo Gongyang (발우공양)".
  return place.name.match(/\(([^)]+)\)/)?.[1]?.trim() ?? null;
};

const HANGUL = /[가-힣]/;

export default function ShowTheDriver({ place }) {
  const say = useText();
  const [copied, setCopied] = useState(false);

  const name = koreanName(place);
  const address = place?.address?.value ?? null;
  // Only a Korean address earns a place here. A romanised one is what the
  // curated records hold, and it is already on the page above — repeating it
  // under a heading that says "show this to a driver" would suggest it does
  // a job it does not do.
  const koreanAddress = address && HANGUL.test(address) ? address : null;
  const transit = place?.transit?.value ?? null;

  if (!name && !koreanAddress) return null;

  const lines = [name, koreanAddress].filter(Boolean);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // No clipboard permission, or an insecure origin. The text is on the
      // screen and selectable either way, which is the part that matters —
      // the button is a convenience, not the feature.
    }
  };

  return (
    <section className="driver-card">
      <h4 className="driver-card__head">
        {say('Show this to a taxi driver', '택시 기사님께 보여주세요',
          'Enséñale esto al taxista', 'Montrez ceci au chauffeur de taxi',
          'أرِ هذا لسائق التاكسي', '把这个给出租车司机看', 'タクシーの運転手さんに見せてください')}
      </h4>
      {/* translate="no" and data-no-locale together: this text is the whole
          point of the block and must reach a Korean reader unaltered, both
          by the browser's own translator and by LocaleFilter. */}
      <p className="driver-card__lines" translate="no" data-no-locale>
        {name && <span className="driver-card__name">{name}</span>}
        {koreanAddress && <span className="driver-card__addr">{koreanAddress}</span>}
      </p>
      {transit?.station && (
        <p className="driver-card__transit">
          <TrainIcon size={14} />
          {' '}
          {say(
            `${transit.station} · ${transit.line}${transit.walkingMinutes ? ` · ${transit.walkingMinutes} min walk` : ''}`,
            `${transit.station}역 · ${transit.line}${transit.walkingMinutes ? ` · 걸어서 ${transit.walkingMinutes}분` : ''}`,
            `${transit.station} · ${transit.line}${transit.walkingMinutes ? ` · ${transit.walkingMinutes} min a pie` : ''}`,
            `${transit.station} · ${transit.line}${transit.walkingMinutes ? ` · ${transit.walkingMinutes} min à pied` : ''}`,
            `${transit.station} · ${transit.line}${transit.walkingMinutes ? ` · ${transit.walkingMinutes} د سيرًا` : ''}`,
            `${transit.station} · ${transit.line}${transit.walkingMinutes ? ` · 步行 ${transit.walkingMinutes} 分钟` : ''}`,
            `${transit.station} · ${transit.line}${transit.walkingMinutes ? ` · 徒歩 ${transit.walkingMinutes} 分` : ''}`,
          )}
          {/* The exit only when the record has one. Nineteen of twenty do
              not, and a guessed exit is twenty minutes on the wrong corner. */}
          {transit.exit && ` · ${say(`Exit ${transit.exit}`, `${transit.exit}번 출구`, `Salida ${transit.exit}`, `Sortie ${transit.exit}`, `مخرج ${transit.exit}`, `${transit.exit}号出口`, `${transit.exit}番出口`)}`}
        </p>
      )}
      <button type="button" className="driver-card__copy" onClick={copy}>
        {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
        {' '}
        {copied
          ? say('Copied', '복사했어요', 'Copiado', 'Copié', 'تم النسخ', '已复制', 'コピーしました')
          : say('Copy', '복사', 'Copiar', 'Copier', 'انسخ', '复制', 'コピー')}
      </button>
    </section>
  );
}
