// PanelBuilder (/studio/:id/edit) — author the ordered SESSIONS and their
// module stacks. Same core model as V1; new UI drops onto these handlers.

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getPanel, upsertPanel } from '../store/panels';
import { defaultPanel } from '../domain/seed';
import { ALL_MODULES, MODULES } from '../domain/modules';
import type { ModuleId, PanelConfig, Session } from '../domain/types';

const PHASES: Session['phase'][] = ['idle', 'pre', 'live', 'break', 'post'];
const rid = () => `s_${Math.random().toString(36).slice(2, 7)}`;

export function PanelBuilder() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const [cfg, setCfg] = useState<PanelConfig>(() => getPanel(id) ?? defaultPanel());

  const patch = (p: Partial<PanelConfig>) => setCfg((c) => ({ ...c, ...p }));
  const setSessions = (fn: (s: Session[]) => Session[]) => setCfg((c) => ({ ...c, sessions: fn(c.sessions) }));

  const toggleLib = (m: ModuleId) =>
    setCfg((c) => {
      const on = c.modules.includes(m);
      return {
        ...c,
        modules: on ? c.modules.filter((x) => x !== m) : [...c.modules, m],
        sessions: on ? c.sessions.map((s) => ({ ...s, modules: s.modules.filter((x) => x !== m) })) : c.sessions,
      };
    });

  const moveSession = (i: number, d: -1 | 1) =>
    setSessions((s) => {
      const j = i + d;
      if (j < 0 || j >= s.length) return s;
      const n = [...s];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  const save = (goLive: boolean) => {
    upsertPanel({ ...cfg, status: goLive ? 'live' : cfg.status });
    nav(goLive ? `/control/${cfg.id}` : '/studio');
  };

  return (
    <div className="admin">
      <div className="abar">
        <Link className="btn btn--ghost" to="/studio">← Studio</Link>
        <div className="abar__t">{cfg.name}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn--sm" onClick={() => save(false)}>Save draft</button>
          <button className="btn btn--primary btn--sm" onClick={() => save(true)}>Save & go live →</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <section className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, marginBottom: 14 }}>Panel details</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label className="field"><span>Name</span><input value={cfg.name} onChange={(e) => patch({ name: e.target.value })} /></label>
            <label className="field"><span>Description</span><textarea rows={2} value={cfg.description} onChange={(e) => patch({ description: e.target.value })} /></label>
          </div>
        </section>

        <section className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, marginBottom: 4 }}>Module library</h2>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14 }}>What this panel can use. Turn one on to make it available to every session.</p>
          <div className="pickgrid">
            {ALL_MODULES.map((m) => (
              <button key={m} className={`pick${cfg.modules.includes(m) ? ' sel' : ''}`} onClick={() => toggleLib(m)}>
                <div className="pick__t">{MODULES[m].label}</div>
                <div className="pick__b">{MODULES[m].blurb}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 16 }}>Sessions</h2>
            <button className="btn btn--sm" onClick={() => setSessions((s) => [...s, { id: rid(), label: `Session ${s.length + 1}`, phase: 'live', modules: [] }])}>＋ Add session</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cfg.sessions.map((s, i) => (
              <div key={s.id} className="card" style={{ padding: 14, background: 'var(--surface-2)' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                  <button className="btn btn--sm" disabled={i === 0} onClick={() => moveSession(i, -1)}>↑</button>
                  <button className="btn btn--sm" disabled={i === cfg.sessions.length - 1} onClick={() => moveSession(i, 1)}>↓</button>
                  <input className="field" style={{ flex: 1, height: 38, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-1)', padding: '0 12px' }} value={s.label} onChange={(e) => setSessions((ss) => ss.map((x) => (x.id === s.id ? { ...x, label: e.target.value } : x)))} />
                  <select value={s.phase} onChange={(e) => setSessions((ss) => ss.map((x) => (x.id === s.id ? { ...x, phase: e.target.value as Session['phase'] } : x)))} style={{ height: 38, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-1)', padding: '0 8px' }}>
                    {PHASES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <button className={`btn btn--sm${cfg.defaultSessionId === s.id ? ' btn--primary' : ''}`} onClick={() => patch({ defaultSessionId: s.id })}>{cfg.defaultSessionId === s.id ? '★' : '☆'}</button>
                  <button className="btn btn--sm" style={{ color: 'var(--live)' }} onClick={() => setSessions((ss) => ss.filter((x) => x.id !== s.id))}>✕</button>
                </div>
                <div className="tags">
                  {s.modules.map((m) => (
                    <span className="tag" key={m}>
                      {MODULES[m].label}
                      <button style={{ border: 'none', background: 'none', marginLeft: 6, color: 'var(--text-3)' }} onClick={() => setSessions((ss) => ss.map((x) => (x.id === s.id ? { ...x, modules: x.modules.filter((y) => y !== m) } : x)))}>✕</button>
                    </span>
                  ))}
                  {cfg.modules.filter((m) => !s.modules.includes(m)).map((m) => (
                    <button key={m} className="tag" style={{ cursor: 'pointer', borderStyle: 'dashed' }} onClick={() => setSessions((ss) => ss.map((x) => (x.id === s.id ? { ...x, modules: [...x.modules, m] } : x)))}>＋ {MODULES[m].label}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
