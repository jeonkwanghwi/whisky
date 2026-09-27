import { useState } from 'react';
import { profiles, norm } from '../lib.js';

export default function Name({ notes, onStart, onBack }) {
  const [query, setQuery] = useState('');
  const q = norm(query);
  const match = (a, b) => !q || norm(a).includes(q) || norm(b).includes(q);
  const recent = [...new Set([...notes].sort((a, b) => b.createdAt - a.createdAt).map(x => x.name))];
  const groups = [
    { title: '최근 기록', items: recent.filter(x => match(x)).slice(0, q ? 4 : 5).map(x => [x, '최근']) },
    { title: q ? '인기 목록' : '인기 싱글몰트', items: profiles.popular.filter(([en, ko]) => !recent.includes(en) && match(en, ko)).slice(0, q ? 6 : 8) }
  ].filter(g => g.items.length);

  return (<>
    <header style={{ padding: '12px 8px' }}><button className="icon-btn" aria-label="뒤로" onClick={onBack}>←</button></header>
    <main style={{ padding: '8px 20px 24px', gap: 20 }}>
      <h1 className="serif" style={{ margin: 0, fontSize: 26, lineHeight: 1.3 }}>어떤 위스키인가요?</h1>
      <input className="name-input" autoFocus value={query} onChange={e => setQuery(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) onStart(query); }}
        placeholder="예: 라가불린 16, Talisker 10" autoComplete="off" enterKeyHint="go" />
      <div className="col" style={{ gap: 0 }}>
        {groups.map(g => (<div key={g.title} className="col" style={{ gap: 0 }}>
          <div className="sg-title">{g.title}</div>
          {g.items.map(([name, sub]) => (
            <button key={name} className="sg" onClick={() => onStart(name)}><span>{name}</span><span className="muted small">{sub}</span></button>
          ))}
        </div>))}
      </div>
    </main>
    <div className="bottom" style={{ borderTop: 0 }}><button className="primary" disabled={!query.trim()} onClick={() => onStart(query)}>평가 시작</button></div>
  </>);
}
