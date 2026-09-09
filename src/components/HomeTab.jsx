import React, { useMemo, useState } from 'react';
import { themes as domainThemes } from '../domain/catalog/index.js';
import { isSurfaceableEntity } from '../domain/policy/visibility.js';
import JourneyLead from './JourneyLead';
import ExploreCover from './ExploreCover';
import DishStories from './DishStories';
import DishSheet from './DishSheet';
import ThemeStoryCard from './ThemeStoryCard';
import FoodRoulette from './FoodRoulette';
import CultureCards from './CultureCards';
import { useText } from './localeText.js';

// Eight props were declared here and unread after Explore was rebuilt around
// themes — onOpenRestaurant, onOpenStory, onExploreZone, bookmarkedIds,
// onToggleBookmark, visitedMarkets, onToggleMarket, onOpenMap — kept at the
// call site rather than deleted. They are read again as of 2026-09-04: the
// eleven curated shelves that had their own 장소 tab render here now, and
// they are exactly the eight handlers those shelves need. App.jsx was already
// passing every one of them.
//
// Why they moved: 장소 was a second track of curation, and one of its shelves
// (한국의 식문화) rendered the same CULTURE_CARDS deck this tab's 문화 카드
// button opens. Editorial reading belongs in one place; 장소 is the map now.
export default function HomeTab({
  onNavigate,
  journey, onOpenSummary,
  onOpenTheme, continueTheme, nextExperience, suggestedTheme, suggestedReason,
  themeProgress, profile, onOpenTodayTable, onOpenTable,
  onOpenRestaurant, onOpenStory, onExploreZone, onPickDish, onHostDish,
  bookmarkedIds, onToggleBookmark, visitedMarkets, onToggleMarket, onOpenMap,
}) {
  const say = useText();
  const [showRoulette, setShowRoulette] = useState(false);
  const [storyDish, setStoryDish] = useState(null);
  const [showCulture, setShowCulture] = useState(false);
  const [cultureStart, setCultureStart] = useState(0);

  // The Phase 0 catalog, filtered through the same visibility policy the
  // projections use — so a `planned` theme never leaks onto the feed.
  const surfacedThemes = useMemo(() => domainThemes.filter(isSurfaceableEntity), []);

  // Read straight off the existing projection — the cards show progress, they
  // do not compute it. A second tally here is how the Passport and the Theme
  // page ended up disagreeing once already.
  const progressById = useMemo(
    () => Object.fromEntries((themeProgress?.themes ?? []).map(t => [t.themeId, t])),
    [themeProgress],
  );
  const progressOf = (themeId) => (themeId ? progressById[themeId] ?? null : null);

  const cover = (
    /* The cover. Today's pick at full size, with the reason it was picked set
       as a note rather than a caption. This is the app's recommendation —
       printing a hero that explains the product and then a chip that
       recommends something was two openings competing for one moment. */
    <ExploreCover
      theme={suggestedTheme}
      reason={suggestedReason}
      progress={progressOf(suggestedTheme?.id)}
      onOpen={onOpenTheme}
    />
  );

  return (
    <section className="home-tab" aria-label="Home">

      {/* 입맛 지도 stood here from 2026-09-07 and is gone from this tab on
          2026-09-09. Not removed — moved, on 9/8, to 밥상, which is the
          screen the app opens on now and where the tables its answers name
          already are. A second door to it here was the same deck twice.

          [이번 주 밥상] went with it, at the team's word: "explore 탭이
          문화·공공외교 느낌을 살리는 탭인데 저 밥상 정보가 있는 게 결이 다른
          느낌 — 어차피 바로 옆 tables 탭에서 볼 수 있으니." TablesLead is
          untouched and is what 밥상 renders.

          오늘의 밥상 moved to 밥상 as well. It is the one reminder this app
          can give without push notifications, and it has to be on the screen
          somebody opens — which stopped being this one on 9/8. */}

      {/* ---- 요리에 담긴 이야기 ----

              First on the tab, asked for in those words on 2026-09-09. This
              is what the tab is for: 문화·공공외교, and a dish's history is
              the most concrete form either takes. It sits above the editorial
              cover because the cover recommends one theme and this offers
              fourteen doors — the wider one goes first when the reader has
              not told the app anything yet.

              A list here and the reading in DishSheet, which already draws
              왜 함께 먹나 / 먹는 법 / 문화 / 이야기 and gates the last on a
              source somebody read. Nothing about that is rebuilt.  ---- */}
      <DishStories onOpenDish={setStoryDish} />

      {/* The cover. Today's pick at full size. */}
      <div className="home-section home-section--tight">{cover}</div>

      {/* 인스타그램, moved here on 2026-09-09 to sit directly under the
          editor's pick. Both are the app recommending something, and putting
          the account where the recommending happens is a smaller ask than
          putting it after seven cultures somebody may never scroll to.

          The logo is behind it rather than beside it: a mark at low opacity
          is a background, and a mark at full size in a row is a second thing
          competing with the QR for the same glance. */}
      <div className="home-section home-section--tight">
        <a
          className="insta-card"
          href="https://instagram.com/eat.ple_project"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img className="insta-card__qr" src="/images/eatple-instagram-qr.jpg" alt="" width="72" height="72" loading="lazy" />
          <span className="insta-card__body">
            <span className="insta-card__kr" translate="no">인스타그램</span>
            <span className="insta-card__title">
              {say('More of these stories, as we find them', '이런 이야기들을 더 찾는 대로 올립니다',
                'Más historias como estas, según las encontramos', 'D’autres récits comme ceux-ci, au fil de nos trouvailles',
                'مزيد من هذه الحكايات، كلّما وجدناها', '这样的故事，我们找到就发', 'こうした話を、見つけしだい載せています')}
            </span>
            <span className="insta-card__handle" translate="no" data-no-locale>@eat.ple_project</span>
          </span>
          <span className="insta-card__go" aria-hidden="true">↗</span>
        </a>
      </div>



      {/* 문화 카드 · 오늘 뭐 먹지, moved under 인스타그램 on 2026-09-09.
          They were the end of the reading; they are the two lightest ways in
          now, and they follow the two blocks that recommend rather than the
          seven that explain. */}
      <div className="home-section home-section--tight">
        <div className="surprise-row">
          <button className="surprise-btn" onClick={() => { setCultureStart(0); setShowCulture(true); }}>
            <span className="surprise-btn__kr">문화</span>
            <span className="surprise-btn__label">{say('Culture Cards', '문화 카드', 'Fichas de cultura', 'Fiches de culture', 'بطاقات ثقافية', '文化卡片', '文化カード')}</span>
          </button>
          <button className="surprise-btn" onClick={() => setShowRoulette(true)}>
            <span className="surprise-btn__kr">오늘 뭐 먹지</span>
            <span className="surprise-btn__label">{say('Pick a dish for me', '골라주세요', 'Elige un plato por mí', 'Choisis un plat pour moi', 'اختر لي طبقًا', '替我挑一道菜', '料理を選んでもらう')}</span>
          </button>
        </div>
      </div>


      {/* 3. Resume, for a traveller already mid-culture. Below the cover, not
             above it: someone who is partway through does not need to be sold
             the app, but they do need this within a thumb's reach. Suppressed
             when nothing is underway, because its start state would offer the
             same theme the cover just did. */}
      {continueTheme && (
        <div className="home-section home-section--tight">
          <JourneyLead
            continueTheme={continueTheme}
            nextExperience={nextExperience}
            suggestedTheme={suggestedTheme}
            onOpenTheme={onOpenTheme}
            onOpenSummary={onOpenSummary}
          />
        </div>
      )}

      {/* 3. The cultures. A stack, not a shelf — a horizontal row of seven
             small cards is a menu you skim past, and these are the content.
             One question at a time, at the width of the screen. */}
      <div className="home-section">
        <div className="stack-head">
          <span className="stack-head__kr" translate="no">문화</span>
          <h2 className="stack-head__title">
            {say('Seven questions about how Korea eats', '한국이 어떻게 먹는지에 대한 일곱 가지 질문', 'Siete preguntas sobre cómo come Corea', 'Sept questions sur la façon dont la Corée mange', 'سبعة أسئلة عن طريقة كوريا في الأكل', '关于韩国怎么吃的七个问题', '韓国の食べ方についての七つの問い')}
          </h2>
          <p className="stack-head__sub">
            {say('Each one is a culture you can walk into.', '하나하나가 걸어 들어가 볼 수 있는 문화입니다.', 'Cada una es una cultura en la que puedes entrar.', 'Chacune est une culture dans laquelle entrer.', 'كل واحد منها ثقافة تستطيع أن تدخلها.', '每一个都是一个可以走进去的文化。', 'どれもが、歩いて入れるひとつの文化です。')}
          </p>
        </div>
        <div className="story-stack">
          {surfacedThemes.map(theme => (
            <ThemeStoryCard
              key={theme.id}
              theme={theme}
              progress={progressOf(theme.id)}
              onOpen={onOpenTheme}
            />
          ))}
        </div>
      </div>

      {/* The index used to continue here for another thirteen shelves —
          restaurants, courses, neighbourhoods, seasonal notes. It is a real
          directory and travellers want it, but it answers "where could I go"
          while everything above answers "what should I do today", and eight
          screens of it made the second question look like the smaller one.
          It has its own tab now.

          Two of those shelves are not in the new tab either: the journey
          dashboard and the challenge row were already on the Passport, in
          the same words, and printing progress twice does not double it. */}

      {/* 가볼 만한 곳 — the eleven curated shelves — stood here folded and
          moved to 장소 on 2026-09-09. It answered "where could I go", which
          is the map tab's question, and it was the last 1.5 screens of a tab
          that is otherwise one subject. PlacesTab is untouched; only which
          screen mounts it changed. */}

      {showRoulette && (
        <FoodRoulette
          onClose={() => setShowRoulette(false)}
          /* A dish with nowhere to go is where this used to stop. */
          onOpenTables={() => { setShowRoulette(false); onNavigate('match'); }}
        />
      )}
      {showCulture && <CultureCards onClose={() => setShowCulture(false)} startIndex={cultureStart} />}
      {storyDish && (
        <DishSheet
          menu={storyDish}
          onClose={() => setStoryDish(null)}
          /* A dish with nowhere to go is where the roulette used to stop. */
          /* Host: the create form, on this dish. Join: the tables list,
             filtered to it. Two different screens, and the sheet asks for
             whichever the reader pressed. */
          onOpenTable={(id) => { setStoryDish(null); onHostDish?.(id); }}
          onJoinTable={(id) => { setStoryDish(null); onPickDish?.(id); }}
        />
      )}
    </section>
  );
}
