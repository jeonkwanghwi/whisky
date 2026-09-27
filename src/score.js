export const W = { nose: 0.2, palate: 0.5, finish: 0.3 };

// 최종 점수 = 향×0.2 + 맛×0.5 + 피니쉬×0.3, 소수 첫째 자리 반올림.
// 세 단계가 모두 있어야 계산되고, 하나라도 비면 null(미완성).
export function finalScore(scores = {}) {
  const ks = Object.keys(W);
  if (!ks.every(k => scores[k] > 0)) return null;
  return Math.round(ks.reduce((s, k) => s + scores[k] * W[k], 0) * 10) / 10;
}
