// BoltOS Studio — the functional operator (React port of the boltos-studio
// prototype). Dashboard, new-panel wizard, panel-ready, control room and stats,
// all driven by in-memory state. Light/dark theme, toasts, edit & delete.
import { useState } from 'react';
import { T, A, STATUS_STYLE, THEME_VARS, seedPanels, emptyDraft, type Panel, type Draft, type Status, type Theme } from './studioData';
import { Ico } from './Ico';
import { NewPanel } from './NewPanel';
import { ControlRoom } from './ControlRoom';
import { Stats } from './Stats';

export type View = 'dashboard' | 'wizard' | 'ready' | 'control' | 'stats';
export type Toast = (m: string) => void;

export const btn = (variant: 'primary' | 'ghost' = 'ghost', on = false): React.CSSProperties => ({
  fontFamily: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  height: variant === 'primary' ? 40 : 36, padding: '0 18px', borderRadius: 999, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
  background: variant === 'primary' ? T.purple : on ? T.purpleSoft : 'transparent',
  color: variant === 'primary' ? '#fff' : T.ink,
  border: `1px solid ${variant === 'primary' || on ? T.purple : T.line2}`,
});
export const iconBtn: React.CSSProperties = {
  fontFamily: 'inherit', cursor: 'pointer', width: 40, height: 40, borderRadius: '50%', border: `1px solid ${T.line2}`,
  background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.ink,
};

const CS_CSS = `
.cs button{transition:box-shadow .12s,filter .12s,transform .06s}
.cs button:not(:disabled):hover{box-shadow:inset 0 0 0 1.5px #8B3DF5}
.cs button:not(:disabled):active{transform:translateY(1px)}
.cs input:focus,.cs textarea:focus{box-shadow:inset 0 0 0 1.5px #8B3DF5}
`;

export default function ConnectStudio() {
  const [panels, setPanels] = useState<Panel[]>(seedPanels);
  const [view, setView] = useState<View>('dashboard');
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editId, setEditId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('dark');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toast: Toast = (m) => { setToastMsg(m); window.setTimeout(() => setToastMsg((x) => (x === m ? null : x)), 2400); };
  const active = panels.find((p) => p.id === activeId) ?? null;

  const typeLabelOf = (d: Draft) => d.type === 'stream' ? 'Online stream' : d.type === 'vod' ? 'VOD'
    : `In-person · ${d.template === 'home' ? 'Home game' : d.template === 'away' ? 'Away game' : 'Stadium event'}`;

  const startNew = () => { setEditId(null); setDraft(emptyDraft()); setView('wizard'); };
  const startEdit = (id: string) => { const p = panels.find((x) => x.id === id); if (!p) return; setEditId(id); setDraft(fromPanel(p)); setView('wizard'); };
  const save = (d: Draft) => {
    if (editId) {
      setPanels((ps) => ps.map((p) => p.id === editId ? { ...p, title: d.name || p.title, desc: d.desc || p.desc, type: d.type, template: d.template, typeLabel: typeLabelOf(d), sections: { ...d.sections }, colors: { ...d.colors } } : p));
      setActiveId(editId); setView('dashboard'); toast('Changes saved');
    } else {
      const id = 'p-' + Math.random().toString(36).slice(2, 7);
      setPanels((ps) => [{
        id, title: d.name || 'Untitled panel', desc: d.desc || 'A new fan experience.', insight: 'New panel — insights appear after the first session.',
        status: 'scheduled', type: d.type, template: d.template, typeLabel: typeLabelOf(d), image: A('stadium.png'),
        footer: 'Not scheduled yet', sections: { ...d.sections }, colors: { ...d.colors },
      }, ...ps]);
      setActiveId(id); setView('ready');
    }
  };
  const remove = (id: string) => { const p = panels.find((x) => x.id === id); setPanels((ps) => ps.filter((x) => x.id !== id)); toast(`${p?.title ?? 'Panel'} deleted`); };

  return (
    <div className="cs" style={{ ...THEME_VARS[theme], minHeight: '100dvh', background: T.bg, color: T.ink, fontFamily: T.font, fontSize: 13, lineHeight: 1.5 } as React.CSSProperties}>
      <style>{CS_CSS}</style>
      <TopBar theme={theme} onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} toast={toast} />
      {view === 'dashboard' && <Dashboard panels={panels} filter={filter} setFilter={setFilter} onNew={startNew} onControl={(id) => { setActiveId(id); setView('control'); }} onStats={(id) => { setActiveId(id); setView('stats'); }} onEdit={startEdit} onDelete={remove} />}
      {view === 'wizard' && <NewPanel draft={draft} setDraft={setDraft} editing={!!editId} onCancel={() => setView('dashboard')} onSave={save} onDraft={() => { setView('dashboard'); toast('Saved as draft'); }} />}
      {view === 'ready' && active && <PanelReady panel={active} onHome={() => setView('dashboard')} onStart={() => setView('control')} />}
      {view === 'control' && active && <ControlRoom panel={active} toast={toast} onBack={() => setView('dashboard')} onSettings={() => startEdit(active.id)} />}
      {view === 'stats' && active && <Stats panel={active} onBack={() => setView('dashboard')} />}

      {toastMsg && (
        <div style={{ position: 'fixed', left: '50%', bottom: 28, transform: 'translateX(-50%)', background: T.surface2, border: `1px solid ${T.line}`, color: T.ink, padding: '12px 18px', borderRadius: 12, fontSize: 13, fontWeight: 500, boxShadow: '0 12px 34px rgba(0,0,0,.5)', zIndex: 200, display: 'flex', alignItems: 'center', gap: 9 }}>
          <Ico name="check" size={16} w={2.2} color={T.purple} />{toastMsg}
        </div>
      )}
    </div>
  );
}

function fromPanel(p: Panel): Draft {
  return { type: p.type, template: p.template ?? 'home', sections: { ...p.sections }, name: p.title, runs: '2026/27 season', desc: p.desc, colors: { ...p.colors } };
}

// ---------------- Top bar ----------------
export function TopBar({ theme, onToggleTheme, toast }: { theme: Theme; onToggleTheme: () => void; toast: Toast }) {
  return (
    <header style={{ height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', borderBottom: `1px solid ${T.line}`, background: T.surface }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={A('boltos.png')} alt="BOLT OS" style={{ width: 86, height: 20, filter: 'var(--cs-logo-filter)' }} />
          <span style={{ fontSize: 11, color: T.purple, fontWeight: 700, letterSpacing: 1 }}>STUDIO</span>
        </div>
        <button onClick={() => toast('Multi-club switching is coming soon')} style={{ fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px 0 6px', borderRadius: 999, border: `1px solid ${T.line}`, background: T.surface2, color: T.ink, fontSize: 13, fontWeight: 600 }}>
          <img src={A('crest.png')} alt="" style={{ width: 26, height: 26 }} />Arsenal<Ico name="chev" size={12} w={2.2} color={T.muted} />
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button aria-label="Toggle theme" onClick={onToggleTheme} style={iconBtn}><Ico name={theme === 'dark' ? 'sun' : 'moon'} size={18} /></button>
        <button aria-label="Settings" onClick={() => toast('Studio settings are coming soon')} style={iconBtn}><Ico name="gear" size={18} /></button>
        <span title="Daniel O." style={{ width: 40, height: 40, borderRadius: '50%', background: T.purple, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>DO</span>
      </div>
    </header>
  );
}

// ---------------- Dashboard ----------------
function Dashboard({ panels, filter, setFilter, onNew, onControl, onStats, onEdit, onDelete }: {
  panels: Panel[]; filter: 'all' | Status; setFilter: (f: 'all' | Status) => void;
  onNew: () => void; onControl: (id: string) => void; onStats: (id: string) => void; onEdit: (id: string) => void; onDelete: (id: string) => void;
}) {
  const count = (s: Status) => panels.filter((p) => p.status === s).length;
  const shown = filter === 'all' ? panels : panels.filter((p) => p.status === filter);
  const filters: ['all' | Status, string, number][] = [
    ['all', 'All', panels.length], ['live', 'Live', count('live')], ['scheduled', 'Scheduled', count('scheduled')], ['archived', 'Archived', count('archived')],
  ];
  return (
    <main style={{ padding: '28px 40px 48px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1440, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>Panels</h1>
          <div style={{ color: T.muted }}>Each panel is an ongoing fan experience. Start a session in it whenever it&apos;s happening.</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {filters.map(([k, lab, n]) => {
              const on = filter === k;
              return (
                <button key={k} onClick={() => setFilter(k)} style={{ fontFamily: 'inherit', cursor: 'pointer', height: 34, padding: '0 14px', borderRadius: 17, border: `1px solid ${on ? T.purple : T.line}`, background: on ? T.purpleSoft : 'transparent', color: on ? T.ink : T.muted, fontSize: 13, fontWeight: 600 }}>
                  {lab} <span style={{ color: T.muted, fontWeight: 500 }}>{n}</span>
                </button>
              );
            })}
          </div>
          <button onClick={onNew} style={btn('primary')}><Ico name="plus" size={16} />New panel</button>
        </div>
      </div>

      {shown.length === 0
        ? <div style={{ color: T.muted, padding: '48px 0', textAlign: 'center' }}>No panels here.</div>
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
            {shown.map((p) => <PanelCard key={p.id} p={p} onControl={onControl} onStats={onStats} onEdit={onEdit} onDelete={onDelete} />)}
          </div>}
    </main>
  );
}

function PanelCard({ p, onControl, onStats, onEdit, onDelete }: { p: Panel; onControl: (id: string) => void; onStats: (id: string) => void; onEdit: (id: string) => void; onDelete: (id: string) => void }) {
  const st = STATUS_STYLE[p.status];
  const [menu, setMenu] = useState(false);
  return (
    <div style={{ background: T.surface, border: `1px solid ${p.live ? T.purple : T.line}`, borderRadius: 22, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <button onClick={() => onStats(p.id)} style={{ all: 'unset', cursor: 'pointer', position: 'relative', height: 112, display: 'block' }}>
        <img src={p.image} alt="" style={{ width: '100%', height: 112, objectFit: 'cover', display: 'block', opacity: p.dimImage ? 0.5 : 1 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(14,14,18,0) 30%, rgba(14,14,18,0.85) 100%)' }} />
        <span style={{ position: 'absolute', left: 16, top: 12, display: 'inline-flex', alignItems: 'center', gap: 6, height: 24, padding: '0 10px', borderRadius: 12, background: st.fg + '22', color: st.fg, fontSize: 11, fontWeight: 600 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: st.fg }} />{st.label}
        </span>
        <img src={A('crest.png')} alt="" style={{ position: 'absolute', left: 16, bottom: 10, width: 34, height: 34 }} />
        <span style={{ position: 'absolute', right: 14, bottom: 12, fontSize: 11, color: '#D6D6DE' }}>{p.typeLabel}</span>
      </button>
      {/* overflow menu */}
      <button aria-label="Panel options" onClick={(e) => { e.stopPropagation(); setMenu((m) => !m); }} style={{ position: 'absolute', right: 10, top: 10, width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(14,14,18,0.55)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Ico name="more" size={16} /></button>
      {menu && (
        <>
          <div onClick={() => setMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 20 }} />
          <div style={{ position: 'absolute', right: 10, top: 44, zIndex: 21, background: T.surface2, border: `1px solid ${T.line}`, borderRadius: 12, overflow: 'hidden', minWidth: 148, boxShadow: '0 12px 30px rgba(0,0,0,.5)' }}>
            <button onClick={() => { setMenu(false); onEdit(p.id); }} style={menuItem}><Ico name="edit" size={16} />Edit panel</button>
            <button onClick={() => { setMenu(false); onDelete(p.id); }} style={{ ...menuItem, color: '#E5484D' }}><Ico name="trash" size={16} />Delete</button>
          </div>
        </>
      )}
      <div style={{ padding: '14px 18px 16px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <div style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.3 }}>{p.title}</div>
        <div style={{ fontSize: 13, color: T.muted }}>{p.desc}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 11, color: T.purpleText }}>
          <span style={{ flex: 'none', marginTop: 1 }}><Ico name="spark" size={13} w={2} color={T.purple} /></span><span>{p.insight}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 'auto', paddingTop: 12, borderTop: `1px solid ${T.line}` }}>
          <span style={{ fontSize: 11, color: T.muted }}>
            {p.live ? <><span style={{ color: T.green, fontWeight: 700 }}>Live now</span> · {p.footer.replace('Live now · ', '')}</> : p.footer}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button aria-label={`Stats for ${p.title}`} onClick={() => onStats(p.id)} style={iconBtn}><Ico name="stats" size={18} /></button>
            {p.status === 'archived'
              ? <button onClick={() => onStats(p.id)} style={btn('ghost')}>View</button>
              : p.live
                ? <button onClick={() => onControl(p.id)} style={btn('primary')}><Ico name="monitor" size={16} />Control room</button>
                : <button onClick={() => onControl(p.id)} style={btn('ghost')}>Open</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
const menuItem: React.CSSProperties = { fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '11px 14px', background: 'transparent', border: 'none', color: T.ink, fontSize: 13, fontWeight: 500, textAlign: 'left' };

// ---------------- Panel ready ----------------
function PanelReady({ panel, onHome, onStart }: { panel: Panel; onHome: () => void; onStart: () => void }) {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 40px', gap: 18 }}>
      <span style={{ width: 64, height: 64, borderRadius: '50%', background: T.purpleSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.purple }}><Ico name="check" size={30} w={2.4} /></span>
      <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700 }}>{panel.title} is ready</h1>
      <div style={{ color: T.muted, maxWidth: 440 }}>Your panel is set up and saved. Start a session whenever it&apos;s happening — fans see it live.</div>
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <button onClick={onHome} style={btn('ghost')}>Back to panels</button>
        <button onClick={onStart} style={btn('primary')}><Ico name="monitor" size={16} />Start session</button>
      </div>
    </main>
  );
}
