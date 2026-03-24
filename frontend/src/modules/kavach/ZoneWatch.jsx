import { useStore } from '../../store';
import { ZONES } from '../../utils/constants';

const SEV_C = { CRITICAL: '#ef4444', HIGH: '#f59e0b', MEDIUM: '#6384BE', LOW: '#6b7280' };

export default function ZoneWatch() {
  const { events } = useStore();
  const unresolved = events.filter(e => !e.resolved);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>12-Zone Network Watch</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Real-time security status across all 12 MCD Delhi zones.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 28 }}>
        {ZONES.map(z => {
          const zoneEvents = unresolved.filter(e => e.zone === z.name);
          const count = zoneEvents.length;
          const topSev = zoneEvents.find(e => e.severity === 'CRITICAL')?.severity
                      || zoneEvents.find(e => e.severity === 'HIGH')?.severity
                      || zoneEvents[0]?.severity || 'CLEAR';
          const color = count === 0 ? 'var(--success)' : SEV_C[topSev] || 'var(--medium)';

          return (
            <div key={z.id} className="card" style={{ padding: 16, borderLeft: `3px solid ${color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: '0.06em', marginBottom: 2 }}>{z.id}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{z.name}</div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color }}>{count === 0 ? '✓' : count}</div>
              </div>
              <div style={{ fontSize: 11, color: count === 0 ? 'var(--success)' : color }}>
                {count === 0 ? 'All clear' : `${count} active event${count > 1 ? 's' : ''}`}
              </div>
            </div>
          );
        })}
      </div>

      {unresolved.length > 0 && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-dim)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Active Events</div>
          <table className="data-table">
            <thead>
              <tr>{['Event', 'Zone', 'Severity', 'When', 'Detail'].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {unresolved.map(e => (
                <tr key={e.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{e.label}</td>
                  <td style={{ color: 'var(--medium)', fontWeight: 600, fontSize: 12 }}>{e.zone}</td>
                  <td>
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: SEV_C[e.severity] + '15', color: SEV_C[e.severity], border: `1px solid ${SEV_C[e.severity]}30`, fontWeight: 700 }}>
                      {e.severity}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{e.timestamp}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{e.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
