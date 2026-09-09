// What the app has on somebody, and it is two separate answers.
//
// 2026-09-09, 강민: 입맛지도만 한 사람과 입맛지도 + 음식 MBTI 둘 다 한 사람이
// 밥상과 여권에서 다르게 보이도록.
//
// They are two records, not two halves of one. The map is fourteen dishes
// somebody said yes or no to; the type is twelve questions about how they
// eat. Either can exist without the other — the test is opened from the map
// but the answers live in their own key, so a cleared deck leaves a type
// behind, and a map with no test is the common case for anybody who took the
// front door and stopped there.
//
// The passport showed neither unless the type existed: the whole 내 입맛
// section was behind `myType ?`, so somebody who swiped fourteen cards and
// skipped the test was told they had answered nothing. That is the bug this
// file names.

export const TASTE_RECORD = {
  none: 'none',
  map: 'map',
  type: 'type',
  both: 'both',
};

/**
 * Which of the two this browser holds.
 *
 * Takes the count and the type rather than the raw stores, so the caller is
 * the one that knows where they came from — the deck reads them from
 * localStorage, the passport re-reads them on every mount, and neither of
 * those is this file's business.
 */
export function tasteRecordState({ mapCount = 0, type = null } = {}) {
  const hasMap = Number(mapCount) > 0;
  const hasType = Boolean(type?.code);
  if (hasMap && hasType) return TASTE_RECORD.both;
  if (hasType) return TASTE_RECORD.type;
  if (hasMap) return TASTE_RECORD.map;
  return TASTE_RECORD.none;
}

/** The dishes, whenever there are any — with or without a type over them. */
export const showsDishes = (state) =>
  state === TASTE_RECORD.map || state === TASTE_RECORD.both;

/** The four-letter type, whenever the test has been finished. */
export const showsType = (state) =>
  state === TASTE_RECORD.type || state === TASTE_RECORD.both;

/** The invitation, and only when there is nothing at all to show. */
export const showsPrompt = (state) => state === TASTE_RECORD.none;

/**
 * Is the test still ahead of this reader?
 *
 * What turns 음식 MBTI 검사하기 into 다시 하기 on the deck's result screen —
 * the one visible difference between the two people the request is about.
 */
export const testIsNew = (state) => !showsType(state);
