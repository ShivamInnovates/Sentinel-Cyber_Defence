import { useStore } from '../../store';

const SEV_COLOR = { RED: '#ef4444', YELLOW: '#f59e0b', MEDIUM: '#6384BE', LOW: '#6b7280', CRITICAL: '#ef4444', HIGH: '#f59e0b' };

// Map backend event severity strings to display label
const SEV_LABEL = { RED: 'CRITICAL', YELLOW: 'HIGH' };

function fmt(iso) {
  if (!iso) return '--:--:--';
  try { return new Date(iso).toLocaleTimeString('en-IN', { hour12: false }); } catch { return iso; }
}

export default function LoginAnomalies() {
  const { events } = useStore();

  // events from backend: { rule, severity, portal, z_score, login_count, expected, source_ips, message, detected_at, zone, warning }
  const loginEvents = events.filter(e => e.rule === 'LOGIN_SPIKE' || e.rule === 'LOGIN_ELEVATED');
  const critCount = events.filter(e => e.severity === 'RED').length;
  const zonesAffected = new Set(events.map(e => e.zone).filter(Boolean)).size;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>Login Anomaly Detection</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Unusual login patterns across 2,400 MCD computers — flagged in real-time using Z-score analysis.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Anomalies Detected', value: events.length || 0, color: '#6384BE' },
          { label: 'Critical Spikes',    value: critCount,           color: '#ef4444' },
          { label: 'Zones Affected',     value: zonesAffected || 0,  color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: '-0.03em', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {loginEvents.length === 0 ? (
        <div className="card" style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--success)', fontWeight: 600 }}>
          ✓ No login anomalies detected. Run the Attack Simulation to generate live events.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loginEvents.map((r, i) => {
            const sev = r.severity === 'RED' ? 'CRITICAL' : 'HIGH';
            const c = SEV_COLOR[r.severity] || '#6b7280';
            return (
              <div key={i} className="card" style={{ padding: '14px 16px', borderLeft: `3px solid ${c}`, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', minWidth: 68 }}>{fmt(r.detected_at)}</div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{r.zone || r.portal} Portal</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 10 }}>{r.login_count} failed logins — expected {r.expected}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Z-score</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: c }}>{r.z_score}</div>
                </div>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: c + '15', color: c, border: `1px solid ${c}30`, fontWeight: 700 }}>
                  {sev}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
