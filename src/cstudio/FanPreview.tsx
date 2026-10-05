// The live fan-view preview shown on the right of the new-panel wizard and the
// control room. It rebuilds from the toggled sections and the chosen colours,
// so the operator sees what fans will see as they configure it.
import { A, type Colors, type SectionKey } from './studioData';

const INK = '#1C1A17';
const MUT = '#7A746C';

export function FanPreview({ title, colors, sections }:
  { title: string; colors: Colors; sections: Record<SectionKey, boolean> }) {
  const card: React.CSSProperties = {
    background: 'rgba(0,0,0,0.045)', borderRadius: 12, padding: '10px 11px', margin: '0 11px 9px',
  };
  const lbl: React.CSSProperties = { font: '600 8px/1 inherit', letterSpacing: '.06em', textTransform: 'uppercase', color: MUT };
  const on = (k: SectionKey) => sections[k];

  return (
    <div style={{
      width: 248, borderRadius: 26, overflow: 'hidden', background: colors.bg, color: INK,
      boxShadow: '0 20px 50px -20px rgba(0,0,0,.6), 0 0 0 7px #0b0a0f', fontSize: 12, lineHeight: 1.5,
      fontFamily: "'Zen Kaku Gothic New',system-ui,sans-serif",
    }}>
      {/* hero */}
      <div style={{ height: 96, background: colors.primary, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, position: 'relative' }}>
        {on('iris') && (
          <span style={{ position: 'absolute', left: 9, top: 9, display: 'inline-flex', alignItems: 'center', gap: 4, height: 18, padding: '0 8px', borderRadius: 9, background: 'rgba(255,255,255,0.92)', color: colors.primary, fontSize: 9, fontWeight: 700 }}>
            <span style={{ fontSize: 9 }}>✦</span>Ask IRIS
          </span>
        )}
        <img src={A('crest.png')} alt="" style={{ width: 36, height: 36 }} />
        <div style={{ font: '700 13px/1 inherit', color: '#fff' }}>{title || 'Panel name'}</div>
      </div>

      <div style={{ padding: '11px 0 14px', maxHeight: 440, overflow: 'hidden' }}>
        {on('fanChat') && (
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
              <span style={{ width: 14, height: 14, borderRadius: '50%', background: colors.accent }} />
              <b style={{ fontSize: 12 }}>Fan Chat</b><span style={{ color: MUT, fontSize: 9.5 }}>7 fans active</span>
            </div>
            {['Still buzzing from last week! 🥳', "Training's tough but worth it 🏆"].map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 5 }}>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: i ? '#3aa17a' : '#c9a24a', flex: 'none' }} />
                <span style={{ fontSize: 10.5 }}>{m}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 5, marginTop: 7 }}>
              <span style={{ flex: 1, height: 18, borderRadius: 9, background: 'rgba(0,0,0,.05)', display: 'flex', alignItems: 'center', padding: '0 8px', color: MUT, fontSize: 9.5 }}>Join the conversation…</span>
              <span style={{ width: 18, height: 18, borderRadius: 6, background: colors.accent }} />
            </div>
          </div>
        )}
        {on('polls') && (
          <div style={card}>
            <div style={lbl}>Poll</div>
            <div style={{ fontSize: 11, margin: '5px 0 7px' }}>Who will win the next match?</div>
            {[['Arsenal', 62], ['Chelsea', 38]].map(([n, p]) => (
              <div key={n as string} style={{ position: 'relative', height: 17, borderRadius: 5, background: 'rgba(0,0,0,.05)', marginBottom: 5, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, width: `${p}%`, background: colors.accent, opacity: 0.4 }} />
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', padding: '0 7px', lineHeight: '17px', fontSize: 10 }}><span>{n}</span><span>{p}%</span></div>
              </div>
            ))}
          </div>
        )}
        {on('predictions') && (
          <div style={card}>
            <div style={lbl}>Pick &amp; Win</div>
            <div style={{ fontSize: 11, margin: '5px 0 7px' }}>Who scores first for Arsenal?</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 7 }}>
              {['Saka', 'Havertz'].map((n) => <span key={n} style={{ flex: 1, height: 20, borderRadius: 6, background: 'rgba(0,0,0,.05)', display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: 10 }}>{n}</span>)}
            </div>
            <div style={{ height: 22, borderRadius: 7, background: colors.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 600, color: readable(colors.accent) }}>Enter your pick</div>
          </div>
        )}
        {on('crews') && (
          <div style={{ ...card, background: '#17150f', color: '#efe9da' }}>
            <div style={{ fontSize: 8.5, letterSpacing: '.08em', color: colors.accent }}>NEW · CREWS</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 }}>
              <b style={{ fontSize: 12 }}>Find your crew</b>
              <span style={{ height: 18, padding: '0 9px', borderRadius: 9, background: colors.accent, color: readable(colors.accent), fontSize: 9.5, display: 'flex', alignItems: 'center' }}>Join Crew</span>
            </div>
          </div>
        )}
        {on('rewards') && (
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5 }}><b>Your rewards</b><span>1,240 pts</span></div>
            <div style={{ height: 7, borderRadius: 4, background: 'rgba(0,0,0,.06)', margin: '6px 0 4px', overflow: 'hidden' }}><div style={{ width: '62%', height: '100%', background: colors.accent }} /></div>
            <div style={{ fontSize: 9, color: MUT }}>260 pts to a signed shirt</div>
          </div>
        )}
        {on('shop') && (
          <div style={{ padding: '0 11px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, margin: '2px 0 7px' }}>Shop</div>
            <div style={{ display: 'flex', gap: 7 }}>
              {[A('shirt.png'), A('cap.png')].map((src) => (
                <div key={src} style={{ flex: 1, borderRadius: 8, background: 'rgba(0,0,0,.05)', padding: 6 }}>
                  <img src={src} alt="" style={{ width: '100%', height: 54, objectFit: 'cover', borderRadius: 5, background: '#fff' }} />
                </div>
              ))}
            </div>
          </div>
        )}
        {on('reads') && (
          <div style={{ ...card, marginTop: 9 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Reads</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <img src={A('read-match.png')} alt="" style={{ width: 66, height: 44, objectFit: 'cover', borderRadius: 6 }} />
              <span style={{ fontSize: 10.5 }}>Calafiori hails defensive effort after win at Villa</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Black or white text for best contrast on a hex background.
export function readable(hex: string): string {
  const c = hex.replace('#', '');
  if (c.length < 6) return '#000';
  const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  const L = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return L > 0.6 ? '#1C1A17' : '#fff';
}

// WCAG-ish contrast ratio between two hex colours.
export function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const c = hex.replace('#', '');
    const ch = [0, 2, 4].map((i) => {
      const v = parseInt(c.slice(i, i + 2) || '0', 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  };
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
