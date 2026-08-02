import { test } from 'node:test';
import assert from 'node:assert/strict';
import { themes, themeExperiences, themeById, experienceIdsOfTheme, themeIdsOfExperience } from '../catalog/themes.js';
import { experienceById } from '../catalog/experiences.js';
import { STATUS } from '../types.js';

test('every theme id is unique', () => {
  const ids = themes.map(t => t.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('every membership row points at a real theme and a real experience', () => {
  const themeIds = new Set(themes.map(t => t.id));
  for (const row of themeExperiences) {
    assert.ok(themeIds.has(row.themeId), `unknown theme ${row.themeId}`);
    assert.ok(experienceById(row.experienceId), `unknown experience ${row.experienceId}`);
  }
});

test('membership rows are not duplicated', () => {
  const keys = themeExperiences.map(r => `${r.themeId}::${r.experienceId}`);
  assert.equal(new Set(keys).size, keys.length);
});

test('every theme has at least one experience', () => {
  for (const t of themes) {
    assert.ok(experienceIdsOfTheme(t.id).length > 0, `${t.id} has no experiences`);
  }
});

test('theme status uses the shared vocabulary', () => {
  const statuses = new Set(Object.values(STATUS));
  for (const t of themes) assert.ok(statuses.has(t.status), `${t.id} invalid status`);
});

test('an experience can belong to more than one theme', () => {
  const shared = themeIdsOfExperience('makgeolli');
  assert.ok(shared.length >= 2, 'makgeolli must prove the N:M relationship');
});

test('themeIdsOfExperience returns empty for an unaffiliated id', () => {
  assert.deepEqual(themeIdsOfExperience('not-a-thing'), []);
});

test('themeById finds a known record', () => {
  assert.equal(themeById('temple-life').id, 'temple-life');
  assert.equal(themeById('nope'), undefined);
});
