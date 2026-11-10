// ═══════════════════════════════════════════════════════════════════════
// EventFan, the Connect Events fan panel. Renders one event entirely from its
// EventConfig (./config): brand, copy, segments, hotspots, polls, IRIS answers,
// CTA, community. Built on the Voltford matchday fan panel's design system
// (same tokens, type, lower-third, flash drop, IRIS sheet, chat, poll card,
// countdown); brand colours re-derive those tokens (themeCss). Operator-driven
// states Before / Live / Break / After / Always-on, live segments, targeted
// triggers. Talks to the event's Studio over a BroadcastChannel, both ways.
// ═══════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { s } from '../voltford/admin/s';
import {
  getEvent, themeCss, audience, channelName, asset, homePath, revealSegIndex, qaSegIndex, clockAfter,
  type EventConfig, type Ms as MState, type Mode, type Target, type TriggerKind, type QA,
} from './config';

const Ms = ({ children, size = 18, color, style }: { children: string; size?: number; color?: string; style?: CSSProperties }) => (
  <span className="ms" style={{ fontSize: size, color, ...style }}>{children}</span>
);
const pad = (n: number) => String(n).padStart(2, '0');
const NARROW = typeof window !== 'undefined' && window.innerWidth < 380;
const REACTS = ['🔥', '😍', '👏', '⚡'];
const ACC = 'var(--acc)';

type ChatMsg = { id: string; user: string; text: string; where: string; tag: string; avatar?: string; me?: boolean; time: string; likes: number; ev?: { kind: string; color: string; icon: string } };
type MyQ = { id: string; text: string; votes: number; status: string; mine: true };
type Third = { kind: string; title: string; note: string; color: string; icon: string };
interface ESt {
  route: string; navStack: string[];
  ms: MState; seg: number; revealed: boolean; breakAt: number;
  mode: Mode; registered: boolean; pick: Mode;
  tick: number; n: number; chat: ChatMsg[]; draft: string; likes: Record<string, boolean>;
  iris: boolean; irisOut: boolean; irisTyping: boolean; irisDraft: string; thread: { me: boolean; text: string; stat?: string; statLabel?: string }[];
  third: Third | null; flash: { kicker: string; title: string; sub: string } | null; flashOut: boolean;
  revealing: boolean; hotspot: number | null; hsOut: boolean; seen: Record<string, boolean>;
  poll: number | null; votes: Record<string, string>;
  qDraft: string; myQs: MyQ[]; upvotes: Record<string, boolean>;
  floats: { id: number; e: string; x: number }[]; myReacts: number;
  drive: { showroom: string; slot: string; done: boolean };
  following: boolean; readOpen: number | null;
  event: 'main' | 'next'; attended: boolean; checkedIn: boolean; nextReg: boolean;
  reminders: { id: string; title: string; body: string }[];
  toast: string | null; theme: string;
  stripTarget: Target; stripOpen: boolean; ctr: { poll: number; hotspot: number; announce: number };
}

// Loads the event's config (a live draft when previewing in the builder).
export function EventFan({ id }: { id: string }) {
  const preview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === '1';
  const [cfg, setCfg] = useState<EventConfig | null>(() => getEvent(id, { draft: preview }));
  useEffect(() => {
    // The builder writes drafts to localStorage; refresh the preview as it types.
    const onStore = () => setCfg(getEvent(id, { draft: preview }));
    window.addEventListener('storage', onStore);
    return () => window.removeEventListener('storage', onStore);
  }, [id, preview]);
  if (!cfg) return <NotFound id={id} />;
  return <FanView key={cfg.id} cfg={cfg} />;
}

function NotFound({ id }: { id: string }) {
  return (
    <div style={s("min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#160925;color:#F2F2F0;font-family:Archivo,system-ui,sans-serif;text-align:center")}>
      <div style={s('max-width:320px')}>
        <div style={s("font:800 28px/1 'Archivo Black'")}>Event not found</div>
        <div style={s("font:500 13.5px/1.5 'Archivo';color:#B09DC6;margin-top:12px")}>“{id}” isn’t published on this device. Events made in the Studio are saved in the browser that made them.</div>
        <a href={homePath()} style={s("display:inline-block;margin-top:18px;font:800 11.5px/1 'Archivo';letter-spacing:.06em;color:#fff;background:#8B3DF5;padding:13px 15px;text-decoration:none")}>OPEN THE STUDIO</a>
      </div>
    </div>
  );
}

function FanView({ cfg }: { cfg: EventConfig }) {
  const qs = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const embed = qs.get('embed') === '1';
  const checkin = qs.get('checkin') === 'hall';
  const startMode: Mode = checkin || qs.get('mode') === 'venue' ? 'venue' : 'online';
  const ATTENDED = 'connect-events:attended:' + cfg.id;
  const readAttended = () => { try { return window.localStorage.getItem(ATTENDED) === '1'; } catch { return false; } };
  const pool = cfg.chat.pool.length ? cfg.chat.pool : [{ user: 'GUEST', text: 'Hello!', where: 'online' as Mode, tag: 'ONLINE' }];
  const REV = revealSegIndex(cfg), QAI = qaSegIndex(cfg);
  const [st, setSt] = useState<ESt>(() => ({
    route: 'home', navStack: [],
    ms: 'before', seg: 0, revealed: false, breakAt: 0,
    mode: startMode, registered: checkin || !!qs.get('mode'), pick: startMode,
    tick: 0, n: 6, chat: pool.slice(0, 6).map((m, i) => ({ ...m, id: 's' + i, time: clockAfter(cfg.event.time, -19 + i * 3), likes: 1 + (i % 4) })), draft: '', likes: {},
    iris: false, irisOut: false, irisTyping: false, irisDraft: '',
    thread: [{ me: false, text: cfg.iris.intro }],
    third: null, flash: null, flashOut: false,
    revealing: false, hotspot: null, hsOut: false, seen: {},
    poll: null, votes: {}, qDraft: '', myQs: [], upvotes: {},
    floats: [], myReacts: 0,
    drive: { showroom: cfg.cta.options[0]?.id || '', slot: cfg.cta.slots[0] || '', done: false },
    following: false, readOpen: null,
    event: qs.get('event') === 'next' ? 'next' : 'main', attended: readAttended(), checkedIn: checkin, nextReg: false, reminders: [],
    toast: null, theme: qs.get('theme') === 'dark' ? 'dark' : 'light',
    stripTarget: 'all', stripOpen: !embed && typeof window !== 'undefined' && window.innerWidth > 520, ctr: { poll: 0, hotspot: 0, announce: 0 },
  }));
  const set = (p: Partial<ESt> | ((x: ESt) => Partial<ESt>)) => setSt((x) => ({ ...x, ...(typeof p === 'function' ? p(x) : p) }));
  const stRef = useRef(st); stRef.current = st;
  const timers = useRef<Record<string, number>>({});
  const later = (k: string, ms: number, fn: () => void) => { window.clearTimeout(timers.current[k]); timers.current[k] = window.setTimeout(fn, ms); };

  const chan = useRef<BroadcastChannel | null>(null);
  const send = (m: Record<string, unknown>) => chan.current?.postMessage(m);

  useEffect(() => {
    const ci = window.setInterval(() => setSt((x) => {
      const m = pool[x.n % pool.length];
      return { ...x, n: x.n + 1, chat: [...x.chat, { ...m, id: 'a' + x.n, time: clockAfter(cfg.event.time, 10 + x.n * 2), likes: 0 }].slice(-40) };
    }), 3600);
    const tk = window.setInterval(() => set((x) => ({ tick: x.tick + 1 })), 1000);
    return () => { window.clearInterval(ci); window.clearInterval(tk); Object.values(timers.current).forEach((t) => window.clearTimeout(t)); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const root = document.documentElement;
    if (st.theme === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', st.theme);
    return () => root.removeAttribute('data-theme');
  }, [st.theme]);
  useEffect(() => { document.title = cfg.event.name + ' · Connect Events'; }, [cfg.event.name]);

  const chatRef = useRef<HTMLDivElement>(null);
  const irisRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [st.chat.length, st.route]);
  useEffect(() => { if (irisRef.current) irisRef.current.scrollTop = irisRef.current.scrollHeight; }, [st.thread.length, st.iris]);

  const notify = (label: string) => { set({ toast: label }); later('toast', 2400, () => set({ toast: null })); };
  const showThird = (t: Third, hold = 4600) => { set({ third: t }); later('third', hold, () => set({ third: null })); };
  const chatMark = (kind: string, text: string, icon: string, color = ACC) => {
    const mid = 'ev' + Date.now();
    set((x) => ({ chat: [...x.chat, { id: mid, user: '', text, where: '', tag: '', time: '', likes: 0, ev: { kind, color, icon } }].slice(-40) }));
    window.setTimeout(() => set((x) => ({ chat: x.chat.filter((m) => m.id !== mid) })), 9000);
  };
  const closeFlash = () => { set((x) => (x.flash ? { flashOut: true } : {})); window.setTimeout(() => set({ flash: null, flashOut: false }), 200); };
  const closeIris = () => { set({ irisOut: true }); window.setTimeout(() => set({ iris: false, irisOut: false }), 260); };
  const closeHotspot = () => { set({ hsOut: true }); window.setTimeout(() => set({ hotspot: null, hsOut: false }), 260); };
  const float = (e: string) => {
    const fid = Date.now() + Math.random();
    set((x) => ({ floats: [...x.floats, { id: fid, e, x: 10 + Math.random() * 46 }].slice(-24) }));
    window.setTimeout(() => set((x) => ({ floats: x.floats.filter((f) => f.id !== fid) })), 1700);
  };
  const burst = (count = 9) => { for (let i = 0; i < count; i++) window.setTimeout(() => float(REACTS[Math.floor(Math.random() * REACTS.length)]), i * 220); };
  const markAttended = () => { try { window.localStorage.setItem(ATTENDED, '1'); } catch { /* storage blocked */ } set({ attended: true }); };

  // ── state engine ──
  const applyState = (ms: MState, seg?: number) => {
    if (ms === 'before') set({ ms, seg: 0, revealed: false, poll: null, third: null, revealing: false, hotspot: null, route: 'home', navStack: [] });
    else if (ms === 'live') { set((x) => { const g = seg ?? (x.ms === 'before' ? 0 : x.seg); return { ms, seg: g, revealed: x.revealed || (QAI >= 0 && g >= QAI) }; }); markAttended(); }
    else if (ms === 'break') set((x) => ({ ms, breakAt: x.tick, poll: null, hotspot: null }));
    else if (ms === 'after') set({ ms, revealed: true, poll: null, revealing: false, hotspot: null });
    else set({ ms, revealed: true, poll: null, revealing: false, hotspot: null, third: null, route: 'home', navStack: [] });
  };
  const applySeg = (i: number) => {
    applyState('live', i);
    const g = cfg.segments[i]; if (!g) return;
    showThird({ kind: 'NOW', title: g.name, note: g.note, color: ACC, icon: 'radio_button_checked' });
  };
  const hits = (t: Target, mode: Mode) => t === 'all' || t === mode;
  const applyTrigger = (kind: TriggerKind, target: Target, idx: number) => {
    const x = stRef.current;
    set((p) => ({ ctr: { ...p.ctr, ...(kind === 'reveal' ? {} : { [kind]: idx + 1 }) } }));
    if (!hits(target, x.mode)) return false;
    if (kind === 'reveal') {
      set({ ms: 'live', seg: REV, revealed: true, revealing: true, route: 'home', navStack: [], iris: false, hotspot: null, flash: null });
      later('reveal', 4300, () => {
        set({ revealing: false });
        showThird({ kind: 'THE REVEAL', title: cfg.reveal.title.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()), note: cfg.reveal.thirdNote, color: ACC, icon: 'auto_awesome' }, 5200);
        burst(12);
      });
      chatMark('REVEAL', cfg.reveal.word2.charAt(0) + cfg.reveal.word2.slice(1).toLowerCase() + ' is out', 'auto_awesome');
      markAttended();
    } else if (kind === 'poll' && cfg.polls.length) {
      const p = cfg.polls[idx % cfg.polls.length];
      set({ poll: idx % cfg.polls.length });
      showThird({ kind: 'LIVE POLL', title: 'Vote now', note: p.q, color: ACC, icon: 'bar_chart' });
      chatMark('POLL', p.q, 'bar_chart');
    } else if (kind === 'hotspot' && cfg.hotspots.length) {
      const h = cfg.hotspots[idx % cfg.hotspots.length];
      set((p) => ({ revealed: true, hotspot: idx % cfg.hotspots.length, hsOut: false, seen: { ...p.seen, [h.id]: true }, iris: false }));
      showThird({ kind: 'FEATURE', title: h.name, note: h.stat + ' · ' + h.unit, color: ACC, icon: 'my_location' });
    } else if (kind === 'announce') {
      const list = cfg.announcements[target];
      if (!list?.length) return true;
      set({ flash: list[idx % list.length], flashOut: false });
      later('flash', 14000, () => closeFlash());
    }
    return true;
  };

  const bus = useRef<(m: any) => void>(() => {});
  bus.current = (m) => {
    if (!m || !m.cmd) return;
    if (m.cmd === 'state') applyState(m.ms, m.seg);
    else if (m.cmd === 'segment') applySeg(m.seg);
    else if (m.cmd === 'trigger') applyTrigger(m.kind, m.target, m.idx || 0);
    else if (m.cmd === 'sync') { set((x) => ({ ms: m.ms, seg: m.seg, revealed: m.revealed, poll: m.poll ?? x.poll, breakAt: x.tick })); if (m.ms === 'live') markAttended(); }
    else if (m.cmd === 'reminder') {
      const x = stRef.current;
      if (!x.registered || !hits(m.target, x.mode)) return;
      set((p) => ({ reminders: [{ id: m.id, title: m.title, body: m.body }, ...p.reminders.filter((r) => r.id !== m.id)] }));
      notify('UPDATE · ' + String(m.title).toUpperCase());
    } else if (m.cmd === 'qstatus') {
      const mine = stRef.current.myQs.find((q) => q.id === m.id);
      if (mine) { set((x) => ({ myQs: x.myQs.map((q) => (q.id === m.id ? { ...q, status: m.status } : q)) })); notify(m.status === 'ON STAGE' ? 'YOUR QUESTION IS ON STAGE' : 'YOUR QUESTION WAS ANSWERED'); }
    }
  };
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const ch = new BroadcastChannel(channelName(cfg.id));
    chan.current = ch;
    ch.onmessage = (e) => bus.current(e.data);
    ch.postMessage({ cmd: 'hello', mode: stRef.current.mode });
    if (stRef.current.checkedIn) { ch.postMessage({ cmd: 'checkin', where: cfg.event.venue }); markAttended(); window.setTimeout(() => notify('CHECKED IN · ' + cfg.event.venueShort), 600); }
    return () => { ch.close(); chan.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stripState = (ms: MState) => { applyState(ms); send({ cmd: 'state', ms, from: 'fan' }); };
  const stripSeg = (i: number) => { applySeg(i); send({ cmd: 'segment', seg: i, from: 'fan' }); };
  const stripTrigger = (kind: TriggerKind) => {
    const idx = kind === 'reveal' ? 0 : st.ctr[kind];
    const target = st.stripTarget;
    const got = applyTrigger(kind, target, idx);
    send({ cmd: 'trigger', kind, target, idx, from: 'fan' });
    if (!got) notify('SENT TO ' + (target === 'venue' ? 'IN-VENUE' : 'ONLINE') + ' FANS · NOT YOU');
  };

  // ── fan actions ──
  const go = (r: string) => () => set((x) => ({ route: r, navStack: x.route === r ? x.navStack : [...x.navStack, x.route], iris: false }));
  const goBack = () => set((x) => { const k = x.navStack.slice(); const prev = k.pop(); return { route: prev || 'home', navStack: k, iris: false }; });
  const post = (text: string) => {
    if (!text.trim()) return;
    set((x) => ({ draft: '', chat: [...x.chat, { id: 'me' + Date.now(), user: 'YOU', text: text.trim(), where: x.mode, tag: x.mode === 'venue' ? cfg.event.venueWord : 'ONLINE', me: true, time: clockAfter(cfg.event.time, 30 + x.n), likes: 0 }] }));
  };
  const ask = (q: string, a: string, stat?: string, statLabel?: string) => {
    set((x) => ({ iris: true, irisTyping: true, irisDraft: '', thread: [...x.thread, { me: true, text: q }] }));
    later('iris', 750, () => set((x) => ({ irisTyping: false, thread: [...x.thread, { me: false, text: a, stat, statLabel }] })));
  };
  const register = () => { set((x) => ({ registered: true, mode: x.pick })); send({ cmd: 'register', mode: st.pick }); notify(st.pick === 'venue' ? 'SEE YOU AT ' + cfg.event.venueShort : 'YOU’RE ON THE LIST · ONLINE'); };
  const sendQ = () => {
    const text = st.qDraft.trim();
    if (!text) return;
    const qid = 'my' + Date.now();
    set((x) => ({ qDraft: '', myQs: [...x.myQs, { id: qid, text, votes: 1, status: 'QUEUED', mine: true }] }));
    send({ cmd: 'question', id: qid, text, where: st.mode });
    notify('QUESTION SENT TO THE STAGE TEAM');
  };
  const vote = (pollId: string, opt: string) => {
    if (st.votes[pollId]) return;
    set((x) => ({ votes: { ...x.votes, [pollId]: opt } }));
    send({ cmd: 'vote', poll: pollId, opt });
  };
  const react = (e: string) => { float(e); set((x) => ({ myReacts: x.myReacts + 1 })); send({ cmd: 'react', e, seg: st.ms === 'live' ? st.seg : -1 }); };
  const openHotspot = (i: number) => set((x) => ({ hotspot: i, hsOut: false, seen: { ...x.seen, [cfg.hotspots[i].id]: true } }));
  const bookDrive = () => {
    const room = cfg.cta.options.find((r) => r.id === st.drive.showroom) || cfg.cta.options[0];
    set((x) => ({ drive: { ...x.drive, done: true } }));
    send({ cmd: 'testdrive', showroom: room?.name || '', slot: st.drive.slot, where: st.mode });
    notify(cfg.cta.doneTitle.toUpperCase());
  };
  const follow = () => { set((x) => ({ following: !x.following })); if (!st.following) { send({ cmd: 'follow' }); notify(cfg.follow.doneTitle.toUpperCase()); } };
  const share = async () => {
    const url = window.location.origin + window.location.pathname;
    try {
      if (navigator.share) { await navigator.share({ title: cfg.event.name, url }); return; }
      await navigator.clipboard.writeText(url); notify('EVENT LINK COPIED');
    } catch { /* share sheet dismissed */ }
  };

  // ── derived ──
  const { ms, seg, revealed } = st;
  const before = ms === 'before', live = ms === 'live', brk = ms === 'break', after = ms === 'after', community = ms === 'community';
  const nextEv = st.event === 'next';
  const cd = Math.max(cfg.event.countdownSeconds - st.tick, 0);
  const breakLeft = Math.max(cfg.breakContent.minutes * 60 - (st.tick - st.breakAt), 0);
  const aud = audience(cfg, ms, seg, st.tick);
  const isHome = st.route === 'home', isSub = !isHome;
  const titles: Record<string, string> = { chat: 'LIVE CHAT', drive: cfg.cta.screenTitle, qa: 'Q&A' };
  const metas: Record<string, string> = { chat: (aud.venue + aud.online).toLocaleString() + ' WATCHING', drive: cfg.cta.screenMeta, qa: (cfg.qaSeed.length + st.myQs.length) + ' QUESTIONS' };
  const backLabel = st.navStack.length ? (titles[st.navStack[st.navStack.length - 1]] || 'HOME') : 'HOME';
  const statusLabel = nextEv ? cfg.community.next.date : before ? cfg.event.dayLabel : live ? 'LIVE' : brk ? 'BREAK' : after ? 'ENDED' : 'ALWAYS ON';
  const segTime = cfg.segments[seg]?.time || cfg.event.time;
  const lastTime = cfg.segments[cfg.segments.length - 1]?.time || cfg.event.time;
  const clockLabel = nextEv || community ? '09:12' : before ? clockAfter(cfg.event.time, -194) : live ? clockAfter(segTime, 8) : brk ? clockAfter(lastTime, -10) : clockAfter(lastTime, 44);
  const qBoard = [...cfg.qaSeed.map((q) => ({ ...q, mine: false, status: '' })), ...st.myQs.map((q) => ({ ...q, who: 'you', where: st.mode }))]
    .map((q) => ({ ...q, votes: q.votes + (st.upvotes[q.id] ? 1 : 0) })).sort((a, b) => b.votes - a.votes);
  const P = { cfg, st, set, go, before, live, brk, after, community, nextEv, seg, revealed, cd, breakLeft, aud, post, ask, register, sendQ, vote, react, openHotspot, bookDrive, follow, share, qBoard, chatRef };

  const opBtn = (label: string, onClick: () => void, bg = 'rgba(242,242,240,.12)', color = 'var(--on-panel)', on = false) => (
    <button onClick={onClick} style={{ ...s("font:800 10px/1 'Archivo';letter-spacing:.04em;padding:8px 6px"), background: on ? ACC : bg, color: on ? '#fff' : color }}>{label}</button>
  );
  const opRow = (label: string, children: ReactNode, head?: ReactNode) => (
    <div style={s('display:flex;align-items:center;gap:8px')}>
      <span style={s("font:800 10px/1 'Archivo';letter-spacing:.14em;color:var(--muted);padding-left:4px;width:58px;flex:none")}>{head || label}</span>
      <div style={s('display:flex;gap:4px;margin-left:auto;flex-wrap:wrap;justify-content:flex-end')}>{children}</div>
    </div>
  );

  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => { const r = () => setVw(window.innerWidth); window.addEventListener('resize', r); return () => window.removeEventListener('resize', r); }, []);
  const frameless = embed || vw <= 520;
  const wrapStyle = frameless ? s('height:100dvh;background:var(--ground);display:flex;justify-content:center') : s('min-height:100vh;background:var(--desk);display:flex;justify-content:center;padding:28px 16px 40px');
  const colStyle = frameless ? s('display:flex;flex-direction:column;height:100%;width:100%;max-width:520px') : s('display:flex;flex-direction:column;gap:12px');
  const phoneStyle = frameless ? s('position:relative;flex:1;min-height:0;width:100%;background:var(--ground);overflow:hidden') : s('position:relative;width:393px;height:844px;background:var(--ground);border-radius:44px;overflow:hidden;box-shadow:0 2px 2px rgba(27,11,45,.06),0 26px 56px -18px rgba(27,11,45,.4),0 0 0 9px var(--panel),0 0 0 10px var(--panel-hover)');

  return (
    <div style={wrapStyle}>
      <style>{FAN_CSS + themeCss(cfg.brand)}</style>
      <div style={colStyle}>
        {!embed && (
          <div style={{ ...s('display:flex;flex-direction:column;gap:7px;padding:9px 10px'), width: frameless ? '100%' : '393px', background: 'var(--panel)' }}>
            {opRow('STATE', <>
              {opBtn('BEFORE', () => stripState('before'), undefined, undefined, before)}
              {opBtn('LIVE', () => stripState('live'), undefined, undefined, live)}
              {opBtn('BREAK', () => stripState('break'), undefined, undefined, brk)}
              {opBtn('AFTER', () => stripState('after'), undefined, undefined, after)}
              {opBtn('ALWAYS ON', () => stripState('community'), undefined, undefined, community)}
            </>, <button onClick={() => set((x) => ({ stripOpen: !x.stripOpen }))} aria-label={st.stripOpen ? 'Hide demo controls' : 'Show demo controls'} style={s("display:flex;align-items:center;gap:1px;font:800 10px/1 'Archivo';letter-spacing:.14em;color:var(--muted)")}>STATE<Ms size={16} color="var(--muted)">{st.stripOpen ? 'expand_less' : 'expand_more'}</Ms></button>)}
            {st.stripOpen && <>
              {opRow('SEGMENT', cfg.segments.map((g, i) => <span key={g.id}>{opBtn(g.short.length > 9 ? g.short.split(' ')[0] : g.short, () => stripSeg(i), undefined, undefined, live && seg === i)}</span>))}
              {opRow('TRIGGER', <>
                {opBtn('REVEAL', () => stripTrigger('reveal'), ACC, '#fff')}
                {opBtn('POLL', () => stripTrigger('poll'))}
                {opBtn('HOTSPOT', () => stripTrigger('hotspot'))}
                {opBtn('ANNOUNCE', () => stripTrigger('announce'), '#D6202A', '#fff')}
              </>)}
              {opRow('TARGET', <>
                {(['all', 'venue', 'online'] as Target[]).map((t) => <span key={t}>{opBtn(t === 'all' ? 'ALL' : t === 'venue' ? 'VENUE' : 'ONLINE', () => set({ stripTarget: t }), undefined, undefined, st.stripTarget === t)}</span>)}
                <button onClick={() => set((x) => ({ mode: x.mode === 'venue' ? 'online' : 'venue', pick: x.mode === 'venue' ? 'online' : 'venue' }))} style={s("font:800 10px/1 'Archivo';letter-spacing:.08em;padding:8px 7px;color:var(--muted-lt);box-shadow:inset 0 0 0 1px rgba(242,242,240,.22)")}>YOU: {st.mode === 'venue' ? 'VENUE' : 'ONLINE'}</button>
              </>)}
            </>}
          </div>
        )}

        <div style={phoneStyle}>
          <div style={s("position:absolute;top:0;left:0;right:0;height:46px;z-index:50;display:flex;align-items:flex-end;justify-content:space-between;padding:0 26px 4px;font:700 12.5px/1 'Archivo';color:var(--on-panel);background:var(--panel)")}>
            <span>{clockLabel}</span>
            <div style={s('display:flex;align-items:center;gap:5px')}><span style={s('width:15px;height:8px;border:1.4px solid #F2F2F0;border-radius:2px;display:inline-block')} /><span style={s("font:700 10px/1 'Archivo';letter-spacing:.06em")}>5G</span></div>
          </div>

          <div data-fanscroll style={s('position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;padding-top:46px;padding-bottom:56px')}>
            {st.third && (
              <div style={s('position:sticky;top:0;z-index:45;overflow:hidden')}>
                <div style={s('animation:bgThird 4.6s cubic-bezier(.18,.9,.2,1) both;display:flex;align-items:stretch;background:var(--panel)')}>
                  <div style={{ ...s('width:14px;transform:skewX(-8deg) translateX(-3px)'), background: st.third.color }} />
                  <div style={s('flex:1;padding:14px 12px 16px 8px;min-width:0')}>
                    <div style={s('display:flex;align-items:center;gap:8px')}>
                      <Ms size={17} color={st.third.color}>{st.third.icon}</Ms>
                      <span style={{ ...s("font:800 15px/1 'Archivo Black';letter-spacing:.14em"), color: st.third.color }}>{st.third.kind}</span>
                    </div>
                    <div style={s("font:800 " + (NARROW ? 30 : 38) + "px/.9 'Archivo Black';letter-spacing:.008em;color:var(--on-panel);margin-top:9px")}>{st.third.title}</div>
                    <div style={s("font:500 11.5px/1.3 'Archivo';color:var(--muted);margin-top:7px")}>{st.third.note}</div>
                  </div>
                </div>
              </div>
            )}

            <div style={s('position:sticky;top:0;z-index:40;background:var(--panel)')}>
              <div style={s('display:flex;align-items:stretch;height:44px')}>
                {isSub && <button onClick={goBack} className="fh" style={s("display:flex;align-items:center;gap:6px;padding:0 10px 0 15px;font:800 10px/1 'Archivo';letter-spacing:.14em;color:var(--muted)")}><Ms size={15} color="inherit">arrow_back</Ms>{backLabel}</button>}
                <div style={s('display:flex;align-items:center;gap:8px;flex:1;min-width:0;padding-left:14px;overflow:hidden')}>
                  {!isSub && <img src={asset(cfg.brand.logo)} alt="" style={s('width:22px;height:22px;flex:none;object-fit:contain')} />}
                  {!isSub && <span style={s("font:800 15px/1 'Archivo';letter-spacing:.08em;color:var(--on-panel);white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{nextEv ? cfg.community.next.name.toUpperCase() : NARROW ? cfg.brand.wordmarkShort : cfg.brand.wordmark}</span>}
                </div>
                <div style={{ ...s('display:flex;align-items:center;gap:6px;padding:0 12px'), background: live && !nextEv ? '#D6202A' : 'rgba(242,242,240,.14)' }}>
                  {live && !nextEv && <span style={s('width:6px;height:6px;border-radius:50%;background:#fff;animation:bgBlink 1.6s steps(1,end) infinite')} />}
                  <span style={s("font:800 12px/1 'Archivo';letter-spacing:.08em;color:var(--on-panel);font-variant-numeric:tabular-nums;white-space:nowrap")}>{statusLabel}</span>
                </div>
                <button onClick={() => set((x) => ({ theme: x.theme === 'auto' ? 'light' : x.theme === 'light' ? 'dark' : 'auto' }))} className="fh2" aria-label="Theme" style={s('display:flex;align-items:center;padding:0 9px;background:var(--chrome)')}><Ms size={17} color="var(--muted)">{st.theme === 'dark' ? 'dark_mode' : st.theme === 'light' ? 'light_mode' : 'brightness_auto'}</Ms></button>
                <div style={s('display:flex;align-items:center;gap:5px;padding:0 12px 0 6px;background:var(--chrome)')}>
                  <Ms size={15} color={ACC}>{st.mode === 'venue' ? 'location_on' : 'wifi'}</Ms>
                  <span style={s("font:800 9.5px/1 'Archivo';letter-spacing:.1em;color:var(--on-panel)")}>{st.mode === 'venue' ? cfg.event.venueWord : 'ONLINE'}</span>
                </div>
              </div>
              {isHome && live && !nextEv && (
                <div style={s('display:flex;height:28px;background:var(--chrome)')}>
                  {cfg.segments.map((g, i) => { const on = i === seg, done = i < seg; const many = cfg.segments.length > 4; return (
                    <div key={g.id} style={{ ...s('flex:1;min-width:0;display:flex;align-items:center;justify-content:center;gap:4px;position:relative;overflow:hidden'), background: on ? 'rgba(var(--acc-rgb),.22)' : 'transparent' }}>
                      {on && <span style={s('width:5px;height:5px;flex:none;border-radius:50%;background:var(--acc-lt);animation:bgBlink 1.6s steps(1,end) infinite')} />}
                      {done && !many && <Ms size={12} color="var(--label)">check</Ms>}
                      <span style={{ ...s("font:800 " + (NARROW || many ? 8 : 9) + "px/1 'Archivo';letter-spacing:.08em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"), color: on ? '#F2F2F0' : done ? 'var(--label)' : 'var(--muted)' }}>{g.short}</span>
                      {on && <span style={s('position:absolute;left:0;right:0;bottom:0;height:2px;background:var(--acc)')} />}
                    </div>
                  ); })}
                </div>
              )}
              {isSub && (
                <div style={s('display:flex;align-items:center;gap:9px;height:40px;padding:0 15px;background:var(--chrome);box-shadow:inset 0 -1px 0 rgba(242,242,240,.08)')}>
                  <span style={s('width:5px;height:16px;flex:none;background:var(--acc);transform:skewX(-8deg)')} />
                  <span style={s("font:800 19px/1 'Archivo Black';letter-spacing:.05em;color:var(--on-panel);white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{titles[st.route]}</span>
                  <span style={s("font:800 8.5px/1 'Archivo';letter-spacing:.12em;color:var(--muted-lt);margin-left:auto;background:rgba(242,242,240,.08);padding:5px 8px;white-space:nowrap")}>{metas[st.route]}</span>
                </div>
              )}
            </div>

            {isHome && <Home {...P} />}
            {st.route === 'chat' && <Chat {...P} />}
            {st.route === 'drive' && <Drive {...P} />}
            {st.route === 'qa' && <QABoard {...P} full />}
          </div>

          <div style={s('position:absolute;right:8px;bottom:110px;width:80px;height:10px;z-index:47;pointer-events:none')}>
            {st.floats.map((f) => <span key={f.id} style={{ ...s('position:absolute;bottom:0;font-size:26px;animation:bgFloatUp 1.7s cubic-bezier(.2,.7,.3,1) both'), left: f.x + '%' }}>{f.e}</span>)}
          </div>

          {st.flash && (
            <div style={{ ...s('position:absolute;left:10px;right:10px;z-index:48;transition:top .3s cubic-bezier(.2,.8,.2,1)'), top: st.third ? 214 : 96, animation: st.flashOut ? 'bgFlashOut .18s cubic-bezier(.23,1,.32,1) both' : 'bgRise .32s cubic-bezier(.18,.9,.2,1) both' }}>
              <div style={s('display:flex;align-items:center;gap:11px;padding:11px 11px 11px 13px;background:var(--panel);border-radius:2px;box-shadow:0 14px 34px -8px rgba(27,11,45,.55)')}>
                <span style={s('width:36px;height:36px;flex:none;border-radius:2px;background:var(--acc);display:flex;align-items:center;justify-content:center')}><Ms size={20} color="#fff">campaign</Ms></span>
                <div style={s('flex:1;min-width:0')}>
                  <div style={s("font:800 8.5px/1 'Archivo';letter-spacing:.14em;color:var(--acc-lt)")}>{st.flash.kicker}</div>
                  <div style={s("font:700 13px/1.25 'Archivo';color:var(--on-panel);margin-top:5px")}>{st.flash.title}</div>
                  <div style={s("font:500 10.5px/1.3 'Archivo';color:var(--muted);margin-top:3px")}>{st.flash.sub}</div>
                </div>
                <button onClick={() => closeFlash()} aria-label="Dismiss" style={s('width:28px;height:28px;flex:none;border-radius:50%;background:rgba(242,242,240,.12);display:flex;align-items:center;justify-content:center')}><Ms size={16} color="var(--muted)">close</Ms></button>
              </div>
            </div>
          )}

          {!st.iris && st.hotspot === null && !st.revealing && (
            <button onClick={() => set({ iris: true })} className="fh2" style={s('position:absolute;right:0;bottom:96px;z-index:46;display:flex;align-items:center;gap:8px;padding:11px 13px 11px 12px;background:var(--panel);border-radius:3px 0 0 3px')}>
              <span style={s('width:7px;height:7px;background:var(--acc);animation:bgDot 1.6s ease-in-out infinite')} />
              <span style={s("font:800 10.5px/1 'Archivo';letter-spacing:.16em;color:var(--on-panel)")}>ASK IRIS</span>
            </button>
          )}
          {st.iris && <Iris {...{ cfg, st, set, ask, irisRef, closeIris, revealed }} />}
          {st.hotspot !== null && cfg.hotspots[st.hotspot] && <HotspotSheet {...{ cfg, st, set, close: closeHotspot, openHotspot, ask }} />}
          {st.revealing && <RevealMoment cfg={cfg} skip={() => { set({ revealing: false }); burst(8); }} />}

          {st.toast && (
            <div style={s('position:absolute;left:0;right:0;bottom:64px;z-index:75;display:flex;justify-content:center;pointer-events:none')}>
              <div style={s('display:flex;align-items:center;gap:9px;padding:11px 15px;background:var(--panel);animation:bgToast 2.4s ease both;max-width:92%')}>
                <Ms size={16} color={ACC}>check_circle</Ms>
                <span style={s("font:700 11.5px/1.2 'Archivo';letter-spacing:.06em;color:var(--on-panel)")}>{st.toast}</span>
              </div>
            </div>
          )}

          <div style={s('position:absolute;bottom:0;left:0;right:0;height:52px;z-index:40;display:flex;align-items:center;justify-content:center;padding:0 20px 12px;background:linear-gradient(transparent,var(--ground) 44%)')}>
            <div style={s("display:flex;align-items:center;gap:8px;padding:9px 15px;background:var(--sand);border-radius:100px;font:600 11.5px/1 'Archivo';color:var(--body)")}><Ms size={13} color="var(--label)">lock</Ms>{cfg.brand.domain}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════ shared bits ═══════════
const label = (t: string) => <div style={s("font:800 9.5px/1 'Archivo';letter-spacing:.18em;color:var(--label)")}>{t}</div>;
const sect = (t: string, right?: ReactNode) => (
  <div style={s('display:flex;align-items:center;gap:8px')}><span style={s('width:5px;height:15px;flex:none;background:var(--acc);transform:skewX(-8deg)')} />{label(t)}{right && <span style={s('margin-left:auto')}>{right}</span>}</div>
);
const darkBtn = (text: string, icon: string, onClick: () => void, extra = '') => (
  <button onClick={onClick} className="fp" style={s("display:inline-flex;align-items:center;justify-content:center;gap:7px;font:800 11.5px/1 'Archivo';letter-spacing:.06em;color:var(--on-panel);background:var(--panel);padding:13px 15px;" + extra)}>{text}<Ms size={15} color="var(--on-panel)">{icon}</Ms></button>
);
const accBtn = (text: string, icon: string, onClick: () => void, extra = '') => (
  <button onClick={onClick} className="fv" style={s("display:inline-flex;align-items:center;justify-content:center;gap:7px;font:800 11.5px/1 'Archivo';letter-spacing:.06em;color:#fff;background:var(--acc);padding:13px 15px;" + extra)}>{text}<Ms size={15} color="#fff">{icon}</Ms></button>
);
const small = (t: string) => <span style={s("font:700 9.5px/1 'Archivo';letter-spacing:.1em;color:var(--label)")}>{t}</span>;

// The hero image on its stage: a silhouette until the reveal, then lit, with feature points.
function CarStage({ cfg, revealed, interactive, seen, openHotspot, height = 210 }: { cfg: EventConfig; revealed: boolean; interactive: boolean; seen: Record<string, boolean>; openHotspot?: (i: number) => void; height?: number }) {
  const im = cfg.event.heroImage;
  return (
    <div style={{ ...s('position:relative;width:100%;overflow:hidden'), height }}>
      <div style={{ ...s('position:absolute;left:50%;top:50%;width:118%;transform:translate(-50%,-50%);mix-blend-mode:lighten'), aspectRatio: `${im.w}/${im.h}` }}>
        {im.src && <img src={asset(im.src)} alt={revealed ? cfg.reveal.title : ''} style={{ ...s('position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:filter 1.2s ease'), filter: revealed ? 'none' : 'brightness(.24) contrast(1.25) saturate(0) blur(.6px)' }} />}
        {revealed && interactive && cfg.hotspots.map((h, i) => (
          <button key={h.id} onClick={() => openHotspot?.(i)} aria-label={h.name} className="hs" style={{ ...s('position:absolute;width:30px;height:30px;margin:-15px 0 0 -15px;display:flex;align-items:center;justify-content:center'), left: h.x + '%', top: h.y + '%', animationDelay: i * 0.12 + 's' }}>
            <span style={{ ...s('width:14px;height:14px;border-radius:50%;border:2px solid #fff;animation:evPulse 2s ease-out infinite'), background: seen[h.id] ? 'rgba(255,255,255,.35)' : 'var(--acc)', animationDelay: i * 0.3 + 's' }} />
          </button>
        ))}
      </div>
      <div style={s('position:absolute;inset:0;background:linear-gradient(180deg,var(--hero) 0%,rgba(var(--hero-rgb),0) 22%,rgba(var(--hero-rgb),0) 74%,var(--hero) 100%);pointer-events:none')} />
      {!revealed && <div style={s('position:absolute;inset:0;background:radial-gradient(60% 50% at 50% 55%,rgba(var(--acc-rgb),.22),transparent 70%);animation:bgFloods 3s ease-in-out infinite;pointer-events:none')} />}
    </div>
  );
}

function HeroShell({ glow = 'rgba(var(--acc-rgb),.42)', children }: { glow?: string; children: ReactNode }) {
  return (
    <div style={s('position:relative;overflow:hidden;background:var(--hero)')}>
      <div style={{ ...s('position:absolute;inset:0'), background: 'radial-gradient(120% 72% at 50% -14%,' + glow + ',transparent 56%)', animation: 'bgFloods 5s ease-in-out infinite' }} />
      <div style={s('position:absolute;top:0;bottom:0;left:-45%;width:45%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.12),transparent);transform:skewX(-12deg);animation:bgSweep 1.6s cubic-bezier(.3,.7,.3,1) .3s both;pointer-events:none')} />
      <div style={s('position:relative')}>{children}</div>
    </div>
  );
}
const kicker = (top: string, sub: string) => (
  <div style={s('display:flex;align-items:center;justify-content:center;gap:11px')}>
    <span style={s('height:1px;flex:1;max-width:38px;background:linear-gradient(90deg,transparent,rgba(242,242,240,.55))')} />
    <div style={s('text-align:center')}>
      <div style={s("font:800 9px/1 'Archivo';letter-spacing:.24em;color:#F2F2F0")}>{top}</div>
      <div style={s("font:700 8px/1 'Archivo';letter-spacing:.2em;color:var(--acc-lt);margin-top:6px")}>{sub}</div>
    </div>
    <span style={s('height:1px;flex:1;max-width:38px;background:linear-gradient(90deg,rgba(242,242,240,.55),transparent)')} />
  </div>
);
const Digits = ({ parts }: { parts: [string, string][] }) => (
  <div style={s('display:flex;align-items:flex-start;justify-content:center;gap:9px;margin-top:13px;animation:bgReveal .6s cubic-bezier(.2,.85,.2,1) .25s both')}>
    {parts.map(([v, l], i) => (
      <div key={l} style={s('display:flex;align-items:flex-start;gap:9px')}>
        {i > 0 && <span style={s("padding-top:5px;font:800 44px/.78 'Archivo Black';color:rgba(242,242,240,.26)")}>:</span>}
        <div style={s('display:flex;flex-direction:column;align-items:center')}>
          <span style={{ ...s("font:800 " + (NARROW ? 50 : 62) + "px/.78 'Archivo Black';font-variant-numeric:tabular-nums;text-shadow:0 3px 24px rgba(13,5,23,.65)"), color: i === parts.length - 1 ? ACC : '#fff' }}>{v}</span>
          <span style={{ ...s("font:800 8.5px/1 'Archivo';letter-spacing:.18em;margin-top:10px"), color: i === parts.length - 1 ? ACC : 'var(--muted)' }}>{l}</span>
        </div>
      </div>
    ))}
  </div>
);
const audLine = (cfg: EventConfig, venue: number, online: number) => (
  <div style={s('display:flex;align-items:center;justify-content:center;gap:14px;margin-top:14px;flex-wrap:wrap')}>
    {venue > 0 && <span style={s("display:flex;align-items:center;gap:5px;font:700 10px/1 'Archivo';letter-spacing:.12em;color:var(--muted-lt);font-variant-numeric:tabular-nums")}><Ms size={13} color="var(--acc-lt)">location_on</Ms>{venue.toLocaleString()} IN THE {cfg.event.venueWord}</span>}
    <span style={s("display:flex;align-items:center;gap:5px;font:700 10px/1 'Archivo';letter-spacing:.12em;color:var(--muted-lt);font-variant-numeric:tabular-nums")}><Ms size={13} color="var(--acc-lt)">wifi</Ms>{online.toLocaleString()} ONLINE</span>
  </div>
);
const heroTitle = (t: string, size = 36) => <div style={s("font:800 " + (NARROW ? size - 6 : size) + "px/.9 'Archivo Black';letter-spacing:.02em;color:#fff;text-align:center;text-shadow:0 2px 12px rgba(13,5,23,.75);white-space:pre-line")}>{t}</div>;

// ═══════════ HOME ═══════════
function Home(P: any) {
  const { st, before, live, brk, after, community, nextEv } = P;
  if (nextEv) return <div style={s('animation:bgFade .3s ease both')} key="next"><NextEventHome {...P} /></div>;
  return (
    <div style={s('animation:bgFade .3s ease both')} key={st.ms}>
      {before && <BeforeHome {...P} />}
      {live && <LiveHome {...P} />}
      {brk && <BreakHome {...P} />}
      {after && <AfterHome {...P} />}
      {community && <CommunityHome {...P} />}
    </div>
  );
}

function BeforeHome(P: any) {
  const { cfg, st, set, cd, aud, register, share } = P as { cfg: EventConfig; [k: string]: any };
  const E = cfg.event;
  return (
    <section>
      <HeroShell>
        <div style={s('padding:16px 16px 0')}>{kicker(E.kicker, E.kickerSub)}</div>
        <CarStage cfg={cfg} revealed={false} interactive={false} seen={{}} height={176} />
        <div style={s('padding:0 16px')}>
          {heroTitle(E.title)}
          <div style={s("font:800 9.5px/1 'Archivo';letter-spacing:.3em;color:var(--acc-lt);text-align:center;margin-top:22px")}>{E.countdownLabel}</div>
          <Digits parts={[[pad(Math.floor(cd / 3600)), 'HRS'], [pad(Math.floor(cd / 60) % 60), 'MIN'], [pad(cd % 60), 'SEC']]} />
          <div style={s("font:700 10px/1.4 'Archivo';letter-spacing:.14em;color:var(--muted-lt);text-align:center;margin-top:17px")}>{E.dateLine}</div>
          {audLine(cfg, 0, aud.online)}
        </div>
        <button onClick={() => document.getElementById('ev-register')?.scrollIntoView({ behavior: 'smooth', block: 'center' })} className="agg" style={s('position:relative;display:flex;align-items:center;gap:13px;width:100%;text-align:left;margin-top:20px;padding:14px 16px;background:rgba(var(--acc-rgb),.14);box-shadow:inset 0 1px 0 rgba(242,242,240,.12)')}>
          <span style={s('width:38px;height:38px;flex:none;background:var(--acc);display:flex;align-items:center;justify-content:center')}><Ms size={22} color="var(--hero)">event_available</Ms></span>
          <span style={s('flex:1;min-width:0')}>
            <span style={s("display:block;font:800 15px/1 'Archivo Black';letter-spacing:.03em;color:#fff")}>{st.registered ? 'YOU’RE ON THE LIST' : E.inviteTitle}</span>
            <span style={s("display:block;font:500 11.5px/1.3 'Archivo';color:var(--muted-lt);margin-top:4px")}>{st.registered ? (st.mode === 'venue' ? 'In person · ' + E.venueShort.toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'Online · we’ll ping you before it starts') : E.inviteSub}</span>
          </span>
          <Ms size={18} color="var(--acc-lt)">chevron_right</Ms>
        </button>
      </HeroShell>

      {st.reminders.length > 0 && (
        <div style={s('padding:22px 16px 0')}>
          {sect('UPDATES FROM ' + cfg.brand.name.toUpperCase())}
          <div style={s('margin-top:10px;display:flex;flex-direction:column;gap:8px')}>
            {st.reminders.map((r: { id: string; title: string; body: string }, i: number) => (
              <div key={r.id} style={{ ...s('display:flex;gap:12px;padding:14px;background:var(--sand);animation:bgRise .35s cubic-bezier(.18,.9,.2,1) both'), boxShadow: i === 0 ? 'inset 3px 0 0 var(--acc)' : 'none' }}>
                <Ms size={20} color={ACC}>notifications_active</Ms>
                <div style={s('flex:1;min-width:0')}><div style={s("font:700 14px/1.25 'Archivo';color:var(--ink)")}>{r.title}</div><div style={s("font:500 12px/1.45 'Archivo';color:var(--body);margin-top:4px")}>{r.body}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {E.details.length > 0 && (
        <div style={s('padding:22px 16px 0')}>
          {sect('EVENT DETAILS', <button onClick={share} style={s("display:flex;align-items:center;gap:5px;font:700 10.5px/1 'Archivo';letter-spacing:.08em;color:var(--acc)")}><Ms size={15} color={ACC}>ios_share</Ms>SHARE</button>)}
          <div style={s('margin-top:10px;background:var(--sand);padding:4px 14px')}>
            {E.details.map((d, i) => (
              <div key={d.k + i} style={{ ...s('display:flex;align-items:flex-start;gap:11px;padding:11px 0'), borderTop: i ? '1.5px solid var(--hair)' : 'none' }}>
                <Ms size={18} color="var(--label)">{d.icon || 'info'}</Ms>
                <span style={s('flex:1;min-width:0')}><span style={s("display:block;font:800 8.5px/1 'Archivo';letter-spacing:.14em;color:var(--label)")}>{d.k.toUpperCase()}</span><span style={s("display:block;font:600 13px/1.35 'Archivo';color:var(--ink);margin-top:4px")}>{d.v}</span></span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div id="ev-register" style={s('padding:22px 16px 0')}>
        {sect('REGISTER INTEREST')}
        <div style={s('margin-top:10px;background:var(--sand);padding:16px')}>
          {st.registered ? (
            <div style={s('display:flex;align-items:center;gap:12px')}>
              <span style={s('width:40px;height:40px;flex:none;background:var(--acc);display:flex;align-items:center;justify-content:center')}><Ms size={22} color="#fff">check</Ms></span>
              <div style={s('flex:1;min-width:0')}>
                <div style={s("font:800 19px/1 'Archivo Black';color:var(--ink)")}>You’re on the list</div>
                <div style={s("font:500 12px/1.4 'Archivo';color:var(--body);margin-top:5px")}>{st.mode === 'venue' ? E.registeredVenue : E.registeredOnline}</div>
              </div>
              <button onClick={() => set({ registered: false })} style={s("font:800 9.5px/1 'Archivo';letter-spacing:.1em;color:var(--acc)")}>CHANGE</button>
            </div>
          ) : (<>
            <div style={s("font:800 22px/1 'Archivo Black';color:var(--ink)")}>How are you joining?</div>
            <div style={s('margin-top:12px;display:flex;flex-direction:column;gap:7px')}>
              {([['venue', E.venueOption, E.venueOptionSub, 'location_on'], ['online', 'Online', E.onlineOptionSub, 'wifi']] as const).filter(([k]) => E.format === 'Hybrid' || (E.format === 'Online' ? k === 'online' : k === 'venue')).map(([k, t, d, icon]) => { const on = st.pick === k; return (
                <button key={k} onClick={() => set({ pick: k })} className="fw" style={{ ...s('display:flex;align-items:center;gap:11px;width:100%;text-align:left;padding:13px'), background: on ? 'var(--panel)' : 'var(--ground)' }}>
                  <Ms size={20} color={on ? 'var(--acc-lt)' : 'var(--label)'}>{icon}</Ms>
                  <span style={s('flex:1;min-width:0')}><span style={{ ...s("display:block;font:700 14px/1.2 'Archivo'"), color: on ? 'var(--on-panel)' : 'var(--ink)' }}>{t}</span><span style={{ ...s("display:block;font:500 11.5px/1.3 'Archivo';margin-top:3px"), color: on ? 'var(--muted)' : 'var(--label)' }}>{d}</span></span>
                  <span style={{ ...s('width:18px;height:18px;flex:none;border-radius:50%;display:flex;align-items:center;justify-content:center'), boxShadow: on ? 'none' : 'inset 0 0 0 2px var(--sand2)', background: on ? ACC : 'transparent' }}>{on && <Ms size={13} color="#fff">check</Ms>}</span>
                </button>
              ); })}
            </div>
            {accBtn('REGISTER INTEREST', 'arrow_forward', register, 'width:100%;margin-top:12px')}
          </>)}
        </div>
      </div>

      <AskCard {...P} />

      <div style={s('padding:22px 16px 0')}>
        {sect('AGENDA', small(E.dateShort))}
        <div style={s('margin-top:6px')}>
          {cfg.segments.map((g) => (
            <div key={g.id} style={s('display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1.5px solid var(--hair)')}>
              <span style={s("width:44px;flex:none;font:800 15px/1 'Archivo Black';color:var(--ink);font-variant-numeric:tabular-nums")}>{g.time}</span>
              <span style={s('flex:1;min-width:0')}><span style={s("display:block;font:700 13.5px/1.2 'Archivo';color:var(--ink)")}>{g.name}</span>{g.blurb && <span style={s("display:block;font:500 11.5px/1.3 'Archivo';color:var(--label);margin-top:3px")}>{g.blurb}</span>}</span>
              {g.kind === 'reveal' && <span style={s("font:800 9px/1 'Archivo';letter-spacing:.1em;padding:6px 7px;color:#fff;background:var(--acc)")}>THE MOMENT</span>}
            </div>
          ))}
        </div>
      </div>

      {cfg.presenters.length > 0 && (
        <div style={s('padding:22px 16px 0')}>
          {sect('PRESENTERS')}
          <div style={s('display:flex;gap:8px;margin-top:10px;overflow-x:auto;padding-bottom:2px')}>
            {cfg.presenters.map((p) => (
              <div key={p.name} style={s('flex:none;width:148px;background:var(--sand);overflow:hidden')}>
                <div style={s('position:relative;height:120px;background:var(--panel)')}>{p.photo && <img src={asset(p.photo)} alt="" loading="lazy" style={s('width:100%;height:100%;object-fit:cover;display:block')} />}<span style={s('position:absolute;left:0;right:0;bottom:0;height:40%;background:linear-gradient(transparent,rgba(27,11,45,.6))')} /></div>
                <div style={s('padding:11px 12px 13px')}>
                  <div style={s("font:800 15px/1.05 'Archivo Black';color:var(--ink)")}>{p.name}</div>
                  <div style={s("font:500 11px/1.35 'Archivo';color:var(--body);margin-top:4px")}>{p.role}</div>
                  <div style={s("font:800 8.5px/1 'Archivo';letter-spacing:.12em;color:var(--acc);margin-top:8px")}>{p.slot.toUpperCase()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <ChatPreview {...P} />
      {cfg.sponsors.length > 0 && (
        <div style={s('padding:26px 16px 0')}>
          <div style={s("font:800 8.5px/1 'Archivo';letter-spacing:.18em;color:var(--label);text-align:center")}>WITH THANKS TO OUR PARTNERS</div>
          <div style={s('display:flex;flex-wrap:wrap;justify-content:center;gap:6px 18px;margin-top:12px;padding:14px 10px;border-top:1.5px solid var(--hair);border-bottom:1.5px solid var(--hair)')}>
            {cfg.sponsors.map((n) => <span key={n} style={s("font:800 13px/1 'Archivo';letter-spacing:.02em;color:var(--label);white-space:nowrap")}>{n}</span>)}
          </div>
        </div>
      )}
      <div style={s('height:64px')} />
    </section>
  );
}

function LiveHome(P: any) {
  const { cfg, st, seg, revealed, aud, react, openHotspot, set, ask } = P as { cfg: EventConfig; [k: string]: any };
  const g = cfg.segments[seg] || cfg.segments[0];
  const isReveal = g?.kind === 'reveal', isQa = g?.kind === 'qa';
  const title = isReveal && revealed ? cfg.reveal.title : g?.heroTitle || '';
  const sub = isReveal && revealed ? cfg.reveal.sub : (st.mode === 'online' && g?.heroSubOnline) || g?.heroSub || '';
  const seenN = cfg.hotspots.filter((h) => st.seen[h.id]).length;
  return (
    <section>
      {st.mode === 'online' && cfg.event.format !== 'In person' && <StreamEmbed cfg={cfg} label={'LIVE · ' + (g?.short || '')} />}
      <HeroShell glow={isReveal && !revealed ? 'rgba(var(--acc-rgb),.6)' : 'rgba(214,32,42,.3)'}>
        <div style={s('display:flex;align-items:center;justify-content:center;padding-top:15px')}>
          <span style={s('display:flex;align-items:center;gap:7px;background:rgba(214,32,42,.92);padding:7px 11px')}><span style={s('width:7px;height:7px;border-radius:50%;background:#fff;animation:bgBlink 1.2s ease-in-out infinite')} /><span style={s("font:800 9.5px/1 'Archivo';letter-spacing:.2em;color:#fff")}>LIVE · {g?.short}</span></span>
        </div>
        <CarStage cfg={cfg} revealed={revealed} interactive={revealed} seen={st.seen} openHotspot={openHotspot} height={revealed ? 236 : 190} />
        <div style={s('padding:0 16px 16px;text-align:center')}>
          <div key={title} style={s('animation:bgReveal .5s cubic-bezier(.2,.85,.2,1) both')}>{heroTitle(title, 34)}</div>
          {sub && <div style={s("font:500 12.5px/1.4 'Archivo';color:var(--muted-lt);margin-top:8px")}>{sub}</div>}
          {revealed && cfg.hotspots.length > 0 && <div style={s("font:800 9.5px/1 'Archivo';letter-spacing:.14em;color:var(--acc-lt);margin-top:10px")}>EXPLORED {seenN} OF {cfg.hotspots.length} FEATURES</div>}
          {audLine(cfg, aud.venue, aud.online)}
        </div>
        <div style={s('display:flex;align-items:center;gap:8px;padding:12px 16px;background:rgba(var(--acc-rgb),.14);box-shadow:inset 0 1px 0 rgba(242,242,240,.12)')}>
          <span style={s("font:800 9.5px/1 'Archivo';letter-spacing:.16em;color:var(--muted-lt);flex:1")}>REACT</span>
          {REACTS.map((e) => <button key={e} onClick={() => react(e)} className="fq" aria-label={'React ' + e} style={s('width:44px;height:40px;font-size:21px;display:flex;align-items:center;justify-content:center;background:rgba(242,242,240,.08)')}>{e}</button>)}
        </div>
      </HeroShell>

      {st.poll !== null && cfg.polls[st.poll] && <div style={s('padding:22px 16px 0')}>{sect('LIVE POLL')}<PollCard p={cfg.polls[st.poll]} tag="LIVE" tagBg="#D6202A" {...P} /></div>}
      {isQa && <QABoard {...P} />}
      {revealed && !isQa && cfg.hotspots.length > 0 && (
        <div style={s('padding:22px 16px 0')}>
          {sect(cfg.product.sectionTitle, small(cfg.product.priceLine))}
          <div style={s('display:flex;gap:8px;margin-top:10px;overflow-x:auto;padding-bottom:2px')}>
            {cfg.hotspots.map((h, i) => (
              <button key={h.id} onClick={() => openHotspot(i)} className="fs" style={s('flex:none;width:132px;text-align:left;background:var(--sand);padding:13px')}>
                <div style={s('display:flex;align-items:center;justify-content:space-between')}><span style={s("font:800 8.5px/1 'Archivo';letter-spacing:.12em;color:var(--label)")}>{pad(i + 1)}</span>{st.seen[h.id] && <Ms size={14} color={ACC}>check_circle</Ms>}</div>
                <div style={s("font:800 22px/1 'Archivo Black';color:var(--acc);margin-top:10px")}>{h.stat}</div>
                <div style={s("font:700 12.5px/1.2 'Archivo';color:var(--ink);margin-top:6px")}>{h.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}
      {!isQa && <AskCard {...P} compact />}
      <IrisTeaser {...{ cfg, revealed, set, ask }} />
      <ChatPreview {...P} />
      <div style={s('height:64px')} />
    </section>
  );
}

function BreakHome(P: any) {
  const { cfg, st, set, breakLeft, aud } = P as { cfg: EventConfig; [k: string]: any };
  return (
    <section>
      <HeroShell glow="rgba(79,179,232,.3)">
        <div style={s('padding:15px 16px 20px;text-align:center')}>
          <span style={s("display:inline-block;font:800 9.5px/1 'Archivo';letter-spacing:.2em;color:#4FB3E8;background:rgba(79,179,232,.16);padding:7px 10px")}>BREAK</span>
          <div style={s("font:800 9.5px/1 'Archivo';letter-spacing:.3em;color:var(--acc-lt);margin-top:22px")}>BACK IN</div>
          <Digits parts={[[pad(Math.floor(breakLeft / 60)), 'MIN'], [pad(breakLeft % 60), 'SEC']]} />
          <div style={s("font:500 12.5px/1.45 'Archivo';color:var(--muted-lt);margin-top:16px;max-width:290px;margin-left:auto;margin-right:auto")}>{cfg.breakContent.sub}</div>
          {audLine(cfg, aud.venue, aud.online)}
        </div>
      </HeroShell>
      <div style={s('padding:22px 16px 0')}>
        {sect('QUICK POLL')}
        <PollCard p={cfg.breakContent.poll} tag="OPEN" tagBg="var(--panel)" {...P} />
      </div>
      {cfg.breakContent.reads.length > 0 && (
        <div style={s('padding:22px 16px 0')}>
          {sect('WHILE YOU WAIT')}
          <div style={s('margin-top:10px;display:flex;flex-direction:column;gap:8px')}>
            {cfg.breakContent.reads.map((r, i) => { const open = st.readOpen === i; return (
              <button key={r.kicker + i} onClick={() => set({ readOpen: open ? null : i })} className="fs" style={s('display:block;width:100%;text-align:left;background:var(--sand);padding:14px 15px')}>
                <span style={s('display:flex;align-items:center;gap:8px')}><span style={s("font:800 8.5px/1 'Archivo';letter-spacing:.14em;color:var(--acc)")}>{r.kicker}</span><Ms size={18} color="var(--label)" style={{ marginLeft: 'auto', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }}>expand_more</Ms></span>
                <span style={s("display:block;font:800 17px/1.1 'Archivo Black';color:var(--ink);margin-top:7px")}>{r.title}</span>
                {open && <span style={s("display:block;font:500 13px/1.5 'Archivo';color:var(--body);margin-top:8px;animation:bgFade .25s ease both")}>{r.body}</span>}
              </button>
            ); })}
          </div>
        </div>
      )}
      <ChatPreview {...P} />
      <div style={s('height:64px')} />
    </section>
  );
}

function AfterHome(P: any) {
  const { cfg, st, go, follow, openHotspot } = P as { cfg: EventConfig; [k: string]: any };
  const done = st.drive.done;
  const room = cfg.cta.options.find((r) => r.id === st.drive.showroom) || cfg.cta.options[0];
  return (
    <section>
      <HeroShell>
        <div style={s('padding-top:15px;display:flex;justify-content:center')}><span style={s("font:800 9.5px/1 'Archivo';letter-spacing:.2em;color:var(--acc-lt);background:rgba(var(--acc-rgb),.18);padding:7px 10px")}>{cfg.after.badge}</span></div>
        <CarStage cfg={cfg} revealed interactive seen={st.seen} openHotspot={openHotspot} height={220} />
        <div style={s('padding:0 16px 18px;text-align:center')}>
          {heroTitle(cfg.after.title)}
          <div style={s("font:500 12.5px/1.4 'Archivo';color:var(--muted-lt);margin-top:8px")}>{cfg.after.sub}</div>
          <div style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:1px;margin-top:16px;background:rgba(242,242,240,.1)')}>
            {cfg.after.stats.map(([v, l]) => (
              <div key={l} style={s('padding:12px 4px;background:var(--hero)')}><div style={s("font:800 24px/.9 'Archivo Black';color:#fff;font-variant-numeric:tabular-nums")}>{v}</div><div style={s("font:800 8px/1 'Archivo';letter-spacing:.16em;color:var(--muted);margin-top:7px")}>{l}</div></div>
            ))}
          </div>
        </div>
      </HeroShell>

      <div style={s('padding:22px 16px 0')}>
        <div style={s('background:var(--panel);padding:18px 16px 18px')}>
          <div style={s('display:flex;align-items:center;gap:8px')}><span style={s('width:6px;height:18px;background:var(--acc);transform:skewX(-8deg)')} /><span style={s("font:800 9.5px/1 'Archivo';letter-spacing:.18em;color:var(--muted)")}>{done ? 'BOOKED' : cfg.cta.cardKicker}</span></div>
          <div style={s("font:800 30px/.9 'Archivo Black';color:var(--on-panel);margin-top:10px")}>{done ? cfg.cta.doneTitle : cfg.cta.title}</div>
          <div style={s("font:500 13px/1.5 'Archivo';color:var(--muted);margin-top:8px")}>{done ? `${room?.name || ''} · ${st.drive.slot}. ${cfg.cta.doneSub}` : cfg.cta.sub}</div>
          {done ? darkBtn('CHANGE', 'edit', go('drive'), 'margin-top:14px;background:rgba(242,242,240,.1)') : accBtn(cfg.cta.button, 'arrow_forward', go('drive'), 'margin-top:14px')}
        </div>
      </div>

      <div style={s('padding:12px 16px 0')}>
        <button onClick={follow} className="fs" style={s('display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:var(--sand);padding:15px')}>
          <span style={{ ...s('width:40px;height:40px;flex:none;display:flex;align-items:center;justify-content:center'), background: st.following ? ACC : 'var(--panel)' }}><Ms size={21} color="#fff">{st.following ? 'notifications_active' : 'notifications'}</Ms></span>
          <span style={s('flex:1;min-width:0')}><span style={s("display:block;font:700 14px/1.2 'Archivo';color:var(--ink)")}>{st.following ? cfg.follow.doneTitle : cfg.follow.title}</span><span style={s("display:block;font:500 11.5px/1.35 'Archivo';color:var(--label);margin-top:3px")}>{st.following ? cfg.follow.doneSub : cfg.follow.sub}</span></span>
          <span style={{ ...s("font:800 9px/1 'Archivo';letter-spacing:.1em;padding:7px 8px"), color: st.following ? '#fff' : 'var(--on-panel)', background: st.following ? ACC : 'var(--panel)' }}>{st.following ? 'FOLLOWING' : 'FOLLOW'}</span>
        </button>
      </div>

      <div style={s('padding:22px 16px 0')}>
        {sect(cfg.after.recapTitle)}
        {cfg.product.variants.length > 0 && (
          <div style={s('margin-top:6px')}>
            {cfg.product.variants.map((v) => (
              <div key={v.name} style={s('display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1.5px solid var(--hair)')}>
                <span style={s('flex:1;min-width:0')}><span style={s("display:block;font:700 13.5px/1.2 'Archivo';color:var(--ink)")}>{v.name}</span><span style={s("display:block;font:500 11.5px/1.3 'Archivo';color:var(--label);margin-top:3px")}>{v.spec}</span></span>
                <span style={s("font:800 13px/1 'Archivo';color:var(--ink);font-variant-numeric:tabular-nums")}>{v.price}</span>
              </div>
            ))}
          </div>
        )}
        <div style={s('display:flex;flex-direction:column;gap:7px;margin-top:14px')}>
          {cfg.hotspots.map((h, i) => (
            <button key={h.id} onClick={() => openHotspot(i)} className="frow" style={s('display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:var(--sand);padding:12px 14px')}>
              <span style={s("width:62px;flex:none;font:800 15px/1 'Archivo Black';color:var(--acc)")}>{h.stat}</span>
              <span style={s('flex:1;min-width:0')}><span style={s("display:block;font:700 13px/1.2 'Archivo';color:var(--ink)")}>{h.name}</span><span style={s("display:block;font:500 11px/1.3 'Archivo';color:var(--label);margin-top:3px")}>{h.unit}</span></span>
              <Ms size={18} color="var(--label)">chevron_right</Ms>
            </button>
          ))}
        </div>
      </div>
      <ChatPreview {...P} title="THE CHAT STAYS OPEN" />
      <div style={s('height:64px')} />
    </section>
  );
}

function StreamEmbed({ cfg, label: lab, replay }: { cfg: EventConfig; label: string; replay?: boolean }) {
  const src = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('stream') : null;
  return (
    <div style={s('position:relative;width:100%;aspect-ratio:16/9;background:var(--hero-deep);overflow:hidden')}>
      {src ? <iframe src={src} title="Livestream" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen style={s('position:absolute;inset:0;width:100%;height:100%;border:0')} /> : (<>
        {cfg.event.heroImage.src && <img src={asset(cfg.event.heroImage.src)} alt="" style={s('position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.35;filter:saturate(.4)')} />}
        <div style={s('position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px')}>
          <span style={s('width:54px;height:54px;border-radius:50%;background:rgba(242,242,240,.16);display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1.5px rgba(242,242,240,.4)')}><Ms size={30} color="#fff">play_arrow</Ms></span>
          <span style={s("font:700 10px/1 'Archivo';letter-spacing:.12em;color:var(--muted-lt)")}>{replay ? 'REPLAY' : 'STREAM'} · YOUTUBE / VIMEO EMBED</span>
        </div>
      </>)}
      <span style={s('position:absolute;left:10px;top:10px;display:flex;align-items:center;gap:6px;background:' + (replay ? 'rgba(27,11,45,.85)' : 'rgba(214,32,42,.92)') + ';padding:6px 8px')}>{!replay && <span style={s('width:6px;height:6px;border-radius:50%;background:#fff;animation:bgBlink 1.2s ease-in-out infinite')} />}<span style={s("font:800 9px/1 'Archivo';letter-spacing:.16em;color:#fff")}>{lab}</span></span>
    </div>
  );
}

function CommunityHome(P: any) {
  const { cfg, st, set, aud, ask, openHotspot } = P as { cfg: EventConfig; [k: string]: any };
  const C = cfg.community;
  return (
    <section>
      <HeroShell>
        <div style={s('padding:16px 16px 20px')}>
          <div style={s('display:flex;align-items:center;gap:8px')}><span style={s('width:6px;height:18px;background:var(--acc);transform:skewX(-8deg)')} /><span style={s("font:800 9.5px/1 'Archivo';letter-spacing:.18em;color:var(--muted)")}>{C.badge}</span></div>
          <div style={s("font:800 34px/.88 'Archivo Black';color:#fff;margin-top:12px;white-space:pre-line")}>{C.title}</div>
          <div style={s("font:500 13px/1.5 'Archivo';color:var(--muted-lt);margin-top:10px;max-width:310px")}>{C.sub}</div>
          {audLine(cfg, 0, aud.online)}
        </div>
      </HeroShell>
      <div style={s('padding:22px 16px 0')}>
        <div style={s('background:var(--panel);padding:18px 16px')}>
          <div style={s('display:flex;align-items:center;gap:8px')}><span style={s('width:6px;height:18px;background:var(--acc);transform:skewX(-8deg)')} /><span style={s("font:800 9.5px/1 'Archivo';letter-spacing:.18em;color:var(--muted)")}>NEXT EVENT · {C.next.date}</span></div>
          <div style={s("font:800 30px/.9 'Archivo Black';color:var(--on-panel);margin-top:10px")}>{C.next.name}</div>
          <div style={s("font:500 13px/1.5 'Archivo';color:var(--muted);margin-top:8px")}>{C.next.blurb}</div>
          <div style={s('display:flex;gap:8px;margin-top:14px;flex-wrap:wrap')}>
            {st.nextReg
              ? <span style={s("display:inline-flex;align-items:center;gap:7px;font:800 11.5px/1 'Archivo';letter-spacing:.06em;color:#fff;background:rgba(var(--acc-rgb),.3);padding:13px 15px")}><Ms size={15} color="#fff">check</Ms>REGISTERED</span>
              : accBtn('REGISTER', 'arrow_forward', () => set({ nextReg: true }))}
            {darkBtn('OPEN EVENT PAGE', 'open_in_new', () => set({ event: 'next', route: 'home', navStack: [] }), 'background:rgba(242,242,240,.1)')}
          </div>
        </div>
      </div>
      <div style={s('padding:22px 16px 0')}>
        {sect(C.pastLabel, small(C.pastDate))}
        <div style={s('margin-top:10px;background:var(--sand)')}>
          <StreamEmbed cfg={cfg} label={C.replay} replay />
          <div style={s('padding:14px 15px 15px')}>
            <div style={s("font:800 20px/1 'Archivo Black';color:var(--ink)")}>{C.pastTitle}</div>
            <div style={s("font:500 12px/1.45 'Archivo';color:var(--body);margin-top:6px")}>{C.pastSub}</div>
            {cfg.hotspots.length > 0 && <div style={s('display:flex;gap:7px;margin-top:12px;overflow-x:auto')}>
              {cfg.hotspots.map((h, i) => <button key={h.id} onClick={() => openHotspot(i)} className="fs" style={s("flex:none;font:700 11px/1 'Archivo';color:var(--ink);background:var(--ground);padding:9px 10px")}>{h.name}</button>)}
            </div>}
          </div>
        </div>
      </div>
      <IrisTeaser {...{ cfg, revealed: true, set, ask }} />
      <ChatPreview {...P} title="COMMUNITY CHAT" />
      <div style={s('height:64px')} />
    </section>
  );
}

function NextEventHome(P: any) {
  const { cfg, st, set } = P as { cfg: EventConfig; [k: string]: any };
  const N = cfg.community.next;
  return (
    <section>
      {st.attended && (
        <div style={s('display:flex;align-items:center;gap:12px;padding:14px 16px;background:var(--acc);animation:bgRise .4s cubic-bezier(.18,.9,.2,1) both')}>
          <Ms size={22} color="#fff">waving_hand</Ms>
          <div style={s('flex:1;min-width:0')}><div style={s("font:800 17px/1 'Archivo Black';color:#fff")}>Welcome back</div><div style={s("font:500 12px/1.4 'Archivo';color:rgba(255,255,255,.85);margin-top:4px")}>You were at the {cfg.event.name}. Your details are saved, one tap to register.</div></div>
        </div>
      )}
      <HeroShell>
        <div style={s('padding:16px 16px 0')}>{kicker(cfg.brand.name.toUpperCase(), N.kicker + ' · ' + N.place)}</div>
        <CarStage cfg={cfg} revealed interactive={false} seen={{}} height={170} />
        <div style={s('padding:0 16px 20px;text-align:center')}>
          {heroTitle(N.name.toUpperCase())}
          <div style={s("font:800 9.5px/1 'Archivo';letter-spacing:.3em;color:var(--acc-lt);margin-top:20px")}>STARTS IN</div>
          <Digits parts={[[String(N.days), 'DAYS'], ['14', 'HRS']]} />
          <div style={s("font:700 10px/1.4 'Archivo';letter-spacing:.14em;color:var(--muted-lt);margin-top:17px")}>{N.date} · {N.time} · {N.place}</div>
        </div>
      </HeroShell>
      <div style={s('padding:22px 16px 0')}>
        {sect('REGISTER')}
        <div style={s('margin-top:10px;background:var(--sand);padding:16px')}>
          <div style={s("font:800 20px/1.05 'Archivo Black';color:var(--ink)")}>{st.nextReg ? 'You’re registered' : st.attended ? 'One tap and you’re in' : 'Save your place'}</div>
          <div style={s("font:500 12.5px/1.45 'Archivo';color:var(--body);margin-top:7px")}>{N.blurb}</div>
          {st.nextReg
            ? <div style={s("display:flex;align-items:center;gap:8px;margin-top:12px;font:700 12.5px/1.3 'Archivo';color:var(--ink)")}><Ms size={18} color={ACC}>check_circle</Ms>We’ll send your QR for the door a day before.</div>
            : accBtn(st.attended ? 'REGISTER WITH SAVED DETAILS' : 'REGISTER', 'arrow_forward', () => set({ nextReg: true }), 'width:100%;margin-top:12px')}
        </div>
      </div>
      <div style={s('padding:16px 16px 64px')}>
        <button onClick={() => set({ event: 'main', route: 'home', navStack: [] })} className="fs" style={s("display:flex;align-items:center;gap:8px;width:100%;font:800 10.5px/1 'Archivo';letter-spacing:.1em;color:var(--ink);background:var(--sand);padding:14px")}><Ms size={16} color="var(--ink)">arrow_back</Ms>BACK TO THE {cfg.brand.name.toUpperCase()} COMMUNITY</button>
      </div>
    </section>
  );
}

// ═══════════ blocks ═══════════
function PollCard({ p, tag, tagBg, st, vote }: any) {
  const mine = st.votes[p.id];
  const total = Object.values(p.opts as Record<string, number>).reduce((a, b) => a + b, 0) + (mine ? 1 : 0);
  return (
    <div style={s('margin-top:10px;background:var(--sand);padding:16px;animation:bgRise .35s cubic-bezier(.18,.9,.2,1) both')}>
      <div style={s('display:flex;align-items:center;gap:8px')}><span style={{ ...s("font:800 9px/1 'Archivo';letter-spacing:.1em;color:#fff;padding:5px 6px"), background: tagBg }}>{tag}</span><span style={s("font:700 9.5px/1 'Archivo';letter-spacing:.1em;color:var(--label);margin-left:auto")}>{(p.votes + (mine ? 1 : 0)).toLocaleString()} VOTES</span></div>
      <div style={s("font:800 22px/1 'Archivo Black';color:var(--ink);margin-top:11px")}>{p.q}</div>
      <div style={s('margin-top:12px;display:flex;flex-direction:column;gap:7px')}>
        {Object.keys(p.opts).map((k) => { const v = p.opts[k] + (mine === k ? 1 : 0); const pct = Math.round(v / Math.max(total, 1) * 100); const on = mine === k; return (
          <button key={k} onClick={() => vote(p.id, k)} className="fw" style={s('display:block;width:100%;text-align:left;position:relative;padding:12px 13px;background:var(--ground);overflow:hidden')}>
            <span style={{ ...s('position:absolute;left:0;top:0;bottom:0;transition:width .6s cubic-bezier(.2,.8,.2,1)'), width: mine ? pct + '%' : '0%', background: on ? ACC : 'var(--sand2)' }} />
            <span style={s('position:relative;display:flex;align-items:center;gap:9px')}><span style={{ ...s("flex:1;font:700 13.5px/1.2 'Archivo'"), color: on ? '#fff' : 'var(--ink)' }}>{k}</span><span style={{ ...s("font:800 12px/1 'Archivo';font-variant-numeric:tabular-nums"), color: on ? '#fff' : 'var(--ink)' }}>{mine ? pct + '%' : ''}</span>{on && <span style={s("font:800 8.5px/1 'Archivo';letter-spacing:.1em;color:#fff;background:var(--panel);padding:4px 5px")}>YOURS</span>}</span>
          </button>
        ); })}
      </div>
    </div>
  );
}

function AskCard({ cfg, st, set, sendQ, go, compact }: any) {
  const qa = (cfg as EventConfig).segments.find((g) => g.kind === 'qa');
  return (
    <div style={s('padding:22px 16px 0')}>
      {sect('ASK THE TEAM', <button onClick={go('qa')} style={s("font:700 10.5px/1 'Archivo';letter-spacing:.08em;color:var(--acc)")}>SEE ALL</button>)}
      <div style={s('margin-top:10px;background:var(--sand);padding:16px')}>
        {!compact && <div style={s("font:800 20px/1.02 'Archivo Black';color:var(--ink)")}>Send a question for the Q&A</div>}
        <div style={s("font:500 12px/1.45 'Archivo';color:var(--body);margin-top:" + (compact ? '0' : '7px'))}>The most upvoted questions are put to the team on stage{qa ? ' at ' + qa.time : ''}.</div>
        <div style={s('display:flex;gap:8px;align-items:center;margin-top:12px')}>
          <div style={s('flex:1;display:flex;align-items:center;padding:11px 14px;background:var(--ground);border-radius:100px')}><input value={st.qDraft} onChange={(e) => set({ qDraft: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') sendQ(); }} placeholder="Type your question" style={s("flex:1;min-width:0;font:500 13.5px/1.2 'Archivo';color:var(--ink)")} /></div>
          <button onClick={sendQ} aria-label="Send question" style={{ ...s('width:44px;height:44px;flex:none;display:flex;align-items:center;justify-content:center;border-radius:50%'), background: st.qDraft.trim() ? ACC : 'var(--panel)' }}><Ms size={19} color="var(--on-panel)">arrow_upward</Ms></button>
        </div>
        {st.myQs.length > 0 && (
          <div style={s('margin-top:12px;display:flex;flex-direction:column;gap:6px')}>
            {st.myQs.map((q: MyQ) => (
              <div key={q.id} style={s('display:flex;align-items:center;gap:9px;padding:10px 12px;background:var(--ground)')}>
                <Ms size={15} color={ACC}>help</Ms>
                <span style={s("flex:1;min-width:0;font:600 12.5px/1.3 'Archivo';color:var(--ink)")}>{q.text}</span>
                <span style={{ ...s("font:800 8px/1 'Archivo';letter-spacing:.1em;padding:5px 6px;white-space:nowrap"), color: q.status === 'QUEUED' ? 'var(--label)' : '#fff', background: q.status === 'QUEUED' ? 'var(--sand2)' : ACC }}>{q.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QABoard(P: any) {
  const { st, set, qBoard, full, cfg } = P;
  return (
    <div style={s(full ? 'animation:bgFade .25s ease both;padding:18px 0 28px' : '')}>
      {full && <div style={s('padding:0 16px')}><div style={s("font:800 30px/.92 'Archivo Black';color:var(--ink)")}>Q&A</div><div style={s("font:500 13px/1.5 'Archivo';color:var(--body);margin-top:8px")}>Upvote what you want answered. The stage team takes them from the top.</div></div>}
      <div style={s('padding:22px 16px 0')}>
        {sect('TOP QUESTIONS', small(qBoard.length + ' ASKED'))}
        <div style={s('margin-top:10px;display:flex;flex-direction:column;gap:7px')}>
          {qBoard.slice(0, full ? 20 : 4).map((q: any, i: number) => { const up = !!st.upvotes[q.id]; return (
            <div key={q.id} style={{ ...s('display:flex;align-items:center;gap:11px;padding:12px 13px;background:var(--sand)'), boxShadow: q.mine ? 'inset 3px 0 0 var(--acc)' : 'none' }}>
              <span style={s("width:18px;flex:none;font:800 13px/1 'Archivo Black';color:var(--label)")}>{i + 1}</span>
              <span style={s('flex:1;min-width:0')}>
                <span style={s("display:block;font:600 13px/1.35 'Archivo';color:var(--ink)")}>{q.text}</span>
                <span style={s("display:block;font:700 9px/1 'Archivo';letter-spacing:.1em;color:var(--label);margin-top:6px")}>{q.mine ? 'YOU' : String(q.who).toUpperCase()} · {q.where === 'venue' ? cfg.event.venueWord : 'ONLINE'}{q.status && q.status !== 'QUEUED' ? ' · ' + q.status : ''}</span>
              </span>
              <button onClick={() => set((x: ESt) => ({ upvotes: { ...x.upvotes, [q.id]: !x.upvotes[q.id] } }))} aria-label="Upvote" style={{ ...s('display:flex;flex-direction:column;align-items:center;gap:3px;padding:7px 8px;min-width:46px'), background: up ? ACC : 'var(--ground)' }}>
                <Ms size={16} color={up ? '#fff' : 'var(--ink)'}>arrow_upward</Ms>
                <span style={{ ...s("font:800 10.5px/1 'Archivo';font-variant-numeric:tabular-nums"), color: up ? '#fff' : 'var(--ink)' }}>{q.votes}</span>
              </button>
            </div>
          ); })}
        </div>
      </div>
      <AskCard {...P} compact />
    </div>
  );
}

function IrisTeaser({ cfg, revealed, set, ask }: any) {
  const list: QA[] = revealed ? (cfg as EventConfig).iris.live : (cfg as EventConfig).iris.pre;
  if (!list.length) return null;
  return (
    <div style={s('padding:22px 16px 0')}>
      <div style={s('background:var(--panel);padding:16px')}>
        <div style={s('display:flex;align-items:center;gap:8px')}><span style={s('width:7px;height:7px;background:var(--acc);animation:bgDot 1.6s ease-in-out infinite')} /><span style={s("font:800 18px/1 'Archivo Black';letter-spacing:.04em;color:var(--on-panel)")}>ASK IRIS</span><span style={s("font:700 8.5px/1 'Archivo';letter-spacing:.14em;color:var(--muted);margin-left:auto")}>APPROVED FACTS ONLY</span></div>
        <div style={s('display:flex;gap:6px;margin-top:12px;flex-wrap:wrap')}>
          {list.map((x) => <button key={x.q} onClick={() => { set({ iris: true }); ask(x.q, x.a, x.stat, x.label); }} className="fq" style={s("font:700 11px/1 'Archivo';color:var(--on-panel);background:rgba(242,242,240,.08);padding:9px 11px")}>{x.q}</button>)}
        </div>
      </div>
    </div>
  );
}

function ChatPreview({ st, go, title }: any) {
  const last = st.chat.filter((m: ChatMsg) => !m.ev).slice(-3);
  return (
    <div style={s('padding:22px 16px 0')}>
      {sect(title || 'LIVE CHAT', small('IN PERSON + ONLINE'))}
      <button onClick={go('chat')} className="fs" style={s('display:block;width:100%;text-align:left;margin-top:10px;background:var(--sand);padding:12px 14px 14px')}>
        {last.map((m: ChatMsg) => (
          <span key={m.id} style={s('display:flex;align-items:flex-start;gap:9px;padding:6px 0')}>
            <span style={s('width:26px;height:26px;flex:none;border-radius:50%;overflow:hidden;background:var(--acc)')}>{m.avatar && <img src={asset(m.avatar)} alt="" style={s('width:100%;height:100%;object-fit:cover;display:block')} />}</span>
            <span style={s('flex:1;min-width:0')}><span style={s("display:block;font:800 9px/1 'Archivo';letter-spacing:.08em;color:var(--label)")}>{m.me ? 'YOU' : m.user} · {m.tag}</span><span style={s("display:block;font:500 13px/1.35 'Archivo';color:var(--ink);margin-top:4px")}>{m.text}</span></span>
          </span>
        ))}
        <span style={s("display:inline-flex;align-items:center;gap:6px;margin-top:8px;font:800 9.5px/1 'Archivo';letter-spacing:.1em;color:var(--on-panel);background:var(--panel);padding:9px 10px")}><Ms size={13} color="var(--on-panel)">forum</Ms>JOIN THE CHAT</span>
      </button>
    </div>
  );
}

function Chat({ cfg, st, set, post, chatRef, before, after, community }: any) {
  const C = (cfg as EventConfig).chat;
  const quick = before ? C.quickBefore : after || community ? C.quickAfter : C.quickLive;
  return (
    <div style={s('animation:bgFade .25s ease both;display:flex;flex-direction:column;min-height:640px')}>
      <div ref={chatRef} style={s('flex:1;overflow-y:auto;padding:16px 14px 10px;display:flex;flex-direction:column;gap:10px;max-height:544px')}>
        {st.chat.slice(-16).map((m: ChatMsg) => {
          if (m.ev) return (
            <div key={m.id} style={{ ...s('display:flex;align-items:center;gap:10px;align-self:center;max-width:92%;padding:9px 13px;border-radius:100px;background:var(--sand)'), boxShadow: 'inset 0 0 0 1.5px rgba(var(--acc-rgb),.27)' }}>
              <Ms size={15} color={m.ev.color}>{m.ev.icon}</Ms>
              <span style={{ ...s("font:800 10px/1 'Archivo';letter-spacing:.08em"), color: m.ev.color }}>{m.ev.kind}</span>
              <span style={s("font:600 12px/1.2 'Archivo';color:var(--ink)")}>{m.text}</span>
            </div>
          );
          const me = !!m.me; const liked = !!st.likes[m.id];
          return (
            <div key={m.id} style={{ ...s('display:flex;gap:8px;animation:bgBubble .3s ease both'), justifyContent: me ? 'flex-end' : 'flex-start' }}>
              {!me && <span style={s('width:32px;height:32px;flex:none;border-radius:50%;overflow:hidden;margin-top:12px;background:var(--acc)')}>{m.avatar && <img src={asset(m.avatar)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}</span>}
              <div style={s('max-width:74%')}>
                <div style={{ ...s('display:flex;align-items:baseline;gap:7px;padding:0 3px 4px'), justifyContent: me ? 'flex-end' : 'flex-start' }}><span style={s("font:800 9px/1 'Archivo';letter-spacing:.08em;color:var(--label)")}>{me ? 'YOU' : m.user}</span><span style={{ ...s("font:800 8px/1 'Archivo';letter-spacing:.08em"), color: m.where === 'venue' ? ACC : 'var(--label)' }}>{m.tag}</span></div>
                <div style={{ ...s('padding:10px 12px'), background: me ? 'var(--panel)' : 'var(--sand)', borderRadius: me ? '14px 14px 3px 14px' : '3px 14px 14px 14px' }}>
                  <div style={{ ...s("font:500 14px/1.4 'Archivo'"), color: me ? 'var(--on-panel)' : 'var(--ink)' }}>{m.text}</div>
                  <div style={s('display:flex;align-items:center;gap:9px;margin-top:7px')}><span style={{ ...s("font:600 9.5px/1 'Archivo';font-variant-numeric:tabular-nums"), color: me ? 'var(--muted)' : 'var(--label)' }}>{m.time}</span><button onClick={() => set((x: ESt) => ({ likes: { ...x.likes, [m.id]: !x.likes[m.id] } }))} style={{ ...s("display:flex;align-items:center;gap:4px;font:700 9.5px/1 'Archivo'"), color: liked ? ACC : (me ? 'var(--muted)' : 'var(--label)') }}><Ms size={13} color={liked ? ACC : 'var(--muted)'}>favorite</Ms>{(m.likes || 0) + (liked ? 1 : 0)}</button></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={s('position:sticky;bottom:0;flex:none;background:var(--ground);border-top:1.5px solid var(--hair)')}>
        <div style={s('display:flex;gap:6px;padding:9px 12px 0;overflow-x:auto')}>{quick.map((q: string) => <button key={q} onClick={() => post(q)} className="fs" style={s("flex:none;font:700 11px/1 'Archivo';color:var(--ink);background:var(--sand);padding:9px 11px;border-radius:100px;white-space:nowrap")}>{q}</button>)}</div>
        <div style={s('display:flex;gap:8px;align-items:center;padding:9px 12px 14px')}>
          <div style={s('flex:1;display:flex;align-items:center;gap:8px;padding:11px 14px;background:var(--sand);border-radius:100px')}><input value={st.draft} onChange={(e) => set({ draft: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') post(st.draft); }} placeholder="Say something to the room…" style={s("flex:1;min-width:0;font:500 13.5px/1.2 'Archivo';color:var(--ink)")} /></div>
          <button onClick={() => post(st.draft)} aria-label="Send" style={{ ...s('width:44px;height:44px;flex:none;display:flex;align-items:center;justify-content:center;border-radius:50%'), background: st.draft.trim() ? ACC : 'var(--panel)' }}><Ms size={19} color="var(--on-panel)">arrow_upward</Ms></button>
        </div>
      </div>
    </div>
  );
}

function Drive({ cfg, st, set, bookDrive }: any) {
  const C = (cfg as EventConfig).cta; const d = st.drive;
  const room = C.options.find((r) => r.id === d.showroom) || C.options[0];
  return (
    <div style={s('animation:bgFade .25s ease both;padding:18px 16px 28px')}>
      <div style={s("font:800 30px/.92 'Archivo Black';color:var(--ink)")}>{d.done ? C.doneTitle : C.title}</div>
      <div style={s("font:500 13px/1.5 'Archivo';color:var(--body);margin-top:8px")}>{d.done ? C.doneSub : C.intro}</div>
      {C.options.length > 0 && <>
        <div style={s('margin-top:20px')}>{label(C.optionsLabel)}</div>
        <div style={s('margin-top:9px;display:flex;flex-direction:column;gap:7px')}>
          {C.options.map((r) => { const on = d.showroom === r.id; return (
            <button key={r.id} onClick={() => set((x: ESt) => ({ drive: { ...x.drive, showroom: r.id, done: false } }))} className="fw" style={{ ...s('display:flex;align-items:center;gap:11px;width:100%;text-align:left;padding:13px'), background: on ? 'var(--panel)' : 'var(--sand)' }}>
              <Ms size={20} color={on ? 'var(--acc-lt)' : 'var(--label)'}>storefront</Ms>
              <span style={s('flex:1;min-width:0')}><span style={{ ...s("display:block;font:700 14px/1.2 'Archivo'"), color: on ? 'var(--on-panel)' : 'var(--ink)' }}>{r.name}</span><span style={{ ...s("display:block;font:500 11.5px/1.3 'Archivo';margin-top:3px"), color: on ? 'var(--muted)' : 'var(--label)' }}>{r.sub}</span></span>
              {on && <Ms size={18} color={ACC}>check_circle</Ms>}
            </button>
          ); })}
        </div>
      </>}
      {C.slots.length > 0 && <>
        <div style={s('margin-top:20px')}>{label(C.slotsLabel)}</div>
        <div style={s('margin-top:9px;display:flex;gap:7px;flex-wrap:wrap')}>
          {C.slots.map((t) => { const on = d.slot === t; return <button key={t} onClick={() => set((x: ESt) => ({ drive: { ...x.drive, slot: t, done: false } }))} style={{ ...s("font:700 12px/1 'Archivo';padding:11px 12px"), background: on ? ACC : 'var(--sand)', color: on ? '#fff' : 'var(--ink)' }}>{t}</button>; })}
        </div>
      </>}
      {d.done
        ? <div style={s('display:flex;align-items:center;gap:10px;margin-top:22px;padding:14px;background:var(--sand)')}><Ms size={22} color={ACC}>event_available</Ms><span style={s("font:700 13px/1.35 'Archivo';color:var(--ink)")}>{room?.name} · {d.slot}</span></div>
        : accBtn(C.submit, 'arrow_forward', bookDrive, 'width:100%;margin-top:22px')}
    </div>
  );
}

function HotspotSheet({ cfg, st, close, openHotspot, set, ask }: any) {
  const H = (cfg as EventConfig).hotspots;
  const i = st.hotspot as number; const h = H[i];
  return (
    <div style={{ ...s('position:absolute;inset:0;z-index:60;display:flex;flex-direction:column;justify-content:flex-end;background:rgba(27,11,45,.45)'), animation: st.hsOut ? 'bgFadeOut .26s ease both' : undefined }}>
      <button onClick={close} aria-label="Close" style={s('position:absolute;inset:0;cursor:default')} />
      <div style={{ ...s('position:relative;background:var(--ground)'), animation: st.hsOut ? 'bgSheetOut .26s cubic-bezier(.32,.72,0,1) both' : 'bgSheet .32s cubic-bezier(.18,.9,.2,1) both' }}>
        <div style={s('display:flex;align-items:center;gap:10px;padding:13px 15px;background:var(--panel)')}>
          <Ms size={17} color={ACC}>my_location</Ms>
          <span style={s("font:800 9.5px/1 'Archivo';letter-spacing:.16em;color:var(--muted)")}>FEATURE {pad(i + 1)} / {pad(H.length)}</span>
          <button onClick={close} className="fh" aria-label="Close" style={s('margin-left:auto;padding:4px 2px 4px 6px;color:var(--muted)')}><Ms size={18} color="inherit">close</Ms></button>
        </div>
        <div key={h.id} style={s('padding:18px 16px 8px;animation:bgFade .25s ease both')}>
          <div style={s("font:800 30px/.95 'Archivo Black';color:var(--ink)")}>{h.name}</div>
          <div style={s("font:500 13.5px/1.5 'Archivo';color:var(--body);margin-top:9px")}>{h.desc}</div>
          <div style={s('display:flex;align-items:baseline;gap:10px;margin-top:14px;padding-top:12px;border-top:1.5px solid var(--hair)')}><span style={s("font:800 40px/.9 'Archivo Black';color:var(--acc);font-variant-numeric:tabular-nums")}>{h.stat}</span><span style={s("font:700 9.5px/1.3 'Archivo';letter-spacing:.12em;color:var(--label)")}>{h.unit.toUpperCase()}</span></div>
        </div>
        <div style={s('display:flex;gap:8px;padding:12px 16px 18px')}>
          <button onClick={() => openHotspot((i + H.length - 1) % H.length)} className="fs" aria-label="Previous feature" style={s('width:46px;flex:none;display:flex;align-items:center;justify-content:center;background:var(--sand)')}><Ms size={18} color="var(--ink)">arrow_back</Ms></button>
          <button onClick={() => { set({ hotspot: null }); ask('Tell me more about the ' + h.name, h.desc + ' ' + h.stat + ' ' + h.unit + '.', h.stat, h.unit.toUpperCase()); }} className="fs" style={s("flex:1;display:flex;align-items:center;justify-content:center;gap:7px;font:800 11px/1 'Archivo';letter-spacing:.08em;color:var(--ink);background:var(--sand);padding:13px")}><span style={s('width:6px;height:6px;background:var(--acc)')} />ASK IRIS</button>
          <button onClick={() => openHotspot((i + 1) % H.length)} className="fp" style={s("flex:1;display:flex;align-items:center;justify-content:center;gap:7px;font:800 11px/1 'Archivo';letter-spacing:.08em;color:var(--on-panel);background:var(--panel);padding:13px")}>NEXT<Ms size={16} color="var(--on-panel)">arrow_forward</Ms></button>
        </div>
      </div>
    </div>
  );
}

function RevealMoment({ cfg, skip }: { cfg: EventConfig; skip: () => void }) {
  const im = cfg.event.heroImage; const R = cfg.reveal;
  return (
    <button onClick={skip} aria-label="Skip reveal" style={s('position:absolute;inset:0;z-index:70;background:var(--hero-deep);overflow:hidden;display:block;text-align:left;cursor:pointer;animation:evRevealOut .5s ease 3.8s both')}>
      <div style={s('position:absolute;inset:0;background:radial-gradient(70% 45% at 50% 52%,rgba(var(--acc-rgb),.45),transparent 70%);animation:evGlow 3.2s ease both')} />
      <div style={{ ...s('position:absolute;left:50%;top:50%;width:150%;transform:translate(-50%,-46%)'), aspectRatio: `${im.w}/${im.h}` }}>
        {im.src && <img src={asset(im.src)} alt={R.title} style={s('position:absolute;inset:0;width:100%;height:100%;object-fit:cover;animation:evCar 3.4s cubic-bezier(.2,.7,.2,1) both')} />}
      </div>
      <div style={s('position:absolute;inset:0;background:linear-gradient(180deg,var(--hero-deep) 0%,var(--hero-deep) 33%,rgba(var(--hero-deep-rgb),0) 47%,rgba(var(--hero-deep-rgb),0) 64%,var(--hero-deep) 90%)')} />
      <div style={s('position:absolute;top:0;bottom:0;left:-60%;width:50%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.28),transparent);transform:skewX(-14deg);animation:evLight 1.5s cubic-bezier(.3,.7,.3,1) 1.2s both')} />
      <div style={s('position:absolute;left:0;right:0;top:15%;text-align:center;padding:0 16px')}>
        <div style={s("font:800 10px/1.4 'Archivo';letter-spacing:.42em;color:var(--acc-lt);animation:evText .8s cubic-bezier(.2,.85,.2,1) .4s both")}>{R.kicker}</div>
      </div>
      <div style={s('position:absolute;left:0;right:0;bottom:16%;text-align:center;padding:0 12px')}>
        <div style={s("font:800 13px/1 'Archivo';letter-spacing:.5em;color:#F2F2F0;animation:evText .8s cubic-bezier(.2,.85,.2,1) 1.6s both")}>{R.word1}</div>
        <div style={s("font:800 " + (R.word2.length > 6 ? 54 : 76) + "px/.84 'Archivo Black';color:#fff;letter-spacing:.04em;margin-top:8px;animation:evText .9s cubic-bezier(.2,.85,.2,1) 1.9s both;text-shadow:0 0 40px rgba(var(--acc-rgb),.6)")}>{R.word2}</div>
        <div style={s("font:600 12px/1.4 'Archivo';color:var(--muted-lt);margin-top:12px;animation:evText .8s cubic-bezier(.2,.85,.2,1) 2.4s both")}>{R.line}</div>
      </div>
    </button>
  );
}

function Iris({ cfg, st, set, ask, irisRef, closeIris, revealed }: any) {
  const I = (cfg as EventConfig).iris;
  const QA: QA[] = revealed ? I.live : I.pre;
  // Answers come only from the approved list: a live answer's keywords, then a
  // word match against the questions; anything else gets the fallback.
  const askFree = (q: string) => {
    const low = q.toLowerCase();
    const hit = I.live.find((x) => x.keys && new RegExp(x.keys, 'i').test(low));
    if (hit && revealed) { ask(q, hit.a, hit.stat, hit.label); return; }
    if (hit && !revealed) { ask(q, I.hidden); return; }
    const words = low.split(/\W+/).filter((w) => w.length > 3);
    const m = QA.find((x) => words.some((w) => x.q.toLowerCase().indexOf(w) > -1));
    if (m) ask(q, m.a, m.stat, m.label); else ask(q, I.fallback);
  };
  return (
    <div style={{ ...s('position:absolute;inset:0;z-index:60;display:flex;flex-direction:column;justify-content:flex-end;background:rgba(27,11,45,.45)'), animation: st.irisOut ? 'bgFadeOut .26s ease both' : undefined }}>
      <button onClick={() => closeIris()} aria-label="Close" style={s('position:absolute;inset:0;cursor:default')} />
      <div style={{ ...s('position:relative;height:82%;display:flex;flex-direction:column;background:var(--ground)'), animation: st.irisOut ? 'bgSheetOut .26s cubic-bezier(.32,.72,0,1) both' : 'bgSheet .32s cubic-bezier(.18,.9,.2,1) both' }}>
        <div style={s('display:flex;align-items:center;gap:10px;padding:13px 15px;background:var(--panel)')}><span style={s('width:7px;height:7px;background:var(--acc);animation:bgDot 1.6s ease-in-out infinite')} /><div style={s('min-width:0')}><div style={s("font:800 21px/1 'Archivo Black';letter-spacing:.04em;color:var(--on-panel)")}>IRIS</div><div style={s("font:700 8.5px/1 'Archivo';letter-spacing:.14em;color:var(--muted);margin-top:5px")}>APPROVED {(cfg as EventConfig).brand.name.toUpperCase()} FACTS ONLY</div></div><button onClick={() => closeIris()} className="fh" aria-label="Close" style={s("margin-left:auto;font:800 14px/1 'Archivo';color:var(--muted);padding:4px 2px 4px 6px")}><Ms size={18} color="inherit">close</Ms></button></div>
        <div ref={irisRef} style={s('flex:1;overflow-y:auto;padding:15px 15px 8px;display:flex;flex-direction:column;gap:11px')}>
          {st.thread.map((m: any, i: number) => { const me = m.me; return (
            <div key={i} style={{ ...s('display:flex;animation:bgBubble .3s ease both'), justifyContent: me ? 'flex-end' : 'flex-start' }}>
              <div style={{ ...s('max-width:84%;padding:12px 13px'), background: me ? 'var(--panel)' : 'var(--sand)', borderRadius: me ? '14px 14px 3px 14px' : '3px 14px 14px 14px' }}>
                <div style={{ ...s("font:800 8.5px/1 'Archivo';letter-spacing:.14em"), color: me ? 'var(--muted)' : 'var(--label)' }}>{me ? 'YOU' : 'IRIS'}</div>
                <div style={{ ...s("font:500 13.5px/1.5 'Archivo';margin-top:6px"), color: me ? 'var(--on-panel)' : 'var(--ink)' }}>{m.text}</div>
                {m.stat && <div style={s('display:flex;align-items:baseline;gap:8px;margin-top:10px;padding-top:9px;border-top:1.5px solid var(--hair)')}><span style={s("font:800 25px/.9 'Archivo Black';color:var(--acc);font-variant-numeric:tabular-nums")}>{m.stat}</span><span style={s("font:700 8.5px/1.3 'Archivo';letter-spacing:.12em;color:var(--label)")}>{m.statLabel}</span></div>}
              </div>
            </div>
          ); })}
          {st.irisTyping && <div style={s('display:flex;gap:5px;padding:4px 2px')}><span style={s('width:6px;height:6px;background:var(--acc);animation:bgDot 1.2s ease-in-out infinite')} /><span style={s('width:6px;height:6px;background:var(--acc);animation:bgDot 1.2s .2s ease-in-out infinite')} /><span style={s('width:6px;height:6px;background:var(--acc);animation:bgDot 1.2s .4s ease-in-out infinite')} /></div>}
        </div>
        <div style={s('padding:9px 11px 0;display:flex;gap:6px;overflow-x:auto')}>{QA.map((x) => <button key={x.q} onClick={() => ask(x.q, x.a, x.stat, x.label)} className="fs" style={s("flex:none;font:700 11px/1 'Archivo';color:var(--ink);padding:10px 12px;background:var(--sand);white-space:nowrap")}>{x.q}</button>)}</div>
        <div style={s('padding:9px 11px 15px;display:flex;gap:8px;align-items:center')}><div style={s('flex:1;padding:12px 14px;background:var(--sand);border-radius:100px')}><input value={st.irisDraft} onChange={(e) => set({ irisDraft: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter' && st.irisDraft.trim()) askFree(st.irisDraft); }} placeholder="Ask IRIS…" style={s("width:100%;font:500 13.5px/1.2 'Archivo';color:var(--ink)")} /></div><button onClick={() => { if (st.irisDraft.trim()) askFree(st.irisDraft); }} aria-label="Ask" style={s('width:44px;height:44px;flex:none;background:var(--panel);border-radius:50%;display:flex;align-items:center;justify-content:center')}><Ms size={19} color="var(--on-panel)">arrow_upward</Ms></button></div>
      </div>
    </div>
  );
}

// Same tokens and keyframes as the Voltford fan panel (FAN_CSS), plus brand
// tokens (--acc, --hero, --muted…) that default to the Nova palette, and the
// reveal and hotspot motion.
const FAN_CSS = `
:root{--ground:#F6F6F5;--sand:#EEEEEA;--sand2:#D5D5D2;--sand3:#E4E4E2;--ink:#1B0B2D;--body:#46335C;--label:#725E88;--panel:#1B0B2D;--panel-hover:#29163E;--chrome:#140921;--on-panel:#F2F2F0;--hair:rgba(27,11,45,.12);--desk:#D5D5D2;--acc:#8B3DF5;--acc-rgb:139,61,245;--acc-lt:#B08EF0;--acc-dk:#7A2EE3;--hero:#160925;--hero-rgb:22,9,37;--hero-deep:#07040B;--hero-deep-rgb:7,4,11;--muted:#9F8AB6;--muted-lt:#B09DC6}
:root[data-theme="dark"]{--ground:#160F1E;--sand:#251B30;--sand2:#392B4A;--sand3:#2B2038;--ink:#F2F2F0;--body:#C4C4BF;--label:#957FAF;--panel:#2F1F41;--panel-hover:#3B2851;--chrome:#150E1C;--on-panel:#F2F2F0;--hair:rgba(208,208,204,.12);--desk:#0B080F}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--ground:#160F1E;--sand:#251B30;--sand2:#392B4A;--sand3:#2B2038;--ink:#F2F2F0;--body:#C4C4BF;--label:#957FAF;--panel:#2F1F41;--panel-hover:#3B2851;--chrome:#150E1C;--on-panel:#F2F2F0;--hair:rgba(208,208,204,.12);--desk:#0B080F}}
.ms{font-family:'Material Symbols Rounded';font-weight:400;line-height:1;display:inline-block;-webkit-font-feature-settings:'liga';-webkit-font-smoothing:antialiased}
@keyframes bgRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes bgFade{from{opacity:0}to{opacity:1}}
@keyframes bgThird{0%{opacity:0;transform:translateX(-102%)}14%{opacity:1;transform:translateX(0)}86%{opacity:1;transform:translateX(0)}100%{opacity:0;transform:translateX(-14px)}}
@keyframes bgBlink{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes bgSheet{from{transform:translateY(100%)}to{transform:none}}
@keyframes bgDot{0%,80%,100%{opacity:.25}40%{opacity:1}}
@keyframes bgBubble{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes bgToast{0%{opacity:0;transform:translateY(12px)}12%{opacity:1;transform:none}84%{opacity:1;transform:none}100%{opacity:0;transform:translateY(-6px)}}
@keyframes bgSheetOut{from{transform:none}to{transform:translateY(100%)}}
@keyframes bgFadeOut{from{opacity:1}to{opacity:0}}
@keyframes bgFlashOut{from{opacity:1;transform:none}to{opacity:0;transform:translateY(-8px)}}
@keyframes bgSweep{from{transform:translateX(0) skewX(-12deg)}to{transform:translateX(420%) skewX(-12deg)}}
@keyframes bgReveal{from{opacity:0;transform:translateY(12px) scale(.95)}to{opacity:1;transform:none}}
@keyframes bgFloatUp{0%{opacity:0;transform:translateY(0) scale(.5)}18%{opacity:1;transform:translateY(-16px) scale(1.1)}100%{opacity:0;transform:translateY(-128px) scale(.95)}}
@keyframes bgFloods{0%,100%{opacity:.85}50%{opacity:1}}
@keyframes evPulse{0%{box-shadow:0 0 0 0 rgba(var(--acc-rgb),.7)}70%{box-shadow:0 0 0 12px rgba(var(--acc-rgb),0)}100%{box-shadow:0 0 0 0 rgba(var(--acc-rgb),0)}}
@keyframes evCar{0%{filter:brightness(0);transform:scale(1.14)}35%{filter:brightness(.08);transform:scale(1.1)}100%{filter:brightness(1);transform:scale(1)}}
@keyframes evGlow{from{opacity:0}to{opacity:1}}
@keyframes evLight{from{transform:translateX(0) skewX(-14deg)}to{transform:translateX(480%) skewX(-14deg)}}
@keyframes evText{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes evRevealOut{from{opacity:1}to{opacity:0;visibility:hidden}}
.hs{animation:bgReveal .5s cubic-bezier(.2,.85,.2,1) both}
.fs,.fp,.fq,.fw,.frow,.fv,.agg{transition:background .18s ease,box-shadow .18s ease,transform .13s cubic-bezier(.2,.7,.3,1)}
.agg:hover{background:rgba(var(--acc-rgb),.2) !important}
.fs:hover{background:var(--sand3) !important}
.fp:hover{background:var(--panel-hover) !important}
.fv:hover{background:var(--acc-dk) !important}
.fh:hover{color:var(--on-panel) !important}
.fh2:hover{background:var(--panel-hover) !important}
.fq:hover{background:rgba(242,242,240,.16) !important}
.frow:hover{background:var(--sand3) !important}
.frow > .ms{transition:transform .13s cubic-bezier(.2,.7,.3,1)}
.frow:hover > .ms{transform:translateX(3px)}
.fs:active,.fp:active,.fq:active,.fw:active,.frow:active,.fv:active,.agg:active{transform:scale(.985)}
@media (prefers-reduced-motion: reduce){*{animation-duration:.001ms !important;transition-duration:.001ms !important}}
`;
