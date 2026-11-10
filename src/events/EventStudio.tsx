// ═══════════════════════════════════════════════════════════════════════
// EventStudio, the operator side of Connect Events (Aurora Nova launch).
// Same Studio language as the Voltford Control Room and Stats screens (cards,
// ON AIR header, sessions grid, trigger grid, live monitor, broadcast log), with
// event states, segments and targeted triggers. Drives EventFan over a
// BroadcastChannel and hears back from it (registrations, questions, votes,
// reactions, test-drive requests). All data is mocked.
// ═══════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { s } from '../voltford/admin/s';
import QRCode from 'qrcode';
import { BASE } from '../base';
import {
  CHANNEL, img, STATES, SEGMENTS, TARGETS, TRIGGERS, POLLS, HOTSPOTS, ANNOUNCE, SEED_QS, RESULTS, EVENTS, TEMPLATES, IRIS_PRE, IRIS_LIVE, SPEAKERS, SPONSORS, EVENT_DETAILS, RSVP_SEED, REMINDERS, MULTI_EVENT, audience,
  type Ms as MState, type Mode, type Target, type TriggerKind, type EventRec,
} from './data';

const Ms = ({ children, size = 18, color, style }: { children: string; size?: number; color?: string; style?: CSSProperties }) => (
  <span className="ms" style={{ fontSize: size, color, ...style }}>{children}</span>
);
const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
const fanUrl = `${BASE}nova/`;
const STATE_COLOR: Record<MState, string> = { before: '#8B3DF5', live: '#C0473C', break: '#331C4E', after: '#5B5449', community: '#2F7A68' };
const abs = (u: string) => (typeof window === 'undefined' ? u : new URL(u, window.location.origin).href);
// Small marker on anything mocked for the demo.
const Demo = () => <span style={s("display:inline-flex;align-items:center;gap:4px;font:600 9px/1 'Archivo';letter-spacing:.1em;color:#826E99;background:#F1F1EE;padding:4px 6px;border-radius:5px;white-space:nowrap")}><span className="ms" style={{ fontSize: 11 }}>science</span>DEMO DATA</span>;
type Draft = { template: string; name: string; format: 'In person' | 'Online' | 'Hybrid'; date: string; time: string; segments: string[]; segDraft: string };
const blankDraft = (): Draft => ({ template: 'launch', name: '', format: TEMPLATES[0].format, date: '2027-01-21', time: '19:30', segments: [...TEMPLATES[0].segments], segDraft: '' });

type Q = { id: string; text: string; who: string; where: Mode; votes: number; status: string; fresh?: boolean };
type Log = { id: number; name: string; detail: string; icon: string; color: string; t: string };
interface St {
  screen: 'home' | 'create' | 'overview' | 'plan' | 'invite' | 'welcome' | 'control' | 'results';
  sent: { id: string; title: string; target: Target; t: string; reach: number }[]; remText: string; remTitle: string; remTarget: Target; copied: boolean;
  events: EventRec[]; openId: string; draft: Draft; checkins: number;
  ms: MState; seg: number; revealed: boolean; poll: number | null;
  target: Target; ctr: { poll: number; hotspot: number; announce: number };
  tick: number; clock: number; log: Log[]; toast: string | null; toastIcon: string;
  questions: Q[]; regs: { venue: number; online: number }; drives: { showroom: string; slot: string; where: Mode; t: string }[];
  reacts: number[]; votes: number; follows: number; monitor: Mode;
}

export function EventStudio() {
  const [st, setSt] = useState<St>(() => ({
    screen: 'home', events: EVENTS, openId: 'nova', draft: blankDraft(), checkins: 0, sent: [], remTitle: REMINDERS[0].title, remText: REMINDERS[0].body, remTarget: REMINDERS[0].target, copied: false, ms: 'before', seg: 0, revealed: false, poll: null,
    target: 'all', ctr: { poll: 0, hotspot: 0, announce: 0 },
    tick: 0, clock: 0, log: [], toast: null, toastIcon: 'bolt',
    questions: SEED_QS.map((q) => ({ ...q, status: 'QUEUED' })), regs: { venue: 0, online: 0 }, drives: [],
    reacts: [0, 0, 0, 0], votes: 0, follows: 0, monitor: 'online',
  }));
  const set = (p: Partial<St> | ((x: St) => Partial<St>)) => setSt((x) => ({ ...x, ...(typeof p === 'function' ? p(x) : p) }));
  const stRef = useRef(st); stRef.current = st;
  const toastT = useRef<number | undefined>(undefined);
  const say = (msg: string, icon = 'bolt') => { window.clearTimeout(toastT.current); set({ toast: msg, toastIcon: icon }); toastT.current = window.setTimeout(() => set({ toast: null }), 2200); };
  const log = (name: string, detail: string, icon: string, color = '#8B3DF5') => set((x) => ({ log: [{ id: Date.now() + Math.random(), name, detail, icon, color, t: fmt(x.clock) }, ...x.log].slice(0, 30) }));

  useEffect(() => {
    const t = window.setInterval(() => set((x) => ({ tick: x.tick + 1, clock: x.ms === 'before' ? x.clock : x.clock + 1 })), 1000);
    return () => window.clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── channel ──
  const chan = useRef<BroadcastChannel | null>(null);
  const send = (m: Record<string, unknown>) => chan.current?.postMessage(m);
  const bus = useRef<(m: any) => void>(() => {});
  bus.current = (m) => {
    if (!m || !m.cmd) return;
    const x = stRef.current;
    const where = (w: Mode) => (w === 'venue' ? 'in venue' : 'online');
    switch (m.cmd) {
      case 'hello': send({ cmd: 'sync', ms: x.ms, seg: x.seg, revealed: x.revealed, poll: x.poll }); break;
      case 'register': set((p) => ({ regs: { ...p.regs, [m.mode]: p.regs[m.mode as Mode] + 1 } })); log('Registration', 'A fan registered ' + where(m.mode), 'how_to_reg'); break;
      case 'question': set((p) => ({ questions: [{ id: m.id, text: m.text, who: 'fan', where: m.where, votes: 1, status: 'QUEUED', fresh: true }, ...p.questions] })); log('New question', m.text, 'help'); say('New question from a fan ' + where(m.where), 'help'); break;
      case 'vote': set((p) => ({ votes: p.votes + 1 })); break;
      case 'checkin': set((p) => ({ checkins: p.checkins + 1 })); log('Checked in', 'Venue QR scanned at ' + (m.where || 'the door'), 'qr_code_scanner'); say('A fan checked in at the venue', 'qr_code_scanner'); break;
      case 'react': set((p) => { const r = p.reacts.slice(); if (m.seg >= 0) r[m.seg] += 1; return { reacts: r }; }); break;
      case 'follow': set((p) => ({ follows: p.follows + 1 })); log('New follower', 'A fan followed Aurora Motors', 'notifications_active'); break;
      case 'testdrive': set((p) => ({ drives: [{ showroom: m.showroom, slot: m.slot, where: m.where, t: fmt(p.clock) }, ...p.drives] })); log('Test drive request', m.showroom + ' · ' + m.slot, 'directions_car'); say('Test drive requested · ' + m.showroom, 'directions_car'); break;
      // The fan demo strip drives state too; mirror it so the Studio stays true.
      case 'state': mirrorState(m.ms, m.seg); if (m.from === 'fan') log('State · ' + STATES.find((y) => y.id === m.ms)?.name, 'Changed from the fan demo strip', 'swap_horiz', STATE_COLOR[m.ms as MState]); break;
      case 'segment': mirrorState('live', m.seg); if (m.from === 'fan') log('Segment · ' + SEGMENTS[m.seg].name, 'Changed from the fan demo strip', 'radio_button_checked'); break;
      case 'trigger': mirrorTrigger(m.kind, m.target, m.idx || 0); if (m.from === 'fan') log(TRIGGERS.find((y) => y.id === m.kind)?.name || m.kind, 'Fired from the fan demo strip · ' + TARGETS.find((y) => y.id === m.target)?.name, 'bolt'); break;
    }
  };
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const ch = new BroadcastChannel(CHANNEL);
    chan.current = ch;
    ch.onmessage = (e) => bus.current(e.data);
    return () => { ch.close(); chan.current = null; };
  }, []);

  const mirrorState = (ms: MState, seg?: number) => set((x) => {
    if (ms === 'before') return { ms, seg: 0, revealed: false, poll: null, clock: 0 };
    if (ms === 'live') { const g = seg ?? (x.ms === 'before' ? 0 : x.seg); return { ms, seg: g, revealed: x.revealed || g === 3 }; }
    if (ms === 'break') return { ms, poll: null };
    return { ms, revealed: true, poll: null };  // after + always-on
  });
  const mirrorTrigger = (kind: TriggerKind, _t: Target, idx: number) => set((x) => {
    if (kind === 'reveal') return { ms: 'live', seg: 2, revealed: true };
    if (kind === 'poll') return { poll: idx % POLLS.length, ctr: { ...x.ctr, poll: idx + 1 } };
    if (kind === 'hotspot') return { revealed: true, ctr: { ...x.ctr, hotspot: idx + 1 } };
    return { ctr: { ...x.ctr, announce: idx + 1 } };
  });

  // ── operator actions ──
  const goState = (ms: MState) => {
    mirrorState(ms); send({ cmd: 'state', ms });
    const name = STATES.find((y) => y.id === ms)?.name;
    log('State · ' + name, 'Every device moved to ' + name, 'swap_horiz', STATE_COLOR[ms]); say('Fans moved to ' + name, 'swap_horiz');
  };
  const goSeg = (i: number) => {
    mirrorState('live', i); send({ cmd: 'segment', seg: i });
    log('Segment · ' + SEGMENTS[i].name, 'Live segment changed on every device', 'radio_button_checked'); say('Now: ' + SEGMENTS[i].name, 'radio_button_checked');
  };
  const fire = (kind: TriggerKind) => {
    const idx = kind === 'reveal' ? 0 : st.ctr[kind];
    const tgt = TARGETS.find((y) => y.id === st.target)!;
    mirrorTrigger(kind, st.target, idx);
    send({ cmd: 'trigger', kind, target: st.target, idx });
    const t = TRIGGERS.find((y) => y.id === kind)!;
    const detail = kind === 'poll' ? POLLS[idx % POLLS.length].q : kind === 'hotspot' ? HOTSPOTS[idx % HOTSPOTS.length].name : kind === 'announce' ? ANNOUNCE[st.target][idx % 2].title : 'The reveal moment played';
    log(t.name + ' → ' + tgt.name, detail, t.icon, t.color);
    say(`${t.name} pushed to ${reach().toLocaleString()} devices`, t.icon);
  };
  const qStatus = (id: string, status: string) => {
    set((x) => ({ questions: x.questions.map((q) => (q.id === id ? { ...q, status, fresh: false } : q)) }));
    send({ cmd: 'qstatus', id, status });
    say(status === 'ON STAGE' ? 'Question put on stage' : 'Question marked answered', status === 'ON STAGE' ? 'mic' : 'check_circle');
  };

  const aud = audience(st.ms, st.seg, st.tick);
  const reach = () => (st.target === 'all' ? aud.venue + aud.online : st.target === 'venue' ? aud.venue : aud.online);
  const P = { st, set, goState, goSeg, fire, qStatus, aud, reach, say, sendReminder: () => sendReminder() };
  const inNova = ['plan', 'invite', 'welcome', 'control', 'results'].includes(st.screen);
  const sendReminder = () => {
    const id = 'rem' + Date.now();
    const r = rsvp(st);
    const reachN = st.remTarget === 'all' ? r.total : st.remTarget === 'venue' ? r.venue : r.online;
    send({ cmd: 'reminder', id, title: st.remTitle.trim() || 'Update', body: st.remText.trim(), target: st.remTarget });
    set((x) => ({ sent: [{ id, title: x.remTitle.trim() || 'Update', target: x.remTarget, t: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), reach: reachN }, ...x.sent] }));
    log('Reminder sent', (st.remTitle.trim() || 'Update') + ' → ' + reachN.toLocaleString() + ' registered', 'notifications_active');
    say('Reminder sent to ' + reachN.toLocaleString() + ' registered attendees', 'notifications_active');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F2', color: '#1B0B2D', fontFamily: 'Archivo,-apple-system,system-ui,sans-serif' }}>
      <style>{ADMIN_CSS}</style>
      <header style={s('display:flex;align-items:center;gap:16px;padding:14px 44px;background:#FFFFFF;border-bottom:1px solid rgba(27,11,45,.08);position:sticky;top:0;z-index:20')}>
        <button onClick={() => set({ screen: 'home' })} style={s('display:flex;align-items:center;gap:10px')}><span style={s('width:30px;height:30px;border-radius:9px;background:#1B0B2D;display:flex;align-items:center;justify-content:center')}><img src={img.logo} alt="" style={s('width:20px;height:20px')} /></span><span style={s("font:700 14px/1 'Archivo';letter-spacing:-.01em")}>Connect Events</span></button>
        <span style={s('width:1px;height:22px;background:rgba(27,11,45,.12)')} />
        {inNova ? (<>
          <button className="ah-ink" onClick={() => set({ screen: 'home' })} style={s("display:flex;align-items:center;gap:6px;font:500 13px/1 'Archivo';color:#513E66")}><Ms size={16} color="inherit">arrow_back</Ms>Nova launch</button>
          <div style={s('display:flex;gap:4px;padding:4px;border-radius:12px;background:#F1F1EE;margin-left:16px')}>
            {LIFECYCLE.map(([k, n, icon], i) => { const on = st.screen === k; return (
              <button key={k} onClick={() => set({ screen: k })} title={n} style={{ ...s("display:flex;align-items:center;gap:7px;padding:9px 13px;border-radius:9px;font:600 12px/1 'Archivo'"), background: on ? '#FFFFFF' : 'transparent', color: on ? '#1B0B2D' : '#513E66', boxShadow: on ? '0 1px 2px rgba(27,11,45,.08)' : 'none' }}><span style={{ ...s("width:17px;height:17px;border-radius:5px;display:flex;align-items:center;justify-content:center;font:700 9.5px/1 'Archivo'"), background: on ? '#1B0B2D' : '#E9E9E4', color: on ? '#F5F5F2' : '#513E66' }}>{i + 1}</span>{n}{void icon}</button>
            ); })}
          </div>
          <span style={{ ...s("font:600 10px/1 'Archivo';letter-spacing:.12em;color:#F5F5F2;padding:7px 10px;border-radius:8px;margin-left:auto"), background: STATE_COLOR[st.ms] }}>{st.ms === 'live' ? 'LIVE · ' + SEGMENTS[st.seg].short : st.ms === 'community' ? 'ALWAYS ON' : st.ms.toUpperCase()}</span>
          <button className="ah" onClick={() => { window.open(fanUrl, '_blank', 'noopener'); say('Fan view opened in a new tab', 'smartphone'); }} style={s("display:flex;align-items:center;gap:8px;padding:11px 15px;border-radius:12px;font:600 12.5px/1 'Archivo';color:#1B0B2D;box-shadow:inset 0 0 0 1px rgba(27,11,45,.14)")}><Ms size={16} color="inherit">open_in_new</Ms>Open fan view</button>
        </>) : <span style={s("font:500 13px/1 'Archivo';color:#513E66")}>Aurora Motors</span>}
      </header>
      {st.screen === 'home' && <EventsHome {...P} />}
      {st.screen === 'create' && <CreateEvent {...P} />}
      {st.screen === 'overview' && <Overview {...P} />}
      {st.screen === 'plan' && <Plan {...P} />}
      {st.screen === 'invite' && <Invite {...P} />}
      {st.screen === 'welcome' && <Welcome {...P} />}
      {st.screen === 'control' && <Control {...P} />}
      {st.screen === 'results' && <Results {...P} />}
      {st.toast && (
        <div style={s('position:fixed;left:50%;bottom:34px;transform:translateX(-50%);z-index:80;display:flex;align-items:center;gap:10px;padding:13px 18px;border-radius:13px;background:#1B0B2D;box-shadow:0 14px 34px -12px rgba(27,11,45,.7);animation:stRise .25s ease both')}>
          <Ms color="#8B3DF5">{st.toastIcon}</Ms>
          <span style={s("font:600 13px/1 'Archivo';color:#F5F5F2")}>{st.toast}</span>
        </div>
      )}
    </div>
  );
}

const Card = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => <div style={{ ...s('padding:24px;background:#FFFFFF;border-radius:18px;box-shadow:0 1px 2px rgba(27,11,45,.05)'), ...style }}>{children}</div>;
const Cap = ({ children }: { children: ReactNode }) => <span style={s("font:600 10.5px/1 'Archivo';letter-spacing:.14em;color:#513E66")}>{children}</span>;
const Note = ({ children }: { children: ReactNode }) => <span style={s("font:500 11.5px/1 'Archivo';color:#513E66;margin-left:auto")}>{children}</span>;

// ════════════ CONTROL ROOM ════════════
function Control({ st, set, goState, goSeg, fire, qStatus, aud, reach }: any) {
  const stripe = STATE_COLOR[st.ms as MState];
  const cd = Math.max(3 * 3600 + 14 * 60 + 54 - st.tick, 0);
  const onAir = st.ms === 'live' ? SEGMENTS[st.seg].name : st.ms === 'before' ? 'Before the show' : st.ms === 'break' ? 'Break' : st.ms === 'after' ? 'After the show' : 'Always-on community';
  const sub = st.ms === 'before' ? 'Reveal in ' + [Math.floor(cd / 3600), Math.floor(cd / 60) % 60, cd % 60].map((n) => String(n).padStart(2, '0')).join(':') : st.ms === 'live' ? (st.revealed ? 'The Nova is revealed' : 'Car under cover') : st.ms === 'break' ? 'Quick poll and design notes on screen' : st.ms === 'after' ? 'Recap, test drives and follow' : 'Chat, IRIS, replay and next-event sign-up stay open';
  const total = aud.venue + aud.online;
  const nextOf = (k: TriggerKind) => k === 'poll' ? POLLS[st.ctr.poll % POLLS.length].q : k === 'hotspot' ? HOTSPOTS[st.ctr.hotspot % HOTSPOTS.length].name : k === 'announce' ? ANNOUNCE[st.target as Target][st.ctr.announce % 2].title : st.revealed ? 'Replay the reveal moment' : 'Uncover the Nova on every screen';
  const qs = [...st.questions].sort((a: Q, b: Q) => (b.fresh ? 1 : 0) - (a.fresh ? 1 : 0) || b.votes - a.votes);
  return (
    <div style={s('padding:24px 44px 48px;display:flex;gap:20px;align-items:flex-start;animation:stFade .3s ease both')}>
      <div style={s('flex:1;min-width:0;display:flex;flex-direction:column;gap:20px')}>
        <div style={{ ...s('background:#FFFFFF;border-radius:18px;box-shadow:0 1px 2px rgba(27,11,45,.05);padding:24px'), borderLeft: `4px solid ${stripe}` }}>
          <div style={s('display:flex;align-items:center;gap:12px')}><span style={{ ...s('width:9px;height:9px;border-radius:50%'), background: st.ms === 'live' ? '#C0473C' : '#826E99', animation: st.ms === 'live' ? 'stPulse 2s ease-out infinite' : 'none' }} /><Cap>ON AIR</Cap><Note>{total.toLocaleString()} devices connected</Note></div>
          <div style={s('display:flex;align-items:flex-end;gap:20px;margin-top:16px')}>
            <div style={s('flex:1;min-width:0')}>
              <div style={s("font:800 38px/.94 'Archivo Black';letter-spacing:.01em")}>{onAir}</div>
              <div style={s('display:flex;align-items:center;gap:12px;margin-top:12px')}><span style={s('display:flex;align-items:center;gap:7px;background:#F1F1EE;padding:7px 10px;border-radius:8px')}><span style={{ ...s('width:6px;height:6px;border-radius:50%'), background: stripe }} /><span style={s("font:600 10px/1 'Archivo';letter-spacing:.12em;color:#1B0B2D")}>{st.ms.toUpperCase()}</span></span><span style={s("font:500 12px/1 'Archivo';color:#513E66")}>{sub}</span></div>
            </div>
            <div style={s('text-align:right')}><div style={s("font:800 44px/.9 'Archivo Black';font-variant-numeric:tabular-nums")}>{fmt(st.clock)}</div><div style={s("font:600 10px/1 'Archivo';letter-spacing:.12em;color:#513E66;margin-top:12px")}>{st.ms === 'before' ? 'EVENT CLOCK · NOT STARTED' : 'EVENT CLOCK · RUNNING'}</div></div>
          </div>
        </div>

        <Card>
          <div style={s('display:flex;align-items:center;gap:12px')}><Cap>STATE</Cap><Note>Every fan device follows</Note></div>
          <div style={s('display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-top:16px')}>
            {STATES.map((x, i) => { const on = st.ms === x.id; return (
              <button key={x.id} className="ah" onClick={() => goState(x.id)} style={{ ...s('display:flex;align-items:center;gap:8px;padding:14px 10px;border-radius:12px;min-width:0'), background: on ? '#F1F1EE' : '#FFFFFF', boxShadow: on ? 'inset 0 0 0 2px #1B0B2D' : 'inset 0 0 0 1px rgba(27,11,45,.12)' }}>
                <span style={{ ...s("width:22px;height:22px;flex:none;border-radius:7px;display:flex;align-items:center;justify-content:center;font:700 10.5px/1 'Archivo'"), background: on ? '#1B0B2D' : '#E9E9E4', color: on ? '#F5F5F2' : '#513E66' }}>{i + 1}</span>
                <span style={s("flex:1;min-width:0;font:600 12.5px/1 'Archivo';color:#1B0B2D;text-align:left")}>{x.name}</span>
                <span style={{ ...s('width:7px;height:7px;border-radius:50%'), background: STATE_COLOR[x.id] }} />
              </button>
            ); })}
          </div>
        </Card>

        <Card style={{ opacity: st.ms === 'live' ? 1 : 0.92 }}>
          <div style={s('display:flex;align-items:center;gap:12px')}><Cap>LIVE SEGMENTS</Cap><Note>{st.ms === 'live' ? 'Jump to any segment' : 'Choosing a segment takes the event live'}</Note></div>
          <div style={s('display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:16px')}>
            {SEGMENTS.map((g, i) => { const on = st.ms === 'live' && st.seg === i; return (
              <button key={g.id} className="ah" onClick={() => goSeg(i)} style={{ ...s('display:flex;flex-direction:column;align-items:flex-start;gap:8px;padding:14px;border-radius:12px;text-align:left'), background: on ? '#F1F1EE' : '#FFFFFF', boxShadow: on ? 'inset 0 0 0 2px #C0473C' : 'inset 0 0 0 1px rgba(27,11,45,.12)' }}>
                <span style={s("font:600 10px/1 'Archivo';letter-spacing:.1em;color:#826E99;font-variant-numeric:tabular-nums")}>{g.time}</span>
                <span style={s('display:flex;align-items:center;gap:7px;width:100%')}><span style={s("flex:1;font:700 13.5px/1 'Archivo';color:#1B0B2D")}>{g.name}</span>{on && <span style={s('width:7px;height:7px;border-radius:50%;background:#C0473C;animation:stBlink 1.4s steps(1,end) infinite')} />}</span>
              </button>
            ); })}
          </div>
          <button className="ah-ink-btn" onClick={() => goSeg(st.ms === 'live' ? Math.min(st.seg + 1, 3) : 0)} style={s("display:flex;align-items:center;justify-content:center;gap:10px;width:100%;margin-top:16px;padding:16px;border-radius:12px;background:#1B0B2D;font:700 13.5px/1 'Archivo';color:#F5F5F2")}>{st.ms !== 'live' ? 'Go live · Doors open' : st.seg < 3 ? 'Advance to ' + SEGMENTS[st.seg + 1].name : 'On the last segment'}<Ms size={18} color="#F5F5F2">arrow_forward</Ms></button>
        </Card>

        <Card>
          <div style={s('display:flex;align-items:center;gap:12px')}><Cap>TRIGGER</Cap><span style={s("display:flex;align-items:center;gap:7px;margin-left:auto;font:600 11.5px/1 'Archivo';color:#C0473C")}><Ms size={15} color="#C0473C">bolt</Ms>Fires instantly to {reach().toLocaleString()} devices</span></div>
          <div style={s('display:flex;align-items:center;gap:14px;margin-top:16px')}>
            <span style={s("font:600 12px/1 'Archivo';color:#513E66")}>Target</span>
            <div style={s('display:flex;gap:4px;padding:4px;border-radius:12px;background:#F1F1EE')}>
              {TARGETS.map((t) => { const on = st.target === t.id; return (
                <button key={t.id} onClick={() => set({ target: t.id })} style={{ ...s("display:flex;align-items:center;gap:7px;padding:10px 15px;border-radius:9px;font:600 12px/1 'Archivo'"), background: on ? '#FFFFFF' : 'transparent', color: on ? '#1B0B2D' : '#513E66', boxShadow: on ? '0 1px 2px rgba(27,11,45,.08)' : 'none' }}><Ms size={16} color="inherit">{t.icon}</Ms>{t.name}</button>
              ); })}
            </div>
          </div>
          <div style={s('display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:16px')}>
            {TRIGGERS.map((t) => (
              <button key={t.id} className="ah2" onClick={() => fire(t.id)} style={s('display:flex;flex-direction:column;align-items:flex-start;gap:10px;padding:16px;border-radius:12px;background:#F1F1EE;box-shadow:inset 0 0 0 1px rgba(27,11,45,.08);text-align:left')}>
                <Ms size={22} color={t.color}>{t.icon}</Ms>
                <span><span style={s("display:block;font:700 13.5px/1.2 'Archivo';color:#1B0B2D")}>{t.name}</span><span style={s("display:block;font:400 11px/1.35 'Archivo';color:#513E66;margin-top:5px")}>{nextOf(t.id)}</span></span>
              </button>
            ))}
          </div>
        </Card>

        <StreamCard />

        <Card>
          <div style={s('display:flex;align-items:center;gap:12px')}><Cap>INCOMING QUESTIONS</Cap><Demo /><Note>{st.questions.length} in the queue · sorted by upvotes</Note></div>
          <div style={s('display:flex;flex-direction:column;gap:8px;margin-top:16px;max-height:420px;overflow-y:auto')}>
            {qs.map((q: Q) => (
              <div key={q.id} style={{ ...s('display:flex;align-items:center;gap:14px;padding:13px 14px;border-radius:12px;animation:stSlide .25s ease both'), background: q.fresh ? '#F3ECFE' : '#F1F1EE', opacity: q.status === 'ANSWERED' ? 0.55 : 1 }}>
                <span style={s('width:46px;flex:none;text-align:center')}><span style={s("display:block;font:800 18px/1 'Archivo Black';font-variant-numeric:tabular-nums")}>{q.votes}</span><span style={s("display:block;font:600 8.5px/1 'Archivo';letter-spacing:.12em;color:#826E99;margin-top:4px")}>VOTES</span></span>
                <span style={s('flex:1;min-width:0')}>
                  <span style={s("display:block;font:600 13.5px/1.35 'Archivo'")}>{q.text}</span>
                  <span style={s('display:flex;align-items:center;gap:8px;margin-top:6px')}>
                    <span style={s("display:flex;align-items:center;gap:4px;font:600 10.5px/1 'Archivo';color:#513E66")}><Ms size={13} color="#826E99">{q.where === 'venue' ? 'location_on' : 'wifi'}</Ms>{q.where === 'venue' ? 'In venue' : 'Online'} · {q.who}</span>
                    {q.fresh && <span style={s("font:700 9px/1 'Archivo';letter-spacing:.1em;color:#fff;background:#8B3DF5;padding:4px 6px;border-radius:5px")}>NEW</span>}
                    {q.status !== 'QUEUED' && <span style={s("font:700 9px/1 'Archivo';letter-spacing:.1em;color:#F5F5F2;background:#1B0B2D;padding:4px 6px;border-radius:5px")}>{q.status}</span>}
                  </span>
                </span>
                {q.status === 'QUEUED' && <button className="ah" onClick={() => qStatus(q.id, 'ON STAGE')} style={s("display:flex;align-items:center;gap:6px;padding:9px 12px;border-radius:10px;font:600 11.5px/1 'Archivo';background:#FFFFFF;box-shadow:inset 0 0 0 1px rgba(27,11,45,.14)")}><Ms size={15} color="inherit">mic</Ms>Put on stage</button>}
                {q.status === 'ON STAGE' && <button className="ah-ink-btn" onClick={() => qStatus(q.id, 'ANSWERED')} style={s("display:flex;align-items:center;gap:6px;padding:9px 12px;border-radius:10px;font:600 11.5px/1 'Archivo';background:#1B0B2D;color:#F5F5F2")}><Ms size={15} color="#F5F5F2">check</Ms>Answered</button>}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <aside style={s('width:376px;flex:none;position:sticky;top:86px;display:flex;flex-direction:column;gap:20px')}>
        <Card>
          <div style={s('display:flex;align-items:center;gap:10px')}><Cap>AUDIENCE</Cap><Demo /><Note>Live now</Note></div>
          <div style={s('display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px')}>
            {[['location_on', 'IN VENUE', aud.venue, st.regs.venue], ['wifi', 'ONLINE', aud.online, st.regs.online]].map(([icon, l, v, r]) => (
              <div key={l as string} style={s('padding:14px;border-radius:12px;background:#F1F1EE')}>
                <div style={s('display:flex;align-items:center;gap:6px')}><Ms size={15} color="#8B3DF5">{icon as string}</Ms><span style={s("font:600 9.5px/1 'Archivo';letter-spacing:.12em;color:#513E66")}>{l}</span></div>
                <div style={s("font:800 28px/.9 'Archivo Black';margin-top:10px;font-variant-numeric:tabular-nums")}>{(v as number).toLocaleString()}</div>
                <div style={s("font:500 10.5px/1 'Archivo';color:#826E99;margin-top:8px")}>{(r as number) > 0 ? '+' + r + ' registered here' : ' '}</div>
              </div>
            ))}
          </div>
          <div style={s('display:flex;height:8px;border-radius:5px;overflow:hidden;margin-top:14px;background:#F1F1EE')}>
            <span style={{ ...s('display:block;background:#1B0B2D;transition:width .6s ease'), width: (total ? (aud.venue / total) * 100 : 0) + '%' }} />
            <span style={s('display:block;flex:1;background:#8B3DF5')} />
          </div>
          <div style={s("display:flex;justify-content:space-between;font:500 10.5px/1 'Archivo';color:#513E66;margin-top:8px")}><span>{total ? Math.round((aud.venue / total) * 100) : 0}% in the hall</span><span>{total ? Math.round((aud.online / total) * 100) : 100}% online</span></div>
        </Card>
        <Card>
          <div style={s('display:flex;align-items:center;gap:10px')}><span style={s('width:7px;height:7px;border-radius:50%;background:#C0473C;animation:stBlink 1.6s steps(1,end) infinite')} /><Cap>LIVE MONITOR</Cap>
            <div style={s('display:flex;gap:3px;padding:3px;border-radius:9px;background:#F1F1EE;margin-left:auto')}>
              {(['online', 'venue'] as Mode[]).map((m) => { const on = st.monitor === m; return <button key={m} onClick={() => set({ monitor: m })} style={{ ...s("padding:6px 9px;border-radius:7px;font:600 10.5px/1 'Archivo'"), background: on ? '#FFFFFF' : 'transparent', color: on ? '#1B0B2D' : '#513E66' }}>{m === 'online' ? 'Online fan' : 'In-venue fan'}</button>; })}
            </div>
          </div>
          <div style={s('margin-top:16px;padding:10px;background:#100E0A;border-radius:20px')}>
            <iframe key={st.monitor} title="Live fan monitor" src={fanUrl + '?embed=1&theme=dark&mode=' + st.monitor} style={{ width: '100%', height: 640, border: 0, borderRadius: 12, background: '#100E0A', display: 'block' }} />
          </div>
        </Card>
        <IrisFacts />
        <Card>
          <Cap>BROADCAST LOG</Cap>
          <div style={s('display:flex;flex-direction:column;gap:8px;margin-top:12px;max-height:260px;overflow-y:auto')}>
            {st.log.length === 0 && <div style={s("font:400 11.5px/1.5 'Archivo';color:#826E99;padding:4px 0")}>Nothing yet. Change state or fire a trigger, and fan actions (questions, test drives) land here too.</div>}
            {st.log.map((l: Log) => (
              <div key={l.id} style={s('display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:12px;background:#F1F1EE;animation:stSlide .25s ease both')}>
                <Ms size={16} color={l.color}>{l.icon}</Ms>
                <span style={s('flex:1;min-width:0')}><span style={s("display:block;font:600 12px/1.2 'Archivo'")}>{l.name}</span><span style={s("display:block;font:400 10.5px/1.25 'Archivo';color:#513E66;margin-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap")}>{l.detail}</span></span>
                <span style={s("font:500 10.5px/1 'Archivo';color:#513E66;font-variant-numeric:tabular-nums")}>{l.t}</span>
              </div>
            ))}
          </div>
        </Card>
      </aside>
    </div>
  );
}

// ════════════ RESULTS ════════════
function Results({ st }: any) {
  const R = RESULTS;
  const liveQs = st.questions.filter((q: Q) => q.fresh !== undefined).length;
  const reacts = R.reactions + st.reacts.reduce((a: number, b: number) => a + b, 0);
  const drivesN = R.testDrives + st.drives.length;
  const r = rsvp(st);
  const checked = checkedIn(st);
  const rate = Math.round((checked / r.venue) * 100);
  const kpis2 = [
    { label: 'REGISTRATIONS', v: r.total.toLocaleString(), icon: 'how_to_reg', sub: `${r.venue.toLocaleString()} for the hall · ${r.online.toLocaleString()} online` },
    { label: 'CHECK-IN RATE', v: rate + '%', icon: 'qr_code_scanner', sub: `${checked.toLocaleString()} of ${r.venue.toLocaleString()} hall registrations` },
    { label: 'JOINED MORE THAN ONE EVENT', v: (MULTI_EVENT.total + (st.checkins ? 1 : 0)).toLocaleString(), icon: 'repeat', sub: Math.round((MULTI_EVENT.total / (R.venuePeak + R.onlinePeak)) * 100) + '% of tonight’s attendees' },
  ];
  const kpis = [
    { label: 'ATTENDANCE', v: (R.venuePeak + R.onlinePeak).toLocaleString(), icon: 'groups', sub: `${R.venuePeak.toLocaleString()} in venue · ${R.onlinePeak.toLocaleString()} online` },
    { label: 'REACTIONS', v: (reacts / 1000).toFixed(1) + 'k', icon: 'favorite', sub: '61% during the reveal' },
    { label: 'QUESTIONS', v: String(R.questions + liveQs), icon: 'help', sub: '23 answered on stage' },
    { label: 'TEST DRIVE REQUESTS', v: String(drivesN), icon: 'directions_car', sub: (drivesN / ((R.venuePeak + R.onlinePeak) / 100)).toFixed(1) + '% of attendees' },
  ];
  const segBars = R.engagement.map((e, i) => ({ ...e, pct: Math.min(99, e.pct + (i < 4 ? Math.min(6, st.reacts[i]) : 0)) }));
  const topQs = [...st.questions].sort((a: Q, b: Q) => b.votes - a.votes).slice(0, 5);
  const byRoom = R.drives.map((d) => ({ ...d, n: d.n + st.drives.filter((x: any) => x.showroom === d.name).length }));
  const maxRoom = Math.max(...byRoom.map((d) => d.n));
  return (
    <div style={s('padding:34px 44px 52px;animation:stFade .3s ease both')}>
      <div style={s('display:flex;align-items:flex-end;gap:20px')}>
        <div style={s('flex:1')}><h1 style={s("display:flex;align-items:center;gap:12px;font:700 32px/1.05 'Archivo';letter-spacing:-.022em;margin:0")}>Launch results <Demo /></h1><p style={s("font:400 14px/1.5 'Archivo';color:#513E66;margin:9px 0 0")}>Aurora Nova world premiere · Aurora Hall, Kuala Lumpur, and online · includes actions from this session.</p></div>
        <div style={s('display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:11px;background:#FFFFFF;box-shadow:0 1px 2px rgba(27,11,45,.05)')}><Ms size={16} color="#8B3DF5">check_circle</Ms><span style={s("font:600 12px/1 'Archivo';color:#513E66")}>{r.total.toLocaleString()} registered · {(st.follows + 2140).toLocaleString()} new followers · {(8902 + st.votes).toLocaleString()} poll votes</span></div>
      </div>
      <div style={s('display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-top:24px')}>
        {kpis.map((k) => (
          <div key={k.label} style={s('padding:24px;background:#FFFFFF;border-radius:18px;box-shadow:0 1px 2px rgba(27,11,45,.05);animation:stRise .4s ease both')}>
            <div style={s('display:flex;align-items:center;gap:9px')}><Ms color="#826E99">{k.icon}</Ms><span style={s("font:600 10.5px/1 'Archivo';letter-spacing:.13em;color:#826E99")}>{k.label}</span></div>
            <div style={s("font:800 40px/.92 'Archivo Black';margin-top:16px;letter-spacing:.01em")}>{k.v}</div>
            <div style={s("font:400 11.5px/1.3 'Archivo';color:#826E99;margin-top:12px")}>{k.sub}</div>
          </div>
        ))}
      </div>
      <div style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:20px')}>
        {kpis2.map((k) => (
          <div key={k.label} style={s('padding:22px 24px;background:#FFFFFF;border-radius:18px;box-shadow:0 1px 2px rgba(27,11,45,.05)')}>
            <div style={s('display:flex;align-items:center;gap:9px')}><Ms color="#826E99">{k.icon}</Ms><span style={s("font:600 10.5px/1 'Archivo';letter-spacing:.13em;color:#826E99")}>{k.label}</span></div>
            <div style={s("font:800 34px/.92 'Archivo Black';margin-top:14px")}>{k.v}</div>
            <div style={s("font:400 11.5px/1.3 'Archivo';color:#826E99;margin-top:10px")}>{k.sub}</div>
          </div>
        ))}
      </div>
      <Card style={{ marginTop: 20 }}>
        <div style={s('display:flex;align-items:center;gap:10px')}><Ms size={19} color="#1B0B2D">repeat</Ms><span style={s("font:700 16px/1 'Archivo';letter-spacing:-.012em")}>Attendees across events</span><span style={s("font:400 12px/1 'Archivo';color:#826E99;margin-left:auto")}>People who joined more than one Aurora event</span></div>
        <div style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:18px')}>
          {MULTI_EVENT.rows.map((x) => (
            <div key={x.name}>
              <div style={s('display:flex;align-items:center;gap:9px')}><span style={s("font:600 13px/1.3 'Archivo';flex:1")}>{x.name}</span><span style={s("font:700 13px/1 'Archivo';font-variant-numeric:tabular-nums")}>{x.n.toLocaleString()}</span></div>
              <div style={s('height:10px;border-radius:6px;background:#F1F1EE;margin-top:9px;overflow:hidden')}><span style={{ ...s('display:block;height:10px;border-radius:6px;background:#8B3DF5'), width: (x.n / MULTI_EVENT.rows[0].n) * 100 + '%' }} /></div>
            </div>
          ))}
        </div>
      </Card>
      <div style={s('display:grid;grid-template-columns:1.2fr 1fr;gap:20px;margin-top:20px')}>
        <Card>
          <div style={s('display:flex;align-items:center;gap:10px')}><Ms size={19} color="#1B0B2D">bar_chart</Ms><span style={s("font:700 16px/1 'Archivo';letter-spacing:-.012em")}>Engagement per segment</span><span style={s("font:400 12px/1 'Archivo';color:#826E99;margin-left:auto")}>Share of the audience who interacted</span></div>
          <div style={s('margin-top:22px;display:flex;flex-direction:column;gap:16px')}>
            {segBars.map((e, i) => (
              <div key={e.seg}>
                <div style={s('display:flex;align-items:center;gap:9px')}><span style={s("font:600 13px/1 'Archivo';flex:1")}>{e.seg}</span><span style={s("font:700 13px/1 'Archivo';font-variant-numeric:tabular-nums")}>{e.pct}%</span></div>
                <div style={s('height:10px;border-radius:6px;background:#F1F1EE;margin-top:9px;overflow:hidden')}><span style={{ ...s('display:block;height:10px;border-radius:6px;transition:width .8s cubic-bezier(.2,.8,.2,1)'), width: e.pct + '%', background: i === 2 ? '#1B0B2D' : e.pct > 60 ? '#8B3DF5' : '#C4C4C0' }} /></div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div style={s('display:flex;align-items:center;gap:10px')}><Ms size={19} color="#1B0B2D">directions_car</Ms><span style={s("font:700 16px/1 'Archivo';letter-spacing:-.012em")}>Test drive requests</span></div>
          <div style={s('margin-top:22px;display:flex;flex-direction:column;gap:16px')}>
            {byRoom.map((d) => (
              <div key={d.name}>
                <div style={s('display:flex;align-items:center;gap:9px')}><span style={s("font:600 13px/1 'Archivo';flex:1")}>{d.name}</span><span style={s("font:700 13px/1 'Archivo';font-variant-numeric:tabular-nums")}>{d.n}</span></div>
                <div style={s('height:10px;border-radius:6px;background:#F1F1EE;margin-top:9px;overflow:hidden')}><span style={{ ...s('display:block;height:10px;border-radius:6px;background:#8B3DF5'), width: (d.n / maxRoom) * 100 + '%' }} /></div>
              </div>
            ))}
          </div>
          {st.drives.length > 0 && (
            <div style={s('margin-top:20px;padding-top:16px;border-top:1px solid rgba(27,11,45,.08);display:flex;flex-direction:column;gap:8px')}>
              <Cap>FROM THIS SESSION</Cap>
              {st.drives.map((d: any, i: number) => (
                <div key={i} style={s('display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:11px;background:#F1F1EE')}><Ms size={15} color="#8B3DF5">{d.where === 'venue' ? 'location_on' : 'wifi'}</Ms><span style={s("flex:1;font:600 12px/1.3 'Archivo'")}>{d.showroom} · {d.slot}</span><span style={s("font:500 10.5px/1 'Archivo';color:#513E66")}>{d.t}</span></div>
              ))}
            </div>
          )}
        </Card>
      </div>
      <Card style={{ marginTop: 20 }}>
        <div style={s('display:flex;align-items:center;gap:10px')}><Ms size={19} color="#1B0B2D">help</Ms><span style={s("font:700 16px/1 'Archivo';letter-spacing:-.012em")}>Top questions</span><span style={s("font:400 12px/1 'Archivo';color:#826E99;margin-left:auto")}>By upvotes, venue and online combined</span></div>
        <div style={s('margin-top:18px;display:flex;flex-direction:column')}>
          {topQs.map((q: Q, i: number) => (
            <div key={q.id} style={s('display:flex;align-items:center;gap:16px;padding:13px 0;border-bottom:1px solid rgba(27,11,45,.08)')}>
              <span style={s("width:22px;font:800 16px/1 'Archivo Black';color:#826E99")}>{i + 1}</span>
              <span style={s("flex:1;font:600 13.5px/1.35 'Archivo'")}>{q.text}</span>
              <span style={s("display:flex;align-items:center;gap:5px;font:600 11px/1 'Archivo';color:#513E66")}><Ms size={14} color="#826E99">{q.where === 'venue' ? 'location_on' : 'wifi'}</Ms>{q.where === 'venue' ? 'In venue' : 'Online'}</span>
              <span style={s("width:60px;text-align:right;font:700 13px/1 'Archivo';font-variant-numeric:tabular-nums")}>{q.votes}</span>
              <span style={s("width:86px;text-align:right;font:600 10px/1 'Archivo';letter-spacing:.1em;color:#826E99")}>{q.status === 'QUEUED' ? (i < 3 ? 'ANSWERED' : 'NOT REACHED') : q.status}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

const LIFECYCLE = [['plan', 'Plan', 'edit_calendar'], ['invite', 'Invite', 'send'], ['welcome', 'Welcome', 'qr_code_scanner'], ['control', 'Engage', 'tune'], ['results', 'Improve', 'insights']] as const;
// RSVPs: seeded registrations plus any made in this session.
const rsvp = (st: St) => { const venue = RSVP_SEED.venue + st.regs.venue, online = RSVP_SEED.online + st.regs.online; return { venue, online, total: venue + online }; };
// Checked in at the hall door: seeded by event state, plus QR scans this session.
const checkedIn = (st: St) => (st.ms === 'before' ? 0 : st.ms === 'live' ? [604, 1158, 1212, 1212][st.seg] : 1212) + st.checkins;
const PageHead = ({ title, sub, children }: { title: ReactNode; sub: string; children?: ReactNode }) => (
  <div style={s('display:flex;align-items:flex-end;gap:20px')}>
    <div style={s('flex:1')}><h1 style={s("display:flex;align-items:center;gap:12px;font:700 30px/1.05 'Archivo';letter-spacing:-.022em;margin:0")}>{title}</h1><p style={s("font:400 14px/1.5 'Archivo';color:#513E66;margin:9px 0 0")}>{sub}</p></div>
    {children}
  </div>
);
const Stat = ({ label, v, sub }: { label: string; v: string; sub?: string }) => (
  <div style={s('padding:16px;border-radius:14px;background:#F1F1EE')}><div style={s("font:600 9.5px/1 'Archivo';letter-spacing:.12em;color:#513E66")}>{label}</div><div style={s("font:800 30px/.9 'Archivo Black';margin-top:10px;font-variant-numeric:tabular-nums")}>{v}</div>{sub && <div style={s("font:500 11px/1.3 'Archivo';color:#826E99;margin-top:8px")}>{sub}</div>}</div>
);

// ════════════ 1 PLAN ════════════
function Plan({ set }: any) {
  return (
    <div style={s('padding:30px 44px 52px;animation:stFade .3s ease both;display:flex;flex-direction:column;gap:20px')}>
      <PageHead title="Plan" sub="What fans see on the event page before doors open. Set up from the Product launch template.">
        <button className="ah" onClick={() => window.open(fanUrl, '_blank', 'noopener')} style={s("display:flex;align-items:center;gap:8px;padding:12px 16px;border-radius:12px;font:600 12.5px/1 'Archivo';box-shadow:inset 0 0 0 1px rgba(27,11,45,.14)")}><Ms size={16} color="inherit">visibility</Ms>Preview event page</button>
        <button className="ah-ink-btn" onClick={() => set({ screen: 'create', draft: blankDraft() })} style={s("display:flex;align-items:center;gap:8px;padding:12px 16px;border-radius:12px;background:#1B0B2D;font:600 12.5px/1 'Archivo';color:#F5F5F2")}><Ms size={16} color="#F5F5F2">add</Ms>Create another event</button>
      </PageHead>
      <div style={s('display:grid;grid-template-columns:1fr 1fr;gap:20px')}>
        <Card>
          <Cap>EVENT DETAILS</Cap>
          <div style={s("font:700 20px/1.2 'Archivo';margin-top:14px")}>Aurora Nova World Premiere</div>
          <div style={s('display:flex;gap:6px;margin-top:10px')}>{['Product launch', 'Hybrid', 'Free entry'].map((c) => <span key={c} style={s("font:600 10.5px/1 'Archivo';color:#513E66;background:#F1F1EE;padding:6px 8px;border-radius:6px")}>{c}</span>)}</div>
          <div style={s('margin-top:8px')}>{EVENT_DETAILS.map((d) => <div key={d.k} style={s('display:flex;gap:12px;padding:11px 0;border-bottom:1px solid rgba(27,11,45,.08)')}><Ms size={17} color="#826E99">{d.icon}</Ms><span style={s("width:62px;flex:none;font:600 12px/1.4 'Archivo';color:#513E66")}>{d.k}</span><span style={s("flex:1;font:500 12.5px/1.4 'Archivo'")}>{d.v}</span></div>)}</div>
        </Card>
        <Card>
          <Cap>AGENDA</Cap>
          <div style={s('margin-top:8px')}>{SEGMENTS.map((g, i) => <div key={g.id} style={s('display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid rgba(27,11,45,.08)')}><span style={s("width:46px;font:800 15px/1 'Archivo Black';font-variant-numeric:tabular-nums")}>{g.time}</span><span style={s("flex:1;font:600 13px/1 'Archivo'")}>{g.name}</span><span style={s("font:500 11px/1 'Archivo';color:#826E99")}>{['Drinks & music', 'Amira Hassan', 'Farid Rahman', 'Lena Kwok'][i]}</span></div>)}</div>
        </Card>
        <Card>
          <Cap>PRESENTERS</Cap>
          <div style={s('display:flex;flex-direction:column;gap:10px;margin-top:14px')}>{SPEAKERS.map((p) => <div key={p.name} style={s('display:flex;align-items:center;gap:12px;padding:10px;border-radius:12px;background:#F1F1EE')}><img src={p.photo} alt="" style={s('width:40px;height:40px;border-radius:50%;object-fit:cover')} /><span style={s('flex:1')}><span style={s("display:block;font:700 13px/1.2 'Archivo'")}>{p.name}</span><span style={s("display:block;font:400 11.5px/1.3 'Archivo';color:#513E66;margin-top:3px")}>{p.role}</span></span><span style={s("font:600 10.5px/1 'Archivo';color:#826E99")}>{p.slot}</span></div>)}</div>
        </Card>
        <Card>
          <div style={s('display:flex;align-items:center;gap:10px')}><Cap>SPONSORS</Cap><Demo /></div>
          <div style={s('display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px')}>{SPONSORS.map((n) => <div key={n} style={s("padding:18px 12px;border-radius:12px;background:#F1F1EE;text-align:center;font:800 14px/1 'Archivo';color:#513E66")}>{n}</div>)}</div>
          <div style={s("font:400 11.5px/1.45 'Archivo';color:#826E99;margin-top:12px")}>Shown as a partner strip at the foot of the event page.</div>
        </Card>
      </div>
    </div>
  );
}

// ════════════ 2 INVITE ════════════
function Invite({ st, set, say, sendReminder }: any) {
  const r = rsvp(st);
  const url = abs(fanUrl);
  const copy = () => { navigator.clipboard?.writeText(url).catch(() => {}); set({ copied: true }); say('Invite link copied', 'content_copy'); window.setTimeout(() => set({ copied: false }), 1600); };
  const field = 'width:100%;margin-top:8px;padding:12px 14px;border-radius:12px;background:#F1F1EE;border:0;font:500 13px/1.4 Archivo;color:#1B0B2D';
  return (
    <div style={s('padding:30px 44px 52px;animation:stFade .3s ease both;display:flex;flex-direction:column;gap:20px')}>
      <PageHead title="Invite" sub="Share one link. Everyone who registers gets updates from you before the event." />
      <Card>
        <div style={s('display:flex;align-items:center;gap:12px')}><Cap>INVITE LINK</Cap><Note>Opens the event page, where people register in person or online</Note></div>
        <div style={s('display:flex;align-items:center;gap:12px;margin-top:14px;padding:12px 14px;border-radius:12px;background:#F1F1EE')}>
          <Ms size={16} color="#513E66">link</Ms><span style={s("flex:1;min-width:0;font:500 13px/1 'Archivo';overflow:hidden;text-overflow:ellipsis;white-space:nowrap")}>{url}</span>
          <button onClick={copy} style={{ ...s("display:flex;align-items:center;gap:7px;padding:9px 12px;border-radius:10px;font:600 11.5px/1 'Archivo'"), background: st.copied ? '#1B0B2D' : '#FFFFFF', color: st.copied ? '#F5F5F2' : '#1B0B2D' }}><Ms size={15} color="inherit">{st.copied ? 'check' : 'content_copy'}</Ms>{st.copied ? 'Copied' : 'Copy link'}</button>
        </div>
      </Card>
      <Card>
        <div style={s('display:flex;align-items:center;gap:12px')}><span style={s('width:7px;height:7px;border-radius:50%;background:#8B3DF5;animation:stBlink 1.6s steps(1,end) infinite')} /><Cap>RSVPS · LIVE</Cap><Demo /><Note>{st.regs.venue + st.regs.online > 0 ? '+' + (st.regs.venue + st.regs.online) + ' from this session' : 'Updates as people register'}</Note></div>
        <div style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px')}>
          <Stat label="REGISTERED" v={r.total.toLocaleString()} />
          <Stat label="IN VENUE" v={r.venue.toLocaleString()} sub="Aurora Hall capacity 1,500" />
          <Stat label="ONLINE" v={r.online.toLocaleString()} sub="Stream on the event page" />
        </div>
        <div style={s('display:flex;height:8px;border-radius:5px;overflow:hidden;margin-top:14px;background:#F1F1EE')}><span style={{ ...s('display:block;background:#1B0B2D'), width: (r.venue / r.total) * 100 + '%' }} /><span style={s('display:block;flex:1;background:#8B3DF5')} /></div>
      </Card>
      <div style={s('display:grid;grid-template-columns:1.3fr 1fr;gap:20px;align-items:start')}>
        <Card>
          <div style={s('display:flex;align-items:center;gap:12px')}><Cap>SEND A REMINDER OR UPDATE</Cap><Note>Registered attendees only</Note></div>
          <div style={s('display:flex;flex-wrap:wrap;gap:6px;margin-top:14px')}>{REMINDERS.map((x) => { const on = st.remTitle === x.title; return <button key={x.title} onClick={() => set({ remTitle: x.title, remText: x.body, remTarget: x.target })} style={{ ...s("font:600 11.5px/1 'Archivo';padding:9px 11px;border-radius:9px"), background: on ? '#1B0B2D' : '#F1F1EE', color: on ? '#F5F5F2' : '#1B0B2D' }}>{x.title}</button>; })}</div>
          <input value={st.remTitle} onChange={(e) => set({ remTitle: e.target.value })} placeholder="Title" style={s(field + ';margin-top:14px;font-weight:600')} />
          <textarea value={st.remText} onChange={(e) => set({ remText: e.target.value })} rows={3} style={s(field + ';resize:vertical')} />
          <div style={s('display:flex;align-items:center;gap:12px;margin-top:14px')}>
            <div style={s('display:flex;gap:4px;padding:4px;border-radius:12px;background:#F1F1EE')}>
              {TARGETS.map((x) => { const on = st.remTarget === x.id; return <button key={x.id} onClick={() => set({ remTarget: x.id })} style={{ ...s("display:flex;align-items:center;gap:6px;padding:9px 12px;border-radius:9px;font:600 11.5px/1 'Archivo'"), background: on ? '#FFFFFF' : 'transparent', color: on ? '#1B0B2D' : '#513E66' }}><Ms size={15} color="inherit">{x.icon}</Ms>{x.name}</button>; })}
            </div>
            <button className="ah-ink-btn" onClick={sendReminder} style={s("display:flex;align-items:center;gap:8px;margin-left:auto;padding:12px 16px;border-radius:12px;background:#1B0B2D;font:600 12.5px/1 'Archivo';color:#F5F5F2")}><Ms size={16} color="#F5F5F2">send</Ms>Send to {(st.remTarget === 'all' ? r.total : st.remTarget === 'venue' ? r.venue : r.online).toLocaleString()}</button>
          </div>
        </Card>
        <Card>
          <Cap>SENT</Cap>
          <div style={s('display:flex;flex-direction:column;gap:8px;margin-top:12px')}>
            {st.sent.length === 0 && <div style={s("font:400 12px/1.5 'Archivo';color:#826E99")}>Nothing sent yet. Updates appear as a card at the top of the fan’s event page.</div>}
            {st.sent.map((x: any) => <div key={x.id} style={s('display:flex;align-items:center;gap:10px;padding:11px 12px;border-radius:12px;background:#F1F1EE;animation:stSlide .25s ease both')}><Ms size={16} color="#8B3DF5">notifications_active</Ms><span style={s('flex:1;min-width:0')}><span style={s("display:block;font:600 12px/1.2 'Archivo'")}>{x.title}</span><span style={s("display:block;font:400 10.5px/1.2 'Archivo';color:#513E66;margin-top:4px")}>{TARGETS.find((y) => y.id === x.target)?.name} · {x.reach.toLocaleString()} registered</span></span><span style={s("font:500 10.5px/1 'Archivo';color:#513E66")}>{x.t}</span></div>)}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ════════════ 3 WELCOME ════════════
function Welcome({ st }: any) {
  const url = abs(fanUrl + '?checkin=hall');
  const [qr, setQr] = useState('');
  useEffect(() => { QRCode.toDataURL(url, { margin: 0, width: 300, color: { dark: '#1B0B2D', light: '#FFFFFF' } }).then(setQr, () => setQr('')); }, [url]);
  const r = rsvp(st); const c = checkedIn(st); const pct = Math.min(100, Math.round((c / r.venue) * 100));
  return (
    <div style={s('padding:30px 44px 52px;animation:stFade .3s ease both;display:flex;flex-direction:column;gap:20px')}>
      <PageHead title="Welcome" sub="Self check-in with one QR at the hall doors. Scanning checks the guest in and opens the live experience." />
      <div style={s('display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:start')}>
        <Card>
          <Cap>VENUE QR · AURORA HALL</Cap>
          <div style={s('margin-top:14px;padding:16px;border-radius:14px;background:#FFFFFF;box-shadow:inset 0 0 0 1px rgba(27,11,45,.1)')}>{qr && <img src={qr} alt="Venue check-in QR" width={200} height={200} style={{ display: 'block' }} />}</div>
          <div style={s("font:400 11.5px/1.45 'Archivo';color:#513E66;margin-top:12px;max-width:232px")}>Print it once for every door. It opens the event page already checked in as an in-venue guest.</div>
        </Card>
        <Card>
          <div style={s('display:flex;align-items:center;gap:12px')}><span style={s('width:7px;height:7px;border-radius:50%;background:#C0473C;animation:stBlink 1.6s steps(1,end) infinite')} /><Cap>CHECKED IN VS REGISTERED</Cap><Demo /></div>
          <div style={s('display:flex;align-items:baseline;gap:12px;margin-top:18px')}><span style={s("font:800 56px/.9 'Archivo Black';font-variant-numeric:tabular-nums")}>{c.toLocaleString()}</span><span style={s("font:600 14px/1 'Archivo';color:#513E66")}>of {r.venue.toLocaleString()} registered for the hall</span></div>
          <div style={s('height:14px;border-radius:8px;background:#F1F1EE;margin-top:18px;overflow:hidden')}><span style={{ ...s('display:block;height:14px;border-radius:8px;background:#8B3DF5;transition:width .6s ease'), width: pct + '%' }} /></div>
          <div style={s("display:flex;justify-content:space-between;font:600 12px/1 'Archivo';color:#513E66;margin-top:10px")}><span>{pct}% checked in</span><span>{Math.max(r.venue - c, 0).toLocaleString()} still to arrive</span></div>
          <div style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px')}>
            <Stat label="THIS SESSION" v={'+' + st.checkins} sub="QR scans from this browser" />
            <Stat label="DOORS" v={st.ms === 'before' ? 'Closed' : 'Open'} sub={st.ms === 'before' ? 'Open at 19:30' : 'Since 19:30'} />
            <Stat label="ONLINE NOW" v={audience(st.ms, st.seg, st.tick).online.toLocaleString()} sub="No check-in needed" />
          </div>
          {st.ms === 'before' && <div style={s("font:400 12px/1.5 'Archivo';color:#826E99;margin-top:14px")}>Check-ins start when the event goes live. Scans before then still count.</div>}
        </Card>
      </div>
    </div>
  );
}

// Livestream: Connect embeds the organiser's player and hosts no video.
function StreamCard() {
  return (
    <Card>
      <div style={s('display:flex;align-items:center;gap:12px')}><Ms size={18} color="#C0473C">live_tv</Ms><Cap>LIVESTREAM</Cap><span style={s("font:600 9px/1 'Archivo';letter-spacing:.1em;color:#F5F5F2;background:#C0473C;padding:4px 6px;border-radius:5px")}>EMBED</span><Note>Check-in lives in Welcome</Note></div>
      <div style={s('display:flex;align-items:center;gap:8px;margin-top:14px;padding:11px 13px;border-radius:10px;background:#F1F1EE')}><Ms size={15} color="#826E99">link</Ms><span style={s("flex:1;min-width:0;font:500 12px/1.2 'Archivo';color:#513E66")}>youtube.com/embed/aurora-nova-live</span><span style={s("font:600 10px/1 'Archivo';color:#826E99")}>PLACEHOLDER</span></div>
      <div style={s("font:400 11.5px/1.45 'Archivo';color:#513E66;margin-top:10px")}>Online fans see the organiser’s YouTube or Vimeo player above the panel. In-venue fans don’t get the player.</div>
    </Card>
  );
}

// IRIS answers from this fixed list only, so the operator can see exactly what it will say.
function IrisFacts() {
  const facts = [...IRIS_PRE.filter(([q]) => q !== 'How much is it?'), ...IRIS_LIVE];
  return (
    <Card>
      <div style={s('display:flex;align-items:center;gap:10px')}><span style={s('width:7px;height:7px;background:#8B3DF5')} /><Cap>IRIS · APPROVED FACTS</Cap><Note>{facts.length + HOTSPOTS.length} answers</Note></div>
      <div style={s("font:400 11.5px/1.45 'Archivo';color:#513E66;margin-top:10px")}>IRIS answers only from this list and the five feature facts. Anything else is sent to the Q&amp;A. Range, charging, price and finance stay hidden until the reveal.</div>
      <div style={s('display:flex;flex-direction:column;gap:6px;margin-top:12px;max-height:200px;overflow-y:auto')}>
        {facts.map(([q, , stat]) => <div key={q} style={s('display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:10px;background:#F1F1EE')}><Ms size={14} color="#8B3DF5">verified</Ms><span style={s("flex:1;font:600 11.5px/1.25 'Archivo'")}>{q}</span><span style={s("font:700 11px/1 'Archivo';color:#513E66")}>{stat}</span></div>)}
      </div>
    </Card>
  );
}

// ════════════ EVENTS HOME ════════════
const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  live: { label: 'LIVE NOW', bg: '#C0473C', fg: '#F5F5F2' }, upcoming: { label: 'UPCOMING', bg: '#1B0B2D', fg: '#F5F5F2' },
  past: { label: 'PAST', bg: '#E9E9E4', fg: '#513E66' }, draft: { label: 'DRAFT', bg: '#F3ECFE', fg: '#6A2BC4' },
};
function EventsHome({ st, set, aud }: any) {
  const order = ['live', 'draft', 'upcoming', 'past'];
  const list = [...st.events].sort((a: EventRec, b: EventRec) => order.indexOf(a.status) - order.indexOf(b.status));
  return (
    <div style={s('padding:34px 44px 52px;animation:stFade .3s ease both')}>
      <div style={s('display:flex;align-items:flex-end;gap:20px')}>
        <div style={s('flex:1')}><h1 style={s("display:flex;align-items:center;gap:12px;font:700 32px/1.05 'Archivo';letter-spacing:-.022em;margin:0")}>Events <Demo /></h1><p style={s("font:400 14px/1.5 'Archivo';color:#513E66;margin:9px 0 0")}>Every Aurora Motors event runs on one Connect page. Launches, conferences and fan days, in person, online or both.</p></div>
        <button className="ah-ink-btn" onClick={() => set({ screen: 'create', draft: blankDraft() })} style={s("display:flex;align-items:center;gap:8px;padding:13px 18px;border-radius:12px;background:#1B0B2D;font:600 13px/1 'Archivo';color:#F5F5F2")}><Ms size={18} color="#F5F5F2">add</Ms>Create event</button>
      </div>
      <div style={s('display:flex;flex-direction:column;gap:14px;margin-top:24px')}>
        {list.map((e: EventRec) => { const S = STATUS[e.status]; const live = e.status === 'live'; return (
          <button key={e.id} className="ah" onClick={() => set(live ? { screen: 'control' } : { screen: 'overview', openId: e.id })} style={{ ...s('display:flex;align-items:center;gap:20px;width:100%;text-align:left;padding:20px 24px;border-radius:18px;background:#FFFFFF;box-shadow:0 1px 2px rgba(27,11,45,.05)'), borderLeft: live ? '4px solid #C0473C' : '4px solid transparent' }}>
            <span style={s('width:96px;height:64px;flex:none;border-radius:10px;overflow:hidden;background:#160925;position:relative')}><img src={img.car} alt="" style={{ ...s('width:100%;height:100%;object-fit:cover'), opacity: e.status === 'draft' ? 0.35 : 1, filter: e.status === 'past' ? 'saturate(.3)' : 'none' }} /></span>
            <span style={s('flex:1;min-width:0')}>
              <span style={s('display:flex;align-items:center;gap:10px')}><span style={s("font:700 17px/1.2 'Archivo'")}>{e.name}</span><span style={{ ...s("display:flex;align-items:center;gap:6px;font:600 9.5px/1 'Archivo';letter-spacing:.12em;padding:5px 7px;border-radius:6px"), background: S.bg, color: S.fg }}>{live && <span style={s('width:6px;height:6px;border-radius:50%;background:#fff;animation:stBlink 1.4s steps(1,end) infinite')} />}{S.label}</span></span>
              <span style={s("display:block;font:400 12.5px/1.4 'Archivo';color:#513E66;margin-top:6px")}>{e.date} · {e.place}</span>
              <span style={s('display:flex;gap:6px;margin-top:10px')}>{[e.template, e.format, e.segments.length + ' segments'].map((c) => <span key={c} style={s("font:600 10.5px/1 'Archivo';color:#513E66;background:#F1F1EE;padding:6px 8px;border-radius:6px")}>{c}</span>)}</span>
            </span>
            <span style={s('text-align:right')}><span style={s("display:block;font:700 13px/1.2 'Archivo'")}>{live ? (aud.venue + aud.online).toLocaleString() + ' connected' : e.stat}</span><span style={s("display:flex;align-items:center;justify-content:flex-end;gap:6px;margin-top:8px;font:600 12px/1 'Archivo';color:#8B3DF5")}>{live ? 'Open control room' : e.status === 'draft' ? 'Edit settings' : 'View event'}<Ms size={16} color="#8B3DF5">arrow_forward</Ms></span></span>
          </button>
        ); })}
      </div>
    </div>
  );
}

// ════════════ CREATE EVENT ════════════
function CreateEvent({ st, set, say }: any) {
  const d: Draft = st.draft;
  const tpl = TEMPLATES.find((x) => x.id === d.template) || TEMPLATES[0];
  const upd = (p: Partial<Draft>) => set((x: St) => ({ draft: { ...x.draft, ...p } }));
  const pickTpl = (id: string) => { const t2 = TEMPLATES.find((x) => x.id === id)!; upd({ template: id, format: t2.format, segments: [...t2.segments] }); };
  const addSeg = () => { const v = d.segDraft.trim(); if (v) upd({ segments: [...d.segments, v], segDraft: '' }); };
  const create = () => {
    const name = d.name.trim() || 'Untitled ' + tpl.name.toLowerCase();
    const dt = new Date(d.date + 'T' + d.time);
    const when = isNaN(dt.getTime()) ? d.date : dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).replace(',', '') + ' · ' + d.time;
    const rec: EventRec = { id: 'ev' + Date.now(), name, template: tpl.name, format: d.format, date: when, place: d.format === 'Online' ? 'Online' : d.format === 'Hybrid' ? 'Venue to confirm + online' : 'Venue to confirm', status: 'draft', stat: 'Not published', segments: d.segments };
    set((x: St) => ({ events: [rec, ...x.events], screen: 'overview', openId: rec.id }));
    say('Event created from the ' + tpl.name + ' template', 'check_circle');
  };
  const lab = (t2: string) => <div style={s("font:600 10.5px/1 'Archivo';letter-spacing:.12em;color:#826E99")}>{t2}</div>;
  const field = 'width:100%;margin-top:8px;padding:12px 14px;border-radius:12px;background:#F1F1EE;border:0;font:500 13.5px/1.2 Archivo;color:#1B0B2D';
  return (
    <div style={s('padding:34px 44px 52px;animation:stFade .3s ease both;display:flex;gap:20px;align-items:flex-start')}>
      <div style={s('flex:1;min-width:0;display:flex;flex-direction:column;gap:20px')}>
        <div><h1 style={s("font:700 32px/1.05 'Archivo';letter-spacing:-.022em;margin:0")}>Create event</h1><p style={s("font:400 14px/1.5 'Archivo';color:#513E66;margin:9px 0 0")}>Start from a template. It pre-fills the format, segments and modules, and you can change any of them.</p></div>
        <Card>
          <Cap>TEMPLATE</Cap>
          <div style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px')}>
            {TEMPLATES.map((x) => { const on = d.template === x.id; return (
              <button key={x.id} onClick={() => pickTpl(x.id)} className="ah" style={{ ...s('display:flex;flex-direction:column;align-items:flex-start;gap:10px;padding:16px;border-radius:14px;text-align:left'), background: on ? '#F1F1EE' : '#FFFFFF', boxShadow: on ? 'inset 0 0 0 2px #1B0B2D' : 'inset 0 0 0 1px rgba(27,11,45,.12)' }}>
                <Ms size={22} color="#8B3DF5">{x.icon}</Ms>
                <span style={s("font:700 14px/1.2 'Archivo'")}>{x.name}</span>
                <span style={s("font:400 11.5px/1.45 'Archivo';color:#513E66")}>{x.blurb}</span>
              </button>
            ); })}
          </div>
        </Card>
        <Card>
          <Cap>DETAILS</Cap>
          <div style={s('display:grid;grid-template-columns:2fr 1fr 1fr;gap:14px;margin-top:16px')}>
            <label>{lab('NAME')}<input value={d.name} onChange={(e) => upd({ name: e.target.value })} placeholder={'e.g. Aurora ' + (tpl.id === 'conference' ? 'Tech Forum 2027' : tpl.id === 'fan' ? 'Owners Day 2027' : 'Vela reveal')} style={s(field)} /></label>
            <label>{lab('DATE')}<input type="date" value={d.date} onChange={(e) => upd({ date: e.target.value })} style={s(field)} /></label>
            <label>{lab('START')}<input type="time" value={d.time} onChange={(e) => upd({ time: e.target.value })} style={s(field)} /></label>
          </div>
          <div style={s('margin-top:18px')}>{lab('FORMAT')}</div>
          <div style={s('display:flex;gap:4px;padding:4px;border-radius:12px;background:#F1F1EE;margin-top:8px;width:max-content')}>
            {([['In person', 'location_on'], ['Online', 'wifi'], ['Hybrid', 'hub']] as const).map(([f, icon]) => { const on = d.format === f; return <button key={f} onClick={() => upd({ format: f })} style={{ ...s("display:flex;align-items:center;gap:7px;padding:10px 15px;border-radius:9px;font:600 12px/1 'Archivo'"), background: on ? '#FFFFFF' : 'transparent', color: on ? '#1B0B2D' : '#513E66', boxShadow: on ? '0 1px 2px rgba(27,11,45,.08)' : 'none' }}><Ms size={16} color="inherit">{icon}</Ms>{f}</button>; })}
          </div>
        </Card>
        <Card>
          <div style={s('display:flex;align-items:center;gap:12px')}><Cap>SEGMENTS</Cap><Note>The running order fans see, and what you advance through live</Note></div>
          <div style={s('display:flex;flex-direction:column;gap:8px;margin-top:16px')}>
            {d.segments.map((g, i) => (
              <div key={g + i} style={s('display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:12px;background:#F1F1EE')}>
                <span style={s("width:22px;height:22px;flex:none;border-radius:7px;background:#1B0B2D;color:#F5F5F2;display:flex;align-items:center;justify-content:center;font:700 10.5px/1 'Archivo'")}>{i + 1}</span>
                <span style={s("flex:1;font:600 13px/1 'Archivo'")}>{g}</span>
                <button onClick={() => upd({ segments: d.segments.filter((_, k) => k !== i) })} aria-label={'Remove ' + g} style={s('display:flex;padding:4px;color:#826E99')}><Ms size={17} color="inherit">close</Ms></button>
              </div>
            ))}
            <div style={s('display:flex;gap:8px')}>
              <input value={d.segDraft} onChange={(e) => upd({ segDraft: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') addSeg(); }} placeholder="Add a segment" style={s(field.replace('margin-top:8px;', '') + ';flex:1')} />
              <button className="ah" onClick={addSeg} style={s("display:flex;align-items:center;gap:6px;padding:0 16px;border-radius:12px;font:600 12.5px/1 'Archivo';box-shadow:inset 0 0 0 1px rgba(27,11,45,.14)")}><Ms size={16} color="inherit">add</Ms>Add</button>
            </div>
          </div>
        </Card>
      </div>
      <aside style={s('width:340px;flex:none;position:sticky;top:96px;display:flex;flex-direction:column;gap:20px')}>
        <Card>
          <Cap>SUMMARY</Cap>
          <div style={s("font:700 20px/1.15 'Archivo';margin-top:14px")}>{d.name.trim() || 'Untitled ' + tpl.name.toLowerCase()}</div>
          <div style={s("font:400 12.5px/1.45 'Archivo';color:#513E66;margin-top:6px")}>{tpl.name} · {d.format} · {d.segments.length} segments</div>
          <div style={s('margin-top:16px')}><Cap>MODULES FROM THE TEMPLATE</Cap></div>
          <div style={s('display:flex;flex-wrap:wrap;gap:6px;margin-top:10px')}>{[...tpl.modules, ...(d.format !== 'Online' ? ['Venue QR check-in'] : []), ...(d.format !== 'In person' ? ['Livestream embed'] : [])].map((m) => <span key={m} style={s("font:600 11px/1 'Archivo';background:#F1F1EE;padding:7px 9px;border-radius:7px")}>{m}</span>)}</div>
          <div style={s("font:400 11.5px/1.45 'Archivo';color:#826E99;margin-top:16px")}>In this demo, new events save their settings only. The Nova launch is the one with a full fan experience built.</div>
          <button className="ah-ink-btn" onClick={create} style={s("display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:18px;padding:15px;border-radius:12px;background:#1B0B2D;font:700 13.5px/1 'Archivo';color:#F5F5F2")}>Create event<Ms size={18} color="#F5F5F2">arrow_forward</Ms></button>
          <button className="ah" onClick={() => set({ screen: 'home' })} style={s("display:block;width:100%;margin-top:8px;padding:12px;border-radius:12px;font:600 12.5px/1 'Archivo';color:#513E66;text-align:center")}>Cancel</button>
        </Card>
      </aside>
    </div>
  );
}

// ════════════ EVENT OVERVIEW (non-Nova events) ════════════
function Overview({ st, set }: any) {
  const e: EventRec = st.events.find((x: EventRec) => x.id === st.openId) || st.events[0];
  const S = STATUS[e.status];
  const next = e.id === 'next', past = e.status === 'past';
  return (
    <div style={s('padding:34px 44px 52px;animation:stFade .3s ease both')}>
      <button className="ah-ink" onClick={() => set({ screen: 'home' })} style={s("display:flex;align-items:center;gap:6px;font:600 12.5px/1 'Archivo';color:#513E66")}><Ms size={16} color="inherit">arrow_back</Ms>All events</button>
      <div style={s('display:flex;align-items:center;gap:12px;margin-top:18px')}><h1 style={s("font:700 32px/1.05 'Archivo';letter-spacing:-.022em;margin:0")}>{e.name}</h1><span style={{ ...s("font:600 9.5px/1 'Archivo';letter-spacing:.12em;padding:6px 8px;border-radius:6px"), background: S.bg, color: S.fg }}>{S.label}</span></div>
      <p style={s("font:400 14px/1.5 'Archivo';color:#513E66;margin:9px 0 0")}>{e.date} · {e.place}</p>
      <div style={s('display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:24px')}>
        <Card>
          <Cap>SETTINGS</Cap>
          {[['Template', e.template], ['Format', e.format], ['Check-in', e.format === 'Online' ? 'Not needed' : 'One venue QR'], ['Livestream', e.format === 'In person' ? 'None' : 'YouTube / Vimeo embed']].map(([k, v]) => (
            <div key={k} style={s('display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(27,11,45,.08)')}><span style={s("font:500 13px/1 'Archivo';color:#513E66")}>{k}</span><span style={s("font:600 13px/1 'Archivo'")}>{v}</span></div>
          ))}
          <div style={s('margin-top:18px')}><Cap>SEGMENTS</Cap></div>
          <div style={s('display:flex;flex-wrap:wrap;gap:6px;margin-top:10px')}>{e.segments.map((g, i) => <span key={g + i} style={s("font:600 11.5px/1 'Archivo';background:#F1F1EE;padding:8px 10px;border-radius:8px")}>{i + 1}. {g}</span>)}</div>
        </Card>
        <Card>
          <div style={s('display:flex;align-items:center;gap:10px')}><Cap>{past ? 'RESULTS' : next ? 'REGISTRATIONS' : 'STATUS'}</Cap>{(past || next) && <Demo />}</div>
          {past ? (
            <div style={s('display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px')}>{[['3,210', 'ATTENDED'], ['61%', 'ENGAGED'], ['842', 'QUESTIONS'], ['1,177', 'NOW IN COMMUNITY']].map(([v, l]) => <div key={l} style={s('padding:14px;border-radius:12px;background:#F1F1EE')}><div style={s("font:800 26px/.9 'Archivo Black'")}>{v}</div><div style={s("font:600 9.5px/1 'Archivo';letter-spacing:.12em;color:#513E66;margin-top:9px")}>{l}</div></div>)}</div>
          ) : next ? (<>
            <div style={s('display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px')}>{[['1,904', 'REGISTERED'], ['38%', 'NOVA LAUNCH ATTENDEES']].map(([v, l]) => <div key={l} style={s('padding:14px;border-radius:12px;background:#F1F1EE')}><div style={s("font:800 26px/.9 'Archivo Black'")}>{v}</div><div style={s("font:600 9.5px/1 'Archivo';letter-spacing:.12em;color:#513E66;margin-top:9px")}>{l}</div></div>)}</div>
            <div style={s("font:400 12px/1.5 'Archivo';color:#513E66;margin-top:14px")}>Fans who attended the Nova launch see “Welcome back” and a one-tap register on this event’s page.</div>
            <button className="ah-ink-btn" onClick={() => window.open(fanUrl + '?event=next', '_blank', 'noopener')} style={s("display:flex;align-items:center;gap:8px;margin-top:16px;padding:12px 16px;border-radius:12px;background:#1B0B2D;font:600 12.5px/1 'Archivo';color:#F5F5F2")}><Ms size={16} color="#F5F5F2">smartphone</Ms>Open fan page</button>
          </>) : (
            <div style={s("font:400 13px/1.55 'Archivo';color:#513E66;margin-top:14px")}>Settings saved from the {e.template} template. Publishing would give this event its own Connect page, check-in QR and stream slot. In this demo only the Nova launch has a built fan experience.</div>
          )}
        </Card>
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
.ah:hover{background:#F1F1EE !important}
.ah2:hover{background:#E9E9E4 !important}
.ah-ink-btn:hover{background:#29163E !important}
.ah-ink:hover{color:#1B0B2D !important}
button{transition:background .15s ease,box-shadow .15s ease}
@media (prefers-reduced-motion: reduce){*{animation-duration:.001ms !important;transition-duration:.001ms !important}}
`;
