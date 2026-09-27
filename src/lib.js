import taxonomy from './data/taxonomy.json';
import profiles from './data/profiles.json';

export { taxonomy, profiles };

export const chipMap = {}, chipCat = {}, catMap = {};
taxonomy.categories.forEach(c => { catMap[c.id] = c; c.chips.forEach(ch => { chipMap[ch.id] = ch; chipCat[ch.id] = c.id; }); });


export const TABS =[{ k: 'nose', ko: '향', en: 'NOSE' }, { k: 'palate', ko: '맛', en: 'PALATE' }, { k: 'finish', ko: '피니쉬', en: 'FINISH' }, { k: 'info', ko: '정보' }, { k: 'overall', ko: '총평' }];
export const STAGES = TABS.slice(0, 3);
export const SEGS = { nose: [], palate: [['body', '바디', '가벼움', '묵직함'], ['sweet', '단맛', '드라이', '달콤'], ['smoky', '스모키', '없음', '강함'], ['burn', '알코올 자극', '부드러움', '화끈']], finish: [['length', '여운 길이', '짧음', '긺']] };
// 정보 탭 항목: Whiskybase 병 상세(병입자·캐스크·도수·병입일)와 스카치 라벨 표기 기준.
export const REGIONS = [['speyside', '스페이사이드'], ['highland', '하이랜드'], ['lowland', '로우랜드'], ['islay', '아일라'], ['islands', '아일랜즈'], ['campbeltown', '캠벨타운'], ['ireland', '아일랜드'], ['usa', '미국'], ['japan', '일본'], ['other', '기타']];
export const TYPES = [['single_malt', '싱글 몰트'], ['blended_malt', '블렌디드 몰트'], ['blended', '블렌디드'], ['single_grain', '싱글 그레인'], ['bourbon', '버번'], ['rye', '라이'], ['other', '기타']];
export const CASKS = [['bourbon', '버번'], ['oloroso', '올로로소 셰리'], ['px', 'PX 셰리'], ['port', '포트'], ['wine', '와인'], ['rum', '럼'], ['virgin', '버진 오크'], ['mizunara', '미즈나라']];
export const BOTTLERS = [['ob', '오피셜(OB)'], ['ib', '독립병입(IB)']];
export const FLAGS = [['cs', '캐스크 스트렝스'], ['sc', '싱글 캐스크'], ['ncf', '논칠필터링'], ['nc', '무색소']];
export const label = (list, id) => (list.find(x => x[0] === id) || [])[1];
export const RADAR = [['body', '바디'], ['sweet', '단맛'], ['fruity', '과일'], ['spicy', '스파이스'], ['woody', '나무'], ['winey', '셰리'], ['smoky', '스모키']];
export const SERVES = [['neat', '니트'], ['water', '가수'], ['rocks', '온더락'], ['highball', '하이볼']];
export const REBUY = [['yes', '예'], ['maybe', '글쎄'], ['no', '아니오']];
export const REBUY_CARD = { yes: '재구매 O', maybe: '재구매 글쎄', no: '재구매 X' };

export const norm = s => String(s || '').toLowerCase().replace(/^the\s+/, '').replace(/[^a-z0-9가-힣]+/g, ' ').trim();
export const uid = () => (crypto.randomUUID && crypto.randomUUID()) || (Date.now().toString(36) + Math.random().toString(36).slice(2));
export const fmtDate = t => { const d = new Date(t); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`; };
export const fmtPrice = p => p ? `₩${Number(p).toLocaleString('ko-KR')}` : '';
export const serveLabel = id => (SERVES.find(s => s[0] === id) || [])[1];

function findBuiltin(name) {
  const n = norm(name);
  return profiles.profiles.find(p => p.key === n || norm(p.name) === n || norm(p.ko) === n || n.startsWith(p.key) || (n.length >= 8 && (p.key.startsWith(n) || norm(p.ko).startsWith(n))));
}

// 내장 목록에 있으면 그 프로필을 추천 칩으로, 그 정보를 정보 탭 기본값으로 쓴다. 없으면 기본 휠.
export function blank(name) {
  const t = Date.now(), p = findBuiltin(name);
  return {
    id: uid(), createdAt: t, updatedAt: t, status: 'draft', name, nameKey: norm(name),
    profile: p ? { nose: p.nose, palate: p.palate, finish: p.finish, body: p.body, sweet: p.sweet, smoky: p.smoky } : null,
    info: p ? structuredClone(p.info) : {},
    ratings: { nose: {}, palate: {}, finish: {} }, scores: {}, price: null, structure: {}, overall: {}, memo: '', place: ''
  };
}

export const topChips = (r, k) => Object.entries(r || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, k).map(([id, v]) => ({ ko: chipMap[id]?.ko || id, dots: '●'.repeat(v) }));

export function radarData(n) {
  const N = RADAR.length, R = 200, C = 300;
  const pt = (v, i, rr) => { const a = -Math.PI / 2 + 2 * Math.PI * i / N; const d = rr ?? (v / 5 * R); return [C + d * Math.cos(a), C + d * Math.sin(a)]; };
  const pts = vals => vals.map((v, i) => pt(v, i).map(x => x.toFixed(1)).join(',')).join(' ');
  const catOf = k => ({ sweet: 'sweet', smoky: 'peaty' }[k] || k);
  const p = n.profile, s = n.structure || {};
  const genCat = c => { if (!p) return 0; let k = 0; ['nose', 'palate', 'finish'].forEach(st => (p[st] || []).forEach(id => { if (chipCat[id] === c) k++; })); return Math.min(5, k * 1.2); };
  const mineCat = c => { let sum = 0; ['nose', 'palate', 'finish'].forEach(st => Object.entries(n.ratings[st] || {}).forEach(([id, v]) => { if (v > 0 && chipCat[id] === c) sum += v; })); return Math.min(5, sum / 1.5); };
  const gen = RADAR.map(([k]) => p ? (k === 'body' || k === 'sweet' || k === 'smoky' ? p[k] : genCat(k)) : 0);
  const mine = RADAR.map(([k]) => k === 'body' ? (s.body || 0) : (k === 'sweet' || k === 'smoky') ? (s[k] || mineCat(catOf(k))) : mineCat(k)).map(v => Math.max(v, 0.15));
  return {
    rings: [1, 2, 3, 4, 5].map(l => pts(Array(N).fill(l))),
    axes: RADAR.map(([, label], i) => { const [x, y] = pt(0, i, R); const [lx, ly] = pt(0, i, R + 46); return { x, y, lx, ly, label, anchor: Math.abs(lx - C) < 10 ? 'middle' : lx > C ? 'start' : 'end' }; }),
    gen: p ? pts(gen) : '', mine: pts(mine), hasGen: !!p
  };
}
