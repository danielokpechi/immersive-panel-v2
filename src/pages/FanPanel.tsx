// ═══════════════════════════════════════════════════════════════════════
// FanPanel — the shareable link (/p/:id). Opens straight into the live
// panel: it AUTO-RUNS the matchday on its own (so a link you send just
// plays), and if an operator is driving on the same channel it FOLLOWS the
// operator instead. Warm/light interim UI; swap the sections for the new UI.
// ═══════════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPanel } from '../store/panels';
import { defaultPanel, SCRIPTS, matchdayScript } from '../domain/seed';
import { useMatchday } from '../engine/useMatchday';
import { createBus } from '../realtime/bus';
import type { MatchState, ModuleId, PanelConfig, Session } from '../domain/types';
import { media, reelPhotos } from '../domain/media';

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function Crest({ team, sm }: { team: PanelConfig['match']['home']; sm?: boolean }) {
  return (
    <div className={`crest${sm ? ' crest--sm' : ''}`} style={{ color: team.color }}>
      {team.crest ? <img src={team.crest} alt={team.name} /> : team.short}
    </div>
  );
}

export function FanPanel() {
  const { id = '' } = useParams();
  const panel = useMemo(() => getPanel(id) ?? defaultPanel(), [id]);
  const script = SCRIPTS[panel.scriptId] ?? matchdayScript;

  const md = useMatchday(panel.match, script, { mode: 'auto' });

  // Follow an operator if one is broadcasting on this panel's channel.
  const [followed, setFollowed] = useState<MatchState | null>(null);
  const busRef = useRef<ReturnType<typeof createBus> | null>(null);
  useEffect(() => {
    const bus = createBus(panel.id);
    busRef.current = bus;
    const off = bus.subscribe((m) => {
      if (m.type === 'state') setFollowed(m.state);
    });
    bus.send({ type: 'requestState' });
    return () => {
      off();
      bus.dispose();
    };
  }, [panel.id]);

  const following = followed !== null;
  const state = followed ?? md.state;
  useEffect(() => {
    if (following) md.pause();
  }, [following]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fan">
      <div className="device">
        <PanelBody panel={panel} state={state} onSend={md.sendChat} />
      </div>
    </div>
  );
}

function sessionForPhase(panel: PanelConfig, phase: Session['phase']): Session {
  return (
    panel.sessions.find((s) => s.phase === phase) ??
    panel.sessions.find((s) => s.id === panel.defaultSessionId) ??
    panel.sessions[0]
  );
}

function PanelBody({ panel, state, onSend }: { panel: PanelConfig; state: MatchState; onSend: (t: string) => void }) {
  const session = sessionForPhase(panel, state.phase);
  const [draft, setDraft] = useState('');

  // transient event banner (auto-dismiss)
  const [banner, setBanner] = useState<MatchState['banner']>(null);
  const lastBanner = useRef(0);
  useEffect(() => {
    if (!state.banner) return;
    setBanner(state.banner);
    const t = window.setTimeout(() => setBanner(null), 5200);
    lastBanner.current = Date.now();
    return () => window.clearTimeout(t);
  }, [state.banner]);

  const showChatComposer = session.modules.includes('chat');

  return (
    <>
      {banner && (
        <div className={`banner banner--${banner.type}`}>
          <div className="banner__ic">{banner.type === 'goal' ? '⚽' : banner.type.slice(0, 1).toUpperCase()}</div>
          <div>
            <div className="banner__t">{banner.title}</div>
            {banner.detail && <div className="banner__d">{banner.detail}</div>}
          </div>
        </div>
      )}

      <div className="fp">
        <div className="fp__inner">
          <div className="fp__top">
            <div className="fp__brand">
              {panel.branding.crest && <img src={panel.branding.crest} alt="" />}
              <div>
                <div className="fp__bt">Matchday</div>
                <div className="fp__bs">{panel.match.home.name}</div>
              </div>
            </div>
            {state.live ? (
              <span className="chip chip--live">
                <i className="livedot" />
                LIVE {state.minuteLabel}
              </span>
            ) : (
              <span className="chip">{phaseLabel(state.phase)}</span>
            )}
          </div>

          {/* phase header */}
          {state.phase === 'pre' ? (
            <Hero panel={panel} clockSec={state.clockSec} />
          ) : (
            <ScoreHead panel={panel} state={state} />
          )}

          {/* module sections */}
          {session.modules.map((m) => (
            <Section key={m} id={m} state={state} />
          ))}
        </div>
      </div>

      {showChatComposer && (
        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault();
            onSend(draft);
            setDraft('');
          }}
        >
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Say something to the room…" />
          <button type="submit" aria-label="Send">
            ↑
          </button>
        </form>
      )}
    </>
  );
}

function phaseLabel(p: Session['phase']) {
  return { idle: 'Soon', pre: 'Pre-match', live: 'Live', break: 'Half-time', post: 'Full-time' }[p];
}

function Hero({ panel, clockSec }: { panel: PanelConfig; clockSec: number }) {
  // Auto-run counts down to the engine's kickoff (clockSec ramps −30 → 0);
  // before the engine has started, fall back to the scheduled kickoff time.
  const engineLeft = clockSec < 0 ? -clockSec : null;
  const kickoff = new Date(panel.match.kickoffISO).getTime();
  const [wallLeft, setWallLeft] = useState(Math.max(0, kickoff - Date.now()));
  useEffect(() => {
    const iv = setInterval(() => setWallLeft(Math.max(0, kickoff - Date.now())), 1000);
    return () => clearInterval(iv);
  }, [kickoff]);

  let countdown: string;
  if (engineLeft !== null) {
    const m = Math.floor(engineLeft / 60);
    const s = Math.floor(engineLeft % 60);
    countdown = `${m}:${String(s).padStart(2, '0')}`;
  } else {
    const h = Math.floor(wallLeft / 3_600_000);
    const m = Math.floor((wallLeft % 3_600_000) / 60_000);
    const s = Math.floor((wallLeft % 60_000) / 1000);
    countdown = `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return (
    <div className="hero reveal">
      <div className="hero__k">
        {panel.match.competition} · {panel.match.venue}
      </div>
      <div className="vs">
        <div className="vs__team">
          <Crest team={panel.match.home} />
          <div className="vs__n">{panel.match.home.name}</div>
        </div>
        <div className="vs__mid">vs</div>
        <div className="vs__team">
          <Crest team={panel.match.away} />
          <div className="vs__n">{panel.match.away.name}</div>
        </div>
      </div>
      <div className="hero__count">
        Kicks off in <b>{countdown}</b>
      </div>
    </div>
  );
}

function ScoreHead({ panel, state }: { panel: PanelConfig; state: MatchState }) {
  const prev = useRef(state.score);
  const [bump, setBump] = useState<'home' | 'away' | null>(null);
  useEffect(() => {
    if (state.score.home !== prev.current.home) setBump('home');
    else if (state.score.away !== prev.current.away) setBump('away');
    prev.current = state.score;
    const t = setTimeout(() => setBump(null), 700);
    return () => clearTimeout(t);
  }, [state.score]);
  return (
    <div className="reveal">
      <div className="score">
        <div className="vs__team">
          <Crest team={panel.match.home} sm />
          <div className="vs__n">{panel.match.home.short}</div>
        </div>
        <span className={`score__d${state.score.home === 0 && state.phase !== 'post' ? ' dim' : ''}${bump === 'home' ? ' bump' : ''}`}>
          {state.score.home}
        </span>
        <div className="score__mid">
          <span className="chip chip--live">{state.minuteLabel}</span>
        </div>
        <span className={`score__d${state.score.away === 0 ? ' dim' : ''}${bump === 'away' ? ' bump' : ''}`}>
          {state.score.away}
        </span>
        <div className="vs__team">
          <Crest team={panel.match.away} sm />
          <div className="vs__n">{panel.match.away.short}</div>
        </div>
      </div>
      {state.scorers.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          {state.scorers.map((sc, i) => (
            <span key={i} className="chip chip--xp" style={{ margin: 2 }}>
              ⚽ {sc.name} {sc.minute}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── module sections ──
function Section({ id, state }: { id: ModuleId; state: MatchState }) {
  switch (id) {
    case 'chat':
      return <ChatSection state={state} />;
    case 'intel':
      return <IntelSection state={state} />;
    case 'rewards':
      return <RewardsSection />;
    case 'timeline':
      return <TimelineSection state={state} />;
    case 'reactions':
      return <RailSection eyebrow="Fan Reactions" title="Fans are filming their reactions" imgs={reelPhotos.slice(0, 4)} kind="Reel" />;
    case 'shop':
      return <RailSection eyebrow="Shop" title="Matchday drops" imgs={[media.kitHome, media.kitTraining, media.kitAway]} kind="Shop" />;
    case 'reads':
      return <RailSection eyebrow="Before kick-off" title="Reads" imgs={[media.formation, media.vsPoster, media.haaland]} kind="Read" />;
    case 'polls':
    case 'predictions':
      return <PromptSection state={state} />;
    default:
      return null;
  }
}

function Block({ eyebrow, title, desc, children, live }: { eyebrow: React.ReactNode; title: string; desc?: string; children?: React.ReactNode; live?: boolean }) {
  return (
    <div className="block reveal">
      <div className="block__hd">
        <div style={{ minWidth: 0 }}>
          <div className="block__eyebrow">{live ? <span className="livenow"><i className="livedot" />{eyebrow}</span> : eyebrow}</div>
          <div className="block__title">{title}</div>
          {desc && <div className="block__desc">{desc}</div>}
        </div>
        <div className="block__go"><Chevron /></div>
      </div>
      {children}
    </div>
  );
}

function ChatSection({ state }: { state: MatchState }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
  }, [state.chat.length]);
  const recent = state.chat.slice(-6);
  return (
    <div className="block reveal">
      <div className="block__hd">
        <div>
          <div className="block__eyebrow"><span className="livenow"><i className="livedot" />Live now</span> · {312 + state.chat.length} talking</div>
          <div className="block__title">Fan Chat</div>
        </div>
      </div>
      <div className="chatwrap" style={{ height: 168, mask: 'none', WebkitMask: 'none' }} ref={ref}>
        <div className="chatroll" style={{ animation: 'none' }}>
          {recent.length === 0 && <div className="msg"><div className="msg__av">··</div><div className="msg__b"><div className="msg__t">Say hello to the room.</div></div></div>}
          {recent.map((c) => (
            <div className="msg" key={c.id} style={c.self ? { justifyContent: 'flex-end' } : undefined}>
              {!c.self && <div className="msg__av">{c.initials}</div>}
              <div className={`msg__b${c.self ? ' self' : ''}`}>
                {!c.self && <div className="msg__n">{c.author}</div>}
                <div className="msg__t">{c.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IntelSection({ state }: { state: MatchState }) {
  const live = state.phase === 'live';
  return (
    <Block eyebrow="Match Intel" title={live ? 'How it’s going' : 'What to watch for'} desc="IRIS reads the numbers — form, the head-to-head, and where it’s won.">
      {live ? (
        <>
          <div className="line"><span className="line__l">City xG</span><span className="line__v">2.1</span></div>
          <div className="line"><span className="line__l">Real Madrid xG</span><span className="line__v">0.3</span></div>
          <div className="line"><span className="line__l">Predicted to win</span><span className="line__v" style={{ color: 'var(--brand)' }}>City 78%</span></div>
        </>
      ) : (
        <>
          <div className="line"><span className="line__l">Man City — last 5</span><span className="line__v">W W W D W</span></div>
          <div className="line"><span className="line__l">Head-to-head (last 6)</span><span className="line__v">City 4 · Draw 1 · RM 1</span></div>
          <div className="line"><span className="line__l">Predicted to win</span><span className="line__v" style={{ color: 'var(--brand)' }}>City 61%</span></div>
        </>
      )}
    </Block>
  );
}

function RewardsSection() {
  return (
    <Block eyebrow="Rewards" title="You’re 660 XP from Tier IV" desc="Tier IV · Elite Blue unlocks a matchday seat upgrade. Earn XP by chatting, predicting and reacting live.">
      <div style={{ padding: '2px 18px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 9 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>Tier III · Loyal Blue</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--xp)' }}>2,840 / 3,500 XP</span>
        </div>
        <div className="bar"><div className="bar__f" style={{ width: '81%' }} /></div>
      </div>
    </Block>
  );
}

function TimelineSection({ state }: { state: MatchState }) {
  const items = [...state.events].filter((e) => e.type !== 'chat').reverse().slice(0, 6);
  if (items.length === 0) return null;
  return (
    <Block eyebrow="Timeline" title="Key moments">
      {items.map((e) => (
        <div className="line" key={e.id}>
          <span className="line__l">{e.title ?? e.type}</span>
          <span className="line__v" style={{ color: 'var(--text-3)' }}>{state.minuteLabel}</span>
        </div>
      ))}
    </Block>
  );
}

function PromptSection({ state }: { state: MatchState }) {
  if (!state.prompt) {
    return <Block eyebrow="Predictions" title="Call the score" desc="Lock in your prediction before the whistle — points on the line." />;
  }
  const p = state.prompt;
  return (
    <div className="block reveal">
      <div className="block__hd">
        <div>
          <div className="block__eyebrow">{p.kind === 'poll' ? 'Live poll' : 'Moderator asks'}</div>
          <div className="block__title">{p.q}</div>
        </div>
      </div>
      {p.options && (
        <div style={{ display: 'flex', gap: 8, padding: '4px 18px 18px' }}>
          {p.options.map((o) => (
            <button key={o} className="btn" style={{ flex: 1 }}>
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RailSection({ eyebrow, title, imgs, kind }: { eyebrow: string; title: string; imgs: string[]; kind: string }) {
  return (
    <div className="reveal">
      <div className="sec">
        <span className="sec__t">{eyebrow}</span>
        <span className="sec__a">See all →</span>
      </div>
      <div className="rail">
        {imgs.map((src, i) => (
          <div className="tile" key={i}>
            <div className="tile__img"><img src={src} alt="" loading="lazy" /></div>
            <div className="tile__b">
              <div className="tile__k">{kind}</div>
              <div className="tile__t">{title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
