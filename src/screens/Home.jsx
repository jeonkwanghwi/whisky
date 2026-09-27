import { useRef, useState } from 'react';
import { topChips, fmtDate, fmtPrice, serveLabel } from '../lib.js';
import { finalScore } from '../score.js';

export default function Home({ notes, theme, setTheme, flash, importNotes, onNew, onOpen }) {
  const [menu, setMenu] = useState(false);
  const file = useRef();
  const sorted = [...notes].sort((a, b) => b.createdAt - a.createdAt);

  const exportJson = () => {
    const data = { app: 'whisky-tasting-notes', version: 1, exportedAt: new Date().toISOString(), notes };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    a.download = `tasting-notes-${fmtDate(Date.now())}.json`; a.click();
    setMenu(false); flash(`${notes.length}개 노트를 내보냈습니다`);
  };
  const importFile = e => {
    const f = e.target.files[0]; if (!f) return;
    f.text().then(t => {
      const d = JSON.parse(t); const arr = Array.isArray(d) ? d : d.notes;
      if (!Array.isArray(arr)) throw 0;
      flash(`${importNotes(arr)}개 추가·갱신`);
    }).catch(() => flash('가져올 수 없는 파일입니다'));
    e.target.value = ''; setMenu(false);
  };

  return (<>
    <header className="home-head">
      <div className="col" style={{ gap: 4 }}>
        <span className="eyebrow">TASTING NOTES</span>
        <h1 className="serif" style={{ margin: 0, fontSize: 28, lineHeight: 1.25 }}>테이스팅 노트</h1>
      </div>
      <button className="menu-btn" aria-label="메뉴" onClick={() => setMenu(!menu)}>⋯</button>
      {menu && <div className="menu">
        <button onClick={exportJson}>JSON 내보내기</button>
        <button onClick={() => file.current.click()}>JSON 가져오기</button>
        <button onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setMenu(false); }}>{theme === 'dark' ? '라이트 모드' : '다크 모드'}</button>
      </div>}
      <input ref={file} type="file" accept="application/json,.json" onChange={importFile} hidden />
    </header>
    <div className="muted" style={{ padding: '0 20px 8px', fontSize: 14 }}>{sorted.length ? `${sorted.length}잔 기록` : ''}</div>
    <main style={{ padding: '8px 20px 24px', gap: 12 }}>
      {!sorted.length && <div className="col" style={{ marginTop: 64, textAlign: 'center', alignItems: 'center', gap: 8 }}>
        <p className="serif" style={{ margin: 0, fontSize: 20, fontWeight: 400 }}>첫 잔을 기록해 보세요</p>
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>이름만 입력하면 나머지는 탭으로 끝납니다.</p>
      </div>}
      {sorted.map(x => {
        const chips = [...new Set([...topChips(x.ratings.nose, 2), ...topChips(x.ratings.palate, 2)].map(c => c.ko))].slice(0, 4).join(' · ');
        const f = finalScore(x.scores);
        return (
          <button key={x.id} className="note" onClick={() => onOpen(x)}>
            <div className="row">
              <span className="serif note-name">{x.name}</span>
              <span className={f ? 'gold' : 'muted'} style={{ fontSize: 15, whiteSpace: 'nowrap' }}>{f ? `★ ${f.toFixed(1)}` : '미완성'}</span>
            </div>
            <div className="muted small">{[fmtDate(x.createdAt), serveLabel(x.overall?.serve), fmtPrice(x.price), x.place].filter(Boolean).join(' · ')}</div>
            {chips && <div style={{ fontSize: 14, lineHeight: 1.5 }}>{chips}</div>}
            {x.status === 'draft' && <span className="draft-tag">작성 중 · 이어쓰기</span>}
          </button>
        );
      })}
    </main>
    <div className="bottom"><button className="primary" onClick={onNew}>＋ 새 노트</button></div>
  </>);
}
