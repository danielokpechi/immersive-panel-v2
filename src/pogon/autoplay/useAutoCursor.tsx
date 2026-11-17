import { useRef } from 'react';

// A simulated pointer for the autoplay demo. The app renders `node`, then the
// autoplay calls `point(target)` to glide the cursor to an element (CSS
// selector) or a viewport fraction ([x%, y%]), and `click()` to pulse. Purely
// cosmetic — it never dispatches real events. Inert unless `enabled`.
export function useAutoCursor(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);

  const point = (target: string | [number, number]) => {
    const el = ref.current;
    if (!el) return;
    let x: number, y: number;
    if (typeof target === 'string') {
      const t = document.querySelector(target) as HTMLElement | null;
      if (!t) return; // leave the cursor where it is if the target isn't on screen
      const r = t.getBoundingClientRect();
      x = r.left + r.width / 2;
      y = r.top + r.height / 2;
    } else {
      x = window.innerWidth * target[0];
      y = window.innerHeight * target[1];
    }
    el.style.opacity = '1';
    el.style.transform = `translate(${x}px, ${y}px)`;
  };

  const click = () => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove('acx-click');
    void el.offsetWidth; // restart the animation
    el.classList.add('acx-click');
  };

  const node = enabled ? (
    <div
      ref={ref}
      className="auto-cursor"
      aria-hidden
      style={{ position: 'fixed', left: 0, top: 0, zIndex: 2147483000, pointerEvents: 'none', opacity: 0, transition: 'transform .78s cubic-bezier(.45,.05,.2,1), opacity .3s', willChange: 'transform' }}
    >
      <style>{`
        .auto-cursor .acx-ring{position:absolute;left:0;top:0;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;border:2px solid rgba(255,255,255,.9);opacity:0}
        .auto-cursor.acx-click .acx-ring{animation:acxPulse .55s ease-out}
        @keyframes acxPulse{0%{transform:scale(.25);opacity:.9}100%{transform:scale(1.7);opacity:0}}
      `}</style>
      <svg width="24" height="24" viewBox="0 0 24 24" style={{ display: 'block', marginLeft: -2, marginTop: -1, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.55))' }}>
        <path d="M4.5 2.5 19 9.8l-6.4 1.9-2.2 6.4z" fill="#ffffff" stroke="#0b0b0b" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
      <span className="acx-ring" />
    </div>
  ) : null;

  return { node, point, click };
}
