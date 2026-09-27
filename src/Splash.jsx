import { useEffect, useState } from 'react';
import src from './assets/splash.jpg';
import sign from './assets/sign.png';

// 앱을 켜면 그림이 페이드인되고, 2초 뒤 그림 속으로 확대되며 사라진다. 탭하면 바로 넘어간다.
const HOLD = 2000, OUT = 1000;

export default function Splash({ onDone }) {
  const [loaded, setLoaded] = useState(false);
  const [out, setOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOut(true), loaded ? HOLD : 4000); // 이미지가 안 뜨면 4초 뒤 넘어감
    return () => clearTimeout(t);
  }, [loaded]);
  useEffect(() => {
    if (!out) return;
    const t = setTimeout(onDone, OUT);
    return () => clearTimeout(t);
  }, [out]);

  return (
    <div className="splash" data-out={out || undefined} onClick={() => setOut(true)} aria-hidden="true">
      <img className="splash-photo" src={src} alt="" onLoad={() => setLoaded(true)} onError={() => setOut(true)} style={{ visibility: loaded ? 'visible' : 'hidden' }} />
      {loaded && <img className="splash-sign" src={sign} alt="" />}
    </div>
  );
}
