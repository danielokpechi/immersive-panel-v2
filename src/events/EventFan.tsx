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
  routeFor, priceNum, priceCur, monthlyFlat, fmtMoney,
  readPoints, writePoints, pointsTotal, myRefCode, crewCode, ticketUrl, sponsorOf, isOn, lab,
  type EventConfig, type Challenge, type PointsBook, type Msg, type Ms as MState, type Mode, type Target, type TriggerKind, type QA, type Lead, type Signals,
} from './config';

const Ms = ({ children, size = 18, color, style }: { children: string; size?: number; color?: string; style?: CSSProperties }) => (
  <span className="ms" style={{ fontSize: size, color, ...style }}>{children}</span>
);
const pad = (n: number) => String(n).padStart(2, '0');
const NARROW = typeof window !== 'undefined' && window.innerWidth < 380;
const REACTS = ['🔥', '😍', '👏', '⚡'];
const ACC = 'var(--acc)';
// Initials for a name or handle ("Amira Hassan" -> AH, "NADIA.KL" -> NK).
export const initials = (n: string) => n.replace(/[^A-Za-z\s._-]/g, '').split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

type ChatMsg = { id: string; user: string; text: string; where: string; tag: string; avatar?: string; me?: boolean; time: string; likes: number; ev?: { kind: string; color: string; icon: string } };
type MyQ = { id: string; text: string; votes: number; status: string; mine: true };
type Third = { kind: string; title: string; note: string; color: string; icon: string };
interface ESt {
  route: string; navStack: string[];
  ms: MState; seg: number; revealed: boolean; breakAt: number;
  mode: Mode; registered: boolean; pick: Mode;
  tick: number; n: number; chat: ChatMsg[]; draft: string; likes: Record<string, boolean>;
  iris: boolean; irisOut: boolean; irisTyping: boolean; irisDraft: string; thread: { me: boolean; text: string; stat?: string; statLabel?: string }[];
  third: Third | null; flash: Msg | null; flashOut: boolean;
  revealing: boolean; hotspot: number | null; hsOut: boolean; seen: Record<string, boolean>;
  poll: number | null; votes: Record<string, string>;
  qDraft: string; myQs: MyQ[]; upvotes: Record<string, boolean>;
  floats: { id: number; e: string; x: number }[]; myReacts: number;
  drive: { showroom: string; slot: string; done: boolean };
  following: boolean; readOpen: number | null;
  event: 'main' | 'next'; attended: boolean; checkedIn: boolean; nextReg: boolean;
  reminders: { id: string; title: string; body: string }[];
  toast: string | null; theme: string;
  stripTarget: Target; stripOpen: boolean; ctr: { poll: number; hotspot: number; announce: number; challenge: number };
  book: PointsBook; pushCh: number | null; crew: string;
  // interest + showroom (one profile, sent to the Studio as a lead)
  answers: Record<string, string>; consent: boolean; routed: boolean; irisAsks: number;
  colour: string; variant: number; built: boolean; deposit: number; term: number; financeSeen: boolean;
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
    stripTarget: 'all', stripOpen: !embed && typeof window !== 'undefined' && window.innerWidth > 520, ctr: { poll: 0, hotspot: 0, announce: 0, challenge: 0 },
    book: typeof window !== 'undefined' ? readPoints(cfg) : { done: {}, claimed: [] }, pushCh: null, crew: '',
    answers: {}, consent: false, routed: false, irisAsks: 0,
    colour: cfg.showroom?.colours[0]?.name || '', variant: Math.min(cfg.showroom?.defaultVariant ?? 1, Math.max(cfg.product.variants.length - 1, 0)), built: false,
    deposit: cfg.showroom?.finance.defaultDeposit ?? 20, term: cfg.showroom?.finance.defaultTerm ?? 7, financeSeen: false,
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

  // A new screen opens at its top.
  useEffect(() => { const el = document.querySelector('[data-fanscroll]'); if (el && st.route !== 'home') el.scrollTop = 0; }, [st.route]);
  // The floating Ask IRIS tab never sits on a hero title or countdown: when one
  // crosses its band, the tab moves just above it (or below, if there's no room).
  const [irisLift, setIrisLift] = useState(0);
  useEffect(() => {
    const sc = document.querySelector('[data-fanscroll]') as HTMLElement | null; if (!sc) return;
    const H = 40, BASE = 96, GAP = 10;
    const calc = () => {
      const pr = (sc.parentElement as HTMLElement).getBoundingClientRect();
      const top = pr.top + 140, floor = pr.bottom - 60; // below the header bars, above the address pill
      // Headlines: marked hero blocks plus any large display-type text, measured by
      // the text itself (not its full-width box), so short left-aligned titles that
      // never reach the tab don't move it.
      const tabLeft = pr.right - 132;
      const els = [...sc.querySelectorAll('[data-avoid], div, span')].filter((e) => {
        if ((e as HTMLElement).dataset.avoid !== undefined) return true;
        const cs = getComputedStyle(e); if (!cs.fontFamily.includes('Archivo Black') || parseFloat(cs.fontSize) < 17) return false;
        return [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim());
      });
      const range = document.createRange();
      const boxes = els.map((e) => { range.selectNodeContents(e); return range.getBoundingClientRect(); })
        .filter((r) => r.height > 0 && r.right > tabLeft && r.bottom > top && r.top < floor);
      const hit = (t: number, b: number) => boxes.filter((r) => r.top < b + GAP / 2 && r.bottom > t - GAP / 2);
      const b0 = pr.bottom - BASE;
      let lift = 0;
      if (hit(b0 - H, b0).length) {
        let up = b0; for (let i = 0; i < 6; i++) { const h = hit(up - H, up); if (!h.length) break; up = Math.min(...h.map((r) => r.top)) - GAP; }
        if (up - H >= top) lift = b0 - up;
        else { let dn = b0; for (let i = 0; i < 6; i++) { const h = hit(dn - H, dn); if (!h.length) break; dn = Math.max(...h.map((r) => r.bottom)) + GAP + H; } lift = dn <= floor ? b0 - dn : b0 - up; }
      }
      setIrisLift((x) => (Math.abs(x - lift) > 1 ? Math.round(lift) : x));
    };
    calc();
    let raf = 0; const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(calc); };
    sc.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', calc);
    const t = window.setInterval(calc, 400);
    return () => { sc.removeEventListener('scroll', onScroll); window.removeEventListener('resize', calc); window.clearInterval(t); cancelAnimationFrame(raf); };
  }, []);
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
        showThird({ kind: 'THE REVEAL', title: cfg.reveal.title.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()), note: cfg.reveal.thirdNote, color: ACC, icon: 'auto_awesome' }, 4600);
        burst(12);
      });
      chatMark('REVEAL', cfg.reveal.word2.charAt(0) + cfg.reveal.word2.slice(1).toLowerCase() + ' is out', 'auto_awesome');
      markAttended();
    } else if (kind === 'challenge' && cfg.challenges?.length) {
      const i = idx % cfg.challenges.length; const c = cfg.challenges[i];
      set({ pushCh: i });
      showThird({ kind: 'CHALLENGE', title: c.title, note: '+' + c.points + ' points' + (c.sponsor ? ' · presented by ' + c.sponsor : ''), color: ACC, icon: 'emoji_events' });
      chatMark('CHALLENGE', c.title, 'emoji_events');
      if (c.sponsor) send({ cmd: 'sponsor', name: c.sponsor, what: 'view' });
    } else if (kind === 'poll' && cfg.polls.length) {
      const p = cfg.polls[idx % cfg.polls.length];
      set({ poll: idx % cfg.polls.length });
      if (p.sponsor) send({ cmd: 'sponsor', name: p.sponsor, what: 'view' });
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
      if (list[idx % list.length].sponsor) send({ cmd: 'sponsor', name: list[idx % list.length].sponsor, what: 'view' });
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
    } else if (m.cmd === 'who') sendProfile.current();
    else if (m.cmd === 'qstatus') {
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

  // ── the person's profile, sent to the Studio's Follow up tab as a lead ──
  const signalsOf = (x: ESt): Signals => ({
    features: Object.keys(x.seen).filter((k) => x.seen[k]).length, polls: Object.keys(x.votes).length, iris: x.irisAsks, questions: x.myQs.length,
    built: x.built, finance: x.financeSeen, booked: x.drive.done, checkedIn: x.checkedIn, following: x.following,
  });
  const leadOf = (x: ESt): Lead => {
    const v = cfg.product.variants[x.variant];
    const price = v ? priceNum(v.price) : 0; const F = cfg.showroom?.finance;
    return {
      id: 'ME', name: 'You (this browser)', where: x.mode, answers: x.answers, consent: x.consent, source: 'Invite link',
      signals: signalsOf(x), seen: Object.keys(x.seen).filter((k) => x.seen[k]),
      colour: x.built ? x.colour : undefined, variant: x.built || x.financeSeen ? v?.name : undefined,
      monthly: x.financeSeen && F && price ? fmtMoney(priceCur(v.price), monthlyFlat(price, x.deposit, F.rate, F.termUnit === 'months' ? x.term / 12 : x.term).monthly) : undefined,
      route: x.drive.showroom, status: 'New', at: 'This session',
    };
  };
  const sendProfile = useRef<() => void>(() => {});
  sendProfile.current = () => { const x = stRef.current; if (x.registered) send({ cmd: 'profile', lead: leadOf(x) }); };
  const profKey = JSON.stringify([st.registered, st.mode, st.answers, st.consent, signalsOf(st), st.colour, st.variant, st.drive.showroom, st.deposit, st.term]);
  useEffect(() => { sendProfile.current(); }, [profKey]);

  useEffect(() => { if (st.checkedIn) cfg.challenges?.filter((c) => c.kind === 'checkin').forEach((c) => complete(c)); }, [st.checkedIn]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const f = () => set({ book: readPoints(cfg) }); window.addEventListener('storage', f); return () => window.removeEventListener('storage', f); }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    set((x) => ({ iris: true, irisTyping: true, irisDraft: '', irisAsks: x.irisAsks + 1, thread: [...x.thread, { me: true, text: q }] }));
    later('iris', 750, () => set((x) => ({ irisTyping: false, thread: [...x.thread, { me: false, text: a, stat, statLabel }] })));
  };
  const register = () => {
    const x = stRef.current; const r = routeFor(cfg, x.answers);
    set((p) => ({ registered: true, mode: p.pick, routed: !!r, drive: r ? { ...p.drive, showroom: r } : p.drive }));
    send({ cmd: 'register', mode: x.pick, answers: x.answers, consent: x.consent });
    notify(x.pick === 'venue' ? 'SEE YOU AT ' + cfg.event.venueShort : 'YOU’RE ON THE LIST · ONLINE');
  };
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
    const sp = [...cfg.polls, cfg.breakContent.poll].find((p) => p.id === pollId)?.sponsor;
    if (sp) send({ cmd: 'sponsor', name: sp, what: 'tap' });
    cfg.challenges?.filter((c) => c.kind === 'poll' && c.poll === pollId).forEach((c) => complete(c, opt));
  };
  // ── points: challenges complete once, points carry across a series ──
  const chKey = (c: Challenge) => cfg.id + ':' + c.id;
  const complete = (c: Challenge, pick?: string) => {
    const b = stRef.current.book; if (b.done[chKey(c)]) return;
    const pts = c.kind === 'trivia' ? (pick === c.answer ? c.points : 0) : c.points;
    const book = { ...b, done: { ...b.done, [chKey(c)]: { pts, ev: cfg.id, pick } } };
    writePoints(cfg, book); stRef.current = { ...stRef.current, book }; set({ book });
    send({ cmd: 'challenge', id: c.id, pts });
    if (c.sponsor) send({ cmd: 'sponsor', name: c.sponsor, what: 'tap' });
    notify(pts ? '+' + pts + ' POINTS · ' + c.title.toUpperCase() : 'NOT QUITE · ANSWER: ' + (c.answer || '').toUpperCase());
  };
  const claim = (id: string, name: string) => {
    const b = stRef.current.book; if (b.claimed.includes(id)) return;
    const book = { ...b, claimed: [...b.claimed, id] };
    writePoints(cfg, book); set({ book }); send({ cmd: 'claim', name }); notify('CLAIMED · ' + name.toUpperCase());
  };
  const refCode = typeof window !== 'undefined' ? myRefCode(cfg) : '';
  const buyTickets = () => {
    const x = stRef.current;
    window.open(ticketUrl(cfg, x.crew ? crewCode(x.crew) : refCode), '_blank', 'noopener');
    send({ cmd: 'ticket', crew: x.crew || '' });
  };
  const sponsorTap = (name?: string) => { if (name) send({ cmd: 'sponsor', name, what: 'tap' }); };
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
  const titles: Record<string, string> = { challenges: 'POINTS', chat: 'LIVE CHAT', drive: cfg.cta.screenTitle, qa: 'Q&A', build: cfg.showroom?.buildTitle || '', finance: cfg.showroom?.finance.title || '' };
  const metas: Record<string, string> = { challenges: pointsTotal(st.book) + ' PTS', chat: (aud.venue + aud.online).toLocaleString() + ' WATCHING', drive: cfg.cta.screenMeta, qa: (cfg.qaSeed.length + st.myQs.length) + ' QUESTIONS', build: cfg.product.variants.length + ' TRIMS', finance: 'INDICATIVE' };
  const backLabel = st.navStack.length ? (titles[st.navStack[st.navStack.length - 1]] || 'HOME') : 'HOME';
  const statusLabel = nextEv ? cfg.community.next.date : before ? cfg.event.dayLabel : live ? 'LIVE' : brk ? 'BREAK' : after ? 'ENDED' : 'ALWAYS ON';
  const segTime = cfg.segments[seg]?.time || cfg.event.time;
  const lastTime = cfg.segments[cfg.segments.length - 1]?.time || cfg.event.time;
  const clockLabel = nextEv || community ? '09:12' : before ? clockAfter(cfg.event.time, -194) : live ? clockAfter(segTime, 8) : brk ? clockAfter(lastTime, -10) : clockAfter(lastTime, 44);
  const qBoard = [...cfg.qaSeed.map((q) => ({ ...q, mine: false, status: '' })), ...st.myQs.map((q) => ({ ...q, who: 'you', where: st.mode }))]
    .map((q) => ({ ...q, votes: q.votes + (st.upvotes[q.id] ? 1 : 0) })).sort((a, b) => b.votes - a.votes);
  const P = { complete, claim, buyTickets, refCode, sponsorTap, cfg, st, set, go, before, live, brk, after, community, nextEv, seg, revealed, cd, breakLeft, aud, post, ask, register, sendQ, vote, react, openHotspot, bookDrive, follow, share, qBoard, chatRef };

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
                  {cfg.segments.map((g, i) => { const on = i === seg, done = i < seg; const many = cfg.segments.filter((x) => (x.day ?? 0) === (cfg.segments[seg]?.day ?? 0)).length > 4; if ((g.day ?? 0) !== (cfg.segments[seg]?.day ?? 0)) return null; return (
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
            {st.route === 'build' && cfg.showroom && isOn(cfg, 'showroom') && <Build {...P} />}
            {st.route === 'challenges' && <ChallengesScreen {...P} />}
            {st.route === 'finance' && cfg.showroom && isOn(cfg, 'finance') && <Finance {...P} />}
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
                  {st.flash.sponsor && <div style={s('margin-top:7px')}><SponsorTag cfg={cfg} name={st.flash.sponsor} dark /></div>}
                </div>
                <button onClick={() => closeFlash()} aria-label="Dismiss" style={s('width:28px;height:28px;flex:none;border-radius:50%;background:rgba(242,242,240,.12);display:flex;align-items:center;justify-content:center')}><Ms size={16} color="var(--muted)">close</Ms></button>
              </div>
            </div>
          )}

          {!st.iris && st.hotspot === null && !st.revealing && isOn(cfg, 'iris') && (
            <button onClick={() => set({ iris: true })} className="fh2" style={{ ...s('position:absolute;right:0;z-index:46;display:flex;align-items:center;gap:8px;padding:11px 13px 11px 12px;background:var(--panel);border-radius:3px 0 0 3px;transition:bottom .22s cubic-bezier(.2,.8,.2,1)'), bottom: 96 + irisLift }}>
              <span style={s('width:7px;height:7px;background:var(--acc);animation:bgDot 1.6s ease-in-out infinite')} />
              <span style={s("font:800 10.5px/1 'Archivo';letter-spacing:.16em;color:var(--on-panel)")}>{lab(cfg, 'askIris')}</span>
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
  <div data-avoid style={s('display:flex;align-items:flex-start;justify-content:center;gap:9px;margin-top:13px;animation:bgReveal .6s cubic-bezier(.2,.85,.2,1) .25s both')}>
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
const heroTitle = (t: string, size = 36) => <div data-avoid style={s("font:800 " + (NARROW ? size - 6 : size) + "px/.9 'Archivo Black';letter-spacing:.02em;color:#fff;text-align:center;text-shadow:0 2px 12px rgba(13,5,23,.75);white-space:pre-line")}>{t}</div>;

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
        <CarStage cfg={cfg} revealed={!!cfg.reveal.litBefore} interactive={false} seen={{}} height={176} />
        <div style={s('padding:0 16px')}>
          {heroTitle(E.title)}
          <div style={s("font:800 9.5px/1 'Archivo';letter-spacing:.3em;color:var(--acc-lt);text-align:center;margin-top:22px")}>{E.countdownLabel}</div>
          <Digits parts={[[pad(Math.floor(cd / 3600)), 'HRS'], [pad(Math.floor(cd / 60) % 60), 'MIN'], [pad(cd % 60), 'SEC']]} />
          <div style={s("font:700 10px/1.4 'Archivo';letter-spacing:.14em;color:var(--muted-lt);text-align:center;margin-top:17px")}>{E.dateLine}</div>
          {audLine(cfg, 0, aud.online)}
        </div>
        {isOn(cfg, 'register') && <button onClick={() => document.getElementById('ev-register')?.scrollIntoView({ behavior: 'smooth', block: 'center' })} className="agg" style={s('position:relative;display:flex;align-items:center;gap:13px;width:100%;text-align:left;margin-top:20px;padding:14px 16px;background:rgba(var(--acc-rgb),.14);box-shadow:inset 0 1px 0 rgba(242,242,240,.12)')}>
          <span style={s('width:38px;height:38px;flex:none;background:var(--acc);display:flex;align-items:center;justify-content:center')}><Ms size={22} color="var(--hero)">event_available</Ms></span>
          <span style={s('flex:1;min-width:0')}>
            <span style={s("display:block;font:800 15px/1 'Archivo Black';letter-spacing:.03em;color:#fff")}>{st.registered ? 'YOU’RE ON THE LIST' : E.inviteTitle}</span>
            <span style={s("display:block;font:500 11.5px/1.3 'Archivo';color:var(--muted-lt);margin-top:4px")}>{st.registered ? (st.mode === 'venue' ? 'In person · ' + E.venueShort.toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'Online · we’ll ping you before it starts') : E.inviteSub}</span>
          </span>
          <Ms size={18} color="var(--acc-lt)">chevron_right</Ms>
        </button>}
      </HeroShell>
      <SeriesStrip {...P} />
      <TicketCard {...P} />

      {st.reminders.length > 0 && (
        <div style={s('padding:22px 16px 0')}>
          {sect(lab(cfg, 'updatesFrom') + ' ' + cfg.brand.name.toUpperCase())}
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
          {sect(lab(cfg, 'details'), <button onClick={share} style={s("display:flex;align-items:center;gap:5px;font:700 10.5px/1 'Archivo';letter-spacing:.08em;color:var(--acc)")}><Ms size={15} color={ACC}>ios_share</Ms>{lab(cfg, 'share')}</button>)}
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

      {isOn(cfg, 'register') && (
      <div id="ev-register" style={s('padding:22px 16px 0')}>
        {sect(lab(cfg, 'register'))}
        <div style={s('margin-top:10px;background:var(--sand);padding:16px')}>
          {st.registered ? (<>
            <div style={s('display:flex;align-items:center;gap:12px')}>
              <span style={s('width:40px;height:40px;flex:none;background:var(--acc);display:flex;align-items:center;justify-content:center')}><Ms size={22} color="#fff">check</Ms></span>
              <div style={s('flex:1;min-width:0')}>
                <div style={s("font:800 19px/1 'Archivo Black';color:var(--ink)")}>{lab(cfg, 'onList')}</div>
                <div style={s("font:500 12px/1.4 'Archivo';color:var(--body);margin-top:5px")}>{st.mode === 'venue' ? E.registeredVenue : E.registeredOnline}</div>
              </div>
              <button onClick={() => set({ registered: false })} style={s("font:800 9.5px/1 'Archivo';letter-spacing:.1em;color:var(--acc)")}>{lab(cfg, 'change')}</button>
            </div>
            {Object.keys(st.answers).length > 0 && (
              <div style={s('display:flex;flex-wrap:wrap;gap:6px;margin-top:12px')}>
                {(cfg.interest?.fields || []).filter((f) => st.answers[f.id]).map((f) => <span key={f.id} style={s("font:700 11px/1 'Archivo';color:var(--ink);background:var(--ground);padding:8px 9px")}><span style={s('color:var(--label)')}>{f.short} · </span>{st.answers[f.id]}</span>)}
              </div>
            )}
            {st.crew && <div style={s("display:flex;align-items:center;gap:7px;margin-top:10px;font:600 11.5px/1.35 'Archivo';color:var(--body)")}><Ms size={15} color={ACC}>group</Ms>{st.crew} · crew code <b style={s('color:var(--ink)')}>{crewCode(st.crew)}</b></div>}
            {st.routed && <div style={s("display:flex;align-items:center;gap:7px;margin-top:10px;font:600 11.5px/1.35 'Archivo';color:var(--body)")}><Ms size={15} color={ACC}>near_me</Ms>Matched to {cfg.cta.options.find((o) => o.id === st.drive.showroom)?.name}</div>}
          </>) : (<>
            <div style={s("font:800 22px/1 'Archivo Black';color:var(--ink)")}>{lab(cfg, 'joinQuestion')}</div>
            <div style={s('margin-top:12px;display:flex;flex-direction:column;gap:7px')}>
              {([['venue', E.venueOption, E.venueOptionSub, 'location_on'], ['online', 'Online', E.onlineOptionSub, 'wifi']] as const).filter(([k]) => E.format === 'Hybrid' || (E.format === 'Online' ? k === 'online' : k === 'venue')).map(([k, t, d, icon]) => { const on = st.pick === k; return (
                <button key={k} onClick={() => set({ pick: k })} className="fw" style={{ ...s('display:flex;align-items:center;gap:11px;width:100%;text-align:left;padding:13px'), background: on ? 'var(--panel)' : 'var(--ground)' }}>
                  <Ms size={20} color={on ? 'var(--acc-lt)' : 'var(--label)'}>{icon}</Ms>
                  <span style={s('flex:1;min-width:0')}><span style={{ ...s("display:block;font:700 14px/1.2 'Archivo'"), color: on ? 'var(--on-panel)' : 'var(--ink)' }}>{t}</span><span style={{ ...s("display:block;font:500 11.5px/1.3 'Archivo';margin-top:3px"), color: on ? 'var(--muted)' : 'var(--label)' }}>{d}</span></span>
                  <span style={{ ...s('width:18px;height:18px;flex:none;border-radius:50%;display:flex;align-items:center;justify-content:center'), boxShadow: on ? 'none' : 'inset 0 0 0 2px var(--sand2)', background: on ? ACC : 'transparent' }}>{on && <Ms size={13} color="#fff">check</Ms>}</span>
                </button>
              ); })}
            </div>
            {cfg.interest && isOn(cfg, 'interest') && <InterestFields cfg={cfg} st={st} set={set} />}
            {cfg.tickets && isOn(cfg, 'tickets') && cfg.tickets.crews.length > 0 && (
              <div style={s('margin-top:16px;padding-top:14px;border-top:1.5px solid var(--hair)')}>
                {label(cfg.tickets.crewLabel.toUpperCase() + ' · OPTIONAL')}
                <div style={s('display:flex;flex-wrap:wrap;gap:6px;margin-top:8px')}>{cfg.tickets.crews.map((c) => { const on = st.crew === c; return <button key={c} onClick={() => set({ crew: on ? '' : c })} style={{ ...s("font:700 12px/1 'Archivo';padding:10px 11px"), background: on ? 'var(--panel)' : 'var(--ground)', color: on ? 'var(--on-panel)' : 'var(--ink)' }}>{c}</button>; })}</div>
              </div>
            )}
            {accBtn(lab(cfg, 'registerButton'), 'arrow_forward', register, 'width:100%;margin-top:14px')}
          </>)}
        </div>
      </div>
      )}

      <ChallengesCard {...P} />
      {isOn(cfg, 'qa') && <AskCard {...P} />}

      <div style={s('padding:22px 16px 0')}>
        {sect(lab(cfg, 'agenda'), small(cfg.days?.length ? cfg.days.length + ' DAYS' : E.dateShort))}
        <div style={s('margin-top:6px')}>
          {cfg.segments.map((g, gi) => (<div key={g.id}>
            {cfg.days?.length && (gi === 0 || (cfg.segments[gi - 1].day ?? 0) !== (g.day ?? 0)) && cfg.days[g.day ?? 0] ? (
              <div style={s('display:flex;align-items:baseline;gap:8px;padding:16px 0 4px')}><span style={s("font:800 13px/1 'Archivo Black';letter-spacing:.04em;color:var(--acc)")}>{cfg.days[g.day ?? 0].label.toUpperCase()}</span><span style={s("font:700 9.5px/1 'Archivo';letter-spacing:.1em;color:var(--label)")}>{cfg.days[g.day ?? 0].date} · {cfg.days[g.day ?? 0].sub.toUpperCase()}</span></div>
            ) : null}
            <div key={g.id} style={s('display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1.5px solid var(--hair)')}>
              <span style={s("width:44px;flex:none;font:800 15px/1 'Archivo Black';color:var(--ink);font-variant-numeric:tabular-nums")}>{g.time}</span>
              <span style={s('flex:1;min-width:0')}><span style={s("display:block;font:700 13.5px/1.2 'Archivo';color:var(--ink)")}>{g.name}</span>{g.blurb && <span style={s("display:block;font:500 11.5px/1.3 'Archivo';color:var(--label);margin-top:3px")}>{g.blurb}</span>}</span>
              {g.kind === 'reveal' && <span style={s("font:800 9px/1 'Archivo';letter-spacing:.1em;padding:6px 7px;color:#fff;background:var(--acc)")}>{lab(cfg, 'theMoment')}</span>}
            </div>
          </div>))}
        </div>
      </div>
      <Stories {...P} />

      {isOn(cfg, 'presenters') && (
        <div style={s('padding:22px 16px 0')}>
          {sect(lab(cfg, 'presenters'))}
          <div style={s('display:flex;gap:8px;margin-top:10px;overflow-x:auto;padding-bottom:2px')}>
            {cfg.presenters.map((p) => (
              <div key={p.name} style={s('flex:none;width:148px;background:var(--sand);overflow:hidden')}>
                <div style={s('position:relative;height:120px;background:linear-gradient(135deg,var(--hero) 0%,rgba(var(--acc-rgb),.75) 140%);display:flex;align-items:center;justify-content:center;overflow:hidden')}>{p.photo ? <img src={asset(p.photo)} alt="" loading="lazy" style={s('width:100%;height:100%;object-fit:cover;display:block')} /> : <span style={s("font:800 44px/1 'Archivo Black';letter-spacing:.02em;color:#fff")}>{initials(p.name)}</span>}</div>
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
      {isOn(cfg, 'sponsors') && (
        <div style={s('padding:26px 16px 0')}>
          <div style={s("font:800 8.5px/1 'Archivo';letter-spacing:.18em;color:var(--label);text-align:center")}>{lab(cfg, 'partners')}</div>
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
  // Layout option: the stream above the hero (stream-first) or below it (reveal-first).
  const streamOn = st.mode === 'online' && isOn(cfg, 'stream');
  const revealFirst = cfg.layout?.live === 'reveal-first';
  return (
    <section>
      {streamOn && !revealFirst && <StreamEmbed cfg={cfg} label={'LIVE · ' + (g?.short || '')} />}
      <HeroShell glow={isReveal && !revealed ? 'rgba(var(--acc-rgb),.6)' : 'rgba(214,32,42,.3)'}>
        <div style={s('display:flex;align-items:center;justify-content:center;padding-top:15px')}>
          <span style={s('display:flex;align-items:center;gap:7px;background:rgba(214,32,42,.92);padding:7px 11px')}><span style={s('width:7px;height:7px;border-radius:50%;background:#fff;animation:bgBlink 1.2s ease-in-out infinite')} /><span style={s("font:800 9.5px/1 'Archivo';letter-spacing:.2em;color:#fff")}>LIVE · {g?.short}</span></span>
        </div>
        <CarStage cfg={cfg} revealed={revealed || !!cfg.reveal.litBefore} interactive={revealed || !!cfg.reveal.litBefore} seen={st.seen} openHotspot={openHotspot} height={revealed || cfg.reveal.litBefore ? 236 : 190} />
        <div style={s('padding:0 16px 16px;text-align:center')}>
          <div key={title} style={s('animation:bgReveal .5s cubic-bezier(.2,.85,.2,1) both')}>{heroTitle(title, 34)}</div>
          {sub && <div style={s("font:500 12.5px/1.4 'Archivo';color:var(--muted-lt);margin-top:8px")}>{sub}</div>}
          {revealed && cfg.hotspots.length > 0 && <div style={s("font:800 9.5px/1 'Archivo';letter-spacing:.14em;color:var(--acc-lt);margin-top:10px")}>{lab(cfg, 'explored').replace('{n}', String(seenN)).replace('{total}', String(cfg.hotspots.length))}</div>}
          {audLine(cfg, aud.venue, aud.online)}
        </div>
        {isOn(cfg, 'reactions') && (
        <div style={s('display:flex;align-items:center;gap:8px;padding:12px 16px;background:rgba(var(--acc-rgb),.14);box-shadow:inset 0 1px 0 rgba(242,242,240,.12)')}>
          <span style={s("font:800 9.5px/1 'Archivo';letter-spacing:.16em;color:var(--muted-lt);flex:1")}>{lab(cfg, 'react')}</span>
          {REACTS.map((e) => <button key={e} onClick={() => react(e)} className="fq" aria-label={'React ' + e} style={s('width:44px;height:40px;font-size:21px;display:flex;align-items:center;justify-content:center;background:rgba(242,242,240,.08)')}>{e}</button>)}
        </div>
        )}
      </HeroShell>
      {streamOn && revealFirst && <StreamEmbed cfg={cfg} label={'LIVE · ' + (g?.short || '')} />}

      {st.poll !== null && cfg.polls[st.poll] && <div style={s('padding:22px 16px 0')}>{sect(lab(cfg, 'livePoll'))}<PollCard p={cfg.polls[st.poll]} tag="LIVE" tagBg="#D6202A" {...P} /></div>}
      {st.pushCh !== null && cfg.challenges?.[st.pushCh] && <div style={s('padding:22px 16px 0')}>{sect(lab(cfg, 'liveChallenge'))}<ChallengeItem c={cfg.challenges[st.pushCh]} {...P} /></div>}
      {isQa && isOn(cfg, 'qa') && <QABoard {...P} />}
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
      {revealed && !isQa && <Gallery {...P} />}
      {revealed && !isQa && <ShowroomCard {...P} />}
      <ChallengesCard {...P} />
      <Stories {...P} />
      {!isQa && isOn(cfg, 'qa') && <AskCard {...P} compact />}
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
          <div style={s("font:800 9.5px/1 'Archivo';letter-spacing:.3em;color:var(--acc-lt);margin-top:22px")}>{lab(cfg, 'backIn')}</div>
          <Digits parts={[[pad(Math.floor(breakLeft / 60)), 'MIN'], [pad(breakLeft % 60), 'SEC']]} />
          <div style={s("font:500 12.5px/1.45 'Archivo';color:var(--muted-lt);margin-top:16px;max-width:290px;margin-left:auto;margin-right:auto")}>{cfg.breakContent.sub}</div>
          {audLine(cfg, aud.venue, aud.online)}
        </div>
      </HeroShell>
      <div style={s('padding:22px 16px 0')}>
        {sect(lab(cfg, 'quickPoll'))}
        <PollCard p={cfg.breakContent.poll} tag="OPEN" tagBg="var(--panel)" {...P} />
      </div>
      {cfg.breakContent.reads.length > 0 && (
        <div style={s('padding:22px 16px 0')}>
          {sect(lab(cfg, 'whileYouWait'))}
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

      {isOn(cfg, 'cta') && <div style={s('padding:22px 16px 0')}>
        <div style={s('background:var(--panel);padding:18px 16px 18px')}>
          <div style={s('display:flex;align-items:center;gap:8px')}><span style={s('width:6px;height:18px;background:var(--acc);transform:skewX(-8deg)')} /><span style={s("font:800 9.5px/1 'Archivo';letter-spacing:.18em;color:var(--muted)")}>{done ? lab(cfg, 'booked') : cfg.cta.cardKicker}</span></div>
          <div style={s("font:800 30px/.9 'Archivo Black';color:var(--on-panel);margin-top:10px")}>{done ? cfg.cta.doneTitle : cfg.cta.title}</div>
          <div style={s("font:500 13px/1.5 'Archivo';color:var(--muted);margin-top:8px")}>{done ? `${room?.name || ''} · ${st.drive.slot}. ${cfg.cta.doneSub}` : cfg.cta.sub}</div>
          {done ? darkBtn(lab(cfg, 'change'), 'edit', go('drive'), 'margin-top:14px;background:rgba(242,242,240,.1)') : accBtn(cfg.cta.button, 'arrow_forward', go('drive'), 'margin-top:14px')}
        </div>
      </div>}
      <ShowroomCard {...P} pad="12px 16px 0" />
      <TicketCard {...P} after />
      <ChallengesCard {...P} />

      {isOn(cfg, 'follow') && (
      <div style={s('padding:12px 16px 0')}>
        <button onClick={follow} className="fs" style={s('display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:var(--sand);padding:15px')}>
          <span style={{ ...s('width:40px;height:40px;flex:none;display:flex;align-items:center;justify-content:center'), background: st.following ? ACC : 'var(--panel)' }}><Ms size={21} color="#fff">{st.following ? 'notifications_active' : 'notifications'}</Ms></span>
          <span style={s('flex:1;min-width:0')}><span style={s("display:block;font:700 14px/1.2 'Archivo';color:var(--ink)")}>{st.following ? cfg.follow.doneTitle : cfg.follow.title}</span><span style={s("display:block;font:500 11.5px/1.35 'Archivo';color:var(--label);margin-top:3px")}>{st.following ? cfg.follow.doneSub : cfg.follow.sub}</span></span>
          <span style={{ ...s("font:800 9px/1 'Archivo';letter-spacing:.1em;padding:7px 8px"), color: st.following ? '#fff' : 'var(--on-panel)', background: st.following ? ACC : 'var(--panel)' }}>{st.following ? lab(cfg, 'following') : lab(cfg, 'follow')}</span>
        </button>
      </div>
      )}
      <Gallery {...P} />

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
      <ChatPreview {...P} title={lab(cfg, 'chatStaysOpen')} />
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
          <div data-avoid style={s("font:800 34px/.88 'Archivo Black';color:#fff;margin-top:12px;white-space:pre-line")}>{C.title}</div>
          <div style={s("font:500 13px/1.5 'Archivo';color:var(--muted-lt);margin-top:10px;max-width:310px")}>{C.sub}</div>
          {audLine(cfg, 0, aud.online)}
        </div>
      </HeroShell>
      {isOn(cfg, 'community') && <div style={s('padding:22px 16px 0')}>
        <div style={s('background:var(--panel);padding:18px 16px')}>
          <div style={s('display:flex;align-items:center;gap:8px')}><span style={s('width:6px;height:18px;background:var(--acc);transform:skewX(-8deg)')} /><span style={s("font:800 9.5px/1 'Archivo';letter-spacing:.18em;color:var(--muted)")}>{lab(cfg, 'nextEvent')} · {C.next.date}</span></div>
          <div style={s("font:800 30px/.9 'Archivo Black';color:var(--on-panel);margin-top:10px")}>{C.next.name}</div>
          <div style={s("font:500 13px/1.5 'Archivo';color:var(--muted);margin-top:8px")}>{C.next.blurb}</div>
          <div style={s('display:flex;gap:8px;margin-top:14px;flex-wrap:wrap')}>
            {st.nextReg
              ? <span style={s("display:inline-flex;align-items:center;gap:7px;font:800 11.5px/1 'Archivo';letter-spacing:.06em;color:#fff;background:rgba(var(--acc-rgb),.3);padding:13px 15px")}><Ms size={15} color="#fff">check</Ms>REGISTERED</span>
              : accBtn(lab(cfg, 'registerNext'), 'arrow_forward', () => set({ nextReg: true }))}
            {darkBtn(lab(cfg, 'openEventPage'), 'open_in_new', () => set({ event: 'next', route: 'home', navStack: [] }), 'background:rgba(242,242,240,.1)')}
          </div>
        </div>
      </div>}
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
      <SeriesStrip {...P} />
      <ChallengesCard {...P} />
      <IrisTeaser {...{ cfg, revealed: true, set, ask }} />
      <ChatPreview {...P} title={lab(cfg, 'communityChat')} />
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
function PollCard({ p, tag, tagBg, st, vote, cfg }: any) {
  const mine = st.votes[p.id];
  const total = Object.values(p.opts as Record<string, number>).reduce((a, b) => a + b, 0) + (mine ? 1 : 0);
  return (
    <div style={s('margin-top:10px;background:var(--sand);padding:16px;animation:bgRise .35s cubic-bezier(.18,.9,.2,1) both')}>
      <div style={s('display:flex;align-items:center;gap:8px')}><span style={{ ...s("font:800 9px/1 'Archivo';letter-spacing:.1em;color:#fff;padding:5px 6px"), background: tagBg }}>{tag}</span><span style={s("font:700 9.5px/1 'Archivo';letter-spacing:.1em;color:var(--label);margin-left:auto")}>{(p.votes + (mine ? 1 : 0)).toLocaleString()} VOTES</span></div>
      {p.sponsor && <div style={s('margin-top:10px')}><SponsorTag cfg={cfg} name={p.sponsor} /></div>}
      <div style={s("font:800 22px/1 'Archivo Black';color:var(--ink);margin-top:11px")}>{p.q}</div>
      <div style={s('margin-top:12px;display:flex;flex-direction:column;gap:7px')}>
        {Object.keys(p.opts).map((k) => { const v = p.opts[k] + (mine === k ? 1 : 0); const pct = Math.round(v / Math.max(total, 1) * 100); const on = mine === k; return (
          <button key={k} onClick={() => vote(p.id, k)} className="fw" style={s('display:block;width:100%;text-align:left;position:relative;padding:12px 13px;background:var(--ground);overflow:hidden')}>
            <span style={{ ...s('position:absolute;left:0;top:0;bottom:0;transition:width .6s cubic-bezier(.2,.8,.2,1)'), width: mine ? pct + '%' : '0%', background: on ? ACC : 'var(--sand2)' }} />
            <span style={s('position:relative;display:flex;align-items:center;gap:9px')}><span style={{ ...s("flex:1;font:700 13.5px/1.2 'Archivo'"), color: on ? '#fff' : 'var(--ink)' }}>{k}</span><span style={{ ...s("font:800 12px/1 'Archivo';font-variant-numeric:tabular-nums"), color: on && pct > 88 ? '#fff' : 'var(--ink)' }}>{mine ? pct + '%' : ''}</span>{on && <span style={s("font:800 8.5px/1 'Archivo';letter-spacing:.1em;color:#fff;background:var(--panel);padding:4px 5px")}>YOURS</span>}</span>
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
      {sect(lab(cfg, 'askTeam'), <button onClick={go('qa')} style={s("font:700 10.5px/1 'Archivo';letter-spacing:.08em;color:var(--acc)")}>{lab(cfg, 'seeAll')}</button>)}
      <div style={s('margin-top:10px;background:var(--sand);padding:16px')}>
        {!compact && <div style={s("font:800 20px/1.02 'Archivo Black';color:var(--ink)")}>{lab(cfg, 'askTitle')}</div>}
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
  if (!list.length || !isOn(cfg, 'iris')) return null;
  return (
    <div style={s('padding:22px 16px 0')}>
      <div style={s('background:var(--panel);padding:16px')}>
        <div style={s('display:flex;align-items:center;gap:8px')}><span style={s('width:7px;height:7px;background:var(--acc);animation:bgDot 1.6s ease-in-out infinite')} /><span style={s("font:800 18px/1 'Archivo Black';letter-spacing:.04em;color:var(--on-panel)")}>{lab(cfg, 'askIris')}</span><span style={s("font:700 8.5px/1 'Archivo';letter-spacing:.14em;color:var(--muted);margin-left:auto")}>{lab(cfg, 'approvedOnly')}</span></div>
        <div style={s('display:flex;gap:6px;margin-top:12px;flex-wrap:wrap')}>
          {list.map((x) => <button key={x.q} onClick={() => { set({ iris: true }); ask(x.q, x.a, x.stat, x.label); }} className="fq" style={s("font:700 11px/1 'Archivo';color:var(--on-panel);background:rgba(242,242,240,.08);padding:9px 11px")}>{x.q}</button>)}
        </div>
      </div>
    </div>
  );
}

function ChatPreview({ st, go, title, cfg }: any) {
  if (!isOn(cfg, 'chat')) return null;
  const last = st.chat.filter((m: ChatMsg) => !m.ev).slice(-3);
  return (
    <div style={s('padding:22px 16px 0')}>
      {sect(title || lab(cfg, 'liveChat'), small('IN PERSON + ONLINE'))}
      <button onClick={go('chat')} className="fs" style={s('display:block;width:100%;text-align:left;margin-top:10px;background:var(--sand);padding:12px 14px 14px')}>
        {last.map((m: ChatMsg) => (
          <span key={m.id} style={s('display:flex;align-items:flex-start;gap:9px;padding:6px 0')}>
            <span style={s('width:26px;height:26px;flex:none;border-radius:50%;overflow:hidden;background:var(--acc);display:flex;align-items:center;justify-content:center')}>{m.avatar ? <img src={asset(m.avatar)} alt="" loading="lazy" style={s('width:100%;height:100%;object-fit:cover;display:block')} /> : <span style={s("font:800 9.5px/1 'Archivo';color:#fff;letter-spacing:.02em")}>{initials(m.user)}</span>}</span>
            <span style={s('flex:1;min-width:0')}><span style={s("display:block;font:800 9px/1 'Archivo';letter-spacing:.08em;color:var(--label)")}>{m.me ? 'YOU' : m.user} · {m.tag}</span><span style={s("display:block;font:500 13px/1.35 'Archivo';color:var(--ink);margin-top:4px")}>{m.text}</span></span>
          </span>
        ))}
        <span style={s("display:inline-flex;align-items:center;gap:6px;margin-top:8px;font:800 9.5px/1 'Archivo';letter-spacing:.1em;color:var(--on-panel);background:var(--panel);padding:9px 10px")}><Ms size={13} color="var(--on-panel)">forum</Ms>{lab(cfg, 'joinChat')}</span>
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
              {!me && <span style={s('width:32px;height:32px;flex:none;border-radius:50%;overflow:hidden;margin-top:12px;background:var(--acc);display:flex;align-items:center;justify-content:center')}>{m.avatar ? <img src={asset(m.avatar)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <span style={s("font:800 11px/1 'Archivo';color:#fff;letter-spacing:.02em")}>{initials(m.user)}</span>}</span>}
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
      {st.built && (cfg as EventConfig).product.variants[st.variant] && (
        <div style={s('display:flex;align-items:center;gap:10px;margin-top:14px;padding:11px 13px;background:var(--sand)')}>
          <span style={{ ...s('width:18px;height:18px;flex:none;border-radius:50%;box-shadow:inset 0 0 0 1.5px rgba(0,0,0,.15)'), background: (cfg as EventConfig).showroom?.colours.find((c) => c.name === st.colour)?.hex }} />
          <span style={s("flex:1;min-width:0;font:700 12.5px/1.3 'Archivo';color:var(--ink)")}>{(cfg as EventConfig).product.variants[st.variant].name} · {st.colour}</span>
          <span style={s("font:800 8.5px/1 'Archivo';letter-spacing:.12em;color:var(--label)")}>YOUR SPEC</span>
        </div>
      )}
      {C.options.length > 0 && <>
        <div style={s('margin-top:20px')}>{label(C.optionsLabel)}</div>
        <div style={s('margin-top:9px;display:flex;flex-direction:column;gap:7px')}>
          {C.options.map((r) => { const on = d.showroom === r.id; return (
            <button key={r.id} onClick={() => set((x: ESt) => ({ drive: { ...x.drive, showroom: r.id, done: false } }))} className="fw" style={{ ...s('display:flex;align-items:center;gap:11px;width:100%;text-align:left;padding:13px'), background: on ? 'var(--panel)' : 'var(--sand)' }}>
              <Ms size={20} color={on ? 'var(--acc-lt)' : 'var(--label)'}>storefront</Ms>
              <span style={s('flex:1;min-width:0')}><span style={{ ...s("display:block;font:700 14px/1.2 'Archivo'"), color: on ? 'var(--on-panel)' : 'var(--ink)' }}>{r.name}</span><span style={{ ...s("display:block;font:500 11.5px/1.3 'Archivo';margin-top:3px"), color: on ? 'var(--muted)' : 'var(--label)' }}>{r.sub}</span></span>
              {st.routed && routeFor(cfg, st.answers) === r.id && <span style={{ ...s("font:800 8px/1 'Archivo';letter-spacing:.1em;padding:5px 6px;white-space:nowrap"), color: on ? 'var(--on-panel)' : 'var(--ink)', background: on ? 'rgba(242,242,240,.14)' : 'var(--ground)' }}>NEAREST</span>}
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

// Product gallery: a row of images with captions, after the reveal and in the recap.
function Gallery({ cfg }: any) {
  const G = (cfg as EventConfig).gallery; if (!G?.items?.length || !isOn(cfg, 'gallery')) return null;
  return (
    <div style={s('padding:22px 16px 0')}>
      {sect(G.title || lab(cfg, 'gallery'))}
      <div style={s('display:flex;gap:8px;margin-top:10px;overflow-x:auto;padding-bottom:2px')}>
        {G.items.map((x, i) => (
          <figure key={i} style={s('flex:none;width:240px;margin:0;background:var(--sand)')}>
            <div style={s('height:150px;background:var(--hero);overflow:hidden')}>{x.src && <img src={asset(x.src)} alt={x.caption} loading="lazy" style={s('width:100%;height:100%;object-fit:cover;display:block')} />}</div>
            {x.caption && <figcaption style={s("padding:10px 12px 12px;font:600 12px/1.35 'Archivo';color:var(--ink)")}>{x.caption}</figcaption>}
          </figure>
        ))}
      </div>
    </div>
  );
}

// ═══════════ sports blocks ═══════════
// A sponsor's placeholder badge: their colour and initials, no real logos.
function SponsorTag({ cfg, name, dark }: { cfg: EventConfig; name: string; dark?: boolean }) {
  const b = sponsorOf(cfg, name); if (!b) return null;
  return (
    <span style={s('display:inline-flex;align-items:center;gap:7px')}>
      <span style={s("font:800 8px/1 'Archivo';letter-spacing:.14em;color:" + (dark ? 'var(--muted)' : 'var(--label)'))}>PRESENTED BY</span>
      <span style={{ ...s("display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:18px;padding:0 5px;font:900 9px/1 'Archivo';letter-spacing:.04em;color:#fff"), background: b.color }}>{b.short}</span>
      <span style={s("font:800 10px/1 'Archivo';letter-spacing:.06em;color:" + (dark ? 'var(--on-panel)' : 'var(--ink)'))}>{b.name.toUpperCase()}</span>
    </span>
  );
}

function SeriesStrip({ cfg }: any) {
  const S = (cfg as EventConfig).series; if (!S || !isOn(cfg, 'series')) return null;
  return (
    <div style={s('padding:16px 16px 0')}>
      <div style={s('background:var(--sand);padding:13px 14px')}>
        <div style={s('display:flex;align-items:center;gap:8px')}><Ms size={16} color={ACC}>trophy</Ms><span style={s("font:800 9.5px/1 'Archivo';letter-spacing:.16em;color:var(--label)")}>{S.name.toUpperCase()}</span><span style={s("margin-left:auto;font:800 9px/1 'Archivo';letter-spacing:.1em;color:var(--label)")}>{S.order} OF {S.total}</span></div>
        <div style={s('display:flex;gap:4px;margin-top:11px')}>
          {S.stages.map((n, i) => { const on = i + 1 === S.order, done = i + 1 < S.order; return (
            <div key={n} style={s('flex:1;min-width:0')}>
              <div style={{ ...s('height:4px'), background: on ? 'var(--acc)' : done ? 'var(--ink)' : 'var(--sand2)' }} />
              <div style={{ ...s("font:800 9.5px/1.2 'Archivo';letter-spacing:.04em;margin-top:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"), color: on ? 'var(--ink)' : 'var(--label)' }}>{done ? '✓ ' : ''}{n}</div>
            </div>
          ); })}
        </div>
        <div style={s("font:500 11px/1.4 'Archivo';color:var(--body);margin-top:9px")}>One community and one points total across the series.</div>
      </div>
    </div>
  );
}

function TicketCard({ cfg, st, buyTickets, refCode, after }: any) {
  const T = (cfg as EventConfig).tickets; if (!T || !isOn(cfg, 'tickets')) return null;
  const code = st.crew ? crewCode(st.crew) : refCode;
  const shareRef = async () => {
    const url = window.location.origin + window.location.pathname + '?ref=' + code;
    try { if (navigator.share) { await navigator.share({ title: cfg.event.name, url }); return; } await navigator.clipboard.writeText(url); } catch { /* dismissed */ }
  };
  return (
    <div style={s('padding:' + (after ? '12px' : '16px') + ' 16px 0')}>
      <div style={s('background:var(--panel);padding:16px')}>
        <div style={s('display:flex;align-items:center;gap:8px')}><Ms size={17} color="var(--acc-lt)">confirmation_number</Ms><span style={s("font:800 9.5px/1 'Archivo';letter-spacing:.16em;color:var(--muted)")}>{after ? 'NEXT · ' + lab(cfg, 'tickets') : lab(cfg, 'tickets')}</span><span style={s("margin-left:auto;font:800 11px/1 'Archivo';color:var(--on-panel)")}>{T.priceFrom}</span></div>
        <div style={s("font:500 11.5px/1.4 'Archivo';color:var(--muted);margin-top:8px")}>{T.sub}</div>
        {accBtn(T.label.toUpperCase(), 'open_in_new', buyTickets, 'width:100%;margin-top:12px')}
        <button onClick={shareRef} style={s('display:flex;align-items:center;gap:9px;width:100%;margin-top:10px;padding:10px 12px;background:rgba(242,242,240,.08);text-align:left')}>
          <Ms size={16} color="var(--acc-lt)">{st.crew ? 'group' : 'person'}</Ms>
          <span style={s('flex:1;min-width:0')}><span style={s("display:block;font:800 8.5px/1 'Archivo';letter-spacing:.14em;color:var(--muted)")}>{st.crew ? lab(cfg, 'crewCode') : lab(cfg, 'refCode')}</span><span style={s("display:block;font:800 15px/1 'Archivo Black';letter-spacing:.08em;color:var(--on-panel);margin-top:5px")}>{code}</span></span>
          <span style={s("font:800 9.5px/1 'Archivo';letter-spacing:.1em;color:var(--acc-lt)")}>SHARE</span>
        </button>
      </div>
    </div>
  );
}

function Stories({ cfg }: any) {
  const S = (cfg as EventConfig).stories; if (!S?.items?.length || !isOn(cfg, 'stories')) return null;
  return (
    <div style={s('padding:22px 16px 0')}>
      {sect(S.title)}
      <div style={s('display:flex;gap:8px;margin-top:10px;overflow-x:auto;padding-bottom:2px')}>
        {S.items.map((x) => (
          <div key={x.title} style={s('flex:none;width:224px;background:var(--sand);overflow:hidden;display:flex;flex-direction:column')}>
            <div style={{ ...s('height:5px'), background: x.color || 'var(--acc)' }} />
            <div style={s('padding:13px 14px 15px;display:flex;flex-direction:column;flex:1')}>
              <div style={s("font:800 8.5px/1 'Archivo';letter-spacing:.14em;color:var(--label)")}>{x.kicker}</div>
              <div style={s("font:800 17px/1.05 'Archivo Black';color:var(--ink);margin-top:8px")}>{x.title}</div>
              <div style={s("font:500 12px/1.45 'Archivo';color:var(--body);margin-top:7px;flex:1")}>{x.body}</div>
              {x.stat && <div style={s('display:flex;align-items:baseline;gap:7px;margin-top:11px;padding-top:9px;border-top:1.5px solid var(--hair)')}><span style={s("font:800 20px/.9 'Archivo Black';color:var(--acc)")}>{x.stat}</span><span style={s("font:700 8.5px/1.2 'Archivo';letter-spacing:.1em;color:var(--label)")}>{(x.unit || '').toUpperCase()}</span></div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const CH_ICON: Record<string, string> = { predict: 'online_prediction', checkin: 'qr_code_scanner', trivia: 'quiz', poll: 'how_to_vote' };
function ChallengeItem({ c, cfg, st, complete, vote, compact }: any) {
  const C = cfg as EventConfig; const ch = c as Challenge;
  const done = st.book.done[C.id + ':' + ch.id];
  const poll = ch.kind === 'poll' ? C.polls.find((p) => p.id === ch.poll) : null;
  const opts = ch.kind === 'poll' ? Object.keys(poll?.opts || {}) : ch.options || [];
  const picked = ch.kind === 'poll' ? st.votes[ch.poll || ''] || done?.pick : done?.pick;
  return (
    <div style={{ ...s('margin-top:8px;background:var(--sand);padding:14px'), boxShadow: done ? 'inset 3px 0 0 var(--acc)' : 'none' }}>
      <div style={s('display:flex;align-items:flex-start;gap:11px')}>
        <span style={{ ...s('width:34px;height:34px;flex:none;display:flex;align-items:center;justify-content:center'), background: done ? ACC : 'var(--panel)' }}><Ms size={18} color="#fff">{done ? 'check' : CH_ICON[ch.kind]}</Ms></span>
        <span style={s('flex:1;min-width:0')}>
          <span style={s("display:block;font:700 14px/1.2 'Archivo';color:var(--ink)")}>{ch.title}</span>
          <span style={s("display:block;font:500 11.5px/1.35 'Archivo';color:var(--label);margin-top:3px")}>{ch.sub}</span>
        </span>
        <span style={{ ...s("font:800 10px/1 'Archivo';letter-spacing:.06em;padding:6px 7px;white-space:nowrap"), color: done ? '#fff' : 'var(--ink)', background: done ? ACC : 'var(--ground)' }}>{done ? '+' + done.pts : '+' + ch.points} PTS</span>
      </div>
      {ch.sponsor && <div style={s('margin-top:10px')}><SponsorTag cfg={C} name={ch.sponsor} /></div>}
      {!compact && opts.length > 0 && (
        <div style={s('display:flex;flex-wrap:wrap;gap:6px;margin-top:12px')}>
          {opts.map((o) => { const on = picked === o; const right = ch.kind === 'trivia' && done && o === ch.answer; return (
            <button key={o} disabled={!!done} onClick={() => (ch.kind === 'poll' ? vote(ch.poll, o) : complete(ch, o))} style={{ ...s("font:700 12px/1 'Archivo';padding:10px 11px"), background: on ? 'var(--panel)' : right ? 'rgba(var(--acc-rgb),.18)' : 'var(--ground)', color: on ? 'var(--on-panel)' : 'var(--ink)', opacity: done && !on && !right ? 0.55 : 1 }}>{o}{right && !on ? ' ✓' : ''}</button>
          ); })}
        </div>
      )}
      {!compact && ch.kind === 'checkin' && !done && <div style={s("display:flex;align-items:center;gap:7px;margin-top:11px;font:600 11.5px/1.35 'Archivo';color:var(--body)")}><Ms size={15} color={ACC}>qr_code_2</Ms>Scan the QR at the fan zone. It checks you in and adds the points.</div>}
      {done && ch.kind === 'trivia' && <div style={s("font:600 11.5px/1.35 'Archivo';color:var(--body);margin-top:9px")}>{done.pts ? 'Correct.' : 'Not this time. The answer is ' + ch.answer + '.'}</div>}
    </div>
  );
}

function ChallengesCard(P: any) {
  const { cfg, st, go } = P; const C = cfg as EventConfig;
  if (!C.challenges?.length || !isOn(C, 'challenges')) return null;
  const left = C.challenges.filter((c) => !st.book.done[C.id + ':' + c.id]);
  const total = pointsTotal(st.book);
  const next = C.rewards?.filter((r) => r.points > total).sort((a, b) => a.points - b.points)[0];
  return (
    <div style={s('padding:22px 16px 0')}>
      {sect(lab(C, 'challenges'), <button onClick={go('challenges')} style={s("font:700 10.5px/1 'Archivo';letter-spacing:.08em;color:var(--acc)")}>{lab(C, 'rewards')}</button>)}
      <button onClick={go('challenges')} className="fp" style={s('display:flex;align-items:center;gap:12px;width:100%;margin-top:10px;padding:14px;background:var(--panel);text-align:left')}>
        <span style={s('flex:1;min-width:0')}>
          <span style={s("display:block;font:800 8.5px/1 'Archivo';letter-spacing:.14em;color:var(--muted)")}>{C.series ? lab(C, 'seriesPoints') : lab(C, 'points')}</span>
          <span style={s("display:block;font:800 34px/.9 'Archivo Black';color:var(--on-panel);margin-top:7px;font-variant-numeric:tabular-nums")}>{total}</span>
        </span>
        <span style={s("font:600 11px/1.35 'Archivo';color:var(--muted);text-align:right;max-width:150px")}>{next ? (next.points - total) + ' to ' + next.name : C.rewards?.length ? 'Every reward unlocked' : left.length + ' challenges left'}</span>
        <Ms size={18} color="var(--muted)">chevron_right</Ms>
      </button>
      {left.slice(0, 1).map((c) => <ChallengeItem key={c.id} c={c} {...P} />)}
    </div>
  );
}

function ChallengesScreen(P: any) {
  const { cfg, st, claim } = P; const C = cfg as EventConfig;
  const total = pointsTotal(st.book);
  const byEv: Record<string, number> = {};
  Object.values(st.book.done as PointsBook['done']).forEach((d) => { byEv[d.ev] = (byEv[d.ev] || 0) + d.pts; });
  return (
    <div style={s('animation:bgFade .25s ease both;padding:18px 16px 28px')}>
      <div style={s('background:var(--panel);padding:18px 16px')}>
        <div style={s("font:800 9.5px/1 'Archivo';letter-spacing:.16em;color:var(--muted)")}>{C.series ? C.series.name.toUpperCase() + ' · SERIES POINTS' : 'YOUR POINTS'}</div>
        <div style={s("font:800 52px/.9 'Archivo Black';color:var(--on-panel);margin-top:10px;font-variant-numeric:tabular-nums")}>{total}</div>
        {C.series && Object.keys(byEv).length > 0 && (
          <div style={s('display:flex;flex-wrap:wrap;gap:6px;margin-top:12px')}>
            {Object.entries(byEv).map(([ev, n]) => <span key={ev} style={s("font:700 10.5px/1 'Archivo';color:var(--on-panel);background:rgba(242,242,240,.1);padding:7px 8px")}>{(getEvent(ev)?.series?.stage || ev)} · {n}</span>)}
          </div>
        )}
        {C.series && <div style={s("font:500 11.5px/1.4 'Archivo';color:var(--muted);margin-top:10px")}>Points carry across every stage of the series.</div>}
      </div>
      <div style={s('margin-top:20px')}>{sect(lab(C, 'challenges'), small((C.challenges || []).filter((c) => st.book.done[C.id + ':' + c.id]).length + ' OF ' + (C.challenges || []).length + ' DONE'))}</div>
      {(C.challenges || []).map((c) => <ChallengeItem key={c.id} c={c} {...P} />)}
      {(C.rewards || []).length > 0 && <>
        <div style={s('margin-top:24px')}>{sect(lab(C, 'rewards'))}</div>
        <div style={s('display:flex;flex-direction:column;gap:8px;margin-top:10px')}>
          {(C.rewards || []).map((r) => { const ok = total >= r.points, got = st.book.claimed.includes(r.id); return (
            <div key={r.id} style={s('background:var(--sand);padding:14px')}>
              <div style={s('display:flex;align-items:flex-start;gap:11px')}>
                <Ms size={22} color={ok ? ACC : 'var(--label)'}>{got ? 'verified' : ok ? 'redeem' : 'lock'}</Ms>
                <span style={s('flex:1;min-width:0')}><span style={s("display:block;font:700 14px/1.2 'Archivo';color:var(--ink)")}>{r.name}</span><span style={s("display:block;font:500 11.5px/1.35 'Archivo';color:var(--label);margin-top:3px")}>{r.sub} · {r.stock} left</span></span>
                <span style={s("font:800 11px/1 'Archivo';color:var(--ink);white-space:nowrap")}>{r.points} PTS</span>
              </div>
              {r.sponsor && <div style={s('margin-top:9px')}><SponsorTag cfg={C} name={r.sponsor} /></div>}
              <div style={s('height:6px;background:var(--ground);margin-top:11px')}><span style={{ ...s('display:block;height:6px;transition:width .6s ease'), width: Math.min(100, (total / r.points) * 100) + '%', background: ok ? ACC : 'var(--sand2)' }} /></div>
              {ok && <button disabled={got} onClick={() => claim(r.id, r.name)} style={{ ...s("display:inline-flex;align-items:center;gap:6px;margin-top:11px;font:800 10.5px/1 'Archivo';letter-spacing:.08em;padding:10px 12px"), background: got ? 'var(--ground)' : ACC, color: got ? 'var(--ink)' : '#fff' }}><Ms size={14} color={got ? ACC : '#fff'}>{got ? 'check' : 'redeem'}</Ms>{got ? 'CLAIMED · SHOW AT THE DESK' : lab(C, 'claim')}</button>}
            </div>
          ); })}
        </div>
      </>}
    </div>
  );
}

// Register-interest questions (model, budget, area…) and the consent tick.
function InterestFields({ cfg, st, set }: { cfg: EventConfig; st: ESt; set: (p: any) => void }) {
  const I = cfg.interest!;
  return (
    <div style={s('margin-top:18px;padding-top:16px;border-top:1.5px solid var(--hair)')}>
      <div style={s("font:800 17px/1.05 'Archivo Black';color:var(--ink)")}>{I.title}</div>
      <div style={s("font:500 11.5px/1.4 'Archivo';color:var(--body);margin-top:5px")}>{I.sub}</div>
      {I.fields.map((f) => (
        <div key={f.id} style={s('margin-top:13px')}>
          {label(f.label.toUpperCase())}
          <div style={s('display:flex;flex-wrap:wrap;gap:6px;margin-top:8px')}>
            {f.options.map((o) => { const on = st.answers[f.id] === o; return (
              <button key={o} onClick={() => set((x: ESt) => ({ answers: { ...x.answers, [f.id]: on ? '' : o } }))} style={{ ...s("font:700 12px/1 'Archivo';padding:10px 11px"), background: on ? 'var(--panel)' : 'var(--ground)', color: on ? 'var(--on-panel)' : 'var(--ink)' }}>{o}</button>
            ); })}
          </div>
        </div>
      ))}
      <button onClick={() => set((x: ESt) => ({ consent: !x.consent }))} style={s('display:flex;align-items:flex-start;gap:10px;width:100%;text-align:left;margin-top:15px')}>
        <span style={{ ...s('width:20px;height:20px;flex:none;display:flex;align-items:center;justify-content:center;margin-top:1px'), background: st.consent ? ACC : 'var(--ground)', boxShadow: st.consent ? 'none' : 'inset 0 0 0 2px var(--sand2)' }}>{st.consent && <Ms size={14} color="#fff">check</Ms>}</span>
        <span style={s("font:500 11.5px/1.45 'Archivo';color:var(--body)")}>{I.consent}</span>
      </button>
    </div>
  );
}

// Entry to the colour + trim picker and the monthly cost, after the reveal.
function ShowroomCard({ cfg, st, go, pad: padding = '22px 16px 0' }: any) {
  const S = (cfg as EventConfig).showroom; const V = (cfg as EventConfig).product.variants;
  const showBuild = isOn(cfg, 'showroom'), showFin = isOn(cfg, 'finance');
  if (!S || !V.length || (!showBuild && !showFin)) return null;
  const v = V[st.variant] || V[0]; const col = S.colours.find((c) => c.name === st.colour) || S.colours[0];
  const low = V[0]; const lowM = monthlyFlat(priceNum(low.price), S.finance.defaultDeposit, S.finance.rate, S.finance.termUnit === 'months' ? S.finance.defaultTerm / 12 : S.finance.defaultTerm).monthly;
  const tile = 'flex:1;min-width:0;text-align:left;background:var(--sand);padding:14px';
  return (
    <div style={s('padding:' + padding)}>
      {padding.startsWith('22') && sect(S.buildTitle)}
      <div style={s('display:flex;gap:8px;margin-top:' + (padding.startsWith('22') ? '10px' : '0'))}>
        {showBuild && <button onClick={go('build')} className="fs" style={s(tile)}>
          <span style={s('display:flex;gap:4px')}>{S.colours.map((c) => <span key={c.name} style={{ ...s('width:14px;height:14px;border-radius:50%;box-shadow:inset 0 0 0 1px rgba(0,0,0,.18)'), background: c.hex }} />)}</span>
          <span style={s("display:block;font:800 16px/1.05 'Archivo Black';color:var(--ink);margin-top:11px")}>{lab(cfg, 'colourTrim')}</span>
          <span style={s("display:block;font:500 11px/1.35 'Archivo';color:var(--label);margin-top:4px")}>{st.built ? v.name + ' · ' + col.name : S.colours.length + ' colours · ' + V.length + ' trims'}</span>
        </button>}
        {showFin && <button onClick={go('finance')} className="fs" style={s(tile)}>
          <Ms size={18} color={ACC}>payments</Ms>
          <span style={s("display:block;font:800 16px/1.05 'Archivo Black';color:var(--ink);margin-top:9px")}>{lab(cfg, 'monthlyCost')}</span>
          <span style={s("display:block;font:500 11px/1.35 'Archivo';color:var(--label);margin-top:4px")}>From {fmtMoney(priceCur(low.price), lowM)} a month</span>
        </button>}
      </div>
    </div>
  );
}

const chip = (text: string, on: boolean, onClick: () => void) => (
  <button key={text} onClick={onClick} style={{ ...s("font:700 12px/1 'Archivo';padding:11px 12px;white-space:nowrap"), background: on ? ACC : 'var(--sand)', color: on ? '#fff' : 'var(--ink)' }}>{text}</button>
);

function Build({ cfg, st, set, go }: any) {
  const S = (cfg as EventConfig).showroom!; const V = (cfg as EventConfig).product.variants;
  const v = V[st.variant] || V[0]; const col = S.colours.find((c) => c.name === st.colour) || S.colours[0];
  const pick = (p: Partial<ESt>) => set({ ...p, built: true });
  return (
    <div style={s('animation:bgFade .25s ease both;padding-bottom:28px')}>
      <div style={s('position:relative;background:var(--hero);overflow:hidden')}>
        <div style={{ ...s('position:absolute;inset:0;transition:background .5s ease'), background: `radial-gradient(64% 52% at 50% 70%, ${col.hex}99, transparent 72%)` }} />
        <CarStage cfg={cfg} revealed interactive={false} seen={{}} height={210} />
        <div style={s('position:absolute;left:16px;right:16px;bottom:14px;display:flex;align-items:center;gap:8px')}>
          <span style={{ ...s('width:12px;height:12px;border-radius:50%;box-shadow:0 0 0 2px rgba(255,255,255,.7)'), background: col.hex }} />
          <span style={s("font:800 10px/1 'Archivo';letter-spacing:.16em;color:#F2F2F0")}>{col.name.toUpperCase()}</span>
          <span style={s("margin-left:auto;font:700 9px/1 'Archivo';letter-spacing:.12em;color:var(--muted)")}>{lab(cfg, 'colourNote')}</span>
        </div>
      </div>
      <div style={s('padding:18px 16px 0')}>
        <div style={s("font:800 30px/.92 'Archivo Black';color:var(--ink)")}>{v.name}</div>
        <div style={s("font:500 13px/1.5 'Archivo';color:var(--body);margin-top:8px")}>{S.buildSub}</div>
        <div style={s('margin-top:20px;display:flex;align-items:center;gap:8px')}>{label(lab(cfg, 'colour'))}<span style={s("font:700 11px/1 'Archivo';color:var(--ink);margin-left:auto")}>{col.name}</span></div>
        <div style={s('display:flex;gap:12px;margin-top:11px')}>
          {S.colours.map((c) => { const on = c.name === col.name; return (
            <button key={c.name} onClick={() => pick({ colour: c.name })} aria-label={c.name} style={{ ...s('width:46px;height:46px;border-radius:50%;transition:box-shadow .18s ease'), background: c.hex, boxShadow: on ? '0 0 0 3px var(--ground),0 0 0 5px var(--acc)' : 'inset 0 0 0 1px rgba(0,0,0,.18)' }} />
          ); })}
        </div>
        <div style={s('margin-top:22px')}>{label(lab(cfg, 'trim'))}</div>
        <div style={s('margin-top:9px;display:flex;flex-direction:column;gap:7px')}>
          {V.map((x, i) => { const on = i === st.variant; return (
            <button key={x.name} onClick={() => pick({ variant: i })} className="fw" style={{ ...s('display:flex;align-items:center;gap:11px;width:100%;text-align:left;padding:13px'), background: on ? 'var(--panel)' : 'var(--sand)' }}>
              <span style={s('flex:1;min-width:0')}><span style={{ ...s("display:block;font:700 14px/1.2 'Archivo'"), color: on ? 'var(--on-panel)' : 'var(--ink)' }}>{x.name}</span><span style={{ ...s("display:block;font:500 11.5px/1.3 'Archivo';margin-top:3px"), color: on ? 'var(--muted)' : 'var(--label)' }}>{x.spec}</span></span>
              <span style={{ ...s("font:800 13px/1 'Archivo';font-variant-numeric:tabular-nums"), color: on ? 'var(--on-panel)' : 'var(--ink)' }}>{x.price}</span>
            </button>
          ); })}
        </div>
        <div style={s('display:flex;flex-direction:column;gap:8px;margin-top:20px')}>
          {isOn(cfg, 'finance') && accBtn(lab(cfg, 'seeMonthly'), 'payments', () => { set({ built: true }); go('finance')(); }, 'width:100%')}
          {isOn(cfg, 'cta') && darkBtn((cfg as EventConfig).cta.button, 'arrow_forward', () => { set({ built: true }); go('drive')(); }, 'width:100%')}
        </div>
      </div>
    </div>
  );
}

function Finance({ cfg, st, set, go }: any) {
  const C = cfg as EventConfig; const F = C.showroom!.finance; const V = C.product.variants;
  const v = V[st.variant] || V[0]; const price = priceNum(v.price); const cur = priceCur(v.price);
  const yrs = (t: number) => (F.termUnit === 'months' ? t / 12 : t);
  const unit = (t: number) => (F.termUnit === 'months' ? t + ' mo' : t + ' yrs');
  const m = monthlyFlat(price, st.deposit, F.rate, yrs(st.term));
  useEffect(() => { if (!st.financeSeen) set({ financeSeen: true }); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const row = (k: string, val: string, strong = false) => (
    <div key={k} style={s('display:flex;align-items:baseline;gap:10px;padding:10px 0;border-top:1.5px solid var(--hair)')}>
      <span style={s("flex:1;font:500 12.5px/1.3 'Archivo';color:var(--body)")}>{k}</span>
      <span style={{ ...s("font:800 13px/1 'Archivo';color:var(--ink);font-variant-numeric:tabular-nums"), fontSize: strong ? 15 : 13 }}>{val}</span>
    </div>
  );
  const R = F.running; const maxR = R ? Math.max(...(R.rows || []).map((r) => r.v), 1) : 1;
  const O = F.ownership; const run = O ? O.items.reduce((a, x) => a + x.v, 0) : 0;
  return (
    <div style={s('animation:bgFade .25s ease both;padding:18px 16px 28px')}>
      <div style={s('background:var(--panel);padding:18px 16px')}>
        <div style={s('display:flex;align-items:center;gap:8px')}><span style={s('width:6px;height:18px;background:var(--acc);transform:skewX(-8deg)')} /><span style={s("font:800 9.5px/1 'Archivo';letter-spacing:.18em;color:var(--muted)")}>{v.name.toUpperCase()} · {st.deposit}% DOWN · {F.termUnit === 'months' ? st.term + ' MONTHS' : st.term + ' YEARS'}</span></div>
        <div style={s('display:flex;align-items:baseline;gap:8px;margin-top:12px')}>
          <span key={m.monthly} style={s("font:800 46px/.9 'Archivo Black';color:var(--on-panel);font-variant-numeric:tabular-nums;animation:bgReveal .35s cubic-bezier(.2,.85,.2,1) both")}>{fmtMoney(cur, m.monthly)}</span>
          <span style={s("font:800 10px/1 'Archivo';letter-spacing:.14em;color:var(--muted)")}>{lab(cfg, 'aMonth')}</span>
        </div>
        <div style={s("font:500 12px/1.45 'Archivo';color:var(--muted);margin-top:9px")}>{F.sub}</div>
      </div>
      <div style={s('margin-top:18px')}>{label(lab(cfg, 'trim'))}</div>
      <div style={s('display:flex;gap:6px;margin-top:9px;flex-wrap:wrap')}>{V.map((x, i) => chip(x.name.replace(/^\S+\s/, ''), i === st.variant, () => set({ variant: i })))}</div>
      <div style={s('display:flex;gap:18px;margin-top:16px;flex-wrap:wrap')}>
        {F.depositRange
          ? <Slider label={lab(cfg, 'deposit')} value={st.deposit} range={F.depositRange} fmt={(n) => n + '% · ' + fmtMoney(cur, price * n / 100)} onChange={(n) => set({ deposit: n })} />
          : <div>{label(lab(cfg, 'deposit'))}<div style={s('display:flex;gap:6px;margin-top:9px')}>{F.deposits.map((d) => chip(d + '%', d === st.deposit, () => set({ deposit: d })))}</div></div>}
        {F.termRange
          ? <Slider label={lab(cfg, 'term')} value={st.term} range={F.termRange} fmt={(n) => (F.termUnit === 'months' ? n + ' months' : n + ' years')} onChange={(n) => set({ term: n })} />
          : <div>{label(lab(cfg, 'term'))}<div style={s('display:flex;gap:6px;margin-top:9px')}>{F.terms.map((t) => chip(unit(t), t === st.term, () => set({ term: t })))}</div></div>}
      </div>
      <div style={s('margin-top:18px;background:var(--sand);padding:4px 14px')}>
        {[
          row('On-the-road price', fmtMoney(cur, price)),
          row('Deposit (' + st.deposit + '%)', fmtMoney(cur, price - m.loan)),
          row('Amount financed', fmtMoney(cur, m.loan)),
          row('Interest, ' + F.rate + '% flat over ' + (F.termUnit === 'months' ? st.term + ' months' : st.term + ' years'), fmtMoney(cur, m.interest)),
          row('Total payable', fmtMoney(cur, m.total + price - m.loan), true),
        ]}
      </div>
      {O && O.items.length > 0 && (
        <div style={s('margin-top:22px')}>
          {sect(O.title, <span style={s("font:800 8.5px/1 'Archivo';letter-spacing:.12em;color:var(--label);background:var(--sand);padding:5px 7px")}>ESTIMATE</span>)}
          <div style={s("font:500 11.5px/1.4 'Archivo';color:var(--body);margin-top:8px")}>{O.sub}</div>
          <div style={s('margin-top:10px;background:var(--sand);padding:4px 14px')}>
            {[...O.items.map((x) => row(x.label, fmtMoney(cur, x.v) + ' / mo')), row('Running cost', fmtMoney(cur, run) + ' / mo', true)]}
          </div>
          <div style={s('display:flex;align-items:baseline;gap:8px;margin-top:10px;padding:13px 14px;background:var(--panel)')}>
            <span style={s("flex:1;font:600 12px/1.35 'Archivo';color:var(--muted)")}>Loan plus running cost, estimated</span>
            <span style={s("font:800 20px/1 'Archivo Black';color:var(--on-panel);font-variant-numeric:tabular-nums")}>{fmtMoney(cur, m.monthly + run)}</span>
            <span style={s("font:800 9px/1 'Archivo';letter-spacing:.12em;color:var(--muted)")}>{lab(cfg, 'aMonth')}</span>
          </div>
          <div style={s("font:500 10.5px/1.45 'Archivo';color:var(--label);margin-top:8px")}>{O.note}</div>
        </div>
      )}
      {R && (
        <div style={s('margin-top:22px')}>
          {sect(R.title)}
          <div style={s("font:500 11.5px/1.4 'Archivo';color:var(--body);margin-top:8px")}>{R.sub}</div>
          <div style={s('margin-top:10px;display:flex;flex-direction:column;gap:9px')}>
            {R.rows.map((r, i) => (
              <div key={r.label}>
                <div style={s('display:flex;align-items:baseline;gap:8px')}><span style={s("flex:1;font:600 12.5px/1.3 'Archivo';color:var(--ink)")}>{r.label}</span><span style={s("font:800 12.5px/1 'Archivo';color:var(--ink);font-variant-numeric:tabular-nums")}>{fmtMoney(cur, r.v)}</span></div>
                <div style={s('height:8px;background:var(--sand);margin-top:6px')}><span style={{ ...s('display:block;height:8px'), width: (r.v / maxR) * 100 + '%', background: i < R.rows.length - 1 ? ACC : 'var(--label)' }} /></div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={s("font:500 10.5px/1.45 'Archivo';color:var(--label);margin-top:16px")}>{F.note}</div>
      <div style={s('display:flex;flex-direction:column;gap:8px;margin-top:16px')}>
        {isOn(cfg, 'cta') && accBtn(C.cta.button, 'arrow_forward', go('drive'), 'width:100%')}
        {darkBtn(lab(cfg, 'changeBuild'), 'palette', go('build'), 'width:100%')}
      </div>
    </div>
  );
}

// A labelled range slider in the fan view's style (deposit, term).
function Slider({ label: l, value, range, fmt, onChange }: { label: string; value: number; range: [number, number, number]; fmt: (n: number) => string; onChange: (n: number) => void }) {
  const [min, max, step] = range; const v = Math.min(max, Math.max(min, value));
  return (
    <div style={s('flex:1 1 100%')}>
      <div style={s('display:flex;align-items:baseline;gap:8px')}>{label(l)}<span style={s("margin-left:auto;font:800 13px/1 'Archivo';color:var(--ink);font-variant-numeric:tabular-nums")}>{fmt(v)}</span></div>
      <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => onChange(Number(e.target.value))} aria-label={l} className="ev-range" style={{ width: '100%', marginTop: 10, ['--p' as any]: ((v - min) / Math.max(max - min, 1)) * 100 + '%' }} />
      <div style={s("display:flex;justify-content:space-between;font:600 9.5px/1 'Archivo';color:var(--label);margin-top:4px")}><span>{fmt(min).split(' ·')[0]}</span><span>{fmt(max).split(' ·')[0]}</span></div>
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
  const R = cfg.reveal;
  const md = R.media?.src ? R.media : null;
  const im = md && md.kind === 'image' ? { src: md.src, w: md.w || 1600, h: md.h || 1000 } : cfg.event.heroImage;
  return (
    <button onClick={skip} aria-label="Skip reveal" style={s('position:absolute;inset:0;z-index:70;background:var(--hero-deep);overflow:hidden;display:block;text-align:left;cursor:pointer;animation:evRevealOut .5s ease 3.8s both')}>
      <div style={s('position:absolute;inset:0;background:radial-gradient(70% 45% at 50% 52%,rgba(var(--acc-rgb),.45),transparent 70%);animation:evGlow 3.2s ease both')} />
      <div style={{ ...s('position:absolute;left:50%;top:50%;width:150%;transform:translate(-50%,-46%)'), aspectRatio: `${im.w}/${im.h}` }}>
        {md?.kind === 'video'
          ? <video src={asset(md.src)} autoPlay muted playsInline loop style={s('position:absolute;inset:0;width:100%;height:100%;object-fit:cover;animation:evCar 3.4s cubic-bezier(.2,.7,.2,1) both')} />
          : im.src && <img src={asset(im.src)} alt={R.title} style={s('position:absolute;inset:0;width:100%;height:100%;object-fit:cover;animation:evCar 3.4s cubic-bezier(.2,.7,.2,1) both')} />}
      </div>
      <div style={s('position:absolute;inset:0;background:linear-gradient(180deg,var(--hero-deep) 0%,var(--hero-deep) 33%,rgba(var(--hero-deep-rgb),0) 47%,rgba(var(--hero-deep-rgb),0) 64%,var(--hero-deep) 90%)')} />
      <div style={s('position:absolute;top:0;bottom:0;left:-60%;width:50%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.28),transparent);transform:skewX(-14deg);animation:evLight 1.5s cubic-bezier(.3,.7,.3,1) 1.2s both')} />
      <div style={s('position:absolute;left:0;right:0;top:15%;text-align:center;padding:0 16px')}>
        {R.logo && <img src={asset(R.logo)} alt="" style={s('width:46px;height:46px;object-fit:contain;display:block;margin:0 auto 14px;animation:evText .8s cubic-bezier(.2,.85,.2,1) .2s both')} />}
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
.ev-range{-webkit-appearance:none;appearance:none;height:6px;background:linear-gradient(90deg,var(--acc) var(--p),var(--sand2) var(--p));outline:none}
.ev-range::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 0 0 3px var(--acc),0 2px 6px rgba(0,0,0,.25);cursor:pointer}
.ev-range::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:#fff;border:3px solid var(--acc);cursor:pointer}
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
