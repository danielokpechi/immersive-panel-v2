// ═══════════════════════════════════════════════════════════════════════
// ControlRoom (/control/:id) — the operator cockpit. Runs the match engine
// and broadcasts its live state on the panel's channel, so the embedded fan
// monitor (and any real fan device on the same channel) follows in lockstep.
// Auto mode plays the script; Manual lets the operator drive it by hand.
// ═══════════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as QRCode from 'qrcode';
import { getPanel } from '../store/panels';
import { defaultPanel, SCRIPTS, matchdayScript } from '../domain/seed';
import { useMatchday } from '../engine/useMatchday';
import { createBus } from '../realtime/bus';
import type { MatchEvent, RunMode } from '../domain/types';

const TRIGGERS: { t: MatchEvent['type']; label: string; sub: string; team?: 'home' | 'away'; title?: string; detail?: string; meta?: Record<string, unknown> }[] = [
  { t: 'goal', label: 'Goal', sub: 'Home', team: 'home', title: 'GOAL — Man City', detail: 'The Etihad erupts.', meta: { scorer: 'Haaland' } },
  { t: 'var', label: 'VAR check', sub: 'Review', team: 'away', title: 'VAR Check', detail: 'Possible incident in the box.' },
  { t: 'sub', label: 'Substitution', sub: 'Change', team: 'home', title: 'Substitution', detail: 'Fresh legs on.' },
  { t: 'yellow', label: 'Yellow card', sub: 'Booking', team: 'away', title: 'Yellow card', detail: 'Cynical foul.' },
  { t: 'motm', label: 'Man of the Match', sub: 'Vote', title: 'Man of the Match', meta: { opts: ['Haaland', 'Rodri', 'Foden'] } },
  { t: 'poll', label: 'Push poll', sub: 'To chat', title: 'Fan poll', meta: { q: 'Who’s City’s standout?', opts: ['Haaland', 'Rodri', 'Foden'] } },
  { t: 'question', label: 'Ask question', sub: 'To chat', title: 'Moderator asks', meta: { q: 'Your score prediction? 👀' } },
  { t: 'clear-prompt', label: 'Clear prompt', sub: 'Remove' },
  { t: 'announce', label: 'Announcement', sub: 'Club', title: 'Announcement', detail: 'Message from the club.' },
  { t: 'flash-sale', label: 'Flash sale', sub: 'Shop', title: 'Flash drop', detail: '20% off — 10 minutes.' },
  { t: 'reaction', label: 'Feature reaction', sub: 'Reels', title: 'Featured reaction', detail: 'A fan reel is live.' },
];

export function ControlRoom() {
  const { id = '' } = useParams();
  const panel = useMemo(() => getPanel(id) ?? defaultPanel(), [id]);
  const script = SCRIPTS[panel.scriptId] ?? matchdayScript;

  const [mode, setMode] = useState<RunMode>('operator');
  const md = useMatchday(panel.match, script, { mode, autostart: false });

  // Broadcast state to the fan monitor + any connected device.
  const busRef = useRef<ReturnType<typeof createBus> | null>(null);
  useEffect(() => {
    const bus = createBus(panel.id);
    busRef.current = bus;
    const off = bus.subscribe((m) => {
      if (m.type === 'requestState') bus.send({ type: 'state', state: md.state });
    });
    return () => {
      off();
      bus.dispose();
    };
  }, [panel.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    busRef.current?.send({ type: 'state', state: md.state });
  }, [md.state]);

  const fanUrl = `${location.origin}${import.meta.env.BASE_URL}p/${panel.id}`;
  const [qr, setQr] = useState('');
  useEffect(() => {
    QRCode.toDataURL(fanUrl, { margin: 1, width: 240, color: { dark: '#201c17', light: '#ffffff' } }).then(setQr);
  }, [fanUrl]);

  return (
    <div className="console">
      <div className="abar">
        <Link className="btn btn--ghost" to="/studio">← Studio</Link>
        <div className="abar__t">Control Room · {panel.name}</div>
        <a className="btn btn--sm" href={fanUrl} target="_blank" rel="noreferrer">↗ Open fan view</a>
      </div>

      <div className="card deploy">
        <div className="deploy__qr">{qr && <img src={qr} alt="QR" />}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 750 }}>Deploy to fans</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 2 }}>Scan or share the link — it plays on its own, and follows you live.</div>
          <div className="deploy__link">
            <input readOnly value={fanUrl} onFocus={(e) => e.currentTarget.select()} />
            <button className="btn btn--primary btn--sm" onClick={() => navigator.clipboard?.writeText(fanUrl)}>Copy</button>
          </div>
        </div>
      </div>

      <div className="console__grid">
        <div className="mc">
          <div className="card mc__live">
            <span className="statusdot" style={{ background: md.state.live ? 'var(--live)' : 'var(--text-4)' }} />
            <div style={{ flex: 1 }}>
              <div className="mc__state">{phaseName(md.state.phase)}</div>
              <div className="mc__clock">{md.state.minuteLabel} · {md.state.score.home}–{md.state.score.away}</div>
            </div>
          </div>

          <div className="card mcsec">
            <div className="mcsec__t">Mode</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="seg">
                <button className={mode === 'auto' ? 'on' : ''} onClick={() => setMode('auto')}>Auto-run</button>
                <button className={mode === 'operator' ? 'on' : ''} onClick={() => setMode('operator')}>Manual</button>
              </div>
              {mode === 'auto' && (
                <>
                  <button className="btn btn--sm" onClick={() => (md.running ? md.pause() : md.play())}>{md.running ? '❚❚ Pause' : '▶ Play'}</button>
                  <button className="btn btn--sm" onClick={md.restart}>↺ Restart</button>
                </>
              )}
            </div>
            {mode === 'operator' && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 10 }}>Manual — you drive the state and events below.</div>}
          </div>

          <div className="card mcsec">
            <div className="mcsec__t">Sessions</div>
            <div className="grid2">
              {panel.sessions.map((s) => (
                <button key={s.id} className={`ctrl${md.state.phase === s.phase ? ' on' : ''}`} onClick={() => md.jumpToPhase(s.phase)}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="card mcsec">
            <div className="mcsec__t">Trigger event</div>
            <div className="grid2">
              {TRIGGERS.map((tr) => (
                <button key={tr.label} className="trig press" onClick={() => md.fire({ type: tr.t, team: tr.team, title: tr.title, detail: tr.detail, meta: tr.meta })}>
                  {tr.label}
                  <small>{tr.sub}</small>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="monitor">
          <div className="monitor__bar"><span className="livedot" style={{ color: 'var(--live)' }} /> Live monitor — what fans see</div>
          <div className="monitor__frame">
            <iframe title="Live monitor" src={fanUrl} />
          </div>
        </div>
      </div>
    </div>
  );
}

function phaseName(p: string) {
  return { idle: 'Idle', pre: 'Pre-match', live: 'Live', break: 'Half-time', post: 'Full-time' }[p] ?? p;
}
