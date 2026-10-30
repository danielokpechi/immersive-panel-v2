// Internal demo: the standalone, full-window cut of the Connect demo for sales calls
// and walkthroughs. Mounted at /internal-demo. It is a copy of src/connect-demo
// (the Book a Demo embed stays exactly as it is) with these changes:
//  - Opens in manual mode; Autoplay runs the tour and can be stopped. In manual,
//    both apps are fully clickable and Back / Next / Restart step through the
//    tour by chapter. During autoplay any real click,
//    key press or scroll inside either app hands control to the presenter.
//  - The tour ends on the operator's match analytics and stays there (Replay
//    instead of looping).
//  - No fake browser window: a slim top bar, then the Studio and the fan phone
//    filling the window. Below STACK px wide the phone stacks under the Studio.
// The operator is the internal-demo Studio copy (/internal-demo/studio/, with the
// tabbed analytics); the fan view is the unchanged /c/voltford/.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BASE } from '../base';
import { FEATURES } from '../features';

const STUDIO_BASE_W = 1000; // the Studio renders at least this wide (virtual px), then scales
const PHONE_W = 393;
const PHONE_H = 852;
const PHONE_PAD = 6;     // phone bezel
const LABEL_H = 28;      // column label + gap above each app
const GAP = 20;
const STACK = 900;       // below this content width the fan phone stacks under the Studio
const FAN_STORE_KEY = 'connect-fan:voltford:v1';

// ---- the guided tour, in chapters ----
type Step = {
  f: 'studio' | 'fan';
  match?: RegExp;          // first <button> whose trimmed text matches
  sel?: string;            // or: first element matching this CSS selector
  fill?: string;           // type this into the matched/sel element (an input)
  chatSend?: string[];     // send these messages through the current composer
  scrollTop?: boolean;
  scrollCenter?: boolean;
  click?: boolean;
  dwell: number;
  note: string;
  crews?: boolean;         // Crews step: skipped while Crews is paused (src/features.ts)
};
type Chapter = { label: string; steps: Step[] };

const ALL_CHAPTERS: Chapter[] = [
  { label: 'Panels', steps: [
    { f: 'studio', match: /^Live\s+\d/, click: true, dwell: 950, note: 'Operator · filter to the live panels' },
    { f: 'studio', match: /^All\s+\d/, click: true, dwell: 800, note: 'Operator · every panel, authored once' },
  ] },
  { label: 'Create a panel', steps: [
    { f: 'studio', match: /^New panel$/, click: true, dwell: 950, note: 'Operator · create a new panel' },
    { f: 'studio', match: /^In-person event/, click: true, dwell: 850, note: 'Operator · choose the panel type' },
    { f: 'studio', match: /^Continue$/, click: true, dwell: 750, note: 'Operator · next' },
    { f: 'studio', match: /^Away game/, click: true, dwell: 900, note: 'Operator · pick a template' },
    { f: 'studio', match: /^Continue$/, click: true, dwell: 750, note: 'Operator · next' },
    { f: 'studio', match: /^Predictions/, click: true, dwell: 900, note: 'Operator · choose what fans see' },
    { f: 'studio', match: /^Continue$/, click: true, dwell: 800, note: 'Operator · name it and set the look' },
    { f: 'studio', sel: 'input[placeholder="Voltford at Home"]', fill: 'Voltford Virtual Tour', dwell: 600, note: 'Operator · name the panel' },
    { f: 'studio', sel: 'textarea', fill: 'A 360° virtual tour of the Arc — chat, Pick & Win, rewards and the shop.', dwell: 700, note: 'Operator · write the description' },
    { f: 'studio', match: /^Create panel$/, click: true, dwell: 1050, note: 'Operator · panel created' },
  ] },
  { label: 'Go live', steps: [
    { f: 'studio', match: /^Start session$/, click: true, dwell: 1050, note: 'Operator · start the live session' },
    { f: 'studio', match: /^Approve$/, click: true, dwell: 950, note: 'Operator · moderate the fan chat' },
    { f: 'studio', match: /^Push to fans$/, click: true, dwell: 1050, note: 'Operator · push a poll live to fans' },
    { f: 'studio', match: /^End session$/, click: true, dwell: 950, note: 'Operator · end the session' },
  ] },
  { label: 'Edit the look', steps: [
    { f: 'studio', sel: 'button[aria-label="Panel options"]', click: true, dwell: 650, note: 'Operator · open panel options' },
    { f: 'studio', match: /^Edit panel$/, click: true, dwell: 900, note: 'Operator · edit the panel' },
    { f: 'studio', match: /^Home colours$/, click: true, dwell: 900, note: 'Operator · switch to the on-brand home kit' },
    { f: 'studio', match: /^Save changes$/, click: true, dwell: 950, note: 'Operator · changes saved' },
  ] },
  { label: 'Fan chat', steps: [
    { f: 'fan', sel: 'button[aria-label="Expand chat"]', click: true, dwell: 950, note: 'Fan view · open live Fan Chat' },
    { f: 'fan', chatSend: ['Up the Volts! 💜⚡', 'Who scores first today?'], dwell: 1050, note: 'Fan view · join the conversation' },
    { f: 'fan', sel: 'button[aria-label="Collapse chat"]', click: true, dwell: 800, note: 'Fan view · back to the panel' },
  ] },
  { label: 'Ask IRIS', steps: [
    { f: 'fan', sel: 'button[aria-label="Ask IRIS"]', click: true, dwell: 950, note: 'Fan view · ask IRIS, the AI assistant' },
    { f: 'fan', chatSend: ['When is the next home game?'], dwell: 1800, note: 'Fan view · IRIS answers instantly' },
    { f: 'fan', sel: 'button[aria-label="Back"], button[aria-label="Close"]', click: true, dwell: 600, note: 'Fan view · done with IRIS' },
    { f: 'fan', sel: 'button[aria-label="Back"], button[aria-label="Close"]', click: true, dwell: 800, note: 'Fan view · back to the panel' },
  ] },
  { label: 'Crews', steps: [
    { crews: true, f: 'fan', match: /^Join Crew$/, scrollCenter: true, click: true, dwell: 950, note: 'Fan view · open Crews' },
    { crews: true, f: 'fan', sel: 'button.tile', click: true, dwell: 950, note: 'Fan view · open a crew' },
    { crews: true, f: 'fan', chatSend: ["Who's travelling Saturday? 🚆", 'Save me a seat!'], dwell: 1050, note: 'Fan view · chat with your crew' },
    { crews: true, f: 'fan', sel: 'button[aria-label="Back to crews"]', click: true, dwell: 750, note: 'Fan view · back to Crews' },
    { crews: true, f: 'fan', sel: 'button[aria-label="Back"]', click: true, dwell: 800, note: 'Fan view · back to the panel' },
  ] },
  { label: 'Shop', steps: [
    { f: 'fan', match: /^Shop/, scrollCenter: true, click: true, dwell: 1050, note: 'Fan view · open the Shop' },
    { f: 'fan', match: /^Buy now$/, scrollCenter: true, click: true, dwell: 950, note: 'Fan view · add to basket' },
    { f: 'fan', sel: 'button[aria-label="Back"]', click: true, dwell: 700, note: 'Fan view · back to the panel' },
  ] },
  { label: 'Reads', steps: [
    { f: 'fan', match: /Rinaldi/, scrollCenter: true, click: true, dwell: 1300, note: 'Fan view · read a match report' },
    { f: 'fan', sel: 'button[aria-label="Back"]', click: true, dwell: 800, note: 'Fan view · back to the panel' },
    { f: 'fan', scrollTop: true, dwell: 1000, note: 'Fan view · the full matchday panel' },
  ] },
  // The finale: the operator's live match analytics. The tour stops here.
  { label: 'Analytics', steps: [
    { f: 'studio', sel: 'button[aria-label="Stats for Voltford at Home"]', click: true, dwell: 1700, note: 'Operator · live match analytics, Voltford v Kingsmere' },
    { f: 'studio', match: /^Engagement$/, click: true, dwell: 1900, note: 'Analytics · chat, polls, predictions and IRIS' },
    { f: 'studio', match: /^Commerce & sponsors$/, click: true, dwell: 1900, note: 'Analytics · orders, the flash sale and sponsors' },
    { f: 'studio', match: /^This match$/, click: true, dwell: 400, note: 'Analytics · the whole matchday at a glance' },
  ] },
];
const CHAPTERS = ALL_CHAPTERS
  .map((c) => ({ ...c, steps: c.steps.filter((st) => FEATURES.crews || !st.crews) }))
  .filter((c) => c.steps.length);
// Flattened, with each step's chapter index, so position is one number.
const STEPS = CHAPTERS.flatMap((c, ci) => c.steps.map((s) => ({ ...s, ch: ci })));
const N = STEPS.length;
const chapterStart = (ci: number) => STEPS.findIndex((s) => s.ch === ci);
const chapterOf = (pos: number) => (pos >= N ? CHAPTERS.length : STEPS[pos].ch);

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const SRC = { studio: BASE + 'internal-demo/studio/', fan: BASE + 'c/voltford/' };
const DONE_NOTE = 'Tour complete · explore freely, or press Replay';
// Start the fan view fresh on every load (same origin as the iframes, so this
// clears their saved chat and basket before they mount).
if (typeof window !== 'undefined') { try { localStorage.removeItem(FAN_STORE_KEY); } catch { /* ignore */ } }

type Mode = 'auto' | 'manual' | 'jump';
type Ctl = { cancelled: boolean };
type Engine = { play: () => void; stop: () => void; next: () => void; back: () => void; restart: (auto?: boolean) => void };

export default function InternalDemo() {
  const studioRef = useRef<HTMLIFrameElement | null>(null);
  const fanRef = useRef<HTMLIFrameElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const rippleRef = useRef<HTMLDivElement | null>(null);
  const engine = useRef<Engine | null>(null);

  const [mode, setMode] = useState<Mode>('manual');
  const [pos, setPos] = useState(0);
  const [note, setNote] = useState('Manual · click around both apps, or press Autoplay to run the tour');
  const [L, setL] = useState({ stacked: false, ps: 0.8, opW: 900, opH: 600, sOp: 0.8 });
  const stackedRef = useRef(false); stackedRef.current = L.stacked;

  // ---- layout: fill the window ----
  useLayoutEffect(() => {
    const el = bodyRef.current; if (!el) return;
    const fit = () => {
      const cs = getComputedStyle(el);
      const W = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const vh = window.innerHeight;
      if (W < STACK) {
        // Stacked: Studio full width on top, the phone below; the page scrolls vertically.
        const sOp = Math.min(1, Math.max(0.3, W / STUDIO_BASE_W));
        const opH = Math.round(Math.min(vh * 0.72, Math.max(380, W * 0.78)));
        const ps = Math.min(1, (vh * 0.86 - LABEL_H - 2 * PHONE_PAD) / PHONE_H, (W - 2 * PHONE_PAD) / PHONE_W);
        setL({ stacked: true, ps: Math.max(0.4, ps), opW: W, opH, sOp });
        return;
      }
      const H = el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      // The phone keeps true proportions and scales with the window height…
      const ps = Math.min(1.1, Math.max(0.42, (H - LABEL_H - 2 * PHONE_PAD) / PHONE_H));
      const phoneW = PHONE_W * ps + 2 * PHONE_PAD;
      // …and the Studio takes all the remaining width and height.
      const opW = Math.floor(W - phoneW - GAP);
      const opH = Math.floor(H - LABEL_H);
      const sOp = Math.min(1, Math.max(0.45, opW / STUDIO_BASE_W));
      setL({ stacked: false, ps, opW, opH, sOp });
    };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el);
    window.addEventListener('resize', fit);
    return () => { ro.disconnect(); window.removeEventListener('resize', fit); };
  }, []);

  // ---- the tour engine ----
  useEffect(() => {
    let alive = true;
    let raf = 0;
    let ctl: Ctl = { cancelled: false };
    let at = 0;               // index of the next step to run
    let modeNow: Mode = 'manual';
    const cur = { x: window.innerWidth * 0.4, y: window.innerHeight * 0.5 };
    const apply = () => { const c = cursorRef.current; if (c) c.style.transform = `translate(${cur.x}px, ${cur.y}px)`; };
    apply();

    const setM = (m: Mode) => { modeNow = m; setMode(m); cursorRef.current?.classList.toggle('id-cursor-on', m === 'auto'); };
    const setAt = (n: number) => { at = n; setPos(n); };
    const fresh = () => { ctl.cancelled = true; cancelAnimationFrame(raf); ctl = { cancelled: false }; return ctl; };

    const ease = (p: number) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
    const docOf = (f: 'studio' | 'fan') => {
      const fr = (f === 'studio' ? studioRef : fanRef).current;
      try { return { fr, doc: fr?.contentDocument ?? null }; } catch { return { fr, doc: null }; }
    };
    const scrollerOf = (doc: Document) =>
      (doc.querySelector('.connect-phone .scroll') as HTMLElement | null) ?? (doc.querySelector('.scroll') as HTMLElement | null);
    const findBtn = (doc: Document, re: RegExp) =>
      [...doc.querySelectorAll<HTMLButtonElement>('button')].find((b) => re.test((b.textContent || '').trim())) ?? null;
    const findEl = (doc: Document, s: Step): Element | null =>
      s.sel ? doc.querySelector(s.sel) : s.match ? findBtn(doc, s.match) : null;
    const pointOf = (fr: HTMLIFrameElement, el: Element) => {
      const ir = fr.getBoundingClientRect();
      const sx = ir.width / (fr.offsetWidth || 1), sy = ir.height / (fr.offsetHeight || 1);
      const r = el.getBoundingClientRect();
      return { x: ir.left + (r.left + r.width / 2) * sx, y: ir.top + (r.top + r.height / 2) * sy };
    };
    const setVal = (fr: HTMLIFrameElement, el: Element, text: string) => {
      const win = fr.contentWindow as (Window & typeof globalThis) | null; if (!win) return;
      const proto = el.tagName === 'TEXTAREA' ? win.HTMLTextAreaElement : win.HTMLInputElement;
      Object.getOwnPropertyDescriptor(proto.prototype, 'value')?.set?.call(el, text);
      el.dispatchEvent(new win.Event('input', { bubbles: true }));
    };
    const waitFor = async (c: Ctl, get: () => Element | null, tries = 10, every = 300) => {
      for (let i = 0; i < tries && alive && !c.cancelled; i++) { const el = get(); if (el) return el; await sleep(every); }
      return null;
    };

    // Animated run of one step: the cursor glides, clicks and types.
    const animate = async (c: Ctl, s: Step) => {
      const live = () => alive && !c.cancelled;
      const tween = (to: { x: number; y: number }, dur: number) => new Promise<void>((res) => {
        if (!isFinite(to.x) || !isFinite(to.y)) return res();
        const from = { ...cur }, t0 = performance.now();
        const frame = (now: number) => {
          if (!live()) return res();
          const p = Math.min(1, (now - t0) / dur), e = ease(p);
          cur.x = from.x + (to.x - from.x) * e; cur.y = from.y + (to.y - from.y) * e;
          apply();
          if (p < 1) raf = requestAnimationFrame(frame); else res();
        };
        raf = requestAnimationFrame(frame);
      });
      const ripple = () => {
        const r = rippleRef.current; if (!r) return;
        r.style.transform = `translate(${cur.x}px, ${cur.y}px)`;
        r.classList.remove('id-ripple-go'); void r.offsetWidth; r.classList.add('id-ripple-go');
      };
      const click = async (fr: HTMLIFrameElement, el: Element, dur = 850) => {
        await tween(pointOf(fr, el), dur); if (!live()) return;
        ripple(); await sleep(130); if (!live()) return;
        (el as HTMLElement).click(); await sleep(250);
      };
      const typeChars = async (fr: HTMLIFrameElement, el: Element, text: string, per: number) => {
        (el as HTMLElement).focus?.({ preventScroll: true });
        let acc = '';
        for (const ch of text) { if (!live()) return; acc += ch; setVal(fr, el, acc); await sleep(per + Math.random() * 45); }
      };

      const { fr, doc } = docOf(s.f);
      if (!fr || !doc) return;
      // Stacked layout: bring the app the step uses into view first.
      if (stackedRef.current) {
        const r = fr.getBoundingClientRect();
        if (r.top < 0 || r.bottom > window.innerHeight) { fr.scrollIntoView({ block: 'center', behavior: 'smooth' }); await sleep(500); }
      }
      if (s.scrollTop) {
        scrollerOf(doc)?.scrollTo({ top: 0, behavior: 'smooth' });
        await sleep(480);
        const ir = fr.getBoundingClientRect();
        await tween({ x: ir.left + ir.width / 2, y: ir.top + 120 }, 820);
        setNote(s.note); await sleep(s.dwell); return;
      }
      if (s.chatSend) {
        setNote(s.note);
        for (const text of s.chatSend) {
          if (!live()) return;
          const input = doc.querySelector('input.pill-input'), send = doc.querySelector('button[aria-label="Send"]');
          if (!input || !send) break;
          await tween(pointOf(fr, input), 650);
          await typeChars(fr, input, text, 46); await sleep(250);
          if (!live()) return;
          await click(fr, send, 420);
          await sleep(650);
        }
        await sleep(s.dwell); return;
      }
      const el = await waitFor(c, () => findEl(doc, s));
      if (!el || !live()) return;
      if (s.scrollCenter) {
        const sc = scrollerOf(doc);
        if (sc) {
          const er = el.getBoundingClientRect(), sr = sc.getBoundingClientRect();
          sc.scrollTo({ top: sc.scrollTop + (er.top - sr.top) - (sc.clientHeight / 2 - er.height / 2), behavior: 'smooth' });
          await sleep(620);
        }
      } else if (s.f === 'studio') {
        // The Studio page itself scrolls: make sure the target is on screen.
        const r = el.getBoundingClientRect(), vh = fr.contentWindow?.innerHeight ?? 0;
        if (r.top < 0 || r.bottom > vh) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); await sleep(550); }
      }
      if (!live()) return;
      setNote(s.note);
      if (s.fill !== undefined) {
        await tween(pointOf(fr, el), 750); if (!live()) return;
        ripple(); await sleep(120);
        await typeChars(fr, el, s.fill, 58); await sleep(300);
      } else if (s.click) {
        await click(fr, el);
      } else {
        await tween(pointOf(fr, el), 850);
      }
      await sleep(s.dwell);
    };

    // Instant run of one step (no cursor), used to fast-forward when jumping back.
    const instant = async (c: Ctl, s: Step) => {
      const { fr, doc } = docOf(s.f);
      if (!fr || !doc) return;
      if (s.scrollTop) { scrollerOf(doc)?.scrollTo({ top: 0 }); return; }
      if (s.chatSend) {
        for (const text of s.chatSend) {
          const input = await waitFor(c, () => doc.querySelector('input.pill-input'), 20, 120);
          const send = doc.querySelector('button[aria-label="Send"]') as HTMLElement | null;
          if (!input || !send || c.cancelled) return;
          setVal(fr, input, text); await sleep(60); send.click(); await sleep(260);
        }
        return;
      }
      const el = await waitFor(c, () => findEl(doc, s), 20, 120);
      if (!el || c.cancelled) return;
      if (s.fill !== undefined) setVal(fr, el, s.fill);
      else if (s.click) (el as HTMLElement).click();
      await sleep(180);
    };

    const reload = (fr: HTMLIFrameElement | null) => new Promise<void>((res) => {
      if (!fr) return res();
      const done = () => { fr.removeEventListener('load', done); clearTimeout(t); res(); };
      const t = setTimeout(done, 10000);
      fr.addEventListener('load', done);
      try { fr.contentWindow?.location.reload(); } catch { done(); }
    });
    const ready = async (c: Ctl) => {
      await waitFor(c, () => docOf('studio').doc?.querySelector('.cs button') ?? null, 60);
      await waitFor(c, () => docOf('fan').doc?.querySelector('.connect-phone') ?? null, 60);
    };
    const resetApps = async (c: Ctl) => {
      try { fanRef.current?.contentWindow?.localStorage?.removeItem(FAN_STORE_KEY); } catch { /* ignore */ }
      await Promise.all([reload(fanRef.current), reload(studioRef.current)]);
      await ready(c);
    };

    // Run animated steps from `at` up to (not including) `until`.
    const runTo = async (c: Ctl, until: number) => {
      while (at < until && alive && !c.cancelled) {
        await animate(c, STEPS[at]);
        if (c.cancelled || !alive) return false;
        setAt(at + 1);
      }
      return true;
    };

    const play = async () => {
      const c = fresh();
      if (at >= N) return restart(true);
      setM('auto');
      await sleep(250);
      if (await runTo(c, N)) finish();
    };
    const finish = () => { setM('manual'); setNote(DONE_NOTE); };
    const stop = () => {
      if (modeNow === 'manual') return;
      fresh(); setM('manual');
      setNote(`Manual · you're in control. ${at >= N ? 'Press Replay to start over.' : `Next: ${CHAPTERS[chapterOf(at)].label}`}`);
    };
    // Next: finish the current chapter (animated), then hold.
    const next = async () => {
      if (at >= N) return;
      const c = fresh(); setM('auto');
      const ci = chapterOf(at);
      const end = ci + 1 < CHAPTERS.length ? chapterStart(ci + 1) : N;
      const ok = await runTo(c, end);
      if (!ok) return;
      if (at >= N) return finish();
      setM('manual'); setNote(`Manual · next: ${CHAPTERS[chapterOf(at)].label}`);
    };
    // Jump to the start of a chapter: reset both apps and fast-forward silently.
    const jump = async (target: number) => {
      const c = fresh(); setM('jump');
      setNote(target ? `Jumping to ${CHAPTERS[STEPS[target].ch].label}…` : 'Resetting the demo…');
      await resetApps(c); if (c.cancelled) return;
      setAt(0);
      for (let i = 0; i < target && !c.cancelled; i++) { await instant(c, STEPS[i]); setAt(i + 1); }
      if (c.cancelled) return;
      return c;
    };
    // Back: to the start of this chapter, or of the previous one if already there.
    const back = async () => {
      let ci = chapterOf(at);
      if (at >= N) ci = CHAPTERS.length - 1;
      else if (at === chapterStart(ci)) ci = Math.max(0, ci - 1);
      const target = chapterStart(ci);
      if (await jump(target)) { setM('manual'); setNote(`Manual · at ${CHAPTERS[ci].label}. Press Next or Autoplay.`); }
    };
    // Restart resets to the beginning in manual; Replay (at the end) also runs the tour.
    const restart = async (auto = false) => {
      if (!(await jump(0))) return;
      if (auto) play();
      else { setM('manual'); setNote('Manual · back at the start. Click around, or press Autoplay'); }
    };

    engine.current = { play, stop, next, back, restart };

    // A real click, key press or scroll inside either app hands control to the presenter.
    const onUser = (e: Event) => { if (e.isTrusted && modeNow === 'auto') stop(); };
    const hook = (fr: HTMLIFrameElement | null) => {
      if (!fr) return () => {};
      const attach = () => {
        try {
          const d = fr.contentDocument; if (!d) return;
          for (const t of ['pointerdown', 'keydown', 'wheel', 'touchstart']) d.addEventListener(t, onUser, { capture: true, passive: true });
        } catch { /* ignore */ }
      };
      attach();
      fr.addEventListener('load', attach);
      return () => fr.removeEventListener('load', attach);
    };
    const unhook = [hook(studioRef.current), hook(fanRef.current)];

    return () => { alive = false; ctl.cancelled = true; cancelAnimationFrame(raf); unhook.forEach((u) => u()); };
  }, []);

  // Keyboard: space = play/stop, ←/→ = back/next (when focus is on the demo shell).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      const en = engine.current; if (!en) return;
      if (e.key === ' ') { e.preventDefault(); (modeRef.current === 'auto' ? en.stop : en.play)(); }
      else if (e.key === 'ArrowRight') en.next();
      else if (e.key === 'ArrowLeft') en.back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const modeRef = useRef(mode); modeRef.current = mode;

  // ---- UI ----
  const done = pos >= N && mode !== 'jump';
  const ci = Math.min(chapterOf(pos), CHAPTERS.length - 1);
  const busy = mode === 'jump';
  const ctlBtn = (label: string, onClick: () => void, opts: { primary?: boolean; disabled?: boolean; aria?: string; title?: string } = {}) => (
    <button type="button" onClick={onClick} disabled={opts.disabled} aria-label={opts.aria ?? label} title={opts.title}
      className={'id-btn' + (opts.primary ? ' id-btn-primary' : '')}>{label}</button>
  );

  const studioFrame = (
    <div style={{ ...S.opFrame, width: L.opW, height: L.opH }}>
      <iframe ref={studioRef} src={SRC.studio} title="BoltOS Studio"
        style={{ width: L.opW / L.sOp, height: (L.opH - 2) / L.sOp, border: 0, display: 'block', transform: `scale(${L.sOp})`, transformOrigin: 'top left' }} />
    </div>
  );
  const pw = Math.round(PHONE_W * L.ps), ph = Math.round(PHONE_H * L.ps);
  const fanPhone = (
    <div style={{ ...S.phone, padding: PHONE_PAD, borderRadius: Math.round(38 * L.ps) + 6 }}>
      <div style={{ width: pw, height: ph, borderRadius: Math.round(34 * L.ps), overflow: 'hidden', background: '#000' }}>
        <iframe ref={fanRef} src={SRC.fan} title="Voltford fan view"
          style={{ width: PHONE_W, height: PHONE_H, border: 0, display: 'block', transform: `scale(${L.ps})`, transformOrigin: 'top left' }} />
      </div>
    </div>
  );

  return (
    <div style={{ ...S.stage, ...(L.stacked ? S.stageStacked : null) }}>
      <style>{CSS}</style>

      <header className="id-top">
        <div className="id-brand">
          <span style={S.logoMark}>✦</span>
          <b style={{ fontSize: 16, letterSpacing: -0.2 }}>BoltOS Connect</b>
          <span style={S.midDot} /><span style={{ color: '#9A98A6', fontSize: 14, whiteSpace: 'nowrap' }}>Voltford · Matchday</span>
        </div>

        <div className="id-controls" role="toolbar" aria-label="Demo controls">
          <span className={'id-mode ' + (mode === 'auto' ? 'is-auto' : '')} aria-live="polite">
            <span className="id-mode-dot" />{mode === 'auto' ? 'Autoplay' : busy ? 'Loading' : done ? 'Complete' : 'Manual'}
          </span>
          {ctlBtn('‹ Back', () => engine.current?.back(), { disabled: busy || pos === 0, aria: 'Previous chapter', title: 'Previous chapter (←)' })}
          {mode === 'auto'
            ? ctlBtn('■ Stop', () => engine.current?.stop(), { primary: true, aria: 'Stop autoplay', title: 'Stop autoplay (space)' })
            : done
              ? ctlBtn('↻ Replay', () => engine.current?.restart(true), { primary: true, disabled: busy, aria: 'Replay the demo' })
              : ctlBtn('▶ Autoplay', () => engine.current?.play(), { primary: true, disabled: busy, aria: 'Start autoplay', title: 'Start autoplay (space)' })}
          {ctlBtn('Next ›', () => engine.current?.next(), { disabled: busy || done || mode === 'auto', aria: 'Next chapter', title: 'Play the next chapter (→)' })}
          {ctlBtn('Restart', () => engine.current?.restart(), { disabled: busy, aria: 'Restart the demo' })}
          <span className="id-chapter">{done ? `${CHAPTERS.length}/${CHAPTERS.length}` : `${ci + 1}/${CHAPTERS.length}`} · {CHAPTERS[ci].label}</span>
        </div>

        <span style={S.live}><span style={S.liveDot} />LIVE</span>
      </header>

      <div ref={bodyRef} style={L.stacked ? S.bodyStacked : S.body}>
        <section style={{ flex: 'none', minWidth: 0 }}>
          <div style={S.label}><span style={S.half} />OPERATOR <span style={S.labelMut}>· MATCHDAY STUDIO (WEB)</span></div>
          {studioFrame}
        </section>
        <section style={{ flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: L.stacked ? 'flex-start' : 'center' }}>
          <div style={{ ...S.label, alignSelf: L.stacked ? 'center' : 'flex-start' }}><span style={S.half} />FAN VIEW <span style={S.labelMut}>· SUPPORTERS</span></div>
          {fanPhone}
        </section>
        {busy && <div style={S.veil}><span style={S.veilPill}>{note}</span></div>}
      </div>

      <footer style={S.footer}>{note}</footer>

      <div ref={rippleRef} style={S.ripple} />
      <div ref={cursorRef} className="id-cursor" style={S.cursor}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path d="M5 3l14 7.5-6 1.6-2.4 5.9L5 3z" fill="#fff" stroke="#111" strokeWidth="1.1" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

const CSS = `
html,body{margin:0;background:#0A0A0F}
.id-cursor{opacity:0;transition:opacity .4s}
.id-cursor.id-cursor-on{opacity:1}
.id-ripple-go{animation:idRipple .5s ease-out}
@keyframes idRipple{from{opacity:.5;width:10px;height:10px;margin:-5px 0 0 -5px}to{opacity:0;width:52px;height:52px;margin:-26px 0 0 -26px}}
.id-top{flex:none;display:flex;align-items:center;justify-content:space-between;gap:10px 16px;flex-wrap:wrap;padding:8px 20px;border-bottom:1px solid rgba(255,255,255,0.07);background:#0E0E15}
.id-brand{display:flex;align-items:center;gap:11px;min-width:0}
.id-controls{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:center}
.id-btn{font:inherit;font-size:13px;font-weight:600;height:32px;padding:0 13px;border-radius:999px;cursor:pointer;color:#E6E4EE;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.14);white-space:nowrap;transition:background .15s,border-color .15s,transform .06s}
.id-btn:hover:not(:disabled){background:rgba(255,255,255,0.09);border-color:rgba(255,255,255,0.24)}
.id-btn:active:not(:disabled){transform:translateY(1px)}
.id-btn:disabled{opacity:.38;cursor:default}
.id-btn:focus-visible{outline:2px solid #8B3DF5;outline-offset:2px}
.id-btn-primary{background:#8B3DF5;border-color:#8B3DF5;color:#fff;min-width:92px}
.id-btn-primary:hover:not(:disabled){background:#9B55F7;border-color:#9B55F7}
.id-mode{display:inline-flex;align-items:center;gap:7px;height:32px;padding:0 12px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:.3px;color:#B8B6C4;background:rgba(255,255,255,0.05);margin-right:4px;min-width:92px;box-sizing:border-box}
.id-mode-dot{width:7px;height:7px;border-radius:50%;background:#77748A}
.id-mode.is-auto{color:#D9C8FF;background:rgba(139,61,245,0.16)}
.id-mode.is-auto .id-mode-dot{background:#A46BFF;box-shadow:0 0 8px #A46BFF;animation:idPulse 1.4s ease-in-out infinite}
@keyframes idPulse{50%{opacity:.35}}
.id-chapter{font-size:12.5px;color:#8A879A;margin-left:6px;white-space:nowrap;font-variant-numeric:tabular-nums}
@media (max-width:700px){.id-top{justify-content:center}.id-chapter{flex-basis:100%;text-align:center;margin:2px 0 0}}
@media (prefers-reduced-motion:reduce){.id-mode.is-auto .id-mode-dot{animation:none}}
`;

const S: Record<string, React.CSSProperties> = {
  stage: {
    height: '100dvh', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', overflow: 'hidden',
    background: 'radial-gradient(1200px 700px at 50% -10%, #15151f 0%, #0a0a0f 55%, #060609 100%)',
    fontFamily: "'Manrope',system-ui,-apple-system,sans-serif", color: '#F3F2F7',
  },
  stageStacked: { height: 'auto', minHeight: '100dvh', overflowX: 'hidden', overflowY: 'visible' },
  logoMark: { width: 28, height: 28, borderRadius: 8, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(145deg,#8B3DF5,#5B1FB0)', color: '#fff', fontSize: 14 },
  midDot: { width: 4, height: 4, borderRadius: '50%', background: '#44424E', flex: 'none' },
  live: { display: 'inline-flex', alignItems: 'center', gap: 8, height: 28, padding: '0 13px', borderRadius: 999, flex: 'none', border: '1px solid rgba(45,200,120,0.4)', color: '#5EE0A0', fontSize: 12, fontWeight: 700, letterSpacing: 0.4 },
  liveDot: { width: 7, height: 7, borderRadius: '50%', background: '#2DC878', boxShadow: '0 0 10px #2DC878' },
  body: { position: 'relative', flex: 1, minHeight: 0, display: 'flex', gap: GAP, alignItems: 'stretch', justifyContent: 'center', padding: '10px 16px 4px', overflow: 'hidden' },
  bodyStacked: { position: 'relative', display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'stretch', padding: '10px 16px 8px' },
  label: { height: LABEL_H - 10, marginBottom: 10, whiteSpace: 'nowrap', fontSize: 11, fontWeight: 700, letterSpacing: 1.4, color: '#C9C7D4', display: 'flex', alignItems: 'center', gap: 9, textTransform: 'uppercase' },
  labelMut: { color: '#6E6C7A', fontWeight: 600 },
  half: { width: 12, height: 12, borderRadius: '50%', background: 'linear-gradient(90deg,#C9C7D4 50%, transparent 50%)', border: '1.5px solid #C9C7D4', boxSizing: 'border-box', flex: 'none' },
  opFrame: { boxSizing: 'border-box', background: '#0B0B12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' },
  phone: { background: 'linear-gradient(160deg,#2a2a33,#111118)', boxShadow: '0 30px 70px -24px rgba(0,0,0,0.9), inset 0 0 0 1.5px rgba(255,255,255,0.06)' },
  footer: { flex: 'none', textAlign: 'center', color: '#8A879A', fontSize: 12.5, padding: '4px 16px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  veil: { position: 'absolute', inset: 0, background: 'rgba(6,6,9,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5, backdropFilter: 'blur(2px)' },
  veilPill: { padding: '10px 18px', borderRadius: 999, background: '#16161F', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13.5, color: '#D9D7E3' },
  cursor: { position: 'fixed', left: 0, top: 0, zIndex: 9999, pointerEvents: 'none', filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.5))' },
  ripple: { position: 'fixed', left: 0, top: 0, zIndex: 9998, pointerEvents: 'none', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.9)', width: 0, height: 0, opacity: 0 },
};
