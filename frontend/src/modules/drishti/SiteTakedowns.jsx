import { useStore } from '../../store';

const HISTORY = [
  { domain: 'delhi-mcd-portal.net', requestedOn: '20 Mar 2026', takenDown: '21 Mar 2026', hours: 18 },
  { domain: 'mcd-online-tax.in',    requestedOn: '18 Mar 2026', takenDown: '19 Mar 2026', hours: 23 },
  { domain: 'mcd-aadhaar-help.com', requestedOn: '15 Mar 2026', takenDown: '16 Mar 2026', hours: 11 },
];

export default function SiteTakedowns() {
  const { domains } = useStore();
  const pending = domains.filter(d => d.status === 'TAKEDOWN');
  const live    = domains.filter(d => d.status === 'LIVE');

  return (
    <div>
      <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #E5E7EB' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', marginBottom: 6 }}>Site Takedowns</h1>
        <p style={{ fontSize: 15, color: '#6B7280' }}>Formal removal requests sent to CERT-In to shut down fake MCD websites.</p>
      </div>

      <div style={{ padding: '14px 18px', background: '#F9FAFB', borderRadius: 10, borderLeft: '3px solid #E5E7EB', marginBottom: 28, fontSize: 13, color: '#6B7280', lineHeight: 1.7 }}>
        When a fake site is confirmed, SENTINEL auto-generates a formal takedown request to CERT-In. Sites are typically removed within 24–48 hours.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #E5E7EB' }}>
        {[
          { label: 'Requests This Month', value: pending.length + HISTORY.length, color: '#6384BE' },
          { label: 'Sites Still Live',    value: live.length,                     color: '#DC2626' },
          { label: 'Avg Removal Time',    value: '17 hrs',                        color: '#16A34A' },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: '0 32px 0 0', borderRight: i < 2 ? '1px solid #E5E7EB' : 'none' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color, letterSpacing: '-0.03em', marginBottom: 6 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Recently Removed</h2>
      <table className="data-table" style={{ marginBottom: 32 }}>
        <thead>
          <tr>{['Domain', 'Request Sent', 'Taken Down', 'Time to Remove'].map(h => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {HISTORY.map(h => (
            <tr key={h.domain}>
              <td style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, color: '#374151' }}>{h.domain}</td>
              <td style={{ color: '#6B7280', fontSize: 13 }}>{h.requestedOn}</td>
              <td style={{ color: '#16A34A', fontWeight: 600, fontSize: 13 }}>{h.takenDown}</td>
              <td>
                <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 20, background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', fontWeight: 600 }}>
                  {h.hours} hours
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {pending.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Pending Requests</h2>
          {pending.map(d => (
            <div key={d.id} style={{ padding: '14px 16px', border: '1px solid #FDE68A', borderLeft: '3px solid #D97706', borderRadius: 10, background: '#FFFBEB', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#D97706', fontFamily: 'IBM Plex Mono, monospace' }}>{d.domain}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Waiting for CERT-In response</div>
              </div>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'white', color: '#D97706', border: '1px solid #FDE68A', fontWeight: 700 }}>PENDING</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}