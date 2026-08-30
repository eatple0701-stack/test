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
import { ZONE_KO, ZONE_ES, ZONE_FR, ZONE_AR, ZONE_ZH, ZONE_JA } from '../data/culture';
import { cityOf, citiesOf, cityName } from '../data/cities.js';
import { REGISTRY_TOTAL } from '../data/nearbyPlaces.js';

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
  return say(roman, inBrackets || roman, roman, roman, roman, roman, roman);
};

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

// ── One place, one appearance ────────────────────────────────────────────
//
// The rails were built independently, each a hand-picked list of ids, and
// nothing stopped the same id being picked twice. It was: on 2026-08-30 Nono
// Shop & Cafe was simultaneously Today's Experience, a Weekend Pick and a
// Local Hidden Gem — three of the maybe nine cards a reader sees before they
// stop scrolling, all the same vegan café. An eighteen-place catalogue read
// like a six-place one, and worse, it read like a mistake.
//
// The fix is a claim, not a filter: a rail takes a place only if no rail
// above it has already shown it. Order therefore matters and is the order
// they render in, so the earliest rail on the screen wins — which is also
// the one a reader is most likely to have actually looked at.
//
// It hides rather than reshuffles, so a rail can come out short or empty.
// Empty rails must then not render their heading: `Festival Picks` shipped
// as a heading with nothing under it and read as something broken, which is
// exactly the bug this would otherwise create four more of.
function oneAppearance() {
  const taken = new Set();
  return {
    claim(place) {
      if (!place || taken.has(place.id)) return null;
      taken.add(place.id);
      return place;
    },
    claimAll(places) {
      const kept = [];
      for (const p of places) {
        if (p && !taken.has(p.id)) { taken.add(p.id); kept.push(p); }
      }
      return kept;
    },
  };
}

export default function PlacesTab({
  onOpenRestaurant, onOpenStory, onExploreZone, bookmarkedIds = [], onToggleBookmark,
  visitedMarkets = [], onToggleMarket, onOpenMap,
}) {
  const say = useText();
  const byId = useMemo(() => Object.fromEntries(restaurants.map(r => [r.id, r])), []);
  const [showCulture, setShowCulture] = useState(false);
  const [cultureStart, setCultureStart] = useState(0);

  // Which city the reader is willing to travel to. Seven of the eighteen
  // places are in Incheon, an hour from Seoul, and the tab gave no way to say
  // "not that one" — Weekend Picks opened with two of them.
  const [city, setCity] = useState(null);          // null = everywhere
  const cities = useMemo(() => citiesOf(activePlaces), []);

  const currentMonth = new Date().getMonth() + 1;
  const openStory = onOpenStory ?? onOpenRestaurant;
  const isSaved = (id) => bookmarkedIds.includes(id);

  // Rails are assembled before anything renders, in the order they appear, so
  // that each one can see what the ones above it already took. Recomputed
  // when the city filter moves, because a place hidden by the filter has not
  // been shown and must not count as taken.
  const rails = useMemo(() => {
    const inThisCity = (p) => !city || cityOf(p?.zone) === city;
    const once = oneAppearance();
    const pool = activePlaces.filter(inThisCity);
    // Today's pick rotates by the day, over whatever the filter left. An
    // empty pool means the filter matched nothing, which is a real answer.
    const todays = pool.length ? once.claim(pool[dayOfYear(new Date()) % pool.length]) : null;
    return {
      todaysPick: todays,
      spotlight: once.claimAll(spotlightPicks.filter(inThisCity)),
      stories: once.claimAll(storyPicks.filter(inThisCity)),
      courses: courses.filter(c => {
        const stops = c.stopIds.map(id => byId[id]).filter(Boolean);
        return stops.length > 0 && stops.every(inThisCity);
      }),
      weekend: once.claimAll(weekendPickIds.map(id => byId[id]).filter(Boolean).filter(inThisCity)),
      hiddenGems: once.claimAll(hiddenGemIds.map(id => byId[id]).filter(Boolean).filter(inThisCity)),
      markets: traditionalMarkets.filter(inThisCity),
      // A featured zone is a bare neighbourhood name — 'Insadong', not
      // 'Insadong, Seoul' — so its city is read off the places that sit in
      // it. A neighbourhood no place is recorded in has no city we know, and
      // is kept rather than guessed at: dropping it would silently shrink the
      // list on a filter it was never measured against.
      zones: featuredZones.filter(z => {
        if (!city) return true;
        const found = activePlaces.find(p => String(p.zone).split(',')[0].trim() === z.name);
        return !found || cityOf(found.zone) === city;
      }),
    };
  }, [city, byId]);

  // Unpacked under the names the markup below already used, so that what each
  // rail renders is the deduplicated, city-filtered list and there is no
  // second path back to the raw one.
  const {
    todaysPick, markets, spotlight: spotlightRail, stories: storyRail,
    courses: courseRail, weekend: weekendPicks, hiddenGems: hiddenGemPicks, zones: zoneRail,
  } = rails;

  return (
    <section className="places-tab" aria-label="Places">
      <header className="screen-head">
        <span className="screen-head__kr">둘러보기</span>
        <h1 className="screen-head__title">
          {say('Places, markets and the city around them.', '식당과 시장, 그리고 그 주변의 도시.', 'Sitios, mercados y la ciudad alrededor.', 'Des adresses, des marchés et la ville autour.', 'أماكن وأسواق والمدينة من حولها.', '地点、市场，和它们周围的城市。', '店と市場、そしてその周りの街。')}
        </h1>
        {/* Two numbers used to sit one screen apart with no stated
            relationship — 18 verified places here, 8,118 on the map — and a
            reader could only conclude that one of them was wrong. They are
            different things: eighteen somebody went to and wrote up, and a
            public register nobody here has visited. Said together, in that
            order, the small number stops looking like a shortfall. */}
        <p className="screen-head__sub">
          {say(`${activePlaces.length} places we went to and wrote up, and ${traditionalMarkets.length} markets.`,
            `직접 가보고 기록한 ${activePlaces.length}곳, 그리고 시장 ${traditionalMarkets.length}곳.`,
            `${activePlaces.length} sitios que visitamos y describimos, y ${traditionalMarkets.length} mercados.`, `${activePlaces.length} adresses où nous sommes allés et que nous avons décrites, et ${traditionalMarkets.length} marchés.`, `${activePlaces.length} أماكن زرناها وكتبنا عنها، و${traditionalMarkets.length} أسواق.`, `我们亲自去过并写下来的 ${activePlaces.length} 处，以及 ${traditionalMarkets.length} 个市场。`, `実際に行って書いた${activePlaces.length}か所と、市場${traditionalMarkets.length}か所。`)}
        </p>
        <p className="screen-head__note">
          {say(`${REGISTRY_TOTAL.toLocaleString('en-US')} more are on the map — restaurants from Seoul's public register that serve one of the shared dishes. Nobody here has been to those.`,
            `지도에는 ${REGISTRY_TOTAL.toLocaleString('ko-KR')}곳이 더 있습니다. 함께 먹는 음식을 파는, 서울시 공공 등록부의 식당들이고, 저희가 가본 곳은 아닙니다.`,
            `Hay ${REGISTRY_TOTAL.toLocaleString('es-ES')} más en el mapa: restaurantes del registro público de Seúl que sirven uno de los platos para compartir. A esos no hemos ido.`,
            `Il y en a ${REGISTRY_TOTAL.toLocaleString('fr-FR')} de plus sur la carte : des restaurants du registre public de Séoul qui servent un des plats à partager. Nous n'y sommes pas allés.`,
            `وعلى الخريطة ${REGISTRY_TOTAL.toLocaleString('en-US')} مطعمًا آخر من السجل العام لمدينة سول تقدّم أحد أطباق المشاركة. تلك لم نزرها.`,
            `地图上还有 ${REGISTRY_TOTAL.toLocaleString('en-US')} 家：来自首尔市公开登记册、供应这些需要分享的菜的餐厅。那些我们没有去过。`,
            `地図にはあと${REGISTRY_TOTAL.toLocaleString('ja-JP')}軒あります。ソウル市の公開登録簿にある、分け合う料理を出す店です。そちらには行っていません。`)}
        </p>
      </header>

      {/* Incheon is an hour from Seoul and seven of the eighteen places are
          in it. Above the fold, before any rail, because a reader who cannot
          get to Incheon should be able to say so before they have read four
          cards about it. */}
      {cities.length > 1 && (
        <div className="city-filter" role="group" aria-label={say('Filter by city', '도시로 거르기', 'Filtrar por ciudad', 'Filtrer par ville', 'التصفية حسب المدينة', '按城市筛选', '都市で絞る')}>
          <button
            type="button"
            className={`city-filter__chip${city === null ? ' is-on' : ''}`}
            aria-pressed={city === null}
            onClick={() => setCity(null)}
          >
            {say('Everywhere', '전체', 'Todo', 'Partout', 'كل المدن', '全部', 'すべて')}
          </button>
          {cities.map(c => (
            <button
              key={c}
              type="button"
              className={`city-filter__chip${city === c ? ' is-on' : ''}`}
              aria-pressed={city === c}
              onClick={() => setCity(city === c ? null : c)}
            >
              {cityName(say, c)}
              <span className="city-filter__count">{activePlaces.filter(p => cityOf(p.zone) === c).length}</span>
            </button>
          ))}
        </div>
      )}

      {todaysPick && (
      <div className="home-section">
        <div className="home-section__header">
          <span className="panel-icon" aria-hidden="true"><SparkleIcon size={18} /></span>
          <h2>{say('Today\u2019s Korean Experience', '오늘의 한국 경험', 'La experiencia coreana de hoy', "L'expérience coréenne du jour", 'التجربة الكورية اليوم', '今天的韩国体验', '今日の韓国の体験')}</h2>
        </div>
        <button className="spotlight-card" onClick={() => openStory(todaysPick)}>
          <PlaceImage place={todaysPick} variant="hero" className="spotlight-card__img" />
          <div className="spotlight-card__body">
            <span className="spotlight-card__where">
              {cityOf(todaysPick.zone) && (
                <span className={`city-chip city-chip--${cityOf(todaysPick.zone).toLowerCase()}`}>{cityName(say, cityOf(todaysPick.zone))}</span>
              )}
              <span className="gather-card__tag">{say(todaysPick.zone, ZONE_KO[todaysPick.zone], ZONE_ES[todaysPick.zone], ZONE_FR[todaysPick.zone], ZONE_AR[todaysPick.zone], ZONE_ZH[todaysPick.zone], ZONE_JA[todaysPick.zone])}</span>
            </span>
            <h3>{placeName(todaysPick, say)}</h3>
            <p className="spotlight-card__quote">&ldquo;{say(todaysPick.vibe, todaysPick.vibeKo, todaysPick.vibeEs, todaysPick.vibeFr, todaysPick.vibeAr, todaysPick.vibeZh, todaysPick.vibeJa)}&rdquo;</p>
            <span className="spotlight-card__cta">
              {say('Read the story', '이야기 읽기', 'Leer la historia', "Lire l'histoire", 'اقرأ الحكاية', '读这个故事', '物語を読む')} <ChevronRightIcon size={14} />
            </span>
          </div>
        </button>
      </div>
      )}

      {markets.length > 0 && (
      <div className="home-section">
        <div className="home-section__header">
          <h2>{say('Traditional Markets', '전통시장', 'Mercados tradicionales', 'Marchés traditionnels', 'الأسواق التقليدية', '传统市场', '伝統市場')}</h2>
          <span className="home-section__count">{visitedMarkets.filter(e => markets.some(m => m.id === e.id)).length}/{markets.length}</span>
        </div>
        <div className="home-scroll-row">
          {markets.map(m => {
            const visited = visitedMarkets.some(e => e.id === m.id);
            return (
              <div key={m.id} className={`market-card${visited ? ' is-visited' : ''}`}>
                <button className="market-card__hit" data-kr={m.nameKo} onClick={() => onExploreZone(m.zone)}>
                  {/* Follows the language setting like every other Korean
                      name on a card. Nothing is lost when it goes: the
                      heading under it is the same market in English and the
                      line under that is where it is. */}
                  <span className="gather-card__tag gather-card__tag-kr" translate="no">{m.nameKo}</span>
                  <h3>{say(m.name, m.nameKo, m.nameEs, m.nameFr, m.nameAr, m.nameZh, m.nameJa)}</h3>
                  <p className="gather-card__meta"><MapPinIcon size={14} /> {say(m.zone, m.zoneKo, m.zoneEs, m.zoneFr, m.zoneAr, m.zoneZh, m.zoneJa)}</p>
                  <p className="gather-card__desc">{say(m.blurb, m.blurbKo, m.blurbEs, m.blurbFr, m.blurbAr, m.blurbZh, m.blurbJa)}</p>
                </button>
                {onToggleMarket && (
                  <button
                    className={`market-card__check${visited ? ' is-visited' : ''}`}
                    aria-pressed={visited}
                    aria-label={visited ? `Mark ${m.name} as not visited` : `Mark ${m.name} as visited`}
                    onClick={() => onToggleMarket(m.id)}
                  >
                    {visited
                      ? <><CheckIcon size={14} /> {say('Visited', '가봤어요', 'Visitado', 'Visité', 'زُرته', '去过了', '訪問済み')}</>
                      : say('Mark visited', '가봤다고 표시', 'Marcar como visitado', 'Marquer comme visité', 'ضع علامة زُرته', '标记为去过', '訪問済みにする')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}

      {spotlightRail.length > 0 && (
      <div className="home-section">
        <div className="home-section__header">
          <h2>{say('Popular with Travelers', '여행자들이 많이 찾는 곳', 'Los favoritos de los viajeros', 'Les préférés des voyageurs', 'المفضّلة لدى المسافرين', '旅行者常去的', '旅行者に人気')}</h2>
        </div>
        <div className="home-scroll-row">
          {spotlightRail.map(place => (
            <PlaceCard key={place.id} place={place} onClick={() => onOpenRestaurant(place)}
              isSaved={isSaved(place.id)} onToggleSave={onToggleBookmark} />
          ))}
        </div>
      </div>
      )}

      {storyRail.length > 0 && (
      <div className="home-section">
        <div className="home-section__header"><h2>{say('Food Stories', '음식에 얽힌 이야기', 'Historias de comida', 'Histoires de cuisine', 'حكايات طعام', '食物的故事', '食べものの物語')}</h2></div>
        <div className="home-scroll-row">
          {storyRail.map(place => (
            <button key={place.id} className="gather-card" onClick={() => openStory(place)}>
              <span className="gather-card__tag">{say(place.zone, ZONE_KO[place.zone], ZONE_ES[place.zone], ZONE_FR[place.zone], ZONE_AR[place.zone], ZONE_ZH[place.zone], ZONE_JA[place.zone])}</span>
              <h3>{placeName(place, say)}</h3>
              <p className="gather-card__desc">&ldquo;{say(place.vibe, place.vibeKo, place.vibeEs, place.vibeFr, place.vibeAr, place.vibeZh, place.vibeJa)}&rdquo;</p>
            </button>
          ))}
        </div>
      </div>
      )}

      {courseRail.length > 0 && (
      <div className="home-section">
        <div className="home-section__header"><h2>{say('Recommended Courses', '추천 코스', 'Rutas recomendadas', 'Parcours recommandés', 'مسارات مقترحة', '推荐路线', 'おすすめの道')}</h2></div>
        <div className="home-scroll-row">
          {courseRail.map(c => {
            const stops = c.stopIds.map(id => byId[id]).filter(Boolean);
            const first = stops[0];
            return (
              <button key={c.id} className="course-card" onClick={() => first && onOpenRestaurant(first)}>
                <div className="course-card__stack">
                  {stops.slice(0, 3).map(st => (
                    <PlaceImage key={st.id} place={st} variant="thumb" className="course-card__thumb" />
                  ))}
                </div>
                <h3>{say(c.title, c.titleKo, c.titleEs, c.titleFr, c.titleAr, c.titleZh, c.titleJa)}</h3>
                <p className="course-card__meta">{say(c.duration, c.durationKo, c.durationEs, c.durationFr, c.durationAr, c.durationZh, c.durationJa)}</p>
              </button>
            );
          })}
        </div>
      </div>
      )}

      {weekendPicks.length > 0 && (
      <div className="home-section">
        <div className="home-section__header"><h2>{say('Weekend Picks', '주말에 가볼 만한 곳', 'Para el fin de semana', 'Pour le week-end', 'لعطلة الأسبوع', '适合周末', '週末に')}</h2></div>
        <div className="home-scroll-row">
          {weekendPicks.map(place => (
            <PlaceCard key={place.id} place={place} onClick={() => onOpenRestaurant(place)}
              isSaved={isSaved(place.id)} onToggleSave={onToggleBookmark} />
          ))}
        </div>
      </div>
      )}

      {hiddenGemPicks.length > 0 && (
      <div className="home-section">
        <div className="home-section__header"><h2>{say('Local Hidden Gems', '현지인만 아는 곳', 'Joyas que solo conocen los locales', "Les adresses que seuls les gens d'ici connaissent", 'أماكن لا يعرفها إلا أهل المكان', '只有本地人知道的地方', '地元の人だけが知っている場所')}</h2></div>
        <div className="home-scroll-row">
          {hiddenGemPicks.map(place => (
            <PlaceCard key={place.id} place={place} onClick={() => onOpenRestaurant(place)}
              isSaved={isSaved(place.id)} onToggleSave={onToggleBookmark} />
          ))}
        </div>
      </div>
      )}

      {seasonalFoods.length > 0 && (
      <div className="home-section">
        <div className="home-section__header"><h2>{say('Seasonal Foods', '제철 음식', 'Comida de temporada', 'Produits de saison', 'أطعمة الموسم', '当季的食物', '旬のもの')}</h2></div>
        <div className="home-scroll-row">
          {seasonalFoods.map(f => {
            const inSeason = f.months.includes(currentMonth);
            return (
              <div key={f.id} className={`gather-card gather-card--static gather-card--kr${inSeason ? ' is-highlighted' : ''}`} data-kr={f.nameKo}>
                <span className="gather-card__tag">
                  {say(f.season, f.seasonKo, f.seasonEs, f.seasonFr, f.seasonAr, f.seasonZh, f.seasonJa)}
                  {inSeason ? say(' · In season now', ' · 지금이 제철', ' · ahora es temporada', " · c'est la saison", ' · الآن موسمه', ' · 现在正当季', ' · いまが旬') : ''}
                </span>
                <h3>{say(f.name, f.nameKo, f.nameEs, f.nameFr, f.nameAr, f.nameZh, f.nameJa)} <span className="gather-card__kr">{f.nameKo}</span></h3>
                <p className="gather-card__desc">{say(f.blurb, f.blurbKo, f.blurbEs, f.blurbFr, f.blurbAr, f.blurbZh, f.blurbJa)}</p>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Festivals are the one non-place rail that still names places —
          Boryeong, Andong, Jinju, Seoul, all in the card titles, none of them
          filtered because a festival record has no city field to filter on.
          Left visible it contradicted the chip directly: Incheon selected,
          Seoul Lantern Festival on screen. Hidden while a city is chosen,
          rather than given an invented location. */}
      {festivals.length > 0 && !city && (
      <div className="home-section">
        <div className="home-section__header"><h2>{say('Festival Picks', '축제', 'Festivales', 'Festivals', 'المهرجانات', '节庆', '祭り')}</h2></div>
        <div className="home-scroll-row">
          {festivals.map(f => (
            <div key={f.id} className="gather-card gather-card--static gather-card--kr" data-kr={f.nameKo}>
              <span className="gather-card__tag">{say(f.when, f.whenKo, f.whenEs, f.whenFr, f.whenAr, f.whenZh, f.whenJa)}</span>
              <h3>{say(f.name, f.nameKo, f.nameEs, f.nameFr, f.nameAr, f.nameZh, f.nameJa)} <span className="gather-card__kr">{f.nameKo}</span></h3>
              <p className="gather-card__desc">{say(f.blurb, f.blurbKo, f.blurbEs, f.blurbFr, f.blurbAr, f.blurbZh, f.blurbJa)}</p>
            </div>
          ))}
        </div>
      </div>
      )}

      {CULTURE_CARDS.length > 0 && (
      <div className="home-section">
        <div className="home-section__header"><h2>{say('Korean Dining Culture', '한국의 식문화', 'La cultura de la mesa coreana', 'La culture de la table coréenne', 'ثقافة المائدة الكورية', '韩国的餐桌文化', '韓国の食卓の文化')}</h2></div>
        <div className="home-scroll-row">
          {CULTURE_CARDS.slice(0, 4).map((c, i) => (
            <button key={c.title} className="zone-card" style={{ flex: '0 0 180px' }}
              onClick={() => { setCultureStart(i); setShowCulture(true); }}>
              <h3>{say(c.title, c.titleKo, c.titleEs, c.titleFr, c.titleAr, c.titleZh, c.titleJa)}</h3>
              <p>{say(c.desc, c.descKo, c.descEs, c.descFr, c.descAr, c.descZh, c.descJa)}</p>
            </button>
          ))}
        </div>
      </div>
      )}

      {zoneRail.length > 0 && (
      <div className="home-section">
        <div className="home-section__header"><h2>{say('Recommended Neighborhoods', '동네 추천', 'Barrios recomendados', 'Quartiers recommandés', 'أحياء مقترحة', '推荐街区', 'おすすめの地域')}</h2></div>
        <div className="zone-grid">
          {zoneRail.map(z => (
            <button key={z.name} className="zone-card" onClick={() => onExploreZone(z.name)}>
              <h3>{say(z.name, z.nameKo, z.nameEs, z.nameFr, z.nameAr, z.nameZh, z.nameJa)}</h3>
              <p>{say(z.blurb, z.blurbKo, z.blurbEs, z.blurbFr, z.blurbAr, z.blurbZh, z.blurbJa)}</p>
            </button>
          ))}
        </div>
      </div>
      )}

      <div className="home-section home-section--tight">
        <button
          className="map-cta"
          onClick={() => onOpenMap?.({ title: 'Every place, plotted', subtitle: 'Filter by zone, diet or vibe' })}
        >
          <span className="map-cta__title">{say('See it all on the map', '지도에서 한눈에 보기', 'Verlo todo en el mapa', 'Voir tout sur la carte', 'انظر كل شيء على الخريطة', '在地图上看全部', '地図でまとめて見る')}</span>
          <span className="map-cta__body">
            {say('Every place above, plotted — filter by zone, diet or vibe.',
              '위의 모든 장소가 지도 위에 찍혀 있습니다. 지역, 식단, 분위기로 걸러 보세요.', 'Todos los sitios de arriba, en el mapa: filtra por zona, dieta o ambiente.', 'Toutes les adresses ci-dessus, sur la carte : filtrez par quartier, régime ou ambiance.', 'كل الأماكن أعلاه على الخريطة: صفِّ بالحيّ أو النظام الغذائي أو الأجواء.', '上面所有地点都标在地图上：按街区、饮食或氛围筛选。', '上のすべての場所を地図に。地域、食の条件、雰囲気で絞れます。')}
          </span>
          <span className="map-cta__link">
            {say('Open the map', '지도 열기', 'Abrir el mapa', 'Ouvrir la carte', 'افتح الخريطة', '打开地图', '地図を開く')} <ChevronRightIcon size={16} />
          </span>
        </button>
      </div>

      {showCulture && <CultureCards onClose={() => setShowCulture(false)} startIndex={cultureStart} />}
    </section>
  );
}
