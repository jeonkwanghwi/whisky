import { useEffect, useRef, useState } from 'react';
import { loadNotes, saveNote, saveNotes, removeNote } from './db.js';
import { blank } from './lib.js';
import Home from './screens/Home.jsx';
import Name from './screens/Name.jsx';
import Rate from './screens/Rate.jsx';
import Card from './screens/Card.jsx';

// 화면·설정은 localStorage(작은 값), 노트는 IndexedDB(db.js).
const readSession = () => { try { return JSON.parse(localStorage.getItem('wtn.session')) || { screen: 'home' }; } catch { return { screen: 'home' }; } };

export default function App() {
  const [notes, setNotes] = useState(null);
  const [nav, setNav] = useState(readSession);
  const [theme, setTheme] = useState(() => localStorage.getItem('wtn.theme') || 'dark');
  const [toast, setToast] = useState('');
  const tt = useRef();

  useEffect(() => { loadNotes().then(setNotes); }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name=theme-color]').content = theme === 'light' ? '#F6EEE2' : '#1A120B';
    localStorage.setItem('wtn.theme', theme);
  }, [theme]);
  useEffect(() => {
    localStorage.setItem('wtn.session', JSON.stringify(nav));
    window.scrollTo(0, 0);
  }, [nav.screen, nav.curId, nav.tab]);

  if (!notes) return null;

  const flash = msg => { clearTimeout(tt.current); setToast(msg); tt.current = setTimeout(() => setToast(''), 2400); };
  const go = (screen, extra) => setNav({ screen, ...extra });
  const cur = notes.find(n => n.id === nav.curId);
  const screen = cur || nav.screen === 'home' || nav.screen === 'name' ? nav.screen : 'home';

  // 모든 변경은 즉시 저장한다(저장 버튼 없음).
  const upd = mut => {
    const c = structuredClone(cur); mut(c); c.updatedAt = Date.now();
    saveNote(c); setNotes(ns => ns.map(x => x.id === c.id ? c : x));
  };
  const start = name => {
    name = name.trim(); if (!name) return;
    const n = blank(name);
    saveNote(n); setNotes([n, ...notes]);
    go('rate', { curId: n.id, tab: 0 });
  };
  const importNotes = arr => {
    const map = new Map(notes.map(n => [n.id, n])); const changed = [];
    arr.forEach(n => { if (!n || !n.id || !n.name) return; const ex = map.get(n.id); if (!ex || (n.updatedAt || 0) > (ex.updatedAt || 0)) { map.set(n.id, n); changed.push(n); } });
    saveNotes(changed); setNotes([...map.values()]);
    return changed.length;
  };
  const del = () => { removeNote(cur.id); setNotes(notes.filter(x => x.id !== cur.id)); go('home'); flash('삭제했습니다'); };

  return (
    <div className="app">
      {screen === 'home' && <Home notes={notes} theme={theme} setTheme={setTheme} flash={flash} importNotes={importNotes}
        onNew={() => go('name')} onOpen={n => go(n.status === 'draft' ? 'rate' : 'card', { curId: n.id, tab: 0 })} />}
      {screen === 'name' && <Name notes={notes} onStart={start} onBack={() => go('home')} />}
      {screen === 'rate' && <Rate note={cur} upd={upd} tab={nav.tab || 0} setTab={tab => setNav({ ...nav, tab })} onBack={() => go('home')}
        onDone={() => { upd(x => { x.status = 'done'; }); go('card', { curId: cur.id }); flash('노트를 저장했습니다'); }} />}
      {screen === 'card' && <Card note={cur} flash={flash} onBack={() => go('home')} onEdit={() => go('rate', { curId: cur.id, tab: 0 })} onDelete={del} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
