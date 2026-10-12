import { useEffect, useRef, useState } from 'react';

// A generic scripted-loop driver for the marketing embed (?autoplay=1).
// The caller supplies `steps` (each runs a named action, then waits `next` ms),
// an `act` dispatcher that performs a named action, and an optional `init` that
// runs once before the loop. Any user click / tap / scroll / key pauses it;
// `idleResumeMs` of no interaction resumes it from where it left off. Fully
// inert when !enabled, and nothing here mutates app state directly.
export type AutoStep = { run: (act: (name: string) => void) => void; next: number };

type Args = {
  enabled: boolean;
  steps: AutoStep[];
  act: (name: string) => void;
  init?: () => void;
  idleResumeMs?: number;
};

export function useAutoplay({ enabled, steps, act, init, idleResumeMs = 15000 }: Args): { interacting: boolean } {
  const [interacting, setInteracting] = useState(false);

  // Keep the latest closures so scheduled callbacks never go stale.
  const actRef = useRef(act); actRef.current = act;
  const initRef = useRef(init); initRef.current = init;
  const stepsRef = useRef(steps); stepsRef.current = steps;

  useEffect(() => {
    if (!enabled) return;

    let idx = 0;
    let timer: number | undefined;
    let idleTimer: number | undefined;
    let waitStart = 0;
    let waitMs = 0;
    let running = false;
    const S = () => stepsRef.current;

    const schedule = (ms: number) => {
      waitStart = performance.now();
      waitMs = ms;
      timer = window.setTimeout(advance, ms);
    };
    const advance = () => {
      idx = (idx + 1) % S().length;
      S()[idx].run(actRef.current);
      schedule(S()[idx].next);
    };
    const start = () => {
      running = true;
      initRef.current?.();
      idx = 0;
      S()[0].run(actRef.current);
      schedule(S()[0].next);
    };
    const pause = () => {
      if (!running) return;
      running = false;
      if (timer !== undefined) { window.clearTimeout(timer); timer = undefined; }
      waitMs = Math.max(0, waitMs - (performance.now() - waitStart));
    };
    const resume = () => {
      if (running) return;
      running = true;
      schedule(waitMs);
    };

    const onInteract = () => {
      pause();
      setInteracting(true);
      if (idleTimer !== undefined) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        setInteracting(false);
        resume();
      }, idleResumeMs);
    };

    // scroll/wheel need capture (scroll doesn't bubble); pointer/touch/key don't.
    const listeners: Array<[string, boolean]> = [
      ['pointerdown', false], ['touchstart', false], ['keydown', false],
      ['wheel', true], ['scroll', true],
    ];
    listeners.forEach(([type, capture]) =>
      window.addEventListener(type, onInteract, { passive: true, capture }));

    start();

    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      if (idleTimer !== undefined) window.clearTimeout(idleTimer);
      listeners.forEach(([type, capture]) =>
        window.removeEventListener(type, onInteract, { capture }));
    };
  }, [enabled]);

  return { interacting: enabled && interacting };
}
