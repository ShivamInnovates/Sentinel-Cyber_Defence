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
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>Site Takedowns</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Formal removal requests sent to CERT-In to shut down fake MCD websites.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Requests This Month', value: pending.length + HISTORY.length, color: 'var(--medium)' },
          { label: 'Sites Still Live',    value: live.length,                     color: 'var(--critical)' },
          { label: 'Avg Removal Time',    value: '17 hrs',                        color: 'var(--success)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: '-0.03em', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-dim)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Recently Removed</div>
        <table className="data-table">
          <thead>
            <tr>{['Domain', 'Request Sent', 'Taken Down', 'Time'].map(h => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {HISTORY.map(h => (
              <tr key={h.domain}>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{h.domain}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{h.requestedOn}</td>
                <td style={{ color: 'var(--success)', fontWeight: 600, fontSize: 12 }}>{h.takenDown}</td>
                <td>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success-border)', fontWeight: 600 }}>
                    {h.hours}h
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pending.length > 0 && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-dim)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Pending Requests</div>
          {pending.map(d => (
            <div key={d.id} style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--high)', fontFamily: 'var(--font-mono)' }}>{d.domain}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>Waiting for CERT-In response</div>
              </div>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'var(--high-bg)', color: 'var(--high)', border: '1px solid var(--high-border)', fontWeight: 700 }}>PENDING</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
