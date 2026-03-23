import { useStore } from '../../store';
import { ZONES } from '../../utils/constants';

const SEV_C = { CRITICAL: '#DC2626', HIGH: '#D97706', MEDIUM: '#6384BE', LOW: '#9CA3AF' };

export default function ZoneWatch() {
  const { events } = useStore();
  const unresolved = events.filter(e => !e.resolved);

  return (
    <div>
      <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #E5E7EB' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', marginBottom: 6 }}>
          12-Zone Network Watch
        </h1>
        <p style={{ fontSize: 15, color: '#6B7280' }}>
          Real-time security status across all 12 MCD Delhi zones.
        </p>
      </div>

      <div style={{ padding: '14px 18px', background: '#F9FAFB', borderRadius: 10, borderLeft: '3px solid #E5E7EB', marginBottom: 28, fontSize: 13, color: '#6B7280', lineHeight: 1.7 }}>
        Each zone covers a geographic area of Delhi. KAVACH monitors every computer in every zone. A zone changes colour when active threats are detected inside it.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 36 }}>
        {ZONES.map(z => {
          const zoneEvents = unresolved.filter(e => e.zone === z.name);
          const count  = zoneEvents.length;
          const topSev = zoneEvents.find(e => e.severity === 'CRITICAL')?.severity
                      || zoneEvents.find(e => e.severity === 'HIGH')?.severity
                      || zoneEvents[0]?.severity || 'CLEAR';
          const color  = count === 0 ? '#16A34A' : SEV_C[topSev] || '#6384BE';
          const bg     = count === 0 ? '#F0FDF4' : count === 1 ? '#EFF4FF' : count === 2 ? '#FFFBEB' : '#FEF2F2';
          const border = count === 0 ? '#BBF7D0' : count === 1 ? '#BFCFEA' : count === 2 ? '#FDE68A' : '#FECACA';

          return (
            <div key={z.id} style={{ padding: '16px', borderRadius: 12, background: bg, border: `1px solid ${border}`, borderLeft: `3px solid ${color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: '0.06em', marginBottom: 2 }}>{z.id}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{z.name}</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color }}>{count === 0 ? '✓' : count}</div>
              </div>
              <div style={{ fontSize: 12, color: count === 0 ? '#16A34A' : color }}>
                {count === 0 ? 'All clear' : `${count} active event${count > 1 ? 's' : ''}`}
              </div>
              {zoneEvents.slice(0, 1).map(e => (
                <div key={e.id} style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{e.label}</div>
              ))}
            </div>
          );
        })}
      </div>

      {unresolved.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Active Zone Events</h2>
          <table className="data-table">
            <thead>
              <tr>{['Event', 'Zone', 'Severity', 'When', 'What It Means'].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {unresolved.map(e => (
                <tr key={e.id}>
                  <td style={{ fontWeight: 600, color: '#111827' }}>{e.label}</td>
                  <td style={{ color: '#6384BE', fontWeight: 600, fontSize: 13 }}>{e.zone}</td>
                  <td>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: SEV_C[e.severity] + '15', color: SEV_C[e.severity], border: `1px solid ${SEV_C[e.severity]}33`, fontWeight: 700 }}>
                      {e.severity}
                    </span>
                  </td>
                  <td style={{ color: '#9CA3AF', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>{e.timestamp}</td>
                  <td style={{ color: '#6B7280', fontSize: 13 }}>{e.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}