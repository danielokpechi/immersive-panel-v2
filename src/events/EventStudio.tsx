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
  sponsorOf, ticketUrl,
  getEvent, audience, checkinsSeed, channelName, fanPath, homePath, abs, asset, STATES, TARGETS, revealSegIndex, qaSegIndex,
  LEAD_STATUSES, leadScore, leadTier, scoreParts, routeFor,
  type EventConfig, type Ms as MState, type Mode, type Target, type TriggerKind, type Lead, type LeadStatus,
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
  { id: 'challenge', name: 'Challenge', icon: 'emoji_events', color: '#8B3DF5' },
];
const LIFECYCLE = [['plan', 'Plan'], ['invite', 'Invite'], ['welcome', 'Welcome'], ['control', 'Engage'], ['leads', 'Follow up'], ['results', 'Improve']] as const;
type Screen = (typeof LIFECYCLE)[number][0];

type Q = { id: string; text: string; who: string; where: Mode; votes: number; status: string; fresh?: boolean };
type Log = { id: number; name: string; detail: string; icon: string; color: string; t: string };
interface St {
  screen: Screen;
  sent: { id: string; title: string; target: Target; t: string; reach: number }[]; remText: string; remTitle: string; remTarget: Target; copied: boolean;
  checkins: number; ms: MState; seg: number; revealed: boolean; poll: number | null;
  target: Target; ctr: { poll: number; hotspot: number; announce: number; challenge: number };
  tix: { clicks: number; crews: Record<string, number> }; chDone: Record<string, number>; spTaps: Record<string, number>; spViews: Record<string, number>; claims: number;
  tick: number; clock: number; log: Log[]; toast: string | null; toastIcon: string;
  questions: Q[]; regs: { venue: number; online: number }; drives: { showroom: string; slot: string; where: Mode; t: string }[];
  reacts: number[]; votes: number; follows: number; monitor: Mode;
  me: Lead | null; leadEdits: Record<string, { route?: string; status?: LeadStatus; sent?: boolean }>; leadSel: string | null; leadFilter: string;
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
    ms: 'before', seg: 0, revealed: false, poll: null, target: 'all', ctr: { poll: 0, hotspot: 0, announce: 0, challenge: 0 },
    tix: { clicks: 0, crews: {} }, chDone: {}, spTaps: {}, spViews: {}, claims: 0,
    tick: 0, clock: 0, log: [], toast: null, toastIcon: 'bolt',
    questions: cfg.qaSeed.map((q) => ({ ...q, status: 'QUEUED' })), regs: { venue: 0, online: 0 }, drives: [],
    reacts: cfg.segments.map(() => 0), votes: 0, follows: 0, monitor: cfg.event.format === 'In person' ? 'venue' : 'online',
    me: null, leadEdits: {}, leadSel: null, leadFilter: 'All',
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
      case 'ticket': set((p) => ({ tix: { clicks: p.tix.clicks + 1, crews: m.crew ? { ...p.tix.crews, [m.crew]: (p.tix.crews[m.crew] || 0) + 1 } : p.tix.crews } })); log('Ticket link opened', m.crew ? 'With crew code · ' + m.crew : 'With a personal referral code', 'confirmation_number'); say('A fan opened the ticket link', 'confirmation_number'); break;
      case 'challenge': set((p) => ({ chDone: { ...p.chDone, [m.id]: (p.chDone[m.id] || 0) + 1 } })); log('Challenge completed', (cfg.challenges?.find((c) => c.id === m.id)?.title || m.id) + ' · +' + m.pts + ' pts', 'emoji_events'); break;
      case 'claim': set((p) => ({ claims: p.claims + 1 })); log('Reward claimed', m.name, 'redeem'); say('Reward claimed · ' + m.name, 'redeem'); break;
      case 'sponsor': if (m.what === 'tap') set((p) => ({ spTaps: { ...p.spTaps, [m.name]: (p.spTaps[m.name] || 0) + 1 } })); else set((p) => ({ spViews: { ...p.spViews, [m.name]: (p.spViews[m.name] || 0) + 1 } })); break;
      case 'profile': if (!x.me) { log('New lead', 'A fan registered interest from this browser', 'person_add'); say('New lead · see Follow up', 'person_add'); } set({ me: m.lead }); break;
      case 'trigger': mirrorTrigger(m.kind, m.idx || 0); if (m.from === 'fan') log(TRIGGERS.find((y) => y.id === m.kind)?.name || m.kind, 'Fired from the fan demo strip · ' + TARGETS.find((y) => y.id === m.target)?.name, 'bolt'); break;
    }
  };
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const ch = new BroadcastChannel(channelName(cfg.id));
    chan.current = ch;
    ch.onmessage = (e) => bus.current(e.data);
    ch.postMessage({ cmd: 'who' }); // an open fan tab replies with its profile
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
    if (kind === 'challenge') return { ctr: { ...x.ctr, challenge: idx + 1 } };
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
    const by = (sp?: string) => (sp ? ' · by ' + sp : '');
    if (k === 'poll') { const p = cfg.polls[st.ctr.poll % Math.max(cfg.polls.length, 1)]; return p ? p.q + by(p.sponsor) : 'No polls set up'; }
    if (k === 'announce') { const m = a[st.ctr.announce % Math.max(a.length, 1)]; return m ? m.title + by(m.sponsor) : 'No message for this audience'; }
    if (k === 'challenge') { const C = cfg.challenges || []; const c = C[st.ctr.challenge % Math.max(C.length, 1)]; return c ? c.title + ' · +' + c.points + by(c.sponsor) : 'No challenges set up'; }
    return k === 'hotspot' ? (cfg.hotspots[st.ctr.hotspot % Math.max(cfg.hotspots.length, 1)]?.name || 'No features set up') : st.revealed ? 'Replay the reveal moment' : cfg.reveal.triggerBlurb;
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
  // Follow-up for one lead. When it's this browser's fan, it lands on their event page as an update.
  const sendFollowUp = (l: Lead, text: string, routeName: string) => {
    set((x) => ({ leadEdits: { ...x.leadEdits, [l.id]: { ...x.leadEdits[l.id], sent: true, status: (x.leadEdits[l.id]?.status || l.status) === 'New' ? 'Contacted' : x.leadEdits[l.id]?.status || l.status } } }));
    if (l.id === 'ME') send({ cmd: 'reminder', id: 'fu' + Date.now(), title: 'A message from ' + routeName, body: text, target: 'all' });
    log('Follow-up sent', l.name + ' · ' + routeName, 'send');
    say('Follow-up sent to ' + (l.id === 'ME' ? 'the fan in this browser' : l.name.split(' ')[0]), 'send');
  };
  const P = { cfg, st, set, goState, goSeg, fire, nextOf, qStatus, aud, reach, say, sendReminder, sendFollowUp };
  const fan = fanPath(cfg.id);

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F2', color: '#1B0B2D', fontFamily: 'Archivo,-apple-system,system-ui,sans-serif' }}>
      <style>{ADMIN_CSS}</style>
      <header style={s('display:flex;align-items:center;gap:16px;padding:14px 44px;background:#FFFFFF;border-bottom:1px solid rgba(27,11,45,.08);position:sticky;top:0;z-index:20')}>
        <a href={homePath()} style={s('display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit')}><span style={s('width:30px;height:30px;border-radius:9px;background:#1B0B2D;display:flex;align-items:center;justify-content:center')}><img src={asset(cfg.brand.logo)} alt="" style={s('width:20px;height:20px;object-fit:contain')} /></span><span style={s("font:700 14px/1 'Archivo';letter-spacing:-.01em;white-space:nowrap")}>Connect Events</span></a>
        <span style={s('width:1px;height:22px;background:rgba(27,11,45,.12)')} />
        <a className="ah-ink" href={homePath()} style={s("display:flex;align-items:center;gap:6px;font:500 13px/1 'Archivo';color:#513E66;text-decoration:none;white-space:nowrap;max-width:240px;overflow:hidden;text-overflow:ellipsis")}><Ms size={16} color="inherit">arrow_back</Ms>{cfg.event.name}</a>
        <div style={s('display:flex;gap:4px;padding:4px;border-radius:12px;background:#F1F1EE;margin-left:12px')}>
          {LIFECYCLE.filter(([k]) => k !== 'leads' || cfg.interest || cfg.demo.leads?.length).map(([k, n], i) => { const on = st.screen === k; return (
            <button key={k} onClick={() => set({ screen: k })} style={{ ...s("display:flex;align-items:center;gap:7px;padding:9px 11px;white-space:nowrap;border-radius:9px;font:600 12px/1 'Archivo'"), background: on ? '#FFFFFF' : 'transparent', color: on ? '#1B0B2D' : '#513E66', boxShadow: on ? '0 1px 2px rgba(27,11,45,.08)' : 'none' }}><span style={{ ...s("width:17px;height:17px;border-radius:5px;display:flex;align-items:center;justify-content:center;font:700 9.5px/1 'Archivo'"), background: on ? '#1B0B2D' : '#E9E9E4', color: on ? '#F5F5F2' : '#513E66' }}>{i + 1}</span>{n}</button>
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
      {st.screen === 'leads' && <Leads {...P} />}
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
  const tpl = { launch: 'Product launch', conference: 'Conference', fan: 'Fan event', sport: 'Sports event' }[cfg.event.template];
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
      {C.tickets && <TicketsCard cfg={C} st={st} />}
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

// Ticket link clicks and referrals (each attendee and each crew has a code).
function TicketsCard({ cfg, st }: { cfg: EventConfig; st: St }) {
  const T = cfg.tickets!; const R = cfg.demo.results.tickets || { clicks: 0, sales: 0, top: [] };
  const clicks = R.clicks + st.tix.clicks;
  const top = [...R.top, ...Object.entries(st.tix.crews).map(([name, n]) => ({ name: name + ' (this session)', crew: true, clicks: n, sales: 0 }))].sort((a, b) => b.clicks - a.clicks).slice(0, 6);
  const maxC = Math.max(...top.map((x) => x.clicks), 1);
  return (
    <Card>
      <div style={s('display:flex;align-items:center;gap:12px')}><Ms size={17} color="#8B3DF5">confirmation_number</Ms><Cap>TICKETS · CLICKS AND REFERRALS</Cap><Demo /><Note>Ticketing stays with {T.sub.replace(/^official /i, 'the official ').toLowerCase()}</Note></div>
      <div style={s('display:flex;align-items:center;gap:12px;margin-top:14px;padding:12px 14px;border-radius:12px;background:#F1F1EE')}>
        <Ms size={16} color="#513E66">link</Ms><span style={s("flex:1;min-width:0;font:500 12.5px/1 'Archivo';overflow:hidden;text-overflow:ellipsis;white-space:nowrap")}>{ticketUrl(cfg, 'CODE')}</span><span style={s("font:600 10.5px/1 'Archivo';color:#826E99")}>Every fan and crew gets their own code</span>
      </div>
      <div style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:14px')}>
        <Stat label="TICKET LINK CLICKS" v={clicks.toLocaleString()} sub={st.tix.clicks ? '+' + st.tix.clicks + ' from this session' : 'From the event page'} />
        <Stat label="SALES FROM REFERRALS" v={R.sales.toLocaleString()} sub="Reported back by ticketing" />
        <Stat label="CLICK TO SALE" v={((R.sales / Math.max(clicks, 1)) * 100).toFixed(1) + '%'} sub="Referral codes only" />
      </div>
      <div style={s('margin-top:16px')}><Cap>TOP REFERRERS</Cap></div>
      <div style={s('display:flex;flex-direction:column;gap:8px;margin-top:10px')}>
        {top.map((x) => (
          <div key={x.name} style={s('display:grid;grid-template-columns:1.4fr 70px 2fr 70px 70px;gap:12px;align-items:center')}>
            <span style={s("font:600 12.5px/1.2 'Archivo';white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{x.name}</span>
            <span style={{ ...s("font:600 9.5px/1 'Archivo';letter-spacing:.08em;padding:5px 6px;border-radius:6px;text-align:center"), background: x.crew ? '#1B0B2D' : '#F1F1EE', color: x.crew ? '#F5F5F2' : '#513E66' }}>{x.crew ? 'CREW' : 'FAN'}</span>
            <span style={s('height:8px;border-radius:5px;background:#F1F1EE;overflow:hidden')}><span style={{ ...s('display:block;height:8px;background:#8B3DF5'), width: (x.clicks / maxC) * 100 + '%' }} /></span>
            <span style={s("font:600 12px/1 'Archivo';text-align:right;font-variant-numeric:tabular-nums")}>{x.clicks} clicks</span>
            <span style={s("font:700 12px/1 'Archivo';text-align:right;font-variant-numeric:tabular-nums")}>{x.sales} sold</span>
          </div>
        ))}
      </div>
    </Card>
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
          {(C.days?.length ? C.days.map((d, di) => ({ d, di })) : [{ d: null, di: 0 }]).map(({ d, di }) => { const segs = C.segments.map((g, i) => ({ g, i })).filter(({ g }) => !C.days?.length || (g.day ?? 0) === di); return (
          <div key={di}>
          {d && <div style={s("display:flex;align-items:baseline;gap:10px;margin-top:16px;font:700 12px/1 'Archivo'")}><span>{d.label}</span><span style={s("font:500 11px/1 'Archivo';color:#826E99")}>{d.date} · {d.sub}</span></div>}
          <div style={{ ...s('display:grid;gap:12px;margin-top:' + (d ? '10px' : '16px')), gridTemplateColumns: `repeat(${Math.min(Math.max(segs.length, d ? 4 : 1), 5)},minmax(0,1fr))` }}>
            {segs.map(({ g, i }) => { const on = st.ms === 'live' && st.seg === i; return (
              <button key={g.id} className="ah" onClick={() => goSeg(i)} style={{ ...s('display:flex;flex-direction:column;align-items:flex-start;gap:8px;padding:14px;border-radius:12px;text-align:left;min-width:0'), background: on ? '#F1F1EE' : '#FFFFFF', boxShadow: on ? 'inset 0 0 0 2px #C0473C' : 'inset 0 0 0 1px rgba(27,11,45,.12)' }}>
                <span style={s("font:600 10px/1 'Archivo';letter-spacing:.1em;color:#826E99;font-variant-numeric:tabular-nums")}>{g.time}{g.kind === 'reveal' ? ' · REVEAL' : g.kind === 'qa' ? ' · Q&A' : ''}</span>
                <span style={s('display:flex;align-items:center;gap:7px;width:100%')}><span style={s("flex:1;font:700 13.5px/1.15 'Archivo';color:#1B0B2D")}>{g.name}</span>{on && <span style={s('width:7px;height:7px;flex:none;border-radius:50%;background:#C0473C;animation:stBlink 1.4s steps(1,end) infinite')} />}</span>
              </button>
            ); })}
          </div>
          </div>
          ); })}
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
          <div style={{ ...s('display:grid;gap:12px;margin-top:16px'), gridTemplateColumns: `repeat(${C.challenges?.length ? 5 : 4},minmax(0,1fr))` }}>
            {TRIGGERS.filter((t) => t.id !== 'challenge' || C.challenges?.length).map((t) => (
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

// ════════════ 5 FOLLOW UP ════════════
// One consented profile per person, scored on what they did and routed to the
// nearest showroom (or the right demo format), with a drafted follow-up.
const TIER_COLOR: Record<string, [string, string]> = { Hot: ['#C0473C', '#FFFFFF'], Warm: ['#8B3DF5', '#FFFFFF'], Cold: ['#E9E9E4', '#513E66'] };
const STATUS_COLOR: Record<string, string> = { New: '#8B3DF5', Contacted: '#513E66', Booked: '#2F7A68', Reserved: '#1B0B2D', Sold: '#1B0B2D', 'Not now': '#A79BB5' };
const optName = (cfg: EventConfig, id: string) => cfg.cta.options.find((o) => o.id === id)?.name || id;
function draftFor(cfg: EventConfig, l: Lead, routeName: string) {
  const F = cfg.followUp; if (!F) return '';
  const first = l.id === 'ME' ? 'there' : l.name.split(' ')[0];
  const feature = cfg.hotspots.find((h) => h.id === l.seen?.[0])?.name || '';
  let extra = '';
  if (l.variant && l.colour && F.extraBuilt) extra += F.extraBuilt.replace('{variant}', l.variant).replace('{colour}', l.colour);
  if (l.monthly && F.extraFinance) extra += F.extraFinance.replace('{monthly}', l.monthly);
  else if (feature && F.extraFeature) extra += F.extraFeature.replace('{feature}', feature);
  return F.template.replace('{first}', first).replace('{extra}', extra).replace('{route}', routeName).replace('{model}', l.answers.model || '');
}

function Leads({ cfg, st, set, sendFollowUp }: any) {
  const C = cfg as EventConfig;
  const base: Lead[] = [...(st.me ? [st.me as Lead] : []), ...(C.demo.leads || [])];
  const leads = base.map((l) => { const e = st.leadEdits[l.id] || {}; const score = leadScore(l); return { ...l, route: e.route || l.route, status: (e.status || l.status) as LeadStatus, sent: !!e.sent, score, tier: leadTier(score) }; });
  const shown = leads.filter((l) => st.leadFilter === 'All' || l.tier === st.leadFilter);
  const sel = leads.find((l) => l.id === st.leadSel) || shown[0] || leads[0];
  const LQ = C.demo.results.leadQuality || [];
  const tot = LQ.reduce((a, r) => ({ hot: a.hot + r.hot, warm: a.warm + r.warm, cold: a.cold + r.cold }), { hot: 0, warm: 0, cold: 0 });
  const sessionHot = leads.filter((l) => l.id === 'ME' && l.tier === 'Hot').length;
  const total = tot.hot + tot.warm + tot.cold + (st.me ? 1 : 0);
  const sent = Object.values(st.leadEdits as Record<string, { sent?: boolean }>).filter((e) => e.sent).length;
  const fields = C.interest?.fields || [];
  const edit = (id: string, p: Record<string, unknown>) => set((x: St) => ({ leadEdits: { ...x.leadEdits, [id]: { ...x.leadEdits[id], ...p } } }));
  const kpis = [
    { label: 'LEADS', v: total.toLocaleString(), sub: 'Registered with interest answers' },
    { label: 'HOT', v: (tot.hot + sessionHot).toLocaleString(), sub: 'Score 60+ · ready for a call' },
    { label: 'WARM', v: tot.warm.toLocaleString(), sub: 'Score 35–59 · nurture' },
    { label: 'ROUTED', v: '100%', sub: 'Every lead has a ' + C.cta.optionsLabel.toLowerCase() },
    { label: 'FOLLOW-UPS SENT', v: String(sent), sub: 'From this session' },
  ];
  if (!leads.length) return (
    <div style={s('padding:30px 44px 52px')}><PageHead title="Follow up" sub="Leads appear here once people register interest." /></div>
  );
  const routeName = optName(C, sel.route);
  const draft = draftFor(C, sel, routeName);
  const matched = routeFor(C, sel.answers);
  const pill = (t: string) => <span style={{ ...s("font:700 9.5px/1 'Archivo';letter-spacing:.08em;padding:5px 7px;border-radius:6px;white-space:nowrap"), background: TIER_COLOR[t][0], color: TIER_COLOR[t][1] }}>{t.toUpperCase()}</span>;
  return (
    <div style={s('padding:30px 44px 52px;animation:stFade .3s ease both;display:flex;flex-direction:column;gap:20px')}>
      <PageHead title={<>Follow up <Demo /></>} sub={`Every registration builds one consented profile. Leads are scored on what they did during the event and routed to the best-matched ${C.cta.optionsLabel.toLowerCase()}.`} />
      <div style={s('display:grid;grid-template-columns:repeat(5,1fr);gap:12px')}>{kpis.map((k) => <Stat key={k.label} label={k.label} v={k.v} sub={k.sub} />)}</div>
      <div style={s('display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:20px;align-items:start')}>
        <Card>
          <div style={s('display:flex;align-items:center;gap:12px')}>
            <Cap>LATEST LEADS</Cap>
            <div style={s('display:flex;gap:3px;padding:3px;border-radius:9px;background:#F1F1EE;margin-left:auto')}>
              {['All', 'Hot', 'Warm', 'Cold'].map((f) => { const on = st.leadFilter === f; return <button key={f} onClick={() => set({ leadFilter: f })} style={{ ...s("padding:7px 11px;border-radius:7px;font:600 11px/1 'Archivo'"), background: on ? '#FFFFFF' : 'transparent', color: on ? '#1B0B2D' : '#513E66' }}>{f}</button>; })}
            </div>
          </div>
          <div style={s('display:flex;flex-direction:column;gap:6px;margin-top:14px')}>
            {shown.map((l) => { const on = l.id === sel.id; const sg = l.signals; return (
              <button key={l.id} onClick={() => set({ leadSel: l.id })} className="ah" style={{ ...s('display:flex;align-items:center;gap:13px;padding:11px 12px;border-radius:12px;text-align:left;width:100%'), background: on ? '#F1F1EE' : l.id === 'ME' ? '#F7F2FE' : '#FFFFFF', boxShadow: on ? 'inset 0 0 0 2px #1B0B2D' : 'inset 0 0 0 1px rgba(27,11,45,.08)' }}>
                <span style={{ ...s("width:40px;height:40px;flex:none;border-radius:10px;display:flex;align-items:center;justify-content:center;font:800 15px/1 'Archivo Black';font-variant-numeric:tabular-nums"), background: TIER_COLOR[l.tier][0], color: TIER_COLOR[l.tier][1] }}>{l.score}</span>
                <span style={s('flex:1;min-width:0')}>
                  <span style={s('display:flex;align-items:center;gap:7px')}><span style={s("font:700 13px/1.2 'Archivo';white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{l.name}</span>{l.id === 'ME' && <span style={s("font:700 8.5px/1 'Archivo';letter-spacing:.1em;color:#fff;background:#8B3DF5;padding:4px 5px;border-radius:5px")}>LIVE</span>}{!l.consent && <span style={s("font:600 9px/1 'Archivo';color:#826E99")}>no consent</span>}</span>
                  <span style={s("display:block;font:500 11px/1.3 'Archivo';color:#513E66;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{fields.map((f) => l.answers[f.id]).filter(Boolean).join(' · ') || 'No answers yet'}</span>
                </span>
                <span style={s('display:flex;gap:6px;flex:none')}>
                  {sg.features > 0 && <span title="Features explored" style={s("display:flex;align-items:center;gap:2px;font:600 10.5px/1 'Archivo';color:#513E66")}><Ms size={14} color="#826E99">my_location</Ms>{sg.features}</span>}
                  {sg.built && <Ms size={15} color="#826E99">palette</Ms>}
                  {sg.finance && <Ms size={15} color="#826E99">payments</Ms>}
                  {sg.booked && <Ms size={15} color="#2F7A68">event_available</Ms>}
                </span>
                <span style={s("width:118px;flex:none;font:500 11px/1.25 'Archivo';color:#513E66;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{optName(C, l.route)}</span>
                <span style={{ ...s("width:74px;flex:none;text-align:center;font:600 10px/1 'Archivo';letter-spacing:.04em;padding:6px 0;border-radius:6px;color:#fff"), background: STATUS_COLOR[l.status] }}>{l.status}</span>
              </button>
            ); })}
          </div>
          <div style={s("font:400 11.5px/1.45 'Archivo';color:#826E99;margin-top:12px")}>Showing the most recent {leads.length} of {total.toLocaleString()}. The row marked LIVE is the fan view open in this browser, and it rescores as they explore.</div>
        </Card>

        <div style={s('position:sticky;top:86px;display:flex;flex-direction:column;gap:20px')}>
          <Card>
            <div style={s('display:flex;align-items:flex-start;gap:12px')}>
              <div style={s('flex:1;min-width:0')}>
                <div style={s("font:700 22px/1.1 'Archivo';letter-spacing:-.015em")}>{sel.name}</div>
                <div style={s("display:flex;align-items:center;gap:6px;font:500 11.5px/1 'Archivo';color:#513E66;margin-top:8px")}><Ms size={14} color="#826E99">{sel.where === 'venue' ? 'location_on' : 'wifi'}</Ms>{sel.at} · via {sel.source}</div>
              </div>
              <div style={s('text-align:right')}><div style={s("font:800 34px/.9 'Archivo Black';font-variant-numeric:tabular-nums")}>{sel.score}</div><div style={s('margin-top:7px')}>{pill(sel.tier)}</div></div>
            </div>
            <div style={s('margin-top:16px')}>
              {fields.map((f) => <div key={f.id} style={s('display:flex;gap:12px;padding:9px 0;border-top:1px solid rgba(27,11,45,.08)')}><span style={s("width:110px;flex:none;font:600 11.5px/1.3 'Archivo';color:#513E66")}>{f.label}</span><span style={s("flex:1;font:600 12px/1.3 'Archivo'")}>{sel.answers[f.id] || '—'}</span></div>)}
              {(sel.variant || sel.monthly) && <div style={s('display:flex;gap:12px;padding:9px 0;border-top:1px solid rgba(27,11,45,.08)')}><span style={s("width:110px;flex:none;font:600 11.5px/1.3 'Archivo';color:#513E66")}>Spec</span><span style={s("flex:1;font:600 12px/1.3 'Archivo'")}>{[sel.variant, sel.colour, sel.monthly && sel.monthly + ' a month'].filter(Boolean).join(' · ')}</span></div>}
              {sel.seen && sel.seen.length > 0 && <div style={s('display:flex;gap:12px;padding:9px 0;border-top:1px solid rgba(27,11,45,.08)')}><span style={s("width:110px;flex:none;font:600 11.5px/1.3 'Archivo';color:#513E66")}>Explored</span><span style={s("flex:1;font:600 12px/1.3 'Archivo'")}>{sel.seen.map((id) => C.hotspots.find((h) => h.id === id)?.name).filter(Boolean).join(', ')}</span></div>}
              <div style={s('display:flex;gap:12px;padding:9px 0;border-top:1px solid rgba(27,11,45,.08)')}><span style={s("width:110px;flex:none;font:600 11.5px/1.3 'Archivo';color:#513E66")}>Consent</span><span style={{ ...s("flex:1;display:flex;align-items:center;gap:5px;font:600 12px/1.3 'Archivo'"), color: sel.consent ? '#2F7A68' : '#C0473C' }}><Ms size={15} color="inherit">{sel.consent ? 'verified_user' : 'block'}</Ms>{sel.consent ? 'Can be contacted' : 'Not given · no follow-up'}</span></div>
            </div>
            <div style={s('margin-top:14px;padding:13px 14px;border-radius:12px;background:#F1F1EE')}>
              <Cap>WHY THIS SCORE</Cap>
              <div style={s('display:flex;flex-direction:column;gap:6px;margin-top:10px')}>
                <div style={s("display:flex;font:500 11.5px/1.2 'Archivo';color:#513E66")}><span style={s('flex:1')}>Registered + interest answers</span><span style={s('font-weight:700;color:#1B0B2D')}>+{6 + Object.keys(sel.answers).length * 2}</span></div>
                {scoreParts(sel.signals).map((r) => <div key={r.key} style={s("display:flex;font:500 11.5px/1.2 'Archivo';color:#513E66")}><span style={s('flex:1')}>{r.label}{r.per ? ' · ' + r.n : ''}</span><span style={s('font-weight:700;color:#1B0B2D')}>+{r.pts}</span></div>)}
              </div>
            </div>
          </Card>
          <Card>
            <div style={s('display:flex;align-items:center;gap:10px')}><Cap>ASSIGN TO</Cap>{matched && matched === sel.route && <Note>Matched by {fields.find((f) => f.routes)?.short.toLowerCase()}</Note>}</div>
            <div style={s('display:flex;flex-wrap:wrap;gap:6px;margin-top:12px')}>{C.cta.options.map((o) => { const on = sel.route === o.id; return <button key={o.id} onClick={() => edit(sel.id, { route: o.id })} style={{ ...s("font:600 11.5px/1 'Archivo';padding:9px 11px;border-radius:9px"), background: on ? '#1B0B2D' : '#F1F1EE', color: on ? '#F5F5F2' : '#1B0B2D' }}>{o.name}</button>; })}</div>
            <div style={s('margin-top:16px')}><Cap>STATUS</Cap></div>
            <div style={s('display:flex;flex-wrap:wrap;gap:6px;margin-top:12px')}>{LEAD_STATUSES.map((x) => { const on = sel.status === x; return <button key={x} onClick={() => edit(sel.id, { status: x })} style={{ ...s("font:600 11.5px/1 'Archivo';padding:9px 11px;border-radius:9px"), background: on ? STATUS_COLOR[x] : '#F1F1EE', color: on ? '#FFFFFF' : '#1B0B2D' }}>{x}</button>; })}</div>
            {draft && <>
              <div style={s('display:flex;align-items:center;gap:10px;margin-top:18px')}><Cap>FOLLOW-UP</Cap><Note>Drafted from approved facts and what they explored</Note></div>
              <div style={{ ...s("margin-top:10px;padding:13px 14px;border-radius:12px;background:#F1F1EE;font:500 12.5px/1.55 'Archivo'"), color: sel.consent ? '#1B0B2D' : '#A79BB5' }}>{draft}</div>
              <button className="ah-ink-btn" disabled={!sel.consent || sel.sent} onClick={() => sendFollowUp(sel, draft, routeName)} style={{ ...s("display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:12px;padding:13px;border-radius:12px;font:600 12.5px/1 'Archivo';color:#F5F5F2"), background: !sel.consent ? '#C4C4C0' : sel.sent ? '#2F7A68' : '#1B0B2D', cursor: !sel.consent || sel.sent ? 'default' : 'pointer' }}><Ms size={16} color="#F5F5F2">{sel.sent ? 'check' : 'send'}</Ms>{!sel.consent ? 'No consent to contact' : sel.sent ? 'Sent from ' + routeName : 'Send as ' + routeName}</button>
            </>}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ════════════ 6 IMPROVE ════════════
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
  const sessionKey: Record<string, number> = { registered: st.regs.venue + st.regs.online, engaged: st.me && (st.me.signals.features + st.me.signals.polls) > 0 ? 1 : 0, built: st.me && (st.me.signals.built || st.me.signals.finance) ? 1 : 0, booked: st.drives.length };
  const funnel = (R.funnel || []).map((f) => ({ ...f, n: f.n + (f.key ? sessionKey[f.key] || 0 : 0) }));
  const feats = C.hotspots.filter((h) => R.features?.[h.id] !== undefined).map((h) => ({ name: h.name, pct: R.features![h.id] })).sort((a, b) => b.pct - a.pct);
  const maxFeat = Math.max(...feats.map((f) => f.pct), 0);
  const sources = R.sources || []; const srcTotal = Math.max(sources.reduce((a, x) => a + x.n, 0), 1); const maxSrc = Math.max(...sources.map((x) => x.n), 1);
  const LQ = R.leadQuality || [];
  const tixR = R.tickets; const tixClicks = (tixR?.clicks || 0) + st.tix.clicks;
  const chRows = (C.challenges || []).map((c) => ({ c, n: (R.challenges?.[c.id] || 0) + (st.chDone[c.id] || 0) })); const maxCh = Math.max(...chRows.map((x) => x.n), 1);
  const owns = (name: string) => [...C.polls.filter((p) => p.sponsor === name).map(() => 'Poll'), ...(C.challenges || []).filter((c) => c.sponsor === name).map(() => 'Challenge'), ...Object.values(C.announcements).flat().filter((m) => m.sponsor === name).map(() => 'Announcement'), ...(C.rewards || []).filter((r) => r.sponsor === name).map(() => 'Reward')];
  const spRows = (R.sponsors || []).map((x) => ({ ...x, views: x.views + (st.spViews[x.name] || 0), taps: x.taps + (st.spTaps[x.name] || 0), owns: Array.from(new Set(owns(x.name))) }));
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
      {funnel.length > 0 && (
        <Card style={{ marginTop: 20 }}>
          <div style={s('display:flex;align-items:center;gap:10px')}><Ms size={19} color="#1B0B2D">filter_alt</Ms><span style={s("font:700 16px/1 'Archivo';letter-spacing:-.012em")}>From interest to sale</span><span style={s("font:400 12px/1 'Archivo';color:#826E99;margin-left:auto")}>Every step from one consented profile · sales reported back by showrooms</span></div>
          <div style={{ ...s('display:grid;gap:12px;margin-top:20px'), gridTemplateColumns: `repeat(${funnel.length},minmax(0,1fr))` }}>
            {funnel.map((f, i) => (
              <div key={f.label} style={s('display:flex;flex-direction:column')}>
                <div style={s('height:120px;display:flex;align-items:flex-end;border-radius:10px;background:#F1F1EE;overflow:hidden')}><span style={{ ...s('display:block;width:100%;border-radius:10px;transition:height .8s cubic-bezier(.2,.8,.2,1)'), height: Math.max(4, Math.sqrt(f.n / funnel[0].n) * 100) + '%', background: i === funnel.length - 1 ? '#1B0B2D' : '#8B3DF5', opacity: 1 - i * 0.08 }} /></div>
                <div style={s("font:800 24px/.9 'Archivo Black';margin-top:12px;font-variant-numeric:tabular-nums")}>{f.n.toLocaleString()}</div>
                <div style={s("font:600 12px/1.3 'Archivo';margin-top:6px")}>{f.label}</div>
                <div style={s("font:500 11px/1 'Archivo';color:#826E99;margin-top:6px")}>{i === 0 ? 'Start' : ((f.n / Math.max(funnel[i - 1].n, 1)) * 100).toFixed(f.n / funnel[i - 1].n < 0.1 ? 1 : 0) + '% of previous step'}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
      {(feats.length > 0 || sources.length > 0) && (
        <div style={{ ...s('display:grid;gap:20px;margin-top:20px'), gridTemplateColumns: feats.length > 0 && sources.length > 0 ? '1fr 1fr' : '1fr' }}>
          {feats.length > 0 && <Card>
            <div style={s('display:flex;align-items:center;gap:10px')}><Ms size={19} color="#1B0B2D">my_location</Ms><span style={s("font:700 16px/1 'Archivo';letter-spacing:-.012em")}>Features explored</span><span style={s("font:400 12px/1 'Archivo';color:#826E99;margin-left:auto")}>Share of viewers who opened each one</span></div>
            <div style={s('margin-top:22px;display:flex;flex-direction:column;gap:16px')}>{feats.map((f) => <div key={f.name}><div style={s('display:flex;align-items:center;gap:9px')}><span style={s("font:600 13px/1 'Archivo';flex:1")}>{f.name}</span><span style={s("font:700 13px/1 'Archivo';font-variant-numeric:tabular-nums")}>{f.pct}%</span></div>{bar(f.pct, f.pct === maxFeat ? '#1B0B2D' : '#8B3DF5')}</div>)}</div>
            <div style={s("font:400 11.5px/1.45 'Archivo';color:#826E99;margin-top:16px")}>Used to retarget: people who opened a feature get follow-up and ads that lead with it.</div>
          </Card>}
          {sources.length > 0 && <Card>
            <div style={s('display:flex;align-items:center;gap:10px')}><Ms size={19} color="#1B0B2D">campaign</Ms><span style={s("font:700 16px/1 'Archivo';letter-spacing:-.012em")}>Where registrations came from</span><span style={s("font:400 12px/1 'Archivo';color:#826E99;margin-left:auto")}>By channel</span></div>
            <div style={s('margin-top:22px;display:flex;flex-direction:column;gap:16px')}>{sources.map((x) => <div key={x.name}><div style={s('display:flex;align-items:center;gap:9px')}><Ms size={16} color="#826E99">{x.icon}</Ms><span style={s("font:600 13px/1 'Archivo';flex:1")}>{x.name}</span><span style={s("font:700 13px/1 'Archivo';font-variant-numeric:tabular-nums")}>{x.n.toLocaleString()}</span><span style={s("width:40px;text-align:right;font:500 11.5px/1 'Archivo';color:#826E99")}>{Math.round((x.n / srcTotal) * 100)}%</span></div>{bar((x.n / maxSrc) * 100)}</div>)}</div>
          </Card>}
        </div>
      )}
      {(tixR || chRows.length > 0) && (
        <div style={{ ...s('display:grid;gap:20px;margin-top:20px'), gridTemplateColumns: tixR && chRows.length > 0 ? '1fr 1.3fr' : '1fr' }}>
          {tixR && <Card>
            <div style={s('display:flex;align-items:center;gap:10px')}><Ms size={19} color="#1B0B2D">confirmation_number</Ms><span style={s("font:700 16px/1 'Archivo';letter-spacing:-.012em")}>Tickets and referrals</span><span style={s("font:400 12px/1 'Archivo';color:#826E99;margin-left:auto")}>Clicks out to ticketing</span></div>
            <div style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:18px')}>
              <Stat label="CLICKS" v={tixClicks.toLocaleString()} />
              <Stat label="REFERRAL SALES" v={tixR.sales.toLocaleString()} />
              <Stat label="BY CREWS" v={Math.round((tixR.top.filter((x) => x.crew).reduce((a, x) => a + x.sales, 0) / Math.max(tixR.top.reduce((a, x) => a + x.sales, 0), 1)) * 100) + '%'} sub="of top-referrer sales" />
            </div>
            <div style={s('margin-top:16px;display:flex;flex-direction:column;gap:12px')}>{tixR.top.slice(0, 4).map((x) => <div key={x.name}><div style={s('display:flex;align-items:center;gap:9px')}><span style={s("font:600 13px/1 'Archivo';flex:1")}>{x.name}</span><span style={s("font:600 10px/1 'Archivo';color:#826E99")}>{x.crew ? 'CREW' : 'FAN'}</span><span style={s("width:64px;text-align:right;font:700 13px/1 'Archivo';font-variant-numeric:tabular-nums")}>{x.sales} sold</span></div>{bar((x.sales / Math.max(tixR.top[0].sales, 1)) * 100)}</div>)}</div>
          </Card>}
          {chRows.length > 0 && <Card>
            <div style={s('display:flex;align-items:center;gap:10px')}><Ms size={19} color="#1B0B2D">emoji_events</Ms><span style={s("font:700 16px/1 'Archivo';letter-spacing:-.012em")}>Challenge completions</span><span style={s("font:400 12px/1 'Archivo';color:#826E99;margin-left:auto")}>{st.claims ? st.claims + ' reward claimed this session · ' : ''}{(C.rewards || []).length} rewards on offer</span></div>
            <div style={s('margin-top:20px;display:flex;flex-direction:column;gap:14px')}>{chRows.map(({ c, n }) => <div key={c.id}><div style={s('display:flex;align-items:center;gap:9px')}><span style={s("font:600 13px/1 'Archivo';flex:1")}>{c.title}</span>{c.sponsor && <span style={s("font:600 10px/1 'Archivo';color:#826E99")}>by {c.sponsor}</span>}<span style={s("width:50px;text-align:right;font:600 11px/1 'Archivo';color:#826E99")}>+{c.points}</span><span style={s("width:60px;text-align:right;font:700 13px/1 'Archivo';font-variant-numeric:tabular-nums")}>{n.toLocaleString()}</span></div>{bar((n / maxCh) * 100)}</div>)}</div>
          </Card>}
        </div>
      )}
      {spRows.length > 0 && (
        <Card style={{ marginTop: 20 }}>
          <div style={s('display:flex;align-items:center;gap:10px')}><Ms size={19} color="#1B0B2D">handshake</Ms><span style={s("font:700 16px/1 'Archivo';letter-spacing:-.012em")}>Sponsor moments</span><span style={s("font:400 12px/1 'Archivo';color:#826E99;margin-left:auto")}>Views and taps on the moments each sponsor owns</span></div>
          <div style={s("display:grid;grid-template-columns:1.6fr 2fr 1fr 1fr 1fr 2fr;gap:12px;margin-top:18px;padding-bottom:10px;border-bottom:1px solid rgba(27,11,45,.08);font:600 10px/1 'Archivo';letter-spacing:.12em;color:#826E99")}><span>SPONSOR</span><span>OWNS</span><span style={s('text-align:right')}>VIEWS</span><span style={s('text-align:right')}>TAPS</span><span style={s('text-align:right')}>TAP RATE</span><span>SHARE OF TAPS</span></div>
          {spRows.map((x) => { const b = sponsorOf(C, x.name)!; const all = Math.max(spRows.reduce((a, y) => a + y.taps, 0), 1); return (
            <div key={x.name} style={s("display:grid;grid-template-columns:1.6fr 2fr 1fr 1fr 1fr 2fr;gap:12px;align-items:center;padding:13px 0;border-bottom:1px solid rgba(27,11,45,.08);font:600 13px/1 'Archivo';font-variant-numeric:tabular-nums")}>
              <span style={s('display:flex;align-items:center;gap:9px')}><span style={{ ...s("display:inline-flex;align-items:center;justify-content:center;min-width:26px;height:22px;padding:0 5px;border-radius:5px;font:900 9.5px/1 'Archivo';color:#fff"), background: b.color }}>{b.short}</span>{x.name}</span>
              <span style={s("font:500 12px/1.3 'Archivo';color:#513E66")}>{x.owns.join(', ') || '—'}</span>
              <span style={s('text-align:right')}>{x.views.toLocaleString()}</span><span style={s('text-align:right')}>{x.taps.toLocaleString()}</span><span style={s('text-align:right')}>{((x.taps / Math.max(x.views, 1)) * 100).toFixed(1)}%</span>
              <span style={s('height:10px;border-radius:6px;background:#F1F1EE;overflow:hidden')}><span style={{ ...s('display:block;height:10px;border-radius:6px'), width: (x.taps / all) * 100 + '%', background: b.color }} /></span>
            </div>
          ); })}
        </Card>
      )}
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
      {LQ.length > 0 && (
        <Card style={{ marginTop: 20 }}>
          <div style={s('display:flex;align-items:center;gap:10px')}><Ms size={19} color="#1B0B2D">leaderboard</Ms><span style={s("font:700 16px/1 'Archivo';letter-spacing:-.012em")}>Lead quality by {C.cta.optionsLabel.toLowerCase()}</span><span style={s("font:400 12px/1 'Archivo';color:#826E99;margin-left:auto")}>Where follow-up is working, and where it needs help</span></div>
          <div style={s("display:grid;grid-template-columns:1.6fr repeat(5,1fr) 2fr;gap:12px;margin-top:18px;padding-bottom:10px;border-bottom:1px solid rgba(27,11,45,.08);font:600 10px/1 'Archivo';letter-spacing:.12em;color:#826E99")}><span>{C.cta.optionsLabel}</span><span style={s('text-align:right')}>HOT</span><span style={s('text-align:right')}>WARM</span><span style={s('text-align:right')}>COLD</span><span style={s('text-align:right')}>WON</span><span style={s('text-align:right')}>HOT → WON</span><span>MIX</span></div>
          {LQ.map((r) => { const t = r.hot + r.warm + r.cold; return (
            <div key={r.name} style={s("display:grid;grid-template-columns:1.6fr repeat(5,1fr) 2fr;gap:12px;align-items:center;padding:13px 0;border-bottom:1px solid rgba(27,11,45,.08);font:600 13px/1 'Archivo';font-variant-numeric:tabular-nums")}>
              <span>{r.name}</span><span style={s('text-align:right;color:#C0473C')}>{r.hot}</span><span style={s('text-align:right')}>{r.warm}</span><span style={s('text-align:right;color:#826E99')}>{r.cold.toLocaleString()}</span><span style={s('text-align:right')}>{r.won}</span><span style={s('text-align:right')}>{((r.won / Math.max(r.hot, 1)) * 100).toFixed(1)}%</span>
              <span style={s('display:flex;height:10px;border-radius:6px;overflow:hidden;background:#F1F1EE')}><span style={{ ...s('display:block;background:#C0473C'), width: (r.hot / t) * 100 + '%' }} /><span style={{ ...s('display:block;background:#8B3DF5'), width: (r.warm / t) * 100 + '%' }} /><span style={s('display:block;flex:1;background:#D9D9D4')} /></span>
            </div>
          ); })}
        </Card>
      )}
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
