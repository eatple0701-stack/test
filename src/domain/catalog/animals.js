// The face somebody has before they have a photograph.
//
// From the 8/2 meeting: "프로필 사진도 추가할 수 있게끔. 아니면 랜덤 프사
// 만들어주기 하던가". Upload landed; the fallback did not, and until now a
// person with no photo was a single letter of their own name in a coloured
// circle. On the table card that means four grey initials, which is what a
// spreadsheet looks like, not four people you are about to eat with.
//
// Three decisions worth stating once here rather than at five call sites.
//
// **Drawn, not fetched.** No avatar service, no external image. This app has
// a service worker and works offline, and an avatar that 404s on a subway
// platform is worse than a letter. These are twelve small SVGs, inlined.
//
// **Deterministic, not random.** "랜덤 프사" is the ask, and a literally
// random one would be wrong: the point of a face is that it is *the same
// face* next time. So the animal is a pure function of a seed — the user's
// id, a host's id, a signup's id — and the same person is the same animal
// on every screen, on every device, forever, with nothing stored.
//
// **No cultural claim.** A tiger and a magpie are what Korean folk painting
// is full of, and it would be easy to write that on the screen. This app
// does not print claims nobody sourced (see src/content/sources.js), and an
// avatar is not the place to start. They are animals. The delight has to
// come from the drawing, not from a caption asserting significance.

/**
 * Twelve animals, each a face on a tinted disc.
 *
 * `body` is the ink drawing, `tint` the disc behind it. Both are literal
 * colours rather than palette tokens: this is the one thing in the app whose
 * whole job is to be different from the thing next to it, and a token that
 * changes with the theme would make two people the same colour on a dark
 * screen. Every tint is a pale wash chosen to sit under the same dark ink,
 * so contrast holds without a per-animal ink colour.
 */
export const ANIMALS = [
  { id: 'tiger', tint: '#FFE8CC' },
  { id: 'bear', tint: '#EFE0D2' },
  { id: 'rabbit', tint: '#FDE2E4' },
  { id: 'fox', tint: '#FFE0C7' },
  { id: 'cat', tint: '#E8E4F3' },
  { id: 'dog', tint: '#FBE7C6' },
  { id: 'magpie', tint: '#DEE9F5' },
  { id: 'deer', tint: '#EADFD3' },
  { id: 'squirrel', tint: '#FCE1D0' },
  { id: 'frog', tint: '#DCF2E0' },
  { id: 'owl', tint: '#E4E7EE' },
  { id: 'turtle', tint: '#D9F0E8' },
];

export const ANIMAL_IDS = ANIMALS.map(a => a.id);

export const isAnimal = (id) => ANIMAL_IDS.includes(id);

/**
 * A stable number for a string.
 *
 * FNV-1a, written out rather than imported, because the whole point is that
 * it produces the same number in every browser and every future version of
 * this app. Anything cleverer would risk a person's face changing under
 * them, which is the one failure this catalogue exists to prevent.
 */
export function hashSeed(seed) {
  let h = 0x811c9dc5;
  const s = String(seed ?? '');
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * The animal for a seed. Same seed, same animal, always.
 *
 * An empty seed still gets an animal rather than null — every one of the
 * five call sites has *something* to identify a person by, but a table
 * seeded before signups had ids would otherwise render nothing at all, and
 * a stable arbitrary animal beats an empty circle.
 */
export const animalFor = (seed) => ANIMALS[hashSeed(seed) % ANIMALS.length];

/**
 * The animal to actually draw for a person.
 *
 * A stored `avatarAnimal` wins, so somebody who picked one keeps it; the
 * seed decides for everybody else. Unknown stored values fall back rather
 * than blanking, the same rule cleanGender and cleanLanguages follow.
 */
export function animalOf({ avatarAnimal = null, seed = '' } = {}) {
  if (isAnimal(avatarAnimal)) return ANIMALS.find(a => a.id === avatarAnimal);
  return animalFor(seed);
}
