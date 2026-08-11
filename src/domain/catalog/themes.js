// Theme catalog — the cultural territory.
//
// A Theme owns a narrative and declares which Experiences belong to its
// territory. It does not own ordering: that is a Narrative's job, because a
// territory can be crossed by more than one path.
//
// Membership is N:M on purpose. `makgeolli` belongs to both Street Food and
// Noodle Road; forcing 1:N would make authors duplicate the Experience and
// turn every later edit into a synchronisation problem.

import { STATUS } from '../types.js';

// Every theme carries its Korean alongside its English (2026-08-11). The
// English was written first and for a foreign reader, which is the audience;
// the Korean is a translation of it rather than a second, different article,
// so the two say the same thing and neither is the "real" one.
//
// They are separate fields rather than one bilingual string because these are
// paragraphs. A label can carry both halves on one line — 밥상 · tables reads
// fine — but a 60-word narrative printed twice in a row is not a bilingual
// screen, it is the same screen twice. useText() in LocaleContext picks one.

export const themes = [
  {
    id: 'temple-life',
    emoji: '\u{1FAB7}',
    title: 'Temple Life',
    titleKo: '사찰의 밥상',
    tagline: 'Eat like a monk, at the pace of one.',
    taglineKo: '스님처럼, 스님의 속도로.',
    narrative:
      'Korean Buddhist temples kept a cuisine alive through centuries of war and industrialisation by refusing to hurry it. Sitting at a temple table is the closest a visitor gets to the country\'s idea of restraint as a pleasure rather than a denial.',
    narrativeKo:
      '한국의 절은 전쟁과 산업화를 지나오는 몇 백 년 동안, 서두르기를 거부하는 방식으로 하나의 음식 문화를 지켜냈습니다. 절의 밥상에 앉아 보는 것은 절제를 결핍이 아니라 즐거움으로 여기는 이 나라의 감각에 여행자가 가장 가까이 다가가는 방법입니다.',
    region: 'seoul',
    status: STATUS.PUBLISHED,
  },
  {
    id: 'street-food',
    emoji: '\u{1F95F}',
    title: 'Street Food Adventure',
    titleKo: '시장 먹거리',
    tagline: 'The market is the restaurant.',
    taglineKo: '시장이 곧 식당입니다.',
    narrative:
      'Before Seoul had dining rooms it had markets, and the markets never stopped being where the city actually eats. A stall is a kitchen with no walls: you watch the food being made, you eat it standing, and you talk to whoever is next to you because there is nowhere else to look.',
    narrativeKo:
      '서울에 번듯한 식당이 생기기 전에 시장이 있었고, 시장은 지금도 이 도시가 실제로 밥을 먹는 곳입니다. 노점은 벽이 없는 주방입니다. 음식이 만들어지는 걸 지켜보고, 서서 먹고, 달리 볼 데가 없으니 옆 사람과 이야기를 하게 됩니다.',
    region: 'seoul',
    status: STATUS.PREVIEW,
  },
  {
    id: 'noodle-road',
    emoji: '\u{1F35C}',
    title: 'The Noodle Road',
    titleKo: '국수의 길',
    tagline: 'A Chinese dish that became the most Korean meal there is.',
    taglineKo: '중국 음식이 가장 한국적인 한 끼가 되기까지.',
    narrative:
      'Follow one bowl from the docks of Incheon\'s Chinatown to every delivery scooter in the country. Jajangmyeon is the clearest case of Korea absorbing a foreign food so completely that its origin survives only in the name.',
    narrativeKo:
      '그릇 하나를 따라가 봅니다. 인천 차이나타운의 부두에서 시작해 전국의 배달 오토바이까지. 짜장면은 한국이 외국 음식을 너무 완전히 흡수한 나머지 그 출신이 이름에만 남은, 가장 분명한 사례입니다.',
    region: 'nationwide',
    status: STATUS.PUBLISHED,
  },
  {
    id: 'cafe-hopping',
    emoji: '☕',
    title: 'Cafe Hopping',
    titleKo: '카페 순례',
    tagline: 'One drink buys the afternoon.',
    taglineKo: '한 잔이면 오후가 통째로 내 것.',
    narrative:
      'Seoul has one of the highest cafe densities on earth, and the room is the product as much as the coffee. Nobody will rush you out after one cup, which is why the cafe became where this city works, meets and waits.',
    narrativeKo:
      '서울은 지구에서 카페 밀도가 가장 높은 도시 중 하나이고, 여기서는 커피만큼이나 공간 자체가 상품입니다. 한 잔 마셨다고 재촉하는 사람이 없고, 그래서 카페는 이 도시가 일하고, 만나고, 기다리는 곳이 되었습니다.',
    region: 'nationwide',
    status: STATUS.PUBLISHED,
  },
  {
    id: 'seoul-after-dark',
    emoji: '\u{1F376}',
    title: 'Seoul After Dark',
    titleKo: '밤의 서울',
    tagline: 'The city gets honest after ten.',
    taglineKo: '열 시가 넘으면 도시가 솔직해집니다.',
    narrative:
      'Korean nights move in rounds, and the conversation at the second one is not the conversation at the first. Late eating here is less about appetite than about the hours a working day leaves over.',
    narrativeKo:
      '한국의 밤은 차수로 흘러가고, 2차의 대화는 1차의 대화와 같지 않습니다. 여기서 늦은 시간에 먹는다는 건 식욕의 문제라기보다, 하루 일과가 남겨 놓은 시간을 어떻게 쓰느냐의 문제입니다.',
    region: 'seoul',
    status: STATUS.PREVIEW,
  },
  {
    id: 'busan-seafood',
    emoji: '\u{1F30A}',
    title: 'Busan Seafood',
    titleKo: '부산 해산물',
    tagline: 'A port city argues about freshness for a living.',
    taglineKo: '항구 도시는 신선도를 두고 매일 다툽니다.',
    narrative:
      'Busan built its identity on the sea and on the people the Korean War pushed south into it. The market that fed those refugees is still the largest seafood market in the country, and its habits — choose the fish live, wrap it rather than dip it — travel with the food wherever it goes.',
    narrativeKo:
      '부산은 바다 위에, 그리고 한국전쟁이 남쪽으로 밀어 보낸 사람들 위에 자기 정체성을 세웠습니다. 그 피란민들을 먹이던 시장은 지금도 전국에서 가장 큰 수산시장이고, 거기서 생긴 습관들 — 살아 있는 채로 고르고, 찍어 먹기보다 싸서 먹는 것 — 은 그 음식이 가는 곳마다 함께 따라갑니다.',
    region: 'nationwide',
    status: STATUS.PREVIEW,
  },
  {
    id: 'spring-picnic',
    emoji: '\u{1F338}',
    title: 'Spring Picnic',
    titleKo: '봄 소풍',
    tagline: 'Two weeks a year, the country eats outdoors.',
    taglineKo: '일 년에 두 주, 온 나라가 밖에서 먹습니다.',
    narrative:
      'Blossom season is Korea\'s clearest seasonal ritual, and its shortness is the point. Parks fill with mats and shared bottles for a fortnight, and then it is over for a year.',
    narrativeKo:
      '벚꽃철은 한국에서 가장 뚜렷한 계절 의식이고, 짧다는 것이 바로 핵심입니다. 두 주 동안 공원이 돗자리와 나눠 마시는 술병으로 가득 찼다가, 그러고 나면 일 년 동안 끝입니다.',
    region: 'nationwide',
    status: STATUS.PREVIEW,
  },
];

/**
 * Membership only — which Experiences fall inside this Theme's territory.
 * Order and necessity live on NarrativeStep, not here.
 */
export const themeExperiences = [
  { themeId: 'temple-life', experienceId: 'temple-cuisine' },
  { themeId: 'temple-life', experienceId: 'temple-tea' },

  { themeId: 'street-food', experienceId: 'gwangjang-market' },
  { themeId: 'street-food', experienceId: 'bindaetteok' },
  { themeId: 'street-food', experienceId: 'makgeolli' },
  { themeId: 'street-food', experienceId: 'market-alley' },

  { themeId: 'noodle-road', experienceId: 'jajangmyeon' },
  // Proves the N:M relationship: the same Experience, reached from two
  // different cultural angles.
  { themeId: 'noodle-road', experienceId: 'makgeolli' },

  { themeId: 'cafe-hopping', experienceId: 'weekend-brunch' },
  { themeId: 'cafe-hopping', experienceId: 'zero-waste-counter' },

  { themeId: 'seoul-after-dark', experienceId: 'late-night-table' },
  // Makgeolli again, from a third angle — a night drink rather than a
  // market one.
  { themeId: 'seoul-after-dark', experienceId: 'makgeolli' },

  { themeId: 'busan-seafood', experienceId: 'hoe-sashimi' },
  { themeId: 'busan-seafood', experienceId: 'jagalchi-morning' },

  { themeId: 'spring-picnic', experienceId: 'spring-picnic-set' },
];

const byId = new Map(themes.map(t => [t.id, t]));

export const themeById = (id) => byId.get(id);

export const experienceIdsOfTheme = (themeId) =>
  themeExperiences.filter(r => r.themeId === themeId).map(r => r.experienceId);

export const themeIdsOfExperience = (experienceId) =>
  themeExperiences.filter(r => r.experienceId === experienceId).map(r => r.themeId);
