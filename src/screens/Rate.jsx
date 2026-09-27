import { useRef, useState } from 'react';
import { taxonomy, chipMap, chipCat, catMap, TABS, STAGES, SEGS, SERVES, REBUY, REGIONS, TYPES, CASKS, BOTTLERS, FLAGS } from '../lib.js';
import { W, finalScore } from '../score.js';

const LEVEL = { 1: '약', 2: '중', 3: '강', '-1': '안 느껴짐' };

// 탭: 꺼짐 → 약 → 중 → 강 → 꺼짐. 길게 누르기(450ms): 설명 시트.
function Chip({ id, v, onCycle, onLong }) {
  const p = useRef(null), skip = useRef(false);
  const cancel = () => { if (p.current) { clearTimeout(p.current.timer); p.current = null; } };
  return (
    <button className="chip" data-v={v || undefined} aria-label={`${chipMap[id].ko}, ${LEVEL[v] || '꺼짐'}`}
      onPointerDown={e => { cancel(); p.current = { x: e.clientX, y: e.clientY, long: false, timer: setTimeout(() => { if (p.current) p.current.long = true; navigator.vibrate?.(10); onLong(); }, 450) }; }}
      onPointerUp={e => { const q = p.current; if (!q) return; clearTimeout(q.timer); p.current = null; if (q.long || Math.hypot(e.clientX - q.x, e.clientY - q.y) > 10) return; skip.current = true; onCycle(); }}
      onPointerLeave={cancel} onPointerCancel={cancel} onContextMenu={e => e.preventDefault()}
      onClick={e => { if (skip.current) { skip.current = false; return; } if (e.detail === 0) onCycle(); }}>
      {chipMap[id].ko}<span>{v > 0 ? '●'.repeat(v) : v === -1 ? '안 느껴짐' : ''}</span>
    </button>
  );
}

function Stars({ value, label, onChange }) {
  return (
    <div className="stars" role="slider" tabIndex={0} aria-label={label} aria-valuemin={0} aria-valuemax={5} aria-valuenow={value}
      onClick={e => { const rc = e.currentTarget.getBoundingClientRect(); const v = Math.max(0.5, Math.min(5, Math.ceil((e.clientX - rc.left) / rc.width * 10) / 2)); onChange(value === v ? 0 : v); }}
      onKeyDown={e => { const d = { ArrowRight: 0.5, ArrowUp: 0.5, ArrowLeft: -0.5, ArrowDown: -0.5 }[e.key]; if (d) { e.preventDefault(); onChange(Math.max(0, Math.min(5, value + d))); } }}>
      {[0, 1, 2, 3, 4].map(i => <span key={i} className="star">★<i style={{ width: `${Math.max(0, Math.min(1, value - i)) * 100}%` }}><b>★</b></i></span>)}
    </div>
  );
}

function Options({ list, value, onPick, cls }) {
  return <div className={cls}>{list.map(([id, label]) => <button key={id} className="opt" aria-pressed={value === id} onClick={() => onPick(value === id ? undefined : id)}>{label}</button>)}</div>;
}

const Field = ({ label, children }) => <div className="col" style={{ gap: 8 }}><span className="field-l">{label}</span>{children}</div>;

const toggle = (arr = [], id) => arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];

function Picks({ list, on, onPick }) {
  return <div className="chips">{list.map(([id, lb]) => <button key={id} className="chip" data-v={on(id) ? 2 : undefined} aria-pressed={on(id)} onClick={() => onPick(id)}>{lb}</button>)}</div>;
}

export default function Rate({ note: n, upd, tab, setTab, onBack, onDone }) {
  const [openCats, setOpenCats] = useState({});
  const [sheet, setSheet] = useState(null);
  const [extraOpen, setExtraOpen] = useState(!!(n.memo || n.place));
  const sw = useRef(null);
  const T = TABS[tab], prof = n.profile, isFlavor = tab < 3;
  const r = isFlavor ? n.ratings[T.k] : {};
  const sc = n.scores || {}, fin = finalScore(sc);

  const setLevel = (id, v) => upd(x => { if (v) x.ratings[T.k][id] = v; else delete x.ratings[T.k][id]; });
  const cycle = id => { const v = r[id] || 0; setLevel(id, v === -1 || v === 3 ? 0 : v + 1); };
  const chip = id => <Chip key={id} id={id} v={r[id] || 0} onCycle={() => cycle(id)} onLong={() => setSheet(id)} />;
  const recIds = prof ? prof[T.k] || [] : [];
  const segs = SEGS[T.k] || [];
  const last = TABS.length - 1, info = n.info || {};
  const setInfo = (k, v) => upd(x => { x.info = x.info || {}; if (v === undefined || (Array.isArray(v) && !v.length)) delete x.info[k]; else x.info[k] = v; });

  return (<>
    <header className="rate-head">
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 8px 0' }}>
        <button className="icon-btn" aria-label="홈으로" onClick={onBack}>←</button>
        <div className="col" style={{ flex: 1, minWidth: 0, gap: 0 }}>
          <span className="serif" style={{ fontSize: 17, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.name}</span>
          <span className="muted" style={{ fontSize: 12 }}>자동 저장됨</span>
        </div>
      </div>
      <nav role="tablist" className="tabs">
        {TABS.map((t, i) => {
          const c = i < 3 ? Object.values(n.ratings[t.k]).filter(v => v > 0).length : t.k === 'overall' ? (fin ? '★' : '') : '';
          return <button key={t.k} role="tab" className="tab" aria-selected={i === tab} onClick={() => setTab(i)}>{t.ko}<span>{c || ''}</span></button>;
        })}
      </nav>
    </header>

    <main style={{ padding: '16px 12px 32px', gap: 16, touchAction: 'pan-y' }}
      onTouchStart={e => { const t = e.touches[0]; sw.current = { x: t.clientX, y: t.clientY }; }}
      onTouchEnd={e => { const s = sw.current; if (!s) return; const t = e.changedTouches[0]; const dx = t.clientX - s.x, dy = t.clientY - s.y; sw.current = null; if (Math.abs(dx) > 70 && Math.abs(dy) < 50) { const nt = Math.max(0, Math.min(last, tab + (dx < 0 ? 1 : -1))); if (nt !== tab) setTab(nt); } }}>

      {isFlavor && <>
        <section className="group">
          <div className="group-h"><h2 className="h2">{T.ko} · 추천 풍미</h2><span className="muted" style={{ fontSize: 12 }}>{prof ? '내장 프로필' : '기본 휠'}</span></div>
          {recIds.length ? <div className="chips">{recIds.map(chip)}</div>
            : <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>내장 목록에 없는 위스키입니다. 아래 전체 풍미에서 느낀 것을 골라 주세요.</p>}
          <p className="muted" style={{ margin: 0, fontSize: 12 }}>탭: 약 ● → 중 ●● → 강 ●●● → 끔 · 길게 누르기: 설명·안 느껴짐</p>
        </section>
        <section className="col" style={{ gap: 8 }}>
          <div className="row" style={{ padding: '0 4px 4px' }}><h2 className="h2">전체 풍미</h2><span className="muted" style={{ fontSize: 12 }}>선택은 모두 선택 사항</span></div>
          {taxonomy.categories.map(c => {
            const open = openCats[c.id] ?? !prof;
            const picked = c.chips.filter(ch => (r[ch.id] || 0) > 0).map(ch => ch.ko);
            return (<div key={c.id} className="cat" data-open={open}>
              <button className="cat-btn" aria-expanded={open} onClick={() => setOpenCats({ ...openCats, [c.id]: !open })}>
                <span className="col" style={{ gap: 2, minWidth: 0 }}>
                  <span><b className="cat-ko">{c.ko}</b> <span className="muted" style={{ fontSize: 12 }}>{c.en}</span></span>
                  {!open && picked.length > 0 && <span className="cat-picked">{picked.join(', ')}</span>}
                </span>
                {picked.length > 0 && <span className="badge">{picked.length}</span>}
                <span className="chev">{open ? '−' : '+'}</span>
              </button>
              {open && <div className="chips cat-body">{c.chips.map(ch => chip(ch.id))}</div>}
            </div>);
          })}
        </section>
      </>}

      {segs.length > 0 && <section className="group" style={{ gap: 18 }}>
        <div className="group-h"><h2 className="h2">구조</h2>{prof && segs.some(([k]) => prof[k]) && <span className="muted" style={{ fontSize: 12 }}>▲ 일반 프로필 값</span>}</div>
        {segs.map(([k, label, lo, hi]) => {
          const v = n.structure[k] || 0, g = prof ? prof[k] : 0;
          return (<div key={k} role="radiogroup" aria-label={label} className="col" style={{ gap: 8 }}>
            <div className="row"><span style={{ fontSize: 15, fontWeight: 600 }}>{label}</span><span className="muted" style={{ fontSize: 12 }}>{lo} ↔ {hi}</span></div>
            <div className="seg">{[1, 2, 3, 4, 5].map(i => (
              <button key={i} role="radio" aria-checked={v === i} aria-label={`${label} ${i}`} data-s={i < v ? 'on' : undefined}
                onClick={() => upd(x => { if (x.structure[k] === i) delete x.structure[k]; else x.structure[k] = i; })}>
                {i}<small>{g === i ? '▲' : ''}</small>
              </button>))}
            </div>
          </div>);
        })}
      </section>}

      {T.k === 'info' && <>
        {n.profile && <p className="muted" style={{ margin: '0 4px', fontSize: 12 }}>내장 정보로 미리 채웠습니다. 병마다 다르면 고쳐 주세요.</p>}
        <section className="group">
          <div className="group-h"><h2 className="h2">기본 정보</h2></div>
          <Field label="증류소"><input className="field" value={info.distillery || ''} onChange={e => setInfo('distillery', e.target.value)} placeholder="예: Lagavulin" /></Field>
          <Field label="지역"><Picks list={REGIONS} on={id => info.region === id} onPick={id => setInfo('region', info.region === id ? undefined : id)} /></Field>
          <Field label="종류"><Picks list={TYPES} on={id => info.type === id} onPick={id => setInfo('type', info.type === id ? undefined : id)} /></Field>
        </section>
        <section className="group">
          <div className="group-h"><h2 className="h2">숙성 · 도수</h2></div>
          <div className="info-grid">
            {[['age', '숙성 연수', '년', 'numeric'], ['abv', '도수 (ABV)', '%', 'decimal'], ['distilled', '증류 연도', '', 'numeric'], ['bottled', '병입 연도', '', 'numeric']].map(([k, lb, unit, mode]) => (
              <Field key={k} label={lb}><span style={{ position: 'relative' }}>
                <input className="field" inputMode={mode} pattern={mode === 'numeric' ? '[0-9]*' : undefined} value={info[k] || ''} placeholder={k === 'distilled' || k === 'bottled' ? 'YYYY' : ''}
                  onChange={e => setInfo(k, e.target.value.replace(mode === 'decimal' ? /[^\d.]/g : /\D/g, '').slice(0, mode === 'decimal' ? 5 : 4) || undefined)} />
                {unit && <span className="unit">{unit}</span>}
              </span></Field>))}
          </div>
        </section>
        <section className="group">
          <div className="group-h"><h2 className="h2">캐스크 · 병입</h2></div>
          <Field label="캐스크 (복수 선택)"><Picks list={CASKS} on={id => (info.casks || []).includes(id)} onPick={id => setInfo('casks', toggle(info.casks, id))} /></Field>
          <Field label="병입"><Picks list={BOTTLERS} on={id => info.bottler === id} onPick={id => setInfo('bottler', info.bottler === id ? undefined : id)} /></Field>
          <Field label="라벨 표기 (복수 선택)"><Picks list={FLAGS} on={id => (info.flags || []).includes(id)} onPick={id => setInfo('flags', toggle(info.flags, id))} /></Field>
        </section>
      </>}

      {T.k === 'overall' && <>
        <section className="panel">
          <div className="row"><h2 className="h2">점수 <small>필수</small></h2><span className="muted" style={{ fontSize: 12 }}>향 20 · 맛 50 · 피니쉬 30</span></div>
          {STAGES.map(t => { const v = sc[t.k] || 0; return (
            <div key={t.k} className="score-row">
              <div className="col" style={{ gap: 2 }}><span style={{ fontWeight: 600 }}>{t.ko}</span><span className="gold small">{Math.round(W[t.k] * 100)}% · {v ? v.toFixed(1) : '–'}</span></div>
              <Stars value={v} label={`${t.ko} 점수`} onChange={nv => upd(x => { x.scores = x.scores || {}; if (nv > 0) x.scores[t.k] = nv; else delete x.scores[t.k]; })} />
            </div>); })}
          <div className="row" style={{ borderTop: '1px solid var(--line)', paddingTop: 12, alignItems: 'center' }}>
            <span className="h2">최종 점수</span>
            {fin ? <span><span className="final">{fin.toFixed(1)}</span><span className="muted" style={{ fontSize: 15 }}> / 5</span></span> : <span className="muted" style={{ fontSize: 15 }}>미완성</span>}
          </div>
          {!fin && <p className="muted small" style={{ margin: 0, lineHeight: 1.5 }}>향·맛·피니쉬 점수를 모두 매겨야 노트를 완성할 수 있습니다.</p>}
        </section>
        <section className="group">
          <div className="group-h"><h2 className="h2">기록 <small>선택</small></h2></div>
          <Field label="가격"><span style={{ position: 'relative' }}>
            <span className="won">₩</span>
            <input className="field" style={{ paddingLeft: 38 }} inputMode="numeric" pattern="[0-9]*" placeholder="병 또는 잔 가격" aria-label="가격(원)"
              value={n.price ? Number(n.price).toLocaleString('ko-KR') : ''}
              onChange={e => { const d = e.target.value.replace(/[^\d]/g, '').slice(0, 10); upd(x => { x.price = d ? +d : null; }); }} />
          </span></Field>
          <Field label="다시 살까요?"><Options cls="grid3" list={REBUY} value={n.overall.rebuy} onPick={v => upd(x => { x.overall.rebuy = v; })} /></Field>
          <Field label="음용법"><Options cls="grid4" list={SERVES} value={n.overall.serve} onPick={v => upd(x => { x.overall.serve = v; })} /></Field>
          <div style={{ borderTop: '1px solid var(--line)' }}>
            <button className="cat-btn" style={{ justifyContent: 'space-between', padding: 0 }} aria-expanded={extraOpen} onClick={() => setExtraOpen(!extraOpen)}>
              <span className="field-l">메모 · 장소</span><span className="chev">{extraOpen ? '−' : '+'}</span>
            </button>
            {extraOpen && <div className="col">
              <input className="field" value={n.place} onChange={e => { const v = e.target.value; upd(x => { x.place = v; }); }} placeholder="장소 (예: 을지로 바)" />
              <textarea className="field" rows={3} value={n.memo} onChange={e => { const v = e.target.value; upd(x => { x.memo = v; }); }} placeholder="짧은 메모" />
            </div>}
          </div>
        </section>
      </>}
    </main>

    <div className="bottom rate-foot">
      <button className="prev" aria-label="이전" disabled={tab === 0} onClick={() => setTab(tab - 1)}>‹</button>
      <button className="primary" onClick={() => tab < last ? setTab(tab + 1) : onDone()}>{tab < last ? `다음 · ${TABS[tab + 1].ko}` : '노트 완성'}</button>
    </div>

    {sheet && isFlavor && (() => {
      const ch = chipMap[sheet], v = r[sheet] || 0, pick = lv => { setLevel(sheet, lv); setSheet(null); };
      return (<div className="scrim" onClick={() => setSheet(null)}>
        <div className="sheet" role="dialog" aria-label={ch.ko} onClick={e => e.stopPropagation()}>
          <div className="col" style={{ gap: 4 }}>
            <span className="muted" style={{ fontSize: 12, letterSpacing: 1 }}>{catMap[chipCat[sheet]].ko} · {T.ko}</span>
            <span className="serif" style={{ fontSize: 24 }}>{ch.ko} <span className="muted" style={{ fontFamily: 'Pretendard,sans-serif', fontWeight: 400, fontSize: 15 }}>{ch.en}</span></span>
            <p style={{ margin: '4px 0 0', fontSize: 15, lineHeight: 1.6 }}>{ch.desc}</p>
          </div>
          <div className="grid4" style={{ gap: 6 }}>
            {[[0, '끔'], [1, '약 ●'], [2, '중 ●●'], [3, '강 ●●●']].map(([lv, label]) => <button key={lv} className="opt" aria-pressed={v === lv} onClick={() => pick(lv)}>{label}</button>)}
          </div>
          <button className="opt" aria-pressed={v === -1} onClick={() => pick(v === -1 ? 0 : -1)}>안 느껴짐</button>
          <button className="ghost" style={{ height: 48, fontSize: 15 }} onClick={() => setSheet(null)}>닫기</button>
        </div>
      </div>);
    })()}
  </>);
}
