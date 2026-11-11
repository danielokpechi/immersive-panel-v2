// ═══════════════════════════════════════════════════════════════════════
// StudioHome: the Connect Events organiser home. Lists every event (built-in
// samples plus events saved in this browser) with Open, Edit, Duplicate and
// Delete, and hosts the step-by-step builder (Brand → Event → Content → IRIS →
// Preview → Publish). The builder edits one EventConfig; every field is
// editable, with a live 390px fan preview that redraws as you type.
// ═══════════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type MouseEvent, type ReactNode } from 'react';
import { s } from '../voltford/admin/s';
import {
  listEvents, getEvent, saveEvent, saveDraft, deleteEvent, duplicateEvent, nextFreeId, isSample, newFromTemplate,
  fanPath, studioPath, abs, asset, mix, TEMPLATES, TARGETS, sportStarter, dateLabels, MODULES, isOn, LABELS, importEvent, exportName,
  type LabelKey, type ModuleKey,
  type EventConfig, type SegKind, type Target,
} from './config';
import { Ms, Card, Cap, Note, Demo, ADMIN_CSS } from './EventStudio';
import { SCAFFOLD } from './scaffold';

const STEPS = ['Brand', 'Event', 'Modules', 'Content', 'Rewards', 'IRIS', 'Preview', 'Publish'] as const;
const SI = (n: (typeof STEPS)[number]) => STEPS.indexOf(n);
const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  live: { label: 'LIVE NOW', bg: '#C0473C', fg: '#F5F5F2' }, upcoming: { label: 'UPCOMING', bg: '#1B0B2D', fg: '#F5F5F2' },
  past: { label: 'PAST', bg: '#E9E9E4', fg: '#513E66' }, draft: { label: 'DRAFT', bg: '#F3ECFE', fg: '#6A2BC4' },
};
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

export function StudioHome() {
  const qs = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const [rows, setRows] = useState(() => listEvents());
  const [draft, setDraft] = useState<EventConfig | null>(() => { const e = qs.get('edit'); return e ? getEvent(e) : null; });
  const [isNew, setIsNew] = useState(false);
  const [step, setStep] = useState(() => Math.max(0, STEPS.indexOf((qs.get('step') || 'Brand') as (typeof STEPS)[number])));
  const [toast, setToast] = useState<string | null>(null);
  const toastT = useRef<number | undefined>(undefined);
  const say = (m: string) => { window.clearTimeout(toastT.current); setToast(m); toastT.current = window.setTimeout(() => setToast(null), 2200); };
  const refresh = () => setRows(listEvents());
  useEffect(() => { document.title = draft ? 'Event builder · Connect Events' : 'Events · Connect Events'; }, [draft]);

  const openBuilder = (cfg: EventConfig, fresh = false) => { setDraft(clone(cfg)); setIsNew(fresh); setStep(0); history.replaceState(null, '', '?edit=' + cfg.id); };
  const closeBuilder = () => { setDraft(null); refresh(); history.replaceState(null, '', window.location.pathname); };
  const create = () => {
    const id = nextFreeId(); if (!id) { say('All 40 demo event slots are used. Delete one first.'); return; }
    openBuilder(newFromTemplate(id, TEMPLATES[0]), true);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F2', color: '#1B0B2D', fontFamily: 'Archivo,-apple-system,system-ui,sans-serif' }}>
      <style>{ADMIN_CSS + BUILDER_CSS}</style>
      <header style={s('display:flex;align-items:center;gap:16px;padding:14px 44px;background:#FFFFFF;border-bottom:1px solid rgba(27,11,45,.08);position:sticky;top:0;z-index:20')}>
        <button onClick={() => (draft ? closeBuilder() : null)} style={s('display:flex;align-items:center;gap:10px')}><span style={s('width:30px;height:30px;border-radius:9px;background:#1B0B2D;display:flex;align-items:center;justify-content:center')}><Ms size={18} color="#F5F5F2">hub</Ms></span><span style={s("font:700 14px/1 'Archivo';letter-spacing:-.01em")}>Connect Events</span></button>
        <span style={s('width:1px;height:22px;background:rgba(27,11,45,.12)')} />
        <span style={s("font:500 13px/1 'Archivo';color:#513E66")}>{draft ? (isNew ? 'New event' : 'Edit · ' + draft.event.name) : 'All events'}</span>
      </header>
      {draft
        ? <Builder {...{ draft, setDraft, step, setStep, isNew, say, close: closeBuilder, refresh }} />
        : <EventsList {...{ rows, refresh, openBuilder, create, say }} />}
      {toast && <div style={s('position:fixed;left:50%;bottom:34px;transform:translateX(-50%);z-index:80;display:flex;align-items:center;gap:10px;padding:13px 18px;border-radius:13px;background:#1B0B2D;box-shadow:0 14px 34px -12px rgba(27,11,45,.7);animation:stRise .25s ease both')}><Ms color="#8B3DF5">check_circle</Ms><span style={s("font:600 13px/1 'Archivo';color:#F5F5F2")}>{toast}</span></div>}
    </div>
  );
}

// ════════════ EVENTS GRID ════════════
// Same layout as the Voltford Studio dashboard: KPI tiles, then a card grid.
function EventsList({ rows, refresh, openBuilder, create, say }: any) {
  const importRef = useRef<HTMLInputElement>(null);
  const exportCfg = (c: EventConfig) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(c, null, 2)], { type: 'application/json' })); a.download = exportName(c); a.click(); say('Config exported'); };
  const order = ['live', 'upcoming', 'draft', 'past'];
  // By status, with the stages of a series kept together in order.
  const rank = (c: EventConfig) => order.indexOf(c.status);
  const groupRank = (c: EventConfig) => (c.series ? Math.min(...rows.filter((r: any) => r.cfg.series?.id === c.series!.id).map((r: any) => rank(r.cfg))) : rank(c));
  const list: { cfg: EventConfig; sample: boolean; edited: boolean }[] = [...rows].sort((a: any, b: any) => groupRank(a.cfg) - groupRank(b.cfg) || (a.cfg.series?.id || a.cfg.id).localeCompare(b.cfg.series?.id || b.cfg.id) || (a.cfg.series?.order || 0) - (b.cfg.series?.order || 0));
  const brands = new Set(list.map((r) => r.cfg.brand.name)).size;
  const kpis = [
    { label: 'TOTAL EVENTS', v: String(list.length), unit: 'configured', icon: 'event', color: '#1B0B2D' },
    { label: 'LIVE NOW', v: String(list.filter((r) => r.cfg.status === 'live').length), unit: 'on air', icon: 'sensors', color: '#C0473C' },
    { label: 'UPCOMING', v: String(list.filter((r) => r.cfg.status === 'upcoming').length), unit: 'published', icon: 'schedule', color: '#8B3DF5' },
    { label: 'BRANDS', v: String(brands), unit: 'on one platform', icon: 'palette', color: '#8B3DF5' },
  ];
  const btn = "display:flex;align-items:center;justify-content:center;gap:7px;padding:11px;border-radius:11px;font:600 12px/1 'Archivo';color:#1B0B2D;text-decoration:none;box-shadow:inset 0 0 0 1px rgba(27,11,45,.14)";
  return (
    <div>
      <section style={s('padding:40px 44px 0;animation:stRise .4s ease both')}>
        <div style={s('display:flex;align-items:flex-end;gap:30px')}>
          <div style={s('flex:1;min-width:0')}>
            <div style={s("display:flex;align-items:center;gap:10px;font:600 11px/1 'Archivo';letter-spacing:.16em;color:#826E99")}>CONNECT EVENTS · WORKSPACE <Demo /></div>
            <h1 style={s("font:700 40px/1.02 'Archivo';letter-spacing:-.025em;margin:14px 0 0")}>Your events</h1>
            <p style={s("font:400 15px/1.5 'Archivo';color:#513E66;margin:10px 0 0;max-width:560px")}>{list.length} events across {brands} brands. Each one is a single config: brand, agenda, content and IRIS answers. Build it once, then run it live.</p>
          </div>
          <button className="ah" data-import onClick={() => importRef.current?.click()} style={s("display:flex;align-items:center;gap:9px;padding:15px 18px;border-radius:14px;font:600 13.5px/1 'Archivo';color:#1B0B2D;box-shadow:inset 0 0 0 1px rgba(27,11,45,.16)")}><Ms size={19} color="#1B0B2D">upload_file</Ms>Import config</button>
          <input ref={importRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; f.text().then((t) => { const r = importEvent(t); if (r.error) say(r.error); else { refresh(); say('Imported “' + r.cfg!.event.name + '” as /events/' + r.cfg!.id + '/'); } }); e.target.value = ''; }} />
          <button className="ah-ink-btn" onClick={create} style={s("display:flex;align-items:center;gap:9px;padding:15px 20px;border-radius:14px;background:#1B0B2D;font:600 13.5px/1 'Archivo';color:#F5F5F2;box-shadow:0 8px 20px -10px rgba(27,11,45,.5)")}><Ms size={19} color="#F5F5F2">add</Ms>Create event</button>
        </div>
        <div style={s('display:flex;gap:20px;margin-top:24px')}>
          {kpis.map((k) => (
            <div key={k.label} style={s('flex:1;padding:18px 20px;background:#FFFFFF;border-radius:16px;box-shadow:0 1px 2px rgba(27,11,45,.05)')}>
              <div style={s('display:flex;align-items:center;gap:8px')}><Ms size={17} color={k.color}>{k.icon}</Ms><span style={s("font:600 10.5px/1 'Archivo';letter-spacing:.14em;color:#826E99")}>{k.label}</span></div>
              <div style={s('display:flex;align-items:baseline;gap:9px;margin-top:14px')}><span style={s("font:800 34px/.9 'Archivo Black';letter-spacing:.01em")}>{k.v}</span><span style={s("font:500 12px/1 'Archivo';color:#826E99")}>{k.unit}</span></div>
            </div>
          ))}
        </div>
      </section>

      <section style={s('padding:34px 44px 20px')}>
        <div style={s('display:flex;align-items:center;gap:10px')}>
          <span style={s("font:600 11px/1 'Archivo';letter-spacing:.16em;color:#826E99")}>ALL EVENTS</span>
          <span style={s('flex:1;height:1px;background:rgba(27,11,45,.08)')} />
        </div>
        <div style={s('display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin-top:20px')}>
          {list.map(({ cfg, sample, edited }) => {
            const S = STATUS[cfg.status] || STATUS.draft;
            const live = cfg.status === 'live';
            const statusColor = live ? '#C0473C' : cfg.status === 'upcoming' ? '#8B3DF5' : '#826E99';
            const tpl = TEMPLATES.find((t) => t.id === cfg.event.template)?.name || '';
            const tags = cfg.segments.slice(0, 5).map((g) => g.name).concat(cfg.segments.length > 5 ? [`+${cfg.segments.length - 5} more`] : []);
            const line = live ? `Live now · ${cfg.segments.length} segments · ${cfg.hotspots.length} features` : cfg.status === 'upcoming' ? `Upcoming · ${cfg.event.dateShort.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}` : cfg.status === 'past' ? 'Ended · results ready' : `Draft · ${cfg.segments.length} segments configured`;
            const iconBtn = (icon: string, label: string, onClick: () => void) => <button className="ah-del" aria-label={label} title={label} onClick={onClick} style={s('width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.94)')}><Ms size={15} color="#1B0B2D">{icon}</Ms></button>;
            return (
              <div key={cfg.id} style={{ ...s('background:#FFFFFF;border-radius:18px;overflow:hidden;box-shadow:0 1px 2px rgba(27,11,45,.05);animation:stRise .4s ease both;display:flex;flex-direction:column'), borderTop: `3px solid ${statusColor}` }}>
                <div style={{ ...s('position:relative;height:132px;display:flex;align-items:flex-end;padding:16px;overflow:hidden'), background: `linear-gradient(135deg,${cfg.brand.dark} 0%,${mix(cfg.brand.dark, cfg.brand.accent, 0.35)} 140%)` }}>
                  {cfg.event.heroImage.src && <img src={asset(cfg.event.heroImage.src)} alt="" style={s('position:absolute;inset:0;width:100%;height:100%;object-fit:cover;mix-blend-mode:lighten;opacity:.85')} />}
                  <span style={{ ...s('position:absolute;inset:0'), background: `linear-gradient(180deg,transparent 30%,${cfg.brand.dark}E6 100%)` }} />
                  <span style={s('position:relative;display:flex;align-items:center;gap:9px')}><img src={asset(cfg.brand.logo)} alt="" style={s('width:24px;height:24px;object-fit:contain')} /><span style={s("font:800 22px/.9 'Archivo Black';letter-spacing:.01em;color:#fff")}>{cfg.brand.name}</span></span>
                  <span style={s('position:absolute;right:14px;top:14px;display:flex;gap:7px')}>
                    {iconBtn('download', 'Export config', () => exportCfg(cfg))}
                    <span style={s("display:flex;align-items:center;gap:6px;padding:6px 9px;border-radius:8px;font:600 9.5px/1 'Archivo';letter-spacing:.1em;background:rgba(255,255,255,.94);color:#1B0B2D")}><Ms size={13} color="#1B0B2D">{cfg.event.format === 'Online' ? 'wifi' : cfg.event.format === 'Hybrid' ? 'hub' : 'location_on'}</Ms>{cfg.event.format.toUpperCase()}</span>
                    {sample ? (edited && iconBtn('restart_alt', 'Reset to sample', () => { if (window.confirm('Reset “' + cfg.event.name + '” to the built-in sample? Your edits in this browser are removed.')) { deleteEvent(cfg.id); refresh(); say('Reset to the sample'); } }))
                      : iconBtn('delete', 'Delete', () => { if (window.confirm('Delete “' + cfg.event.name + '” from this browser? This cannot be undone.')) { deleteEvent(cfg.id); refresh(); say('Event deleted'); } })}
                  </span>
                  <span style={{ ...s('position:absolute;left:14px;top:14px;width:12px;height:12px;border-radius:4px;box-shadow:0 0 0 2px rgba(255,255,255,.9)'), background: cfg.brand.accent }} />
                </div>
                <div style={s('padding:17px 18px 18px;display:flex;flex-direction:column;flex:1')}>
                  <div style={s('display:flex;align-items:center;gap:9px')}>
                    <span style={s("font:700 16.5px/1.15 'Archivo';letter-spacing:-.012em;flex:1;min-width:0")}>{cfg.event.name}</span>
                    <span style={s("font:600 9.5px/1 'Archivo';letter-spacing:.1em;color:#513E66;padding:6px 8px;border-radius:7px;background:#F1F1EE;white-space:nowrap")}>{tpl.toUpperCase()}</span>
                  </div>
                  {cfg.series && <div style={s("display:flex;align-items:center;gap:6px;margin-top:9px;font:600 11px/1 'Archivo';color:#6A2BC4")}><Ms size={14} color="#8B3DF5">trophy</Ms>{cfg.series.name} · {cfg.series.stage} · {cfg.series.order} of {cfg.series.total}</div>}
                  <div style={s("font:400 13px/1.45 'Archivo';color:#513E66;margin-top:8px")}>{cfg.event.dateShort.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())} · {cfg.event.venue}{cfg.event.format === 'Hybrid' ? ' and online' : ''}</div>
                  <div style={{ ...s('display:flex;align-items:center;gap:8px;margin-top:14px;padding:10px 12px;border-radius:11px'), background: live ? 'rgba(192,71,60,.08)' : 'rgba(27,11,45,.05)' }}>
                    <span style={{ ...s('width:8px;height:8px;border-radius:50%'), background: statusColor, animation: live ? 'stPulse 2.4s ease-out infinite' : 'none' }} />
                    <span style={{ ...s("font:600 11.5px/1 'Archivo';flex:1"), color: statusColor }}>{line}</span>
                    <span style={{ ...s("font:600 9px/1 'Archivo';letter-spacing:.1em;padding:4px 6px;border-radius:5px"), background: S.bg, color: S.fg }}>{S.label}</span>
                  </div>
                  <div style={s('display:flex;flex-wrap:wrap;gap:5px;margin-top:14px')}>
                    {tags.map((t, j) => <span key={j} style={s("font:500 11px/1 'Archivo';color:#513E66;padding:6px 8px;border-radius:7px;box-shadow:inset 0 0 0 1px rgba(27,11,45,.1)")}>{t}</span>)}
                  </div>
                  <div style={s("display:flex;align-items:center;gap:8px;margin-top:auto;padding-top:13px;border-top:1px solid rgba(27,11,45,.08);font:500 11px/1 'Archivo';color:#826E99;margin-bottom:0")}>
                    <Ms size={14} color="#826E99">{sample ? 'inventory_2' : 'save'}</Ms>{sample ? (edited ? 'Sample · edited in this browser' : 'Built-in sample') : 'Saved in this browser'}
                    <span style={s('margin-left:auto;font-variant-numeric:tabular-nums')}>/events/{cfg.id}/</span>
                  </div>
                  <div style={s('display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:14px')}>
                    <a className="ah-ink-btn" href={studioPath(cfg.id)} style={s("display:flex;align-items:center;justify-content:center;gap:7px;padding:11px;border-radius:11px;background:#1B0B2D;font:600 12px/1 'Archivo';color:#F5F5F2;text-decoration:none")}><Ms size={16} color="#F5F5F2">{live ? 'settings_input_antenna' : 'tune'}</Ms>{live ? 'Control room' : 'Studio'}</a>
                    <a className="ah" href={fanPath(cfg.id)} style={s(btn)}><Ms size={16} color="#1B0B2D">smartphone</Ms>Fan view</a>
                    <button className="ah" onClick={() => openBuilder(cfg)} style={s(btn)}><Ms size={16} color="#1B0B2D">edit</Ms>Edit</button>
                    <button className="ah" onClick={() => { const c = duplicateEvent(cfg); if (!c) { say('All demo event slots are used.'); return; } refresh(); say('Duplicated as “' + c.event.name + '”'); }} style={s(btn)}><Ms size={16} color="#1B0B2D">content_copy</Ms>Duplicate</button>
                  </div>
                </div>
              </div>
            );
          })}
          <button className="ah" onClick={create} style={s("display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;min-height:420px;border-radius:18px;font:600 13.5px/1.3 'Archivo';color:#513E66;box-shadow:inset 0 0 0 2px rgba(27,11,45,.12);border:0;background:transparent")}>
            <span style={s('width:52px;height:52px;border-radius:16px;background:#F1F1EE;display:flex;align-items:center;justify-content:center')}><Ms size={26} color="#1B0B2D">add</Ms></span>
            Create event
            <span style={s("font:400 12px/1.4 'Archivo';color:#826E99;max-width:220px;text-align:center")}>Start from Product launch, Conference, Sports or Fan event, or import a config</span>
          </button>
        </div>
      </section>

      <footer style={s("display:flex;align-items:center;gap:14px;padding:28px 44px 34px;margin-top:20px;border-top:1px solid rgba(27,11,45,.08);font:500 11.5px/1 'Archivo';color:#826E99")}>
        <span>Events you create or edit are saved in this browser only.</span><span>·</span><span>Samples ship with the prototype and can be reset at any time.</span>
      </footer>
    </div>
  );
}

// ════════════ BUILDER ════════════
// Path-based edit helpers: every field reads and writes one path in the config.
type Path = (string | number)[];
const getAt = (o: any, p: Path) => p.reduce((a, k) => (a == null ? a : a[k]), o);
const setAt = (o: any, p: Path, v: any): any => {
  if (!p.length) return v;
  const [k, ...rest] = p;
  const copy = Array.isArray(o) ? o.slice() : { ...o };
  copy[k as any] = setAt(o?.[k as any], rest, v);
  return copy;
};

function Builder({ draft, setDraft, step, setStep, isNew, say, close, refresh }: any) {
  const cfg = draft as EventConfig;
  // Fields that follow others until they're edited by hand: the hero title and
  // kicker follow the event and brand names; the short date labels follow the date.
  const upd = (p: Path, v: any) => setDraft((d: EventConfig) => {
    let n = setAt(d, p, v); const k = p.join('.');
    if (k === 'event.name' && (d.event.title === d.event.name.toUpperCase() || isNewish(d))) n = setAt(n, ['event', 'title'], String(v).toUpperCase());
    if (k === 'brand.name' && (d.event.kicker === d.brand.name.toUpperCase() || isNewish(d))) n = setAt(n, ['event', 'kicker'], String(v).toUpperCase());
    if (k === 'event.date' || k === 'event.time') { const L = dateLabels(n.event.date, n.event.time); if (L) { n = setAt(n, ['event', 'dayLabel'], L.dayLabel); n = setAt(n, ['event', 'dateShort'], L.dateShort); } }
    if (!isSample(d.id) && k.startsWith('event.venue') && (d.event.venueShort === SCAFFOLD.event.venueShort || d.event.venueShort === String(d.event.venue).toUpperCase()) && k === 'event.venue') n = setAt(n, ['event', 'venueShort'], String(n.event.venue).toUpperCase());
    // While a new event still has the template's sample lines, keep them in step with its own details.
    if (!isSample(d.id) && (d.event.kickerSub === TPL_KICKER_SUB || d.event.kickerSub === autoKickerSub(d)) && ['event.city', 'event.template', 'event.format'].includes(k)) n = setAt(n, ['event', 'kickerSub'], autoKickerSub(n));
    if (!isSample(d.id) && (d.event.dateLine === TPL_DATE_LINE || d.event.dateLine === autoDateLine(d)) && ['event.date', 'event.time', 'event.venue', 'event.venueShort', 'event.format'].includes(k)) n = setAt(n, ['event', 'dateLine'], autoDateLine(n));
    return n;
  });
  // Keep the live preview in step with the form (the fan view reloads drafts).
  useEffect(() => { const t = window.setTimeout(() => saveDraft(cfg), 180); return () => window.clearTimeout(t); }, [cfg]);
  const B = { cfg, upd, setDraft, say };
  const publish = (status?: EventConfig['status']) => {
    const out = status ? { ...cfg, status } : cfg;
    if (!out.event.name.trim()) { say('Give the event a name first'); setStep(SI('Event')); return; }
    if (!saveEvent(out)) { say('Not saved: this browser is out of room. Try a smaller image.'); return; }
    setDraft(out); refresh();
    say(isSample(out.id) ? 'Saved. This browser now uses your edited sample.' : 'Saved to this browser');
  };
  return (
    <div style={s('padding:26px 44px 52px;display:flex;gap:24px;align-items:flex-start;animation:stFade .3s ease both')}>
      <div style={s('flex:1;min-width:0;display:flex;flex-direction:column;gap:18px')}>
        <div style={s('display:flex;align-items:center;gap:14px')}>
          <button className="ah" onClick={close} style={s("display:flex;align-items:center;gap:6px;padding:10px 12px;border-radius:11px;font:600 12.5px/1 'Archivo';color:#513E66")}><Ms size={16} color="inherit">arrow_back</Ms>All events</button>
          <h1 style={s("font:700 26px/1.1 'Archivo';letter-spacing:-.02em;margin:0;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{isNew ? 'Create event' : cfg.event.name}</h1>
          <button className="ah" onClick={() => publish()} style={s("display:flex;align-items:center;gap:7px;padding:11px 14px;border-radius:12px;font:600 12.5px/1 'Archivo';box-shadow:inset 0 0 0 1px rgba(27,11,45,.14)")}><Ms size={16} color="inherit">save</Ms>Save</button>
        </div>
        <div style={s('display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:6px;padding:5px;border-radius:14px;background:#EAEAE6')}>
          {STEPS.map((n, i) => { const on = i === step, done = i < step; return (
            <button key={n} data-step={n} onClick={() => setStep(i)} style={{ ...s("display:flex;align-items:center;justify-content:center;gap:8px;padding:11px 6px;border-radius:10px;font:600 12.5px/1 'Archivo'"), background: on ? '#FFFFFF' : 'transparent', color: on ? '#1B0B2D' : '#513E66', boxShadow: on ? '0 1px 2px rgba(27,11,45,.08)' : 'none' }}>
              <span style={{ ...s("width:20px;height:20px;border-radius:6px;display:flex;align-items:center;justify-content:center;font:700 10px/1 'Archivo'"), background: on ? '#1B0B2D' : done ? '#8B3DF5' : '#DCDCD7', color: on || done ? '#fff' : '#513E66' }}>{done ? <Ms size={13} color="#fff">check</Ms> : i + 1}</span>{n}
            </button>
          ); })}
        </div>
        {step === SI('Brand') && <BrandStep {...B} />}
        {step === SI('Event') && <EventStep {...B} />}
        {step === SI('Modules') && <ModulesStep {...B} />}
        {step === SI('Content') && <ContentStep {...B} />}
        {step === SI('Rewards') && <RewardsStep {...B} />}
        {step === SI('IRIS') && <IrisStep {...B} />}
        {step === SI('Preview') && <PreviewStep {...B} />}
        {step === SI('Publish') && <PublishStep {...B} publish={publish} />}
        <div style={s('display:flex;justify-content:space-between;gap:12px')}>
          <button className="ah" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} style={{ ...s("display:flex;align-items:center;gap:7px;padding:13px 16px;border-radius:12px;font:600 13px/1 'Archivo';box-shadow:inset 0 0 0 1px rgba(27,11,45,.14)"), opacity: step === 0 ? 0.4 : 1 }}><Ms size={16} color="inherit">arrow_back</Ms>Back</button>
          {step < STEPS.length - 1
            ? <button className="ah-ink-btn" data-next onClick={() => setStep(step + 1)} style={s("display:flex;align-items:center;gap:8px;padding:13px 18px;border-radius:12px;background:#1B0B2D;font:600 13px/1 'Archivo';color:#F5F5F2")}>Next · {STEPS[step + 1]}<Ms size={16} color="#F5F5F2">arrow_forward</Ms></button>
            : <button className="ah-ink-btn" data-publish onClick={() => publish(cfg.status === 'draft' ? 'upcoming' : cfg.status)} style={s("display:flex;align-items:center;gap:8px;padding:13px 18px;border-radius:12px;background:#8B3DF5;font:600 13px/1 'Archivo';color:#fff")}><Ms size={16} color="#fff">rocket_launch</Ms>Publish</button>}
        </div>
      </div>
      {step !== SI('Preview') && (
        <aside style={s('width:330px;flex:none;position:sticky;top:86px')}>
          <div style={s('display:flex;align-items:center;gap:8px;margin-bottom:10px')}><span style={s('width:7px;height:7px;border-radius:50%;background:#C0473C;animation:stBlink 1.6s steps(1,end) infinite')} /><Cap>LIVE PREVIEW</Cap><Note>Updates as you type</Note></div>
          <PhoneFrame cfg={cfg} width={330} height={640} />
        </aside>
      )}
    </div>
  );
}

const TPL_KICKER_SUB = SCAFFOLD.event.kickerSub;
const TPL_DATE_LINE = SCAFFOLD.event.dateLine;
const autoKickerSub = (d: EventConfig) => ((TEMPLATES.find((t) => t.id === d.event.template)?.name || 'Event') + (d.event.city ? ' · ' + d.event.city : '')).toUpperCase();
const autoDateLine = (d: EventConfig) => [d.event.dayLabel, (d.event.venueShort || d.event.venue).toUpperCase(), d.event.format === 'Hybrid' ? 'AND ONLINE' : d.event.format === 'Online' ? 'ONLINE' : ''].filter(Boolean).join(' · ');
// A new event still carrying the template's sample hero text.
const isNewish = (d: EventConfig) => !isSample(d.id) && (d.event.title === SCAFFOLD.event.title || d.event.kicker === SCAFFOLD.event.kicker);
function PhoneFrame({ cfg, width, height, state }: { cfg: EventConfig; width: number; height: number; state?: string }) {
  return (
    <div style={{ ...s('padding:9px;border-radius:30px;background:#0E0B12;box-shadow:0 20px 50px -24px rgba(27,11,45,.6)'), width }}>
      <iframe key={cfg.id + (state || '')} title="Fan preview" src={fanPath(cfg.id) + '?preview=1&embed=1' + (state ? '&' + state : '')} style={{ width: '100%', height, border: 0, borderRadius: 22, display: 'block', background: cfg.brand.dark }} />
    </div>
  );
}

// ── field kit ──
const fieldCss = "width:100%;padding:11px 13px;border-radius:11px;background:#F1F1EE;border:0;font:500 13px/1.35 'Archivo';color:#1B0B2D";
function Lbl({ children, hint }: { children: ReactNode; hint?: string }) {
  return <div style={s('display:flex;align-items:baseline;gap:8px;margin-bottom:7px')}><span style={s("font:600 10.5px/1 'Archivo';letter-spacing:.12em;color:#826E99")}>{children}</span>{hint && <span style={s("font:400 11px/1.2 'Archivo';color:#A79BB6")}>{hint}</span>}</div>;
}
function Text({ B, p, label, hint, area, ph, type = 'text' }: { B: any; p: Path; label: string; hint?: string; area?: boolean; ph?: string; type?: string }) {
  const v = getAt(B.cfg, p) ?? '';
  const on = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => B.upd(p, type === 'number' ? Number(e.target.value) : e.target.value);
  return (
    <label style={s('display:block;min-width:0')} data-field={p.join('.')}>
      <Lbl hint={hint}>{label}</Lbl>
      {area ? <textarea value={v} onChange={on} rows={3} placeholder={ph} style={s(fieldCss + ';resize:vertical')} /> : <input type={type} value={v} onChange={on} placeholder={ph} style={s(fieldCss)} />}
    </label>
  );
}
function Pick({ B, p, label, opts }: { B: any; p: Path; label: string; opts: [string, string][] }) {
  const v = getAt(B.cfg, p);
  return (
    <div data-field={p.join('.')}><Lbl>{label}</Lbl>
      <div style={s('display:flex;gap:4px;padding:4px;border-radius:12px;background:#F1F1EE;width:max-content;max-width:100%;flex-wrap:wrap')}>
        {opts.map(([k, n]) => { const on = v === k; return <button key={k} onClick={() => B.upd(p, k)} style={{ ...s("padding:9px 13px;border-radius:9px;font:600 12px/1 'Archivo'"), background: on ? '#FFFFFF' : 'transparent', color: on ? '#1B0B2D' : '#513E66', boxShadow: on ? '0 1px 2px rgba(27,11,45,.08)' : 'none' }}>{n}</button>; })}
      </div>
    </div>
  );
}
function Colour({ B, p, label, swatches }: { B: any; p: Path; label: string; swatches: string[] }) {
  const v = getAt(B.cfg, p) || '#000000';
  return (
    <div data-field={p.join('.')}><Lbl>{label}</Lbl>
      <div style={s('display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:12px;background:#F1F1EE')}>
        <input type="color" value={v} onChange={(e) => B.upd(p, e.target.value)} style={s('width:34px;height:34px;border:0;padding:0;background:none;border-radius:8px;cursor:pointer')} />
        <input value={v} onChange={(e) => B.upd(p, e.target.value)} style={s("width:92px;padding:8px 9px;border-radius:8px;border:0;background:#FFFFFF;font:600 12.5px/1 'Archivo';font-variant-numeric:tabular-nums")} />
        <div style={s('display:flex;gap:5px;margin-left:auto')}>{swatches.map((h) => <button key={h} aria-label={h} onClick={() => B.upd(p, h)} style={{ ...s('width:22px;height:22px;border-radius:7px'), background: h, boxShadow: v.toLowerCase() === h.toLowerCase() ? '0 0 0 2px #fff,0 0 0 4px #1B0B2D' : 'inset 0 0 0 1px rgba(0,0,0,.1)' }} />)}</div>
      </div>
    </div>
  );
}
// Every uploaded image goes through here: photos are scaled to at most `max` px
// and saved as JPEG so events fit in browser storage; SVGs and small images are kept.
export function compressImage(f: File, max = 1800, keepPng = false): Promise<{ src: string; w: number; h: number }> {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => {
      const raw = String(r.result);
      const im = new Image();
      im.onload = () => {
        const w = im.naturalWidth || 1600, h = im.naturalHeight || 1000;
        if (f.type === 'image/svg+xml' || f.size < 350e3) { resolve({ src: raw, w, h }); return; }
        const k = Math.min(1, max / Math.max(w, h));
        const c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
        const g = c.getContext('2d'); if (!g) { resolve({ src: raw, w, h }); return; }
        g.drawImage(im, 0, 0, c.width, c.height);
        resolve({ src: keepPng && f.type === 'image/png' ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.86), w: c.width, h: c.height });
      };
      im.onerror = () => resolve({ src: raw, w: 1600, h: 1000 });
      im.src = raw;
    };
    r.readAsDataURL(f);
  });
}
// An image: a URL/path, or a file read into a data URL (kept in this browser).
function ImageField({ B, p, label, onSize, square }: { B: any; p: Path; label: string; onSize?: (w: number, h: number) => void; square?: boolean }) {
  const v = getAt(B.cfg, p) || '';
  const file = useRef<HTMLInputElement>(null);
  const load = (src: string) => { if (!onSize) return; const im = new Image(); im.onload = () => onSize(im.naturalWidth || 1600, im.naturalHeight || 1000); im.src = asset(src); };
  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    compressImage(f, square ? 512 : 1800, square).then(({ src, w, h }) => { B.upd(p, src); onSize?.(w, h); B.say?.('Image added · saved with the event'); });
    e.target.value = '';
  };
  return (
    <div data-field={p.join('.')}><Lbl hint="a path, a URL or an upload">{label}</Lbl>
      <div style={s('display:flex;align-items:center;gap:10px')}>
        <span style={{ ...s('flex:none;border-radius:10px;overflow:hidden;background:#1B0B2D;display:flex;align-items:center;justify-content:center'), width: square ? 46 : 74, height: 46 }}>{v && <img src={asset(v)} alt="" style={s('width:100%;height:100%;object-fit:' + (square ? 'contain' : 'cover'))} />}</span>
        <input value={v.startsWith('data:') ? '(uploaded image)' : v} onChange={(e) => { B.upd(p, e.target.value); load(e.target.value); }} style={s(fieldCss + ';flex:1')} />
        <button className="ah" onClick={() => file.current?.click()} style={s("display:flex;align-items:center;gap:6px;padding:11px 12px;border-radius:11px;font:600 12px/1 'Archivo';box-shadow:inset 0 0 0 1px rgba(27,11,45,.14);white-space:nowrap")}><Ms size={15} color="inherit">upload</Ms>Upload</button>
        <input ref={file} type="file" accept="image/*" onChange={pick} style={{ display: 'none' }} />
      </div>
    </div>
  );
}
const Grid = ({ cols = 2, children }: { cols?: number; children: ReactNode }) => <div style={{ ...s('display:grid;gap:14px'), gridTemplateColumns: `repeat(${cols},minmax(0,1fr))` }}>{children}</div>;
function Section({ title, sub, children, open: start = true, id }: { title: string; sub?: string; children: ReactNode; open?: boolean; id?: string }) {
  const [open, setOpen] = useState(start);
  return (
    <Card style={{ padding: 0 }}>
      <button data-section={id || title} onClick={() => setOpen(!open)} style={s('display:flex;align-items:center;gap:12px;width:100%;padding:18px 22px;text-align:left')}>
        <span style={s('flex:1')}><span style={s("display:block;font:700 15px/1.2 'Archivo'")}>{title}</span>{sub && <span style={s("display:block;font:400 12px/1.4 'Archivo';color:#826E99;margin-top:4px")}>{sub}</span>}</span>
        <Ms size={20} color="#513E66">{open ? 'expand_less' : 'expand_more'}</Ms>
      </button>
      {open && <div style={s('padding:0 22px 22px;display:flex;flex-direction:column;gap:14px')}>{children}</div>}
    </Card>
  );
}
// A list of objects, each edited with the same fields.
type Col = { k: string; label: string; w?: number; area?: boolean; type?: string; opts?: [string, string][]; num?: boolean; image?: boolean; csv?: boolean };
// A small image cell for lists (presenter photos, gallery images): same compression as every upload.
function ImageCell({ B, p }: { B: any; p: Path }) {
  const v = getAt(B.cfg, p) || '';
  const file = useRef<HTMLInputElement>(null);
  return (
    <div style={s('display:flex;align-items:center;gap:6px')}>
      <span style={s('width:36px;height:36px;flex:none;border-radius:8px;overflow:hidden;background:#1B0B2D')}>{v && <img src={asset(v)} alt="" style={s('width:100%;height:100%;object-fit:cover')} />}</span>
      <button className="ah" onClick={() => file.current?.click()} style={s("flex:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:9px 8px;border-radius:9px;font:600 11.5px/1 'Archivo';box-shadow:inset 0 0 0 1px rgba(27,11,45,.14);white-space:nowrap")}><Ms size={14} color="inherit">upload</Ms>{v ? 'Replace' : 'Upload'}</button>
      {v && <button aria-label="Remove image" onClick={() => B.upd(p, '')} style={s('display:flex;padding:3px;color:#C0473C')}><Ms size={15} color="inherit">close</Ms></button>}
      <input ref={file} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) compressImage(f, 1200).then(({ src }) => B.upd(p, src)); e.target.value = ''; }} style={{ display: 'none' }} />
    </div>
  );
}
function List({ B, p, cols, blank, label, max }: { B: any; p: Path; cols: Col[]; blank: () => any; label?: string; max?: number }) {
  const arr: any[] = getAt(B.cfg, p) || [];
  const move = (i: number, d: number) => { const a = arr.slice(); const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; B.upd(p, a); };
  return (
    <div data-list={p.join('.')}>
      {label && <Lbl>{label}</Lbl>}
      <div style={s('display:flex;flex-direction:column;gap:8px')}>
        {arr.map((row, i) => (
          <div key={i} style={s('display:flex;gap:8px;align-items:flex-start;padding:10px;border-radius:12px;background:#F7F7F4;box-shadow:inset 0 0 0 1px rgba(27,11,45,.06)')}>
            <span style={s("width:20px;flex:none;font:700 11px/34px 'Archivo';color:#826E99;text-align:center")}>{i + 1}</span>
            <div style={{ ...s('flex:1;min-width:0;display:grid;gap:8px'), gridTemplateColumns: cols.map((c) => (c.w ? c.w + 'fr' : '1fr')).join(' ') }}>
              {cols.map((c) => (
                <label key={c.k} style={s('display:block;min-width:0')}>
                  <span style={s("display:block;font:600 9px/1 'Archivo';letter-spacing:.1em;color:#A79BB6;margin-bottom:5px")}>{c.label}</span>
                  {c.csv ? <input value={(row[c.k] || []).join(', ')} onChange={(e) => B.upd([...p, i, c.k], e.target.value.split(',').map((x: string) => x.trim()).filter(Boolean))} style={s(fieldCss + ';padding:9px 10px')} />
                  : c.image ? <ImageCell B={B} p={[...p, i, c.k]} /> : c.opts
                    ? <select value={row[c.k] ?? (c.num ? '0' : '')} onChange={(e) => B.upd([...p, i, c.k], c.num ? Number(e.target.value) : e.target.value)} style={s(fieldCss + ';padding:9px 10px')}>{c.opts.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select>
                    : c.area
                      ? <textarea value={row[c.k] ?? ''} rows={2} onChange={(e) => B.upd([...p, i, c.k], e.target.value)} style={s(fieldCss + ';padding:9px 10px;resize:vertical')} />
                      : <input type={c.type || 'text'} value={row[c.k] ?? ''} onChange={(e) => B.upd([...p, i, c.k], c.type === 'number' ? Number(e.target.value) : e.target.value)} style={s(fieldCss + ';padding:9px 10px')} />}
                </label>
              ))}
            </div>
            <div style={s('display:flex;flex-direction:column;gap:2px;padding-top:14px')}>
              <button aria-label="Move up" onClick={() => move(i, -1)} style={s('display:flex;padding:3px;color:#826E99')}><Ms size={16} color="inherit">arrow_upward</Ms></button>
              <button aria-label="Move down" onClick={() => move(i, 1)} style={s('display:flex;padding:3px;color:#826E99')}><Ms size={16} color="inherit">arrow_downward</Ms></button>
              <button aria-label="Remove" onClick={() => B.upd(p, arr.filter((_, k) => k !== i))} style={s('display:flex;padding:3px;color:#C0473C')}><Ms size={16} color="inherit">close</Ms></button>
            </div>
          </div>
        ))}
        {(!max || arr.length < max) && <button className="ah" data-add={p.join('.')} onClick={() => B.upd(p, [...arr, blank()])} style={s("display:flex;align-items:center;justify-content:center;gap:6px;padding:11px;border-radius:12px;font:600 12px/1 'Archivo';color:#513E66;box-shadow:inset 0 0 0 1px rgba(27,11,45,.14);border-style:dashed")}><Ms size={16} color="inherit">add</Ms>Add</button>}
      </div>
    </div>
  );
}
// A comma-separated list of strings.
function Csv({ B, p, label, hint }: { B: any; p: Path; label: string; hint?: string }) {
  const arr: string[] = getAt(B.cfg, p) || [];
  const [txt, setTxt] = useState(arr.join(', '));
  useEffect(() => { setTxt(arr.join(', ')); }, [arr.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  return <label style={s('display:block')} data-field={p.join('.')}><Lbl hint={hint || 'comma-separated'}>{label}</Lbl><input value={txt} onChange={(e) => { setTxt(e.target.value); B.upd(p, e.target.value.split(',').map((x) => x.trim()).filter(Boolean)); }} style={s(fieldCss)} /></label>;
}
// A comma-separated list of numbers.
function NumCsv({ B, p, label }: { B: any; p: Path; label: string }) {
  const arr: number[] = getAt(B.cfg, p) || [];
  const [txt, setTxt] = useState(arr.join(', '));
  useEffect(() => { setTxt(arr.join(', ')); }, [arr.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  return <label style={s('display:block')} data-field={p.join('.')}><Lbl hint="comma-separated">{label}</Lbl><input value={txt} onChange={(e) => { setTxt(e.target.value); B.upd(p, e.target.value.split(',').map((x) => Number(x.trim())).filter((n) => !isNaN(n) && String(n) !== '')); }} style={s(fieldCss)} /></label>;
}
// Poll options as "Option: share" lines.
function PollOpts({ B, p }: { B: any; p: Path }) {
  const o: Record<string, number> = getAt(B.cfg, p) || {};
  const [txt, setTxt] = useState(Object.entries(o).map(([k, v]) => `${k}: ${v}`).join('\n'));
  const parse = (t: string) => Object.fromEntries(t.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { const m = l.match(/^(.*?)(?::\s*(\d+))?$/); return [m?.[1].trim() || l, Number(m?.[2] || 0)]; }));
  return <textarea value={txt} rows={4} onChange={(e) => { setTxt(e.target.value); B.upd(p, parse(e.target.value)); }} style={s(fieldCss + ';padding:9px 10px;resize:vertical')} />;
}

// ── 1 BRAND ──
function BrandStep({ cfg, upd }: any) {
  const B = { cfg, upd };
  const c = cfg as EventConfig;
  return (
    <>
      <Section title="Brand" sub="Name, logo and the words in the fan view’s top bar.">
        <Grid><Text B={B} p={['brand', 'name']} label="BRAND NAME" ph="e.g. Halo" /><Text B={B} p={['brand', 'domain']} label="ADDRESS SHOWN AT THE FOOT" ph="connect.boltos.ai/brand" /></Grid>
        <Grid><Text B={B} p={['brand', 'wordmark']} label="WORDMARK" hint="top bar" /><Text B={B} p={['brand', 'wordmarkShort']} label="SHORT WORDMARK" hint="small phones" /></Grid>
        <ImageField B={B} p={['brand', 'logo']} label="LOGO" square />
      </Section>
      <Section title="Colours" sub="Two colours re-tint the fan view inside the Connect design system: an accent and a dark base.">
        <Grid>
          <Colour B={B} p={['brand', 'accent']} label="ACCENT" swatches={['#8B3DF5', '#17C3B2', '#FF5A36', '#2F7CF6', '#E8B400']} />
          <Colour B={B} p={['brand', 'dark']} label="DARK BASE" swatches={['#160925', '#071A24', '#1A0F0A', '#0B1530', '#141414']} />
        </Grid>
        <div style={s('display:flex;gap:8px;align-items:center')}>
          {[c.brand.dark, mix(c.brand.dark, '#ffffff', 0.12), c.brand.accent, mix(c.brand.accent, '#ffffff', 0.38), mix(mix(c.brand.dark, '#ffffff', 0.58), c.brand.accent, 0.12)].map((h, i) => <span key={i} title={h} style={{ ...s('flex:1;height:34px;border-radius:9px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.08)'), background: h }} />)}
        </div>
        <div style={s("font:400 11.5px/1.45 'Archivo';color:#826E99")}>Derived tokens: hero, panels, accent, light accent and muted text. Status colours (live red, break blue) stay the same for every brand.</div>
      </Section>
    </>
  );
}

// ── 2 EVENT ──
function EventStep({ cfg, upd, setDraft }: any) {
  const B = { cfg, upd };
  const c = cfg as EventConfig;
  const applyTpl = (id: string) => {
    const t = TEMPLATES.find((x) => x.id === id)!;
    if (c.event.template === id) return;
    if (!window.confirm(`Switch to the ${t.name} template? This replaces the segments with the template’s running order.`)) return;
    setDraft((d: EventConfig) => {
      const times = ['09:00', '09:30', '10:30', '13:00', '15:00', '16:00'];
      const segs = t.segments.map(([name, kind], i) => ({ id: 's' + (i + 1), name, short: name.toUpperCase(), time: times[i] || '17:00', kind, blurb: '', note: '', heroTitle: name.toUpperCase(), heroSub: '' }));
      const next = { ...d, event: { ...d.event, template: t.id, format: t.format }, segments: segs, demo: { ...d.demo, results: { ...d.demo.results, engagement: segs.map((g, i) => ({ seg: g.name, pct: [38, 64, 92, 71, 55, 44][i] || 40 })) } } };
      if (t.id !== 'sport') return next;
      const sp = sportStarter(JSON.parse(JSON.stringify(next)));
      if (sp.event.countdownLabel === 'REVEAL IN') { sp.event.countdownLabel = 'STARTS IN'; sp.event.inviteTitle = 'BE THERE FOR THE START'; sp.event.inviteSub = 'In person or online, the same moment.'; }
      if (sp.event.kickerSub === TPL_KICKER_SUB) sp.event.kickerSub = autoKickerSub(sp);
      return sp;
    });
  };
  const kinds: [string, string][] = [['doors', 'Doors / arrival'], ['talk', 'Talk'], ['reveal', 'Reveal moment'], ['qa', 'Q&A'], ['other', 'Other']];
  return (
    <>
      <Section title="Template" sub="A starting point: it pre-fills the format and running order. Everything stays editable.">
        <div style={s('display:grid;grid-template-columns:repeat(4,1fr);gap:12px')}>
          {TEMPLATES.map((t) => { const on = c.event.template === t.id; return (
            <button key={t.id} data-template={t.id} onClick={() => applyTpl(t.id)} className="ah" style={{ ...s('display:flex;flex-direction:column;align-items:flex-start;gap:9px;padding:15px;border-radius:14px;text-align:left'), background: on ? '#F1F1EE' : '#FFFFFF', boxShadow: on ? 'inset 0 0 0 2px #1B0B2D' : 'inset 0 0 0 1px rgba(27,11,45,.12)' }}>
              <Ms size={22} color="#8B3DF5">{t.icon}</Ms><span style={s("font:700 14px/1.2 'Archivo'")}>{t.name}</span><span style={s("font:400 11.5px/1.45 'Archivo';color:#513E66")}>{t.blurb}</span>
            </button>
          ); })}
        </div>
      </Section>
      <Section title="Event" sub="Name, format, date and place.">
        <Text B={B} p={['event', 'name']} label="EVENT NAME" ph="e.g. Lumen X1 launch" />
        <Grid cols={3}>
          <Pick B={B} p={['event', 'format']} label="FORMAT" opts={[['In person', 'In person'], ['Online', 'Online'], ['Hybrid', 'Hybrid']]} />
          <Text B={B} p={['event', 'date']} label="DATE" type="date" />
          <Text B={B} p={['event', 'time']} label="START" type="time" />
        </Grid>
        <Grid cols={3}><Text B={B} p={['event', 'dayLabel']} label="DAY LABEL" hint="top bar" ph="TUE 20:00" /><Text B={B} p={['event', 'dateShort']} label="SHORT DATE" ph="TUE 10 NOV" /><Pick B={B} p={['status']} label="STATUS" opts={[['draft', 'Draft'], ['upcoming', 'Upcoming'], ['live', 'Live'], ['past', 'Past']]} /></Grid>
        <Grid cols={2}><Text B={B} p={['event', 'venue']} label="VENUE" /><Text B={B} p={['event', 'city']} label="CITY" /></Grid>
        <Grid cols={2}><Text B={B} p={['event', 'venueShort']} label="VENUE, SHORT" hint="caps" /><Text B={B} p={['event', 'venueWord']} label="VENUE WORD" hint="“IN THE HALL”" /></Grid>
      </Section>
      <Section title="Running order" sub="Segments the organiser moves through live. Mark one as the reveal moment and one as Q&A.">
        <List B={B} p={['segments']} cols={[...(c.days?.length ? [{ k: 'day', label: 'DAY', w: 0.9, opts: c.days.map((d, i) => [String(i), d.label] as [string, string]), num: true }] : []), { k: 'time', label: 'TIME', w: 0.7 }, { k: 'name', label: 'NAME', w: 1.4 }, { k: 'short', label: 'SHORT', w: 1 }, { k: 'kind', label: 'TYPE', w: 1.2, opts: kinds }, { k: 'blurb', label: 'AGENDA LINE', w: 2 }]} blank={() => ({ id: 's' + Date.now(), name: 'New segment', short: 'NEW', time: '12:00', kind: 'talk' as SegKind, blurb: '', note: '', heroTitle: 'NEW SEGMENT', heroSub: '' })} />
        <List B={B} p={['segments']} label="WHAT FANS SEE IN EACH SEGMENT" cols={[{ k: 'heroTitle', label: 'HERO TITLE', w: 1.2 }, { k: 'heroSub', label: 'HERO LINE', w: 2 }, { k: 'heroSubOnline', label: 'LINE FOR ONLINE FANS', w: 2 }, { k: 'note', label: 'BANNER NOTE', w: 1.6 }]} blank={() => ({ id: 's' + Date.now(), name: 'New segment', short: 'NEW', time: '12:00', kind: 'talk', blurb: '', note: '', heroTitle: 'NEW', heroSub: '' })} />
      </Section>
      <Section title="Days" sub="For multi-day events. Each segment then picks its day, and the agenda and Studio group by day." open={!!c.days?.length} id="days">
        <List B={B} p={['days']} cols={[{ k: 'label', label: 'LABEL', w: 1 }, { k: 'date', label: 'DATE', w: 1 }, { k: 'sub', label: 'WHAT HAPPENS', w: 2 }]} blank={() => ({ label: 'Day ' + ((c.days?.length || 0) + 1), date: '', sub: '' })} />
      </Section>
      <Section title="Series" sub="Group events into a series. They share one community and points carry across every stage." open={!!c.series} id="series">
        {c.series ? <>
          <Grid cols={3}><Text B={B} p={['series', 'name']} label="SERIES NAME" /><Text B={B} p={['series', 'id']} label="SERIES ID" hint="same on every stage" /><Text B={B} p={['series', 'stage']} label="THIS STAGE" /></Grid>
          <Grid cols={3}><Text B={B} p={['series', 'order']} label="STAGE NUMBER" type="number" /><Text B={B} p={['series', 'total']} label="STAGES IN TOTAL" type="number" /><Csv B={B} p={['series', 'stages']} label="ALL STAGES" /></Grid>
          <button className="ah" onClick={() => upd(['series'], undefined)} style={s("align-self:flex-start;padding:9px 12px;border-radius:10px;font:600 12px/1 'Archivo';color:#C0473C;box-shadow:inset 0 0 0 1px rgba(27,11,45,.14)")}>Remove from series</button>
        </> : <button className="ah" data-add="series" onClick={() => upd(['series'], { id: 'series-' + c.id, name: c.event.name + ' series', stage: 'Stage 1', order: 1, total: 3, stages: ['Stage 1', 'Stage 2', 'Final'] })} style={s("padding:11px;border-radius:12px;font:600 12px/1 'Archivo';color:#513E66;box-shadow:inset 0 0 0 1px rgba(27,11,45,.14)")}>Make this part of a series</button>}
      </Section>
      <Section title="Event page (Before)" sub="The countdown hero, registration and details." open={false} id="before">
        <Grid cols={3}><Text B={B} p={['event', 'kicker']} label="KICKER" /><Text B={B} p={['event', 'kickerSub']} label="KICKER LINE" /><Text B={B} p={['event', 'title']} label="HERO TITLE" /></Grid>
        <Grid cols={3}><Text B={B} p={['event', 'countdownLabel']} label="COUNTDOWN LABEL" ph="STARTS IN" /><Text B={B} p={['event', 'countdownSeconds']} label="COUNTDOWN SECONDS" type="number" /><Text B={B} p={['event', 'dateLine']} label="DATE LINE" /></Grid>
        <Grid><Text B={B} p={['event', 'inviteTitle']} label="INVITE STRIP TITLE" /><Text B={B} p={['event', 'inviteSub']} label="INVITE STRIP LINE" /></Grid>
        <Grid cols={3}><Text B={B} p={['event', 'venueOption']} label="IN-PERSON OPTION" /><Text B={B} p={['event', 'venueOptionSub']} label="IN-PERSON LINE" /><Text B={B} p={['event', 'onlineOptionSub']} label="ONLINE LINE" /></Grid>
        <Grid><Text B={B} p={['event', 'registeredVenue']} label="REGISTERED · IN PERSON" /><Text B={B} p={['event', 'registeredOnline']} label="REGISTERED · ONLINE" /></Grid>
        <List B={B} p={['event', 'details']} label="EVENT DETAILS" cols={[{ k: 'icon', label: 'ICON', w: 0.8 }, { k: 'k', label: 'LABEL', w: 0.8 }, { k: 'v', label: 'TEXT', w: 3 }]} blank={() => ({ icon: 'info', k: 'Note', v: '' })} />
      </Section>
    </>
  );
}

// ── 3 MODULES ──
// Every event is the same template; this is where its blocks are switched on or off.
function ModulesStep({ cfg, upd }: any) {
  const B = { cfg, upd };
  const c = cfg as EventConfig;
  const set = (k: ModuleKey, v: boolean) => upd(['modules'], { ...(c.modules || {}), [k]: v });
  return (
    <>
      <Section title="Modules" sub="Same fan view and Studio for every event. Switch blocks on or off; a block with no content yet stays hidden until you add it.">
        <div style={s('display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px')}>
          {MODULES.map((m) => { const want = c.modules?.[m.key] ?? true; const has = m.has(c); const on = want && has; return (
            <button key={m.key} data-module={m.key} onClick={() => set(m.key, !want)} className="ah" style={{ ...s('display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;text-align:left'), background: on ? '#FFFFFF' : '#F7F7F4', boxShadow: on ? 'inset 0 0 0 2px #1B0B2D' : 'inset 0 0 0 1px rgba(27,11,45,.1)' }}>
              <span style={{ ...s('width:34px;height:20px;flex:none;border-radius:999px;position:relative;transition:background .15s'), background: want ? '#8B3DF5' : '#D3D0CC' }}><span style={{ ...s('position:absolute;top:2px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .15s'), left: want ? 16 : 2 }} /></span>
              <span style={s('flex:1;min-width:0')}><span style={s("display:block;font:700 13px/1.2 'Archivo'")}>{m.name}</span><span style={s("display:block;font:400 11.5px/1.35 'Archivo';color:#826E99;margin-top:3px")}>{want && !has ? 'On, but no content yet' : m.blurb}</span></span>
            </button>
          ); })}
        </div>
      </Section>
      <Section title="Live screen layout" sub="Where the livestream sits for online fans during the live state.">
        <Pick B={B} p={['layout', 'live']} label="LAYOUT" opts={[['stream-first', 'Stream first, then the reveal'], ['reveal-first', 'Reveal first, stream below']]} />
      </Section>
      <Section title="Countdown wording" sub="Shown over the countdown on the event page, e.g. Reveal in, Gates open in, Tip-off in.">
        <Grid><Text B={B} p={['event', 'countdownLabel']} label="COUNTDOWN LABEL" ph="REVEAL IN" /><Text B={B} p={['event', 'countdownSeconds']} label="SECONDS TO GO (DEMO)" type="number" /></Grid>
      </Section>
    </>
  );
}

// ── 4 CONTENT ──
function ContentStep({ cfg, upd, say }: any) {
  const B = { cfg, upd, say };
  const c = cfg as EventConfig;
  const [sel, setSel] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const place = (e: MouseEvent) => {
    const r = box.current!.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * 1000) / 10, y = Math.round(((e.clientY - r.top) / r.height) * 1000) / 10;
    if (!c.hotspots[sel]) { upd(['hotspots'], [...c.hotspots, { id: 'h' + Date.now(), x, y, name: 'New feature', desc: '', stat: '', unit: '' }]); setSel(c.hotspots.length); return; }
    upd(['hotspots', sel, 'x'], x); upd(['hotspots', sel, 'y'], y);
  };
  const T = (t: Target) => TARGETS.find((x) => x.id === t)!.name;
  return (
    <>
      <Section title="Hero image and features" sub="The image fans see covered before the reveal, then lit with tappable feature points. Click the image to place the selected point.">
        <ImageField B={B} p={['event', 'heroImage', 'src']} label="HERO IMAGE" onSize={(w, h) => { upd(['event', 'heroImage', 'w'], w); upd(['event', 'heroImage', 'h'], h); }} />
        <div style={s('display:flex;gap:16px;align-items:flex-start')}>
          <div ref={box} onClick={place} data-hotspot-canvas style={{ ...s('position:relative;flex:1.3;border-radius:12px;overflow:hidden;cursor:crosshair'), aspectRatio: `${c.event.heroImage.w}/${c.event.heroImage.h}`, background: c.brand.dark }}>
            {c.event.heroImage.src && <img src={asset(c.event.heroImage.src)} alt="" style={s('position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none')} />}
            {c.hotspots.map((h, i) => <span key={h.id} style={{ ...s("position:absolute;width:24px;height:24px;margin:-12px 0 0 -12px;border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font:700 10px/1 'Archivo';color:#fff;pointer-events:none"), left: h.x + '%', top: h.y + '%', background: i === sel ? c.brand.accent : 'rgba(0,0,0,.45)', boxShadow: i === sel ? '0 0 0 4px rgba(255,255,255,.35)' : 'none' }}>{i + 1}</span>)}
          </div>
          <div style={s('flex:1;display:flex;flex-direction:column;gap:6px')}>
            <Lbl hint="pick, then click the image">POINT TO PLACE</Lbl>
            {c.hotspots.map((h, i) => <button key={h.id} onClick={() => setSel(i)} style={{ ...s("display:flex;align-items:center;gap:8px;padding:9px 11px;border-radius:10px;text-align:left;font:600 12.5px/1.2 'Archivo'"), background: i === sel ? '#1B0B2D' : '#F1F1EE', color: i === sel ? '#F5F5F2' : '#1B0B2D' }}><span style={s("width:18px;font:700 11px/1 'Archivo'")}>{i + 1}</span><span style={s('flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{h.name || 'Untitled'}</span><span style={s("font:500 10.5px/1 'Archivo';opacity:.7")}>{h.x}, {h.y}</span></button>)}
            <button onClick={() => setSel(c.hotspots.length)} style={{ ...s("display:flex;align-items:center;gap:6px;padding:9px 11px;border-radius:10px;font:600 12px/1 'Archivo';box-shadow:inset 0 0 0 1px rgba(27,11,45,.14)"), background: sel >= c.hotspots.length ? '#F3ECFE' : 'transparent' }}><Ms size={15} color="inherit">add</Ms>New point (click image)</button>
          </div>
        </div>
        <List B={B} p={['hotspots']} label="FEATURES" cols={[{ k: 'name', label: 'NAME', w: 1.2 }, { k: 'stat', label: 'NUMBER', w: 0.7 }, { k: 'unit', label: 'UNIT', w: 1.2 }, { k: 'desc', label: 'DESCRIPTION', w: 2.4, area: true }]} blank={() => ({ id: 'h' + Date.now(), x: 50, y: 50, name: 'New feature', desc: '', stat: '', unit: '' })} />
      </Section>
      <Section title="Reveal moment" sub="The full-screen moment when the organiser fires Reveal. It uses the hero image unless you set a reveal image or video.">
        <Grid>
          <ImageField B={B} p={['reveal', 'logo']} label="REVEAL LOGO (OPTIONAL)" square />
          <Pick B={B} p={['reveal', 'media', 'kind']} label="REVEAL VISUAL" opts={[['image', 'Image'], ['video', 'Video']]} />
        </Grid>
        {c.reveal.media?.kind === 'video'
          ? <Text B={B} p={['reveal', 'media', 'src']} label="VIDEO URL" hint="MP4 link; plays muted, on loop" ph="https://…/reveal.mp4" />
          : <ImageField B={B} p={['reveal', 'media', 'src']} label="REVEAL IMAGE (OPTIONAL)" onSize={(w, h) => { upd(['reveal', 'media', 'w'], w); upd(['reveal', 'media', 'h'], h); upd(['reveal', 'media', 'kind'], 'image'); }} />}
        <Grid cols={3}><Text B={B} p={['reveal', 'kicker']} label="KICKER" /><Text B={B} p={['reveal', 'word1']} label="SMALL WORD" /><Text B={B} p={['reveal', 'word2']} label="BIG WORD" /></Grid>
        <Grid><Text B={B} p={['reveal', 'line']} label="LINE UNDER" /><Text B={B} p={['reveal', 'thirdNote']} label="BANNER NOTE AFTER" /></Grid>
        <Grid cols={3}><Text B={B} p={['reveal', 'title']} label="LIVE HERO TITLE" /><Text B={B} p={['reveal', 'sub']} label="LIVE HERO LINE" /><Text B={B} p={['reveal', 'triggerBlurb']} label="STUDIO BUTTON HINT" /></Grid>
      </Section>
      <Section title="Trims and prices" sub="The line-up shown after the reveal, in the recap, and in Build your product." open={false} id="product">
        <Grid><Text B={B} p={['product', 'sectionTitle']} label="SECTION TITLE" /><Text B={B} p={['product', 'priceLine']} label="PRICE LINE" /></Grid>
        <List B={B} p={['product', 'variants']} cols={[{ k: 'name', label: 'TRIM', w: 1.3 }, { k: 'spec', label: 'DETAIL', w: 2.4 }, { k: 'price', label: 'PRICE', w: 0.9 }]} blank={() => ({ name: 'New trim', spec: '', price: '' })} />
      </Section>
      <Section title="Product gallery" sub="Images shown after the reveal and in the recap." open={!!c.gallery?.items?.length} id="gallery">
        <Text B={B} p={['gallery', 'title']} label="GALLERY TITLE" ph="GALLERY" />
        <List B={B} p={['gallery', 'items']} cols={[{ k: 'src', label: 'IMAGE', w: 1.3, image: true }, { k: 'caption', label: 'CAPTION', w: 2.4 }]} blank={() => ({ src: '', caption: '' })} />
      </Section>
      <Section title="Build your product and monthly cost" sub="Colour swatches, the default trim and the monthly cost estimate. Switch them on or off in Modules." open={!!c.showroom} id="showroom">
        {c.showroom ? <>
          <Grid cols={3}><Text B={B} p={['showroom', 'buildTitle']} label="SCREEN TITLE" ph="BUILD YOUR PRODUCT" /><Text B={B} p={['showroom', 'buildSub']} label="LINE UNDER" /><label style={s('display:block')}><Lbl>DEFAULT TRIM</Lbl><select value={c.showroom.defaultVariant ?? 1} onChange={(e) => upd(['showroom', 'defaultVariant'], Number(e.target.value))} style={s(fieldCss + ';padding:9px 10px')}>{c.product.variants.map((v, i) => <option key={i} value={i}>{v.name}</option>)}</select></label></Grid>
          <List B={B} p={['showroom', 'colours']} label="COLOUR SWATCHES" cols={[{ k: 'name', label: 'NAME', w: 1.6 }, { k: 'hex', label: 'HEX', w: 0.9 }]} blank={() => ({ name: 'New colour', hex: '#888888' })} />
          <div style={s('height:1px;background:rgba(27,11,45,.08)')} />
          <Grid cols={3}><Text B={B} p={['showroom', 'finance', 'title']} label="MONTHLY COST TITLE" /><Text B={B} p={['showroom', 'finance', 'rate']} label="FLAT RATE %" type="number" /><Pick B={B} p={['showroom', 'finance', 'termUnit']} label="TERMS IN" opts={[['years', 'Years'], ['months', 'Months']]} /></Grid>
          <Grid cols={3}><NumCsv B={B} p={['showroom', 'finance', 'deposits']} label="DEPOSIT OPTIONS %" /><NumCsv B={B} p={['showroom', 'finance', 'terms']} label="TERM OPTIONS" /><Grid><Text B={B} p={['showroom', 'finance', 'defaultDeposit']} label="DEFAULT %" type="number" /><Text B={B} p={['showroom', 'finance', 'defaultTerm']} label="DEFAULT TERM" type="number" /></Grid></Grid>
          <Grid cols={2}>
            <Grid cols={3}><Text B={B} p={['showroom', 'finance', 'depositRange', 0]} label="DEPOSIT SLIDER MIN %" type="number" /><Text B={B} p={['showroom', 'finance', 'depositRange', 1]} label="MAX %" type="number" /><Text B={B} p={['showroom', 'finance', 'depositRange', 2]} label="STEP" type="number" /></Grid>
            <Grid cols={3}><Text B={B} p={['showroom', 'finance', 'termRange', 0]} label="TERM SLIDER MIN" type="number" /><Text B={B} p={['showroom', 'finance', 'termRange', 1]} label="MAX" type="number" /><Text B={B} p={['showroom', 'finance', 'termRange', 2]} label="STEP" type="number" /></Grid>
          </Grid>
          <Grid><Text B={B} p={['showroom', 'finance', 'sub']} label="LINE UNDER" /><Text B={B} p={['showroom', 'finance', 'note']} label="SMALL PRINT" /></Grid>
          <List B={B} p={['showroom', 'finance', 'running', 'rows']} label="RUNNING COST ROWS (OPTIONAL)" cols={[{ k: 'label', label: 'LABEL', w: 2 }, { k: 'v', label: 'A MONTH', w: 0.8, type: 'number' }]} blank={() => ({ label: 'New row', v: 0 })} />
          <button className="ah" onClick={() => upd(['showroom'], undefined)} style={s("align-self:flex-start;padding:9px 12px;border-radius:10px;font:600 12px/1 'Archivo';color:#C0473C;box-shadow:inset 0 0 0 1px rgba(27,11,45,.14)")}>Remove Build your product</button>
        </> : <button className="ah" data-add="showroom" onClick={() => upd(['showroom'], { buildTitle: 'BUILD YOURS', buildSub: 'Pick a colour and a trim.', colours: [{ name: 'Black', hex: '#1C1C1E' }, { name: 'White', hex: '#EDEDED' }], defaultVariant: 0, finance: { title: 'MONTHLY COST', sub: 'Indicative instalments.', rate: 0, deposits: [0, 10, 20], terms: [12, 24], defaultDeposit: 0, defaultTerm: 24, termUnit: 'months', note: 'Indicative only.' } })} style={s("padding:11px;border-radius:12px;font:600 12px/1 'Archivo';color:#513E66;box-shadow:inset 0 0 0 1px rgba(27,11,45,.14)")}>Add Build your product and monthly cost</button>}
      </Section>
      <Section title="Polls" sub="Pushed one at a time with the Poll trigger. Options as “Option: starting share”, one per line." open={false} id="polls">
        {c.polls.map((pl, i) => (
          <div key={pl.id} style={s('display:grid;grid-template-columns:2fr 1.4fr 0.6fr auto;gap:10px;align-items:start;padding:10px;border-radius:12px;background:#F7F7F4')}>
            <div style={s('display:flex;flex-direction:column;gap:10px')}><Text B={B} p={['polls', i, 'q']} label={'POLL ' + (i + 1)} />{c.sponsorKit?.length ? <SponsorPick B={B} p={['polls', i, 'sponsor']} /> : null}</div><div><Lbl>OPTIONS</Lbl><PollOpts B={B} p={['polls', i, 'opts']} /></div><Text B={B} p={['polls', i, 'votes']} label="VOTES" type="number" />
            <button aria-label="Remove poll" onClick={() => upd(['polls'], c.polls.filter((_, k) => k !== i))} style={s('display:flex;padding:24px 4px 0;color:#C0473C')}><Ms size={17} color="inherit">close</Ms></button>
          </div>
        ))}
        <button className="ah" data-add="polls" onClick={() => upd(['polls'], [...c.polls, { id: 'p' + Date.now(), q: 'New question?', opts: { Yes: 50, No: 50 }, votes: 1000 }])} style={s("padding:11px;border-radius:12px;font:600 12px/1 'Archivo';color:#513E66;box-shadow:inset 0 0 0 1px rgba(27,11,45,.14)")}>Add poll</button>
      </Section>
      <Section title="Announcements and reminders" sub="Banners for the Announcement trigger, by audience, and the reminder presets in Invite." open={false} id="announce">
        {(['all', 'venue', 'online'] as Target[]).map((t) => <List key={t} B={B} p={['announcements', t]} label={'ANNOUNCEMENTS · ' + T(t).toUpperCase()} cols={[{ k: 'kicker', label: 'KICKER', w: 1 }, { k: 'title', label: 'TITLE', w: 1.6 }, { k: 'sub', label: 'LINE', w: 2.4 }, ...(c.sponsorKit?.length ? [{ k: 'sponsor', label: 'SPONSOR', w: 1.1, opts: sponsorOpts(c) }] : [])]} blank={() => ({ kicker: 'UPDATE', title: 'New announcement', sub: '' })} />)}
        <List B={B} p={['reminders']} label="REMINDER PRESETS" cols={[{ k: 'title', label: 'TITLE', w: 1.4 }, { k: 'body', label: 'MESSAGE', w: 3, area: true }, { k: 'target', label: 'AUDIENCE', w: 1, opts: TARGETS.map((x) => [x.id, x.name]) }]} blank={() => ({ title: 'New reminder', body: '', target: 'all' })} />
      </Section>
      <Section title="Story cards" sub="Teams, drivers or players, each with a short story and one number." open={!!c.stories?.items?.length} id="stories">
        <Text B={B} p={['stories', 'title']} label="SECTION TITLE" ph="TEAMS + DRIVERS" />
        <List B={B} p={['stories', 'items']} cols={[{ k: 'kicker', label: 'KICKER', w: 1 }, { k: 'title', label: 'TITLE', w: 1.2 }, { k: 'body', label: 'STORY', w: 2.6, area: true }, { k: 'stat', label: 'NUMBER', w: 0.7 }, { k: 'unit', label: 'UNIT', w: 1 }, { k: 'color', label: 'COLOUR', w: 0.8 }]} blank={() => ({ kicker: 'TEAM', title: 'New story', body: '', stat: '', unit: '', color: '' })} />
      </Section>
      <Section title="Presenters and sponsors" open={false} id="people">
        <List B={B} p={['presenters']} cols={[{ k: 'name', label: 'NAME', w: 1.2 }, { k: 'role', label: 'ROLE', w: 1.5 }, { k: 'slot', label: 'SLOT', w: 1 }, { k: 'photo', label: 'PHOTO (OPTIONAL, ELSE INITIALS)', w: 1.6, image: true }]} blank={() => ({ name: 'New presenter', role: '', slot: '', photo: '' })} />
        <Csv B={B} p={['sponsors']} label="SPONSORS" />
      </Section>
      <Section title="Dealers" sub="Who leads are passed to. Each lead is suggested the dealer whose areas include their registered location; test drive bookings preselect it." open={!!c.dealers?.length} id="dealers">
        <List B={B} p={['dealers']} cols={[{ k: 'name', label: 'NAME', w: 1.3 }, { k: 'area', label: 'ADDRESS / AREA', w: 1.6 }, { k: 'contact', label: 'CONTACT', w: 1.8 }, { k: 'areas', label: 'COVERS (REGISTRATION ANSWERS)', w: 1.6, csv: true }]} blank={() => ({ id: 'd' + Date.now(), name: 'New dealer', area: '', contact: '', areas: [] })} />
        <Csv B={B} p={['leadStatuses']} label="LEAD STATUSES" hint="in order, e.g. New, Contacted, Test drive done, Sold" />
      </Section>
      <Section title="Call to action" sub="The After page’s main action, e.g. “Book a test drive” or “Book a demo”." open={false} id="cta">
        <Grid cols={3}><Text B={B} p={['cta', 'title']} label="TITLE" /><Text B={B} p={['cta', 'button']} label="BUTTON" /><Text B={B} p={['cta', 'cardKicker']} label="CARD KICKER" /></Grid>
        <Text B={B} p={['cta', 'sub']} label="CARD LINE" />
        <Grid cols={3}><Text B={B} p={['cta', 'screenTitle']} label="SCREEN TITLE" /><Text B={B} p={['cta', 'screenMeta']} label="SCREEN TAG" /><Text B={B} p={['cta', 'submit']} label="SUBMIT BUTTON" /></Grid>
        <Text B={B} p={['cta', 'intro']} label="SCREEN INTRO" />
        <Grid><Text B={B} p={['cta', 'optionsLabel']} label="OPTIONS LABEL" ph="SHOWROOM" /><Text B={B} p={['cta', 'slotsLabel']} label="TIMES LABEL" ph="TIME" /></Grid>
        <List B={B} p={['cta', 'options']} label="OPTIONS" cols={[{ k: 'name', label: 'NAME', w: 1.4 }, { k: 'sub', label: 'LINE', w: 2 }]} blank={() => ({ id: 'o' + Date.now(), name: 'New option', sub: '' })} />
        <Csv B={B} p={['cta', 'slots']} label="TIMES" />
        <Grid><Text B={B} p={['cta', 'doneTitle']} label="CONFIRMED TITLE" /><Text B={B} p={['cta', 'doneSub']} label="CONFIRMED LINE" /></Grid>
        <Grid cols={2}><Text B={B} p={['follow', 'title']} label="FOLLOW TITLE" /><Text B={B} p={['follow', 'sub']} label="FOLLOW LINE" /></Grid>
        <Grid cols={2}><Text B={B} p={['follow', 'doneTitle']} label="FOLLOWING TITLE" /><Text B={B} p={['follow', 'doneSub']} label="FOLLOWING LINE" /></Grid>
      </Section>
      <Section title="Break, After and Always-on" open={false} id="later">
        <Grid cols={3}><Text B={B} p={['breakContent', 'minutes']} label="BREAK MINUTES" type="number" /><Text B={B} p={['breakContent', 'sub']} label="BREAK LINE" /><Text B={B} p={['breakContent', 'poll', 'q']} label="BREAK POLL" /></Grid>
        <div><Lbl>BREAK POLL OPTIONS</Lbl><PollOpts B={B} p={['breakContent', 'poll', 'opts']} /></div>
        <List B={B} p={['breakContent', 'reads']} label="BREAK NOTES" cols={[{ k: 'kicker', label: 'KICKER', w: 1 }, { k: 'title', label: 'TITLE', w: 1.6 }, { k: 'body', label: 'TEXT', w: 2.6, area: true }]} blank={() => ({ kicker: 'NOTE', title: 'New note', body: '' })} />
        <Grid cols={3}><Text B={B} p={['after', 'badge']} label="AFTER BADGE" /><Text B={B} p={['after', 'title']} label="AFTER TITLE" /><Text B={B} p={['after', 'recapTitle']} label="RECAP HEADING" /></Grid>
        <Text B={B} p={['after', 'sub']} label="AFTER LINE" />
        <Grid cols={3}>{[0, 1, 2].map((i) => <Grid key={i}><Text B={B} p={['after', 'stats', i, 0]} label={'STAT ' + (i + 1)} ph="10,426" /><Text B={B} p={['after', 'stats', i, 1]} label="LABEL" ph="WATCHED" /></Grid>)}</Grid>
        <Grid cols={2}><Text B={B} p={['community', 'badge']} label="COMMUNITY BADGE" /><Text B={B} p={['community', 'title']} label="COMMUNITY TITLE" hint="new line = break" area /></Grid>
        <Text B={B} p={['community', 'sub']} label="COMMUNITY LINE" />
        <Grid cols={3}><Text B={B} p={['community', 'next', 'name']} label="NEXT EVENT" /><Text B={B} p={['community', 'next', 'date']} label="NEXT DATE" /><Text B={B} p={['community', 'next', 'days']} label="DAYS AWAY" type="number" /></Grid>
        <Grid cols={3}><Text B={B} p={['community', 'next', 'kicker']} label="NEXT KICKER" /><Text B={B} p={['community', 'next', 'time']} label="NEXT TIME" /><Text B={B} p={['community', 'next', 'place']} label="NEXT PLACE" /></Grid>
        <Text B={B} p={['community', 'next', 'blurb']} label="NEXT EVENT LINE" />
        <Grid cols={3}><Text B={B} p={['community', 'pastTitle']} label="PAST EVENT TITLE" /><Text B={B} p={['community', 'pastDate']} label="PAST DATE" /><Text B={B} p={['community', 'replay']} label="REPLAY LABEL" /></Grid>
        <Text B={B} p={['community', 'pastSub']} label="PAST EVENT LINE" />
      </Section>
      <Section title="Labels and buttons" sub="Every fixed word on the fan view. Leave a field empty to keep the default shown in grey." open={false} id="labels">
        <div style={s('display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px')}>
          {(Object.keys(LABELS) as LabelKey[]).map((k) => (
            <label key={k} style={s('display:block;min-width:0')} data-field={'labels.' + k}>
              <span style={s("display:block;font:600 9px/1 'Archivo';letter-spacing:.1em;color:#A79BB6;margin-bottom:5px;text-transform:uppercase")}>{k.replace(/([A-Z])/g, ' $1')}</span>
              <input value={c.labels?.[k] || ''} placeholder={LABELS[k]} onChange={(e) => upd(['labels'], { ...(c.labels || {}), [k]: e.target.value || undefined })} style={s(fieldCss + ';padding:9px 10px')} />
            </label>
          ))}
        </div>
      </Section>
      <Section title="Chat and questions" sub="The scripted chat and the seeded Q&A board for the demo." open={false} id="chat">
        <List B={B} p={['chat', 'pool']} cols={[{ k: 'user', label: 'NAME', w: 1 }, { k: 'text', label: 'MESSAGE', w: 2.6 }, { k: 'where', label: 'WHERE', w: 0.9, opts: [['venue', 'In venue'], ['online', 'Online']] }, { k: 'tag', label: 'TAG', w: 1.2 }]} blank={() => ({ user: 'GUEST', text: '', where: 'online', tag: 'ONLINE' })} />
        <Grid cols={3}><Csv B={B} p={['chat', 'quickBefore']} label="QUICK REPLIES · BEFORE" /><Csv B={B} p={['chat', 'quickLive']} label="QUICK REPLIES · LIVE" /><Csv B={B} p={['chat', 'quickAfter']} label="QUICK REPLIES · AFTER" /></Grid>
        <List B={B} p={['qaSeed']} label="SEEDED QUESTIONS" cols={[{ k: 'text', label: 'QUESTION', w: 3 }, { k: 'who', label: 'FROM', w: 1 }, { k: 'where', label: 'WHERE', w: 0.9, opts: [['venue', 'In venue'], ['online', 'Online']] }, { k: 'votes', label: 'VOTES', w: 0.6, type: 'number' }]} blank={() => ({ id: 'q' + Date.now(), text: '', who: 'guest', where: 'online', votes: 10 })} />
      </Section>
    </>
  );
}

// ── 4 REWARDS: tickets, sponsors, challenges, rewards ──
const sponsorOpts = (c: EventConfig): [string, string][] => [['', 'No sponsor'], ...(c.sponsorKit || []).map((x) => [x.name, x.name] as [string, string])];
function SponsorPick({ B, p }: { B: any; p: Path }) {
  return <label style={s('display:block')}><Lbl>SPONSOR</Lbl><select value={getAt(B.cfg, p) || ''} onChange={(e) => B.upd(p, e.target.value || undefined)} style={s(fieldCss + ';padding:9px 10px')}>{sponsorOpts(B.cfg).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>;
}
function RewardsStep({ cfg, upd }: any) {
  const B = { cfg, upd };
  const c = cfg as EventConfig;
  const kinds: [string, string][] = [['predict', 'Prediction'], ['checkin', 'Check in'], ['trivia', 'Trivia'], ['poll', 'Vote in a poll']];
  const ch = c.challenges || [];
  const addBtn = (label: string, onClick: () => void, key: string) => <button className="ah" data-add={key} onClick={onClick} style={s("display:flex;align-items:center;justify-content:center;gap:6px;padding:11px;border-radius:12px;font:600 12px/1 'Archivo';color:#513E66;box-shadow:inset 0 0 0 1px rgba(27,11,45,.14)")}><Ms size={16} color="inherit">add</Ms>{label}</button>;
  return (
    <>
      <Section title="Tickets" sub="A Buy tickets button that links to your ticketing site. Every attendee and every crew gets a referral code on the link." id="tickets">
        {c.tickets ? <>
          <Text B={B} p={['tickets', 'url']} label="TICKETING LINK" ph="https://tickets.example.com/event" />
          <Grid cols={3}><Text B={B} p={['tickets', 'label']} label="BUTTON" ph="Buy tickets" /><Text B={B} p={['tickets', 'priceFrom']} label="PRICE LINE" ph="From RM80" /><Text B={B} p={['tickets', 'sub']} label="LINE UNDER" ph="Official ticketing partner" /></Grid>
          <Grid cols={2}><Text B={B} p={['tickets', 'crewLabel']} label="CREW QUESTION" ph="Join a crew" /><Csv B={B} p={['tickets', 'crews']} label="CREWS" hint="fans pick one; each gets a code" /></Grid>
          <button className="ah" onClick={() => upd(['tickets'], undefined)} style={s("align-self:flex-start;padding:9px 12px;border-radius:10px;font:600 12px/1 'Archivo';color:#C0473C;box-shadow:inset 0 0 0 1px rgba(27,11,45,.14)")}>Remove tickets</button>
        </> : addBtn('Add a Buy tickets button', () => upd(['tickets'], { url: 'https://tickets.example.com/' + c.id, label: 'Buy tickets', sub: 'Official ticketing partner', priceFrom: 'From RM50', crewLabel: 'Join a crew', crews: [] }), 'tickets')}
      </Section>
      <Section title="Sponsors" sub="Placeholder badges (a colour and initials). A sponsor can own a poll, challenge, announcement or reward." id="sponsorkit">
        <List B={B} p={['sponsorKit']} cols={[{ k: 'name', label: 'NAME', w: 1.6 }, { k: 'short', label: 'INITIALS', w: 0.7 }, { k: 'color', label: 'COLOUR', w: 0.9 }]} blank={() => ({ name: 'New sponsor', short: 'NS', color: '#2F7CF6' })} />
      </Section>
      <Section title="Challenges" sub="Each one is worth points. Check-ins complete when the fan scans the venue QR; poll challenges complete when they vote." id="challenges">
        {ch.map((x, i) => (
          <div key={x.id} data-challenge={i} style={s('display:flex;flex-direction:column;gap:10px;padding:12px;border-radius:12px;background:#F7F7F4;box-shadow:inset 0 0 0 1px rgba(27,11,45,.06)')}>
            <div style={s('display:grid;grid-template-columns:2fr 1.3fr .7fr 1.2fr auto;gap:10px;align-items:end')}>
              <Text B={B} p={['challenges', i, 'title']} label={'CHALLENGE ' + (i + 1)} />
              <label style={s('display:block')}><Lbl>TYPE</Lbl><select value={x.kind} onChange={(e) => upd(['challenges', i, 'kind'], e.target.value)} style={s(fieldCss + ';padding:9px 10px')}>{kinds.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
              <Text B={B} p={['challenges', i, 'points']} label="POINTS" type="number" />
              {c.sponsorKit?.length ? <SponsorPick B={B} p={['challenges', i, 'sponsor']} /> : <span />}
              <button aria-label="Remove challenge" onClick={() => upd(['challenges'], ch.filter((_, k) => k !== i))} style={s('display:flex;padding:0 4px 10px;color:#C0473C')}><Ms size={17} color="inherit">close</Ms></button>
            </div>
            <Text B={B} p={['challenges', i, 'sub']} label="LINE UNDER" />
            {(x.kind === 'predict' || x.kind === 'trivia') && <Grid cols={x.kind === 'trivia' ? 2 : 1}><Csv B={B} p={['challenges', i, 'options']} label="OPTIONS" />{x.kind === 'trivia' && <Text B={B} p={['challenges', i, 'answer']} label="RIGHT ANSWER" hint="must match an option" />}</Grid>}
            {x.kind === 'poll' && <label style={s('display:block')}><Lbl>WHICH POLL</Lbl><select value={x.poll || ''} onChange={(e) => upd(['challenges', i, 'poll'], e.target.value)} style={s(fieldCss + ';padding:9px 10px')}><option value="">Pick a poll</option>{c.polls.map((p) => <option key={p.id} value={p.id}>{p.q}</option>)}</select></label>}
          </div>
        ))}
        {addBtn('Add challenge', () => upd(['challenges'], [...ch, { id: 'c' + Date.now(), kind: 'predict', title: 'New challenge', sub: '', points: 20, options: ['Option A', 'Option B'] }]), 'challenges')}
      </Section>
      <Section title="Rewards" sub="Unlocked at a points total. For a series, points carry across every stage." id="rewards">
        <List B={B} p={['rewards']} cols={[{ k: 'name', label: 'REWARD', w: 1.5 }, { k: 'sub', label: 'HOW TO COLLECT', w: 2 }, { k: 'points', label: 'POINTS', w: 0.7, type: 'number' }, { k: 'stock', label: 'STOCK', w: 0.6, type: 'number' }, ...(c.sponsorKit?.length ? [{ k: 'sponsor', label: 'SPONSOR', w: 1.1, opts: sponsorOpts(c) }] : [])]} blank={() => ({ id: 'r' + Date.now(), name: 'New reward', sub: '', points: 100, stock: 20 })} />
      </Section>
    </>
  );
}

// ── 5 IRIS ──
function IrisStep({ cfg, upd }: any) {
  const B = { cfg, upd };
  return (
    <>
      <Section title="IRIS" sub="IRIS answers only from these approved answers and the feature facts. Anything else gets the fallback and is sent to the Q&A.">
        <Text B={B} p={['iris', 'intro']} label="OPENING LINE" area />
        <Grid><Text B={B} p={['iris', 'hidden']} label="BEFORE THE REVEAL" hint="for spec questions" area /><Text B={B} p={['iris', 'fallback']} label="FALLBACK" hint="anything off the list" area /></Grid>
      </Section>
      <Section title="Before the reveal" sub="Safe to answer any time.">
        <List B={B} p={['iris', 'pre']} cols={[{ k: 'q', label: 'QUESTION', w: 1.5 }, { k: 'a', label: 'APPROVED ANSWER', w: 3, area: true }, { k: 'stat', label: 'NUMBER', w: 0.7 }, { k: 'label', label: 'NUMBER LABEL', w: 1.1 }]} blank={() => ({ q: 'New question?', a: '', stat: '', label: '' })} />
      </Section>
      <Section title="After the reveal" sub="Held back until the reveal. Keywords (separated by |) match typed questions, e.g. price|cost|much.">
        <List B={B} p={['iris', 'live']} cols={[{ k: 'q', label: 'QUESTION', w: 1.4 }, { k: 'a', label: 'APPROVED ANSWER', w: 2.8, area: true }, { k: 'stat', label: 'NUMBER', w: 0.7 }, { k: 'label', label: 'NUMBER LABEL', w: 1 }, { k: 'keys', label: 'KEYWORDS', w: 1.1 }]} blank={() => ({ q: 'New question?', a: '', stat: '', label: '', keys: '' })} />
      </Section>
    </>
  );
}

// ── 5 PREVIEW ──
function PreviewStep({ cfg }: any) {
  const c = cfg as EventConfig;
  return (<>
    <WhatChanges c={c} />
    <Card>
      <div style={s('display:flex;align-items:center;gap:12px')}><Cap>PREVIEW AT 390PX</Cap><Note>Use the state bar above the phone to see every state</Note></div>
      <div style={s('display:flex;gap:24px;margin-top:18px;align-items:flex-start')}>
        <div style={s('padding:9px;border-radius:30px;background:#0E0B12;width:408px;flex:none')}>
          <iframe title="Fan preview" src={fanPath(c.id) + '?preview=1'} style={{ width: 390, height: 760, border: 0, borderRadius: 22, display: 'block', background: c.brand.dark }} />
        </div>
        <div style={s('flex:1;display:flex;flex-direction:column;gap:12px')}>
          <div style={s("font:700 18px/1.2 'Archivo'")}>{c.event.name}</div>
          <div style={s("font:400 13px/1.5 'Archivo';color:#513E66")}>This is the draft you are editing, not yet saved. The bar above the phone switches Before, Live, Break, After and Always-on, and fires the triggers.</div>
          {[['Brand', c.brand.name], ['Template', TEMPLATES.find((t) => t.id === c.event.template)?.name], ['Format', c.event.format], ['Segments', c.segments.map((g) => g.name).join(' → ')], ['Features', c.hotspots.length + ' points'], ['Polls', String(c.polls.length)], ['Days', c.days?.length ? c.days.map((d) => d.label).join(' · ') : 'One day'], ['Series', c.series ? c.series.name + ' · ' + c.series.stage : 'None'], ['Challenges', (c.challenges || []).map((x) => x.title + ' (+' + x.points + ')').join(', ') || 'None'], ['Rewards', (c.rewards || []).map((x) => x.name).join(', ') || 'None'], ['Tickets', c.tickets ? c.tickets.priceFrom + ' · ' + c.tickets.url : 'None'], ['IRIS answers', String(c.iris.pre.length + c.iris.live.length)], ['Call to action', c.cta.title]].map(([k, v]) => (
            <div key={k} style={s('display:flex;gap:12px;padding:10px 0;border-bottom:1px solid rgba(27,11,45,.08)')}><span style={s("width:120px;flex:none;font:600 12px/1.4 'Archivo';color:#826E99")}>{k}</span><span style={s("flex:1;font:500 12.5px/1.4 'Archivo'")}>{v}</span></div>
          ))}
        </div>
      </div>
    </Card>
  </>);
}

// What this event sets, against the one shared template: anyone can see that a
// new event is the same fan view and Studio with its own config.
function WhatChanges({ c }: { c: EventConfig }) {
  const imgs = [c.brand.logo, c.event.heroImage.src, c.reveal.logo, c.reveal.media?.src, ...(c.gallery?.items?.map((x) => x.src) || [])].filter(Boolean).length;
  const relabelled = Object.values(c.labels || {}).filter(Boolean).length;
  const rows: [string, string][] = [
    ['Brand', `${c.brand.name} · accent ${c.brand.accent} · dark ${c.brand.dark}`],
    ['Images', `${imgs} (logo, hero${c.reveal.logo ? ', reveal logo' : ''}${c.reveal.media?.src ? ', reveal ' + c.reveal.media.kind : ''}${c.gallery?.items?.length ? ', ' + c.gallery.items.length + ' in the gallery' : ''})`],
    ['Agenda', `${c.segments.length} segments${c.days?.length ? ' over ' + c.days.length + ' days' : ''}`],
    ['Hotspots', `${c.hotspots.length} points on the hero image`],
    ['Trims', c.product.variants.map((v) => v.name + (v.price ? ' ' + v.price : '')).join(' · ') || 'None'],
    ['Swatches', c.showroom?.colours.map((x) => x.name).join(', ') || 'None'],
    ['Monthly cost', c.showroom?.finance ? `${c.showroom.finance.rate}% flat · terms ${c.showroom.finance.terms.join(', ')} ${c.showroom.finance.termUnit || 'years'}` : 'None'],
    ['Booking', `${c.cta.title} · ${c.cta.options.length} ${c.cta.optionsLabel.toLowerCase()} options · ${c.cta.slots.length} slots`],
    ['Wording', `Countdown “${c.event.countdownLabel}” · ${relabelled ? relabelled + ' labels reworded' : 'default labels'}`],
    ['Layout', c.layout?.live === 'reveal-first' ? 'Reveal first, stream below' : 'Stream first'],
    ['IRIS', `${c.iris.pre.length + c.iris.live.length} approved answer${c.iris.pre.length + c.iris.live.length === 1 ? '' : 's'}`],
  ];
  return (
    <Card>
      <div style={s('display:flex;align-items:center;gap:12px')}><Ms size={18} color="#8B3DF5">tune</Ms><Cap>WHAT CHANGES PER EVENT</Cap><Note>Same fan view and Studio for every event; only this config differs</Note></div>
      <div style={s('display:grid;grid-template-columns:1.4fr 1fr;gap:24px;margin-top:16px')}>
        <div>{rows.map(([k, v]) => <div key={k} style={s('display:flex;gap:12px;padding:8px 0;border-bottom:1px solid rgba(27,11,45,.08)')}><span style={s("width:104px;flex:none;font:600 12px/1.4 'Archivo';color:#826E99")}>{k}</span><span style={s("flex:1;font:500 12.5px/1.4 'Archivo'")}>{v}</span></div>)}</div>
        <div>
          <div style={s("font:600 10.5px/1 'Archivo';letter-spacing:.12em;color:#826E99;margin-bottom:10px")}>MODULES</div>
          <div style={s('display:flex;flex-wrap:wrap;gap:6px')}>{MODULES.map((m) => { const on = isOn(c, m.key); return <span key={m.key} data-module-state={m.key + ':' + (on ? 'on' : 'off')} style={{ ...s("display:inline-flex;align-items:center;gap:5px;font:600 11px/1 'Archivo';padding:7px 9px;border-radius:8px"), background: on ? '#1B0B2D' : '#F1F1EE', color: on ? '#F5F5F2' : '#A79BB6' }}><Ms size={13} color="inherit">{on ? 'check' : 'remove'}</Ms>{m.name}</span>; })}</div>
        </div>
      </div>
    </Card>
  );
}

// ── 6 PUBLISH ──
function PublishStep({ cfg, setDraft, say, publish }: any) {
  const c = cfg as EventConfig;
  const [json, setJson] = useState(() => JSON.stringify(c, null, 2));
  const [err, setErr] = useState('');
  useEffect(() => { setJson(JSON.stringify(c, null, 2)); }, [c]);
  const fan = abs(fanPath(c.id)), studio = abs(studioPath(c.id));
  const copy = (u: string) => { navigator.clipboard?.writeText(u).catch(() => {}); say('Link copied'); };
  const download = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(c, null, 2)], { type: 'application/json' })); a.download = c.id + '.json'; a.click(); say('Config downloaded'); };
  const apply = () => { try { const v = JSON.parse(json); if (v.id !== c.id) throw new Error('Keep the same id (' + c.id + ')'); setDraft(v); setErr(''); say('Config applied'); } catch (e: any) { setErr(e.message || 'Not valid JSON'); } };
  const sizeKb = useMemo(() => Math.round(JSON.stringify(c).length / 1024), [c]);
  return (
    <>
      <Section title="Publish" sub="Save this event in this browser and share its links.">
        <Grid cols={2}>
          {[['FAN LINK', fan], ['STUDIO LINK', studio]].map(([k, u]) => (
            <div key={k}><Lbl>{k}</Lbl><div style={s('display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:11px;background:#F1F1EE')}><Ms size={15} color="#826E99">link</Ms><span data-link={k} style={s("flex:1;min-width:0;font:500 12px/1.2 'Archivo';overflow:hidden;text-overflow:ellipsis;white-space:nowrap")}>{u}</span><button onClick={() => copy(u)} style={s("font:600 11.5px/1 'Archivo';color:#8B3DF5")}>Copy</button></div></div>
          ))}
        </Grid>
        <div style={s('display:flex;gap:10px;flex-wrap:wrap')}>
          <button className="ah-ink-btn" onClick={() => publish(c.status === 'draft' ? 'upcoming' : c.status)} style={s("display:flex;align-items:center;gap:8px;padding:12px 16px;border-radius:12px;background:#8B3DF5;font:600 12.5px/1 'Archivo';color:#fff")}><Ms size={16} color="#fff">rocket_launch</Ms>Save and publish</button>
          <button className="ah" onClick={() => publish('draft')} style={s("display:flex;align-items:center;gap:8px;padding:12px 16px;border-radius:12px;font:600 12.5px/1 'Archivo';box-shadow:inset 0 0 0 1px rgba(27,11,45,.14)")}><Ms size={16} color="inherit">save</Ms>Save as draft</button>
          <a className="ah" href={fanPath(c.id)} target="_blank" rel="noopener" style={s("display:flex;align-items:center;gap:8px;padding:12px 16px;border-radius:12px;font:600 12.5px/1 'Archivo';color:#1B0B2D;text-decoration:none;box-shadow:inset 0 0 0 1px rgba(27,11,45,.14)")}><Ms size={16} color="inherit">smartphone</Ms>Open fan view</a>
          <a className="ah" href={studioPath(c.id)} style={s("display:flex;align-items:center;gap:8px;padding:12px 16px;border-radius:12px;font:600 12.5px/1 'Archivo';color:#1B0B2D;text-decoration:none;box-shadow:inset 0 0 0 1px rgba(27,11,45,.14)")}><Ms size={16} color="inherit">tune</Ms>Open Studio</a>
        </div>
        <div style={s("font:400 11.5px/1.5 'Archivo';color:#826E99")}>Saved in this browser only ({sizeKb} KB). To share an event beyond this browser, export the config and add it to the prototype’s samples.</div>
      </Section>
      <Section title="Demo numbers" sub="The made-up audience, RSVP and results figures. Every field is in the config below." open={false} id="demo">
        <div style={s("font:400 12px/1.5 'Archivo';color:#513E66")}>RSVPs {c.demo.rsvp.venue.toLocaleString()} in person, {c.demo.rsvp.online.toLocaleString()} online · peak {Math.max(...c.demo.venueBySeg, 0).toLocaleString()} in venue, {Math.max(...c.demo.onlineBySeg, 0).toLocaleString()} online · {c.demo.results.conversions} {c.demo.results.conversionLabel.toLowerCase()}.</div>
      </Section>
      <Section title="Advanced: full config" sub="Every field of the event as JSON. Edit and apply, or export it." open={false} id="json">
        <textarea value={json} onChange={(e) => setJson(e.target.value)} rows={18} spellCheck={false} style={s("width:100%;padding:12px;border-radius:12px;background:#0E0B12;color:#E8E3EF;border:0;font:500 11.5px/1.5 ui-monospace,Menlo,monospace;resize:vertical")} />
        {err && <div style={s("font:600 12px/1.4 'Archivo';color:#C0473C")}>{err}</div>}
        <div style={s('display:flex;gap:10px')}>
          <button className="ah-ink-btn" onClick={apply} style={s("padding:11px 15px;border-radius:11px;background:#1B0B2D;font:600 12.5px/1 'Archivo';color:#F5F5F2")}>Apply JSON</button>
          <button className="ah" data-export onClick={download} style={s("display:flex;align-items:center;gap:7px;padding:11px 15px;border-radius:11px;font:600 12.5px/1 'Archivo';box-shadow:inset 0 0 0 1px rgba(27,11,45,.14)")}><Ms size={15} color="inherit">download</Ms>Export config</button>
        </div>
      </Section>
    </>
  );
}

const BUILDER_CSS = `
input:focus,textarea:focus,select:focus{outline:2px solid #8B3DF5;outline-offset:1px}
select{appearance:auto}
`;
