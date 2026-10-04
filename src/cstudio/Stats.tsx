// Stats for one panel — summary, season totals, fans-per-session chart, where
// fans spend time, recent sessions. Placeholder data, BoltOS styling.
import { T, A, type Panel } from './studioData';
import { Ico } from './Ico';
import { iconBtn } from './ConnectStudio';

const SESSIONS = [
  { s: 'v Chelsea', d: 'Sat 25 Oct', fans: 4812, dur: '2h 10m' },
  { s: 'v Spurs', d: 'Sun 19 Oct', fans: 5240, dur: '2h 20m' },
  { s: 'v Liverpool', d: 'Sat 11 Oct', fans: 4610, dur: '2h 05m' },
  { s: 'v Newcastle', d: 'Sat 4 Oct', fans: 3980, dur: '1h 58m' },
  { s: 'v West Ham', d: 'Sun 28 Sep', fans: 4120, dur: '2h 02m' },
  { s: 'v Man City', d: 'Sat 21 Sep', fans: 5510, dur: '2h 24m' },
];
const SPEND = [
  ['Fan chat', 38], ['Predictions', 24], ['Shop', 16], ['Polls', 13], ['Reads', 9],
] as const;

export function Stats({ panel, onBack }: { panel: Panel; onBack: () => void }) {
  const max = Math.max(...SESSIONS.map((x) => x.fans));
  const totals: [string, string][] = [
    ['Sessions this season', '12'], ['Total fans', '54.2k'], ['Avg fans / session', '4,517'], ['Peak concurrent', '5,510'],
  ];
  const card: React.CSSProperties = { background: T.surface, border: `1px solid ${T.line}`, borderRadius: 16, padding: 20 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 40px', borderBottom: `1px solid ${T.line}` }}>
        <button onClick={onBack} aria-label="Back" style={iconBtn}><Ico name="arrowL" size={18} /></button>
        <img src={A('crest.png')} alt="" style={{ width: 36, height: 36 }} />
        <div>
          <b style={{ fontSize: 18 }}>{panel.title}</b>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Stats · 2026/27 season</div>
        </div>
      </div>

      <main style={{ padding: '28px 40px 48px', maxWidth: 1200, margin: '0 auto', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 15, color: T.purpleText }}>
          <span style={{ marginTop: 2 }}><Ico name="spark" size={17} w={2} color={T.purple} /></span>
          <span>Arsenal at Home is up 18% on last month. Predictions are the busiest section after chat, and shop taps spike at half-time.</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {totals.map(([k, v]) => (
            <div key={k} style={card}><div style={{ fontSize: 12, color: T.muted }}>{k}</div><div style={{ fontSize: 28, fontWeight: 700, marginTop: 6 }}>{v}</div></div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
          <div style={card}>
            <b style={{ fontSize: 15 }}>Fans per session</b>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 180, marginTop: 20 }}>
              {SESSIONS.map((x) => (
                <div key={x.s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: '100%', maxWidth: 46, height: `${(x.fans / max) * 150}px`, borderRadius: '8px 8px 0 0', background: `linear-gradient(180deg, ${T.purple}, ${T.purple}66)` }} />
                  <span style={{ fontSize: 10, color: T.muted, textAlign: 'center' }}>{x.s.replace('v ', '')}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={card}>
            <b style={{ fontSize: 15 }}>Where fans spend time</b>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 18 }}>
              {SPEND.map(([n, p]) => (
                <div key={n}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}><span>{n}</span><span style={{ color: T.muted }}>{p}%</span></div>
                  <div style={{ height: 8, borderRadius: 4, background: T.surface2, overflow: 'hidden' }}><div style={{ width: `${p * 2.4}%`, height: '100%', background: T.purple }} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={card}>
          <b style={{ fontSize: 15 }}>Recent sessions</b>
          <div style={{ marginTop: 14 }}>
            {SESSIONS.map((x, i) => (
              <div key={x.s} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderTop: i ? `1px solid ${T.line}` : 'none', fontSize: 13 }}>
                <span style={{ flex: 2, fontWeight: 600 }}>{x.s}</span>
                <span style={{ flex: 2, color: T.muted }}>{x.d}</span>
                <span style={{ flex: 1, textAlign: 'right' }}>{x.fans.toLocaleString()} fans</span>
                <span style={{ flex: 1, textAlign: 'right', color: T.muted }}>{x.dur}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
