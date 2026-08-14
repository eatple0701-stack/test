import React, { useMemo, useState } from 'react';
import { restaurants } from '../data/restaurants';
import { isQuarantined } from '../data/verification';
import {
  courses, featuredZones, hiddenGemIds, weekendPickIds,
  traditionalMarkets, seasonalFoods, festivals,
} from '../data/experiences';
import PlaceImage from './PlaceImage';
import PlaceCard from './PlaceCard';
import CultureCards from './CultureCards';
import { CULTURE_CARDS } from '../content/cultureCards.js';
import { ChevronRightIcon, MapPinIcon, SparkleIcon, CheckIcon } from './Icons';
import { useText } from './localeText.js';
import { ZONE_KO, ZONE_ES, ZONE_FR, ZONE_AR } from '../data/culture';

// The index: places, markets and neighbourhoods.
//
// All of this used to sit underneath Explore, thirteen shelves of it, so the
// feed spent one and a half screens saying what 밥친구 is and another eight
// being a restaurant directory. Nothing here is bad — a traveller does want
// to know where the markets are — but it was answering a different question
// than the screen above it, and volume made the answer look like the point.
//
// It has its own tab now. Going somewhere to browse is a different intent
// from being shown what to do today, and separating them lets each one be
// what it is.

const spotlightIds = ['balwoo', 'osegyehyang', 'eid', 'ggot-epida'];
const spotlightPicks = spotlightIds.map(id => restaurants.find(r => r.id === id)).filter(Boolean);

const storyIds = ['camouflage', 'kampungku', 'gonghwachun'];
const storyPicks = storyIds.map(id => restaurants.find(r => r.id === id)).filter(Boolean);

const activePlaces = restaurants.filter(r => !isQuarantined(r));

// Records read "Balwoo Gongyang (발우공양)": romanised name outside the
// brackets, the sign as it reads inside. Korean mode shows the sign. Kept
// here and in PlaceCard rather than in the data, because it is a rendering
// rule about one field rather than a fact about the place.
const placeName = (place, say) => {
  const roman = place.name.split('(')[0].trim();
  const inBrackets = place.name.match(/\(([^)]+)\)/)?.[1]?.trim();
  return say(roman, inBrackets || roman, roman, roman, roman);
};

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

export default function PlacesTab({
  onOpenRestaurant, onOpenStory, onExploreZone, bookmarkedIds = [], onToggleBookmark,
  visitedMarkets = [], onToggleMarket, onOpenMap,
}) {
  const say = useText();
  const byId = useMemo(() => Object.fromEntries(restaurants.map(r => [r.id, r])), []);
  const [showCulture, setShowCulture] = useState(false);
  const [cultureStart, setCultureStart] = useState(0);

  const todaysPick = activePlaces[dayOfYear(new Date()) % activePlaces.length];
  const hiddenGemPicks = hiddenGemIds.map(id => byId[id]).filter(Boolean);
  const weekendPicks = weekendPickIds.map(id => byId[id]).filter(Boolean);
  const currentMonth = new Date().getMonth() + 1;
  const openStory = onOpenStory ?? onOpenRestaurant;
  const isSaved = (id) => bookmarkedIds.includes(id);

  return (
    <section className="places-tab" aria-label="Places">
      <header className="screen-head">
        <span className="screen-head__kr">둘러보기</span>
        <h1 className="screen-head__title">
          {say('Places, markets and the city around them.', '식당과 시장, 그리고 그 주변의 도시.', 'Sitios, mercados y la ciudad alrededor.', 'Des adresses, des marchés et la ville autour.', 'أماكن وأسواق والمدينة من حولها.')}
        </h1>
        <p className="screen-head__sub">
          {say(`${activePlaces.length} verified places, ${traditionalMarkets.length} markets.`,
            `확인된 장소 ${activePlaces.length}곳, 시장 ${traditionalMarkets.length}곳.`,
            `${activePlaces.length} sitios verificados, ${traditionalMarkets.length} mercados.`, `${activePlaces.length} adresses vérifiées, ${traditionalMarkets.length} marchés.`, `${activePlaces.length} أماكن موثّقة، و${traditionalMarkets.length} أسواق.`)}
        </p>
      </header>

      <div className="home-section">
        <div className="home-section__header">
          <span className="panel-icon" aria-hidden="true"><SparkleIcon size={18} /></span>
          <h2>{say('Today\u2019s Korean Experience', '오늘의 한국 경험', 'La experiencia coreana de hoy', "L'expérience coréenne du jour", 'التجربة الكورية اليوم')}</h2>
        </div>
        <button className="spotlight-card" onClick={() => openStory(todaysPick)}>
          <PlaceImage place={todaysPick} variant="hero" className="spotlight-card__img" />
          <div className="spotlight-card__body">
            <span className="gather-card__tag">{say(todaysPick.zone, ZONE_KO[todaysPick.zone], ZONE_ES[todaysPick.zone], ZONE_FR[todaysPick.zone], ZONE_AR[todaysPick.zone])}</span>
            <h3>{placeName(todaysPick, say)}</h3>
            <p className="spotlight-card__quote">&ldquo;{say(todaysPick.vibe, todaysPick.vibeKo, todaysPick.vibeEs, todaysPick.vibeFr, todaysPick.vibeAr)}&rdquo;</p>
            <span className="spotlight-card__cta">
              {say('Read the story', '이야기 읽기', 'Leer la historia', "Lire l'histoire", 'اقرأ الحكاية')} <ChevronRightIcon size={14} />
            </span>
          </div>
        </button>
      </div>

      <div className="home-section">
        <div className="home-section__header">
          <h2>{say('Traditional Markets', '전통시장', 'Mercados tradicionales', 'Marchés traditionnels', 'الأسواق التقليدية')}</h2>
          <span className="home-section__count">{visitedMarkets.length}/{traditionalMarkets.length}</span>
        </div>
        <div className="home-scroll-row">
          {traditionalMarkets.map(m => {
            const visited = visitedMarkets.some(e => e.id === m.id);
            return (
              <div key={m.id} className={`market-card${visited ? ' is-visited' : ''}`}>
                <button className="market-card__hit" data-kr={m.nameKo} onClick={() => onExploreZone(m.zone)}>
                  {/* Follows the language setting like every other Korean
                      name on a card. Nothing is lost when it goes: the
                      heading under it is the same market in English and the
                      line under that is where it is. */}
                  <span className="gather-card__tag gather-card__tag-kr" translate="no">{m.nameKo}</span>
                  <h3>{say(m.name, m.nameKo, m.nameEs, m.nameFr, m.nameAr)}</h3>
                  <p className="gather-card__meta"><MapPinIcon size={14} /> {say(m.zone, m.zoneKo, m.zoneEs, m.zoneFr, m.zoneAr)}</p>
                  <p className="gather-card__desc">{say(m.blurb, m.blurbKo, m.blurbEs, m.blurbFr, m.blurbAr)}</p>
                </button>
                {onToggleMarket && (
                  <button
                    className={`market-card__check${visited ? ' is-visited' : ''}`}
                    aria-pressed={visited}
                    aria-label={visited ? `Mark ${m.name} as not visited` : `Mark ${m.name} as visited`}
                    onClick={() => onToggleMarket(m.id)}
                  >
                    {visited
                      ? <><CheckIcon size={14} /> {say('Visited', '가봤어요', 'Visitado', 'Visité', 'زُرته')}</>
                      : say('Mark visited', '가봤다고 표시', 'Marcar como visitado', 'Marquer comme visité', 'ضع علامة زُرته')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="home-section">
        <div className="home-section__header">
          <h2>{say('Popular with Travelers', '여행자들이 많이 찾는 곳', 'Los favoritos de los viajeros', 'Les préférés des voyageurs', 'المفضّلة لدى المسافرين')}</h2>
        </div>
        <div className="home-scroll-row">
          {spotlightPicks.map(place => (
            <PlaceCard key={place.id} place={place} onClick={() => onOpenRestaurant(place)}
              isSaved={isSaved(place.id)} onToggleSave={onToggleBookmark} />
          ))}
        </div>
      </div>

      <div className="home-section">
        <div className="home-section__header"><h2>{say('Food Stories', '음식에 얽힌 이야기', 'Historias de comida', 'Histoires de cuisine', 'حكايات طعام')}</h2></div>
        <div className="home-scroll-row">
          {storyPicks.map(place => (
            <button key={place.id} className="gather-card" onClick={() => openStory(place)}>
              <span className="gather-card__tag">{say(place.zone, ZONE_KO[place.zone], ZONE_ES[place.zone], ZONE_FR[place.zone], ZONE_AR[place.zone])}</span>
              <h3>{placeName(place, say)}</h3>
              <p className="gather-card__desc">&ldquo;{say(place.vibe, place.vibeKo, place.vibeEs, place.vibeFr, place.vibeAr)}&rdquo;</p>
            </button>
          ))}
        </div>
      </div>

      <div className="home-section">
        <div className="home-section__header"><h2>{say('Recommended Courses', '추천 코스', 'Rutas recomendadas', 'Parcours recommandés', 'مسارات مقترحة')}</h2></div>
        <div className="home-scroll-row">
          {courses.map(c => {
            const stops = c.stopIds.map(id => byId[id]).filter(Boolean);
            const first = stops[0];
            return (
              <button key={c.id} className="course-card" onClick={() => first && onOpenRestaurant(first)}>
                <div className="course-card__stack">
                  {stops.slice(0, 3).map(st => (
                    <PlaceImage key={st.id} place={st} variant="thumb" className="course-card__thumb" />
                  ))}
                </div>
                <h3>{say(c.title, c.titleKo, c.titleEs, c.titleFr, c.titleAr)}</h3>
                <p className="course-card__meta">{say(c.duration, c.durationKo, c.durationEs, c.durationFr, c.durationAr)}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="home-section">
        <div className="home-section__header"><h2>{say('Weekend Picks', '주말에 가볼 만한 곳', 'Para el fin de semana', 'Pour le week-end', 'لعطلة الأسبوع')}</h2></div>
        <div className="home-scroll-row">
          {weekendPicks.map(place => (
            <PlaceCard key={place.id} place={place} onClick={() => onOpenRestaurant(place)}
              isSaved={isSaved(place.id)} onToggleSave={onToggleBookmark} />
          ))}
        </div>
      </div>

      <div className="home-section">
        <div className="home-section__header"><h2>{say('Local Hidden Gems', '현지인만 아는 곳', 'Joyas que solo conocen los locales', "Les adresses que seuls les gens d'ici connaissent", 'أماكن لا يعرفها إلا أهل المكان')}</h2></div>
        <div className="home-scroll-row">
          {hiddenGemPicks.map(place => (
            <PlaceCard key={place.id} place={place} onClick={() => onOpenRestaurant(place)}
              isSaved={isSaved(place.id)} onToggleSave={onToggleBookmark} />
          ))}
        </div>
      </div>

      <div className="home-section">
        <div className="home-section__header"><h2>{say('Seasonal Foods', '제철 음식', 'Comida de temporada', 'Produits de saison', 'أطعمة الموسم')}</h2></div>
        <div className="home-scroll-row">
          {seasonalFoods.map(f => {
            const inSeason = f.months.includes(currentMonth);
            return (
              <div key={f.id} className={`gather-card gather-card--static gather-card--kr${inSeason ? ' is-highlighted' : ''}`} data-kr={f.nameKo}>
                <span className="gather-card__tag">
                  {say(f.season, f.seasonKo, f.seasonEs, f.seasonFr, f.seasonAr)}
                  {inSeason ? say(' · In season now', ' · 지금이 제철', ' · ahora es temporada', " · c'est la saison", ' · الآن موسمه') : ''}
                </span>
                <h3>{say(f.name, f.nameKo, f.nameEs, f.nameFr, f.nameAr)} <span className="gather-card__kr">{f.nameKo}</span></h3>
                <p className="gather-card__desc">{say(f.blurb, f.blurbKo, f.blurbEs, f.blurbFr, f.blurbAr)}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="home-section">
        <div className="home-section__header"><h2>{say('Festival Picks', '축제', 'Festivales', 'Festivals', 'المهرجانات')}</h2></div>
        <div className="home-scroll-row">
          {festivals.map(f => (
            <div key={f.id} className="gather-card gather-card--static gather-card--kr" data-kr={f.nameKo}>
              <span className="gather-card__tag">{say(f.when, f.whenKo, f.whenEs, f.whenFr, f.whenAr)}</span>
              <h3>{say(f.name, f.nameKo, f.nameEs, f.nameFr, f.nameAr)} <span className="gather-card__kr">{f.nameKo}</span></h3>
              <p className="gather-card__desc">{say(f.blurb, f.blurbKo, f.blurbEs, f.blurbFr, f.blurbAr)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="home-section">
        <div className="home-section__header"><h2>{say('Korean Dining Culture', '한국의 식문화', 'La cultura de la mesa coreana', 'La culture de la table coréenne', 'ثقافة المائدة الكورية')}</h2></div>
        <div className="home-scroll-row">
          {CULTURE_CARDS.slice(0, 4).map((c, i) => (
            <button key={c.title} className="zone-card" style={{ flex: '0 0 180px' }}
              onClick={() => { setCultureStart(i); setShowCulture(true); }}>
              <h3>{say(c.title, c.titleKo, c.titleEs, c.titleFr, c.titleAr)}</h3>
              <p>{say(c.desc, c.descKo, c.descEs, c.descFr, c.descAr)}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="home-section">
        <div className="home-section__header"><h2>{say('Recommended Neighborhoods', '동네 추천', 'Barrios recomendados', 'Quartiers recommandés', 'أحياء مقترحة')}</h2></div>
        <div className="zone-grid">
          {featuredZones.map(z => (
            <button key={z.name} className="zone-card" onClick={() => onExploreZone(z.name)}>
              <h3>{say(z.name, z.nameKo, z.nameEs, z.nameFr, z.nameAr)}</h3>
              <p>{say(z.blurb, z.blurbKo, z.blurbEs, z.blurbFr, z.blurbAr)}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="home-section home-section--tight">
        <button
          className="map-cta"
          onClick={() => onOpenMap?.({ title: 'Every place, plotted', subtitle: 'Filter by zone, diet or vibe' })}
        >
          <span className="map-cta__title">{say('See it all on the map', '지도에서 한눈에 보기', 'Verlo todo en el mapa', 'Voir tout sur la carte', 'انظر كل شيء على الخريطة')}</span>
          <span className="map-cta__body">
            {say('Every place above, plotted — filter by zone, diet or vibe.',
              '위의 모든 장소가 지도 위에 찍혀 있습니다. 지역, 식단, 분위기로 걸러 보세요.', 'Todos los sitios de arriba, en el mapa: filtra por zona, dieta o ambiente.', 'Toutes les adresses ci-dessus, sur la carte : filtrez par quartier, régime ou ambiance.', 'كل الأماكن أعلاه على الخريطة: صفِّ بالحيّ أو النظام الغذائي أو الأجواء.')}
          </span>
          <span className="map-cta__link">
            {say('Open the map', '지도 열기', 'Abrir el mapa', 'Ouvrir la carte', 'افتح الخريطة')} <ChevronRightIcon size={16} />
          </span>
        </button>
      </div>

      {showCulture && <CultureCards onClose={() => setShowCulture(false)} startIndex={cultureStart} />}
    </section>
  );
}
