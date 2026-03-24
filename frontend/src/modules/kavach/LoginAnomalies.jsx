import { useStore } from '../../store';

const RECENT = [
  { time: '08:42:17', zone: 'Central',     count: 47, zscore: '4.1', status: 'CRITICAL' },
  { time: '14:05:11', zone: 'Shahdara',    count: 31, zscore: '3.8', status: 'CRITICAL' },
  { time: '11:15:44', zone: 'East',        count: 12, zscore: '2.9', status: 'HIGH'     },
  { time: '09:30:02', zone: 'North',       count: 8,  zscore: '2.1', status: 'MEDIUM'   },
  { time: '07:10:55', zone: 'Civil Lines', count: 5,  zscore: '1.6', status: 'LOW'      },
];

const SEV_COLOR = { CRITICAL: '#ef4444', HIGH: '#f59e0b', MEDIUM: '#6384BE', LOW: '#6b7280' };

export default function LoginAnomalies() {
  const { events } = useStore();
  const critCount = events.filter(e => e.label.toLowerCase().includes('login') && e.severity === 'CRITICAL' && !e.resolved).length;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>Login Anomaly Detection</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Unusual login patterns across 2,400 MCD computers — flagged in real-time using Z-score analysis.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Anomalies Today',  value: '247',      color: '#6384BE' },
          { label: 'Critical Spikes',  value: critCount,  color: '#ef4444' },
          { label: 'Zones Affected',   value: '4',        color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: '-0.03em', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {RECENT.map((r, i) => {
          const c = SEV_COLOR[r.status];
          return (
            <div key={i} className="card" style={{ padding: '14px 16px', borderLeft: `3px solid ${c}`, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', minWidth: 68 }}>{r.time}</div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{r.zone} Zone</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 10 }}>{r.count} failed logins in 90s</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Z-score</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: c }}>{r.zscore}</div>
              </div>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: c + '15', color: c, border: `1px solid ${c}30`, fontWeight: 700 }}>
                {r.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
