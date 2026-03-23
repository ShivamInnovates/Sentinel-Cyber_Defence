import { useStore } from '../../store';
import { SeverityBadge, HelpIcon } from '../../components/ui';
import { TOOLTIPS } from '../../utils/constants';

const RECENT = [
  { time: '08:42:17', zone: 'Central',     count: 47, zscore: '4.1', status: 'CRITICAL' },
  { time: '14:05:11', zone: 'Shahdara',    count: 31, zscore: '3.8', status: 'CRITICAL' },
  { time: '11:15:44', zone: 'East',        count: 12, zscore: '2.9', status: 'HIGH'     },
  { time: '09:30:02', zone: 'North',       count: 8,  zscore: '2.1', status: 'MEDIUM'   },
  { time: '07:10:55', zone: 'Civil Lines', count: 5,  zscore: '1.6', status: 'LOW'      },
];

const SEV   = { CRITICAL: '#DC2626', HIGH: '#D97706', MEDIUM: '#6384BE', LOW: '#9CA3AF' };
const SEVBG = { CRITICAL: '#FEF2F2', HIGH: '#FFFBEB', MEDIUM: '#EFF4FF', LOW: '#F9FAFB' };

export default function LoginAnomalies() {
  const { events } = useStore();
  const critCount = events.filter(e =>
    e.label.toLowerCase().includes('login') &&
    e.severity === 'CRITICAL' &&
    !e.resolved
  ).length;

  return (
    <div>
      <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #E5E7EB' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', marginBottom: 6 }}>
          Login Anomaly Detection
        </h1>
        <p style={{ fontSize: 15, color: '#6B7280' }}>
          Unusual login patterns across 2,400 MCD computers — flagged in real-time.
        </p>
      </div>

      <div style={{ padding: '14px 18px', background: '#F9FAFB', borderRadius: 10, borderLeft: '3px solid #E5E7EB', marginBottom: 28, fontSize: 13, color: '#6B7280', lineHeight: 1.7 }}>
        A login anomaly is triggered when failed attempts are far above normal. The Z-score measures how unusual the activity is — anything above 3.0 is flagged immediately.{' '}
        <HelpIcon tooltip={TOOLTIPS.zscore} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #E5E7EB' }}>
        {[
          { label: 'Anomalies Today',  value: '247',     color: '#1D4ED8' },
          { label: 'Critical Spikes', value: critCount,  color: '#DC2626' },
          { label: 'Zones Affected',  value: '4',        color: '#D97706' },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: '0 32px 0 0', borderRight: i < 2 ? '1px solid #E5E7EB' : 'none' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color, letterSpacing: '-0.03em', marginBottom: 6 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Recent Login Spikes</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {RECENT.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', borderRadius: 10, background: SEVBG[r.status], border: `1px solid ${SEV[r.status]}22`, borderLeft: `3px solid ${SEV[r.status]}` }}>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#9CA3AF', minWidth: 70 }}>{r.time}</div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{r.zone} Zone</span>
              <span style={{ fontSize: 13, color: '#6B7280', marginLeft: 10 }}>{r.count} failed logins in 90 seconds</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: '#9CA3AF' }}>Z-score</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: SEV[r.status] }}>{r.zscore}</div>
              </div>
              <SeverityBadge severity={r.status} small />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}