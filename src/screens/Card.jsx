import { useEffect, useRef, useState } from 'react';
import { toBlob } from 'html-to-image';
import { STAGES, REBUY_CARD, REGIONS, CASKS, label, topChips, radarData, fmtDate, fmtPrice, serveLabel } from '../lib.js';
import { W, finalScore } from '../score.js';

// html-to-image는 기본으로 한글 폰트 서브셋 200여 개를 전부 받아 넣어 수십 초가 걸린다.
// 화면에서 이미 로드된 서브셋만 골라 넣는다.
const key = (family, range) => `${family}|${range || 'u+0-10ffff'}`.replace(/["'\s]/g, '').toLowerCase();
async function loadedFontCSS() {
  const loaded = new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => key(f.family, f.unicodeRange)));
  const rules = [...document.styleSheets].flatMap(s => { try { return [...s.cssRules]; } catch { return []; } })
    .filter(r => r instanceof CSSFontFaceRule && loaded.has(key(r.style.getPropertyValue('font-family'), r.style.getPropertyValue('unicode-range'))));
  const css = await Promise.all(rules.map(async r => {
    const url = new URL(r.style.getPropertyValue('src').match(/url\(["']?([^"')]+)/)[1], r.parentStyleSheet.href || location.href);
    const blob = await (await fetch(url)).blob();
    const data = await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); });
    return r.cssText.replace(/src:[^;]+;/, `src: url("${data}");`);
  }));
  return css.join('\n');
}

export default function Card({ note: n, flash, onBack, onEdit, onDelete }) {
  const [tall, setTall] = useState(false);
  const [scale, setScale] = useState(0.3);
  const [busy, setBusy] = useState(false);
  const wrap = useRef(), node = useRef();
  const H = tall ? 1920 : 1350;

  useEffect(() => {
    const el = wrap.current, f = () => setScale(el.clientWidth / 1080);
    const ro = new ResizeObserver(f); ro.observe(el); f();
    return () => ro.disconnect();
  }, []);

  const share = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await document.fonts.ready;
      const blob = await toBlob(node.current, { width: 1080, height: H, pixelRatio: 1, style: { transform: 'none' }, fontEmbedCSS: await loadedFontCSS() });
      const fname = `${n.name.replace(/[^\w가-힣]+/g, '_')}_1080x${H}.png`;
      const file = new File([blob], fname, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: n.name });
      } else {
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fname; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        flash('이미지를 저장했습니다');
      }
    } catch (e) { if (e?.name !== 'AbortError') flash('이미지 생성에 실패했습니다'); }
    setBusy(false);
  };

  const fin = finalScore(n.scores), full = Math.round(fin || 0), sc = n.scores || {};
  const pills = [serveLabel(n.overall.serve), REBUY_CARD[n.overall.rebuy], fmtPrice(n.price)].filter(Boolean);
  const radar = radarData(n), radarSize = tall ? 620 : 470;
  const memo = (n.memo || '').trim(), info = n.info || {};
  const infoLine = [label(REGIONS, info.region), info.age && `${info.age}년`, info.abv && `${info.abv}%`, (info.casks || []).map(c => label(CASKS, c)).join('·')].filter(Boolean).join(' · ');

  return (<>
    <header style={{ padding: '8px 8px 4px', display: 'flex', alignItems: 'center', gap: 4 }}>
      <button className="icon-btn" aria-label="홈으로" onClick={onBack}>←</button>
      <span className="muted small" style={{ flex: 1 }}>자동 저장됨 · 이 기기에만 보관</span>
      <button className="ghost gold" style={{ fontSize: 15, fontWeight: 600 }} onClick={onEdit}>편집</button>
    </header>
    <main style={{ padding: '8px 16px 24px', gap: 16 }}>
      <div ref={wrap} className="card-wrap" style={{ aspectRatio: `1080 / ${H}` }}>
        <div ref={node} className="share" style={{ height: H, transform: `scale(${scale})` }}>
          <div className="col" style={{ gap: 22 }}>
            <div className="top"><span style={{ letterSpacing: 8, color: '#F2C06B' }}>TASTING NOTE</span><span style={{ color: '#A8927A' }}>{fmtDate(n.createdAt)}</span></div>
            <div className="name">{n.name}</div>
            {infoLine && <div style={{ fontSize: 28, color: '#A8927A', marginTop: -8 }}>{infoLine}</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', color: '#F2C06B' }}>
              <span style={{ fontSize: 56, letterSpacing: 4, lineHeight: 1 }}>{'★'.repeat(full) + '☆'.repeat(5 - full)}</span>
              <span style={{ fontSize: 44, fontWeight: 700 }}>{fin ? fin.toFixed(1) : '미완성'}</span>
              {pills.map(p => <span key={p} className="pill" style={{ color: '#F3E6D3' }}>{p}</span>)}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
            <svg viewBox="0 0 600 600" width={radarSize} height={radarSize} style={{ flex: 'none' }}>
              {radar.rings.map((pts, i) => <polygon key={i} points={pts} fill="none" stroke="rgba(243,230,211,.12)" strokeWidth="1.5" />)}
              {radar.axes.map(a => <g key={a.label}>
                <line x1="300" y1="300" x2={a.x} y2={a.y} stroke="rgba(243,230,211,.12)" strokeWidth="1.5" />
                <text x={a.lx} y={a.ly} textAnchor={a.anchor} dominantBaseline="middle" fill="#A8927A" fontSize="26" fontFamily="Pretendard,sans-serif">{a.label}</text>
              </g>)}
              {radar.hasGen && <polygon points={radar.gen} fill="none" stroke="#A8927A" strokeWidth="3" strokeDasharray="10 8" />}
              <polygon points={radar.mine} fill="rgba(217,142,50,.35)" stroke="#D98E32" strokeWidth="4" strokeLinejoin="round" />
            </svg>
            <div className="col" style={{ gap: 18, fontSize: 24, color: '#A8927A' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ width: 36, borderTop: '4px solid #D98E32' }} />내 평가</span>
              {radar.hasGen && <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ width: 36, borderTop: '3px dashed #A8927A' }} />일반 프로필</span>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 32 }}>
            {STAGES.map(t => (
              <div key={t.k} className="col">
                <div className="stage-h"><span style={{ fontSize: 22, letterSpacing: 5, color: '#F2C06B' }}>{t.en}</span><span style={{ fontSize: 20, color: '#A8927A' }}>{Math.round(W[t.k] * 100)}% · {sc[t.k] ? sc[t.k].toFixed(1) : '–'}</span></div>
                {topChips(n.ratings[t.k], tall ? 7 : 5).map(c => <span key={c.ko} className="c"><span>{c.ko}</span><span>{c.dots}</span></span>)}
              </div>
            ))}
          </div>
          {memo && <div className="memo">“{memo}”</div>}
          <div className="foot"><span>{n.place || ''}</span><span>위스키 테이스팅 노트</span></div>
        </div>
      </div>
      <div className="grid3" style={{ gridTemplateColumns: 'repeat(2,minmax(0,1fr))' }}>
        {[[false, '4:5 · 1080×1350'], [true, '9:16 · 1080×1920']].map(([v, label]) =>
          <button key={label} className="opt" style={{ height: 44, fontSize: 14, fontWeight: 400, background: tall === v ? undefined : 'transparent' }} aria-pressed={tall === v} onClick={() => setTall(v)}>{label}</button>)}
      </div>
      <button className="ghost" style={{ alignSelf: 'center' }} onClick={() => { if (confirm(`'${n.name}' 노트를 삭제할까요?`)) onDelete(); }}>노트 삭제</button>
    </main>
    <div className="bottom">
      <button className="primary" style={{ opacity: busy ? 0.6 : 1 }} onClick={share}>{busy ? '이미지 만드는 중…' : '이미지로 공유'}</button>
    </div>
  </>);
}
