// StudioHome (/studio) — the dashboard. Lists panels with status at a
// glance and the create → build → go-live actions.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadPanels, deletePanel, resetPanels } from '../store/panels';
import { MODULES } from '../domain/modules';
import type { PanelConfig } from '../domain/types';
import { media } from '../domain/media';

const COVERS: Record<string, string> = { 'mcfc-flagship': media.vsPoster };

export function StudioHome() {
  const [panels, setPanels] = useState<PanelConfig[]>(() => loadPanels());
  const nav = useNavigate();

  return (
    <div className="admin">
      <div className="abar">
        <div className="abar__t">Panel Studio</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn--sm" onClick={() => setPanels(resetPanels())}>Reset demo</button>
        </div>
      </div>

      <div className="ahero">
        <div>
          <h1>Your immersive panels</h1>
          <p>{panels.length} panel{panels.length === 1 ? '' : 's'} · build one, then send fans the link.</p>
          <div className="astats">
            <span className="astat"><b>{panels.length}</b> total</span>
            <span className="astat"><b>{panels.filter((p) => p.status === 'live').length}</b> live</span>
          </div>
        </div>
        <Link className="btn btn--primary" to="/studio/new">＋ Create new panel</Link>
      </div>

      <div className="pgrid">
        {panels.map((p) => (
          <article className="card pcard" key={p.id}>
            <div className="pcard__cover" style={{ background: `linear-gradient(135deg, ${p.branding.primary}, #0e1b2e)` }}>
              {COVERS[p.id] && <img src={COVERS[p.id]} alt="" />}
              <span className="pcard__name">{p.match.home.short} vs {p.match.away.short}</span>
            </div>
            <div className="pcard__body">
              <div className="pcard__row">
                <span className="pcard__t">{p.name}</span>
                <span className={`chip ${p.status === 'live' ? 'chip--live' : ''}`}>
                  <span className={`statusdot statusdot--${p.status}`} />
                  {p.status === 'live' ? 'Live' : 'Draft'}
                </span>
              </div>
              <div className="pcard__d">{p.description}</div>
              <div className="tags">
                {p.modules.slice(0, 5).map((m) => <span className="tag" key={m}>{MODULES[m].label}</span>)}
                {p.modules.length > 5 && <span className="tag">+{p.modules.length - 5}</span>}
              </div>
              <div className="pcard__meta">{p.sessions.length} sessions · updated {new Date(p.updatedAt).toLocaleDateString()}</div>
              <div className="pcard__acts">
                <button className="btn btn--primary btn--sm" onClick={() => nav(`/control/${p.id}`)}>Go live</button>
                <a className="btn btn--sm" href={`${import.meta.env.BASE_URL}p/${p.id}`} target="_blank" rel="noreferrer">Fan view</a>
                <Link className="btn btn--sm" to={`/studio/${p.id}/edit`}>Edit</Link>
                <Link className="btn btn--sm" to={`/studio/${p.id}/stats`}>Stats</Link>
              </div>
              <button className="btn btn--ghost btn--sm" style={{ justifySelf: 'start', color: 'var(--live)' }} onClick={() => setPanels(deletePanel(p.id))}>Delete</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
