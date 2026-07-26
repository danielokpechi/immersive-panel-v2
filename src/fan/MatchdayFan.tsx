// ═══════════════════════════════════════════════════════════════════════
// MatchdayFan — faithful React port of the "Matchday Companion v4" handoff.
// A mobile web panel (Man City v Real Madrid, CL semi 2nd leg) across four
// operator-driven states (PRE/LIVE/HT/FT) and eleven screens, themed light+
// dark via CSS variables, broadcast aesthetic (Anton, score bug, lower
// thirds). Image slots are filled with the reused City media.
// ═══════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import { s } from '../admin/s';
import { mediaFor } from './mediaSlots';
import { media } from '../domain/media';

const Ms = ({ children, size = 18, color, style }: { children: string; size?: number; color?: string; style?: CSSProperties }) => (
  <span className="ms" style={{ fontSize: size, color, ...style }}>{children}</span>
);

// Real club crest, on a white disc so it reads on any club-colour ground.
const CREST: Record<string, string> = { city: media.cityBadge, madrid: media.madridBadge };
const Badge = ({ club, size = 38, bare = false }: { club: 'city' | 'madrid'; size?: number; bare?: boolean }) => (
  bare
    ? <img src={CREST[club]} alt="" style={{ width: size, height: size, objectFit: 'contain', flex: 'none' }} />
    : <span style={{ width: size, height: size, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flex: 'none', boxShadow: '0 1px 3px rgba(16,14,10,.18)' }}>
        <img src={CREST[club]} alt="" style={{ width: Math.round(size * 0.76), height: Math.round(size * 0.76), objectFit: 'contain' }} />
      </span>
);
function Slot({ id, label }: { id: string; label: string }) {
  const src = mediaFor(id);
  if (src) return <img src={src} alt={label} loading="lazy" style={s('position:absolute;inset:0;width:100%;height:100%;object-fit:cover')} />;
  return <span style={s("position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:800 8.5px/1 'Archivo';letter-spacing:.14em;color:var(--label)")}>{label}</span>;
}

// data ported from the handoff
const POOL = [
  { user: 'MARCUS_92', text: 'Etihad is loud tonight. Genuinely loud.', t: 'h', tag: 'BLOCK 108' },
  { user: 'DECLAN_K', text: 'Rodri back in the middle changes everything', t: 's', tag: 'SOUTH STAND' },
  { user: 'BLOCK112', text: 'Anyone else in 112 — we standing for the anthem?', t: 'h', tag: 'BLOCK 112' },
  { user: 'PRIYA_S', text: 'Foden on the left again? Interesting call', t: 'h', tag: 'BLOCK 231' },
  { user: 'TOMMY', text: 'First goal wins this. Watch.', t: 'n', tag: 'AT HOME' },
  { user: 'JEAN_84', text: 'Twenty-two years in the South Stand and this is the loudest', t: 's', tag: 'SOUTH STAND' },
  { user: 'HANNAH_M', text: 'The noise when that hit the net. Chills.', t: 'h', tag: 'BLOCK 108' },
  { user: 'GAZ', text: 'Pie ordered to my seat. Living in the future.', t: 'h', tag: 'BLOCK 112' },
  { user: 'STEVO', text: 'That was a foul. Every single time.', t: 's', tag: 'SOUTH STAND' },
  { user: 'NEUTRAL_JO', text: 'Watching from the pub, no dog in this fight', t: 'n', tag: 'AT HOME' },
  { user: 'AMARA_K', text: 'Keep the ball. Just keep the ball.', t: 'h', tag: 'BLOCK 231' },
  { user: 'DAVE_SB', text: 'Season ticket since 98 and I still cannot watch these', t: 's', tag: 'SEASON TICKETS' },
  { user: 'RAJ', text: 'Their keeper has been the best player on the pitch', t: 'n', tag: 'AT HOME' },
  { user: 'LUCY_C', text: 'Twenty more minutes like that and we are in Munich', t: 'h', tag: 'BLOCK 112' },
];
const TEAM: Record<string, { bg: string; fg: string }> = { h: { bg: '#6CABDD', fg: '#fff' }, s: { bg: '#0C3A5E', fg: '#fff' }, n: { bg: '#C3B69A', fg: '#100E0A' } };
const EV: Record<string, { icon: string; color: string }> = {
  GOAL: { icon: 'sports_soccer', color: '#6CABDD' }, YELLOW: { icon: '', color: '#F4C400' }, 'RED CARD': { icon: '', color: '#D6202A' },
  'VAR CHECK': { icon: 'videocam', color: '#6CABDD' }, 'NO PENALTY': { icon: 'gavel', color: '#F4F0E6' }, PENALTY: { icon: 'gavel', color: '#6CABDD' },
  SUBSTITUTION: { icon: 'swap_vert', color: '#F4F0E6' }, 'DRINKS BREAK': { icon: 'local_drink', color: '#9A9381' }, CHANCE: { icon: 'crisis_alert', color: '#9A9381' },
};
const ARTICLES = [
  { kicker: 'TACTICAL READ', title: 'Why City keep the line high, and what it costs them', meta: 'Sam Whitfield · 6 min read', slot: 'read-1', body: ['City have not dropped their defensive line below the halfway mark in a home European tie since November. It is a deliberate bet: squeeze the game into forty metres, win the ball back inside six seconds, and make the opposition defend a full half.', 'Madrid are the one side left in the competition built to punish it. Six of their goals in this campaign have come from counters starting inside their own half, and every one of them went through the left channel.', 'The compromise both managers are making tonight is the same, from opposite directions: City accept two clear chances against to create six, Madrid accept sixty minutes without the ball to get those two.', 'Watch the first fifteen minutes. If City press and Madrid clear long twice in a row, the game will be played in one half all night.'] },
  { kicker: 'PLAYER FOCUS', title: 'The Rodri effect, in one number: 71%', meta: 'Priya Anand · 4 min read', slot: 'read-2', body: ['City win 71% of matches Rodri starts and completes. Without him on the pitch for the full ninety, that figure falls to 54% across three seasons.', 'It is not tackles. It is the tempo he sets when City are ahead — the pass count in the fifteen minutes after a City goal rises by a fifth when he is on.', 'He is also one booking from missing a final. Everything about tonight for him is a calculation.'] },
  { kicker: 'AWAY VIEW', title: 'What Madrid fans actually expect tonight', meta: 'Elena Ruiz · 5 min read', slot: 'read-3', body: ['Ask the away end and nobody predicts a comfortable night. They predict a late one. That is not bravado — it is a pattern half of Madrid’s goals this season have come after the seventieth minute.', 'The travelling support has learned to treat the first hour as something to survive. They will sing through it either way.', 'If the tie is level at eighty minutes, every Madrid fan in this stadium will believe. History has earned them that.'] },
  { kicker: 'THE NUMBERS', title: 'First goal, first leg, and the aggregate maths', meta: 'Data desk · 3 min read', slot: 'read-4', body: ['City lead 2–1 from the first leg. A 0–0 tonight sends them through; a single Madrid goal without reply forces extra time.', 'Nine of City’s last ten home wins have followed them scoring first, and they have won all nine.', 'Madrid have conceded the opening goal only twice in the competition. Both times they came back to draw.'] },
];

interface FSt {
  route: string; ms: string; hs: number; as: number; n: number; rollY: number;
  event: { kind: string; who: string; minute: number; note: string; team: string; side: string } | null;
  xp: number; tick: number; iris: boolean; irisTyping: boolean; irisDraft: string;
  thread: { me: boolean; text: string; stat?: string; statLabel?: string }[];
  chat: { id: string; user: string; text: string; t: string; tag: string; me?: boolean; time: string; likes: number; ev?: { kind: string; color: string; detail?: string; minute?: number } }[];
  draft: string; room: string; likes: Record<string, boolean>; votes: Record<string, string>;
  flash: { title: string; sub: string } | null;
  pred: { h: number; a: number; s: string; done: boolean };
  size: string; basket: { name: string; price: number }[]; ordered: boolean;
  food: Record<string, number>; foodPlaced: boolean; foodEta: number;
  photos: number; reels: Record<string, string | boolean>; read: number | null;
  routeOn: boolean; prefs: Record<string, boolean>; theme: string; quests: Record<string, boolean>;
  toast: string | null; toastXp: string;
}
const money = (n: number) => '£' + n.toFixed(2);
const pad = (n: number) => String(n).padStart(2, '0');

export function MatchdayFan() {
  const [st, setSt] = useState<FSt>(() => ({
    route: 'home', ms: 'pre', hs: 0, as: 0, n: 6, rollY: 0, event: null, xp: 1240, tick: 0,
    iris: false, irisTyping: false, irisDraft: '',
    thread: [{ me: false, text: 'I’m IRIS. Tonight’s briefing is already written — ask me anything from it, or open the full intel.' }],
    chat: POOL.slice(0, 7).map((m, i) => ({ ...m, id: 's' + i, time: '20:' + pad(11 + i * 3), likes: 1 + (i % 4) })),
    draft: '', room: 'ALL FANS', likes: {}, votes: {}, pred: { h: 2, a: 1, s: 'Haaland', done: false },
    size: 'M', basket: [], ordered: false, food: {}, foodPlaced: false, foodEta: 6,
    photos: 9, reels: {}, read: null, flash: null, routeOn: false, prefs: { goals: true, ht: true, rewards: false }, theme: 'light', quests: {}, toast: null, toastXp: '',
  }));
  const set = (patch: Partial<FSt> | ((s: FSt) => Partial<FSt>)) => setSt((sPrev) => ({ ...sPrev, ...(typeof patch === 'function' ? patch(sPrev) : patch) }));
  const timers = useRef<{ toast?: number; ev?: number; iris?: number; varT?: number; roll?: number; food?: number; flash?: number }>({});
  const { id = 'demo' } = useParams();

  // chat arrival + clock
  useEffect(() => {
    const ci = window.setInterval(() => {
      setSt((sPrev) => {
        const m = POOL[sPrev.n % POOL.length];
        return { ...sPrev, n: sPrev.n + 1, rollY: 30, chat: [...sPrev.chat, { ...m, id: 'a' + sPrev.n, time: '20:' + pad((11 + sPrev.n * 3) % 60), likes: 0 }].slice(-40) };
      });
      timers.current.roll = window.setTimeout(() => set({ rollY: 0 }), 30);
    }, 3400);
    const tk = window.setInterval(() => set((sp) => ({ tick: sp.tick + 1 })), 1000);
    return () => { window.clearInterval(ci); window.clearInterval(tk); window.clearInterval(timers.current.food); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // theme
  useEffect(() => {
    const root = document.documentElement;
    if (st.theme === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', st.theme);
    return () => root.removeAttribute('data-theme');
  }, [st.theme]);

  // pin chat + iris threads to bottom
  const chatRef = useRef<HTMLDivElement>(null);
  const irisRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [st.chat.length, st.room, st.route]);
  useEffect(() => { if (irisRef.current) irisRef.current.scrollTop = irisRef.current.scrollHeight; }, [st.thread.length, st.iris]);

  const award = (xp: number, label: string, quest?: string) => {
    window.clearTimeout(timers.current.toast);
    set((sp) => ({ xp: sp.xp + xp, toast: label, toastXp: '+' + xp, quests: quest ? { ...sp.quests, [quest]: true } : sp.quests }));
    timers.current.toast = window.setTimeout(() => set({ toast: null }), 2400);
  };
  const fire = (kind: string, who: string, minute: number, note: string, team: string, side: string, hold?: boolean) => {
    window.clearTimeout(timers.current.ev);
    const evId = 'ev' + Date.now();
    set((sp) => ({
      event: { kind, who, minute, note, team, side },
      hs: kind === 'GOAL' && side === 'h' ? sp.hs + 1 : sp.hs,
      as: kind === 'GOAL' && side === 'a' ? sp.as + 1 : sp.as,
      // Match moments drop into the chat feed as a transient card…
      chat: [...sp.chat, { id: evId, user: '', text: who, t: 'n', tag: '', time: '', likes: 0, ev: { kind, color: EV[kind]?.color || '#6CABDD', detail: note, minute } }].slice(-40),
    }));
    if (!hold) timers.current.ev = window.setTimeout(() => set({ event: null }), 4600);
    // …then they clear themselves out of the chat.
    window.setTimeout(() => set((sp) => ({ chat: sp.chat.filter((m) => m.id !== evId) })), 8500);
    // A goal triggers a dismissible flash drop in the shop.
    if (kind === 'GOAL') {
      window.clearTimeout(timers.current.flash);
      set({ flash: { title: '20% off the Haaland home shirt', sub: 'Goal drop · collect at Gate 4 on the way out' } });
      timers.current.flash = window.setTimeout(() => set({ flash: null }), 15000);
    }
  };
  const varCheck = () => {
    const min = st.ms === 'live' ? 38 : 71;
    fire('VAR CHECK', 'Possible handball', min, 'Referee reviewing — Rodri, City penalty area', 'REAL MADRID APPEAL', 'a', true);
    window.clearTimeout(timers.current.varT);
    timers.current.varT = window.setTimeout(() => fire('NO PENALTY', 'Ball struck the shoulder', min, 'On-field decision stands · play restarts with a City free-kick', 'VAR DECISION', 'a'), 3600);
  };
  // Shared operator actions — used by the local demo strip AND by the control
  // room over the realtime bus, so an operator drives this exact fan client.
  const applyState = (m: string) => {
    if (m === 'pre') set({ ms: 'pre', route: 'home', event: null, hs: 0, as: 0 });
    else if (m === 'live') { set({ ms: 'live', route: 'home', hs: 0, as: 0 }); fire('GOAL', 'Haaland', 23, 'Assist De Bruyne · xG 0.34', 'MAN CITY', 'h'); }
    else if (m === 'ht') set({ ms: 'ht', route: 'home', event: null, hs: 1, as: 1 });
    else if (m === 'ft') set({ ms: 'ft', route: 'home', event: null, hs: 2, as: 1 });
  };
  const applyEventCmd = (kind: string) => {
    // Events fire in place (the lower-third shows on every screen) so a moment
    // in the game surfaces right where the fan is — including in the chat.
    if (kind === 'goal') { if (st.ms === 'pre') set({ ms: 'live', route: 'home', hs: 0, as: 0 }); fire('GOAL', 'Foden', 71, 'Assist Haaland · xG 0.19', 'MAN CITY', 'h'); }
    else if (kind === 'card') fire('YELLOW', 'Camavinga', 31, 'Late on Foden · second booking of the tie', 'REAL MADRID', 'a');
    else if (kind === 'red') fire('RED CARD', 'Camavinga', 64, 'Second yellow · Madrid down to ten', 'REAL MADRID', 'a');
    else if (kind === 'var') varCheck();
    else if (kind === 'sub') fire('SUBSTITUTION', 'Doku on', 68, 'Grealish off · 68 minutes played, 3 chances created', 'MAN CITY', 'h');
    else if (kind === 'drinks') fire('DRINKS BREAK', 'Two minutes', 33, 'Referee has paused play — 26°C at kick-off', 'HYDRATION', 'n');
  };
  // Follow the control room: apply commands from the panel's channel. Ref keeps
  // the listener bound to fresh closures without re-subscribing every render.
  const busRef = useRef<(m: { cmd: string; ms?: string; kind?: string }) => void>(() => {});
  busRef.current = (m) => { if (!m) return; if (m.cmd === 'state' && m.ms) applyState(m.ms); else if (m.cmd === 'event' && m.kind) applyEventCmd(m.kind); };
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const ch = new BroadcastChannel('panel:' + id);
    ch.onmessage = (e) => busRef.current(e.data);
    return () => ch.close();
  }, [id]);
  const ask = (q: string, a: string, stat?: string, statLabel?: string) => {
    window.clearTimeout(timers.current.iris);
    set((sp) => ({ iris: true, irisTyping: true, irisDraft: '', thread: [...sp.thread, { me: true, text: q }] }));
    timers.current.iris = window.setTimeout(() => set((sp) => ({ irisTyping: false, thread: [...sp.thread, { me: false, text: a, stat, statLabel }] })), 750);
  };
  const post = (text: string) => {
    if (!text.trim()) return;
    set((sp) => ({ draft: '', chat: [...sp.chat, { id: 'me' + Date.now(), user: 'YOU', text: text.trim(), t: 'h', tag: 'BLOCK 112', me: true, time: '20:' + pad((44 + sp.n) % 60), likes: 0 }] }));
    award(2, 'MESSAGE POSTED', 'chat');
  };
  const go = (r: string) => () => set({ route: r, iris: false, read: null });

  // ── derived ──
  const { ms } = st;
  const pre = ms === 'pre', live = ms === 'live', ht = ms === 'ht', ft = ms === 'ft';
  const minute = live ? 38 : ht ? 45 : 90;
  const cd = Math.max(3 * 3600 + 16 * 60 + 40 - st.tick, 0);
  const filled = Math.round(Math.min(st.xp / 2000, 1) * 20);

  const evs: [number, string, string, string, string][] = live ? [
    [36, 'VAR CHECK', 'Possible handball', 'a', 'No penalty — ball struck the shoulder'], [33, 'DRINKS BREAK', 'Two minutes', 'n', '26°C at kick-off'],
    [31, 'YELLOW', 'Camavinga', 'a', 'Late on Foden'], [23, 'GOAL', 'Haaland', 'h', 'Assist De Bruyne · xG 0.34'],
  ] : ht ? [
    [45, 'GOAL', 'Vinícius Júnior', 'a', 'Counter from a City corner'], [41, 'SUBSTITUTION', 'Doku on', 'h', 'Grealish off — hamstring'],
    [38, 'YELLOW', 'Rodri', 'h', 'One booking from a final ban'], [33, 'DRINKS BREAK', 'Two minutes', 'n', '26°C at kick-off'], [23, 'GOAL', 'Haaland', 'h', 'Assist De Bruyne · xG 0.34'],
  ] : [
    [71, 'GOAL', 'Foden', 'h', 'Assist Haaland · xG 0.19'], [68, 'SUBSTITUTION', 'Doku on', 'h', 'Grealish off — 3 chances created'], [64, 'RED CARD', 'Camavinga', 'a', 'Second yellow · Madrid down to ten'],
    [58, 'GOAL', 'Vinícius Júnior', 'a', 'VAR checked for offside — goal stands'], [36, 'VAR CHECK', 'Possible handball', 'a', 'No penalty given'], [23, 'GOAL', 'Haaland', 'h', 'Assist De Bruyne · xG 0.34'],
  ];
  const timeline = evs.map(([min, kind, who, side, detail]) => ({
    min, kind, who, detail, isCard: kind === 'YELLOW' || kind === 'RED CARD', cardColor: kind === 'RED CARD' ? '#D6202A' : '#F4C400',
    hasIcon: !!(EV[kind] && EV[kind].icon), icon: EV[kind]?.icon || '', iconColor: kind === 'GOAL' ? '#6CABDD' : 'var(--label)',
    bg: kind === 'GOAL' ? '#6CABDD' : kind === 'RED CARD' ? '#D6202A' : kind === 'YELLOW' ? '#F4C400' : 'var(--sand2)',
    fg: kind === 'GOAL' || kind === 'RED CARD' ? '#fff' : 'var(--ink)', tc: side === 'h' ? '#6CABDD' : side === 'a' ? '#00529F' : 'var(--sand2)',
  }));

  const shown = st.chat;
  const previewMsgs = st.chat.filter((m) => !m.ev).slice(-5).map((m) => ({ user: m.me ? 'YOU' : m.user, text: m.text, initials: m.me ? 'YO' : m.user.slice(0, 2), avBg: TEAM[m.t].bg, avFg: TEAM[m.t].fg }));

  const statusLabel = pre ? '20:00' : live ? minute + "'" : ht ? 'HT' : 'FT';
  const titles: Record<string, string> = { chat: 'FAN CHAT', intel: 'MATCH INTEL', pred: 'PREDICTIONS', polls: 'FAN POLLS', shop: 'CITY STORE', food: 'ORDER FOOD', photos: 'PHOTO POOL', reactions: 'FAN REACTIONS', reads: 'READS', seat: 'YOUR SEAT', profile: 'YOUR PROFILE' };
  const metas: Record<string, string> = { chat: (298 + (st.n % 40)) + ' TALKING NOW', intel: 'PREPARED BY IRIS', pred: pre ? 'CLOSES AT KICK-OFF' : 'LOCKED', polls: '40 XP PER VOTE', shop: 'COLLECT AT GATE 4', food: 'DELIVERS TO 112–J', photos: '25 XP PER PHOTO', reactions: '3 NEW REELS', reads: '4 PIECES TONIGHT', seat: 'SOUTH STAND', profile: 'SEASON TICKET' };
  const isHome = st.route === 'home', isSub = st.route !== 'home';

  const opBtn = (label: string, onClick: () => void, bg: string, color: string) => (
    <button onClick={onClick} style={{ ...s("font:800 10px/1 'Archivo';letter-spacing:.1em;padding:8px 10px"), background: bg, color }}>{label}</button>
  );

  // Embed mode (control-room monitor iframe): fill the frame, no operator strip / bezel.
  const embed = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('embed') === '1';
  const wrapStyle = embed ? s('height:100%;background:var(--ground)') : s('min-height:100vh;background:var(--desk);display:flex;justify-content:center;padding:28px 16px 40px');
  const colStyle = embed ? s('height:100%') : s('display:flex;flex-direction:column;gap:12px');
  const phoneStyle = embed ? s('position:relative;width:100%;height:100vh;background:var(--ground);overflow:hidden') : s('position:relative;width:393px;height:844px;background:var(--ground);border-radius:44px;overflow:hidden;box-shadow:0 2px 2px rgba(16,14,10,.06),0 26px 56px -18px rgba(16,14,10,.4),0 0 0 9px #100E0A,0 0 0 10px #2b2822');

  return (
    <div style={wrapStyle}>
      <style>{FAN_CSS}</style>
      <div style={colStyle}>
        {!embed && (<>
        {/* operator strip (demo) */}
        <div style={{ ...s('display:flex;align-items:center;gap:8px;width:393px;padding:9px 10px'), background: 'var(--panel)' }}>
          <span style={s("font:800 10px/1 'Archivo';letter-spacing:.18em;color:#A39A85;padding-left:4px")}>OPERATOR</span>
          <div style={s('display:flex;gap:4px;margin-left:auto')}>
            {opBtn('PRE', () => applyState('pre'), 'rgba(242,237,227,.12)', 'var(--on-panel)')}
            {opBtn('LIVE', () => applyState('live'), 'rgba(242,237,227,.12)', 'var(--on-panel)')}
            {opBtn('HT', () => applyState('ht'), 'rgba(242,237,227,.12)', 'var(--on-panel)')}
            {opBtn('FT', () => applyState('ft'), 'rgba(242,237,227,.12)', 'var(--on-panel)')}
            {opBtn('CARD', () => applyEventCmd('card'), '#F4C400', 'var(--ink)')}
            {opBtn('GOAL', () => applyEventCmd('goal'), '#6CABDD', '#fff')}
          </div>
        </div>
        <div style={{ ...s('display:flex;align-items:center;gap:8px;width:393px;padding:9px 10px'), background: 'var(--chrome)' }}>
          <span style={s("font:800 10px/1 'Archivo';letter-spacing:.18em;color:#9A9381;padding-left:4px")}>EVENTS</span>
          <div style={s('display:flex;gap:4px;margin-left:auto')}>
            {opBtn('VAR', () => applyEventCmd('var'), 'rgba(242,237,227,.12)', '#F2EDE3')}
            {opBtn('SUB', () => applyEventCmd('sub'), 'rgba(242,237,227,.12)', '#F2EDE3')}
            {opBtn('DRINKS', () => applyEventCmd('drinks'), 'rgba(242,237,227,.12)', '#F2EDE3')}
            {opBtn('RED', () => applyEventCmd('red'), '#D6202A', '#fff')}
          </div>
        </div>
        </>)}

        {/* PHONE */}
        <div style={phoneStyle}>
          {/* status bar */}
          <div style={s("position:absolute;top:0;left:0;right:0;height:46px;z-index:50;display:flex;align-items:flex-end;justify-content:space-between;padding:0 26px 4px;font:700 12.5px/1 'Archivo';color:var(--on-panel);background:var(--panel)")}>
            <span>20:44</span>
            <div style={s('display:flex;align-items:center;gap:5px')}><span style={s('width:15px;height:8px;border:1.4px solid #F2EDE3;border-radius:2px;display:inline-block')} /><span style={s("font:700 10px/1 'Archivo';letter-spacing:.06em")}>5G</span></div>
          </div>

          <div style={s('position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;padding-top:46px;padding-bottom:56px')}>
            {/* event lower-third */}
            {st.event && (() => { const e = st.event!; const color = EV[e.kind]?.color || '#6CABDD'; const isCard = e.kind === 'YELLOW' || e.kind === 'RED CARD'; const hasIcon = !!EV[e.kind]?.icon; return (
              <div style={s('position:sticky;top:0;z-index:45;overflow:hidden')}>
                <div style={s('animation:bgThird 4.6s cubic-bezier(.18,.9,.2,1) both;display:flex;align-items:stretch;background:var(--panel)')}>
                  <div style={{ ...s('width:14px;transform:skewX(-8deg) translateX(-3px)'), background: color }} />
                  <div style={s('flex:1;padding:14px 4px 16px 8px;min-width:0')}>
                    <div style={s('display:flex;align-items:center;gap:8px')}>
                      {isCard && <span style={{ ...s('width:13px;height:18px;border-radius:2px;display:inline-block'), background: color }} />}
                      {hasIcon && <Ms size={17} color={color}>{EV[e.kind].icon}</Ms>}
                      <span style={{ ...s("font:800 15px/1 'Archivo Black';letter-spacing:.14em"), color }}>{e.kind}</span>
                      <span style={s("font:700 11px/1 'Archivo';letter-spacing:.1em;color:#A39A85")}>{e.minute}′ · {e.team}</span>
                    </div>
                    <div style={s("font:800 40px/.86 'Archivo Black';letter-spacing:.008em;color:var(--on-panel);margin-top:9px")}>{e.who}</div>
                    <div style={s("font:500 11.5px/1.3 'Archivo';color:#A39A85;margin-top:7px")}>{e.note}</div>
                  </div>
                  {e.kind === 'GOAL' && <div style={s("display:flex;align-items:center;padding:0 18px 0 6px;font:800 50px/.8 'Archivo Black';color:var(--on-panel);font-variant-numeric:tabular-nums")}>{st.hs}–{st.as}</div>}
                </div>
              </div>
            ); })()}

            {/* score bug + header */}
            <div style={s('position:sticky;top:0;z-index:40;background:var(--panel)')}>
              <div style={s('display:flex;align-items:stretch;height:44px')}>
                {isSub && <button onClick={go('home')} className="fh" style={s("display:flex;align-items:center;gap:6px;padding:0 10px 0 15px;font:800 10px/1 'Archivo';letter-spacing:.14em;color:#A39A85")}><Ms size={15} color="inherit">arrow_back</Ms>HOME</button>}
                <div style={s('display:flex;align-items:center;flex:1;min-width:0;padding-left:14px')}>
                  <Badge club="city" size={22} bare />
                  <span style={s("font:800 15px/1 'Archivo';letter-spacing:.08em;color:var(--on-panel);padding:0 8px 0 8px")}>MCI</span>
                  <span style={s("font:800 19px/1 'Archivo';color:var(--on-panel);font-variant-numeric:tabular-nums")}>{st.hs}</span>
                  <span style={s("font:700 13px/1 'Archivo';color:var(--label);padding:0 6px")}>–</span>
                  <span style={s("font:800 19px/1 'Archivo';color:var(--on-panel);font-variant-numeric:tabular-nums")}>{st.as}</span>
                  <span style={s("font:800 15px/1 'Archivo';letter-spacing:.08em;color:var(--on-panel);padding:0 8px 0 8px")}>RMA</span>
                  <Badge club="madrid" size={22} bare />
                </div>
                <div style={{ ...s('display:flex;align-items:center;gap:6px;padding:0 12px'), background: live ? '#D6202A' : '#3A352A' }}>
                  {live && <span style={s('width:6px;height:6px;border-radius:50%;background:#fff;animation:bgBlink 1.6s steps(1,end) infinite')} />}
                  <span style={s("font:800 12px/1 'Archivo';letter-spacing:.08em;color:var(--on-panel);font-variant-numeric:tabular-nums")}>{statusLabel}</span>
                </div>
                <button onClick={() => set((x) => ({ theme: x.theme === 'auto' ? 'light' : x.theme === 'light' ? 'dark' : 'auto' }))} className="fh2" style={s('display:flex;align-items:center;padding:0 9px;background:var(--chrome)')}><Ms size={17} color="#A39A85">{st.theme === 'dark' ? 'dark_mode' : st.theme === 'light' ? 'light_mode' : 'brightness_auto'}</Ms></button>
                <button onClick={go('profile')} className="fh2" style={s('display:flex;align-items:center;padding:0 12px 0 9px;background:var(--chrome)')}><span style={s("width:26px;height:26px;border-radius:50%;background:#6CABDD;display:flex;align-items:center;justify-content:center;font:800 9.5px/1 'Archivo';color:#fff")}>AJ</span></button>
              </div>
              {isHome && (
                <div style={s('display:flex;overflow:hidden;height:26px;background:var(--chrome);align-items:center')}>
                  <div style={s('display:flex;white-space:nowrap;animation:bgTicker 34s linear infinite')}>
                    {[0, 1].map((k) => <span key={k} style={s("font:700 10.5px/1 'Archivo';letter-spacing:.1em;color:#C4BCA6")}>{`  CHAMPIONS LEAGUE SEMI-FINALS  ·  INT 2 – 2 BAY  FT (BAY WIN 4–3 AGG)  ·  AGGREGATE HERE: MCI ${st.hs + 2} – ${st.as + 2} RMA  ·  FINAL: 31 MAY, MUNICH  ·  ATTENDANCE 52,900  ·  REFEREE: F. LETEXIER  ·`}</span>)}
                  </div>
                </div>
              )}
              {isSub && (
                <div style={s('display:flex;align-items:center;gap:8px;height:34px;padding:0 15px;background:var(--chrome)')}>
                  <span style={s("font:800 17px/1 'Archivo Black';letter-spacing:.06em;color:var(--on-panel)")}>{titles[st.route]}</span>
                  <span style={s("font:700 9px/1 'Archivo';letter-spacing:.12em;color:#A39A85;margin-left:auto")}>{metas[st.route]}</span>
                </div>
              )}
            </div>

            {/* ROUTES */}
            {isHome && <Home {...{ st, pre, live, ht, ft, timeline, previewMsgs, filled, cd, go, award, set }} />}
            {st.route === 'chat' && <Chat {...{ st, shown, set, post, chatRef }} />}
            {st.route === 'intel' && <Intel {...{ pre, live, ht, openIris: () => set({ iris: true }) }} />}
            {st.route === 'pred' && <Predictions {...{ st, set, award }} />}
            {st.route === 'polls' && <Polls {...{ st, ft, set, award }} />}
            {st.route === 'shop' && <Shop {...{ st, set, award }} />}
            {st.route === 'food' && <Food {...{ st, set, award, timers }} />}
            {st.route === 'photos' && <Photos {...{ st, award, set }} />}
            {st.route === 'reactions' && <Reactions {...{ st, set }} />}
            {st.route === 'reads' && <Reads {...{ st, set }} />}
            {st.route === 'seat' && <Seat {...{ st, set, go }} />}
            {st.route === 'profile' && <Profile {...{ st, filled, set, go }} />}
          </div>

          {/* FLASH SALE — pops on a goal, dismissible */}
          {st.flash && (
            <div style={s('position:absolute;top:122px;left:10px;right:10px;z-index:48;animation:bgRise .32s cubic-bezier(.18,.9,.2,1) both')}>
              <div style={s('display:flex;align-items:center;gap:11px;padding:11px 11px 11px 13px;background:var(--panel);border-radius:14px;box-shadow:0 14px 34px -8px rgba(16,14,10,.55)')}>
                <span style={s('width:36px;height:36px;flex:none;border-radius:10px;background:#6CABDD;display:flex;align-items:center;justify-content:center')}><Ms size={20} color="#fff">local_offer</Ms></span>
                <button onClick={() => set({ route: 'shop', flash: null })} style={s('flex:1;min-width:0;text-align:left')}>
                  <div style={s("font:800 8.5px/1 'Archivo';letter-spacing:.14em;color:#6CABDD")}>FLASH DROP · LIMITED</div>
                  <div style={s("font:700 13px/1.25 'Archivo';color:var(--on-panel);margin-top:5px")}>{st.flash.title}</div>
                  <div style={s("font:500 10.5px/1.3 'Archivo';color:#A39A85;margin-top:3px")}>{st.flash.sub}</div>
                </button>
                <button onClick={() => set({ flash: null })} style={s('width:28px;height:28px;flex:none;border-radius:50%;background:rgba(242,237,227,.12);display:flex;align-items:center;justify-content:center')}><Ms size={16} color="#A39A85">close</Ms></button>
              </div>
            </div>
          )}

          {/* IRIS */}
          {!st.iris && (
            <button onClick={() => set({ iris: true })} className="fh2" style={s('position:absolute;right:0;bottom:96px;z-index:46;display:flex;align-items:center;gap:8px;padding:11px 13px 11px 12px;background:var(--panel);border-radius:3px 0 0 3px')}>
              <span style={s('width:7px;height:7px;background:#6CABDD;animation:bgDot 1.6s ease-in-out infinite')} />
              <span style={s("font:800 10.5px/1 'Archivo';letter-spacing:.16em;color:var(--on-panel)")}>ASK IRIS</span>
            </button>
          )}
          {st.iris && <Iris {...{ st, pre, live, ht, set, ask, irisRef, go }} />}

          {st.toast && (
            <div style={s('position:absolute;left:0;right:0;bottom:64px;z-index:55;display:flex;justify-content:center;pointer-events:none')}>
              <div style={s('display:flex;align-items:center;gap:9px;padding:11px 15px;background:var(--panel);animation:bgToast 2.4s ease both')}>
                <span style={s("font:800 17px/1 'Archivo Black';color:#6CABDD")}>{st.toastXp}</span>
                <span style={s("font:700 11.5px/1 'Archivo';letter-spacing:.06em;color:var(--on-panel)")}>{st.toast}</span>
              </div>
            </div>
          )}

          <div style={s('position:absolute;bottom:0;left:0;right:0;height:52px;z-index:40;display:flex;align-items:center;justify-content:center;padding:0 20px 12px;background:linear-gradient(transparent,var(--ground) 44%)')}>
            <div style={s("display:flex;align-items:center;gap:8px;padding:9px 15px;background:var(--sand);border-radius:100px;font:600 11.5px/1 'Archivo';color:var(--body)")}><Ms size={13} color="var(--label)">lock</Ms>matchday.mancity.com</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════ HOME ═══════════
type HP = { st: FSt; pre: boolean; live: boolean; ht: boolean; ft: boolean; timeline: ReturnType<typeof Object>[] | any[]; previewMsgs: any[]; filled: number; cd: number; go: (r: string) => () => void; award: (x: number, l: string, q?: string) => void; set: (p: any) => void };
function Home({ st, pre, live, ht, ft, timeline, previewMsgs, filled, cd, go }: HP) {
  const liveish = live || ht;
  const label = (t: string) => <div style={s("font:800 9.5px/1 'Archivo';letter-spacing:.18em;color:var(--label)")}>{t}</div>;
  const sections = [
    { t: 'Predictions', tag: pre ? '2 OPEN' : 'LOCKED', d: 'Call the score and first scorer. 120 XP if you nail both.', icon: 'scoreboard', go: go('pred') },
    { t: 'Polls', tag: 'LIVE', d: 'Two questions open. 40 XP a vote, results update live.', icon: 'bar_chart', go: go('polls') },
    { t: 'Reads', tag: '4 NEW', d: 'Tactical read, the Rodri number, and the away view.', icon: 'article', go: go('reads') },
    { t: 'City store', tag: 'MATCH DROP', d: 'Tonight-only shirt print, collected on the way out.', icon: 'shopping_bag', go: go('shop') },
    { t: 'Your seat', tag: '112–J', d: 'Block plan, nearest kiosk, and the walk back out.', icon: 'event_seat', go: go('seat') },
    { t: 'Your profile', tag: 'TIER 2', d: 'XP, rewards claimed, your photos and alerts.', icon: 'account_circle', go: go('profile') },
    ...(!pre ? [
      { t: 'Order food', tag: 'TO SEAT', d: 'Delivered to 112–J. Skip the half-time queue entirely.', icon: 'restaurant', go: go('food') },
      { t: 'Photo pool', tag: '1,204', d: 'Everyone’s photos in one place. Add yours for 25 XP.', icon: 'photo_library', go: go('photos') },
      { t: 'Fan reactions', tag: '3 REELS', d: 'Thirty-second videos from the stands. Tap to play.', icon: 'play_circle', go: go('reactions') },
    ] : []),
  ];
  const formH = ['W', 'W', 'D', 'W', 'L'].map((r) => ({ r, bg: r === 'W' ? 'rgba(255,255,255,.92)' : 'rgba(255,255,255,.26)', fg: r === 'W' ? '#0C3A5E' : '#fff' }));
  const formA = ['W', 'W', 'W', 'D', 'W'].map((r) => ({ r, bg: r === 'W' ? '#FEBE10' : 'rgba(255,255,255,.22)', fg: r === 'W' ? '#00296B' : '#fff' }));
  const ladder = [
    { name: '£5 food credit', cost: '500 XP', tag: 'CLAIMED', bg: 'rgba(242,237,227,.08)', fg: '#F2EDE3', subFg: '#A39A85', tagFg: '#6CABDD', op: 1 },
    { name: 'Seat upgrade', cost: '2,000 XP', tag: 'NEXT UP', bg: '#F2EDE3', fg: '#100E0A', subFg: '#5F5949', tagFg: '#100E0A', op: 1 },
    { name: 'Home shirt', cost: '5,000 XP', tag: 'LOCKED', bg: 'rgba(242,237,227,.08)', fg: '#F2EDE3', subFg: '#A9A18E', tagFg: '#A9A18E', op: 0.6 },
  ];
  const questDefs = [
    { k: 'predict', title: 'Lock in a prediction', how: 'Correct score + first scorer', xp: '120 XP', go: go('pred') },
    { k: 'poll', title: 'Vote in tonight’s poll', how: 'Two questions open now', xp: '40 XP', go: go('polls') },
    { k: 'chat', title: 'Say something in fan chat', how: '312 fans in session', xp: '2 XP', go: go('chat') },
    { k: 'photo', title: 'Add a photo to the pool', how: 'From your seat, any moment', xp: '25 XP', go: go('photos') },
  ];
  const questsDone = questDefs.filter((q) => st.quests[q.k]).length;
  return (
    <div>
      {pre && (
        <section style={s('animation:bgFade .35s ease both')}>
          <div style={s('position:relative;display:grid;grid-template-columns:1fr 1fr;height:222px;overflow:hidden')}>
            <div style={s('background:#6CABDD;position:relative;padding:15px 13px;display:flex;flex-direction:column;justify-content:space-between')}>
              <div style={s('position:absolute;inset:0;background:repeating-linear-gradient(90deg,rgba(255,255,255,.11) 0 10px,transparent 10px 26px)')} />
              <div style={s('position:relative;display:flex;align-items:center;gap:9px')}><Badge club="city" size={40} /><span style={s("font:800 9.5px/1 'Archivo';letter-spacing:.16em;color:#fff")}>HOME</span></div>
              <div style={s('position:relative')}>
                <div style={s("font:800 36px/.84 'Archivo Black';letter-spacing:.01em;color:#fff")}>Man<br />City</div>
                <div style={s('display:flex;gap:4px;margin-top:11px')}>{formH.map((f, i) => <span key={i} style={{ ...s("font:800 9.5px/1 'Archivo';padding:5px 6px"), color: f.fg, background: f.bg }}>{f.r}</span>)}</div>
              </div>
            </div>
            <div style={s('background:#00529F;position:relative;padding:15px 13px;display:flex;flex-direction:column;justify-content:space-between;align-items:flex-end;text-align:right')}>
              <div style={s('position:absolute;inset:0;background:linear-gradient(200deg,rgba(255,255,255,.12),transparent 55%)')} />
              <div style={s('position:relative;display:flex;align-items:center;gap:9px')}><span style={s("font:800 9.5px/1 'Archivo';letter-spacing:.16em;color:#FEBE10")}>AWAY</span><Badge club="madrid" size={40} /></div>
              <div style={s('position:relative')}>
                <div style={s("font:800 36px/.84 'Archivo Black';letter-spacing:.01em;color:#fff")}>Real<br />Madrid</div>
                <div style={s('display:flex;gap:4px;margin-top:11px;justify-content:flex-end')}>{formA.map((f, i) => <span key={i} style={{ ...s("font:800 9.5px/1 'Archivo';padding:5px 6px"), color: f.fg, background: f.bg }}>{f.r}</span>)}</div>
              </div>
            </div>
            <div style={s('position:absolute;left:50%;top:0;bottom:0;width:32px;transform:translateX(-50%) skewX(-8deg);background:var(--ground);display:flex;align-items:center;justify-content:center')}><span style={s("font:800 14px/1 'Archivo Black';letter-spacing:.08em;color:var(--ink);transform:skewX(8deg)")}>V</span></div>
          </div>
          <div style={s('display:flex;align-items:center;background:var(--panel);padding:14px 16px')}>
            <div style={s('flex:1')}>
              <div style={s("font:800 9.5px/1 'Archivo';letter-spacing:.18em;color:#A39A85")}>KICK-OFF IN</div>
              <div style={s('display:flex;align-items:flex-end;gap:2px;margin-top:8px;color:var(--on-panel)')}>
                <span style={s("font:800 42px/.82 'Archivo Black';font-variant-numeric:tabular-nums")}>{pad(Math.floor(cd / 3600))}</span><span style={s("font:700 12px/1 'Archivo';color:#A39A85;padding:0 7px 5px 2px")}>H</span>
                <span style={s("font:800 42px/.82 'Archivo Black';font-variant-numeric:tabular-nums")}>{pad(Math.floor(cd / 60) % 60)}</span><span style={s("font:700 12px/1 'Archivo';color:#A39A85;padding:0 7px 5px 2px")}>M</span>
                <span style={s("font:800 42px/.82 'Archivo Black';font-variant-numeric:tabular-nums;color:#A39A85")}>{pad(cd % 60)}</span><span style={s("font:700 12px/1 'Archivo';color:#A39A85;padding:0 0 5px 2px")}>S</span>
              </div>
            </div>
            <div style={s("text-align:right;font:600 10.5px/1.55 'Archivo';letter-spacing:.06em;color:#A39A85")}>TUE 20:00<br />ETIHAD STADIUM<br />SEMI-FINAL, 2ND LEG</div>
          </div>
          <div style={s('padding:22px 16px 0')}>
            {label('THE FIRST LEG')}
            <button onClick={go('reads')} className="fs" style={s('display:flex;align-items:stretch;width:100%;text-align:left;margin-top:9px;background:var(--sand);border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(16,14,10,.07)')}>
              <span style={s('flex:1;min-width:0;padding:14px 14px 15px')}>
                <span style={s('display:flex;align-items:flex-end;gap:10px')}><span style={s("font:800 34px/.8 'Archivo Black';color:var(--ink);font-variant-numeric:tabular-nums")}>2 – 1</span><span style={s("font:600 10.5px/1.35 'Archivo';color:var(--label);padding-bottom:2px")}>30 APR · BERNABÉU<br />City lead on aggregate</span></span>
                <span style={s("display:block;font:500 12px/1.45 'Archivo';color:var(--body);margin-top:10px")}>Haaland 2, Vinícius 1. Six minutes of highlights and the tactical read.</span>
                <span style={s("display:inline-flex;align-items:center;gap:6px;margin-top:11px;font:800 9.5px/1 'Archivo';letter-spacing:.1em;color:var(--on-panel);background:var(--panel);padding:9px 10px")}><Ms size={13} color="var(--on-panel)">play_circle</Ms>WATCH HIGHLIGHTS</span>
              </span>
              <span style={s('width:116px;flex:none;position:relative;background:var(--sand2)')}><Slot id="last-meeting" label="First leg" /></span>
            </button>
          </div>
          <div style={s("padding:20px 16px 0;font:500 13.5px/1.5 'Archivo';color:var(--body)")}>Tonight’s companion: follow the game, talk to other City fans, and earn towards a seat upgrade while you watch. Nothing to install.</div>
          <div style={s('padding:22px 16px 0')}>
            {label('NEXT UP AT THE ETIHAD')}
            <div style={s('margin-top:6px')}>
              {[
                { day: '31', mon: 'MAY', opp: 'Champions League final', comp: 'Munich', ko: '20:00', tag: 'IF WE WIN', bg: '#6CABDD', fg: '#fff' },
                { day: '08', mon: 'AUG', opp: 'Tottenham Hotspur', comp: 'Premier League', ko: '17:30', tag: 'HOME', bg: 'var(--sand)', fg: 'var(--ink)' },
                { day: '16', mon: 'AUG', opp: 'Brighton', comp: 'Premier League', ko: '15:00', tag: 'AWAY', bg: 'var(--sand)', fg: 'var(--ink)' },
              ].map((x, i) => (
                <div key={i} style={s('display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1.5px solid var(--hair)')}>
                  <span style={s('width:38px;flex:none;text-align:center')}><span style={s("display:block;font:800 17px/1 'Archivo Black';color:var(--ink)")}>{x.day}</span><span style={s("display:block;font:800 8.5px/1 'Archivo';letter-spacing:.1em;color:var(--label);margin-top:4px")}>{x.mon}</span></span>
                  <span style={s('flex:1;min-width:0')}><span style={s("display:block;font:700 13.5px/1.2 'Archivo';color:var(--ink)")}>{x.opp}</span><span style={s("display:block;font:500 11.5px/1.3 'Archivo';color:var(--label);margin-top:3px")}>{x.comp} · {x.ko}</span></span>
                  <span style={{ ...s("font:800 9px/1 'Archivo';letter-spacing:.1em;padding:6px 7px"), color: x.fg, background: x.bg }}>{x.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {liveish && (
        <section style={s('animation:bgFade .3s ease both')}>
          <div style={s('background:var(--panel);padding:18px 16px 20px')}>
            <div style={s('display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:6px')}>
              <div><div style={s('display:flex;align-items:center;gap:7px')}><span style={s('width:5px;height:16px;background:#6CABDD;transform:skewX(-8deg)')} /><span style={s("font:800 21px/1 'Archivo Black';letter-spacing:.04em;color:var(--on-panel)")}>MAN CITY</span></div><div style={s("font:500 11px/1.45 'Archivo';color:#A39A85;margin-top:8px")}>{st.hs > 1 ? 'Haaland 23’ · Foden 71’' : st.hs ? 'Haaland 23’' : '—'}</div></div>
              <div key={'s' + st.hs + st.as} style={s('display:flex;align-items:center;justify-content:center;gap:9px;animation:bgScore .6s cubic-bezier(.18,.9,.2,1) both')}><span style={s("font:800 58px/.8 'Archivo Black';color:#F2EDE3;font-variant-numeric:tabular-nums")}>{st.hs}</span><span style={s('width:8px;height:2px;background:#6E6857')} /><span style={s("font:800 58px/.8 'Archivo Black';color:#F2EDE3;font-variant-numeric:tabular-nums")}>{st.as}</span></div>
              <div style={s('text-align:right')}><div style={s('display:flex;align-items:center;gap:7px;justify-content:flex-end')}><span style={s("font:800 21px/1 'Archivo Black';letter-spacing:.04em;color:var(--on-panel)")}>REAL MADRID</span><span style={s('width:5px;height:16px;background:#00529F;transform:skewX(-8deg)')} /></div><div style={s("font:500 11px/1.45 'Archivo';color:#A39A85;margin-top:8px")}>{st.as ? (ht ? 'Vinícius 45’' : 'Vinícius 58’') : '—'}</div></div>
            </div>
            <div style={s('display:flex;align-items:center;gap:10px;margin-top:18px')}>
              <span style={s("font:800 10px/1 'Archivo';letter-spacing:.12em;color:#A39A85;font-variant-numeric:tabular-nums")}>{live ? "38'" : "45'+2"}</span>
              <div style={s('flex:1;height:5px;background:rgba(242,237,227,.16);position:relative')}><span style={{ ...s('position:absolute;left:0;top:0;bottom:0;background:#D6202A;transition:width 1s linear'), width: Math.min((live ? 38 : 45) / 90 * 100, 100) + '%' }} /><span style={s('position:absolute;left:50%;top:-3px;bottom:-3px;width:1.5px;background:var(--ground)')} /></div>
              <span style={s("font:800 10px/1 'Archivo';letter-spacing:.12em;color:#A39A85")}>90′</span>
            </div>
          </div>
          <div style={s('padding:0 16px')}>
            {(timeline as any[]).map((e, i) => (
              <div key={i} style={s('display:flex;align-items:center;gap:11px;padding:12px 0;border-bottom:1.5px solid var(--hair)')}>
                <span style={s("font:800 12px/1 'Archivo';color:var(--ink);width:26px;font-variant-numeric:tabular-nums")}>{e.min}′</span>
                {e.isCard && <span style={{ ...s('width:11px;height:15px;border-radius:2px;box-shadow:inset 0 0 0 1px rgba(16,14,10,.3)'), background: e.cardColor }} />}
                {e.hasIcon && <Ms size={16} color={e.iconColor}>{e.icon}</Ms>}
                <span style={{ ...s("font:800 9px/1 'Archivo';letter-spacing:.1em;padding:5px 6px;text-align:center"), color: e.fg, background: e.bg }}>{e.kind}</span>
                <span style={s('flex:1;min-width:0')}><span style={s("display:block;font:600 13.5px/1.2 'Archivo';color:var(--ink)")}>{e.who}</span>{e.detail && <span style={s("display:block;font:500 11px/1.3 'Archivo';color:var(--label);margin-top:3px")}>{e.detail}</span>}</span>
                <span style={{ ...s('width:5px;height:14px;transform:skewX(-8deg);margin-left:auto'), background: e.tc }} />
              </div>
            ))}
          </div>
          {ht && (
            <div style={s('margin:16px 16px 0;background:var(--sand);padding:16px')}>
              <div style={s("font:800 9.5px/1 'Archivo';letter-spacing:.18em;color:var(--label)")}>HALF-TIME · 15 MINUTES</div>
              <div style={s("font:800 28px/.9 'Archivo Black';color:var(--ink);margin-top:10px")}>Beat the queue</div>
              <div style={s("font:500 13px/1.5 'Archivo';color:var(--body);margin-top:8px")}>Order to seat 112–J and it lands before the restart.</div>
              <div style={s('display:flex;gap:7px;margin-top:13px')}>
                <button onClick={go('food')} className="fp" style={s("display:flex;align-items:center;gap:7px;font:800 11.5px/1 'Archivo';letter-spacing:.06em;color:var(--on-panel);background:var(--panel);padding:12px 15px")}><Ms size={15} color="var(--on-panel)">restaurant</Ms>ORDER FOOD</button>
                <button onClick={go('intel')} className="fs" style={s("font:800 11.5px/1 'Archivo';letter-spacing:.06em;color:var(--ink);padding:12px 15px;box-shadow:inset 0 0 0 1.5px var(--ink)")}>HALF-TIME INTEL</button>
              </div>
            </div>
          )}
        </section>
      )}

      {ft && (
        <section style={s('animation:bgFade .3s ease both')}>
          <div style={s('background:var(--panel);padding:20px 16px 22px')}>
            <div style={s('display:flex;align-items:center;gap:8px')}><span style={s("font:800 9.5px/1 'Archivo';letter-spacing:.16em;color:#fff;background:#D6202A;padding:5px 7px")}>FULL-TIME</span><span style={s("font:700 10px/1 'Archivo';letter-spacing:.12em;color:#A39A85")}>CITY ADVANCE 4–3 ON AGGREGATE</span></div>
            <div style={s('display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;margin-top:18px')}>
              <Badge club="city" size={46} />
              <div style={s("font:800 66px/.8 'Archivo Black';color:var(--on-panel);font-variant-numeric:tabular-nums;text-align:center")}>2 – 1</div>
              <Badge club="madrid" size={46} />
            </div>
            <div style={s("display:flex;justify-content:space-between;gap:10px;margin-top:14px;font:500 11px/1.5 'Archivo';color:#A39A85")}><span>Haaland 23’<br />Foden 71’</span><span style={s('text-align:right')}>Vinícius 58’</span></div>
          </div>
          <div style={s('padding:20px 16px 0')}>
            {label('MATCH STATS')}
            <div style={s('margin-top:10px')}>
              {[{ label: 'POSSESSION', h: '58%', a: '42%', hf: 58, af: 42 }, { label: 'SHOTS', h: '17', a: '11', hf: 17, af: 11 }, { label: 'ON TARGET', h: '8', a: '4', hf: 8, af: 4 }, { label: 'EXPECTED GOALS', h: '2.34', a: '1.02', hf: 234, af: 102 }, { label: 'PASSES', h: '641', a: '498', hf: 641, af: 498 }, { label: 'CORNERS', h: '9', a: '3', hf: 9, af: 3 }].map((x) => (
                <div key={x.label} style={s('padding:10px 0;border-bottom:1.5px solid var(--hair)')}>
                  <div style={s('display:flex;align-items:baseline;justify-content:space-between;gap:10px')}><span style={s("font:800 17px/1 'Archivo';color:var(--ink);font-variant-numeric:tabular-nums;width:52px")}>{x.h}</span><span style={s("font:800 9.5px/1 'Archivo';letter-spacing:.14em;color:var(--label)")}>{x.label}</span><span style={s("font:800 17px/1 'Archivo';color:var(--ink);font-variant-numeric:tabular-nums;width:52px;text-align:right")}>{x.a}</span></div>
                  <div style={s('display:flex;gap:2px;margin-top:7px;height:7px')}><span style={{ flex: x.hf, background: '#6CABDD' }} /><span style={{ flex: x.af, background: '#00529F', opacity: 0.55 }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div style={s('padding:22px 16px 0')}>
            {label('FROM THE FANS')}
            <div style={s('display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:11px')}>
              <button onClick={go('photos')} className="fs" style={s('grid-column:span 2;text-align:left;background:var(--sand)')}>
                <div style={s('height:120px;position:relative')}><Slot id="ft-hero-photo" label="Winning moment" /></div>
                <div style={s('padding:12px 13px 13px')}><div style={s("font:800 22px/.94 'Archivo Black';color:var(--ink)")}>The night in photos</div><div style={s("font:500 12.5px/1.45 'Archivo';color:var(--body);margin-top:4px")}>1,204 fan photos from all four stands.</div></div>
              </button>
              <button onClick={go('reactions')} className="fs" style={s('text-align:left;background:var(--sand)')}><div style={s('height:96px;position:relative')}><Slot id="ft-reel" label="Reel still" /></div><div style={s('padding:11px 12px 12px')}><div style={s("font:800 19px/1 'Archivo Black';color:var(--ink)")}>Reactions</div><div style={s("font:500 12px/1.4 'Archivo';color:var(--body);margin-top:3px")}>30-second fan reels.</div></div></button>
              <button onClick={go('reads')} className="fs" style={s('text-align:left;background:var(--sand)')}><div style={s('height:96px;display:flex;align-items:center;justify-content:center')}><Ms size={34} color="var(--ink)">article</Ms></div><div style={s('padding:11px 12px 12px')}><div style={s("font:800 19px/1 'Archivo Black';color:var(--ink)")}>Reads</div><div style={s("font:500 12px/1.4 'Archivo';color:var(--body);margin-top:3px")}>Ratings and the tactical read.</div></div></button>
            </div>
          </div>
        </section>
      )}

      {/* FAN CHAT PREVIEW */}
      <section style={s('margin:20px 16px 0;animation:bgRise .4s .08s ease both')}>
        <div style={s('display:flex;align-items:center;gap:8px')}>{label('FAN CHAT')}<span style={s("font:800 9px/1 'Archivo';letter-spacing:.1em;color:#fff;background:#D6202A;padding:5px 6px")}>{298 + (st.n % 40)} TALKING NOW</span></div>
        <button onClick={go('chat')} className="fs" style={s('display:block;width:100%;text-align:left;margin-top:9px;background:var(--sand);border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(16,14,10,.07)')}>
          <div style={s('height:150px;overflow:hidden;position:relative;padding:0 12px')}>
            <div style={{ ...s('position:absolute;left:12px;right:12px;bottom:11px;display:flex;flex-direction:column;gap:8px;transition:transform .5s cubic-bezier(.2,.85,.2,1)'), transform: `translateY(${st.rollY}px)` }}>
              {previewMsgs.map((m, i) => (
                <div key={i} style={s('display:flex;gap:8px;align-items:flex-start')}>
                  <span style={{ ...s("width:22px;height:22px;flex:none;border-radius:50%;font:800 8.5px/22px 'Archivo';text-align:center"), background: m.avBg, color: m.avFg }}>{m.initials}</span>
                  <span style={s('flex:1;min-width:0;background:var(--ground);padding:8px 10px;border-radius:2px 12px 12px 12px')}><span style={s("display:block;font:800 9px/1 'Archivo';letter-spacing:.08em;color:var(--label)")}>{m.user}</span><span style={s("display:block;font:500 12.5px/1.35 'Archivo';color:var(--ink);margin-top:4px")}>{m.text}</span></span>
                </div>
              ))}
            </div>
            <div style={s('position:absolute;inset:0 0 auto;height:46px;background:linear-gradient(var(--sand),transparent);pointer-events:none')} />
          </div>
          <div style={s('display:flex;align-items:center;gap:10px;padding:12px 13px;background:var(--panel)')}><span style={s("font:800 12.5px/1 'Archivo';letter-spacing:.04em;color:var(--on-panel)")}>JOIN THE CONVERSATION</span><Ms size={17} color="#A39A85" style={s('margin-left:auto')}>arrow_forward</Ms></div>
        </button>
      </section>

      {/* REWARDS */}
      {!pre && (
        <section style={s('margin:20px 16px 0;background:var(--panel);padding:16px;border-radius:18px;box-shadow:0 8px 24px rgba(16,14,10,.16);animation:bgRise .4s .04s ease both')}>
          <div style={s('display:flex;align-items:center;justify-content:space-between')}><span style={s("font:800 9.5px/1 'Archivo';letter-spacing:.18em;color:#A39A85")}>MATCHDAY REWARDS</span><span style={s("font:800 9px/1 'Archivo';letter-spacing:.1em;color:var(--ink);background:var(--sand);padding:5px 7px")}>TIER 2</span></div>
          <div style={s('display:flex;align-items:flex-end;gap:8px;margin-top:12px')}><span style={s("font:800 44px/.8 'Archivo Black';color:var(--on-panel);font-variant-numeric:tabular-nums")}>{st.xp.toLocaleString()}</span><span style={s("font:600 11.5px/1 'Archivo';color:#A39A85;padding-bottom:5px")}>/ 2,000 XP</span></div>
          <div style={s("font:600 14px/1.35 'Archivo';color:var(--on-panel);margin-top:7px")}>{Math.max(2000 - st.xp, 0).toLocaleString()} XP from a seat upgrade for the final.</div>
          <div style={s('display:flex;gap:2px;height:10px;margin-top:13px')}>{Array.from({ length: 20 }, (_, i) => <span key={i} style={{ flex: 1, background: i < filled ? '#F2EDE3' : 'rgba(242,237,227,.16)', transition: 'background .4s ease' }} />)}</div>
          <div style={s('display:flex;gap:5px;margin-top:12px')}>{ladder.map((l, i) => <div key={i} style={{ ...s('flex:1;padding:10px'), background: l.bg, opacity: l.op }}><div style={{ ...s("font:800 8.5px/1 'Archivo';letter-spacing:.12em"), color: l.tagFg }}>{l.tag}</div><div style={{ ...s("font:700 12.5px/1.25 'Archivo';margin-top:6px"), color: l.fg }}>{l.name}</div><div style={{ ...s("font:500 10.5px/1 'Archivo';margin-top:4px"), color: l.subFg }}>{l.cost}</div></div>)}</div>
          <div style={s('margin-top:16px;padding-top:14px;border-top:1.5px solid rgba(242,237,227,.16)')}>
            <div style={s('display:flex;align-items:center;justify-content:space-between')}><span style={s("font:800 9.5px/1 'Archivo';letter-spacing:.18em;color:#A39A85")}>HOW TO EARN IT — TONIGHT’S QUESTS</span><span style={s("font:700 9px/1 'Archivo';letter-spacing:.1em;color:#6CABDD")}>{questsDone}/4 DONE</span></div>
            <div style={s('margin-top:10px;display:flex;flex-direction:column;gap:6px')}>
              {questDefs.map((q) => { const done = !!st.quests[q.k]; return (
                <button key={q.k} onClick={q.go} className="fq" style={s('display:flex;align-items:center;gap:11px;width:100%;text-align:left;padding:11px 12px;background:rgba(242,237,227,.07)')}>
                  <span style={{ ...s('width:22px;height:22px;flex:none;display:flex;align-items:center;justify-content:center'), background: done ? '#6CABDD' : 'rgba(242,237,227,.16)' }}><Ms size={14} color="#fff">{done ? 'check' : ''}</Ms></span>
                  <span style={s('flex:1;min-width:0')}><span style={{ ...s("display:block;font:700 12.5px/1.2 'Archivo';color:var(--on-panel)"), textDecoration: done ? 'line-through' : 'none' }}>{q.title}</span><span style={s("display:block;font:500 11px/1.3 'Archivo';color:#A39A85;margin-top:3px")}>{done ? 'Done — XP added' : q.how}</span></span>
                  <span style={{ ...s("font:800 11px/1 'Archivo';letter-spacing:.06em"), color: done ? '#6CABDD' : '#F2EDE3' }}>{done ? 'PAID' : q.xp}</span>
                </button>
              ); })}
            </div>
          </div>
        </section>
      )}

      {/* MATCH INTEL PREVIEW */}
      <section style={s('margin:20px 16px 0;animation:bgRise .4s .12s ease both')}>
        {label('MATCH INTEL')}
        <button onClick={go('intel')} className="fs" style={s('display:block;width:100%;text-align:left;margin-top:9px;background:var(--sand);padding:16px;border-radius:16px;box-shadow:0 4px 16px rgba(16,14,10,.07)')}>
          <div style={s("font:800 26px/.92 'Archivo Black';color:var(--ink)")}>The briefing,<br />already written</div>
          <div style={s("font:500 12.5px/1.5 'Archivo';color:var(--body);margin-top:8px")}>Win probability, the shot map, head-to-head and form — prepared before kick-off.</div>
          <div style={s('display:flex;gap:2px;margin-top:14px')}>
            <div style={s('flex:46;background:#6CABDD;padding:9px 8px')}><div style={s("font:800 20px/1 'Archivo';color:#fff")}>46%</div><div style={s("font:800 8px/1 'Archivo';letter-spacing:.1em;color:rgba(255,255,255,.9);margin-top:5px")}>CITY</div></div>
            <div style={s('flex:27;background:var(--sand2);padding:9px 8px')}><div style={s("font:800 20px/1 'Archivo';color:var(--ink)")}>27%</div><div style={s("font:800 8px/1 'Archivo';letter-spacing:.1em;color:var(--body);margin-top:5px")}>DRAW</div></div>
            <div style={s('flex:27;background:#00529F;padding:9px 8px')}><div style={s("font:800 20px/1 'Archivo';color:#fff")}>27%</div><div style={s("font:800 8px/1 'Archivo';letter-spacing:.1em;color:#FEBE10;margin-top:5px")}>MADRID</div></div>
          </div>
          <div style={s("display:flex;align-items:center;gap:6px;margin-top:13px;font:800 11.5px/1 'Archivo';letter-spacing:.06em;color:var(--ink)")}>READ THE BRIEFING<Ms size={15} color="var(--ink)">arrow_forward</Ms></div>
        </button>
      </section>

      {/* ALSO TONIGHT */}
      <section style={s('margin:24px 0 0;padding:0 16px;animation:bgRise .4s .16s ease both')}>
        {label('ALSO TONIGHT')}
        <div style={s('display:flex;flex-direction:column;gap:9px;margin-top:11px')}>
          {sections.map((x) => (
            <button key={x.t} onClick={x.go} className="frow" style={s('display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:12px 13px;background:var(--sand);border-radius:14px;box-shadow:0 2px 10px rgba(16,14,10,.05)')}>
              <span style={s('width:48px;height:48px;flex:none;border-radius:12px;background:var(--ground);display:flex;align-items:center;justify-content:center')}><Ms size={25} color="var(--ink)">{x.icon}</Ms></span>
              <span style={s('flex:1;min-width:0')}>
                <span style={s('display:flex;align-items:center;gap:7px')}><span style={s("font:800 19px/1 'Archivo Black';letter-spacing:.03em;color:var(--ink)")}>{x.t}</span><span style={s("font:800 8px/1 'Archivo';letter-spacing:.1em;color:var(--on-panel);background:#5F5949;padding:4px 5px;border-radius:5px")}>{x.tag}</span></span>
                <span style={s("display:block;font:500 12.5px/1.4 'Archivo';color:var(--body);margin-top:3px")}>{x.d}</span>
              </span>
              <Ms size={18} color="var(--label)">chevron_right</Ms>
            </button>
          ))}
        </div>
        <div style={s("font:700 10.5px/1 'Archivo';letter-spacing:.12em;color:var(--label);margin:16px 0 0;text-align:center")}>MATCHDAY.MANCITY.COM · NO APP, NO DOWNLOAD</div>
      </section>
    </div>
  );
}

// ═══════════ sub-screens ═══════════
function Chat({ st, shown, set, post, chatRef }: any) {
  return (
    <div style={s('animation:bgFade .25s ease both;display:flex;flex-direction:column;min-height:640px')}>
      <div ref={chatRef} style={s('flex:1;overflow-y:auto;padding:16px 14px 10px;display:flex;flex-direction:column;gap:10px;max-height:544px')}>
        {shown.slice(-16).map((m: any) => {
          // A live match moment, dropped inline then cleared out.
          if (m.ev) return (
            <div key={m.id} style={{ ...s('display:flex;align-items:center;gap:10px;align-self:center;max-width:92%;padding:9px 13px;border-radius:100px;background:var(--sand)'), boxShadow: `inset 0 0 0 1.5px ${m.ev.color}44` }}>
              {m.ev.kind === 'YELLOW' || m.ev.kind === 'RED CARD'
                ? <span style={{ ...s('width:10px;height:14px;border-radius:2px;flex:none'), background: m.ev.kind === 'RED CARD' ? '#D6202A' : '#F4C400' }} />
                : <Ms size={15} color={m.ev.color}>{EV[m.ev.kind]?.icon || 'bolt'}</Ms>}
              <span style={{ ...s("font:800 10px/1 'Archivo';letter-spacing:.08em"), color: m.ev.color }}>{m.ev.kind}</span>
              <span style={s("font:600 12px/1.2 'Archivo';color:var(--ink)")}>{m.text}{m.ev.minute ? ` · ${m.ev.minute}′` : ''}</span>
            </div>
          );
          const me = !!m.me; const liked = !!st.likes[m.id];
          return (
            <div key={m.id} style={{ ...s('display:flex;gap:8px;animation:bgBubble .3s ease both'), justifyContent: me ? 'flex-end' : 'flex-start' }}>
              {!me && <span style={{ ...s("width:28px;height:28px;flex:none;border-radius:50%;font:800 9.5px/28px 'Archivo';text-align:center;margin-top:12px"), background: TEAM[m.t].bg, color: TEAM[m.t].fg }}>{m.user.slice(0, 2)}</span>}
              <div style={s('max-width:74%')}>
                <div style={{ ...s('display:flex;align-items:baseline;gap:7px;padding:0 3px 4px'), justifyContent: me ? 'flex-end' : 'flex-start' }}><span style={s("font:800 9px/1 'Archivo';letter-spacing:.08em;color:var(--label)")}>{me ? 'YOU' : m.user}</span></div>
                <div style={{ ...s('padding:10px 12px'), background: me ? 'var(--panel)' : 'var(--sand)', borderRadius: me ? '14px 14px 3px 14px' : '3px 14px 14px 14px' }}>
                  <div style={{ ...s("font:500 14px/1.4 'Archivo'"), color: me ? 'var(--on-panel)' : 'var(--ink)' }}>{m.text}</div>
                  <div style={s('display:flex;align-items:center;gap:9px;margin-top:7px')}><span style={{ ...s("font:600 9.5px/1 'Archivo';font-variant-numeric:tabular-nums"), color: me ? '#A39A85' : 'var(--label)' }}>{m.time}</span><button onClick={() => set((sp: FSt) => ({ likes: { ...sp.likes, [m.id]: !sp.likes[m.id] } }))} style={{ ...s("display:flex;align-items:center;gap:4px;font:700 9.5px/1 'Archivo'"), color: liked ? '#6CABDD' : (me ? '#A39A85' : 'var(--label)') }}><Ms size={13} color={liked ? '#6CABDD' : '#A39A85'}>favorite</Ms>{(m.likes || 0) + (liked ? 1 : 0)}</button></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={s('position:sticky;bottom:0;flex:none;background:var(--ground);border-top:1.5px solid var(--hair)')}>
        <div style={s('display:flex;gap:6px;padding:9px 12px 0;overflow-x:auto')}>{['Come on City!', 'That’s never a foul', 'Anyone in 112?', 'Get it forward'].map((q) => <button key={q} onClick={() => post(q)} className="fs" style={s("flex:none;font:700 11px/1 'Archivo';color:var(--ink);background:var(--sand);padding:9px 11px;border-radius:100px;white-space:nowrap")}>{q}</button>)}</div>
        <div style={s('display:flex;gap:8px;align-items:center;padding:9px 12px 14px')}>
          <div style={s('flex:1;display:flex;align-items:center;gap:8px;padding:11px 14px;background:var(--sand);border-radius:100px')}><input value={st.draft} onChange={(e: any) => set({ draft: e.target.value })} onKeyDown={(e: any) => { if (e.key === 'Enter') post(st.draft); }} placeholder="Say something to the terrace…" style={s("flex:1;min-width:0;font:500 13.5px/1.2 'Archivo';color:var(--ink)")} /><span style={s("font:700 8.5px/1 'Archivo';letter-spacing:.1em;color:var(--label)")}>+2 XP</span></div>
          <button onClick={() => post(st.draft)} style={{ ...s('width:44px;height:44px;flex:none;display:flex;align-items:center;justify-content:center;border-radius:50%'), background: st.draft.trim() ? '#6CABDD' : '#100E0A' }}><Ms size={19} color="var(--on-panel)">arrow_upward</Ms></button>
        </div>
      </div>
    </div>
  );
}

function Intel({ pre, live, ht, openIris }: any) {
  const L = (t: string) => <div style={s("font:800 9.5px/1 'Archivo';letter-spacing:.18em;color:var(--label)")}>{t}</div>;
  const shots = [{ x: '46%', y: '26%', d: '22px', bg: '#6CABDD' }, { x: '58%', y: '18%', d: '13px', bg: '#6CABDD' }, { x: '38%', y: '32%', d: '10px', bg: '#6CABDD' }, { x: '52%', y: '36%', d: '16px', bg: '#6CABDD' }, { x: '62%', y: '30%', d: '9px', bg: '#6CABDD' }, { x: '44%', y: '14%', d: '12px', bg: '#6CABDD' }, { x: '50%', y: '76%', d: '18px', bg: '#00529F' }, { x: '40%', y: '68%', d: '11px', bg: '#00529F' }, { x: '60%', y: '72%', d: '9px', bg: '#00529F' }, { x: '55%', y: '86%', d: '14px', bg: '#00529F' }];
  const h2h = [{ r: 'W', bg: '#6CABDD', fg: '#fff', score: '2 – 1', comp: 'Semi-final, 1st leg', date: 'APR 30' }, { r: 'D', bg: 'var(--sand2)', fg: 'var(--ink)', score: '1 – 1', comp: 'Group stage', date: 'NOV 12' }, { r: 'L', bg: '#00529F', fg: '#FEBE10', score: '0 – 2', comp: 'Quarter-final', date: 'APR 09' }, { r: 'W', bg: '#6CABDD', fg: '#fff', score: '4 – 0', comp: 'Semi-final, 2nd leg', date: 'MAY 17' }, { r: 'W', bg: '#6CABDD', fg: '#fff', score: '3 – 2', comp: 'Friendly, Houston', date: 'JUL 24' }];
  const watch = [{ t: 'Vinícius against a high line', d: 'City push their back four to halfway. Madrid have six counter-attack goals in the competition, more than anyone.' }, { t: 'Rodri’s first ten minutes', d: 'City win 71% of matches he starts and finishes. One booking from a final suspension.' }, { t: 'The 70th minute onwards', d: 'Half of Madrid’s goals this season have come in the last twenty minutes.' }];
  const stamp = pre ? '19:20 · 40 MIN BEFORE KICK-OFF' : live ? '19:20 · NEXT UPDATE AT HALF-TIME' : ht ? '20:47 · HALF-TIME REFRESH' : '21:52 · FULL-TIME REFRESH';
  return (
    <div style={s('animation:bgFade .25s ease both')}>
      <div style={s('background:var(--panel);padding:16px 16px 20px')}>
        <div style={s("font:800 36px/.9 'Archivo Black';color:var(--on-panel)")}>Match intel</div>
        <div style={s("font:500 13px/1.5 'Archivo';color:#A39A85;margin-top:9px;max-width:300px")}>Written from this season’s data and refreshed at half-time and full-time. Read it — or ask IRIS for any part of it.</div>
        <div style={s("font:700 10px/1 'Archivo';letter-spacing:.12em;color:var(--label);margin-top:12px")}>UPDATED {stamp}</div>
      </div>
      <div style={s('padding:18px 16px 0')}>{L('WIN PROBABILITY')}<div style={s('display:flex;gap:2px;margin-top:11px')}><div style={s('flex:46;background:#6CABDD;padding:13px 11px')}><div style={s("font:800 32px/.86 'Archivo Black';color:#fff;font-variant-numeric:tabular-nums")}>46%</div><div style={s("font:800 8.5px/1 'Archivo';letter-spacing:.1em;color:#fff;margin-top:8px")}>MAN CITY</div></div><div style={s('flex:27;background:var(--sand2);padding:13px 9px')}><div style={s("font:800 25px/.86 'Archivo Black';color:var(--ink);font-variant-numeric:tabular-nums")}>27%</div><div style={s("font:800 8.5px/1 'Archivo';letter-spacing:.1em;color:var(--body);margin-top:8px")}>DRAW</div></div><div style={s('flex:27;background:#00529F;padding:13px 9px')}><div style={s("font:800 25px/.86 'Archivo Black';color:#fff;font-variant-numeric:tabular-nums")}>27%</div><div style={s("font:800 8.5px/1 'Archivo';letter-spacing:.1em;color:#FEBE10;margin-top:8px")}>MADRID</div></div></div></div>
      <div style={s('padding:20px 16px 0')}>{L('SHOT MAP · FIRST LEG')}
        <div style={s('position:relative;margin-top:11px;height:182px;background:#17150F;overflow:hidden')}>
          <div style={s('position:absolute;inset:10px;border:1.5px solid rgba(226,216,196,.45)')} /><div style={s('position:absolute;left:10px;right:10px;top:50%;height:1.5px;background:rgba(226,216,196,.45)')} /><div style={s('position:absolute;left:50%;top:50%;width:52px;height:52px;border:1.5px solid rgba(226,216,196,.45);border-radius:50%;transform:translate(-50%,-50%)')} /><div style={s('position:absolute;left:50%;top:10px;width:104px;height:34px;border:1.5px solid rgba(226,216,196,.45);border-top:0;transform:translateX(-50%)')} /><div style={s('position:absolute;left:50%;bottom:10px;width:104px;height:34px;border:1.5px solid rgba(226,216,196,.45);border-bottom:0;transform:translateX(-50%)')} />
          {shots.map((p, i) => <span key={i} style={{ position: 'absolute', left: p.x, top: p.y, width: p.d, height: p.d, borderRadius: '50%', background: p.bg, boxShadow: '0 0 0 1.5px rgba(226,216,196,.55)', transform: 'translate(-50%,-50%)' }} />)}
        </div>
        <div style={s("display:flex;align-items:center;gap:13px;margin-top:9px;font:700 9.5px/1 'Archivo';letter-spacing:.08em;color:var(--label)")}><span style={s('display:flex;align-items:center;gap:6px')}><span style={s('width:9px;height:9px;border-radius:50%;background:#6CABDD')} />CITY 17</span><span style={s('display:flex;align-items:center;gap:6px')}><span style={s('width:9px;height:9px;border-radius:50%;background:#00529F')} />MADRID 11</span><span style={s('margin-left:auto')}>SIZE = XG</span></div>
      </div>
      <div style={s('padding:22px 16px 0')}>{L('KEY STAT')}<div style={s('display:flex;align-items:flex-start;gap:13px;margin-top:11px')}><div style={s("font:800 58px/.78 'Archivo Black';color:#6CABDD;font-variant-numeric:tabular-nums")}>9<span style={s('font-size:24px;color:var(--ink)')}>/10</span></div><div style={s("flex:1;font:600 15px/1.3 'Archivo';color:var(--ink)")}>City have scored first in nine of their last ten at home — and won all nine.<span style={s("display:block;font:500 12.5px/1.5 'Archivo';color:var(--body);margin-top:6px")}>The first goal decides this tie more than possession does.</span></div></div></div>
      <div style={s('padding:22px 16px 0')}>{L('HEAD-TO-HEAD · LAST 5')}<div style={s('margin-top:9px')}>{h2h.map((g, i) => <div key={i} style={s('display:flex;align-items:center;gap:11px;padding:10px 0;border-bottom:1.5px solid var(--hair)')}><span style={{ ...s("width:22px;height:22px;flex:none;font:800 11px/22px 'Archivo';text-align:center"), background: g.bg, color: g.fg }}>{g.r}</span><span style={s("font:800 14px/1 'Archivo';color:var(--ink);font-variant-numeric:tabular-nums")}>{g.score}</span><span style={s("font:500 12px/1.3 'Archivo';color:var(--body)")}>{g.comp}</span><span style={s("font:700 10px/1 'Archivo';letter-spacing:.1em;color:var(--label);margin-left:auto")}>{g.date}</span></div>)}</div></div>
      <div style={s('padding:22px 16px 0')}>{L('FORM & EXPECTED GOALS')}<div style={s('display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:11px')}><div style={s('padding:14px;background:var(--sand);border-top:5px solid #6CABDD')}><div style={s("font:800 12px/1 'Archivo';letter-spacing:.06em;color:var(--ink)")}>MAN CITY</div><div style={s("font:800 34px/.88 'Archivo Black';color:var(--ink);margin-top:11px;font-variant-numeric:tabular-nums")}>1.87</div><div style={s("font:800 8.5px/1 'Archivo';letter-spacing:.12em;color:var(--label);margin-top:6px")}>XG PER GAME</div><div style={s("font:500 12px/1.45 'Archivo';color:var(--body);margin-top:9px")}>Unbeaten in 8 at home. Haaland 12 in the competition.</div></div><div style={s('padding:14px;background:var(--sand);border-top:5px solid #00529F')}><div style={s("font:800 12px/1 'Archivo';letter-spacing:.06em;color:var(--ink)")}>REAL MADRID</div><div style={s("font:800 34px/.88 'Archivo Black';color:var(--ink);margin-top:11px;font-variant-numeric:tabular-nums")}>1.64</div><div style={s("font:800 8.5px/1 'Archivo';letter-spacing:.12em;color:var(--label);margin-top:6px")}>XG PER GAME</div><div style={s("font:500 12px/1.45 'Archivo';color:var(--body);margin-top:9px")}>Score late: 7 of 14 goals after the 70th minute.</div></div></div></div>
      <div style={s('padding:22px 16px 26px')}>{L('WATCH FOR')}<div style={s('margin-top:7px')}>{watch.map((w, i) => <div key={i} style={s('padding:12px 0;border-bottom:1.5px solid var(--hair)')}><div style={s("font:700 14px/1.3 'Archivo';color:var(--ink)")}>{w.t}</div><div style={s("font:500 12.5px/1.5 'Archivo';color:var(--body);margin-top:4px")}>{w.d}</div></div>)}</div><button onClick={openIris} className="fp" style={s("display:block;width:100%;margin-top:18px;padding:15px;background:var(--panel);font:800 12.5px/1 'Archivo';letter-spacing:.08em;color:var(--on-panel);text-align:center")}>ASK IRIS ABOUT ANY OF THIS</button></div>
    </div>
  );
}

function Predictions({ st, set, award }: any) {
  const scorerNames = ['Haaland', 'Foden', 'De Bruyne', 'Vinícius', 'Bellingham', 'Rodrygo'];
  const crowd = [{ s: '2–1 City', p: '28%' }, { s: '1–0 City', p: '21%' }, { s: '1–1', p: '17%' }, { s: '2–0 City', p: '14%' }];
  return (
    <div style={s('animation:bgFade .25s ease both;padding:18px 16px 28px')}>
      <div style={s("font:800 30px/.92 'Archivo Black';color:var(--ink)")}>Call it before<br />kick-off</div>
      <div style={s("font:500 13px/1.5 'Archivo';color:var(--body);margin-top:8px")}>Correct score pays 60 XP. First scorer pays another 60. Locks at the first whistle.</div>
      {!st.pred.done && (
        <div style={s('margin-top:18px;background:var(--sand);padding:16px')}>
          <div style={s("font:800 9.5px/1 'Archivo';letter-spacing:.18em;color:var(--label)")}>CORRECT SCORE</div>
          <div style={s('display:flex;align-items:center;justify-content:center;gap:14px;margin-top:14px')}>
            {[['MCI', 'h'], ['RMA', 'a']].map(([lab, k], idx) => (
              <div key={lab as string} style={{ ...s('text-align:center'), order: idx === 1 ? 3 : 1 }}>
                <div style={s("font:800 10px/1 'Archivo';letter-spacing:.1em;color:var(--body)")}>{lab}</div>
                <div style={s('display:flex;align-items:center;gap:8px;margin-top:8px')}>
                  <button onClick={() => set((sp: FSt) => ({ pred: { ...sp.pred, [k as string]: Math.max((sp.pred as any)[k as string] - 1, 0) } }))} className="fw" style={s("width:30px;height:30px;background:var(--ground);font:800 14px/1 'Archivo';color:var(--ink)")}>−</button>
                  <span style={s("font:800 42px/.8 'Archivo Black';color:var(--ink);width:34px;font-variant-numeric:tabular-nums")}>{(st.pred as any)[k as string]}</span>
                  <button onClick={() => set((sp: FSt) => ({ pred: { ...sp.pred, [k as string]: Math.min((sp.pred as any)[k as string] + 1, 9) } }))} className="fw" style={s("width:30px;height:30px;background:var(--ground);font:800 14px/1 'Archivo';color:var(--ink)")}>+</button>
                </div>
              </div>
            ))}
            <span style={{ ...s("font:800 24px/1 'Archivo Black';color:#8E8674;padding-top:18px"), order: 2 }}>–</span>
          </div>
          <div style={s("font:800 9.5px/1 'Archivo';letter-spacing:.18em;color:var(--label);margin-top:20px")}>FIRST SCORER</div>
          <div style={s('display:flex;flex-wrap:wrap;gap:6px;margin-top:10px')}>{scorerNames.map((n) => { const on = st.pred.s === n; return <button key={n} onClick={() => set((sp: FSt) => ({ pred: { ...sp.pred, s: n } }))} style={{ ...s("font:700 11.5px/1 'Archivo';padding:10px 12px"), color: on ? 'var(--on-panel)' : 'var(--ink)', background: on ? 'var(--panel)' : 'var(--ground)' }}>{n}</button>; })}</div>
          <button onClick={() => { set((sp: FSt) => ({ pred: { ...sp.pred, done: true } })); award(120, 'PREDICTION LOCKED', 'predict'); }} className="fp" style={s("display:block;width:100%;margin-top:18px;padding:15px;background:var(--panel);font:800 12.5px/1 'Archivo';letter-spacing:.08em;color:var(--on-panel)")}>LOCK IN PREDICTION · 120 XP</button>
        </div>
      )}
      {st.pred.done && (
        <div style={s('margin-top:18px;background:var(--panel);padding:18px')}>
          <div style={s("font:800 9.5px/1 'Archivo';letter-spacing:.18em;color:#6CABDD")}>LOCKED IN · 120 XP AWARDED</div>
          <div style={s('display:flex;align-items:flex-end;gap:10px;margin-top:12px')}><span style={s("font:800 52px/.82 'Archivo Black';color:var(--on-panel);font-variant-numeric:tabular-nums")}>{st.pred.h} – {st.pred.a}</span><span style={s("font:600 12px/1.3 'Archivo';color:#A39A85;padding-bottom:6px")}>First scorer<br /><strong style={{ fontWeight: 800, color: 'var(--on-panel)' }}>{st.pred.s}</strong></span></div>
          <div style={s("font:500 12.5px/1.5 'Archivo';color:#A39A85;margin-top:14px")}>You’re in with 12,480 other fans. Results settle at full-time and pay into your XP automatically.</div>
          <button onClick={() => set((sp: FSt) => ({ pred: { ...sp.pred, done: false } }))} className="fs" style={s("margin-top:14px;font:800 11px/1 'Archivo';letter-spacing:.1em;color:var(--ink);background:var(--sand);padding:11px 13px")}>CHANGE IT</button>
        </div>
      )}
      <div style={s('margin-top:20px')}><div style={s("font:800 9.5px/1 'Archivo';letter-spacing:.18em;color:var(--label)")}>HOW OTHER FANS CALLED IT</div><div style={s('margin-top:10px')}>{crowd.map((c, i) => <div key={i} style={s('padding:9px 0')}><div style={s("display:flex;justify-content:space-between;font:700 12px/1 'Archivo';color:var(--ink)")}><span>{c.s}</span><span>{c.p}</span></div><div style={s('height:6px;background:var(--sand);margin-top:6px')}><span style={{ display: 'block', height: 6, width: c.p, background: '#6CABDD' }} /></div></div>)}</div></div>
    </div>
  );
}

function Polls({ st, ft, set, award }: any) {
  const pollDefs = [
    { id: 'starter', tag: 'LIVE', tagBg: '#D6202A', q: 'Who starts up front tonight?', base: { Haaland: 62, Álvarez: 23, 'Foden false 9': 15 }, votes: 4120 },
    { id: 'motm', tag: 'OPEN', tagBg: '#100E0A', q: ft ? 'Who was your man of the match?' : 'Who decides this tie?', base: ft ? { Foden: 44, Rodri: 31, Haaland: 25 } : { Haaland: 41, Vinícius: 34, Rodri: 25 }, votes: 2870 },
  ];
  return (
    <div style={s('animation:bgFade .25s ease both;padding:18px 16px 28px')}>
      <div style={s("font:800 30px/.92 'Archivo Black';color:var(--ink)")}>Fan polls</div>
      <div style={s("font:500 13px/1.5 'Archivo';color:var(--body);margin-top:8px")}>40 XP per vote. Results update live as the terrace votes.</div>
      {pollDefs.map((p) => { const mine = st.votes[p.id]; const total = Object.values(p.base).reduce((a, b) => a + b, 0) + (mine ? 1 : 0); return (
        <div key={p.id} style={s('margin-top:18px;background:var(--sand);padding:16px')}>
          <div style={s('display:flex;align-items:center;gap:8px')}><span style={{ ...s("font:800 9px/1 'Archivo';letter-spacing:.1em;color:#fff;padding:5px 6px"), background: p.tagBg }}>{p.tag}</span><span style={s("font:700 9.5px/1 'Archivo';letter-spacing:.1em;color:var(--label);margin-left:auto")}>{(p.votes + (mine ? 1 : 0)).toLocaleString()} VOTES</span></div>
          <div style={s("font:800 22px/1 'Archivo Black';color:var(--ink);margin-top:11px")}>{p.q}</div>
          <div style={s('margin-top:12px;display:flex;flex-direction:column;gap:7px')}>
            {Object.keys(p.base).map((k) => { const v = (p.base as any)[k] + (mine === k ? 1 : 0); const pct = Math.round(v / total * 100); const on = mine === k; return (
              <button key={k} onClick={() => { if (!st.votes[p.id]) { set((sp: FSt) => ({ votes: { ...sp.votes, [p.id]: k } })); award(40, 'POLL VOTED', 'poll'); } }} className="fw" style={s('display:block;width:100%;text-align:left;position:relative;padding:12px 13px;background:var(--ground);overflow:hidden')}>
                <span style={{ ...s('position:absolute;left:0;top:0;bottom:0;transition:width .6s cubic-bezier(.2,.8,.2,1)'), width: mine ? pct + '%' : '0%', background: on ? '#6CABDD' : 'var(--sand)' }} />
                <span style={s('position:relative;display:flex;align-items:center;gap:9px')}><span style={s("flex:1;font:700 13.5px/1.2 'Archivo';color:var(--ink)")}>{k}</span><span style={s("font:800 12px/1 'Archivo';color:var(--ink);font-variant-numeric:tabular-nums")}>{mine ? pct + '%' : ''}</span>{on && <span style={s("font:800 8.5px/1 'Archivo';letter-spacing:.1em;color:#fff;background:var(--panel);padding:4px 5px")}>YOURS</span>}</span>
              </button>
            ); })}
          </div>
        </div>
      ); })}
    </div>
  );
}

function Shop({ st, set, award }: any) {
  const sizes = ['S', 'M', 'L', 'XL', '2XL'];
  const merch = [{ name: 'Semi-final scarf', price: 22 }, { name: 'Match programme', price: 5 }, { name: 'Terrace beanie', price: 18 }];
  const total = st.basket.reduce((a: number, b: any) => a + b.price, 0);
  const shirtIn = st.basket.some((b: any) => b.name.indexOf('shirt') > -1 || b.name === 'Match shirt');
  return (
    <div style={s('animation:bgFade .25s ease both')}>
      <div style={s('position:relative;height:190px;background:#6CABDD')}><Slot id="shop-hero" label="Match shirt shot" /></div>
      <div style={s('padding:16px 16px 0')}>
        <div style={s('display:flex;align-items:center;gap:8px')}><span style={s("font:800 9px/1 'Archivo';letter-spacing:.1em;color:#fff;background:#D6202A;padding:5px 6px")}>TONIGHT ONLY</span><span style={s("font:700 9.5px/1 'Archivo';letter-spacing:.1em;color:var(--label)")}>FREE COLLECTION AT GATE 4</span></div>
        <div style={s("font:800 28px/.94 'Archivo Black';color:var(--ink);margin-top:11px")}>Semi-final match shirt</div>
        <div style={s('display:flex;align-items:baseline;gap:10px;margin-top:8px')}><span style={s("font:800 20px/1 'Archivo';color:var(--ink)")}>£95.00</span><span style={s("font:500 12.5px/1 'Archivo';color:var(--label)")}>Match-day print included</span></div>
        <div style={s("font:800 9.5px/1 'Archivo';letter-spacing:.18em;color:var(--label);margin-top:16px")}>SIZE</div>
        <div style={s('display:flex;gap:6px;margin-top:9px')}>{sizes.map((l) => { const on = st.size === l; return <button key={l} onClick={() => set({ size: l })} style={{ ...s("flex:1;font:800 12px/1 'Archivo';padding:13px 0"), color: on ? 'var(--on-panel)' : 'var(--ink)', background: on ? 'var(--panel)' : 'var(--sand)' }}>{l}</button>; })}</div>
        <button onClick={() => { if (!shirtIn) { set((sp: FSt) => ({ basket: [...sp.basket, { name: 'Match shirt', price: 95 }], ordered: false })); award(10, 'SHIRT ADDED'); } }} style={{ ...s("display:block;width:100%;margin-top:14px;padding:15px;font:800 12.5px/1 'Archivo';letter-spacing:.08em;color:var(--on-panel)"), background: shirtIn ? '#6CABDD' : '#100E0A' }}>{shirtIn ? 'SHIRT IN BASKET · SIZE ' + st.size : 'ADD SHIRT · SIZE ' + st.size}</button>
      </div>
      <div style={s('padding:22px 16px 0')}><div style={s("font:800 9.5px/1 'Archivo';letter-spacing:.18em;color:var(--label)")}>ALSO IN THE DROP</div><div style={s('margin-top:8px')}>{merch.map((m) => <div key={m.name} style={s('display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1.5px solid var(--hair)')}><span style={s('width:46px;height:46px;flex:none;background:repeating-linear-gradient(115deg,#D3C6AA 0 7px,#E4DACA 7px 14px);box-shadow:inset 0 0 0 1.5px #C3B69A')} /><span style={s('flex:1;min-width:0')}><span style={s("display:block;font:700 13.5px/1.2 'Archivo';color:var(--ink)")}>{m.name}</span><span style={s("display:block;font:500 12px/1.3 'Archivo';color:var(--label);margin-top:3px")}>{money(m.price)}</span></span><button onClick={() => { set((sp: FSt) => ({ basket: [...sp.basket, { name: m.name, price: m.price }], ordered: false })); award(10, 'ADDED TO BASKET'); }} className="fp" style={s("font:800 10.5px/1 'Archivo';letter-spacing:.1em;color:var(--on-panel);background:var(--panel);padding:11px 12px")}>ADD</button></div>)}</div></div>
      {st.basket.length > 0 && (
        <div style={s('position:sticky;bottom:0;margin-top:18px;padding:13px 16px 16px;background:var(--panel);display:flex;align-items:center;gap:12px')}><div style={s('flex:1')}><div style={s("font:800 9px/1 'Archivo';letter-spacing:.12em;color:#A39A85")}>{st.basket.length} ITEMS</div><div style={s("font:800 17px/1 'Archivo';color:var(--on-panel);margin-top:6px")}>{money(total)}</div></div><button onClick={() => { if (!st.ordered) { set({ ordered: true }); award(30, 'ORDER CONFIRMED'); } }} style={s("font:800 11.5px/1 'Archivo';letter-spacing:.08em;background:#6CABDD;padding:14px 16px;color:#fff")}>{st.ordered ? 'ORDER CONFIRMED ✓' : 'CHECKOUT'}</button></div>
      )}
    </div>
  );
}

function Food({ st, set, award, timers }: any) {
  const menuDefs = [{ id: 'pie', name: 'Steak pie', note: 'Kiosk 14', price: 5.5 }, { id: 'chips', name: 'Chips', note: 'Kiosk 14', price: 4 }, { id: 'pint', name: 'Pint', note: 'Bar 3', price: 6.2 }, { id: 'tea', name: 'Tea', note: 'Kiosk 14', price: 2.5 }, { id: 'wrap', name: 'Halloumi wrap', note: 'Kiosk 9', price: 7 }];
  const count = menuDefs.reduce((a, m) => a + (st.food[m.id] || 0), 0);
  const total = menuDefs.reduce((a, m) => a + (st.food[m.id] || 0) * m.price, 0);
  const summary = menuDefs.filter((m) => st.food[m.id]).map((m) => st.food[m.id] + '× ' + m.name).join(', ');
  const place = () => {
    set({ foodPlaced: true, foodEta: 6 }); award(15, 'ORDER ON ITS WAY');
    window.clearInterval(timers.current.food);
    timers.current.food = window.setInterval(() => set((sp: FSt) => { if (sp.foodEta <= 1) { window.clearInterval(timers.current.food); return { foodEta: 0 }; } return { foodEta: sp.foodEta - 1 }; }), 2000);
  };
  return (
    <div style={s('animation:bgFade .25s ease both;padding:16px 16px 28px')}>
      <div style={s('display:flex;align-items:center;gap:9px')}><span style={s("font:800 9px/1 'Archivo';letter-spacing:.1em;color:var(--ink);background:var(--sand);padding:6px 7px")}>DELIVER TO 112–J</span><span style={s("font:700 9.5px/1 'Archivo';letter-spacing:.1em;color:var(--label)")}>KIOSK 14 · 40M AWAY</span></div>
      <div style={s("font:800 28px/.94 'Archivo Black';color:var(--ink);margin-top:12px")}>To your seat</div>
      {st.foodPlaced && (
        <div style={s('margin-top:14px;background:var(--panel);padding:16px')}><div style={s("font:800 9.5px/1 'Archivo';letter-spacing:.18em;color:#6CABDD")}>ORDER PLACED · RUNNER ON THE WAY</div><div style={s('display:flex;align-items:flex-end;gap:8px;margin-top:11px')}><span style={s("font:800 46px/.8 'Archivo Black';color:var(--on-panel);font-variant-numeric:tabular-nums")}>{st.foodEta}</span><span style={s("font:600 11.5px/1 'Archivo';color:#A39A85;padding-bottom:5px")}>MIN AWAY</span></div><div style={s('height:6px;background:rgba(242,237,227,.18);margin-top:12px')}><span style={{ display: 'block', height: 6, width: ((6 - st.foodEta) / 6 * 100) + '%', background: '#6CABDD', transition: 'width 1s linear' }} /></div><div style={s("font:500 12.5px/1.5 'Archivo';color:#A39A85;margin-top:12px")}>{summary || 'Order placed'} · paid with match wallet</div></div>
      )}
      <div style={s('margin-top:16px')}>{menuDefs.map((m) => <div key={m.id} style={s('display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1.5px solid var(--hair)')}><span style={s('flex:1;min-width:0')}><span style={s("display:block;font:700 14px/1.2 'Archivo';color:var(--ink)")}>{m.name}</span><span style={s("display:block;font:500 12px/1.3 'Archivo';color:var(--label);margin-top:3px")}>{m.note} · {money(m.price)}</span></span><span style={s('display:flex;align-items:center;gap:8px')}><button onClick={() => set((sp: FSt) => ({ food: { ...sp.food, [m.id]: Math.max((sp.food[m.id] || 0) - 1, 0) } }))} className="fs" style={s("width:30px;height:30px;background:var(--sand);font:800 14px/1 'Archivo';color:var(--ink)")}>−</button><span style={s("font:800 15px/1 'Archivo';color:var(--ink);width:16px;text-align:center;font-variant-numeric:tabular-nums")}>{st.food[m.id] || 0}</span><button onClick={() => set((sp: FSt) => ({ food: { ...sp.food, [m.id]: (sp.food[m.id] || 0) + 1 } }))} className="fp" style={s("width:30px;height:30px;background:var(--panel);font:800 14px/1 'Archivo';color:var(--on-panel)")}>+</button></span></div>)}</div>
      {count > 0 && (
        <div style={s('position:sticky;bottom:0;margin-top:16px;padding:13px 0 4px;background:var(--ground);display:flex;align-items:center;gap:12px')}><div style={s('flex:1')}><div style={s("font:800 9px/1 'Archivo';letter-spacing:.12em;color:var(--label)")}>{count} ITEMS</div><div style={s("font:800 17px/1 'Archivo';color:var(--ink);margin-top:5px")}>{money(total)}</div></div><button onClick={place} className="fp" style={s("font:800 11.5px/1 'Archivo';letter-spacing:.08em;color:var(--on-panel);background:var(--panel);padding:14px 16px")}>{st.foodPlaced ? 'ADD TO ORDER' : 'DELIVER TO 112–J'}</button></div>
      )}
    </div>
  );
}

function Photos({ st, award, set }: any) {
  return (
    <div style={s('animation:bgFade .25s ease both;padding:16px 16px 28px')}>
      <div style={s('display:flex;align-items:flex-end;gap:10px')}><div style={s('flex:1')}><div style={s("font:800 28px/.94 'Archivo Black';color:var(--ink)")}>Photo pool</div><div style={s("font:500 12.5px/1.5 'Archivo';color:var(--body);margin-top:6px")}>{(st.photos * 134).toLocaleString()} photos from all four stands. Drop yours in for 25 XP.</div></div><button onClick={() => { set((sp: FSt) => ({ photos: Math.min(sp.photos + 3, 18) })); award(25, 'PHOTO ADDED', 'photo'); }} className="fp" style={s("font:800 10.5px/1 'Archivo';letter-spacing:.1em;color:var(--on-panel);background:var(--panel);padding:12px 13px;flex:none")}>+ ADD</button></div>
      <div style={s('display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;margin-top:14px')}>{Array.from({ length: st.photos }, (_, i) => <div key={i} style={s('position:relative;aspect-ratio:1;background:var(--sand)')}><Slot id={'photo-' + i} label={i < 3 ? 'Terrace shot' : 'Fan photo'} /></div>)}</div>
      <div style={s("font:500 11.5px/1.5 'Archivo';color:var(--label);margin-top:12px")}>Tap a tile to drop a real photo in. Anything you add is credited to your seat and enters tonight’s best-photo vote.</div>
    </div>
  );
}

function Reactions({ st, set }: any) {
  const reelDefs = [{ id: 'r1', title: 'Away end, ten minutes before kick-off', who: '@sofia_rm · 412 likes', slot: 'reel-1', ph: 'Away end reel' }, { id: 'r2', title: 'Block 112 when the first one went in', who: '@marcus92 · 1,204 likes', slot: 'reel-2', ph: 'Celebration reel' }, { id: 'r3', title: 'Full-time on the concourse', who: '@gaz · 388 likes', slot: 'reel-3', ph: 'Concourse reel' }];
  return (
    <div style={s('animation:bgFade .25s ease both;padding:16px 16px 28px')}>
      <div style={s("font:800 28px/.94 'Archivo Black';color:var(--ink)")}>Fan reactions</div>
      <div style={s("font:500 12.5px/1.5 'Archivo';color:var(--body);margin-top:6px")}>Thirty-second reels from the stands. Tap to play.</div>
      <div style={s('display:flex;flex-direction:column;gap:12px;margin-top:16px')}>
        {reelDefs.map((r, i) => { const playing = st.reels[r.id] === 'play'; const liked = !!st.reels[r.id + 'l']; return (
          <div key={r.id} style={s('background:var(--sand)')}>
            <button onClick={() => set((sp: FSt) => ({ reels: { ...sp.reels, [r.id]: sp.reels[r.id] === 'play' ? '' : 'play' } }))} style={s('display:block;width:100%;position:relative;height:200px')}>
              <Slot id={r.slot} label={r.ph} />
              <span style={s('position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none')}><span style={s('width:52px;height:52px;border-radius:50%;background:rgba(16,14,10,.72);display:flex;align-items:center;justify-content:center')}>{playing ? <span style={s('display:flex;gap:4px')}><span style={s('width:5px;height:17px;background:var(--ground)')} /><span style={s('width:5px;height:17px;background:var(--ground)')} /></span> : <span style={s('width:0;height:0;border-left:15px solid #F2EDE3;border-top:10px solid transparent;border-bottom:10px solid transparent;margin-left:4px')} />}</span></span>
              <span style={s("position:absolute;left:10px;bottom:10px;font:800 9px/1 'Archivo';letter-spacing:.1em;color:var(--on-panel);background:rgba(16,14,10,.72);padding:5px 6px")}>{playing ? 'PLAYING · 0:30' : 'TAP TO PLAY'}</span>
            </button>
            <div style={s('display:flex;align-items:center;gap:10px;padding:12px 13px')}><span style={s('flex:1;min-width:0')}><span style={s("display:block;font:700 13.5px/1.25 'Archivo';color:var(--ink)")}>{r.title}</span><span style={s("display:block;font:500 11.5px/1.3 'Archivo';color:var(--label);margin-top:3px")}>{r.who}</span></span><button onClick={() => set((sp: FSt) => ({ reels: { ...sp.reels, [r.id + 'l']: !sp.reels[r.id + 'l'] } }))} style={{ ...s("display:flex;align-items:center;gap:6px;font:800 11px/1 'Archivo';padding:10px 11px"), color: liked ? '#fff' : 'var(--ink)', background: liked ? '#6CABDD' : 'var(--ground)' }}><Ms size={14} color={liked ? '#fff' : '#6CABDD'}>favorite</Ms>{(412 + i * 300) + (liked ? 1 : 0)}</button></div>
          </div>
        ); })}
      </div>
    </div>
  );
}

function Reads({ st, set }: any) {
  const open = st.read !== null ? ARTICLES[st.read] : null;
  return (
    <div style={s('animation:bgFade .25s ease both;padding:16px 16px 28px')}>
      {!open && (<>
        <div style={s("font:800 28px/.94 'Archivo Black';color:var(--ink)")}>Reads</div>
        <div style={s("font:500 12.5px/1.5 'Archivo';color:var(--body);margin-top:6px")}>Written tonight by people who watch both teams every week.</div>
        <div style={s('margin-top:14px')}>{ARTICLES.map((a, i) => <button key={i} onClick={() => set({ read: i })} className="frow" style={s('display:flex;gap:12px;width:100%;text-align:left;padding:13px 0;border-bottom:1.5px solid var(--hair)')}><span style={s('width:70px;height:70px;flex:none;position:relative;background:var(--sand)')}><Slot id={a.slot} label="Art" /></span><span style={s('flex:1;min-width:0')}><span style={s("display:block;font:800 8.5px/1 'Archivo';letter-spacing:.12em;color:#6CABDD")}>{a.kicker}</span><span style={s("display:block;font:700 14.5px/1.25 'Archivo';color:var(--ink);margin-top:6px")}>{a.title}</span><span style={s("display:block;font:500 11.5px/1.3 'Archivo';color:var(--label);margin-top:5px")}>{a.meta}</span></span></button>)}</div>
      </>)}
      {open && (
        <div style={s('animation:bgFade .25s ease both')}>
          <button onClick={() => set({ read: null })} className="fh" style={s("font:800 10px/1 'Archivo';letter-spacing:.14em;color:var(--label)")}><Ms size={14} color="inherit" style={s('vertical-align:-2px')}>arrow_back</Ms> ALL READS</button>
          <div style={s("font:800 8.5px/1 'Archivo';letter-spacing:.12em;color:#6CABDD;margin-top:14px")}>{open.kicker}</div>
          <div style={s("font:800 30px/.96 'Archivo Black';color:var(--ink);margin-top:9px")}>{open.title}</div>
          <div style={s("font:500 11.5px/1 'Archivo';color:var(--label);margin-top:9px")}>{open.meta}</div>
          <div style={s('position:relative;height:170px;background:var(--sand);margin-top:14px')}><Slot id={open.slot + '-hero'} label="Article image" /></div>
          <div style={s('margin-top:14px;display:flex;flex-direction:column;gap:12px')}>{open.body.map((t, i) => <div key={i} style={s("font:400 15px/1.6 'Archivo';color:var(--ink)")}>{t}</div>)}</div>
        </div>
      )}
    </div>
  );
}

function Seat({ st, set, go }: any) {
  const blockDefs: [string, string][] = [['1 / 1 / 2 / 3', '101'], ['1 / 3 / 2 / 5', '102'], ['1 / 5 / 2 / 7', '103'], ['2 / 1 / 4 / 2', '120'], ['2 / 6 / 4 / 7', '104'], ['4 / 1 / 6 / 2', '119'], ['4 / 6 / 6 / 7', '105'], ['6 / 1 / 7 / 3', '112'], ['6 / 3 / 7 / 5', '111'], ['6 / 5 / 7 / 7', '110']];
  const facts = [{ k: 'ENTRANCE', v: 'Gate 4, then stairs C' }, { k: 'NEAREST KIOSK', v: 'Kiosk 14 — 40m, turn right' }, { k: 'TOILETS', v: 'Concourse south, 25m' }, { k: 'QUICKEST EXIT', v: 'Gate 4 to Ashton New Road' }];
  return (
    <div style={s('animation:bgFade .25s ease both;padding:16px 16px 28px')}>
      <div style={s('display:flex;align-items:flex-end;gap:10px')}><div style={s('flex:1')}><div style={s("font:800 28px/.94 'Archivo Black';color:var(--ink)")}>Block 112 · row J</div><div style={s("font:500 12.5px/1.5 'Archivo';color:var(--body);margin-top:6px")}>South stand, lower tier. Seat 14.</div></div><button onClick={() => set((sp: FSt) => ({ routeOn: !sp.routeOn }))} style={{ ...s("font:800 10.5px/1 'Archivo';letter-spacing:.1em;padding:12px 13px;flex:none"), color: st.routeOn ? '#fff' : '#100E0A', background: st.routeOn ? '#6CABDD' : '#E4DACA' }}>{st.routeOn ? 'HIDE ROUTE' : 'SHOW ROUTE'}</button></div>
      <div style={s('position:relative;margin-top:16px;height:280px;background:#17150F;padding:20px;display:flex;align-items:center;justify-content:center')}>
        <div style={s('position:relative;width:100%;height:100%;border:1.5px solid rgba(226,216,196,.4)')}><div style={s('position:absolute;left:0;right:0;top:50%;height:1.5px;background:rgba(226,216,196,.4)')} /><div style={s('position:absolute;left:50%;top:50%;width:60px;height:60px;border:1.5px solid rgba(226,216,196,.4);border-radius:50%;transform:translate(-50%,-50%)')} /></div>
        <div style={s('position:absolute;inset:6px;display:grid;grid-template-columns:repeat(6,1fr);grid-template-rows:repeat(6,1fr);gap:3px;pointer-events:none')}>{blockDefs.map(([area, label]) => <span key={label} style={{ ...s("display:flex;align-items:center;justify-content:center;font:800 7.5px/1 'Archivo';letter-spacing:.04em"), gridArea: area, background: label === '112' ? '#6CABDD' : 'rgba(226,216,196,.14)', color: label === '112' ? '#fff' : '#A39A85' }}>{label}</span>)}</div>
        {st.routeOn && (<><div style={s('position:absolute;left:22%;top:78%;width:52%;height:3px;background:repeating-linear-gradient(90deg,#6CABDD 0 7px,transparent 7px 12px)')} /><div style={s('position:absolute;left:74%;top:52%;width:3px;height:28%;background:repeating-linear-gradient(0deg,#6CABDD 0 7px,transparent 7px 12px)')} /></>)}
      </div>
      <div style={s('margin-top:14px')}>{facts.map((f) => <div key={f.k} style={s('display:flex;align-items:baseline;gap:12px;padding:11px 0;border-bottom:1.5px solid var(--hair)')}><span style={s("font:800 9.5px/1 'Archivo';letter-spacing:.12em;color:var(--label);width:96px")}>{f.k}</span><span style={s("flex:1;font:600 13.5px/1.3 'Archivo';color:var(--ink)")}>{f.v}</span></div>)}</div>
      <button onClick={go('food')} className="fp" style={s("display:block;width:100%;margin-top:16px;padding:15px;background:var(--panel);font:800 12.5px/1 'Archivo';letter-spacing:.08em;color:var(--on-panel)")}>ORDER TO THIS SEAT</button>
    </div>
  );
}

function Profile({ st, filled, set, go }: any) {
  const stats = [{ icon: 'stadium', v: '14', k: 'MATCHES THIS SEASON' }, { icon: 'forum', v: '212', k: 'CHAT MESSAGES' }, { icon: 'photo_camera', v: '38', k: 'PHOTOS ADDED' }, { icon: 'emoji_events', v: '6', k: 'PREDICTIONS WON' }];
  const activity = [
    { icon: 'redeem', t: '£5 food credit', d: 'Claimed at 500 XP', v: 'USED', color: 'var(--label)' },
    { icon: 'restaurant', t: st.foodPlaced ? 'Steak pie to 112–J' : 'No food order yet', d: st.foodPlaced ? 'Runner on the way' : 'Order before half-time', v: st.foodPlaced ? 'LIVE' : '—', color: st.foodPlaced ? '#6CABDD' : 'var(--label)' },
    { icon: 'shopping_bag', t: st.basket.length ? st.basket.length + ' items in basket' : 'Basket empty', d: st.ordered ? 'Collect at Gate 4' : 'Collection on the way out', v: st.ordered ? 'PAID' : 'OPEN', color: st.ordered ? '#6CABDD' : 'var(--label)' },
    { icon: 'scoreboard', t: st.pred.done ? 'Prediction ' + st.pred.h + '–' + st.pred.a + ', ' + st.pred.s : 'No prediction yet', d: st.pred.done ? 'Settles at full-time' : 'Closes at kick-off', v: st.pred.done ? '+120' : '—', color: st.pred.done ? '#6CABDD' : 'var(--label)' },
  ];
  const themeOpts = [{ k: 'auto', label: 'Auto', icon: 'brightness_auto' }, { k: 'light', label: 'Light', icon: 'light_mode' }, { k: 'dark', label: 'Dark', icon: 'dark_mode' }];
  const prefs = [{ k: 'goals', label: 'Goal alerts', icon: 'sports_soccer' }, { k: 'ht', label: 'Half-time summary', icon: 'schedule' }, { k: 'rewards', label: 'Reward updates', icon: 'redeem' }];
  const L = (t: string) => <div style={s("font:800 9.5px/1 'Archivo';letter-spacing:.18em;color:var(--label)")}>{t}</div>;
  return (
    <div style={s('animation:bgFade .25s ease both')}>
      <div style={s('background:var(--panel);padding:18px 16px 20px')}>
        <div style={s('display:flex;align-items:center;gap:13px')}><span style={s("width:56px;height:56px;flex:none;border-radius:50%;background:#6CABDD;display:flex;align-items:center;justify-content:center;font:800 20px/1 'Archivo Black';color:#fff")}>AJ</span><div style={s('flex:1;min-width:0')}><div style={s("font:800 26px/.94 'Archivo Black';color:var(--on-panel)")}>Alex Jarrett</div><div style={s("font:600 11.5px/1 'Archivo';color:#A39A85;margin-top:7px")}>@alexj · member since 2016</div></div><span style={s("font:800 9px/1 'Archivo';letter-spacing:.1em;color:var(--ink);background:var(--sand);padding:6px 7px")}>TIER 2</span></div>
        <div style={s('display:flex;align-items:center;gap:8px;margin-top:16px;padding-top:14px;border-top:1.5px solid rgba(242,237,227,.16)')}><Ms size={16} color="#6CABDD">event_seat</Ms><span style={s("font:600 12px/1.4 'Archivo';color:var(--on-panel)")}>Season ticket · Block 112, Row J, Seat 14</span></div>
      </div>
      <div style={s('padding:18px 16px 0')}>
        <div style={s('display:flex;align-items:baseline;justify-content:space-between')}>{L('MATCHDAY XP')}<span style={s("font:600 11px/1 'Archivo';color:var(--label)")}>{Math.max(2000 - st.xp, 0).toLocaleString()} to a seat upgrade</span></div>
        <div style={s('display:flex;align-items:flex-end;gap:8px;margin-top:10px')}><span style={s("font:800 40px/.82 'Archivo Black';color:var(--ink);font-variant-numeric:tabular-nums")}>{st.xp.toLocaleString()}</span><span style={s("font:600 11.5px/1 'Archivo';color:var(--label);padding-bottom:4px")}>/ 2,000 XP</span></div>
        <div style={s('display:flex;gap:2px;height:10px;margin-top:11px')}>{Array.from({ length: 20 }, (_, i) => <span key={i} style={{ flex: 1, background: i < filled ? 'var(--ink)' : 'var(--sand)', transition: 'background .4s ease' }} />)}</div>
        <div style={s('display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:16px')}>{stats.map((p) => <div key={p.k} style={s('background:var(--sand);padding:13px')}><Ms size={19} color="var(--ink)">{p.icon}</Ms><div style={s("font:800 26px/.9 'Archivo Black';color:var(--ink);margin-top:9px;font-variant-numeric:tabular-nums")}>{p.v}</div><div style={s("font:800 8.5px/1.3 'Archivo';letter-spacing:.12em;color:var(--label);margin-top:6px")}>{p.k}</div></div>)}</div>
      </div>
      <div style={s('padding:20px 16px 0')}>{L('TONIGHT’S ACTIVITY')}<div style={s('margin-top:6px')}>{activity.map((a, i) => <div key={i} style={s('display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1.5px solid var(--hair)')}><Ms size={20} color={a.color}>{a.icon}</Ms><span style={s('flex:1;min-width:0')}><span style={s("display:block;font:700 13px/1.2 'Archivo';color:var(--ink)")}>{a.t}</span><span style={s("display:block;font:500 11.5px/1.3 'Archivo';color:var(--label);margin-top:3px")}>{a.d}</span></span><span style={{ ...s("font:800 10.5px/1 'Archivo';letter-spacing:.06em"), color: a.color }}>{a.v}</span></div>)}</div></div>
      <div style={s('padding:20px 16px 0')}>{L('YOUR PHOTOS')}<div style={s('display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;margin-top:10px')}>{['profile-photo-1', 'profile-photo-2', 'profile-photo-3'].map((id) => <div key={id} style={s('position:relative;aspect-ratio:1;background:var(--sand)')}><Slot id={id} label="Your shot" /></div>)}</div></div>
      <div style={s('padding:20px 16px 0')}>{L('APPEARANCE')}<div style={s('display:flex;gap:6px;margin-top:10px')}>{themeOpts.map((o) => { const on = st.theme === o.k; return <button key={o.k} onClick={() => set({ theme: o.k })} style={{ ...s('flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 0'), background: on ? 'var(--panel)' : 'var(--sand)', color: on ? 'var(--on-panel)' : 'var(--ink)' }}><Ms size={21} color="inherit">{o.icon}</Ms><span style={s("font:800 10px/1 'Archivo';letter-spacing:.1em;color:inherit")}>{o.label}</span></button>; })}</div><div style={s("font:500 11.5px/1.5 'Archivo';color:var(--label);margin-top:9px")}>Auto follows your phone’s appearance setting.</div></div>
      <div style={s('padding:20px 16px 26px')}>{L('ALERTS')}<div style={s('margin-top:6px')}>{prefs.map((p) => { const on = st.prefs[p.k]; return <button key={p.k} onClick={() => set((sp: FSt) => ({ prefs: { ...sp.prefs, [p.k]: !sp.prefs[p.k] } }))} style={s('display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:13px 0;border-bottom:1.5px solid var(--hair)')}><Ms size={20} color="var(--ink)">{p.icon}</Ms><span style={s("flex:1;font:600 13.5px/1.2 'Archivo';color:var(--ink)")}>{p.label}</span><span style={{ ...s('width:42px;height:24px;flex:none;border-radius:100px;position:relative;transition:background .25s ease'), background: on ? '#6CABDD' : 'var(--sand2)' }}><span style={{ ...s('position:absolute;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:left .25s cubic-bezier(.2,.8,.2,1)'), left: on ? '21px' : '3px' }} /></span></button>; })}</div><button onClick={go('home')} className="fs" style={s("display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:18px;padding:15px;box-shadow:inset 0 0 0 1.5px var(--hair);font:800 12px/1 'Archivo';letter-spacing:.08em;color:var(--ink)")}><Ms size={16} color="var(--ink)">logout</Ms>SIGN OUT</button></div>
    </div>
  );
}

function Iris({ st, pre, live, ht, set, ask, irisRef, go }: any) {
  const QA: [string, string, string?, string?][] = pre ? [
    ['Who decides this?', 'Erling Haaland against a Madrid back line that has conceded first only twice all competition. He has 12 in the competition and scores 0.82 goals per 90 at home.', '12', 'GOALS IN THIS COMPETITION'],
    ['Why is City favourite?', 'Home leg, unbeaten in eight here, and 1.87 xG per game against Madrid’s 1.64. The model still only gives City 46% — Madrid score late.', '46%', 'MODELLED WIN CHANCE'],
    ['Madrid’s main threat?', 'Vinícius against a high line. Madrid have six counter-attack goals in the competition, more than any side left in it.', '6', 'COUNTER-ATTACK GOALS'],
    ['What can I win tonight?', 'You’re 760 XP from a seat upgrade for the final. Two predictions are open — 120 XP — and polls pay 40 XP each.', '760', 'XP TO A SEAT UPGRADE'],
  ] : live ? [
    ['What just happened?', 'Haaland finished a De Bruyne cutback on 23 minutes from an 0.34 xG chance. City lead and are 3–2 up on aggregate.', '0.34', 'XG ON THE OPENING GOAL'],
    ['Is City in control?', 'Territorially yes — 58% possession, 8 shots on target — but Madrid have scored half their goals after the 70th minute.', '58%', 'CITY POSSESSION'],
    ['Who’s the danger man?', 'Vinícius. He has been isolated wide left all half; every Madrid counter has gone through him.', '6', 'MADRID COUNTER GOALS'],
    ['How do I earn XP now?', 'The live poll is open — 40 XP — and chat messages pay 2 XP each.', '40', 'XP FOR THIS POLL'],
  ] : ht ? [
    ['What changed in the first half?', 'Madrid equalised on 45 minutes through Vinícius, against the run of play — City had 2.1 xG to their 0.6 before it went in.', '2.1', 'CITY XG, FIRST HALF'],
    ['What should City fix?', 'The high line. Both Madrid shots on target came from balls played in behind the full-backs.', '2', 'MADRID SHOTS ON TARGET'],
    ['Who wins from here?', 'Aggregate is level. On second-half form the model swings to City 51%, Madrid 29%, draw 20%.', '51%', 'CITY, SECOND HALF ON'],
    ['Can I still order food?', 'Fifteen minutes left — an order to 112–J typically lands with four minutes to spare.', '15', 'MINUTES OF HALF-TIME'],
  ] : [
    ['Who was man of the match?', 'Fans gave it to Phil Foden — the 71st-minute winner and 4 chances created. The model preferred Rodri.', '71’', 'THE WINNING GOAL'],
    ['How did City win it?', '2.34 xG to 1.02, and the first goal again — nine of their last ten home wins have followed it.', '2.34', 'CITY EXPECTED GOALS'],
    ['What happens next?', 'The final is in Munich on 31 May. Your seat upgrade unlocks at 2,000 XP; player ratings are worth a final 80 XP.', '80', 'XP LEFT TONIGHT'],
    ['Best of the fan content?', '1,204 photos in the pool and the away-end reaction reels are worth a minute of your time.', '1,204', 'FAN PHOTOS TONIGHT'],
  ];
  const fallback = 'That one isn’t in tonight’s briefing yet. I refresh at half-time and full-time — until then, the shot map and the win-probability model on the Match Intel page cover most of it.';
  const askFree = (q: string) => { const words = q.toLowerCase().split(/\W+/).filter((w) => w.length > 3); const hit = QA.find(([qq]) => words.some((w) => qq.toLowerCase().indexOf(w) > -1)); if (hit) ask(hit[0], hit[1], hit[2], hit[3]); else ask(q, fallback); };
  return (
    <div style={s('position:absolute;inset:0;z-index:60;display:flex;flex-direction:column;justify-content:flex-end;background:rgba(16,14,10,.45)')}>
      <button onClick={() => set({ iris: false })} style={s('position:absolute;inset:0;cursor:default')} />
      <div style={s('position:relative;height:82%;display:flex;flex-direction:column;background:var(--ground);animation:bgSheet .32s cubic-bezier(.18,.9,.2,1) both')}>
        <div style={s('display:flex;align-items:center;gap:10px;padding:13px 15px;background:var(--panel)')}><span style={s('width:7px;height:7px;background:#6CABDD;animation:bgDot 1.6s ease-in-out infinite')} /><div style={s('min-width:0')}><div style={s("font:800 21px/1 'Archivo Black';letter-spacing:.04em;color:var(--on-panel)")}>IRIS</div><div style={s("font:700 8.5px/1 'Archivo';letter-spacing:.14em;color:#A39A85;margin-top:5px")}>ANSWERS FROM TONIGHT’S BRIEFING</div></div><button onClick={go('intel')} className="fs" style={s("margin-left:auto;font:800 9px/1 'Archivo';letter-spacing:.12em;color:var(--ink);background:var(--sand);padding:7px 8px")}>FULL INTEL</button><button onClick={() => set({ iris: false })} className="fh" style={s("font:800 14px/1 'Archivo';color:#A39A85;padding:4px 2px 4px 6px")}><Ms size={18} color="inherit">close</Ms></button></div>
        <div ref={irisRef} style={s('flex:1;overflow-y:auto;padding:15px 15px 8px;display:flex;flex-direction:column;gap:11px')}>
          {st.thread.map((m: any, i: number) => { const me = m.me; return (
            <div key={i} style={{ ...s('display:flex;animation:bgBubble .3s ease both'), justifyContent: me ? 'flex-end' : 'flex-start' }}>
              <div style={{ ...s('max-width:84%;padding:12px 13px'), background: me ? 'var(--panel)' : 'var(--sand)', borderRadius: me ? '14px 14px 3px 14px' : '3px 14px 14px 14px' }}>
                <div style={{ ...s("font:800 8.5px/1 'Archivo';letter-spacing:.14em"), color: me ? '#A39A85' : 'var(--label)' }}>{me ? 'YOU' : 'IRIS'}</div>
                <div style={{ ...s("font:500 13.5px/1.5 'Archivo';margin-top:6px"), color: me ? 'var(--on-panel)' : 'var(--ink)' }}>{m.text}</div>
                {m.stat && <div style={s('display:flex;align-items:baseline;gap:8px;margin-top:10px;padding-top:9px;border-top:1.5px solid rgba(16,14,10,.14)')}><span style={s("font:800 25px/.9 'Archivo Black';color:#6CABDD;font-variant-numeric:tabular-nums")}>{m.stat}</span><span style={s("font:700 8.5px/1.3 'Archivo';letter-spacing:.12em;color:var(--label)")}>{m.statLabel}</span></div>}
              </div>
            </div>
          ); })}
          {st.irisTyping && <div style={s('display:flex;gap:5px;padding:4px 2px')}><span style={s('width:6px;height:6px;background:#6CABDD;animation:bgDot 1.2s ease-in-out infinite')} /><span style={s('width:6px;height:6px;background:#6CABDD;animation:bgDot 1.2s .2s ease-in-out infinite')} /><span style={s('width:6px;height:6px;background:#6CABDD;animation:bgDot 1.2s .4s ease-in-out infinite')} /></div>}
        </div>
        <div style={s('padding:9px 11px 0;display:flex;gap:6px;overflow-x:auto')}>{QA.map(([q, a, stat, statLabel]) => <button key={q} onClick={() => ask(q, a, stat, statLabel)} className="fs" style={s("flex:none;font:700 11px/1 'Archivo';color:var(--ink);padding:10px 12px;background:var(--sand);white-space:nowrap")}>{q}</button>)}</div>
        <div style={s('padding:9px 11px 15px;display:flex;gap:8px;align-items:center')}><div style={s('flex:1;padding:12px 14px;background:var(--sand);border-radius:100px')}><input value={st.irisDraft} onChange={(e: any) => set({ irisDraft: e.target.value })} onKeyDown={(e: any) => { if (e.key === 'Enter' && st.irisDraft.trim()) askFree(st.irisDraft); }} placeholder="Ask about tonight’s match…" style={s("width:100%;font:500 13.5px/1.2 'Archivo';color:var(--ink)")} /></div><button onClick={() => { if (st.irisDraft.trim()) askFree(st.irisDraft); }} style={s("width:44px;height:44px;flex:none;background:var(--panel);border-radius:50%;display:flex;align-items:center;justify-content:center;font:800 16px/1 'Archivo';color:var(--on-panel)")}>↑</button></div>
      </div>
    </div>
  );
}

const FAN_CSS = `
:root{--ground:#F5F4F1;--sand:#ECEAE4;--sand2:#CFCAC0;--sand3:#E1DED7;--ink:#14120E;--body:#33302B;--label:#5C574F;--panel:#14120E;--panel-hover:#26221B;--chrome:#1B1812;--on-panel:#F5F4F1;--hair:rgba(20,18,14,.12);--desk:#E4E1DA}
:root[data-theme="dark"]{--ground:#100E0B;--sand:#1C1A14;--sand2:#312C23;--sand3:#252219;--ink:#F4F0E6;--body:#C6BEAE;--label:#9A9381;--panel:#272319;--panel-hover:#332E23;--chrome:#1A1712;--on-panel:#F4F0E6;--hair:rgba(244,240,230,.10);--desk:#080807}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--ground:#100E0B;--sand:#1C1A14;--sand2:#312C23;--sand3:#252219;--ink:#F4F0E6;--body:#C6BEAE;--label:#9A9381;--panel:#272319;--panel-hover:#332E23;--chrome:#1A1712;--on-panel:#F4F0E6;--hair:rgba(244,240,230,.10);--desk:#080807}}
.ms{font-family:'Material Symbols Rounded';font-weight:400;line-height:1;display:inline-block;-webkit-font-feature-settings:'liga';-webkit-font-smoothing:antialiased}
@keyframes bgRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes bgFade{from{opacity:0}to{opacity:1}}
@keyframes bgScore{0%{opacity:0;transform:translateY(24px) scale(.9)}55%{opacity:1;transform:translateY(-4px) scale(1.04)}100%{opacity:1;transform:none}}
@keyframes bgThird{0%{opacity:0;transform:translateX(-102%)}14%{opacity:1;transform:translateX(0)}86%{opacity:1;transform:translateX(0)}100%{opacity:0;transform:translateX(-14px)}}
@keyframes bgBlink{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes bgTicker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes bgSheet{from{transform:translateY(100%)}to{transform:none}}
@keyframes bgDot{0%,80%,100%{opacity:.25}40%{opacity:1}}
@keyframes bgBubble{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes bgToast{0%{opacity:0;transform:translateY(12px)}12%{opacity:1;transform:none}84%{opacity:1;transform:none}100%{opacity:0;transform:translateY(-6px)}}
.fs:hover{background:var(--sand3) !important}
.fp:hover{background:var(--panel-hover) !important}
.fh:hover{color:var(--on-panel) !important}
.fh2:hover{background:var(--panel-hover) !important}
.fq:hover{background:rgba(242,237,227,.14) !important}
.fw:hover{background:#fff !important}
.frow:hover{opacity:.72}
@media (prefers-reduced-motion: reduce){*{animation-duration:.001ms !important;transition-duration:.001ms !important}}
`;
