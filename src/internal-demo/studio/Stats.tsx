// Stats for one panel, internal-demo cut: tabbed analytics for the live v Kingsmere
// match (audience, timeline, engagement, commerce, sponsors) plus the season view.
// All placeholder data, kept consistent with the numbers the scripted tour shows
// (4,812 fans in the panel, 1,284 poll votes, 312 messages a minute).
import { useState } from 'react';
import { T, A, type Panel } from './studioData';
import { Ico } from './Ico';
import { iconBtn } from './ConnectStudio';

const SESSIONS = [
  { s: 'v Kingsmere', d: 'Today · live', fans: 4812, dur: 'Live', live: true },
  { s: 'v Brindleport', d: 'Sun 19 Oct', fans: 5240, dur: '2h 20m' },
  { s: 'v Oakhurst', d: 'Sat 11 Oct', fans: 4610, dur: '2h 05m' },
  { s: 'v Fenwick Rovers', d: 'Sat 4 Oct', fans: 3980, dur: '1h 58m' },
  { s: 'v Thornbury', d: 'Sun 28 Sep', fans: 4120, dur: '2h 02m' },
  { s: 'v Ashford Rovers', d: 'Sat 21 Sep', fans: 5510, dur: '2h 24m' },
];
const SPEND = [
  ['Fan chat', 38], ['Predictions', 24], ['Shop', 16], ['Polls', 13], ['Reads', 9],
] as const;

// Messages a minute, every 5 minutes from 30' before kick-off to full time (+ added time).
const TIMELINE = [
  42, 66, 98, 140, 172, 236, 262, 248, 286, 298, 316, 486, 352,
  298, 316, 438, 402, 264, 252, 296, 474, 340, 304, 312, 388, 452,
];
const T0 = -30; // minute of the first point
const MOMENTS = [
  { min: 0, label: 'Kick-off' },
  { min: 23, label: 'Goal · Reyes 23′' },
  { min: 45, label: 'Half-time flash sale' },
  { min: 70, label: 'Goal · Rinaldi 70′' },
  { min: 95, label: 'Full time' },
];

type Tab = 'match' | 'engagement' | 'commerce' | 'season';
const TABS: [Tab, string][] = [['match', 'This match'], ['engagement', 'Engagement'], ['commerce', 'Commerce & sponsors'], ['season', 'Season']];

const card: React.CSSProperties = { background: T.surface, border: `1px solid ${T.line}`, borderRadius: 16, padding: 20, minWidth: 0 };
const grid = (min: number): React.CSSProperties => ({ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap: 16 });

function Kpi({ k, v, sub, up }: { k: string; v: string; sub?: string; up?: boolean }) {
  return (
    <div style={{ ...card, padding: '16px 18px' }}>
      <div style={{ fontSize: 13, color: T.muted }}>{k}</div>
      <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.3 }}>{v}</div>
      {sub && <div style={{ fontSize: 12.5, marginTop: 2, color: up ? T.green : T.muted }}>{sub}</div>}
    </div>
  );
}

function Bar({ n, v, pct, max = 100 }: { n: string; v: string; pct: number; max?: number }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}><span>{n}</span><span style={{ color: T.muted, fontVariantNumeric: 'tabular-nums' }}>{v}</span></div>
      <div style={{ height: 8, borderRadius: 4, background: T.surface2, overflow: 'hidden' }}><div style={{ width: `${(pct / max) * 100}%`, height: '100%', background: T.purple, borderRadius: 4 }} /></div>
    </div>
  );
}

function Timeline() {
  const W = 760, H = 190, padL = 34, padR = 12, padT = 34, padB = 24;
  const max = 520;
  const x = (i: number) => padL + (i / (TIMELINE.length - 1)) * (W - padL - padR);
  const y = (v: number) => padT + (1 - v / max) * (H - padT - padB);
  const xMin = (m: number) => x((m - T0) / 5);
  const line = TIMELINE.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(TIMELINE.length - 1)},${H - padB} L${x(0)},${H - padB} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', marginTop: 10 }} role="img" aria-label="Messages a minute across the match">
      <defs>
        <linearGradient id="tl-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8B3DF5" stopOpacity="0.38" /><stop offset="1" stopColor="#8B3DF5" stopOpacity="0" /></linearGradient>
      </defs>
      {[0, 250, 500].map((g) => (
        <g key={g}>
          <line x1={padL} x2={W - padR} y1={y(g)} y2={y(g)} stroke="var(--cs-line)" strokeWidth="1" />
          <text x={padL - 6} y={y(g) + 4} textAnchor="end" fontSize="10.5" fill="var(--cs-muted)">{g}</text>
        </g>
      ))}
      <path d={area} fill="url(#tl-fill)" />
      <path d={line} fill="none" stroke="#8B3DF5" strokeWidth="2.2" strokeLinejoin="round" />
      {MOMENTS.map((m, i) => {
        const mx = xMin(m.min);
        const v = TIMELINE[Math.round((m.min - T0) / 5)];
        const anchor = i === MOMENTS.length - 1 ? 'end' : i === 0 ? 'middle' : 'middle';
        return (
          <g key={m.label}>
            <line x1={mx} x2={mx} y1={y(v)} y2={H - padB} stroke="var(--cs-line2)" strokeDasharray="3 3" />
            <circle cx={mx} cy={y(v)} r="4" fill="#8B3DF5" stroke="var(--cs-surface)" strokeWidth="2" />
            <text x={mx} y={y(v) - 10} textAnchor={anchor} fontSize="11" fontWeight="600" fill="var(--cs-ink)">{m.label}</text>
          </g>
        );
      })}
      {[-30, 0, 15, 30, 45, 60, 75, 90].map((m) => (
        <text key={m} x={xMin(m)} y={H - 6} textAnchor="middle" fontSize="10.5" fill="var(--cs-muted)">{m < 0 ? `${m}′` : m === 0 ? 'KO' : `${m}′`}</text>
      ))}
    </svg>
  );
}

function MatchTab() {
  return (
    <>
      <div style={grid(150)}>
        <Kpi k="Live fans now" v="4,812" sub="● In the panel right now" up />
        <Kpi k="Peak concurrent" v="5,236" sub="at Reyes' opener, 23′" />
        <Kpi k="QR scans" v="7,940" sub="77% joined the panel" up />
        <Kpi k="Avg session" v="38m" sub="+6m on last home game" up />
        <Kpi k="Returning fans" v="64%" sub="3,080 of 4,812" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2.2fr) minmax(220px, 1fr)', gap: 16 }}>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
            <b style={{ fontSize: 16 }}>Engagement across the match</b>
            <span style={{ fontSize: 12.5, color: T.muted }}>messages a minute</span>
          </div>
          <Timeline />
        </div>
        <div style={card}>
          <b style={{ fontSize: 16 }}>Where fans are</b>
          <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', marginTop: 18 }}>
            <div style={{ width: '65%', background: T.purple }} /><div style={{ width: '35%', background: '#D62086' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16, fontSize: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: T.purple }} /><span style={{ flex: 1 }}>In the Arc</span><b style={{ fontVariantNumeric: 'tabular-nums' }}>3,128</b><span style={{ color: T.muted, width: 36, textAlign: 'right' }}>65%</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#D62086' }} /><span style={{ flex: 1 }}>Remote</span><b style={{ fontVariantNumeric: 'tabular-nums' }}>1,684</b><span style={{ color: T.muted, width: 36, textAlign: 'right' }}>35%</span></div>
          </div>
          <div style={{ fontSize: 12.5, color: T.muted, marginTop: 16, lineHeight: 1.5 }}>Remote fans join from 23 countries. Top: UK, Ireland, Nigeria, USA.</div>
        </div>
      </div>
    </>
  );
}

function EngagementTab() {
  return (
    <>
      <div style={grid(150)}>
        <Kpi k="Messages / min" v="312" sub="peak 486 at 23′" />
        <Kpi k="Chat messages" v="18,450" sub="+22% on last home game" up />
        <Kpi k="Poll participation" v="27%" sub="1,284 votes of 4,812 notified" />
        <Kpi k="Predictions entered" v="3,412" sub="Pick & Win: first scorer" />
        <Kpi k="Reactions" v="41.6k" sub="⚡ 💜 🔥 most used" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        <div style={card}>
          <b style={{ fontSize: 16 }}>Moderation</b>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            <Bar n="Approved" v="1,804" pct={94} />
            <Bar n="Removed" v="116" pct={6} />
          </div>
          <div style={{ fontSize: 12.5, color: T.muted, marginTop: 14 }}>1,920 messages held for review · median 9s to approve</div>
        </div>
        <div style={card}>
          <b style={{ fontSize: 16 }}>IRIS, the AI assistant</b>
          <div style={{ display: 'flex', gap: 24, marginTop: 14 }}>
            <div><div style={{ fontSize: 24, fontWeight: 700 }}>2,190</div><div style={{ fontSize: 12.5, color: T.muted }}>questions answered</div></div>
            <div><div style={{ fontSize: 24, fontWeight: 700 }}>1.2s</div><div style={{ fontSize: 12.5, color: T.muted }}>avg answer time</div></div>
          </div>
          <div style={{ fontSize: 12.5, color: T.muted, marginTop: 14 }}>Top asks: next home game, team news, Arc food & drink</div>
        </div>
        <div style={card}>
          <b style={{ fontSize: 16 }}>Where fans spend time</b>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
            {SPEND.map(([n, p]) => <Bar key={n} n={n} v={`${p}%`} pct={p} max={40} />)}
          </div>
        </div>
      </div>
    </>
  );
}

function CommerceTab() {
  return (
    <>
      <div style={grid(150)}>
        <Kpi k="Orders" v="642" sub="+31% on last home game" up />
        <Kpi k="Revenue" v="£24,180" sub="in-panel shop" />
        <Kpi k="Avg order value" v="£37.66" />
        <Kpi k="Flash-sale conversion" v="16%" sub="312 orders from 1,950 views" up />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <div style={card}>
          <b style={{ fontSize: 16 }}>Top sellers</b>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
            <Bar n="Home shirt 26/27" v="£11,940" pct={49} max={50} />
            <Bar n="Away kit (flash sale)" v="£6,240" pct={26} max={50} />
            <Bar n="Volts scarf" v="£3,380" pct={14} max={50} />
            <Bar n="Matchday programme" v="£2,620" pct={11} max={50} />
          </div>
        </div>
        <div style={card}>
          <b style={{ fontSize: 16 }}>Sponsors</b>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 8 }}>
            {[
              { n: 'Strata · panel banner', imp: '14,820', taps: '1,038', ctr: '7.0%' },
              { n: 'Lumen Air · sponsored moment', imp: '4,812', taps: '611', ctr: '12.7%' },
            ].map((s, i) => (
              <div key={s.n} style={{ padding: '12px 0', borderTop: i ? `1px solid ${T.line}` : 'none' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{s.n}</div>
                <div style={{ display: 'flex', gap: 22, marginTop: 6, fontSize: 13, color: T.muted, fontVariantNumeric: 'tabular-nums' }}>
                  <span><b style={{ color: T.ink }}>{s.imp}</b> impressions</span>
                  <span><b style={{ color: T.ink }}>{s.taps}</b> taps</span>
                  <span><b style={{ color: T.green }}>{s.ctr}</b> tap-through</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function SeasonTab() {
  const max = Math.max(...SESSIONS.map((x) => x.fans));
  const totals: [string, string][] = [
    ['Sessions this season', '12'], ['Total fans', '54.2k'], ['Avg fans / session', '4,517'], ['Peak concurrent', '5,510'],
  ];
  return (
    <>
      <div style={grid(150)}>{totals.map(([k, v]) => <Kpi key={k} k={k} v={v} />)}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <div style={card}>
          <b style={{ fontSize: 16 }}>Fans per session</b>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 170, marginTop: 18 }}>
            {[...SESSIONS].reverse().map((x) => (
              <div key={x.s} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: '100%', maxWidth: 46, height: `${(x.fans / max) * 140}px`, borderRadius: '8px 8px 0 0', background: x.live ? T.purple : `linear-gradient(180deg, ${T.purple}, ${T.purple}66)` }} />
                <span style={{ fontSize: 11, color: T.muted, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{x.s.replace('v ', '')}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={card}>
          <b style={{ fontSize: 16 }}>Recent sessions</b>
          <div style={{ marginTop: 8 }}>
            {SESSIONS.map((x, i) => (
              <div key={x.s} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 0', borderTop: i ? `1px solid ${T.line}` : 'none', fontSize: 13.5 }}>
                <span style={{ flex: 2, fontWeight: 600, minWidth: 0 }}>{x.s}</span>
                <span style={{ flex: 2, color: x.live ? T.green : T.muted }}>{x.d}</span>
                <span style={{ flex: 1.4, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{x.fans.toLocaleString()} fans</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function Stats({ panel, onBack }: { panel: Panel; onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('match');
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 40px', borderBottom: `1px solid ${T.line}` }}>
        <button onClick={onBack} aria-label="Back" style={iconBtn}><Ico name="arrowL" size={18} /></button>
        <img src={A('crest.png')} alt="" style={{ width: 36, height: 36 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <b style={{ fontSize: 18 }}>{panel.title}</b>
          <div style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>Analytics · Voltford v Kingsmere · live</div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, color: T.green, border: '1px solid rgba(43,212,125,0.4)', borderRadius: 999, padding: '5px 12px' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.green }} />LIVE · 4,812
        </span>
      </div>

      <main style={{ padding: '20px 40px 40px', maxWidth: 1240, margin: '0 auto', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 15, color: T.purpleText }}>
          <span style={{ marginTop: 2 }}><Ico name="spark" size={17} w={2} color={T.purple} /></span>
          <span>Today's crowd is up 18% on the last home game. Both goals drove the biggest chat spikes, and the half-time flash sale converted 16% of the fans who saw it.</span>
        </div>

        <div role="tablist" style={{ display: 'flex', gap: 6, borderBottom: `1px solid ${T.line}`, overflowX: 'auto' }}>
          {TABS.map(([k, label]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
              style={{ fontFamily: 'inherit', cursor: 'pointer', background: 'transparent', border: 0, borderBottom: `2px solid ${tab === k ? T.purple : 'transparent'}`, color: tab === k ? T.ink : T.muted, fontSize: 14, fontWeight: 600, padding: '10px 14px', marginBottom: -1, whiteSpace: 'nowrap' }}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'match' && <MatchTab />}
        {tab === 'engagement' && <EngagementTab />}
        {tab === 'commerce' && <CommerceTab />}
        {tab === 'season' && <SeasonTab />}
      </main>
    </div>
  );
}
