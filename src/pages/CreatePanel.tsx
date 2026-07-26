// CreatePanel (/studio/new) — a compact create flow. Names the panel, picks
// modules, then hands off to the builder to author sessions.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ALL_MODULES, MODULES } from '../domain/modules';
import { defaultPanel } from '../domain/seed';
import { upsertPanel } from '../store/panels';
import type { ModuleId } from '../domain/types';

export function CreatePanel() {
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [mods, setMods] = useState<ModuleId[]>(['chat', 'intel', 'rewards', 'timeline']);

  const toggle = (m: ModuleId) => setMods((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]));

  const create = () => {
    const base = defaultPanel();
    const id = 'pnl_' + Math.random().toString(36).slice(2, 8);
    const cfg = {
      ...base,
      id,
      name: name || 'New Matchday Panel',
      description: desc || 'A matchday companion.',
      status: 'draft' as const,
      modules: mods,
      sessions: base.sessions.map((s) => ({ ...s, modules: s.modules.filter((m) => mods.includes(m)) })),
    };
    upsertPanel(cfg);
    nav(`/studio/${id}/edit`);
  };

  return (
    <div className="admin" style={{ maxWidth: 720 }}>
      <div className="abar">
        <Link className="btn btn--ghost" to="/studio">← Studio</Link>
        <div className="abar__t">New panel</div>
        <button className="btn btn--primary" onClick={create}>Build sessions →</button>
      </div>

      <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <label className="field"><span>Panel name</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Man City · Matchday" /></label>
        <label className="field"><span>Description</span><textarea rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="A matchday companion for fans." /></label>
        <div>
          <div className="field"><span>Modules</span></div>
          <div className="pickgrid" style={{ marginTop: 8 }}>
            {ALL_MODULES.map((m) => (
              <button key={m} className={`pick${mods.includes(m) ? ' sel' : ''}`} onClick={() => toggle(m)}>
                <div className="pick__t">{MODULES[m].label}</div>
                <div className="pick__b">{MODULES[m].blurb}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
