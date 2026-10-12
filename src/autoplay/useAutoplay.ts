import { useEffect, useRef, useState } from 'react';
import { AUTOPLAY_TIMELINE, AUTOPLAY_IDLE_RESUME_MS, type AutoplayDispatch } from './timeline';

type Args = {
  enabled: boolean;
  applyState: (ms: string) => void;
  applyEventCmd: (kind: string) => void;
};

// Drives the scripted demo timeline through the panel's EXISTING operator
// dispatch. Any user click / tap / scroll / key pauses it; 15s of no
// interaction resumes it from where it left off. Fully inert when !enabled.
export function useAutoplay({ enabled, applyState, applyEventCmd }: Args): { interacting: boolean } {
  const [interacting, setInteracting] = useState(false);

  // Keep the latest dispatch closures so scheduled callbacks never go stale.
  const dispatchRef = useRef<AutoplayDispatch>({ state: () => {}, event: () => {} });
  dispatchRef.current = {
    state: (ms) => applyState(ms),
    event: (kind) => applyEventCmd(kind),
  };

  useEffect(() => {
    if (!enabled) return;

    let idx = 0;
    let timer: number | undefined;
    let idleTimer: number | undefined;
    let waitStart = 0;
    let waitMs = 0;
    let running = false;

    const schedule = (ms: number) => {
      waitStart = performance.now();
      waitMs = ms;
      timer = window.setTimeout(advance, ms);
    };
    const advance = () => {
      idx = (idx + 1) % AUTOPLAY_TIMELINE.length;
      AUTOPLAY_TIMELINE[idx].run(dispatchRef.current);
      schedule(AUTOPLAY_TIMELINE[idx].next);
    };
    const start = () => {
      running = true;
      idx = 0;
      AUTOPLAY_TIMELINE[0].run(dispatchRef.current);
      schedule(AUTOPLAY_TIMELINE[0].next);
    };
    const pause = () => {
      if (!running) return;
      running = false;
      if (timer !== undefined) { window.clearTimeout(timer); timer = undefined; }
      // Remember how much of the current wait remains, so resume continues it.
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
      }, AUTOPLAY_IDLE_RESUME_MS);
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
