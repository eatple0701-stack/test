import { test } from 'node:test';
import assert from 'node:assert/strict';
import { narratives, narrativeSteps, narrativeById, narrativesOfTheme, stepsOfNarrative } from '../catalog/narratives.js';
import { themeById, experienceIdsOfTheme } from '../catalog/themes.js';
import { experienceById } from '../catalog/experiences.js';
import { STATUS } from '../types.js';

test('every narrative id is unique and points at a real theme', () => {
  const ids = narratives.map(n => n.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const n of narratives) assert.ok(themeById(n.themeId), `${n.id} unknown theme ${n.themeId}`);
});

test('every step points at a real narrative and a real experience', () => {
  const nIds = new Set(narratives.map(n => n.id));
  for (const s of narrativeSteps) {
    assert.ok(nIds.has(s.narrativeId), `unknown narrative ${s.narrativeId}`);
    assert.ok(experienceById(s.experienceId), `unknown experience ${s.experienceId}`);
  }
});

test('a step may only use an experience that belongs to its narrative theme', () => {
  for (const s of narrativeSteps) {
    const n = narrativeById(s.narrativeId);
    const allowed = experienceIdsOfTheme(n.themeId);
    assert.ok(
      allowed.includes(s.experienceId),
      `${s.narrativeId} step ${s.experienceId} is outside theme ${n.themeId}`,
    );
  }
});

test('step order is unique and contiguous from 1 within each narrative', () => {
  for (const n of narratives) {
    const orders = stepsOfNarrative(n.id).map(s => s.order);
    assert.deepEqual(orders, orders.map((_, i) => i + 1), `${n.id} has non-contiguous order`);
  }
});

test('every narrative has at least one required step or it can never complete', () => {
  for (const n of narratives) {
    const required = stepsOfNarrative(n.id).filter(s => s.required);
    assert.ok(required.length > 0, `${n.id} has no required step`);
  }
});

test('every step carries connective prose', () => {
  for (const s of narrativeSteps) {
    assert.ok(s.transition.length > 0, `${s.narrativeId}/${s.experienceId} missing transition`);
  }
});

test('narratives carry intro, outro and a valid status', () => {
  const statuses = new Set(Object.values(STATUS));
  for (const n of narratives) {
    assert.ok(n.intro.length > 0, `${n.id} missing intro`);
    assert.ok(n.outro.length > 0, `${n.id} missing outro`);
    assert.ok(statuses.has(n.status), `${n.id} invalid status`);
  }
});

test('the seed includes both a required and an optional step', () => {
  assert.ok(narrativeSteps.some(s => s.required), 'need a required step');
  assert.ok(narrativeSteps.some(s => !s.required), 'need an optional step');
});

test("narrativesOfTheme returns only that theme's narratives", () => {
  for (const n of narrativesOfTheme('temple-life')) assert.equal(n.themeId, 'temple-life');
  assert.deepEqual(narrativesOfTheme('nope'), []);
});
