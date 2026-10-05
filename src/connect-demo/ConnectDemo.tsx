// Connect demo — the "connect.boltos.ai" showcase. The BoltOS Studio operator
// and the Arsenal fan view, both live in iframes, with one scripted cursor
// gliding point-to-point and driving real clicks (and typing) — the Arsenal cut
// of the Man City matchday-operator demo. Mounted at /connect-demo.
//
// The tour runs the whole product start to finish: the operator creates a panel,
// starts a live session, moderates & pushes to fans, edits it and views stats;
// the fan chats live, opens Crews, messages a crew, joins a new one, shops and
// reads. Both apps reset between loops so nothing piles up.
//
// Responsive: wide screens show the two side by side; phone-width becomes a
// swipeable, tabbed single panel (Fan view / Operator) the cursor flips between.
// Add ?mobile=1 to preview the phone layout on a desktop.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const STUDIO_W = 960;
const STUDIO_H = 660;
const PHONE_W = 393;
const PHONE_H = 852;
const NARROW = 760;
const FAN_STORE_KEY = 'arsenal-fan-page-2:v1';

// ---- the guided tour ----
type Step = {
  f: 'studio' | 'fan';
  match?: RegExp;          // first <button> whose trimmed text matches
  sel?: string;            // or: first element matching this CSS selector
  fill?: string;           // type this into the matched/sel element (an input)
  chatSend?: string[];     // send these messages through the current composer
  closeWizard?: boolean;
  scrollTop?: boolean;
  scrollCenter?: boolean;
  click?: boolean;
  dwell: number;
  note: string;
};
const STEPS: Step[] = [
  // ================= OPERATOR — the full panel lifecycle =================
  { f: 'studio', match: /^Live\s+\d/, click: true, dwell: 950, note: 'Operator · filter to the live panels' },
  { f: 'studio', match: /^All\s+\d/, click: true, dwell: 800, note: 'Operator · every panel, authored once' },
  // Create
  { f: 'studio', match: /^New panel$/, click: true, dwell: 950, note: 'Operator · create a new panel' },
  { f: 'studio', match: /^In-person event/, click: true, dwell: 850, note: 'Operator · choose the panel type' },
  { f: 'studio', match: /^Continue$/, click: true, dwell: 750, note: 'Operator · next' },
  { f: 'studio', match: /^Away game/, click: true, dwell: 900, note: 'Operator · pick a template' },
  { f: 'studio', match: /^Continue$/, click: true, dwell: 750, note: 'Operator · next' },
  { f: 'studio', match: /^Predictions/, click: true, dwell: 900, note: 'Operator · choose what fans see' },
  { f: 'studio', match: /^Continue$/, click: true, dwell: 800, note: 'Operator · name it and set the look' },
  { f: 'studio', sel: 'input[placeholder="Arsenal at Home"]', fill: 'Arsenal Virtual Tour', dwell: 600, note: 'Operator · name the panel' },
  { f: 'studio', sel: 'textarea', fill: 'A 360° virtual tour of the Emirates — chat, Pick & Win, rewards and the shop.', dwell: 700, note: 'Operator · write the description' },
  { f: 'studio', match: /^Create panel$/, click: true, dwell: 1050, note: 'Operator · panel created' },
  // Start the session + go live
  { f: 'studio', match: /^Start session$/, click: true, dwell: 1050, note: 'Operator · start the live session' },
  { f: 'studio', match: /^Approve$/, click: true, dwell: 950, note: 'Operator · moderate the fan chat' },
  { f: 'studio', match: /^Push to fans$/, click: true, dwell: 1050, note: 'Operator · push a poll live to fans' },
  { f: 'studio', match: /^End session$/, click: true, dwell: 950, note: 'Operator · end the session' },
  // Edit
  { f: 'studio', sel: 'button[aria-label="Panel options"]', click: true, dwell: 650, note: 'Operator · open panel options' },
  { f: 'studio', match: /^Edit panel$/, click: true, dwell: 900, note: 'Operator · edit the panel' },
  { f: 'studio', match: /^Home colours$/, click: true, dwell: 900, note: 'Operator · switch to the on-brand home kit' },
  { f: 'studio', match: /^Save changes$/, click: true, dwell: 950, note: 'Operator · changes saved' },
  // View stats
  { f: 'studio', sel: 'button[aria-label^="Stats for"]', click: true, dwell: 1200, note: 'Operator · view the panel stats' },
  { f: 'studio', sel: 'button[aria-label="Back"]', click: true, dwell: 850, note: 'Operator · back to the control deck' },

  // ================= FAN — chat, crews, shop, reads =================
  // Live chat
  { f: 'fan', sel: 'button[aria-label="Expand chat"]', click: true, dwell: 950, note: 'Fan view · open live Fan Chat' },
  { f: 'fan', chatSend: ['Up the Gunners! 🔴⚪', 'Who scores first today?'], dwell: 1050, note: 'Fan view · join the conversation' },
  { f: 'fan', sel: 'button[aria-label="Collapse chat"]', click: true, dwell: 800, note: 'Fan view · back to the panel' },
  // Ask IRIS (AI assistant) — the button at the top of the hero
  { f: 'fan', sel: 'button[aria-label="Ask IRIS"]', click: true, dwell: 950, note: 'Fan view · ask IRIS, the AI assistant' },
  { f: 'fan', chatSend: ['When is the next home game?'], dwell: 1800, note: 'Fan view · IRIS answers instantly' },
  { f: 'fan', sel: 'button[aria-label="Back"], button[aria-label="Close"]', click: true, dwell: 600, note: 'Fan view · done with IRIS' },
  { f: 'fan', sel: 'button[aria-label="Back"], button[aria-label="Close"]', click: true, dwell: 800, note: 'Fan view · back to the panel' },
  // Crews
  { f: 'fan', match: /^Join Crew$/, scrollCenter: true, click: true, dwell: 950, note: 'Fan view · open Crews' },
  { f: 'fan', sel: 'button.tile', click: true, dwell: 950, note: 'Fan view · open a crew' },
  { f: 'fan', chatSend: ["Who's travelling Saturday? 🚆", 'Save me a seat!'], dwell: 1050, note: 'Fan view · chat with your crew' },
  { f: 'fan', sel: 'button[aria-label="Back to crews"]', click: true, dwell: 750, note: 'Fan view · back to Crews' },
  { f: 'fan', match: /^Join$/, scrollCenter: true, click: true, dwell: 950, note: 'Fan view · discover a new crew' },
  { f: 'fan', match: /^Join crew$/, click: true, dwell: 1050, note: 'Fan view · join the crew' },
  { f: 'fan', chatSend: ['Buzzing to be here! ⚪🔴'], dwell: 950, note: 'Fan view · say hello' },
  { f: 'fan', sel: 'button[aria-label="Back to crews"]', click: true, dwell: 700, note: 'Fan view · back to Crews' },
  { f: 'fan', sel: 'button[aria-label="Back"]', click: true, dwell: 800, note: 'Fan view · back to the panel' },
  // Shop
  { f: 'fan', match: /^Shop/, scrollCenter: true, click: true, dwell: 1050, note: 'Fan view · open the Shop' },
  { f: 'fan', match: /^Buy now$/, scrollCenter: true, click: true, dwell: 950, note: 'Fan view · add to basket' },
  { f: 'fan', sel: 'button[aria-label="Back"]', click: true, dwell: 700, note: 'Fan view · back to the panel' },
  // Reads
  { f: 'fan', match: /Calafiori/, scrollCenter: true, click: true, dwell: 1300, note: 'Fan view · read a match report' },
  { f: 'fan', sel: 'button[aria-label="Back"]', click: true, dwell: 800, note: 'Fan view · back to the panel' },
  { f: 'fan', scrollTop: true, dwell: 1000, note: 'Fan view · the full matchday panel' },
];

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const preview = typeof location !== 'undefined' && new URLSearchParams(location.search).get('mobile') === '1';
// Base-aware iframe sources so the embed works at the site root (dev) and under a
// GitHub Pages sub-path (e.g. /immersive-panel-v2/arsenal/) alike.
// Trailing slash so each resolves to a directory-index index.html on GitHub Pages
// (no SPA fallback inside a subfolder); react-router matches the trailing slash.
const SRC = { studio: import.meta.env.BASE_URL + 'cstudio/', fan: import.meta.env.BASE_URL + 'c/arsenal/' };

export default function ConnectDemo() {
  const studioRef = useRef<HTMLIFrameElement | null>(null);
  const fanRef = useRef<HTMLIFrameElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const rippleRef = useRef<HTMLDivElement | null>(null);

  const [scale, setScale] = useState(0.5);
  const [note, setNote] = useState('Live embed — the operator and the fan panel, both running now');
  const [narrow, setNarrow] = useState(() => preview || (typeof window !== 'undefined' && window.innerWidth < NARROW));
  const SW = STUDIO_W; // the Studio only renders on wide screens now
  const narrowRef = useRef(narrow); narrowRef.current = narrow;

  // Layout from the content box's own width → identical on a real phone.
  useLayoutEffect(() => {
    const el = boxRef.current; if (!el) return;
    const measure = () => setNarrow(preview || el.clientWidth < NARROW);
    measure();
    const ro = new ResizeObserver(measure); ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fit the Studio iframe to its frame.
  useLayoutEffect(() => {
    const el = studioRef.current?.parentElement; if (!el) return;
    const fit = () => setScale((el.clientWidth || SW) / SW);
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el);
    return () => ro.disconnect();
  }, [narrow]);

  // The cursor engine. Starts once both iframes have their apps mounted.
  useEffect(() => {
    let alive = true;
    let raf = 0;
    const cur = { x: window.innerWidth * 0.4, y: window.innerHeight * 0.5 };
    const apply = () => { const c = cursorRef.current; if (c) c.style.transform = `translate(${cur.x}px, ${cur.y}px)`; };
    apply();

    const ease = (p: number) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
    const tween = (to: { x: number; y: number }, dur: number) =>
      new Promise<void>((res) => {
        if (!isFinite(to.x) || !isFinite(to.y)) return res();
        const from = { ...cur };
        const t0 = performance.now();
        const frame = (now: number) => {
          if (!alive) return res();
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
      r.classList.remove('cd-ripple-go'); void r.offsetWidth; r.classList.add('cd-ripple-go');
    };

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
      const setter = Object.getOwnPropertyDescriptor(proto.prototype, 'value')?.set;
      setter?.call(el, text);
      el.dispatchEvent(new win.Event('input', { bubbles: true }));
    };
    // Type one character at a time, like a person at the keyboard.
    const typeChars = async (fr: HTMLIFrameElement, el: Element, text: string, per = 58) => {
      (el as HTMLElement).focus?.();
      let acc = '';
      for (const ch of text) {
        if (!alive) return;
        acc += ch;
        setVal(fr, el, acc);
        await sleep(per + Math.random() * 45);
      }
    };
    const waitFor = async (get: () => Element | null, tries = 10) => {
      for (let i = 0; i < tries && alive; i++) { const el = get(); if (el) return el; await sleep(300); }
      return null;
    };
    const moveClick = async (fr: HTMLIFrameElement, el: Element, dur = 850) => {
      await tween(pointOf(fr, el), dur);
      ripple(); await sleep(130); (el as HTMLElement).click(); await sleep(250);
    };

    const doStep = async (s: Step) => {
      const { fr, doc } = docOf(s.f);
      if (!fr || !doc) return;

      if (s.scrollTop) {
        scrollerOf(doc)?.scrollTo({ top: 0, behavior: 'smooth' });
        await sleep(480);
        const ir = fr.getBoundingClientRect();
        await tween({ x: ir.left + ir.width / 2, y: ir.top + 120 }, 820);
        setNote(s.note); await sleep(s.dwell); return;
      }
      if (s.closeWizard) {
        const x = await waitFor(() => doc.querySelector('button[aria-label="Close"]'));
        if (x) { setNote(s.note); await moveClick(fr, x); }
        await sleep(s.dwell); return;
      }
      if (s.chatSend) {
        setNote(s.note);
        for (const text of s.chatSend) {
          if (!alive) return;
          const input = doc.querySelector('input.pill-input') as HTMLInputElement | null;
          const send = doc.querySelector('button[aria-label="Send"]') as HTMLButtonElement | null;
          if (!input || !send) break;
          await tween(pointOf(fr, input), 650);
          await typeChars(fr, input, text, 46); await sleep(250);
          await moveClick(fr, send, 420);
          await sleep(650);
        }
        await sleep(s.dwell); return;
      }

      if (!s.match && !s.sel) return;
      const el = await waitFor(() => findEl(doc, s));
      if (!el) return;

      if (s.scrollCenter) {
        const sc = scrollerOf(doc);
        if (sc) {
          const er = el.getBoundingClientRect(), srect = sc.getBoundingClientRect();
          sc.scrollTo({ top: sc.scrollTop + (er.top - srect.top) - (sc.clientHeight / 2 - er.height / 2), behavior: 'smooth' });
          await sleep(620);
        }
      }

      setNote(s.note);
      if (s.fill !== undefined) {
        await tween(pointOf(fr, el), 750);
        ripple(); await sleep(120);
        await typeChars(fr, el, s.fill); await sleep(300);
      } else {
        await tween(pointOf(fr, el), 850);
        if (s.click) { ripple(); await sleep(130); (el as HTMLElement).click(); await sleep(250); }
      }
      await sleep(s.dwell);
    };

    const ready = async () => {
      if (!narrowRef.current) await waitFor(() => docOf('studio').doc?.querySelector('.cs button') ?? null, 40);
      await waitFor(() => docOf('fan').doc?.querySelector('.connect-phone') ?? null, 40);
    };
    const resetApps = () => {
      try { (fanRef.current?.contentWindow as Window | null)?.localStorage?.removeItem(FAN_STORE_KEY); } catch { /* ignore */ }
      try { fanRef.current?.contentWindow?.location.reload(); } catch { /* ignore */ }
      try { studioRef.current?.contentWindow?.location.reload(); } catch { /* ignore */ }
    };

    const run = async () => {
      await ready();
      if (!alive) return;
      cursorRef.current?.classList.add('cd-cursor-on');
      await sleep(600);
      while (alive) {
        // On phones the Studio isn't shown, so only run the fan half of the tour.
        for (const s of STEPS) { if (!alive) return; if (narrowRef.current && s.f === 'studio') continue; await doStep(s); }
        await sleep(700);
        resetApps();          // clean slate so panels/messages don't pile up
        await ready();
        if (!alive) return;
        await sleep(800);
      }
    };
    run();
    return () => { alive = false; cancelAnimationFrame(raf); };
  }, []);

  // ---- shared pieces ----
  const brand = (
    <div style={{ display: 'flex', alignItems: 'center', gap: narrow ? 9 : 13, minWidth: 0 }}>
      <span style={S.logoMark}>✦</span>
      <b style={{ fontSize: narrow ? 15 : 17, letterSpacing: -0.2 }}>BoltOS Connect</b>
      {!narrow && <><span style={S.midDot} /><span style={{ color: '#9A98A6', fontSize: 14 }}>Arsenal · Matchday</span></>}
    </div>
  );
  const liveBadge = <span style={S.live}><span style={S.liveDot} />LIVE</span>;

  const studioFrame = (
    <div style={S.opFrame}>
      <div style={S.opChrome}>
        <span style={{ ...S.dotSm, background: '#ff5f57' }} /><span style={{ ...S.dotSm, background: '#febc2e' }} /><span style={{ ...S.dotSm, background: '#28c840' }} />
        <span style={S.urlSm}>studio.boltos.ai</span>
      </div>
      <div style={{ ...S.opScreen, height: STUDIO_H * scale }}>
        <iframe ref={studioRef} src={SRC.studio} title="BoltOS Studio"
          style={{ width: SW, height: STUDIO_H, border: 0, transform: `scale(${scale})`, transformOrigin: 'top left' }} />
      </div>
    </div>
  );

  const fanPhone = narrow ? (
    <div style={{ ...S.mPhone, borderRadius: preview ? 18 : 0, boxShadow: preview ? S.mPhone.boxShadow : 'none' }}>
      <iframe ref={fanRef} src={SRC.fan} title="Arsenal fan view" style={{ width: '100%', height: '100%', border: 0, display: 'block' }} />
    </div>
  ) : (
    <div style={{ ...S.phone, padding: 6, borderRadius: Math.round(38 * scale) + 6 }}>
      <div style={{ width: Math.round(PHONE_W * scale), height: Math.round(PHONE_H * scale), borderRadius: Math.round(34 * scale), overflow: 'hidden', background: '#000' }}>
        <iframe ref={fanRef} src={SRC.fan} title="Arsenal fan view"
          style={{ width: PHONE_W, height: PHONE_H, border: 0, display: 'block', transform: `scale(${scale})`, transformOrigin: 'top left' }} />
      </div>
    </div>
  );

  return (
    <div style={{ ...S.stage, padding: preview ? 20 : narrow ? 0 : 'clamp(12px,3vw,40px)' }}>
      <style>{CSS}</style>

      <div ref={boxRef} style={narrow ? S.boxMobile : S.box}>
        {narrow ? (
          /* ---------- phone: the fan experience, full-screen ---------- */
          <>
            <div style={S.mHead}>{brand}{liveBadge}</div>
            <div style={{ ...S.fanArea, padding: preview ? 12 : 0 }}>{fanPhone}</div>
            <div style={S.mCaption}>
              <div style={{ color: '#B8B6C4', fontWeight: 500 }}>{note}</div>
              <div style={{ fontSize: 10.5, color: '#55525E', marginTop: 5 }}>The operator Studio runs on the web — open on desktop to see it</div>
            </div>
          </>
        ) : (
          <>
            <div style={S.chrome}>
              <span style={{ ...S.dot, background: '#ff5f57' }} /><span style={{ ...S.dot, background: '#febc2e' }} /><span style={{ ...S.dot, background: '#28c840' }} />
              <span style={S.url}>connect.boltos.ai</span>
            </div>
            <div style={S.header}>{brand}{liveBadge}</div>
            <div style={S.body}>
              <section style={S.colLeft}>
                <div style={S.label}><span style={S.half} />OPERATOR <span style={S.labelMut}>— MATCHDAY STUDIO (WEB)</span></div>
                {studioFrame}
              </section>
              <section style={S.colRight}>
                <div style={S.label}><span style={S.half} />FAN VIEW <span style={S.labelMut}>— SUPPORTERS</span></div>
                {fanPhone}
              </section>
            </div>
            <div style={S.footer}>{note}</div>
          </>
        )}
      </div>

      <div ref={rippleRef} style={S.ripple} />
      <div ref={cursorRef} className="cd-cursor" style={S.cursor}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path d="M5 3l14 7.5-6 1.6-2.4 5.9L5 3z" fill="#fff" stroke="#111" strokeWidth="1.1" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

const CSS = `
.cd-cursor{opacity:0;transition:opacity .4s}
.cd-cursor.cd-cursor-on{opacity:1}
.cd-ripple-go{animation:cdRipple .5s ease-out}
@keyframes cdRipple{from{opacity:.5;width:10px;height:10px;margin:-5px 0 0 -5px}to{opacity:0;width:52px;height:52px;margin:-26px 0 0 -26px}}
`;

const S: Record<string, React.CSSProperties> = {
  stage: {
    minHeight: '100dvh', width: '100%', boxSizing: 'border-box',
    background: 'radial-gradient(1200px 700px at 50% -10%, #15151f 0%, #0a0a0f 55%, #060609 100%)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: preview ? 20 : 'clamp(12px,3vw,40px)',
    overflow: 'auto', fontFamily: "'Manrope',system-ui,-apple-system,sans-serif", color: '#F3F2F7',
  },
  box: {
    width: 'min(1320px, 100%)', margin: 'auto', background: '#0E0E15', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20, overflow: 'hidden', boxShadow: '0 50px 120px -30px rgba(0,0,0,0.85)',
  },
  boxMobile: {
    // A *definite* height is required so the fan iframe (height:100%) fills it —
    // otherwise the iframe collapses to its 150px default.
    width: preview ? 390 : '100%', height: preview ? 'min(844px, calc(100dvh - 40px))' : '100dvh',
    margin: 'auto', background: '#0E0E15', border: preview ? '1px solid rgba(255,255,255,0.1)' : 'none',
    borderRadius: preview ? 44 : 0, overflow: 'hidden', display: 'flex', flexDirection: 'column',
    boxShadow: preview ? '0 0 0 10px #15151b, 0 40px 90px -20px rgba(0,0,0,0.9)' : 'none',
  },
  chrome: { height: 46, display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'relative' },
  dot: { width: 12, height: 12, borderRadius: '50%', flex: 'none' },
  url: { position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: 12.5, color: '#7D7B88', background: 'rgba(255,255,255,0.05)', padding: '5px 16px', borderRadius: 8, fontFamily: 'ui-monospace,monospace' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px 16px' },
  logoMark: { width: 30, height: 30, borderRadius: 8, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(145deg,#8B3DF5,#5B1FB0)', color: '#fff', fontSize: 15 },
  midDot: { width: 4, height: 4, borderRadius: '50%', background: '#44424E' },
  live: { display: 'inline-flex', alignItems: 'center', gap: 8, height: 30, padding: '0 14px', borderRadius: 999, flex: 'none', border: '1px solid rgba(45,200,120,0.4)', color: '#5EE0A0', fontSize: 12, fontWeight: 700, letterSpacing: 0.4 },
  liveDot: { width: 7, height: 7, borderRadius: '50%', background: '#2DC878', boxShadow: '0 0 10px #2DC878' },
  body: { display: 'flex', gap: 26, padding: '6px 28px 20px', alignItems: 'stretch' },
  colLeft: { flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 },
  colRight: { flex: '0 0 340px', width: 340, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' },
  label: { fontSize: 11, fontWeight: 700, letterSpacing: 1.4, color: '#C9C7D4', display: 'flex', alignItems: 'center', gap: 9, textTransform: 'uppercase' },
  labelMut: { color: '#6E6C7A', fontWeight: 600 },
  half: { width: 12, height: 12, borderRadius: '50%', background: 'linear-gradient(90deg,#C9C7D4 50%, transparent 50%)', border: '1.5px solid #C9C7D4', boxSizing: 'border-box' },
  opFrame: { width: '100%', background: '#0B0B12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' },
  opChrome: { height: 36, display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'relative' },
  dotSm: { width: 9, height: 9, borderRadius: '50%', flex: 'none' },
  urlSm: { position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: 11, color: '#6E6C7A', fontFamily: 'ui-monospace,monospace' },
  opScreen: { width: '100%', overflow: 'hidden' },
  phone: { padding: 8, borderRadius: 46, background: 'linear-gradient(160deg,#2a2a33,#111118)', boxShadow: '0 30px 70px -24px rgba(0,0,0,0.9), inset 0 0 0 1.5px rgba(255,255,255,0.06)' },
  footer: { textAlign: 'center', color: '#6E6C7A', fontSize: 12.5, padding: '4px 20px 20px' },
  mHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px', flex: 'none' },
  fanArea: { flex: 1, minHeight: 0, display: 'flex', alignItems: 'stretch', justifyContent: 'center', padding: 12, boxSizing: 'border-box', background: '#060609' },
  // Capped ≤480 so the fan view is always in its frameless mode (≤520px), on
  // phones and in the 520–760 tablet band alike; centred by fanArea.
  mPhone: { width: '100%', maxWidth: 460, height: '100%', borderRadius: 18, overflow: 'hidden', background: '#000', boxShadow: '0 10px 30px -8px rgba(0,0,0,0.7)' },
  mCaption: { flex: 'none', textAlign: 'center', color: '#8A879A', fontSize: 12, padding: '10px 16px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' },
  cursor: { position: 'fixed', left: 0, top: 0, zIndex: 9999, pointerEvents: 'none', filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.5))' },
  ripple: { position: 'fixed', left: 0, top: 0, zIndex: 9998, pointerEvents: 'none', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.9)', width: 0, height: 0, opacity: 0 },
};
