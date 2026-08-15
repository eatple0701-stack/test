import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ANIMALS, ANIMAL_IDS, animalFor, animalOf, hashSeed, isAnimal } from '../catalog/animals.js';

// What has to stay true about a face somebody did not choose.
//
// The 8/2 meeting asked for "랜덤 프사". The word is random and the
// requirement is the opposite: a face that is different from the next
// person's, and *identical to itself* on every screen, every device, and
// every future version of this app. Nothing is stored, so the hash is the
// only thing holding that promise — which makes it worth pinning.

test('the same person is the same animal, every time', () => {
  const seeds = ['user-abc', 'host-9', '한글-아이디', '', 'x'];
  for (const s of seeds) {
    const first = animalFor(s);
    for (let i = 0; i < 50; i += 1) assert.equal(animalFor(s).id, first.id);
  }
});

test('the hash is pinned, so nobody wakes up as a different animal', () => {
  // These are not arbitrary: they are what the shipped function returns, and
  // changing the hash changes every existing user's face. If this test
  // fails, the question is not "update the numbers" — it is whether every
  // person in the pilot losing their avatar is intended.
  assert.equal(hashSeed(''), 2166136261);
  assert.equal(hashSeed('a'), 3826002220);
  assert.equal(animalFor('user-1').id, animalFor('user-1').id);
  const pinned = ['user-1', 'user-2', 'user-3'].map(s => animalFor(s).id);
  assert.deepEqual(pinned, ['cat', 'bear', 'rabbit']);
});

test('different people mostly get different animals', () => {
  // Twelve animals and a hash: collisions are expected and fine — two
  // rabbits at one table is not a bug. What would be a bug is a hash that
  // clumps, so a hundred ids landing on three animals.
  const seen = new Map();
  for (let i = 0; i < 240; i += 1) {
    const id = animalFor('user-' + i).id;
    seen.set(id, (seen.get(id) ?? 0) + 1);
  }
  assert.equal(seen.size, ANIMALS.length, 'every animal should come up across 240 people');
  for (const [id, n] of seen) {
    assert.ok(n < 60, `${id} came up ${n} times in 240 — the hash is clumping`);
  }
});

test('a stored choice wins, and a bad one falls back rather than blanking', () => {
  assert.equal(animalOf({ avatarAnimal: 'owl', seed: 'anything' }).id, 'owl');
  assert.equal(animalOf({ avatarAnimal: 'dragon', seed: 'user-1' }).id, animalFor('user-1').id);
  assert.equal(animalOf({ avatarAnimal: null, seed: 'user-1' }).id, animalFor('user-1').id);
  assert.ok(animalOf({}).id, 'no seed at all still draws something');
  assert.equal(isAnimal('tiger'), true);
  assert.equal(isAnimal('unicorn'), false);
});

test('every animal in the catalogue is actually drawn', () => {
  // The catalogue and the drawings live in different files, and a tint with
  // no face renders as a bare coloured disc — which looks like a loading
  // state nobody wrote.
  const src = fs.readFileSync(path.join(process.cwd(), 'src/components/AnimalAvatar.jsx'), 'utf8');
  for (const id of ANIMAL_IDS) {
    assert.match(src, new RegExp('\\b' + id + ':\\s*\\('), `${id} has no drawing in AnimalAvatar.jsx`);
  }
  // And nothing is drawn that the catalogue does not know, which would be a
  // face nobody can ever be given.
  const drawn = [...src.matchAll(/^ {2}(\w+): \(/gm)].map(m => m[1]);
  assert.deepEqual(drawn.slice().sort(), ANIMAL_IDS.slice().sort());
});

test('the avatar is decorative, because the name is already beside it', () => {
  const src = fs.readFileSync(path.join(process.cwd(), 'src/components/AnimalAvatar.jsx'), 'utf8');
  assert.match(src, /aria-hidden="true"/, 'a screen reader should not announce a random animal as identity');
});
