import { useState } from 'react';
import { useStore } from '../../store';
import { SeverityBar } from '../../components/ui';

const STATUS_STYLE = {
  LIVE:     { bg: 'var(--critical-bg)', color: 'var(--critical)', border: 'var(--critical-border)' },
  TAKEDOWN: { bg: 'var(--success-bg)',  color: 'var(--success)',  border: 'var(--success-border)' },
  WATCH:    { bg: 'var(--high-bg)',     color: 'var(--high)',     border: 'var(--high-border)' },
};

export default function FakeSiteDetection() {
  const { domains, requestTakedown } = useStore();
  const [filter, setFilter] = useState('ALL');
  const filtered = filter === 'ALL' ? domains : domains.filter(d => d.status === filter);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>Fake Site Detection</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Every fake MCD website found online — flagged when 80%+ similar to the real domain.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{filtered.length} domain{filtered.length !== 1 ? 's' : ''}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {['ALL', 'LIVE', 'WATCH', 'TAKEDOWN'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '3px 12px', borderRadius: 20, border: '1px solid', borderColor: filter === f ? 'var(--accent)' : 'var(--border-dim)', background: filter === f ? 'var(--accent-light)' : 'transparent', color: filter === f ? 'var(--accent)' : 'var(--text-muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>{['Domain', 'Similarity', 'Type', 'Age', 'Status', 'Action'].map(h => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map(d => {
              const ss = STATUS_STYLE[d.status] || STATUS_STYLE.WATCH;
              return (
                <tr key={d.id}>
                  <td>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--critical)', fontFamily: 'var(--font-mono)' }}>{d.domain}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{d.ip} · {d.country}</div>
                  </td>
                  <td style={{ minWidth: 140 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1 }}><SeverityBar value={d.similarity} severity={d.severity} /></div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', minWidth: 30 }}>{d.similarity}%</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{d.type}</td>
                  <td style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{d.age}</td>
                  <td>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, fontWeight: 600 }}>
                      {d.status}
                    </span>
                  </td>
                  <td>
                    {d.status !== 'TAKEDOWN'
                      ? <button onClick={() => requestTakedown(d.id)} style={{ fontSize: 11, padding: '4px 12px', borderRadius: 6, border: '1px solid var(--critical-border)', background: 'var(--critical-bg)', color: 'var(--critical)', fontWeight: 600, cursor: 'pointer' }}>Remove</button>
                      : <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>✓ Requested</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
