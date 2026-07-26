// ═══════════════════════════════════════════════════════════════════════
// PanelStudio — faithful React port of the "Panel Studio Admin" handoff.
// Five surfaces (Dashboard · Create wizard · Builder · Stats · Control Room)
// in one self-contained state machine, matching the high-fidelity design.
// The Control Room's monitor renders the real fan client and its triggers/
// sessions broadcast over the ControlBus (see LiveMonitor).
// ═══════════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { s } from './s';
import { media } from '../domain/media';
import {
  MODULES, SPORTS, PHASES, PHASE_COLOR, TRIGGERS, PANELS, SESSIONS,
  PRIMARIES, ACCENTS, PACKS, clone, ring,
  type AdminPanel, type AdminSession,
} from './data';

const Ms = ({ children, size = 18, color, style }: { children: string; size?: number; color?: string; style?: CSSProperties }) => (
  <span className="ms" style={{ fontSize: size, color, ...style }}>{children}</span>
);
const modOf = (id: string) => MODULES.find((m) => m.id === id) || { id, name: id, icon: 'widgets', blurb: '' };
const sportOf = (id: string) => SPORTS.find((x) => x.id === id) || { name: '', icon: 'shield', states: '' };
const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
// The real fan panel (Matchday Companion v4) lives at /p/:id — open it for real.
const fanUrl = (id: string) => `${import.meta.env.BASE_URL}p/${id.toLowerCase()}`;
const openFan = (id: string) => window.open(fanUrl(id), '_blank', 'noopener');
// Map the studio's phases + triggers to the fan client's operator commands.
const phaseToMs = (ph: string) => (ph === 'Live' ? 'live' : ph === 'Break' ? 'ht' : ph === 'Post' ? 'ft' : 'pre');
const trigToKind: Record<string, string> = { goal: 'goal', var: 'var', sub: 'sub', yellow: 'card', react: 'goal' };

type Draft = { experience: string; sport: string; preset: number; mods: string[]; name: string; desc: string; primary: string; accent: string; sessions: AdminSession[]; editIdx: number };
interface St {
  screen: string; panels: AdminPanel[]; cur: number; step: number; draft: Draft;
  sessions: AdminSession[]; pack: string; previewIdx: number;
  shareOpen: boolean; copied: boolean; sync: string; mode: string; playing: boolean; speed: string;
  liveIdx: number; clock: number; countdown: number; log: { id: number; name: string; detail: string; icon: string; color: string; t: string }[];
  staged: number; toast: string | null; toastIcon: string; devices: number; tick: number;
}

const PRESETS = [
  { abbr: 'ETH', name: 'Etihad home', blurb: 'Full home template: seat map, to-seat ordering, terrace chat.', c1: '#6CABDD', c2: '#6CABDD', crestBg: '#6CABDD', crestFg: '#fff' },
  { abbr: 'AWY', name: 'Away day', blurb: 'Second-screen template for travelling and at-home members.', c1: '#0C3A5E', c2: '#6CABDD', crestBg: '#0C3A5E', crestFg: '#fff' },
  { abbr: 'JOI', name: 'Joie Stadium', blurb: "Women's template with its own squad feed and family stand.", c1: '#6CABDD', c2: '#6CABDD', crestBg: '#6CABDD', crestFg: '#fff' },
  { abbr: 'NEU', name: 'Neutral venue', blurb: 'Cup finals and semis: travel, no ordering, venue plan.', c1: '#201C17', c2: '#6CABDD', crestBg: '#201C17', crestFg: '#F3EEE4' },
];
const STEP_DEFS = [
  { label: 'Experience', title: 'How will fans watch?', blurb: 'This sets the live states available to the panel and how fans get in.', hint: 'Pick one to continue' },
  { label: 'Competition', title: 'Which competition?', blurb: 'The competition sets the live states, the badge treatment and which fixture feed the panel reads.', hint: 'Champions League is tonight’s flagship' },
  { label: 'Template', title: 'Start from a City template', blurb: 'Templates carry the right venue, seat map and module defaults for that kind of fixture.', hint: 'Everything stays editable afterwards' },
  { label: 'Blocks & states', title: 'Compose each state', blurb: 'Pick a match state, then choose which blocks appear in it and in what order. Pre-match, live and full-time can look completely different.', hint: 'Reorder with the arrows — top of the list is top of the screen' },
  { label: 'Details & brand', title: 'Name it and set the palette', blurb: 'The last step before you author sessions.', hint: 'Sessions come next' },
];

export function PanelStudio({ start = 'dash' }: { start?: string }) {
  const [st, setSt] = useState<St>(() => ({
    screen: start, panels: clone(PANELS), cur: 0, step: 0,
    draft: { experience: 'IN-PERSON', sport: 'ucl', preset: 0, mods: ['timeline', 'chat', 'intel', 'predict'], name: '', desc: '', primary: '#6CABDD', accent: '#6CABDD', sessions: clone(SESSIONS), editIdx: 1 },
    sessions: clone(SESSIONS), pack: 'Stadium', previewIdx: 2,
    shareOpen: false, copied: false, sync: 'live', mode: 'manual', playing: true, speed: '1×',
    liveIdx: 2, clock: 38 * 60 + 12, countdown: 0, log: [], staged: 1, toast: null, toastIcon: 'bolt', devices: 5243, tick: 0,
  }));
  const setState = (patch: Partial<St> | ((s: St) => Partial<St>)) =>
    setSt((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) }));
  const toastTimer = useRef<number | undefined>(undefined);
  const say = (msg: string, icon = 'bolt') => {
    window.clearTimeout(toastTimer.current);
    setState({ toast: msg, toastIcon: icon });
    toastTimer.current = window.setTimeout(() => setState({ toast: null }), 2200);
  };

  useEffect(() => {
    const t = window.setInterval(() => setState((s) => ({
      tick: s.tick + 1,
      clock: s.playing && s.screen === 'control' ? s.clock + (({ '1×': 1, '2×': 2, '5×': 5, '10×': 10 } as Record<string, number>)[s.speed] || 1) : s.clock,
      countdown: s.countdown > 0 ? s.countdown - 1 : 0,
      devices: s.devices + Math.round(Math.sin(s.tick / 6) * 9),
    })), 1000);
    return () => window.clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const broadcast = (t: { name: string; blurb: string; icon: string; color: string }) => {
    const stamp = fmt(st.clock);
    setState((s) => ({ log: [{ id: Date.now(), name: t.name, detail: t.blurb, icon: t.icon, color: t.color, t: stamp }, ...s.log].slice(0, 14) }));
    say(`${t.name} pushed to ${st.devices.toLocaleString()} devices`, t.icon);
  };

  return (
    <div style={s('min-height:100vh;background:#F3EEE4;color:#201C17;font-family:Archivo,-apple-system,system-ui,sans-serif')}>
      <style>{ADMIN_CSS}</style>
      {st.screen === 'dash' && <Dashboard {...{ st, setState, say, broadcast }} />}
      {st.screen === 'wizard' && <Wizard {...{ st, setState, say }} />}
      {st.screen === 'builder' && <Builder {...{ st, setState, say }} />}
      {st.screen === 'stats' && <Stats {...{ st, setState, say }} />}
      {st.screen === 'control' && <Control {...{ st, setState, say, broadcast }} />}
      {st.toast && (
        <div style={s('position:fixed;left:50%;bottom:34px;transform:translateX(-50%);z-index:80;display:flex;align-items:center;gap:10px;padding:13px 18px;border-radius:13px;background:#201C17;box-shadow:0 14px 34px -12px rgba(32,28,23,.7);animation:stRise .25s ease both')}>
          <Ms color="#6CABDD">{st.toastIcon}</Ms>
          <span style={s("font:600 13px/1 'Archivo';color:#F3EEE4")}>{st.toast}</span>
        </div>
      )}
    </div>
  );
}

type Props = { st: St; setState: (p: Partial<St> | ((s: St) => Partial<St>)) => void; say: (m: string, i?: string) => void; broadcast?: (t: { name: string; blurb: string; icon: string; color: string }) => void };

// ── phone preview (real module stack per session) ──
function Phone({ st, wizard }: { st: St; wizard: boolean }) {
  const p = st.panels[st.cur] || st.panels[0];
  const primary = wizard ? st.draft.primary : p.primary;
  const accent = wizard ? st.draft.accent : p.accent;
  const name = wizard ? st.draft.name || 'Untitled panel' : p.title;
  const club = wizard ? sportOf(st.draft.sport).name : p.club;
  const sess = wizard ? st.draft.sessions : st.sessions;
  const idx = wizard ? st.draft.editIdx : st.screen === 'control' ? st.liveIdx : st.previewIdx;
  const stack = (sess[idx] || { stack: [] }).stack;
  const phase = (sess[idx] || {}).phase || 'IDLE';
  return (
    <div style={s('width:100%;border-radius:18px;overflow:hidden;background:#F3EEE4;box-shadow:inset 0 0 0 1px rgba(32,28,23,.1)')}>
      <div style={{ ...s('padding:14px 14px 16px'), background: primary }}>
        <div style={s('display:flex;align-items:center;gap:8px')}>
          <span style={{ ...s("width:24px;height:24px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font:700 8px/1 'Archivo'"), color: primary }}>MCI</span>
          <span style={s("font:700 10.5px/1 'Archivo';color:#fff;letter-spacing:.02em")}>{club || 'Panel'}</span>
          <span style={s("margin-left:auto;font:600 8px/1 'Archivo';letter-spacing:.1em;color:#fff;background:rgba(255,255,255,.24);padding:5px 6px;border-radius:5px")}>{String(phase).toUpperCase()}</span>
        </div>
        <div style={s("font:800 22px/.94 'Archivo Black';color:#fff;margin-top:12px")}>{name}</div>
      </div>
      <div style={s('padding:12px 12px 14px;display:flex;flex-direction:column;gap:7px')}>
        <div style={s("font:600 8.5px/1 'Archivo';letter-spacing:.14em;color:#6E675A")}>MODULE STACK</div>
        {stack.length ? stack.map((id, i) => (
          <div key={id + i} style={s('display:flex;align-items:center;gap:8px;padding:9px 10px;border-radius:9px;background:#fff')}>
            <span style={s("width:16px;font:600 8.5px/1 'Archivo';color:#8C8577")}>{i + 1}</span>
            <span style={s("flex:1;font:600 10.5px/1 'Archivo';color:#201C17")}>{modOf(id).name}</span>
            <span style={{ ...s('width:6px;height:6px;border-radius:50%'), background: accent }} />
          </div>
        )) : <div style={s("padding:14px 10px;border-radius:9px;background:#fff;font:400 10px/1.4 'Archivo';color:#8C8577")}>No modules selected yet.</div>}
        <div style={s('margin-top:4px;padding:9px 10px;border-radius:9px;background:#201C17;display:flex;align-items:center;gap:7px')}>
          <span style={{ ...s('width:5px;height:5px;border-radius:50%'), background: accent }} />
          <span style={s("font:600 9px/1 'Archivo';letter-spacing:.08em;color:#F3EEE4")}>matchday.mancity.com</span>
        </div>
      </div>
    </div>
  );
}

// ── shared header back button ──
const Back = ({ onClick }: { onClick: () => void }) => (
  <button className="ah-ink" onClick={onClick} style={s("display:flex;align-items:center;gap:8px;font:600 12.5px/1 'Archivo';color:#5B5449")}>
    <Ms color="inherit">arrow_back</Ms>Studio
  </button>
);

// ════════════ DASHBOARD ════════════
function Dashboard({ st, setState, say }: Props) {
  const kpis = [
    { label: 'TOTAL PANELS', v: String(st.panels.length), unit: 'authored', icon: 'dashboard', color: '#201C17' },
    { label: 'LIVE NOW', v: String(st.panels.filter((x) => x.live).length), unit: 'broadcasting', icon: 'sensors', color: '#C0473C' },
    { label: 'COMPETITIONS', v: String(new Set(st.panels.map((x) => x.sport)).size), unit: 'covered', icon: 'emoji_events', color: '#6CABDD' },
  ];
  return (
    <div>
      <header style={s('display:flex;align-items:center;gap:18px;padding:20px 44px;background:#FFFFFF;border-bottom:1px solid rgba(32,28,23,.08)')}>
        <div style={s('display:flex;align-items:center;gap:13px')}>
          <span style={s('width:38px;height:38px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(32,28,23,.08)')}><img src={media.cityBadge} alt="Man City" style={{ width: 30, height: 30, objectFit: 'contain' }} /></span>
          <div>
            <div style={s("font:700 15.5px/1 'Archivo';letter-spacing:-.01em")}>Manchester City · Matchday Studio</div>
            <div style={s("font:500 11.5px/1 'Archivo';color:#8C8577;margin-top:5px")}>Club workspace · running on BoltOS</div>
          </div>
        </div>
        <div style={s('display:flex;align-items:center;gap:10px;margin-left:auto')}>
          <button className="ah" onClick={() => { setState({ panels: clone(PANELS), sessions: clone(SESSIONS), log: [], cur: 0, liveIdx: 2, clock: 38 * 60 + 12 }); say('Demo data restored', 'restart_alt'); }} style={s("display:flex;align-items:center;gap:7px;padding:9px 13px;border-radius:10px;font:600 12.5px/1 'Archivo';color:#5B5449;box-shadow:inset 0 0 0 1px rgba(32,28,23,.12)")}>
            <Ms size={16} color="#5B5449">restart_alt</Ms>Reset demo
          </button>
          <div style={s('display:flex;align-items:center;gap:10px;padding:6px 14px 6px 6px;border-radius:100px;background:#FAF5EB')}>
            <span style={s("width:30px;height:30px;border-radius:50%;background:#6CABDD;display:flex;align-items:center;justify-content:center;font:700 11px/1 'Archivo';color:#fff")}>SJ</span>
            <div><div style={s('font:600 12.5px/1')}>Sasha Jarrett</div><div style={s('font:500 10.5px/1;color:#8C8577;margin-top:4px')}>Studio admin</div></div>
          </div>
        </div>
      </header>

      <section style={s('padding:40px 44px 0;animation:stRise .4s ease both')}>
        <div style={s('display:flex;align-items:flex-end;gap:30px')}>
          <div style={s('flex:1;min-width:0')}>
            <div style={s("font:600 11px/1 'Archivo';letter-spacing:.16em;color:#8C8577")}>MANCHESTER CITY · CLUB WORKSPACE</div>
            <h1 style={s("font:700 40px/1.02 'Archivo';letter-spacing:-.025em;margin:14px 0 0")}>Your immersive panels</h1>
            <p style={s("font:400 15px/1.5 'Archivo';color:#5B5449;margin:10px 0 0;max-width:520px")}>{st.panels.length} panels across {new Set(st.panels.map((x) => x.sport)).size} competitions — league, cups, women’s and tour. Author each one once, then drive it live on matchday.</p>
          </div>
          <button className="ah-ink-btn" onClick={() => setState({ screen: 'wizard', step: 0 })} style={s("display:flex;align-items:center;gap:9px;padding:15px 20px;border-radius:14px;background:#201C17;font:600 13.5px/1 'Archivo';color:#F3EEE4;box-shadow:0 8px 20px -10px rgba(32,28,23,.5)")}>
            <Ms size={19} color="#F3EEE4">add</Ms>Create new panel
          </button>
        </div>
        <div style={s('display:flex;gap:20px;margin-top:24px')}>
          {kpis.map((k) => (
            <div key={k.label} style={s('flex:1;padding:18px 20px;background:#FFFFFF;border-radius:16px;box-shadow:0 1px 2px rgba(32,28,23,.05)')}>
              <div style={s('display:flex;align-items:center;gap:8px')}><Ms size={17} color={k.color}>{k.icon}</Ms><span style={s("font:600 10.5px/1 'Archivo';letter-spacing:.14em;color:#8C8577")}>{k.label}</span></div>
              <div style={s('display:flex;align-items:baseline;gap:9px;margin-top:14px')}><span style={s("font:800 34px/.9 'Archivo Black';letter-spacing:.01em")}>{k.v}</span><span style={s("font:500 12px/1 'Archivo';color:#8C8577")}>{k.unit}</span></div>
            </div>
          ))}
        </div>
      </section>

      <section style={s('padding:34px 44px 20px')}>
        <div style={s('display:flex;align-items:center;gap:10px')}>
          <span style={s("font:600 11px/1 'Archivo';letter-spacing:.16em;color:#8C8577")}>ALL PANELS</span>
          <span style={s('flex:1;height:1px;background:rgba(32,28,23,.08)')} />
        </div>
        <div style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:20px')}>
          {st.panels.map((x, i) => {
            const statusColor = x.live ? '#C0473C' : '#8C8577';
            const tags = x.mods.slice(0, 5).map((id) => modOf(id).name).concat(x.mods.length > 5 ? [`+${x.mods.length - 5} more`] : []);
            return (
              <div key={x.id} style={{ ...s('background:#FFFFFF;border-radius:18px;overflow:hidden;box-shadow:0 1px 2px rgba(32,28,23,.05);animation:stRise .4s ease both'), borderTop: `3px solid ${statusColor}` }}>
                <div style={{ ...s('position:relative;height:124px;display:flex;align-items:flex-end;padding:16px'), background: `linear-gradient(135deg,${x.primary} 0%,${x.primary}CC 55%,${x.accent} 140%)` }}>
                  <span style={s("font:800 26px/.9 'Archivo Black';letter-spacing:.01em;color:#fff")}>{x.club}</span>
                  <span style={s('position:absolute;right:14px;top:14px;display:flex;gap:7px')}>
                    <span style={s("display:flex;align-items:center;gap:6px;padding:6px 9px;border-radius:8px;background:rgba(255,255,255,.92);font:600 9.5px/1 'Archivo';letter-spacing:.1em;color:#201C17")}><Ms size={13} color="#201C17">{x.venueIcon}</Ms>{x.venue}</span>
                    <button className="ah-del" onClick={() => { setState((s2) => ({ panels: s2.panels.filter((_, j) => j !== i), cur: 0 })); say('Panel deleted', 'delete'); }} style={s('width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,.92);display:flex;align-items:center;justify-content:center')}><Ms size={15} color="#201C17">delete</Ms></button>
                  </span>
                </div>
                <div style={s('padding:17px 18px 18px')}>
                  <div style={s('display:flex;align-items:center;gap:9px')}>
                    <span style={s("font:700 16.5px/1.15 'Archivo';letter-spacing:-.012em;flex:1;min-width:0")}>{x.title}</span>
                    <span style={s("font:600 9.5px/1 'Archivo';letter-spacing:.1em;color:#5B5449;padding:6px 8px;border-radius:7px;background:#FAF5EB;white-space:nowrap")}>{x.experience}</span>
                  </div>
                  <div style={s("font:400 13px/1.45 'Archivo';color:#5B5449;margin-top:8px")}>{x.desc}</div>
                  <div style={{ ...s('display:flex;align-items:center;gap:8px;margin-top:14px;padding:10px 12px;border-radius:11px'), background: x.live ? 'rgba(192,71,60,.08)' : 'rgba(32,28,23,.05)' }}>
                    <span style={{ ...s('width:8px;height:8px;border-radius:50%'), background: statusColor, animation: x.live ? 'stPulse 2.4s ease-out infinite' : 'none' }} />
                    <span style={{ ...s("font:600 11.5px/1 'Archivo'"), color: statusColor }}>{x.live ? `Live · ${x.fans.toFixed(1)}k fans · ${x.mods.length} modules` : `Draft · ${x.mods.length} modules configured`}</span>
                  </div>
                  <div style={s('display:flex;flex-wrap:wrap;gap:5px;margin-top:14px')}>
                    {tags.map((t, j) => <span key={j} style={s("font:500 11px/1 'Archivo';color:#5B5449;padding:6px 8px;border-radius:7px;box-shadow:inset 0 0 0 1px rgba(32,28,23,.1)")}>{t}</span>)}
                  </div>
                  <div style={s("display:flex;align-items:center;gap:8px;margin-top:15px;padding-top:13px;border-top:1px solid rgba(32,28,23,.08);font:500 11px/1 'Archivo';color:#8C8577")}>
                    <Ms size={14} color="#8C8577">schedule</Ms>{x.updated}
                    <span style={s('margin-left:auto;font-variant-numeric:tabular-nums')}>{x.id}</span>
                  </div>
                  <div style={s('display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:14px')}>
                    <button className="ah-ink-btn" onClick={() => setState({ screen: 'control', cur: i })} style={s("display:flex;align-items:center;justify-content:center;gap:7px;padding:11px;border-radius:11px;background:#201C17;font:600 12px/1 'Archivo';color:#F3EEE4")}><Ms size={16} color="#F3EEE4">{x.live ? 'settings_input_antenna' : 'rocket_launch'}</Ms>{x.live ? 'Control room' : 'Go live'}</button>
                    <button className="ah" onClick={() => { openFan(x.id); say('Fan view opened in a new tab', 'smartphone'); }} style={s("display:flex;align-items:center;justify-content:center;gap:7px;padding:11px;border-radius:11px;font:600 12px/1 'Archivo';color:#201C17;box-shadow:inset 0 0 0 1px rgba(32,28,23,.14)")}><Ms size={16} color="#201C17">smartphone</Ms>Fan view</button>
                    <button className="ah" onClick={() => setState({ screen: 'builder', cur: i })} style={s("display:flex;align-items:center;justify-content:center;gap:7px;padding:11px;border-radius:11px;font:600 12px/1 'Archivo';color:#201C17;box-shadow:inset 0 0 0 1px rgba(32,28,23,.14)")}><Ms size={16} color="#201C17">tune</Ms>Settings</button>
                    <button className="ah" onClick={() => setState({ screen: 'stats', cur: i })} style={s("display:flex;align-items:center;justify-content:center;gap:7px;padding:11px;border-radius:11px;font:600 12px/1 'Archivo';color:#201C17;box-shadow:inset 0 0 0 1px rgba(32,28,23,.14)")}><Ms size={16} color="#201C17">insights</Ms>Stats</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <footer style={s("display:flex;align-items:center;gap:14px;padding:28px 44px 34px;margin-top:20px;border-top:1px solid rgba(32,28,23,.08);font:500 11.5px/1 'Archivo';color:#8C8577")}>
        <span>© 2026 Manchester City FC · BoltOS Studio licence</span><span>·</span><span>Panels served from matchday.mancity.com</span>
        <a href="#support" style={s('margin-left:auto;font-weight:600;color:#5B5449')}>studio-support@mancity.com</a>
      </footer>
    </div>
  );
}

// ════════════ WIZARD ════════════
function Wizard({ st, setState, say }: Props) {
  const d = st.draft;
  const setDraft = (patch: Partial<Draft>) => setState({ draft: { ...d, ...patch } });
  const editState = d.sessions[d.editIdx] || { name: '—', phase: 'Live', stack: [] };
  const def = STEP_DEFS[st.step];
  const nextStep = () => {
    if (st.step < 4) { setState({ step: st.step + 1 }); return; }
    const preset = PRESETS[d.preset];
    const mods = ([] as string[]).concat(...d.sessions.map((x) => x.stack)).filter((v, i, a) => a.indexOf(v) === i);
    const np: AdminPanel = { id: 'PNL-' + (4500 + st.panels.length), title: d.name || 'Untitled panel', club: sportOf(d.sport).name, abbr: 'MCI', venue: d.experience === 'IN-PERSON' ? 'HOME' : 'AWAY', venueIcon: d.experience === 'IN-PERSON' ? 'stadium' : 'flight', sport: d.sport, experience: d.experience, primary: d.primary, accent: d.accent, desc: d.desc || 'Authored in the studio, not yet deployed.', live: false, fans: 0, mods, updated: 'Updated just now' };
    void preset;
    setState((s2) => ({ panels: [np, ...s2.panels], cur: 0, screen: 'builder', sessions: clone(s2.draft.sessions), previewIdx: Math.min(1, s2.draft.sessions.length - 1) }));
    say('Panel created — author the sessions', 'check_circle');
  };
  const summary = [
    { k: 'Experience', v: d.experience === 'IN-PERSON' ? 'In-person event' : d.experience === 'VOD' ? 'VOD (on-demand)' : 'Online stream' },
    { k: 'Competition', v: sportOf(d.sport).name },
    { k: 'Template', v: PRESETS[d.preset].name },
    { k: 'Modules', v: `${d.mods.length} enabled` },
    { k: 'Palette', v: `${d.primary} · ${d.accent}` },
  ];
  return (
    <div style={s('animation:stFade .3s ease both')}>
      <header style={s('display:flex;align-items:center;gap:16px;padding:16px 44px;background:#FFFFFF;border-bottom:1px solid rgba(32,28,23,.08)')}>
        <Back onClick={() => setState({ screen: 'dash' })} />
        <span style={s('width:1px;height:22px;background:rgba(32,28,23,.12)')} />
        <span style={s("font:700 14px/1 'Archivo';letter-spacing:-.01em")}>Create a new panel</span>
        <span style={s("font:600 10px/1 'Archivo';letter-spacing:.12em;color:#8C8577;padding:6px 9px;border-radius:8px;background:#FAF5EB;margin-left:auto")}>STEP {st.step + 1} OF 5</span>
      </header>
      <div style={s('display:flex;gap:40px;padding:32px 44px 48px')}>
        <div style={s('flex:1;min-width:0')}>
          <div style={s('display:flex;align-items:center;gap:0')}>
            {STEP_DEFS.map((step, i) => {
              const done = i < st.step, cur = i === st.step;
              return (
                <div key={i} style={s('display:flex;align-items:center;gap:11px;flex:1')}>
                  <button onClick={() => setState({ step: i })} style={s('display:flex;align-items:center;gap:10px')}>
                    <span style={{ ...s("width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:600 12px/1 'Archivo'"), background: done ? '#6CABDD' : cur ? '#201C17' : '#FFFFFF', color: cur ? '#F3EEE4' : '#8C8577', boxShadow: i > st.step ? 'inset 0 0 0 1px rgba(32,28,23,.16)' : 'none' }}>
                      {done ? <Ms size={16} color="#fff">check</Ms> : cur ? i + 1 : i + 1}
                    </span>
                    <span style={{ ...s("font:600 12.5px/1 'Archivo';white-space:nowrap"), color: cur ? '#201C17' : '#8C8577' }}>{step.label}</span>
                  </button>
                  {i < 4 && <span style={s('flex:1;height:1px;background:rgba(32,28,23,.14);margin:0 6px')} />}
                </div>
              );
            })}
          </div>

          <div style={s('margin-top:30px;padding:24px;background:#FFFFFF;border-radius:18px;box-shadow:0 1px 2px rgba(32,28,23,.05);min-height:520px')}>
            <h2 style={s("font:700 26px/1.1 'Archivo';letter-spacing:-.022em;margin:0")}>{def.title}</h2>
            <p style={s("font:400 14px/1.5 'Archivo';color:#5B5449;margin:9px 0 0;max-width:560px")}>{def.blurb}</p>

            {st.step === 0 && (
              <div style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:26px')}>
                {[{ id: 'STREAM', name: 'Online Stream', icon: 'live_tv', blurb: 'Second screen alongside a broadcast.' }, { id: 'VOD', name: 'VOD (On-Demand)', icon: 'ondemand_video', blurb: 'Replays the authored session flow.' }, { id: 'IN-PERSON', name: 'In-Person Event', icon: 'stadium', blurb: 'QR at the ground, seat-aware modules.' }].map((e) => {
                  const on = d.experience === e.id;
                  return <button key={e.id} className="ah" onClick={() => setDraft({ experience: e.id })} style={{ ...s('padding:20px;border-radius:16px'), background: on ? '#FAF5EB' : '#FFFFFF', boxShadow: ring(on) }}><Ms size={26} color="#201C17">{e.icon}</Ms><div style={s("font:700 15px/1.2 'Archivo';color:#201C17;margin-top:16px")}>{e.name}</div><div style={s("font:400 12.5px/1.45 'Archivo';color:#5B5449;margin-top:6px")}>{e.blurb}</div></button>;
                })}
              </div>
            )}

            {st.step === 1 && (
              <>
                <div style={s('display:grid;grid-template-columns:repeat(5,1fr);gap:11px;margin-top:26px')}>
                  {SPORTS.map((sp) => { const on = d.sport === sp.id; return <button key={sp.id} className="ah" onClick={() => setDraft({ sport: sp.id })} style={{ ...s('padding:16px 14px;border-radius:14px;text-align:center'), background: on ? '#FAF5EB' : '#FFFFFF', boxShadow: ring(on) }}><Ms size={23} color="#201C17">{sp.icon}</Ms><div style={s("font:600 12.5px/1.2 'Archivo';color:#201C17;margin-top:11px")}>{sp.name}</div><div style={s("font:500 10px/1.2 'Archivo';color:#8C8577;margin-top:5px")}>{sp.states}</div></button>; })}
                </div>
                <div style={s('display:flex;align-items:flex-start;gap:11px;margin-top:22px;padding:15px 17px;border-radius:14px;background:#FAF5EB')}><Ms color="#6CABDD">info</Ms><div style={s("font:400 12.5px/1.5 'Archivo';color:#5B5449")}>Every football competition brings Idle · Pre · Live · Break · Post, plus goal, VAR, substitution, card and man-of-the-match triggers. Cup ties add an aggregate line; tour panels add time-zone handling.</div></div>
              </>
            )}

            {st.step === 2 && (
              <div style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:26px')}>
                {PRESETS.map((t, i) => { const on = d.preset === i; return (
                  <button key={i} className="ah" onClick={() => setDraft({ preset: i, primary: t.c1, accent: t.c2 })} style={{ ...s('padding:18px;border-radius:16px'), background: on ? '#FAF5EB' : '#FFFFFF', boxShadow: ring(on) }}>
                    <div style={s('display:flex;align-items:center;gap:11px')}><span style={{ ...s("width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:700 10.5px/1 'Archivo'"), background: t.crestBg, color: t.crestFg }}>{t.abbr}</span><span style={s("font:700 14px/1.15 'Archivo';color:#201C17;flex:1;min-width:0")}>{t.name}</span></div>
                    <div style={s('display:flex;gap:5px;margin-top:15px')}><span style={{ ...s('flex:1;height:8px;border-radius:4px'), background: t.c1 }} /><span style={{ ...s('flex:1;height:8px;border-radius:4px'), background: t.c2 }} /></div>
                    <div style={s("font:400 12px/1.45 'Archivo';color:#5B5449;margin-top:12px")}>{t.blurb}</div>
                  </button>
                ); })}
              </div>
            )}

            {st.step === 3 && (
              <>
                <div style={s('display:flex;align-items:center;gap:7px;margin-top:24px;flex-wrap:wrap')}>
                  {d.sessions.map((x, i) => { const on = d.editIdx === i; return <button key={i} onClick={() => setDraft({ editIdx: i })} style={{ ...s('display:flex;align-items:center;gap:8px;padding:11px 13px;border-radius:12px'), background: on ? '#FAF5EB' : '#FFFFFF', boxShadow: ring(on) }}><span style={{ ...s('width:7px;height:7px;border-radius:50%'), background: PHASE_COLOR[x.phase] || '#8C8577' }} /><span style={s("font:600 12.5px/1 'Archivo';color:#201C17")}>{x.name}</span><span style={{ ...s("font:600 10px/1 'Archivo'"), color: on ? '#201C17' : '#8C8577' }}>{x.stack.length}</span></button>; })}
                  <button className="ah" onClick={() => setDraft({ sessions: [...d.sessions, { name: 'New state', phase: 'Live', stack: [] }], editIdx: d.sessions.length })} style={s("display:flex;align-items:center;gap:6px;padding:11px 13px;border-radius:12px;font:600 12px/1 'Archivo';color:#5B5449;box-shadow:inset 0 0 0 1px rgba(32,28,23,.14)")}><Ms size={15} color="inherit">add</Ms>Add state</button>
                </div>
                <div style={s('display:flex;gap:20px;margin-top:18px')}>
                  <div style={s('flex:1;min-width:0;padding:18px;border-radius:14px;background:#FAF5EB')}>
                    <div style={s('display:flex;align-items:center;gap:9px')}><span style={s("font:600 10.5px/1 'Archivo';letter-spacing:.13em;color:#8C8577")}>ON SCREEN IN “{editState.name}”</span><span style={s("font:500 11px/1 'Archivo';color:#8C8577;margin-left:auto")}>Top to bottom</span></div>
                    {editState.stack.length === 0 && <div style={s("margin-top:12px;padding:16px;border-radius:12px;background:#FFFFFF;font:400 12.5px/1.5 'Archivo';color:#8C8577")}>Nothing in this state yet — add blocks from the library on the right.</div>}
                    <div style={s('display:flex;flex-direction:column;gap:7px;margin-top:12px')}>
                      {editState.stack.map((id, j) => {
                        const m = modOf(id);
                        const move = (dir: number) => setDraft({ sessions: mutSess(d.sessions, d.editIdx, (arr) => { const k = j + dir; if (k >= 0 && k < arr.length) [arr[k], arr[j]] = [arr[j], arr[k]]; }) });
                        return (
                          <div key={id + j} style={s('display:flex;align-items:center;gap:10px;padding:11px 12px;border-radius:12px;background:#FFFFFF')}>
                            <div style={s('display:flex;flex-direction:column;gap:2px')}>
                              <button className="ah2" onClick={() => move(-1)} style={s('width:22px;height:16px;border-radius:5px;background:#FAF5EB;display:flex;align-items:center;justify-content:center')}><Ms size={13} color="#5B5449">keyboard_arrow_up</Ms></button>
                              <button className="ah2" onClick={() => move(1)} style={s('width:22px;height:16px;border-radius:5px;background:#FAF5EB;display:flex;align-items:center;justify-content:center')}><Ms size={13} color="#5B5449">keyboard_arrow_down</Ms></button>
                            </div>
                            <span style={s("width:18px;font:700 11.5px/1 'Archivo';color:#8C8577;font-variant-numeric:tabular-nums")}>{j + 1}</span>
                            <Ms color="#201C17">{m.icon}</Ms>
                            <span style={s('flex:1;min-width:0')}><span style={s("display:block;font:600 13px/1.2 'Archivo';color:#201C17")}>{m.name}</span><span style={s("display:block;font:400 11px/1.3 'Archivo';color:#8C8577;margin-top:4px")}>{m.blurb}</span></span>
                            <button className="ah-del" onClick={() => setDraft({ sessions: mutSess(d.sessions, d.editIdx, (arr) => arr.splice(j, 1)) })} style={s('width:28px;height:28px;border-radius:9px;background:#FAF5EB;display:flex;align-items:center;justify-content:center')}><Ms size={15} color="#C0473C">close</Ms></button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div style={s('width:290px;flex:none;padding:18px;border-radius:16px;background:#FFFFFF;box-shadow:inset 0 0 0 1px rgba(32,28,23,.08)')}>
                    <div style={s("font:600 10.5px/1 'Archivo';letter-spacing:.13em;color:#8C8577")}>BLOCK LIBRARY</div>
                    <div style={s('display:flex;flex-direction:column;gap:6px;margin-top:12px')}>
                      {MODULES.map((m) => { const on = editState.stack.indexOf(m.id) > -1; return (
                        <button key={m.id} className="ah" onClick={() => setDraft({ sessions: mutSess(d.sessions, d.editIdx, (arr) => { const k = arr.indexOf(m.id); if (k > -1) arr.splice(k, 1); else arr.push(m.id); }) })} style={{ ...s('display:flex;align-items:center;gap:10px;padding:10px 11px;border-radius:11px'), background: on ? '#FAF5EB' : '#FFFFFF', boxShadow: ring(on) }}>
                          <Ms color={on ? '#201C17' : '#8C8577'}>{m.icon}</Ms>
                          <span style={s("flex:1;min-width:0;font:600 12.5px/1 'Archivo';color:#201C17")}>{m.name}</span>
                          <Ms size={17} color={on ? '#6CABDD' : '#8C8577'}>{on ? 'check_circle' : 'add_circle'}</Ms>
                        </button>
                      ); })}
                    </div>
                    <div style={s("font:400 11.5px/1.5 'Archivo';color:#8C8577;margin-top:13px")}>Adding a block puts it at the bottom of this state. A block can appear in as many states as you like.</div>
                  </div>
                </div>
                <div style={s("font:400 12.5px/1.5 'Archivo';color:#8C8577;margin-top:16px")}>{d.sessions.length} states · {([] as string[]).concat(...d.sessions.map((x) => x.stack)).filter((v, i, a) => a.indexOf(v) === i).length} distinct blocks in play · every state and stack stays editable in the builder, and modules can be toggled live from the control room mid-match.</div>
              </>
            )}

            {st.step === 4 && (
              <div style={s('display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:26px')}>
                <div style={s('grid-column:span 2')}><div style={s("font:600 11px/1 'Archivo';letter-spacing:.12em;color:#8C8577")}>PANEL NAME</div><input value={d.name} onChange={(e) => setDraft({ name: e.target.value })} placeholder="Etihad Matchday Companion" style={s("width:100%;margin-top:9px;padding:15px 16px;border-radius:13px;background:#FAF5EB;font:600 15px/1.2 'Archivo';color:#201C17")} /></div>
                <div style={s('grid-column:span 2')}><div style={s("font:600 11px/1 'Archivo';letter-spacing:.12em;color:#8C8577")}>DESCRIPTION</div><input value={d.desc} onChange={(e) => setDraft({ desc: e.target.value })} placeholder="What fans get when they scan the QR" style={s("width:100%;margin-top:9px;padding:15px 16px;border-radius:13px;background:#FAF5EB;font:400 14px/1.2 'Archivo';color:#201C17")} /></div>
                <div><div style={s("font:600 11px/1 'Archivo';letter-spacing:.12em;color:#8C8577")}>PRIMARY COLOUR</div><div style={s('display:flex;gap:8px;margin-top:9px')}>{PRIMARIES.map((hex) => <button key={hex} onClick={() => setDraft({ primary: hex })} style={{ ...s('flex:1;height:46px;border-radius:12px'), background: hex, boxShadow: ring(d.primary === hex) }} />)}</div><div style={s("font:500 11.5px/1 'Archivo';color:#8C8577;margin-top:9px;font-variant-numeric:tabular-nums")}>{d.primary}</div></div>
                <div><div style={s("font:600 11px/1 'Archivo';letter-spacing:.12em;color:#8C8577")}>ACCENT COLOUR</div><div style={s('display:flex;gap:8px;margin-top:9px')}>{ACCENTS.map((hex) => <button key={hex} onClick={() => setDraft({ accent: hex })} style={{ ...s('flex:1;height:46px;border-radius:12px'), background: hex, boxShadow: ring(d.accent === hex) }} />)}</div><div style={s("font:500 11.5px/1 'Archivo';color:#8C8577;margin-top:9px;font-variant-numeric:tabular-nums")}>{d.accent}</div></div>
              </div>
            )}

            <div style={s('display:flex;align-items:center;gap:10px;margin-top:34px;padding-top:22px;border-top:1px solid rgba(32,28,23,.08)')}>
              <button className="ah" onClick={() => (st.step > 0 ? setState({ step: st.step - 1 }) : setState({ screen: 'dash' }))} style={s("display:flex;align-items:center;gap:8px;padding:13px 17px;border-radius:12px;font:600 13px/1 'Archivo';color:#5B5449;box-shadow:inset 0 0 0 1px rgba(32,28,23,.14)")}><Ms size={17} color="inherit">arrow_back</Ms>Back</button>
              <span style={s("font:500 12px/1 'Archivo';color:#8C8577;margin-left:6px")}>{def.hint}</span>
              <button className="ah-ink-btn" onClick={nextStep} style={s("display:flex;align-items:center;gap:8px;padding:13px 19px;border-radius:12px;background:#201C17;font:600 13px/1 'Archivo';color:#F3EEE4;margin-left:auto")}>{st.step === 4 ? 'Build sessions' : 'Next'}<Ms size={17} color="#F3EEE4">arrow_forward</Ms></button>
            </div>
          </div>
        </div>

        <aside style={s('width:330px;flex:none')}>
          <div style={s('display:flex;align-items:center;gap:8px')}><span style={s('width:7px;height:7px;border-radius:50%;background:#6CABDD')} /><span style={s("font:600 11px/1 'Archivo';letter-spacing:.14em;color:#8C8577")}>LIVE PREVIEW</span></div>
          <div style={s('margin-top:14px;padding:14px;background:#FFFFFF;border-radius:26px;box-shadow:0 1px 2px rgba(32,28,23,.05)')}><Phone st={st} wizard /></div>
          <div style={s('margin-top:14px;padding:15px 17px;background:#FAF5EB;border-radius:14px')}>
            <div style={s("font:600 10.5px/1 'Archivo';letter-spacing:.12em;color:#8C8577")}>CONFIGURATION</div>
            <div style={s('margin-top:11px')}>{summary.map((row) => <div key={row.k} style={s('display:flex;align-items:baseline;gap:10px;padding:7px 0')}><span style={s("font:500 11.5px/1.3 'Archivo';color:#8C8577;width:86px")}>{row.k}</span><span style={s("flex:1;font:600 12.5px/1.3 'Archivo';color:#201C17")}>{row.v}</span></div>)}</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
function mutSess(sessions: AdminSession[], idx: number, fn: (stack: string[]) => void): AdminSession[] {
  const n = clone(sessions);
  fn(n[idx].stack);
  return n;
}

// ════════════ BUILDER ════════════
function Builder({ st, setState, say }: Props) {
  const p = st.panels[st.cur] || st.panels[0];
  const sess = st.sessions;
  const enabled = p.mods;
  const setPanel = (fn: (pl: AdminPanel) => void) => setState((s2) => { const n = clone(s2.panels); fn(n[s2.cur]); return { panels: n }; });
  const setSess = (fn: (ss: AdminSession[]) => void) => setState((s2) => { const n = clone(s2.sessions); fn(n); return { sessions: n }; });
  return (
    <div style={s('animation:stFade .3s ease both')}>
      <header style={s('display:flex;align-items:center;gap:16px;padding:14px 44px;background:#FFFFFF;border-bottom:1px solid rgba(32,28,23,.08);position:sticky;top:0;z-index:20')}>
        <Back onClick={() => setState({ screen: 'dash' })} />
        <span style={s('width:1px;height:22px;background:rgba(32,28,23,.12)')} />
        <div style={s('display:flex;align-items:center;gap:11px')}>
          <span style={{ ...s("width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:700 9.5px/1 'Archivo';color:#fff"), background: p.primary }}>{p.abbr}</span>
          <div><div style={s("font:700 13.5px/1 'Archivo';letter-spacing:-.01em")}>{p.title}</div><div style={s("font:500 11px/1 'Archivo';color:#8C8577;margin-top:5px")}>{sportOf(p.sport).name} · {p.experience === 'IN-PERSON' ? 'In-person' : p.experience === 'VOD' ? 'VOD' : 'Stream'}</div></div>
        </div>
        <div style={s('display:flex;align-items:center;gap:9px;margin-left:auto')}>
          <button className="ah" onClick={() => say('Draft saved', 'save')} style={s("display:flex;align-items:center;gap:7px;padding:11px 15px;border-radius:11px;font:600 12.5px/1 'Archivo';color:#201C17;box-shadow:inset 0 0 0 1px rgba(32,28,23,.14)")}><Ms size={16} color="#201C17">save</Ms>Save draft</button>
          <button className="ah-ink-btn" onClick={() => { setPanel((pl) => { pl.live = true; pl.fans = 0.4; pl.updated = 'Updated just now'; }); setState({ screen: 'control', sync: 'connecting' }); say('Panel deployed — control room open', 'rocket_launch'); window.setTimeout(() => setState({ sync: 'live' }), 1400); }} style={s("display:flex;align-items:center;gap:8px;padding:11px 16px;border-radius:11px;background:#201C17;font:600 12.5px/1 'Archivo';color:#F3EEE4")}>Save &amp; go live<Ms size={16} color="#F3EEE4">arrow_forward</Ms></button>
        </div>
      </header>

      <div style={s('display:flex;gap:34px;padding:30px 44px 52px')}>
        <div style={s('flex:1;min-width:0;display:flex;flex-direction:column;gap:20px')}>
          <Card>
            <TitleRow icon="description">Panel details</TitleRow>
            <div style={s('display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px')}>
              <div><Label>NAME</Label><input value={p.title} onChange={(e) => setPanel((pl) => { pl.title = e.target.value; })} style={s("width:100%;margin-top:8px;padding:13px 14px;border-radius:12px;background:#FAF5EB;font:600 14px/1.2 'Archivo'")} /></div>
              <div><Label>IMAGE PACK</Label><div style={s('display:flex;gap:7px;margin-top:8px')}>{PACKS.map((k) => { const on = st.pack === k; return <button key={k} onClick={() => setState({ pack: k })} style={{ ...s("flex:1;padding:13px 10px;border-radius:12px;font:600 11.5px/1 'Archivo';text-align:center"), background: on ? '#201C17' : '#FAF5EB', color: on ? '#F3EEE4' : '#5B5449', boxShadow: on ? 'none' : 'inset 0 0 0 1px rgba(32,28,23,.1)' }}>{k}</button>; })}</div></div>
              <div style={s('grid-column:span 2')}><Label>DESCRIPTION</Label><input value={p.desc} onChange={(e) => setPanel((pl) => { pl.desc = e.target.value; })} style={s("width:100%;margin-top:8px;padding:13px 14px;border-radius:12px;background:#FAF5EB;font:400 13.5px/1.2 'Archivo'")} /></div>
              <SwatchRow label="PRIMARY" value={p.primary} swatches={PRIMARIES} onPick={(hex) => setPanel((pl) => { pl.primary = hex; })} />
              <SwatchRow label="ACCENT" value={p.accent} swatches={ACCENTS} onPick={(hex) => setPanel((pl) => { pl.accent = hex; })} />
            </div>
          </Card>

          <Card>
            <div style={s('display:flex;align-items:center;gap:10px')}><Ms size={19} color="#201C17">widgets</Ms><span style={s("font:700 16px/1 'Archivo';letter-spacing:-.012em")}>Module library</span><span style={s("font:500 11.5px/1 'Archivo';color:#8C8577;margin-left:auto")}>{enabled.length} of {MODULES.length} modules enabled</span></div>
            <div style={s('display:flex;flex-wrap:wrap;gap:8px;margin-top:18px')}>
              {MODULES.map((m) => { const on = p.mods.indexOf(m.id) > -1; return (
                <button key={m.id} className="ah" onClick={() => setPanel((pl) => { const j = pl.mods.indexOf(m.id); if (j > -1) pl.mods.splice(j, 1); else pl.mods.push(m.id); })} style={{ ...s('display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:11px'), background: on ? '#FAF5EB' : '#FFFFFF', boxShadow: ring(on) }}>
                  <Ms size={17} color={on ? '#201C17' : '#8C8577'}>{m.icon}</Ms><span style={s("font:600 12.5px/1 'Archivo';color:#201C17")}>{m.name}</span><Ms size={16} color={on ? '#6CABDD' : '#8C8577'}>{on ? 'check_circle' : 'add_circle'}</Ms>
                </button>
              ); })}
            </div>
          </Card>

          <Card>
            <div style={s('display:flex;align-items:center;gap:10px')}>
              <Ms size={19} color="#201C17">list_alt</Ms>
              <div style={s('flex:1;min-width:0')}><div style={s("font:700 16px/1 'Archivo';letter-spacing:-.012em")}>Sessions</div><div style={s("font:400 12.5px/1.4 'Archivo';color:#8C8577;margin-top:6px")}>The ordered flow a fan moves through as the operator advances the match.</div></div>
              <button className="ah2" onClick={() => setSess((n) => { n.push({ name: 'New session', phase: 'Live', stack: [] }); })} style={s("display:flex;align-items:center;gap:7px;padding:11px 14px;border-radius:11px;background:#FAF5EB;font:600 12.5px/1 'Archivo';color:#201C17")}><Ms size={16} color="#201C17">add</Ms>Add session</button>
            </div>
            <div style={s('display:flex;flex-direction:column;gap:12px;margin-top:20px')}>
              {sess.map((se, i) => {
                const avail = enabled.filter((id) => se.stack.indexOf(id) < 0);
                return (
                  <div key={i} style={{ ...s('border-radius:14px;background:#FAF5EB;padding:16px 17px'), boxShadow: `inset 0 0 0 1px ${i === st.previewIdx ? '#201C17' : 'rgba(32,28,23,.08)'}` }}>
                    <div style={s('display:flex;align-items:center;gap:11px')}>
                      <div style={s('display:flex;flex-direction:column;gap:2px')}>
                        <button className="ah2" onClick={() => setSess((n) => { if (i > 0)[n[i - 1], n[i]] = [n[i], n[i - 1]]; })} style={s('width:22px;height:17px;border-radius:6px;background:#FFFFFF;display:flex;align-items:center;justify-content:center')}><Ms size={13} color="#5B5449">keyboard_arrow_up</Ms></button>
                        <button className="ah2" onClick={() => setSess((n) => { if (i < n.length - 1)[n[i + 1], n[i]] = [n[i], n[i + 1]]; })} style={s('width:22px;height:17px;border-radius:6px;background:#FFFFFF;display:flex;align-items:center;justify-content:center')}><Ms size={13} color="#5B5449">keyboard_arrow_down</Ms></button>
                      </div>
                      <span style={s("width:26px;height:26px;flex:none;border-radius:8px;background:#FFFFFF;display:flex;align-items:center;justify-content:center;font:700 12px/1 'Archivo';color:#5B5449;font-variant-numeric:tabular-nums")}>{i + 1}</span>
                      <input value={se.name} onChange={(e) => setSess((n) => { n[i].name = e.target.value; })} style={s("flex:1;min-width:0;padding:10px 12px;border-radius:10px;background:#FFFFFF;font:600 13.5px/1.2 'Archivo'")} />
                      <div style={s('display:flex;gap:4px;padding:3px;border-radius:10px;background:#FFFFFF')}>
                        {PHASES.map((ph) => { const on = se.phase === ph; return <button key={ph} onClick={() => setSess((n) => { n[i].phase = ph; })} style={{ ...s("padding:7px 9px;border-radius:8px;font:600 10.5px/1 'Archivo'"), background: on ? PHASE_COLOR[ph] : 'transparent', color: on ? '#FFFFFF' : '#8C8577' }}>{ph}</button>; })}
                      </div>
                      <button onClick={() => setSess((n) => n.forEach((y, k) => { y.def = k === i; }))} style={{ ...s("display:flex;align-items:center;gap:6px;padding:9px 11px;border-radius:10px;font:600 10.5px/1 'Archivo';white-space:nowrap"), background: se.def ? '#201C17' : '#FFFFFF', color: se.def ? '#F3EEE4' : '#8C8577' }}><Ms size={14} color={se.def ? '#F3EEE4' : '#8C8577'}>{se.def ? 'star' : 'star_outline'}</Ms>Default</button>
                      <button className="ah-del" onClick={() => setState((s2) => ({ sessions: s2.sessions.filter((_, j) => j !== i) }))} style={s('width:32px;height:32px;flex:none;border-radius:10px;background:#FFFFFF;display:flex;align-items:center;justify-content:center')}><Ms size={16} color="#C0473C">delete</Ms></button>
                    </div>
                    <div style={s('margin-top:14px;padding-top:14px;border-top:1px dashed rgba(32,28,23,.14)')}>
                      <div style={s("font:600 10px/1 'Archivo';letter-spacing:.14em;color:#8C8577")}>MODULE STACK · TOP TO BOTTOM ON SCREEN</div>
                      {se.stack.length === 0 && <div style={s("font:400 12.5px/1.5 'Archivo';color:#8C8577;margin-top:10px;padding:13px 14px;border-radius:11px;background:#FFFFFF")}>No modules yet — add them below; they stack top-to-bottom on screen.</div>}
                      <div style={s('display:flex;flex-direction:column;gap:6px;margin-top:10px')}>
                        {se.stack.map((id, j) => { const m = modOf(id); return (
                          <div key={id + j} style={s('display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:11px;background:#FFFFFF')}>
                            <div style={s('display:flex;flex-direction:column;gap:2px')}>
                              <button className="ah2" onClick={() => setSess((n) => { const a = n[i].stack; if (j > 0)[a[j - 1], a[j]] = [a[j], a[j - 1]]; })} style={s('width:20px;height:15px;border-radius:5px;background:#FAF5EB;display:flex;align-items:center;justify-content:center')}><Ms size={12} color="#5B5449">keyboard_arrow_up</Ms></button>
                              <button className="ah2" onClick={() => setSess((n) => { const a = n[i].stack; if (j < a.length - 1)[a[j + 1], a[j]] = [a[j], a[j + 1]]; })} style={s('width:20px;height:15px;border-radius:5px;background:#FAF5EB;display:flex;align-items:center;justify-content:center')}><Ms size={12} color="#5B5449">keyboard_arrow_down</Ms></button>
                            </div>
                            <span style={s("font:600 11px/1 'Archivo';color:#8C8577;width:16px;font-variant-numeric:tabular-nums")}>{j + 1}</span>
                            <Ms size={17} color="#201C17">{m.icon}</Ms><span style={s("flex:1;font:600 13px/1.2 'Archivo'")}>{m.name}</span><span style={s("font:400 11.5px/1.2 'Archivo';color:#8C8577")}>{m.blurb}</span>
                            <button className="ah-del" onClick={() => setSess((n) => { n[i].stack.splice(j, 1); })} style={s('width:26px;height:26px;border-radius:8px;background:#FAF5EB;display:flex;align-items:center;justify-content:center')}><Ms size={15} color="#C0473C">close</Ms></button>
                          </div>
                        ); })}
                      </div>
                      {avail.length > 0 && (
                        <div style={s('display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:11px')}>
                          <span style={s("font:600 10px/1 'Archivo';letter-spacing:.12em;color:#8C8577;margin-right:3px")}>ADD MODULE</span>
                          {avail.map((id) => <button key={id} className="ah-ink" onClick={() => setSess((n) => { n[i].stack.push(id); })} style={s("display:flex;align-items:center;gap:6px;padding:8px 10px;border-radius:9px;background:#FFFFFF;font:600 11.5px/1 'Archivo';color:#5B5449;box-shadow:inset 0 0 0 1px rgba(32,28,23,.1)")}><Ms size={14} color="inherit">add</Ms>{modOf(id).name}</button>)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <aside style={s('width:330px;flex:none;position:sticky;top:96px;align-self:flex-start')}>
          <div style={s('display:flex;align-items:center;gap:8px')}><span style={s('width:7px;height:7px;border-radius:50%;background:#6CABDD')} /><span style={s("font:600 11px/1 'Archivo';letter-spacing:.14em;color:#8C8577")}>FAN PREVIEW · {(sess[st.previewIdx] || {}).name || '—'}</span></div>
          <div style={s('margin-top:14px;padding:14px;background:#FFFFFF;border-radius:26px;box-shadow:0 1px 2px rgba(32,28,23,.05)')}><Phone st={st} wizard={false} /></div>
          <div style={s('display:flex;gap:7px;margin-top:12px')}>{sess.slice(0, 5).map((se, i) => { const on = st.previewIdx === i; return <button key={i} onClick={() => setState({ previewIdx: i })} style={{ ...s("flex:1;padding:9px 0;border-radius:10px;font:600 10.5px/1 'Archivo';text-align:center"), background: on ? '#201C17' : '#FFFFFF', color: on ? '#F3EEE4' : '#5B5449' }}>{se.name.split(' ')[0]}</button>; })}</div>
        </aside>
      </div>
    </div>
  );
}

// ════════════ STATS ════════════
function Stats({ st, setState }: Props) {
  const p = st.panels[st.cur] || st.panels[0];
  const kpis = [
    { label: 'ACTIVE FANS', v: '5,243', icon: 'groups', delta: '+18%', deltaIcon: 'trending_up', deltaColor: '#6CABDD' },
    { label: 'MESSAGES / MIN', v: '412', icon: 'forum', delta: '+31%', deltaIcon: 'trending_up', deltaColor: '#6CABDD' },
    { label: 'AVG. SESSION', v: '42m', icon: 'timer', delta: '+6m', deltaIcon: 'trending_up', deltaColor: '#6CABDD' },
    { label: 'XP AWARDED', v: '1.9M', icon: 'redeem', delta: '−4%', deltaIcon: 'trending_down', deltaColor: '#C0473C' },
  ];
  const engagement = p.mods.map((id, i) => ({ ...modOf(id), pct: ([92, 78, 71, 64, 58, 49, 41, 33, 27, 22, 18, 14][i] || 12) + '%', color: i === 0 ? '#201C17' : i < 3 ? '#6CABDD' : '#C9BFA9' }));
  return (
    <div style={s('animation:stFade .3s ease both')}>
      <header style={s('display:flex;align-items:center;gap:16px;padding:14px 44px;background:#FFFFFF;border-bottom:1px solid rgba(32,28,23,.08)')}>
        <Back onClick={() => setState({ screen: 'dash' })} />
        <span style={s('width:1px;height:22px;background:rgba(32,28,23,.12)')} />
        <span style={s("font:700 14px/1 'Archivo';letter-spacing:-.01em")}>{p.title} · stats</span>
        <button className="ah-ink-btn" onClick={() => setState({ screen: 'control' })} style={s("display:flex;align-items:center;gap:8px;padding:11px 16px;border-radius:11px;background:#201C17;font:600 12.5px/1 'Archivo';color:#F3EEE4;margin-left:auto")}>Launch panel<Ms size={16} color="#F3EEE4">arrow_forward</Ms></button>
      </header>
      <div style={s('padding:34px 44px 52px')}>
        <div style={s('display:flex;align-items:flex-end;gap:20px')}>
          <div style={s('flex:1')}><h1 style={s("font:700 32px/1.05 'Archivo';letter-spacing:-.022em;margin:0")}>Last event performance</h1><p style={s("font:400 14px/1.5 'Archivo';color:#5B5449;margin:9px 0 0")}>Semi-final, 2nd leg · 30 April · compared with the previous home fixture.</p></div>
          <div style={s('display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:11px;background:#FFFFFF;box-shadow:0 1px 2px rgba(32,28,23,.05)')}><Ms size={16} color="#6CABDD">check_circle</Ms><span style={s("font:600 12px/1 'Archivo';color:#5B5449")}>Panel deployed · 4h 12m of live time</span></div>
        </div>
        <div style={s('display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-top:24px')}>
          {kpis.map((k) => (
            <div key={k.label} style={s('padding:24px;background:#FFFFFF;border-radius:18px;box-shadow:0 1px 2px rgba(32,28,23,.05);animation:stRise .4s ease both')}>
              <div style={s('display:flex;align-items:center;gap:9px')}><Ms color="#8C8577">{k.icon}</Ms><span style={s("font:600 10.5px/1 'Archivo';letter-spacing:.13em;color:#8C8577")}>{k.label}</span></div>
              <div style={s("font:800 40px/.92 'Archivo Black';margin-top:16px;letter-spacing:.01em")}>{k.v}</div>
              <div style={s('display:flex;align-items:center;gap:6px;margin-top:12px')}><Ms size={15} color={k.deltaColor}>{k.deltaIcon}</Ms><span style={{ ...s("font:600 12px/1 'Archivo'"), color: k.deltaColor }}>{k.delta}</span><span style={s("font:400 11.5px/1 'Archivo';color:#8C8577")}>vs last event</span></div>
            </div>
          ))}
        </div>
        <div style={s('margin-top:26px;padding:24px;background:#FFFFFF;border-radius:18px;box-shadow:0 1px 2px rgba(32,28,23,.05)')}>
          <div style={s('display:flex;align-items:center;gap:10px')}><Ms size={19} color="#201C17">bar_chart</Ms><span style={s("font:700 16px/1 'Archivo';letter-spacing:-.012em")}>Module engagement</span><span style={s("font:400 12px/1 'Archivo';color:#8C8577;margin-left:auto")}>Share of connected fans who opened each module</span></div>
          <div style={s('margin-top:22px;display:flex;flex-direction:column;gap:16px')}>
            {engagement.map((e) => (
              <div key={e.id}>
                <div style={s('display:flex;align-items:center;gap:9px')}><Ms size={17} color="#5B5449">{e.icon}</Ms><span style={s("font:600 13px/1 'Archivo';flex:1")}>{e.name}</span><span style={s("font:700 13px/1 'Archivo';font-variant-numeric:tabular-nums")}>{e.pct}</span></div>
                <div style={s('height:10px;border-radius:6px;background:#FAF5EB;margin-top:9px;overflow:hidden')}><span style={{ ...s('display:block;height:10px;border-radius:6px;transition:width .8s cubic-bezier(.2,.8,.2,1)'), width: e.pct, background: e.color }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════ CONTROL ROOM ════════════
function Control({ st, setState, say, broadcast }: Props) {
  const p = st.panels[st.cur] || st.panels[0];
  const sess = st.sessions;
  const cur = sess[st.liveIdx] || sess[0] || { name: 'Idle', phase: 'Idle', stack: [] };
  const stripe = PHASE_COLOR[cur.phase] || '#8C8577';
  const syncMap: Record<string, { label: string; dot: string; anim: string; note: string }> = {
    local: { label: 'LOCAL ONLY', dot: '#8C8577', anim: 'none', note: 'Nothing is broadcasting yet — fans on the link will see the default session.' },
    connecting: { label: 'CONNECTING', dot: '#6CABDD', anim: 'stBlink 1s steps(1,end) infinite', note: 'Handshaking with the realtime relay. Controls stay staged until sync completes.' },
    live: { label: 'LIVE SYNC ACTIVE', dot: '#6CABDD', anim: 'stPulse 2.4s ease-out infinite', note: 'Every session jump, trigger and countdown change reaches all connected devices in under 400ms.' },
    down: { label: 'SYNC UNAVAILABLE', dot: '#C0473C', anim: 'stBlink .8s steps(1,end) infinite', note: 'Relay unreachable — actions are queued locally and will flush when the connection returns.' },
  };
  const sync = syncMap[st.sync] || syncMap.live;

  // Realtime channel to the embedded fan monitor (and any real fan device on
  // the same panel). Session jumps + triggers drive the true fan client.
  const chanRef = useRef<BroadcastChannel | null>(null);
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const ch = new BroadcastChannel('panel:' + p.id.toLowerCase());
    chanRef.current = ch;
    // Sync the freshly-loaded monitor to the current session.
    const t = window.setTimeout(() => ch.postMessage({ cmd: 'state', ms: phaseToMs((sess[st.liveIdx] || {}).phase) }), 900);
    return () => { window.clearTimeout(t); ch.close(); chanRef.current = null; };
  }, [p.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const send = (msg: { cmd: string; ms?: string; kind?: string }) => chanRef.current?.postMessage(msg);

  const qr = useMemo(() => {
    const seed = (i: number) => { const x = i % 21, y = Math.floor(i / 21); const finder = (a: number, b: number) => (a < 7 && b < 7) || (a > 13 && b < 7) || (a < 7 && b > 13); if (finder(x, y)) { const dx = x > 13 ? x - 14 : x, dy = y > 13 ? y - 14 : y; const r = Math.max(Math.abs(dx - 3), Math.abs(dy - 3)); return r === 3 || r <= 1; } return (x * 7 + y * 13 + ((x * y) % 5)) % 3 === 0; };
    return Array.from({ length: 441 }, (_, i) => (seed(i) ? '#201C17' : '#F3EEE4'));
  }, []);

  return (
    <div style={s('animation:stFade .3s ease both')}>
      <header style={s('display:flex;align-items:center;gap:16px;padding:16px 44px;background:#FFFFFF;border-bottom:1px solid rgba(32,28,23,.08);position:sticky;top:0;z-index:20')}>
        <Back onClick={() => setState({ screen: 'dash' })} />
        <span style={s('width:1px;height:22px;background:rgba(32,28,23,.12)')} />
        <div style={s('display:flex;align-items:center;gap:10px')}><span style={s('width:8px;height:8px;border-radius:50%;background:#C0473C;animation:stPulse 2s ease-out infinite')} /><span style={s("font:700 14px/1 'Archivo';letter-spacing:-.01em")}>Control Room · {p.title}</span></div>
        <span style={s("font:600 10px/1 'Archivo';letter-spacing:.12em;color:#F3EEE4;background:#201C17;padding:7px 10px;border-radius:8px")}>{p.live ? 'DEPLOYED' : 'DRAFT'}</span>
        <button className="ah" onClick={() => { openFan(p.id); say('Fan view opened in a new tab', 'smartphone'); }} style={s("display:flex;align-items:center;gap:8px;padding:11px 15px;border-radius:12px;font:600 12.5px/1 'Archivo';color:#201C17;box-shadow:inset 0 0 0 1px rgba(32,28,23,.14);margin-left:auto")}><Ms size={16} color="inherit">open_in_new</Ms>Open fan view</button>
      </header>

      <div style={s('padding:24px 44px 48px;display:flex;flex-direction:column;gap:20px')}>
        <div style={s('background:#FFFFFF;border-radius:18px;box-shadow:0 1px 2px rgba(32,28,23,.05);overflow:hidden')}>
          <button className="ah" onClick={() => setState({ shareOpen: !st.shareOpen })} style={s('display:flex;align-items:center;gap:14px;width:100%;padding:20px 24px')}>
            <Ms size={19} color="#201C17">qr_code_2</Ms><span style={s("font:700 14px/1 'Archivo'")}>Deploy &amp; share</span>
            <span style={s('display:flex;align-items:center;gap:8px;padding:7px 11px;border-radius:9px;background:#FAF5EB')}><span style={{ ...s('width:7px;height:7px;border-radius:50%'), background: sync.dot, animation: sync.anim }} /><span style={s("font:600 10.5px/1 'Archivo';letter-spacing:.08em;color:#201C17")}>{sync.label}</span></span>
            <span style={s("font:500 12px/1 'Archivo';color:#5B5449;margin-left:auto")}>{st.shareOpen ? 'Collapse to focus on live controls' : 'QR, fan link and connection'}</span>
            <Ms size={20} color="#5B5449">{st.shareOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}</Ms>
          </button>
          {st.shareOpen && (
            <div style={s('display:flex;gap:24px;padding:0 24px 24px;animation:stFade .25s ease both')}>
              <div style={s('width:150px;flex:none;padding:12px;border-radius:14px;background:#FAF5EB')}>
                <div style={{ ...s('display:grid;width:126px;height:126px'), gridTemplateColumns: 'repeat(21,1fr)' }}>{qr.map((c, i) => <span key={i} style={{ background: c }} />)}</div>
              </div>
              <div style={s('flex:1;min-width:0')}>
                <span style={s("font:600 10.5px/1 'Archivo';letter-spacing:.14em;color:#5B5449")}>FAN PANEL LINK</span>
                <div style={s('display:flex;align-items:center;gap:12px;margin-top:12px;padding:12px 14px;border-radius:12px;background:#FAF5EB')}>
                  <Ms size={16} color="#5B5449">link</Ms><span style={s("flex:1;min-width:0;font:500 13px/1 'Archivo';color:#201C17")}>matchday.mancity.com/{p.id.toLowerCase()}</span>
                  <button onClick={() => { setState({ copied: true }); say('Fan link copied', 'content_copy'); window.setTimeout(() => setState({ copied: false }), 1600); }} style={{ ...s("display:flex;align-items:center;gap:7px;padding:9px 12px;border-radius:10px;font:600 11.5px/1 'Archivo'"), background: st.copied ? '#201C17' : '#FFFFFF', color: st.copied ? '#F3EEE4' : '#201C17' }}><Ms size={15} color="inherit">{st.copied ? 'check' : 'content_copy'}</Ms>{st.copied ? 'Copied' : 'Copy'}</button>
                </div>
                <div style={s('display:flex;gap:12px;margin-top:16px')}>
                  <button className="ah-ink-btn" onClick={() => { openFan(p.id); say('Fan view opened in a new tab', 'smartphone'); }} style={s("display:flex;align-items:center;gap:8px;padding:12px 16px;border-radius:12px;background:#201C17;font:600 12.5px/1 'Archivo';color:#F3EEE4")}><Ms size={16} color="#F3EEE4">smartphone</Ms>Open fan view</button>
                  <button className="ah" onClick={() => { openFan(p.id); say('Opened a staged fan session', 'visibility'); }} style={s("display:flex;align-items:center;gap:8px;padding:12px 16px;border-radius:12px;font:600 12.5px/1 'Archivo';color:#201C17;box-shadow:inset 0 0 0 1px rgba(32,28,23,.14)")}><Ms size={16} color="inherit">visibility</Ms>Preview as a fan</button>
                </div>
                <div style={s("font:400 12.5px/1.5 'Archivo';color:#5B5449;margin-top:16px;max-width:560px")}>{sync.note}</div>
              </div>
            </div>
          )}
        </div>

        <div style={s('display:flex;gap:20px;align-items:flex-start')}>
          <div style={s('flex:1;min-width:0;display:flex;flex-direction:column;gap:20px')}>
            <div style={{ ...s('background:#FFFFFF;border-radius:18px;box-shadow:0 1px 2px rgba(32,28,23,.05);padding:24px'), borderLeft: `4px solid ${stripe}` }}>
              <div style={s('display:flex;align-items:center;gap:12px')}><span style={s('width:9px;height:9px;border-radius:50%;background:#C0473C;animation:stPulse 2s ease-out infinite')} /><span style={s("font:600 10.5px/1 'Archivo';letter-spacing:.14em;color:#5B5449")}>ON AIR</span><button className="ah-ink" onClick={() => say('Live header popped out', 'open_in_full')} style={s("display:flex;align-items:center;gap:7px;font:600 11.5px/1 'Archivo';color:#5B5449;margin-left:auto")}><Ms size={15} color="inherit">open_in_full</Ms>Pop out</button></div>
              <div style={s('display:flex;align-items:flex-end;gap:20px;margin-top:16px')}>
                <div style={s('flex:1;min-width:0')}>
                  <div style={s("font:800 38px/.94 'Archivo Black';letter-spacing:.01em")}>{cur.name}</div>
                  <div style={s('display:flex;align-items:center;gap:12px;margin-top:12px')}><span style={s('display:flex;align-items:center;gap:7px;background:#FAF5EB;padding:7px 10px;border-radius:8px')}><span style={{ ...s('width:6px;height:6px;border-radius:50%'), background: stripe }} /><span style={s("font:600 10px/1 'Archivo';letter-spacing:.12em;color:#201C17")}>{String(cur.phase).toUpperCase()}</span></span><span style={s("font:500 12px/1 'Archivo';color:#5B5449")}>{cur.stack.length} blocks on screen</span></div>
                </div>
                <div style={s('text-align:right')}><div style={s("font:800 44px/.9 'Archivo Black';font-variant-numeric:tabular-nums")}>{fmt(st.clock)}</div><div style={s("font:600 10px/1 'Archivo';letter-spacing:.12em;color:#5B5449;margin-top:12px")}>{st.playing ? 'MATCH CLOCK · RUNNING' : 'MATCH CLOCK · HELD'}</div></div>
              </div>
            </div>

            <Card>
              <span style={s("font:600 10.5px/1 'Archivo';letter-spacing:.14em;color:#5B5449")}>MODE</span>
              <div style={s('display:flex;align-items:center;gap:12px;margin-top:16px')}>
                <div style={s('display:flex;gap:4px;padding:4px;border-radius:12px;background:#FAF5EB')}>{[{ k: 'auto', name: 'Auto', icon: 'autoplay' }, { k: 'manual', name: 'Manual', icon: 'sports_esports' }].map((m) => { const on = st.mode === m.k; return <button key={m.k} onClick={() => { setState({ mode: m.k }); say(`${m.name} mode`, m.icon); }} style={{ ...s("display:flex;align-items:center;gap:7px;padding:10px 15px;border-radius:9px;font:600 12px/1 'Archivo'"), background: on ? '#FFFFFF' : 'transparent', color: on ? '#201C17' : '#5B5449' }}><Ms size={16} color="inherit">{m.icon}</Ms>{m.name}</button>; })}</div>
                <button onClick={() => { setState({ playing: !st.playing }); say(st.playing ? 'Clock held' : 'Clock running', st.playing ? 'pause' : 'play_arrow'); }} style={{ ...s("display:flex;align-items:center;gap:8px;padding:12px 16px;border-radius:12px;font:600 12.5px/1 'Archivo'"), background: st.playing ? '#FFFFFF' : '#201C17', color: st.playing ? '#201C17' : '#F3EEE4', boxShadow: st.playing ? 'inset 0 0 0 1px rgba(32,28,23,.14)' : 'none' }}><Ms size={17} color="inherit">{st.playing ? 'pause' : 'play_arrow'}</Ms>{st.playing ? 'Pause' : 'Play'}</button>
                <button className="ah" onClick={() => { setState({ clock: 0, liveIdx: 0, log: [] }); say('Panel restarted for all devices', 'restart_alt'); }} style={s("display:flex;align-items:center;gap:8px;padding:12px 16px;border-radius:12px;font:600 12.5px/1 'Archivo';color:#201C17;box-shadow:inset 0 0 0 1px rgba(32,28,23,.14)")}><Ms size={17} color="inherit">restart_alt</Ms>Restart</button>
                <div style={s('display:flex;gap:4px;padding:4px;border-radius:12px;background:#FAF5EB;margin-left:auto')}>{['1×', '2×', '5×', '10×'].map((x) => { const on = st.speed === x; return <button key={x} onClick={() => setState({ speed: x })} style={{ ...s("padding:9px 12px;border-radius:9px;font:600 11.5px/1 'Archivo';font-variant-numeric:tabular-nums"), background: on ? '#FFFFFF' : 'transparent', color: on ? '#201C17' : '#5B5449' }}>{x}</button>; })}</div>
              </div>
              <div style={s("font:400 12px/1.5 'Archivo';color:#5B5449;margin-top:16px")}>{st.mode === 'manual' ? 'Manual: nothing advances unless you advance it. Safest during a live match.' : 'Auto: sessions advance on the match clock — you can still fire events and override.'}</div>
            </Card>

            <Card>
              <div style={s('display:flex;align-items:center;gap:12px')}><span style={s("font:600 10.5px/1 'Archivo';letter-spacing:.14em;color:#5B5449")}>SESSIONS</span><span style={s("font:500 11.5px/1 'Archivo';color:#5B5449;margin-left:auto")}>Jump to any state — every fan device follows</span></div>
              <div style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px')}>
                {sess.map((se, i) => { const on = i === st.liveIdx; return (
                  <button key={i} className="ah" onClick={() => { setState({ liveIdx: i }); send({ cmd: 'state', ms: phaseToMs(se.phase) }); say(`Fans moved to “${se.name}”`, 'swap_horiz'); }} style={{ ...s('display:flex;align-items:center;gap:10px;padding:14px;border-radius:12px'), background: on ? '#FAF5EB' : '#FFFFFF', boxShadow: on ? 'inset 0 0 0 2px #201C17' : 'inset 0 0 0 1px rgba(32,28,23,.12)' }}>
                    <span style={{ ...s("width:22px;height:22px;flex:none;border-radius:7px;display:flex;align-items:center;justify-content:center;font:700 10.5px/1 'Archivo'"), background: on ? '#201C17' : '#EDE5D6', color: on ? '#F3EEE4' : '#5B5449' }}>{i + 1}</span>
                    <span style={s("flex:1;min-width:0;font:600 12.5px/1 'Archivo';color:#201C17")}>{se.name}</span>
                    <span style={{ ...s('width:7px;height:7px;border-radius:50%'), background: PHASE_COLOR[se.phase] || '#8C8577' }} />
                  </button>
                ); })}
              </div>
              <button className="ah-ink-btn" onClick={() => { const n = Math.min(st.liveIdx + 1, sess.length - 1); setState({ liveIdx: n }); send({ cmd: 'state', ms: phaseToMs((sess[n] || {}).phase) }); say(`Advanced to “${(sess[n] || {}).name}”`, 'arrow_forward'); }} style={s("display:flex;align-items:center;justify-content:center;gap:10px;width:100%;margin-top:16px;padding:16px;border-radius:12px;background:#201C17;font:700 13.5px/1 'Archivo';color:#F3EEE4")}>Advance to next session<Ms size={18} color="#F3EEE4">arrow_forward</Ms></button>
            </Card>

            <Card>
              <div style={s('display:flex;align-items:center;gap:12px')}><span style={s("font:600 10.5px/1 'Archivo';letter-spacing:.14em;color:#5B5449")}>KICKOFF COUNTDOWN</span><span style={s("font:800 34px/.9 'Archivo Black';margin-left:auto;font-variant-numeric:tabular-nums")}>{st.countdown > 0 ? fmt(st.countdown) : '—'}</span></div>
              <div style={s('display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-top:16px')}>
                {[{ n: '0:30', v: 30 }, { n: '2:00', v: 120 }, { n: '5:00', v: 300 }, { n: '15:00', v: 900 }, { n: 'Clear', v: 0 }].map((c) => { const on = st.countdown === c.v && c.v > 0; return <button key={c.n} onClick={() => { setState({ countdown: c.v }); say(c.v ? `Countdown set to ${c.n}` : 'Countdown cleared', 'timer'); }} style={{ ...s("padding:13px 0;border-radius:12px;font:600 12px/1 'Archivo';text-align:center;font-variant-numeric:tabular-nums"), background: on ? '#201C17' : '#FAF5EB', color: on ? '#F3EEE4' : '#201C17', boxShadow: on ? 'none' : 'inset 0 0 0 1px rgba(32,28,23,.1)' }}>{c.n}</button>; })}
              </div>
            </Card>

            <Card>
              <div style={s('display:flex;align-items:center;gap:12px')}><span style={s("font:600 10.5px/1 'Archivo';letter-spacing:.14em;color:#5B5449")}>TRIGGER EVENT</span><span style={s("display:flex;align-items:center;gap:7px;margin-left:auto;font:600 11.5px/1 'Archivo';color:#C0473C")}><Ms size={15} color="#C0473C">bolt</Ms>Fires instantly to {st.devices.toLocaleString()} devices</span></div>
              <div style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px')}>
                {TRIGGERS.map((t) => (
                  <button key={t.id} className="ah2" onClick={() => { broadcast?.(t); const k = trigToKind[t.id]; if (k) send({ cmd: 'event', kind: k }); }} style={s('display:flex;align-items:center;gap:12px;padding:16px;border-radius:12px;background:#FAF5EB;box-shadow:inset 0 0 0 1px rgba(32,28,23,.08)')}>
                    <Ms size={21} color={t.color}>{t.icon}</Ms>
                    <span style={s('flex:1;min-width:0')}><span style={s("display:block;font:700 13px/1.2 'Archivo';color:#201C17")}>{t.name}</span><span style={s("display:block;font:400 11px/1.3 'Archivo';color:#5B5449;margin-top:5px")}>{t.blurb}</span></span>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <aside style={s('width:376px;flex:none;position:sticky;top:96px')}>
            <div style={s('background:#FFFFFF;border-radius:18px;box-shadow:0 1px 2px rgba(32,28,23,.05);padding:24px')}>
              <div style={s('display:flex;align-items:center;gap:10px')}><span style={s('width:7px;height:7px;border-radius:50%;background:#C0473C;animation:stBlink 1.6s steps(1,end) infinite')} /><span style={s("font:600 10.5px/1 'Archivo';letter-spacing:.14em;color:#5B5449")}>LIVE MONITOR</span><span style={s("font:500 11px/1 'Archivo';color:#5B5449;margin-left:auto")}>True fan view</span></div>
              <div style={s('margin-top:16px;padding:10px;background:#100E0A;border-radius:20px')}>
                <iframe title="Live fan monitor" src={fanUrl(p.id) + '?embed=1'} style={{ width: '100%', height: 660, border: 0, borderRadius: 12, background: '#100E0A', display: 'block' }} />
              </div>
              <div style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px')}>
                <div style={s('padding:12px;border-radius:12px;background:#FAF5EB')}><div style={s("font:600 9.5px/1 'Archivo';letter-spacing:.12em;color:#5B5449")}>CONNECTED</div><div style={s("font:800 24px/.9 'Archivo Black';margin-top:10px;font-variant-numeric:tabular-nums")}>{st.devices.toLocaleString()}</div></div>
                <div style={s('padding:12px;border-radius:12px;background:#FAF5EB')}><div style={s("font:600 9.5px/1 'Archivo';letter-spacing:.12em;color:#5B5449")}>MSG / MIN</div><div style={s("font:800 24px/.9 'Archivo Black';margin-top:10px;font-variant-numeric:tabular-nums")}>{380 + (st.tick % 40)}</div></div>
                <div style={s('padding:12px;border-radius:12px;background:#FAF5EB')}><div style={s('display:flex;align-items:center;gap:6px')}><span style={s('width:6px;height:6px;border-radius:50%;background:#6CABDD')} /><span style={s("font:600 9.5px/1 'Archivo';letter-spacing:.12em;color:#5B5449")}>STAGED</span></div><div style={s("font:800 24px/.9 'Archivo Black';margin-top:10px;font-variant-numeric:tabular-nums;color:#201C17")}>{st.staged}</div></div>
              </div>
              <div style={s('margin-top:20px;padding-top:16px;border-top:1px solid rgba(32,28,23,.08)')}>
                <span style={s("font:600 10.5px/1 'Archivo';letter-spacing:.14em;color:#5B5449")}>BROADCAST LOG</span>
                <div style={s('display:flex;flex-direction:column;gap:8px;margin-top:12px;max-height:230px;overflow-y:auto')}>
                  {st.log.length === 0 && <div style={s("font:400 11.5px/1.5 'Archivo';color:#8C8577;padding:4px 0")}>Nothing pushed yet — fire an event to broadcast it to every device.</div>}
                  {st.log.map((l) => (
                    <div key={l.id} style={s('display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:12px;background:#FAF5EB;animation:stSlide .25s ease both')}>
                      <Ms size={16} color={l.color}>{l.icon}</Ms>
                      <span style={s('flex:1;min-width:0')}><span style={s("display:block;font:600 12px/1.2 'Archivo';color:#201C17")}>{l.name}</span><span style={s("display:block;font:400 10.5px/1.2 'Archivo';color:#5B5449;margin-top:5px")}>{l.detail}</span></span>
                      <span style={s("font:500 10.5px/1 'Archivo';color:#5B5449;font-variant-numeric:tabular-nums")}>{l.t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ── small shared pieces ──
const Card = ({ children }: { children: ReactNode }) => <div style={s('padding:24px;background:#FFFFFF;border-radius:18px;box-shadow:0 1px 2px rgba(32,28,23,.05)')}>{children}</div>;
const TitleRow = ({ icon, children }: { icon: string; children: ReactNode }) => <div style={s('display:flex;align-items:center;gap:10px')}><Ms size={19} color="#201C17">{icon}</Ms><span style={s("font:700 16px/1 'Archivo';letter-spacing:-.012em")}>{children}</span></div>;
const Label = ({ children }: { children: ReactNode }) => <div style={s("font:600 10.5px/1 'Archivo';letter-spacing:.12em;color:#8C8577")}>{children}</div>;
function SwatchRow({ label, value, swatches, onPick }: { label: string; value: string; swatches: string[]; onPick: (hex: string) => void }) {
  return (
    <div><Label>{label}</Label>
      <div style={s('display:flex;align-items:center;gap:10px;margin-top:8px;padding:10px 12px;border-radius:12px;background:#FAF5EB')}>
        <span style={{ ...s('width:26px;height:26px;border-radius:8px'), background: value }} /><span style={s("font:600 12.5px/1 'Archivo';font-variant-numeric:tabular-nums")}>{value}</span>
        <div style={s('display:flex;gap:5px;margin-left:auto')}>{swatches.map((hex) => <button key={hex} onClick={() => onPick(hex)} style={{ ...s('width:22px;height:22px;border-radius:7px'), background: hex, boxShadow: ring(value === hex) }} />)}</div>
      </div>
    </div>
  );
}

const ADMIN_CSS = `
@keyframes stRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes stFade{from{opacity:0}to{opacity:1}}
@keyframes stPulse{0%{box-shadow:0 0 0 0 rgba(192,71,60,.5)}70%{box-shadow:0 0 0 8px rgba(192,71,60,0)}100%{box-shadow:0 0 0 0 rgba(192,71,60,0)}}
@keyframes stBlink{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes stSlide{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
.ms{font-family:'Material Symbols Rounded';font-weight:300;font-style:normal;line-height:1;display:inline-block;-webkit-font-feature-settings:'liga';-webkit-font-smoothing:antialiased}
.ah:hover{background:#FAF5EB !important}
.ah2:hover{background:#F0E8D8 !important}
.ah-ink:hover{color:#201C17 !important}
.ah-ink-btn:hover{background:#332C24 !important}
.ah-del:hover{background:#F6DCD8 !important}
@media (prefers-reduced-motion: reduce){*{animation-duration:.001ms !important;transition-duration:.001ms !important}}
`;
