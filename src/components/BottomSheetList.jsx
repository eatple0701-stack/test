import React, { useMemo, useState } from 'react';
import PlaceImage from './PlaceImage';
import { HeartIcon, CompassIcon } from './Icons';
import { haversineKm, formatDistance, getOpenStatus, directionsUrl, coordsOf } from '../utils';
import { dietaryBadges } from '../data/verification';
import { isRegistryPlace } from '../data/seoulRegistry.js';
import { groupsOf } from '../domain/catalog/dishGroups.js';
import { useText, useLocale } from './localeText.js';

// The traits that make up the sustainability axis (see TRAIT_GROUPS in App).
const SUSTAINABILITY_TRAITS = ['Zero-waste', 'Local Sourcing'];

function PlaceCard({ place, bookmarked, onOpen, onToggleBookmark, onReadStory, lens, mapCenter }) {
  const say = useText();
  const locale = useLocale();
  const name = place.name.split('(')[0].trim();
  // getOpenStatus translates its own words, but only when it is told which
  // language to use. It was not, so every reader saw `Open · closes 10:00 PM`
  // in English whatever the setting said — the failure mode the i18n audit
  // cannot see, because the Korean was never a string in a table to miss.
  const status = getOpenStatus(place.hours, new Date(), locale);
  // Dietary badges say exactly what we know ("Vegan options" ≠ "Fully vegan");
  // traits are descriptive. Cards stay scannable, so cap the list.
  //
  // Under the lens the matched trait moves to the front of the traits, because
  // the 3-badge cap otherwise hides it on exactly the places it matters most —
  // balwoo and sanchon both carry it last. Display order only; place.traits is
  // never mutated, and dietary badges keep the lead since they are the
  // safety-relevant ones.
  const traits = lens
    ? [...place.traits].sort((a, b) =>
        Number(SUSTAINABILITY_TRAITS.includes(b)) - Number(SUSTAINABILITY_TRAITS.includes(a)))
    : place.traits;
  const badges = [...dietaryBadges(place).map(b => b.label), ...traits];
  const extraBadges = badges.length - 3;

  // A register row has no dietary record and no traits, so its badge row was
  // empty — a card that said nothing about why it was in the list. What it
  // does have is the dish its own menu carries, which is the only reason it
  // survived the filter, so that is what the chips say instead.
  const fromRegister = isRegistryPlace(place);
  const groups = fromRegister ? groupsOf(place.registry?.dishes) : [];

  return (
    <article className="place-card">
      <div className="place-card__body">
        {/* Stretched link: the name button's ::after covers the whole card */}
        <h4 className="place-card__name">
          <button className="place-card__open-btn" onClick={() => onOpen(place)}>
            {name}
          </button>
        </h4>

        <p className="place-card__meta">
          {status && (
            <>
              <span className={status.open ? 'is-open' : 'is-closed'}>{status.label}</span>
              <span aria-hidden="true">·</span>
              <span>{status.detail}</span>
              <span aria-hidden="true">·</span>
            </>
          )}
          <span>{formatDistance(place.distanceKm)}</span>
        </p>

        <div className="place-card__badges">
          {fromRegister
            ? groups.map(g => (
              <span key={g.id} className="tag-chip tag-chip--dish" style={{ background: g.tint }}>
                {g.emoji} {say(g.en, g.ko, g.es, g.fr, g.ar, g.zh, g.ja)}
              </span>
            ))
            : (
              <>
                {badges.slice(0, 3).map(label => (
                  <span key={label} className="tag-chip">{label}</span>
                ))}
                {extraBadges > 0 && <span className="tag-chip">+{extraBadges}</span>}
              </>
            )}
        </div>

        {/* The restaurant's own recorded line, verbatim — the same string the
            detail page shows. Nothing is written or summarised for the list. */}
        {lens && <p className="place-card__esg">{place.esg_point}</p>}

        {/* A "✨ 98% Match: Fits your budget, dietary needs, and schedule!"
            banner used to render here whenever distanceKm < 3. It was a
            distance check wearing a compatibility score: the number was
            invented, and the app has never asked anyone their budget or their
            schedule, so two of the three things it claimed to have matched
            are not data this app holds. Shown to foreign visitors, by a
            publicly funded project, directly under a comment promising that
            nothing in this list is written or summarised for them. Removed
            rather than reworded — there is no honest version of a number
            nobody computed. */}
      </div>

      <PlaceImage place={place} variant="thumb" className="place-card__media" />

      <div className="place-card__foot">
        <button
          className="place-card__story-btn"
          aria-label={fromRegister ? `What the register holds about ${name}` : `Read the story of ${name}`}
          onClick={() => onReadStory(place)}
        >
          {fromRegister
            ? say('Address & hours', '주소·영업시간', 'Dirección y horario', 'Adresse et horaires', 'العنوان والمواعيد', '地址·营业时间', '住所・営業時間')
            : say('Read Story', '이야기 읽기', 'Leer la historia', "Lire l'histoire", 'اقرأ الحكاية', '读这个故事', '物語を読む')}
        </button>

        <div className="place-card__actions">
          <button
            className={`icon-btn${bookmarked ? ' icon-btn--saved' : ''}`}
            aria-label={bookmarked ? `Remove ${name} from journal` : `Save ${name} to journal`}
            aria-pressed={bookmarked}
            onClick={() => onToggleBookmark(place.id)}
          >
            <HeartIcon size={20} filled={bookmarked} />
          </button>
          <button
            className="icon-btn"
            aria-label={`Get directions to ${name}`}
            onClick={() => window.open(directionsUrl(place, mapCenter), '_blank')}
          >
            <CompassIcon size={20} />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function BottomSheetList({
  restaurants, onRestaurantClick, onReadStory, onToggleBookmark, bookmarkedIds, mapCenter,
  sustainabilityLens, onResetFilters,
}) {
  const say = useText();
  const sorted = useMemo(() =>
    restaurants
      .map(r => {
        const { lat, lng } = coordsOf(r);
        const distanceKm = Number.isFinite(lat) && Number.isFinite(lng)
          ? haversineKm(mapCenter[0], mapCenter[1], lat, lng)
          : null;
        return { ...r, distanceKm };
      })
      // A place the register never gave a position for sorts last rather
      // than to the top: NaN compares false against everything, which put
      // them wherever the sort happened to leave them.
      .sort((a, b) => {
        if (a.distanceKm === null) return b.distanceKm === null ? 0 : 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      }),
  [restaurants, mapCenter]);

  // The list holds twenty places or seven thousand depending on whether the
  // 서울관광재단 register has loaded, and `sorted.map` renders every one of
  // them. Seven thousand cards is a locked main thread on a phone, so the
  // list grows a page at a time.
  const PAGE = 40;
  const [shown, setShown] = useState(PAGE);
  const visible = sorted.slice(0, shown);
  const remaining = sorted.length - visible.length;

  return (
    <div className="place-list">
      <div className="place-list__header">
        <h3>{say(`${sorted.length} place${sorted.length === 1 ? '' : 's'}`, `${sorted.length}곳`,
          `${sorted.length} sitio${sorted.length === 1 ? '' : 's'}`, `${sorted.length} lieu${sorted.length === 1 ? '' : 'x'}`,
          `${sorted.length} أماكن`, `${sorted.length} 处`, `${sorted.length}件`)}</h3>
        {sorted.length > 1 && <span className="place-list__hint">{say('Nearest first', '가까운 순', 'Más cercanos primero', 'Les plus proches en premier', 'الأقرب أولًا', '近的排前面', '近い順')}</span>}
      </div>

      {/* Said once for the whole list rather than on every card: the same
          caveat the detail page carries, so the lines below are never read as
          audited. */}
      {sustainabilityLens && sorted.length > 0 && (
        <p className="section-note place-list__note">
          {say('Described by the restaurant and our research; not independently audited.',
            '식당 소개와 저희 조사에 따른 것이며, 독립적으로 검증되지는 않았습니다.',
            'Según lo que describen el restaurante y nuestra investigación; sin auditoría independiente.', 'Décrit par le restaurant et par nos recherches ; sans audit indépendant.', 'بحسب وصف المطعم وبحثنا؛ دون تدقيق مستقلّ.', '依据餐厅的说明和我们的调研；没有独立审核。', '店の説明と私たちの調べによります。第三者の検証は受けていません。')}
        </p>
      )}

      {visible.map(r => (
        <PlaceCard
          key={r.id}
          place={r}
          bookmarked={bookmarkedIds.includes(r.id)}
          onOpen={onRestaurantClick}
          onReadStory={onReadStory}
          onToggleBookmark={onToggleBookmark}
          lens={sustainabilityLens}
          mapCenter={mapCenter}
        />
      ))}

      {remaining > 0 && (
        <button className="place-list__more" onClick={() => setShown(n => n + PAGE)}>
          {say(`Show ${Math.min(PAGE, remaining)} more · ${remaining} left`,
            `${Math.min(PAGE, remaining)}곳 더 보기 · ${remaining}곳 남음`,
            `Ver ${Math.min(PAGE, remaining)} más · quedan ${remaining}`,
            `Voir ${Math.min(PAGE, remaining)} de plus · ${remaining} restants`,
            `أظهر ${Math.min(PAGE, remaining)} أخرى · بقي ${remaining}`,
            `再看 ${Math.min(PAGE, remaining)} 处 · 还有 ${remaining} 处`,
            `さらに${Math.min(PAGE, remaining)}件 · 残り${remaining}件`)}
        </button>
      )}

      {/* Two things were wrong here and both were inherited rather than
          decided. A stock photograph of somebody else's travel, loaded from
          images.unsplash.com — an external host the service worker passes
          straight through, so the empty state was a broken image on exactly
          the connection that produced it. And a button labelled Reset Filters
          that called window.location.reload(): not a reset, a full reload
          that throws away the session and re-downloads the app to achieve
          something the caller can do in one line. On a weak signal it left a
          blank screen. onResetFilters is that one line. */}
      {sorted.length === 0 && (
        <div className="place-list__empty">
          <p className="place-list__empty-kr" translate="no">찾은 곳이 없어요</p>
          <p className="place-list__empty-en">
            {say('No place matches all of the filters at once. Removing one usually brings the list back.',
              '모든 필터를 동시에 만족하는 곳이 없습니다. 하나를 빼면 대개 목록이 돌아옵니다.',
              'Ningún sitio cumple todos los filtros a la vez. Quitar uno suele devolver la lista.', 'Aucune adresse ne remplit tous les filtres à la fois. En retirer un ramène en général la liste.', 'لا مكان يستوفي كل عوامل التصفية معًا. وإزالة واحد منها تعيد القائمة عادةً.', '没有哪个地方同时满足所有筛选条件。去掉一个，列表通常就回来了。', 'すべての条件を同時に満たす場所がありません。ひとつ外すとたいてい一覧が戻ります。')}
          </p>
          {onResetFilters && (
            <button className="place-list__empty-cta" translate="no" onClick={onResetFilters}>
              {say('필터 모두 끄기 · Clear the filters', '필터 모두 끄기', 'Quitar los filtros', 'Effacer les filtres', 'امسح عوامل التصفية', '清除筛选', '条件をすべて外す')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
