// StatsPage (/studio/:id/stats) — lightweight analytics view (seeded).

import { Link, useParams } from 'react-router-dom';
import { getPanel } from '../store/panels';
import { defaultPanel } from '../domain/seed';
import { MODULES } from '../domain/modules';

export function StatsPage() {
  const { id = '' } = useParams();
  const p = getPanel(id) ?? defaultPanel();
  const seed = id.split('').reduce((a, c) => a + c.charCodeAt(0), 7);
  const stat = (b: number, s: number) => b + (seed % s);

  const kpis = [
    { label: 'Active fans', value: stat(8200, 4000).toLocaleString(), delta: '+12%' },
    { label: 'Messages / min', value: String(stat(140, 90)), delta: '+8%' },
    { label: 'Avg. session', value: `${stat(22, 18)} min`, delta: '+5%' },
    { label: 'XP awarded', value: stat(120000, 80000).toLocaleString(), delta: '+19%' },
  ];

  return (
    <div className="admin" style={{ maxWidth: 900 }}>
      <div className="abar">
        <Link className="btn btn--ghost" to="/studio">← Studio</Link>
        <div className="abar__t">{p.name} · stats</div>
        <a className="btn btn--sm" href={`${import.meta.env.BASE_URL}p/${p.id}`} target="_blank" rel="noreferrer">Fan view ↗</a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 22 }}>
        {kpis.map((k) => (
          <div className="card" key={k.label} style={{ padding: 18 }}>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em' }}>{k.value}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 4 }}>{k.label}</div>
            <div style={{ fontSize: 11.5, color: 'var(--success)', marginTop: 6, fontWeight: 700 }}>{k.delta} vs last match</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 15, marginBottom: 16 }}>Module engagement</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {p.modules.map((m, i) => {
            const pct = 30 + ((seed + i * 17) % 65);
            return (
              <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 130, fontSize: 12.5, color: 'var(--text-2)' }}>{MODULES[m].label}</span>
                <span style={{ flex: 1, height: 8, borderRadius: 5, background: 'var(--surface-2)', overflow: 'hidden' }}>
                  <span style={{ display: 'block', height: '100%', width: `${pct}%`, background: 'var(--brand)', borderRadius: 5 }} />
                </span>
                <span style={{ width: 40, textAlign: 'right', fontSize: 12.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
