// ═══════════════════════════════════════════════════════════════════════
// EventStudio, the organiser side of one Connect Events event, rendered from
// its EventConfig. Lifecycle tabs Plan / Invite / Welcome / Engage / Improve,
// in the Voltford Control Room and Stats language (cards, ON AIR header,
// state + segment grids, trigger grid, live monitor, broadcast log). Drives
// that event's fan view over its own BroadcastChannel and hears back from it.
// All numbers are mocked and labelled "Demo data".
// ═══════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { s } from '../voltford/admin/s';
import QRCode from 'qrcode';
import {
  getEvent, audience, checkinsSeed, channelName, fanPath, homePath, abs, asset, STATES, TARGETS, revealSegIndex, qaSegIndex,
  type EventConfig, type Ms as MState, type Mode, type Target, type TriggerKind,
} from './config';

export const Ms = ({ children, size = 18, color, style }: { children: string; size?: number; color?: string; style?: CSSProperties }) => (
  <span className="ms" style={{ fontSize: size, color, ...style }}>{children}</span>
);
const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
const STATE_COLOR: Record<MState, string> = { before: '#8B3DF5', live: '#C0473C', break: '#331C4E', after: '#5B5449', community: '#2F7A68' };
// Small marker on anything mocked for the demo.
export const Demo = () => <span style={s("display:inline-flex;align-items:center;gap:4px;font:600 9px/1 'Archivo';letter-spacing:.1em;color:#826E99;background:#F1F1EE;padding:4px 6px;border-radius:5px;white-space:nowrap")}><span className="ms" style={{ fontSize: 11 }}>science</span>DEMO DATA</span>;
const TRIGGERS: { id: TriggerKind; name: string; icon: string; color: string }[] = [
  { id: 'reveal', name: 'Reveal', icon: 'auto_awesome', color: '#8B3DF5' },
  { id: 'poll', name: 'Poll', icon: 'bar_chart', color: '#8B3DF5' },
  { id: 'hotspot', name: 'Hotspot', icon: 'my_location', color: '#8B3DF5' },
  { id: 'announce', name: 'Announcement', icon: 'campaign', color: '#C0473C' },
];
const LIFECYCLE = [['plan', 'Plan'], ['invite', 'Invite'], ['welcome', 'Welcome'], ['control', 'Engage'], ['results', 'Improve']] as const;
type Screen = (typeof LIFECYCLE)[number][0];

type Q = { id: string; text: string; who: string; where: Mode; votes: number; status: string; fresh?: boolean };
type Log = { id: number; name: string; detail: string; icon: string; color: string; t: string };
interface St {
  screen: Screen;
  sent: { id: string; title: string; target: Target; t: string; reach: number }[]; remText: string; remTitle: string; remTarget: Target; copied: boolean;
  checkins: number; ms: MState; seg: number; revealed: boolean; poll: number | null;
  target: Target; ctr: { poll: number; hotspot: number; announce: number };
  tick: number; clock: number; log: Log[]; toast: string | null; toastIcon: string;
  questions: Q[]; regs: { venue: number; online: number }; drives: { showroom: string; slot: string; where: Mode; t: string }[];
  reacts: number[]; votes: number; follows: number; monitor: Mode;
}

export function EventStudio({ id }: { id: string }) {
  const [cfg] = useState(() => getEvent(id));
  if (!cfg) return (
    <div style={s("min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F5F5F2;font-family:Archivo,system-ui,sans-serif")}>
      <div style={s('text-align:center;max-width:360px')}><div style={s("font:700 24px/1.2 'Archivo'")}>Event not found</div><p style={s("font:400 14px/1.5 'Archivo';color:#513E66")}>“{id}” isn’t saved in this browser.</p><a href={homePath()} style={s("font:600 13px/1 'Archivo';color:#8B3DF5")}>Back to events</a></div>
    </div>
  );
  return <StudioFor cfg={cfg} />;
}

function StudioFor({ cfg }: { cfg: EventConfig }) {
  const initial = (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab')) as Screen | null;
  const [st, setSt] = useState<St>(() => ({
    screen: initial && LIFECYCLE.some(([k]) => k === initial) ? initial : 'control',
    checkins: 0, sent: [], remTitle: cfg.reminders[0]?.title || '', remText: cfg.reminders[0]?.body || '', remTarget: cfg.reminders[0]?.target || 'all', copied: false,
    ms: 'before', seg: 0, revealed: false, poll: null, target: 'all', ctr: { poll: 0, hotspot: 0, announce: 0 },
    tick: 0, clock: 0, log: [], toast: null, toastIcon: 'bolt',
    questions: cfg.qaSeed.map((q) => ({ ...q, status: 'QUEUED' })), regs: { venue: 0, online: 0 }, drives: [],
    reacts: cfg.segments.map(() => 0), votes: 0, follows: 0, monitor: cfg.event.format === 'In person' ? 'venue' : 'online',
  }));
  const set = (p: Partial<St> | ((x: St) => Partial<St>)) => setSt((x) => ({ ...x, ...(typeof p === 'function' ? p(x) : p) }));
  const stRef = useRef(st); stRef.current = st;
  const toastT = useRef<number | undefined>(undefined);
  const say = (msg: string, icon = 'bolt') => { window.clearTimeout(toastT.current); set({ toast: msg, toastIcon: icon }); toastT.current = window.setTimeout(() => set({ toast: null }), 2200); };
  const log = (name: string, detail: string, icon: string, color = '#8B3DF5') => set((x) => ({ log: [{ id: Date.now() + Math.random(), name, detail, icon, color, t: fmt(x.clock) }, ...x.log].slice(0, 30) }));
  const REV = revealSegIndex(cfg), QAI = qaSegIndex(cfg);
  useEffect(() => { document.title = cfg.event.name + ' · Studio'; }, [cfg.event.name]);

  useEffect(() => {
    const t = window.setInterval(() => set((x) => ({ tick: x.tick + 1, clock: x.ms === 'before' ? x.clock : x.clock + 1 })), 1000);
    return () => window.clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      case 'react': set((p) => { const r = p.reacts.slice(); if (m.seg >= 0 && m.seg < r.length) r[m.seg] += 1; return { reacts: r }; }); break;
      case 'follow': set((p) => ({ follows: p.follows + 1 })); log('New follower', 'A fan followed ' + cfg.brand.name, 'notifications_active'); break;
      case 'testdrive': set((p) => ({ drives: [{ showroom: m.showroom, slot: m.slot, where: m.where, t: fmt(p.clock) }, ...p.drives] })); log(cfg.cta.title, [m.showroom, m.slot].filter(Boolean).join(' · '), 'event_available'); say(cfg.cta.doneTitle + (m.showroom ? ' · ' + m.showroom : ''), 'event_available'); break;
      case 'state': mirrorState(m.ms, m.seg); if (m.from === 'fan') log('State · ' + STATES.find((y) => y.id === m.ms)?.name, 'Changed from the fan demo strip', 'swap_horiz', STATE_COLOR[m.ms as MState]); break;
      case 'segment': mirrorState('live', m.seg); if (m.from === 'fan') log('Segment · ' + (cfg.segments[m.seg]?.name || ''), 'Changed from the fan demo strip', 'radio_button_checked'); break;
      case 'trigger': mirrorTrigger(m.kind, m.idx || 0); if (m.from === 'fan') log(TRIGGERS.find((y) => y.id === m.kind)?.name || m.kind, 'Fired from the fan demo strip · ' + TARGETS.find((y) => y.id === m.target)?.name, 'bolt'); break;
    }
  };
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const ch = new BroadcastChannel(channelName(cfg.id));
    chan.current = ch;
    ch.onmessage = (e) => bus.current(e.data);
    return () => { ch.close(); chan.current = null; };
  }, [cfg.id]);

  const mirrorState = (ms: MState, seg?: number) => set((x) => {
    if (ms === 'before') return { ms, seg: 0, revealed: false, poll: null, clock: 0 };
    if (ms === 'live') { const g = seg ?? (x.ms === 'before' ? 0 : x.seg); return { ms, seg: g, revealed: x.revealed || (QAI >= 0 && g >= QAI) }; }
    if (ms === 'break') return { ms, poll: null };
    return { ms, revealed: true, poll: null };
  });
  const mirrorTrigger = (kind: TriggerKind, idx: number) => set((x) => {
    if (kind === 'reveal') return { ms: 'live', seg: REV, revealed: true };
    if (kind === 'poll') return { poll: cfg.polls.length ? idx % cfg.polls.length : null, ctr: { ...x.ctr, poll: idx + 1 } };
    if (kind === 'hotspot') return { revealed: true, ctr: { ...x.ctr, hotspot: idx + 1 } };
    return { ctr: { ...x.ctr, announce: idx + 1 } };
  });

  const aud = audience(cfg, st.ms, st.seg, st.tick);
  const reach = () => (st.target === 'all' ? aud.venue + aud.online : st.target === 'venue' ? aud.venue : aud.online);
  const goState = (ms: MState) => {
    mirrorState(ms); send({ cmd: 'state', ms });
    const name = STATES.find((y) => y.id === ms)?.name;
    log('State · ' + name, 'Every device moved to ' + name, 'swap_horiz', STATE_COLOR[ms]); say('Fans moved to ' + name, 'swap_horiz');
  };
  const goSeg = (i: number) => {
    mirrorState('live', i); send({ cmd: 'segment', seg: i });
    log('Segment · ' + cfg.segments[i].name, 'Live segment changed on every device', 'radio_button_checked'); say('Now: ' + cfg.segments[i].name, 'radio_button_checked');
  };
  const nextOf = (k: TriggerKind) => {
    const a = cfg.announcements[st.target] || [];
    return k === 'poll' ? (cfg.polls[st.ctr.poll % Math.max(cfg.polls.length, 1)]?.q || 'No polls set up') : k === 'hotspot' ? (cfg.hotspots[st.ctr.hotspot % Math.max(cfg.hotspots.length, 1)]?.name || 'No features set up') : k === 'announce' ? (a[st.ctr.announce % Math.max(a.length, 1)]?.title || 'No message for this audience') : st.revealed ? 'Replay the reveal moment' : cfg.reveal.triggerBlurb;
  };
  const fire = (kind: TriggerKind) => {
    const idx = kind === 'reveal' ? 0 : st.ctr[kind];
    const tgt = TARGETS.find((y) => y.id === st.target)!;
    const detail = nextOf(kind);
    mirrorTrigger(kind, idx);
    send({ cmd: 'trigger', kind, target: st.target, idx });
    const t = TRIGGERS.find((y) => y.id === kind)!;
    log(t.name + ' → ' + tgt.name, detail, t.icon, t.color);
    say(`${t.name} pushed to ${reach().toLocaleString()} devices`, t.icon);
  };
  const qStatus = (qid: string, status: string) => {
    set((x) => ({ questions: x.questions.map((q) => (q.id === qid ? { ...q, status, fresh: false } : q)) }));
    send({ cmd: 'qstatus', id: qid, status });
    say(status === 'ON STAGE' ? 'Question put on stage' : 'Question marked answered', status === 'ON STAGE' ? 'mic' : 'check_circle');
  };
  const sendReminder = () => {
    const rid = 'rem' + Date.now();
    const r = rsvp(cfg, st);
    const reachN = st.remTarget === 'all' ? r.total : st.remTarget === 'venue' ? r.venue : r.online;
    send({ cmd: 'reminder', id: rid, title: st.remTitle.trim() || 'Update', body: st.remText.trim(), target: st.remTarget });
    set((x) => ({ sent: [{ id: rid, title: x.remTitle.trim() || 'Update', target: x.remTarget, t: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), reach: reachN }, ...x.sent] }));
    log('Reminder sent', (st.remTitle.trim() || 'Update') + ' → ' + reachN.toLocaleString() + ' registered', 'notifications_active');
    say('Reminder sent to ' + reachN.toLocaleString() + ' registered attendees', 'notifications_active');
  };
  const P = { cfg, st, set, goState, goSeg, fire, nextOf, qStatus, aud, reach, say, sendReminder };
  const fan = fanPath(cfg.id);

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F2', color: '#1B0B2D', fontFamily: 'Archivo,-apple-system,system-ui,sans-serif' }}>
      <style>{ADMIN_CSS}</style>
      <header style={s('display:flex;align-items:center;gap:16px;padding:14px 44px;background:#FFFFFF;border-bottom:1px solid rgba(27,11,45,.08);position:sticky;top:0;z-index:20')}>
        <a href={homePath()} style={s('display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit')}><span style={s('width:30px;height:30px;border-radius:9px;background:#1B0B2D;display:flex;align-items:center;justify-content:center')}><img src={asset(cfg.brand.logo)} alt="" style={s('width:20px;height:20px;object-fit:contain')} /></span><span style={s("font:700 14px/1 'Archivo';letter-spacing:-.01em;white-space:nowrap")}>Connect Events</span></a>
        <span style={s('width:1px;height:22px;background:rgba(27,11,45,.12)')} />
        <a className="ah-ink" href={homePath()} style={s("display:flex;align-items:center;gap:6px;font:500 13px/1 'Archivo';color:#513E66;text-decoration:none;white-space:nowrap;max-width:240px;overflow:hidden;text-overflow:ellipsis")}><Ms size={16} color="inherit">arrow_back</Ms>{cfg.event.name}</a>
        <div style={s('display:flex;gap:4px;padding:4px;border-radius:12px;background:#F1F1EE;margin-left:12px')}>
          {LIFECYCLE.map(([k, n], i) => { const on = st.screen === k; return (
            <button key={k} onClick={() => set({ screen: k })} style={{ ...s("display:flex;align-items:center;gap:7px;padding:9px 13px;border-radius:9px;font:600 12px/1 'Archivo'"), background: on ? '#FFFFFF' : 'transparent', color: on ? '#1B0B2D' : '#513E66', boxShadow: on ? '0 1px 2px rgba(27,11,45,.08)' : 'none' }}><span style={{ ...s("width:17px;height:17px;border-radius:5px;display:flex;align-items:center;justify-content:center;font:700 9.5px/1 'Archivo'"), background: on ? '#1B0B2D' : '#E9E9E4', color: on ? '#F5F5F2' : '#513E66' }}>{i + 1}</span>{n}</button>
          ); })}
        </div>
        <span style={{ ...s("font:600 10px/1 'Archivo';letter-spacing:.12em;color:#F5F5F2;padding:7px 10px;border-radius:8px;margin-left:auto;white-space:nowrap"), background: STATE_COLOR[st.ms] }}>{st.ms === 'live' ? 'LIVE · ' + (cfg.segments[st.seg]?.short || '') : st.ms === 'community' ? 'ALWAYS ON' : st.ms.toUpperCase()}</span>
        <a className="ah" href={homePath() + '?edit=' + cfg.id} style={s("display:flex;align-items:center;gap:7px;padding:11px 13px;border-radius:12px;font:600 12.5px/1 'Archivo';color:#1B0B2D;box-shadow:inset 0 0 0 1px rgba(27,11,45,.14);text-decoration:none")}><Ms size={16} color="inherit">edit</Ms>Edit</a>
        <button className="ah" onClick={() => { window.open(fan, '_blank', 'noopener'); say('Fan view opened in a new tab', 'smartphone'); }} style={s("display:flex;align-items:center;gap:8px;padding:11px 15px;border-radius:12px;font:600 12.5px/1 'Archivo';color:#1B0B2D;box-shadow:inset 0 0 0 1px rgba(27,11,45,.14);white-space:nowrap")}><Ms size={16} color="inherit">open_in_new</Ms>Fan view</button>
      </header>
      {st.screen === 'plan' && <Plan cfg={cfg} />}
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

export const Card = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => <div style={{ ...s('padding:24px;background:#FFFFFF;border-radius:18px;box-shadow:0 1px 2px rgba(27,11,45,.05)'), ...style }}>{children}</div>;
export const Cap = ({ children }: { children: ReactNode }) => <span style={s("font:600 10.5px/1 'Archivo';letter-spacing:.14em;color:#513E66")}>{children}</span>;
export const Note = ({ children }: { children: ReactNode }) => <span style={s("font:500 11.5px/1 'Archivo';color:#513E66;margin-left:auto")}>{children}</span>;
const rsvp = (cfg: EventConfig, st: St) => { const venue = cfg.demo.rsvp.venue + st.regs.venue, online = cfg.demo.rsvp.online + st.regs.online; return { venue, online, total: venue + online }; };
const checkedIn = (cfg: EventConfig, st: St) => checkinsSeed(cfg, st.ms, st.seg) + st.checkins;
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
function Plan({ cfg }: { cfg: EventConfig }) {
  const tpl = { launch: 'Product launch', conference: 'Conference', fan: 'Fan event' }[cfg.event.template];
  return (
    <div style={s('padding:30px 44px 52px;animation:stFade .3s ease both;display:flex;flex-direction:column;gap:20px')}>
      <PageHead title="Plan" sub={`What fans see on the event page before it starts. Set up from the ${tpl} template.`}>
        <button className="ah" onClick={() => window.open(fanPath(cfg.id), '_blank', 'noopener')} style={s("display:flex;align-items:center;gap:8px;padding:12px 16px;border-radius:12px;font:600 12.5px/1 'Archivo';box-shadow:inset 0 0 0 1px rgba(27,11,45,.14)")}><Ms size={16} color="inherit">visibility</Ms>Preview event page</button>
        <a className="ah-ink-btn" href={homePath() + '?edit=' + cfg.id} style={s("display:flex;align-items:center;gap:8px;padding:12px 16px;border-radius:12px;background:#1B0B2D;font:600 12.5px/1 'Archivo';color:#F5F5F2;text-decoration:none")}><Ms size={16} color="#F5F5F2">edit</Ms>Edit in the builder</a>
      </PageHead>
      <div style={s('display:grid;grid-template-columns:1fr 1fr;gap:20px')}>
        <Card>
          <Cap>EVENT DETAILS</Cap>
          <div style={s("font:700 20px/1.2 'Archivo';margin-top:14px")}>{cfg.event.name}</div>
          <div style={s('display:flex;gap:6px;margin-top:10px')}>{[tpl, cfg.event.format, cfg.brand.name].map((c) => <span key={c} style={s("font:600 10.5px/1 'Archivo';color:#513E66;background:#F1F1EE;padding:6px 8px;border-radius:6px")}>{c}</span>)}</div>
          <div style={s('margin-top:8px')}>{cfg.event.details.map((d, i) => <div key={d.k + i} style={s('display:flex;gap:12px;padding:11px 0;border-bottom:1px solid rgba(27,11,45,.08)')}><Ms size={17} color="#826E99">{d.icon || 'info'}</Ms><span style={s("width:62px;flex:none;font:600 12px/1.4 'Archivo';color:#513E66")}>{d.k}</span><span style={s("flex:1;font:500 12.5px/1.4 'Archivo'")}>{d.v}</span></div>)}</div>
        </Card>
        <Card>
          <Cap>AGENDA</Cap>
          <div style={s('margin-top:8px')}>{cfg.segments.map((g) => <div key={g.id} style={s('display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid rgba(27,11,45,.08)')}><span style={s("width:46px;font:800 15px/1 'Archivo Black';font-variant-numeric:tabular-nums")}>{g.time}</span><span style={s("flex:1;font:600 13px/1 'Archivo'")}>{g.name}</span><span style={s("font:500 11px/1.3 'Archivo';color:#826E99;max-width:50%;text-align:right")}>{g.blurb}</span></div>)}</div>
        </Card>
        <Card>
          <Cap>PRESENTERS</Cap>
          <div style={s('display:flex;flex-direction:column;gap:10px;margin-top:14px')}>{cfg.presenters.map((p) => <div key={p.name} style={s('display:flex;align-items:center;gap:12px;padding:10px;border-radius:12px;background:#F1F1EE')}>{p.photo ? <img src={asset(p.photo)} alt="" style={s('width:40px;height:40px;border-radius:50%;object-fit:cover')} /> : <span style={s('width:40px;height:40px;border-radius:50%;background:#E9E9E4')} />}<span style={s('flex:1')}><span style={s("display:block;font:700 13px/1.2 'Archivo'")}>{p.name}</span><span style={s("display:block;font:400 11.5px/1.3 'Archivo';color:#513E66;margin-top:3px")}>{p.role}</span></span><span style={s("font:600 10.5px/1 'Archivo';color:#826E99")}>{p.slot}</span></div>)}</div>
        </Card>
        <Card>
          <div style={s('display:flex;align-items:center;gap:10px')}><Cap>SPONSORS</Cap><Demo /></div>
          <div style={s('display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px')}>{cfg.sponsors.map((n) => <div key={n} style={s("padding:18px 12px;border-radius:12px;background:#F1F1EE;text-align:center;font:800 14px/1 'Archivo';color:#513E66")}>{n}</div>)}</div>
          <div style={s("font:400 11.5px/1.45 'Archivo';color:#826E99;margin-top:12px")}>Shown as a partner strip at the foot of the event page.</div>
        </Card>
      </div>
    </div>
  );
}

// ════════════ 2 INVITE ════════════
function Invite({ cfg, st, set, say, sendReminder }: any) {
  const C = cfg as EventConfig;
  const r = rsvp(C, st);
  const url = abs(fanPath(C.id));
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
          <Stat label="IN VENUE" v={r.venue.toLocaleString()} sub={C.event.venue} />
          <Stat label="ONLINE" v={r.online.toLocaleString()} sub="Stream on the event page" />
        </div>
        <div style={s('display:flex;height:8px;border-radius:5px;overflow:hidden;margin-top:14px;background:#F1F1EE')}><span style={{ ...s('display:block;background:#1B0B2D'), width: (r.venue / Math.max(r.total, 1)) * 100 + '%' }} /><span style={s('display:block;flex:1;background:#8B3DF5')} /></div>
      </Card>
      <div style={s('display:grid;grid-template-columns:1.3fr 1fr;gap:20px;align-items:start')}>
        <Card>
          <div style={s('display:flex;align-items:center;gap:12px')}><Cap>SEND A REMINDER OR UPDATE</Cap><Note>Registered attendees only</Note></div>
          <div style={s('display:flex;flex-wrap:wrap;gap:6px;margin-top:14px')}>{C.reminders.map((x) => { const on = st.remTitle === x.title; return <button key={x.title} onClick={() => set({ remTitle: x.title, remText: x.body, remTarget: x.target })} style={{ ...s("font:600 11.5px/1 'Archivo';padding:9px 11px;border-radius:9px"), background: on ? '#1B0B2D' : '#F1F1EE', color: on ? '#F5F5F2' : '#1B0B2D' }}>{x.title}</button>; })}</div>
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
function Welcome({ cfg, st, aud }: any) {
  const C = cfg as EventConfig;
  const url = abs(fanPath(C.id) + '?checkin=hall');
  const [qr, setQr] = useState('');
  useEffect(() => { QRCode.toDataURL(url, { margin: 0, width: 300, color: { dark: '#1B0B2D', light: '#FFFFFF' } }).then(setQr, () => setQr('')); }, [url]);
  const r = rsvp(C, st); const c = checkedIn(C, st); const pct = Math.min(100, Math.round((c / Math.max(r.venue, 1)) * 100));
  const firstTime = C.segments[0]?.time || C.event.time;
  return (
    <div style={s('padding:30px 44px 52px;animation:stFade .3s ease both;display:flex;flex-direction:column;gap:20px')}>
      <PageHead title="Welcome" sub="Self check-in with one QR at the venue doors. Scanning checks the guest in and opens the live experience." />
      <div style={s('display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:start')}>
        <Card>
          <Cap>VENUE QR · {C.event.venueShort}</Cap>
          <div style={s('margin-top:14px;padding:16px;border-radius:14px;background:#FFFFFF;box-shadow:inset 0 0 0 1px rgba(27,11,45,.1)')}>{qr && <img src={qr} alt="Venue check-in QR" width={200} height={200} style={{ display: 'block' }} />}</div>
          <div style={s("font:400 11.5px/1.45 'Archivo';color:#513E66;margin-top:12px;max-width:232px")}>Print it once for every door. It opens the event page already checked in as an in-venue guest.</div>
        </Card>
        <Card>
          <div style={s('display:flex;align-items:center;gap:12px')}><span style={s('width:7px;height:7px;border-radius:50%;background:#C0473C;animation:stBlink 1.6s steps(1,end) infinite')} /><Cap>CHECKED IN VS REGISTERED</Cap><Demo /></div>
          <div style={s('display:flex;align-items:baseline;gap:12px;margin-top:18px')}><span style={s("font:800 56px/.9 'Archivo Black';font-variant-numeric:tabular-nums")}>{c.toLocaleString()}</span><span style={s("font:600 14px/1 'Archivo';color:#513E66")}>of {r.venue.toLocaleString()} registered for {C.event.venue}</span></div>
          <div style={s('height:14px;border-radius:8px;background:#F1F1EE;margin-top:18px;overflow:hidden')}><span style={{ ...s('display:block;height:14px;border-radius:8px;background:#8B3DF5;transition:width .6s ease'), width: pct + '%' }} /></div>
          <div style={s("display:flex;justify-content:space-between;font:600 12px/1 'Archivo';color:#513E66;margin-top:10px")}><span>{pct}% checked in</span><span>{Math.max(r.venue - c, 0).toLocaleString()} still to arrive</span></div>
          <div style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px')}>
            <Stat label="THIS SESSION" v={'+' + st.checkins} sub="QR scans from this browser" />
            <Stat label="DOORS" v={st.ms === 'before' ? 'Closed' : 'Open'} sub={st.ms === 'before' ? 'Open at ' + firstTime : 'Since ' + firstTime} />
            <Stat label="ONLINE NOW" v={aud.online.toLocaleString()} sub="No check-in needed" />
          </div>
        </Card>
      </div>
    </div>
  );
}

// ════════════ 4 ENGAGE ════════════
function Control({ cfg, st, set, goState, goSeg, fire, nextOf, qStatus, aud, reach }: any) {
  const C = cfg as EventConfig;
  const stripe = STATE_COLOR[st.ms as MState];
  const cd = Math.max(C.event.countdownSeconds - st.tick, 0);
  const onAir = st.ms === 'live' ? C.segments[st.seg]?.name : st.ms === 'before' ? 'Before the event' : st.ms === 'break' ? 'Break' : st.ms === 'after' ? 'After the event' : 'Always-on community';
  const label = C.event.countdownLabel.charAt(0) + C.event.countdownLabel.slice(1).toLowerCase();
  const sub = st.ms === 'before' ? label + ' ' + [Math.floor(cd / 3600), Math.floor(cd / 60) % 60, cd % 60].map((n) => String(n).padStart(2, '0')).join(':') : st.ms === 'live' ? (st.revealed ? 'Revealed · ' + C.reveal.title.toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'Not revealed yet') : st.ms === 'break' ? 'Quick poll and notes on screen' : st.ms === 'after' ? 'Recap, ' + C.cta.title.toLowerCase() + ' and follow' : 'Chat, IRIS, replay and next-event sign-up stay open';
  const total = aud.venue + aud.online;
  const n = C.segments.length;
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
                <span style={{ ...s('width:7px;height:7px;border-radius:50%;flex:none'), background: STATE_COLOR[x.id] }} />
              </button>
            ); })}
          </div>
        </Card>

        <Card>
          <div style={s('display:flex;align-items:center;gap:12px')}><Cap>LIVE SEGMENTS</Cap><Note>{st.ms === 'live' ? 'Jump to any segment' : 'Choosing a segment takes the event live'}</Note></div>
          <div style={{ ...s('display:grid;gap:12px;margin-top:16px'), gridTemplateColumns: `repeat(${Math.min(n, 5)},minmax(0,1fr))` }}>
            {C.segments.map((g, i) => { const on = st.ms === 'live' && st.seg === i; return (
              <button key={g.id} className="ah" onClick={() => goSeg(i)} style={{ ...s('display:flex;flex-direction:column;align-items:flex-start;gap:8px;padding:14px;border-radius:12px;text-align:left;min-width:0'), background: on ? '#F1F1EE' : '#FFFFFF', boxShadow: on ? 'inset 0 0 0 2px #C0473C' : 'inset 0 0 0 1px rgba(27,11,45,.12)' }}>
                <span style={s("font:600 10px/1 'Archivo';letter-spacing:.1em;color:#826E99;font-variant-numeric:tabular-nums")}>{g.time}{g.kind === 'reveal' ? ' · REVEAL' : g.kind === 'qa' ? ' · Q&A' : ''}</span>
                <span style={s('display:flex;align-items:center;gap:7px;width:100%')}><span style={s("flex:1;font:700 13.5px/1.15 'Archivo';color:#1B0B2D")}>{g.name}</span>{on && <span style={s('width:7px;height:7px;flex:none;border-radius:50%;background:#C0473C;animation:stBlink 1.4s steps(1,end) infinite')} />}</span>
              </button>
            ); })}
          </div>
          <button className="ah-ink-btn" onClick={() => goSeg(st.ms === 'live' ? Math.min(st.seg + 1, n - 1) : 0)} style={s("display:flex;align-items:center;justify-content:center;gap:10px;width:100%;margin-top:16px;padding:16px;border-radius:12px;background:#1B0B2D;font:700 13.5px/1 'Archivo';color:#F5F5F2")}>{st.ms !== 'live' ? 'Go live · ' + (C.segments[0]?.name || '') : st.seg < n - 1 ? 'Advance to ' + C.segments[st.seg + 1].name : 'On the last segment'}<Ms size={18} color="#F5F5F2">arrow_forward</Ms></button>
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
          <div style={s('display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:16px')}>
            {TRIGGERS.map((t) => (
              <button key={t.id} className="ah2" onClick={() => fire(t.id)} style={s('display:flex;flex-direction:column;align-items:flex-start;gap:10px;padding:16px;border-radius:12px;background:#F1F1EE;box-shadow:inset 0 0 0 1px rgba(27,11,45,.08);text-align:left;min-width:0')}>
                <Ms size={22} color={t.color}>{t.icon}</Ms>
                <span><span style={s("display:block;font:700 13.5px/1.2 'Archivo';color:#1B0B2D")}>{t.name}</span><span style={s("display:block;font:400 11px/1.35 'Archivo';color:#513E66;margin-top:5px")}>{nextOf(t.id)}</span></span>
              </button>
            ))}
          </div>
        </Card>

        {C.event.format !== 'In person' && (
          <Card>
            <div style={s('display:flex;align-items:center;gap:12px')}><Ms size={18} color="#C0473C">live_tv</Ms><Cap>LIVESTREAM</Cap><span style={s("font:600 9px/1 'Archivo';letter-spacing:.1em;color:#F5F5F2;background:#C0473C;padding:4px 6px;border-radius:5px")}>EMBED</span><Note>Check-in lives in Welcome</Note></div>
            <div style={s('display:flex;align-items:center;gap:8px;margin-top:14px;padding:11px 13px;border-radius:10px;background:#F1F1EE')}><Ms size={15} color="#826E99">link</Ms><span style={s("flex:1;min-width:0;font:500 12px/1.2 'Archivo';color:#513E66")}>youtube.com/embed/{C.id}-live</span><span style={s("font:600 10px/1 'Archivo';color:#826E99")}>PLACEHOLDER</span></div>
            <div style={s("font:400 11.5px/1.45 'Archivo';color:#513E66;margin-top:10px")}>Online fans see the organiser’s YouTube or Vimeo player above the panel. Connect embeds it and hosts no video. In-venue fans don’t get the player.</div>
          </Card>
        )}

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
                {q.status === 'QUEUED' && <button className="ah" onClick={() => qStatus(q.id, 'ON STAGE')} style={s("display:flex;align-items:center;gap:6px;padding:9px 12px;border-radius:10px;font:600 11.5px/1 'Archivo';background:#FFFFFF;box-shadow:inset 0 0 0 1px rgba(27,11,45,.14);white-space:nowrap")}><Ms size={15} color="inherit">mic</Ms>Put on stage</button>}
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
          <div style={s("display:flex;justify-content:space-between;font:500 10.5px/1 'Archivo';color:#513E66;margin-top:8px")}><span>{total ? Math.round((aud.venue / total) * 100) : 0}% in venue</span><span>{total ? Math.round((aud.online / total) * 100) : 100}% online</span></div>
        </Card>
        <Card>
          <div style={s('display:flex;align-items:center;gap:10px')}><span style={s('width:7px;height:7px;border-radius:50%;background:#C0473C;animation:stBlink 1.6s steps(1,end) infinite')} /><Cap>LIVE MONITOR</Cap>
            <div style={s('display:flex;gap:3px;padding:3px;border-radius:9px;background:#F1F1EE;margin-left:auto')}>
              {(['online', 'venue'] as Mode[]).map((m) => { const on = st.monitor === m; return <button key={m} onClick={() => set({ monitor: m })} style={{ ...s("padding:6px 9px;border-radius:7px;font:600 10.5px/1 'Archivo'"), background: on ? '#FFFFFF' : 'transparent', color: on ? '#1B0B2D' : '#513E66' }}>{m === 'online' ? 'Online fan' : 'In-venue fan'}</button>; })}
            </div>
          </div>
          <div style={s('margin-top:16px;padding:10px;background:#100E0A;border-radius:20px')}>
            <iframe key={st.monitor} title="Live fan monitor" src={fanPath(C.id) + '?embed=1&theme=dark&mode=' + st.monitor} style={{ width: '100%', height: 640, border: 0, borderRadius: 12, background: '#100E0A', display: 'block' }} />
          </div>
        </Card>
        <IrisFacts cfg={C} />
        <Card>
          <Cap>BROADCAST LOG</Cap>
          <div style={s('display:flex;flex-direction:column;gap:8px;margin-top:12px;max-height:260px;overflow-y:auto')}>
            {st.log.length === 0 && <div style={s("font:400 11.5px/1.5 'Archivo';color:#826E99;padding:4px 0")}>Nothing yet. Change state or fire a trigger, and fan actions land here too.</div>}
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

// IRIS answers from this fixed list only, so the organiser can see exactly what it will say.
function IrisFacts({ cfg }: { cfg: EventConfig }) {
  const facts = [...cfg.iris.pre, ...cfg.iris.live];
  return (
    <Card>
      <div style={s('display:flex;align-items:center;gap:10px')}><span style={s('width:7px;height:7px;background:#8B3DF5')} /><Cap>IRIS · APPROVED FACTS</Cap><Note>{facts.length + cfg.hotspots.length} answers</Note></div>
      <div style={s("font:400 11.5px/1.45 'Archivo';color:#513E66;margin-top:10px")}>IRIS answers only from this list and the feature facts. Anything else is sent to the Q&amp;A. Answers marked “after reveal” stay hidden until the reveal.</div>
      <div style={s('display:flex;flex-direction:column;gap:6px;margin-top:12px;max-height:200px;overflow-y:auto')}>
        {facts.map((f, i) => <div key={f.q + i} style={s('display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:10px;background:#F1F1EE')}><Ms size={14} color="#8B3DF5">verified</Ms><span style={s("flex:1;font:600 11.5px/1.25 'Archivo'")}>{f.q}</span><span style={s("font:700 11px/1 'Archivo';color:#513E66")}>{i >= cfg.iris.pre.length ? 'after reveal' : f.stat}</span></div>)}
      </div>
    </Card>
  );
}

// ════════════ 5 IMPROVE ════════════
function Results({ cfg, st }: any) {
  const C = cfg as EventConfig; const R = C.demo.results;
  const venuePeak = Math.max(...C.demo.venueBySeg, 0), onlinePeak = Math.max(...C.demo.onlineBySeg, 0);
  const attend = venuePeak + onlinePeak;
  const liveQs = st.questions.filter((q: Q) => q.fresh !== undefined).length;
  const reacts = R.reactions + st.reacts.reduce((a: number, b: number) => a + b, 0);
  const conv = R.conversions + st.drives.length;
  const r = rsvp(C, st);
  const checked = checkedIn(C, st);
  const rate = Math.round((checked / Math.max(r.venue, 1)) * 100);
  const kpis = [
    { label: 'ATTENDANCE', v: attend.toLocaleString(), icon: 'groups', sub: `${venuePeak.toLocaleString()} in venue · ${onlinePeak.toLocaleString()} online` },
    { label: 'REACTIONS', v: (reacts / 1000).toFixed(1) + 'k', icon: 'favorite', sub: 'Peak during the reveal' },
    { label: 'QUESTIONS', v: String(R.questions + liveQs), icon: 'help', sub: R.answered + ' answered on stage' },
    { label: R.conversionLabel, v: String(conv), icon: 'event_available', sub: (conv / Math.max(attend / 100, 1)).toFixed(1) + '% of attendees' },
  ];
  const kpis2 = [
    { label: 'REGISTRATIONS', v: r.total.toLocaleString(), icon: 'how_to_reg', sub: `${r.venue.toLocaleString()} in person · ${r.online.toLocaleString()} online` },
    { label: 'CHECK-IN RATE', v: rate + '%', icon: 'qr_code_scanner', sub: `${checked.toLocaleString()} of ${r.venue.toLocaleString()} in-person registrations` },
    { label: 'JOINED MORE THAN ONE EVENT', v: R.multiEvent.total.toLocaleString(), icon: 'repeat', sub: Math.round((R.multiEvent.total / Math.max(attend, 1)) * 100) + '% of attendees' },
  ];
  const segBars = R.engagement.map((e, i) => ({ ...e, pct: Math.min(99, e.pct + Math.min(6, st.reacts[i] || 0)) }));
  const topQs = [...st.questions].sort((a: Q, b: Q) => b.votes - a.votes).slice(0, 5);
  const byOpt = R.conversionsBy.map((d) => ({ ...d, n: d.n + st.drives.filter((x: any) => x.showroom === d.name).length }));
  const maxOpt = Math.max(...byOpt.map((d) => d.n), 1);
  const maxMulti = Math.max(...R.multiEvent.rows.map((x) => x.n), 1);
  const bar = (pct: number, bg = '#8B3DF5') => <div style={s('height:10px;border-radius:6px;background:#F1F1EE;margin-top:9px;overflow:hidden')}><span style={{ ...s('display:block;height:10px;border-radius:6px;transition:width .8s cubic-bezier(.2,.8,.2,1)'), width: pct + '%', background: bg }} /></div>;
  const kpi = (k: { label: string; v: string; icon: string; sub: string }, big = true) => (
    <div key={k.label} style={s('padding:' + (big ? '24px' : '22px 24px') + ';background:#FFFFFF;border-radius:18px;box-shadow:0 1px 2px rgba(27,11,45,.05);animation:stRise .4s ease both')}>
      <div style={s('display:flex;align-items:center;gap:9px')}><Ms color="#826E99">{k.icon}</Ms><span style={s("font:600 10.5px/1 'Archivo';letter-spacing:.13em;color:#826E99")}>{k.label}</span></div>
      <div style={s("font:800 " + (big ? 40 : 34) + "px/.92 'Archivo Black';margin-top:" + (big ? 16 : 14) + 'px')}>{k.v}</div>
      <div style={s("font:400 11.5px/1.3 'Archivo';color:#826E99;margin-top:" + (big ? 12 : 10) + 'px')}>{k.sub}</div>
    </div>
  );
  return (
    <div style={s('padding:34px 44px 52px;animation:stFade .3s ease both')}>
      <div style={s('display:flex;align-items:flex-end;gap:20px')}>
        <div style={s('flex:1')}><h1 style={s("display:flex;align-items:center;gap:12px;font:700 32px/1.05 'Archivo';letter-spacing:-.022em;margin:0")}>Results <Demo /></h1><p style={s("font:400 14px/1.5 'Archivo';color:#513E66;margin:9px 0 0")}>{C.event.name} · {C.event.venue}{C.event.format === 'Hybrid' ? ', and online' : ''} · includes actions from this session.</p></div>
        <div style={s('display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:11px;background:#FFFFFF;box-shadow:0 1px 2px rgba(27,11,45,.05)')}><Ms size={16} color="#8B3DF5">check_circle</Ms><span style={s("font:600 12px/1 'Archivo';color:#513E66")}>{r.total.toLocaleString()} registered · {(st.follows + R.follows).toLocaleString()} new followers · {(R.votes + st.votes).toLocaleString()} poll votes</span></div>
      </div>
      <div style={s('display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-top:24px')}>{kpis.map((k) => kpi(k))}</div>
      <div style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:20px')}>{kpis2.map((k) => kpi(k, false))}</div>
      {R.multiEvent.rows.length > 0 && (
        <Card style={{ marginTop: 20 }}>
          <div style={s('display:flex;align-items:center;gap:10px')}><Ms size={19} color="#1B0B2D">repeat</Ms><span style={s("font:700 16px/1 'Archivo';letter-spacing:-.012em")}>Attendees across events</span><span style={s("font:400 12px/1 'Archivo';color:#826E99;margin-left:auto")}>People who joined more than one {C.brand.name} event</span></div>
          <div style={{ ...s('display:grid;gap:16px;margin-top:18px'), gridTemplateColumns: `repeat(${R.multiEvent.rows.length},1fr)` }}>
            {R.multiEvent.rows.map((x) => <div key={x.name}><div style={s('display:flex;align-items:center;gap:9px')}><span style={s("font:600 13px/1.3 'Archivo';flex:1")}>{x.name}</span><span style={s("font:700 13px/1 'Archivo';font-variant-numeric:tabular-nums")}>{x.n.toLocaleString()}</span></div>{bar((x.n / maxMulti) * 100)}</div>)}
          </div>
        </Card>
      )}
      <div style={s('display:grid;grid-template-columns:1.2fr 1fr;gap:20px;margin-top:20px')}>
        <Card>
          <div style={s('display:flex;align-items:center;gap:10px')}><Ms size={19} color="#1B0B2D">bar_chart</Ms><span style={s("font:700 16px/1 'Archivo';letter-spacing:-.012em")}>Engagement per segment</span><span style={s("font:400 12px/1 'Archivo';color:#826E99;margin-left:auto")}>Share of the audience who interacted</span></div>
          <div style={s('margin-top:22px;display:flex;flex-direction:column;gap:16px')}>
            {segBars.map((e) => <div key={e.seg}><div style={s('display:flex;align-items:center;gap:9px')}><span style={s("font:600 13px/1 'Archivo';flex:1")}>{e.seg}</span><span style={s("font:700 13px/1 'Archivo';font-variant-numeric:tabular-nums")}>{e.pct}%</span></div>{bar(e.pct, e.pct >= 90 ? '#1B0B2D' : e.pct > 60 ? '#8B3DF5' : '#C4C4C0')}</div>)}
          </div>
        </Card>
        <Card>
          <div style={s('display:flex;align-items:center;gap:10px')}><Ms size={19} color="#1B0B2D">event_available</Ms><span style={s("font:700 16px/1 'Archivo';letter-spacing:-.012em")}>{C.cta.title}</span><span style={s("font:400 12px/1 'Archivo';color:#826E99;margin-left:auto")}>By {C.cta.optionsLabel.toLowerCase()}</span></div>
          <div style={s('margin-top:22px;display:flex;flex-direction:column;gap:16px')}>
            {byOpt.map((d) => <div key={d.name}><div style={s('display:flex;align-items:center;gap:9px')}><span style={s("font:600 13px/1 'Archivo';flex:1")}>{d.name}</span><span style={s("font:700 13px/1 'Archivo';font-variant-numeric:tabular-nums")}>{d.n}</span></div>{bar((d.n / maxOpt) * 100)}</div>)}
          </div>
          {st.drives.length > 0 && (
            <div style={s('margin-top:20px;padding-top:16px;border-top:1px solid rgba(27,11,45,.08);display:flex;flex-direction:column;gap:8px')}>
              <Cap>FROM THIS SESSION</Cap>
              {st.drives.map((d: any, i: number) => <div key={i} style={s('display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:11px;background:#F1F1EE')}><Ms size={15} color="#8B3DF5">{d.where === 'venue' ? 'location_on' : 'wifi'}</Ms><span style={s("flex:1;font:600 12px/1.3 'Archivo'")}>{[d.showroom, d.slot].filter(Boolean).join(' · ')}</span><span style={s("font:500 10.5px/1 'Archivo';color:#513E66")}>{d.t}</span></div>)}
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

export const ADMIN_CSS = `
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
