// ═══════════════════════════════════════════════════════════════════════
// useMatchday — runs a match. In 'auto' mode a virtual clock plays the
// script (the link "just goes"); in 'operator' mode the clock holds and the
// operator fires events by hand. Both funnel through the same reducer, and
// ambient chat keeps the room alive. This is the deployable, non-simulated
// core: point `script` at a live feed later and the UI is unchanged.
// ═══════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Match, MatchdayScript, MatchEvent, MatchState, RunMode, Session } from '../domain/types';
import { chatPool } from '../domain/seed';
import { applyEvent, initialMatchState, minuteLabel, pushChat } from './reducer';

export interface Matchday {
  state: MatchState;
  running: boolean;
  speed: number;
  mode: RunMode;
  play: () => void;
  pause: () => void;
  restart: () => void;
  setSpeed: (s: number) => void;
  fire: (ev: Omit<MatchEvent, 'id' | 'atSec'> & { atSec?: number }) => void;
  jumpToPhase: (phase: Session['phase']) => void;
  sendChat: (text: string) => void;
}

let uid = 0;

export function useMatchday(
  match: Match,
  script: MatchdayScript,
  opts: { mode?: RunMode; speed?: number; autostart?: boolean } = {},
): Matchday {
  const mode = opts.mode ?? 'auto';
  const [state, setState] = useState<MatchState>(initialMatchState);
  const [running, setRunning] = useState(mode === 'auto' && (opts.autostart ?? true));
  const [speed, setSpeed] = useState(opts.speed ?? 1);

  const clock = useRef(-30); // start 30s before kickoff so pre-match chat lands
  const fired = useRef<Set<string>>(new Set());
  const nextChat = useRef(4);
  const stateRef = useRef(state);
  stateRef.current = state;

  const applyOne = useCallback(
    (ev: MatchEvent) => setState((s) => applyEvent(s, ev, match)),
    [match],
  );

  // ── auto-run ticker ──
  useEffect(() => {
    if (mode !== 'auto' || !running) return;
    const iv = setInterval(() => {
      clock.current += 0.2 * speed;
      const t = clock.current;
      // fire any due script events, in order
      for (const ev of script.events) {
        if (ev.atSec <= t && !fired.current.has(ev.id)) {
          fired.current.add(ev.id);
          applyOne(ev);
        }
      }
      // reflect the running clock so the minute + pre-match countdown advance smoothly
      const ph = stateRef.current.phase;
      if (ph === 'live' || (ph === 'pre' && t < 0)) {
        setState((s) => ({ ...s, clockSec: t, minuteLabel: minuteLabel(t, s.phase) }));
      }
      // ambient chat during play
      if (ph === 'live' && t >= nextChat.current) {
        nextChat.current = t + 7 + Math.floor((t * 13) % 6);
        const line = chatPool[Math.floor((t * 7) % chatPool.length)];
        setState((s) => pushChat(s, line.author, line.text));
      }
      if (t >= script.durationSec + 4) setRunning(false);
    }, 200);
    return () => clearInterval(iv);
  }, [mode, running, speed, script, applyOne]);

  const play = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);
  const restart = useCallback(() => {
    clock.current = -30;
    fired.current = new Set();
    nextChat.current = 4;
    setState(initialMatchState());
    setRunning(mode === 'auto');
  }, [mode]);

  const fire: Matchday['fire'] = useCallback(
    (ev) => {
      const full: MatchEvent = { id: `op_${uid++}`, atSec: clock.current < 0 ? 0 : clock.current, ...ev };
      applyOne(full);
    },
    [applyOne],
  );

  // Operator jump: fire the phase-defining event so state + feed stay consistent.
  const jumpToPhase: Matchday['jumpToPhase'] = useCallback(
    (phase) => {
      const map: Record<string, MatchEvent['type']> = {
        pre: 'clear-prompt',
        live: 'kickoff',
        break: 'halftime',
        post: 'fulltime',
        idle: 'clear-prompt',
      };
      fire({ type: map[phase] ?? 'kickoff' });
    },
    [fire],
  );

  const sendChat: Matchday['sendChat'] = useCallback((text) => {
    if (!text.trim()) return;
    setState((s) => pushChat(s, 'You', text.trim(), true));
  }, []);

  return useMemo(
    () => ({ state, running, speed, mode, play, pause, restart, setSpeed, fire, jumpToPhase, sendChat }),
    [state, running, speed, mode, play, pause, restart, fire, jumpToPhase, sendChat],
  );
}
