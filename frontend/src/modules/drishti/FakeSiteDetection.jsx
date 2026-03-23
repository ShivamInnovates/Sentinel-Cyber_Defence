import { useState } from 'react';
import Swal from 'sweetalert2';
import { useStore } from '../../store';
import { SeverityBar, Button, HelpIcon } from '../../components/ui';
import { TOOLTIPS } from '../../utils/constants';

const STATUS = {
  LIVE:     { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  TAKEDOWN: { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  WATCH:    { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
};

export default function FakeSiteDetection() {
  const { domains, requestTakedown } = useStore();
  const [filter, setFilter] = useState('ALL');
  const filtered = filter === 'ALL' ? domains : domains.filter(d => d.status === filter);

  const handleTakedown = (domain) => {
    Swal.fire({
      title: 'Request Removal?',
      html: `<p style="color:#6B7280;font-size:14px;margin-bottom:10px">Send a takedown request to CERT-In for:</p><div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:10px;color:#DC2626;font-family:monospace;font-size:13px">${domain.domain}</div>`,
      icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Yes, Remove It', cancelButtonText: 'Cancel',
      background: '#fff', color: '#111827',
      confirmButtonColor: '#DC2626', cancelButtonColor: '#F3F4F6',
    }).then(r => {
      if (r.isConfirmed) {
        requestTakedown(domain.id);
        Swal.fire({ title: 'Done', text: 'CERT-In notified. Site goes offline in 24–48 hours.', icon: 'success', background: '#fff', confirmButtonColor: '#6384BE' });
      }
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #E5E7EB' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', marginBottom: 6 }}>Fake Site Detection</h1>
        <p style={{ fontSize: 15, color: '#6B7280' }}>Every fake MCD website found online today — with how dangerous each one is.</p>
      </div>

      <div style={{ padding: '14px 18px', background: '#F9FAFB', borderRadius: 10, borderLeft: '3px solid #E5E7EB', marginBottom: 28, fontSize: 13, color: '#6B7280', lineHeight: 1.7 }}>
        When a new website appears online, DRISHTI compares its name to "mcd.delhi.gov.in". If it looks 80% or more similar, it is immediately flagged and screenshotted for review.
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: '#9CA3AF' }}>{filtered.length} domain{filtered.length !== 1 ? 's' : ''} shown</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {['ALL', 'LIVE', 'WATCH', 'TAKEDOWN'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '3px 12px', borderRadius: 20, border: '1px solid', borderColor: filter === f ? '#6384BE' : '#E5E7EB', background: filter === f ? '#EFF4FF' : 'transparent', color: filter === f ? '#4a6fa5' : '#6B7280', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>{['Domain', 'Similarity', 'Type', 'Age', 'Status', 'Action'].map(h => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {filtered.map(d => (
            <tr key={d.id}>
              <td>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', fontFamily: 'IBM Plex Mono, monospace' }}>{d.domain}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{d.ip} · {d.country}</div>
              </td>
              <td style={{ minWidth: 160 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1 }}><SeverityBar value={d.similarity} severity={d.severity} /></div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', minWidth: 32, fontFamily: 'IBM Plex Mono, monospace' }}>{d.similarity}%</span>
                  <HelpIcon tooltip={TOOLTIPS.similarity} />
                </div>
              </td>
              <td style={{ color: '#374151', fontSize: 13 }}>{d.type}</td>
              <td style={{ color: '#9CA3AF', fontSize: 12, fontFamily: 'IBM Plex Mono, monospace' }}>{d.age}</td>
              <td>
                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: STATUS[d.status]?.bg, color: STATUS[d.status]?.color, border: `1px solid ${STATUS[d.status]?.border}`, fontWeight: 600 }}>
                  {d.status}
                </span>
              </td>
              <td>
                {d.status !== 'TAKEDOWN'
                  ? <Button variant="danger" size="sm" onClick={() => handleTakedown(d)}>Remove</Button>
                  : <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 600 }}>✓ Requested</span>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}