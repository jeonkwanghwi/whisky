import { test } from 'node:test';
import assert from 'node:assert/strict';
import { finalScore } from './score.js';

test('가중 평균: 향 4.0 · 맛 4.5 · 피니쉬 3.5 → 4.1', () => {
  assert.equal(finalScore({ nose: 4, palate: 4.5, finish: 3.5 }), 4.1);
});
test('만점과 최저점', () => {
  assert.equal(finalScore({ nose: 5, palate: 5, finish: 5 }), 5);
  assert.equal(finalScore({ nose: 0.5, palate: 0.5, finish: 0.5 }), 0.5);
});
test('한 단계라도 비면 미완성(null)', () => {
  assert.equal(finalScore({ nose: 4, palate: 4.5 }), null);
  assert.equal(finalScore({}), null);
  assert.equal(finalScore(undefined), null);
});
