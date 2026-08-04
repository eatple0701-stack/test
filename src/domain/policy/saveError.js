// What a failed write says, in both languages.
//
// The sibling of AuthErrorPolicy, for everything that is not a door: taking a
// seat, opening a table, saving a review, uploading a photo. Measured
// 2026-08-04, every one of those printed a bare English sentence — "Somebody
// just took the last seat." — under labels written in two languages.
//
// Unlike the auth path, this one classifies text that has already been
// through `friendlyError` in src/data/tableMapping.js, which turns a Postgres
// error into one of four sentences. That is deliberate rather than lazy: those
// four are a closed set, matching them is exact, and rewriting twenty-six call
// sites to carry raw errors would be a large change for the same result. The
// raw database signals are matched too, so this keeps working if a future
// caller stops translating first.
//
// The honesty rule from ReportPolicy applies here as well. "Somebody just
// took the last seat" is a fact about the table. "That did not save" is an
// admission that we do not know which end failed — and it must keep saying
// so rather than inventing a cause.

const KNOWN = [
  {
    id: 'full',
    match: /took the last seat|table_full/i,
    kr: '방금 마지막 자리가 나갔어요.',
    en: 'Somebody just took the last seat.',
  },
  {
    id: 'duplicate',
    match: /already have a seat|duplicate key|unique/i,
    kr: '이미 이 밥상에 자리가 있어요.',
    en: 'You already have a seat at this table.',
  },
  {
    id: 'gone',
    match: /no longer here|table_not_found/i,
    kr: '이 밥상은 사라졌어요.',
    en: 'This table is no longer here.',
  },
  {
    id: 'denied',
    // 42501 — RLS said no. Almost always a schema that has not caught up,
    // which is a thing the team can fix and the traveller cannot.
    match: /42501|insufficient_privilege|row-level security|violates row/i,
    kr: '지금은 이 작업을 할 수 없어요. 팀에 알려 주세요.',
    en: 'The server refused this one. Nothing you did wrong — tell the team.',
  },
  {
    id: 'photos-off',
    match: /photos are not switched on|bucket/i,
    kr: '사진 기능이 아직 켜지지 않았어요.',
    en: 'Photo uploads are not switched on for this project yet.',
  },
  {
    id: 'network',
    match: /failed to fetch|networkerror|network request failed|load failed|check your connection/i,
    kr: '연결이 끊겼어요. 인터넷을 확인하고 다시 시도해 주세요.',
    en: 'Could not reach the server. Check your connection and try again.',
  },
];

export const SAVE_FALLBACK = {
  id: 'unknown',
  kr: '저장되지 않았어요. 다시 시도해 주세요.',
  en: 'That did not save. Try again, or tell the team if it keeps happening.',
};

/** A caught write failure, turned into two lines somebody can read. */
export function saveError(err) {
  if (err === null || err === undefined) return null;
  const text = [
    typeof err === 'string' ? err : '',
    err?.message ?? '',
    err?.details ?? '',
    err?.code ?? '',
  ].join(' ').trim();
  if (!text) return { ...SAVE_FALLBACK, raw: '' };
  const hit = KNOWN.find(k => k.match.test(text));
  return hit
    ? { id: hit.id, kr: hit.kr, en: hit.en, raw: text }
    : { ...SAVE_FALLBACK, raw: text };
}

export const saveErrorText = (err) => {
  const e = saveError(err);
  return e ? `${e.kr} · ${e.en}` : null;
};

export const SAVE_ERROR_IDS = [...KNOWN.map(k => k.id), SAVE_FALLBACK.id];
