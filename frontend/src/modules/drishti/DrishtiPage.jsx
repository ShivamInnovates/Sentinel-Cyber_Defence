import { useState } from 'react';
import Swal from 'sweetalert2';
import { useStore } from '../../store';
import { SeverityBadge, SeverityBar, Button, HelpIcon } from '../../components/ui';
import { TOOLTIPS } from '../../utils/constants';

export default function DrishtiPage() {
  const { domains, requestTakedown } = useStore();
  const [filter, setFilter] = useState('ALL');
  const filtered = filter === 'ALL' ? domains : domains.filter(d => d.status === filter);

  const handleTakedown = (domain) => {
    Swal.fire({
      title: 'Request Site Removal?',
      html: `<p style="color:#6B7280;font-size:14px;margin-bottom:12px">This will send a formal request to <strong style="color:#0B1E40">CERT-In</strong> (India's national cyber authority) to shut down:</p><div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:12px;color:#DC2626;font-family:monospace;font-size:13px">${domain.domain}</div><p style="color:#9CA3AF;font-size:12px;margin-top:12px">40 IT staff members will be notified automatically.</p>`,
      icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Yes, Request Removal', cancelButtonText: 'Cancel',
      background: '#FFFFFF', color: '#111827',
      confirmButtonColor: '#DC2626', cancelButtonColor: '#F3F4F6',
    }).then(r => {
      if (r.isConfirmed) {
        requestTakedown(domain.id);
        Swal.fire({ title: 'Takedown Requested', text: 'CERT-In has been notified. The site typically goes offline within 24–48 hours.', icon: 'success', background: '#FFFFFF', confirmButtonColor: '#6384BE' });
      }
    });
  };

  const STATUS_STYLE = {
    LIVE:     { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', label: 'Live — Stealing data now' },
    TAKEDOWN: { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0', label: 'Takedown requested' },
    WATCH:    { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A', label: 'Under monitoring' },
  };

  return (
    <div>
      {/* PAGE HEADER */}
      <div style={{ marginBottom: 40, paddingBottom: 32, borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#111827', letterSpacing: '-0.03em', marginBottom: 8 }}>DRISHTI</h1>
          <p style={{ fontSize: 16, color: '#6B7280', lineHeight: 1.6, maxWidth: 560 }}>
            External threat detection — monitors the internet 24/7 for fake MCD websites, phishing messages, and impersonation attempts the moment they appear.
          </p>
        </div>
        <Button variant="ghost" size="sm">↻ Refresh</Button>
      </div>

      {/* HOW IT WORKS */}
      <div style={{ padding: '16px 20px', background: '#F9FAFB', borderRadius: 10, borderLeft: '3px solid #E5E7EB', marginBottom: 36, fontSize: 14, color: '#6B7280', lineHeight: 1.7 }}>
        💡 <strong style={{ color: '#374151' }}>How DRISHTI works:</strong> Every time a new website certificate is created anywhere in the world, DRISHTI checks if it looks like an MCD website. If it does, it screenshots the page, analyses the content, and alerts the team — all in under 4 minutes.
      </div>

      {/* STATS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 40, paddingBottom: 32, borderBottom: '1px solid #E5E7EB' }}>
        {[
          { label: 'CertStream Status', value: 'LIVE',     color: '#16A34A', sub: 'Monitoring all new certificates' },
          { label: 'Domains Tracked',   value: '18,447',   color: '#6384BE', sub: 'Globally, across all TLDs' },
          { label: 'Detected Today',    value: domains.length, color: '#DC2626', sub: 'New phishing sites found' },
          { label: 'Takedowns Filed',   value: domains.filter(d => d.status === 'TAKEDOWN').length, color: '#D97706', sub: 'Removal requests sent to CERT-In' },
        ].map((s, i) => (
          <div key={s.label} data-aos="fade-up" style={{ padding: '0 32px 0 0', borderRight: i < 3 ? '1px solid #E5E7EB' : 'none' }}>
            <div style={{ fontSize: 40, fontWeight: 800, color: s.color, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 8 }}>{s.value}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* DOMAIN TABLE */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em', marginBottom: 4 }}>Detected Phishing Domains</h2>
            <p style={{ fontSize: 13, color: '#6B7280' }}>Fake websites impersonating MCD Delhi — sorted by how dangerous they are</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['ALL', 'LIVE', 'WATCH', 'TAKEDOWN'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '4px 14px', borderRadius: 20, border: '1px solid', borderColor: filter === f ? '#6384BE' : '#E5E7EB', background: filter === f ? '#EFF4FF' : 'transparent', color: filter === f ? '#4a6fa5' : '#6B7280', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>{['ID', 'Domain', 'Similarity to Real Site', 'Type', 'Detected', 'Status', 'Action'].map(h => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id}>
                <td style={{ color: '#9CA3AF', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>{d.id}</td>
                <td>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', fontFamily: 'IBM Plex Mono, monospace' }}>{d.domain}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{d.ip} · {d.country}</div>
                </td>
                <td style={{ minWidth: 180 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1 }}><SeverityBar value={d.similarity} severity={d.severity} /></div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', minWidth: 34, fontFamily: 'IBM Plex Mono, monospace' }}>{d.similarity}%</span>
                    <HelpIcon tooltip={TOOLTIPS.similarity} />
                  </div>
                </td>
                <td style={{ color: '#374151' }}>{d.type}</td>
                <td style={{ color: '#9CA3AF', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, whiteSpace: 'nowrap' }}>{d.age}</td>
                <td>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: STATUS_STYLE[d.status]?.bg, color: STATUS_STYLE[d.status]?.color, border: `1px solid ${STATUS_STYLE[d.status]?.border}`, fontWeight: 600, display: 'inline-block' }}>{d.status}</span>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>{STATUS_STYLE[d.status]?.label}</div>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {d.status !== 'TAKEDOWN' && <Button variant="danger" size="sm" onClick={() => handleTakedown(d)}>Remove</Button>}
                    <Button variant="ghost" size="sm">Report</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DETECTION METHODS */}
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em', marginBottom: 6 }}>How Detection Works</h2>
        <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 28 }}>Four techniques working simultaneously to catch every type of fake site</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[
            { name: 'Name Comparison',  icon: '🔤', color: '#6384BE', rate: '847 checks/min', desc: 'Compares every new website name to "mcd.delhi.gov.in". 80%+ similarity = instant flag.', tip: TOOLTIPS.levenshtein },
            { name: 'Visual Matching',  icon: '📸', color: '#D97706', rate: '312 scans/min',  desc: 'Screenshots suspected fake sites and compares them to the real MCD portal.' },
            { name: 'Message Scanning', icon: '💬', color: '#7C3AED', rate: '1,204 msgs/min', desc: 'Scans SMS and WhatsApp messages for phishing content pretending to be MCD.' },
            { name: 'Form Detection',   icon: '📋', color: '#16A34A', rate: 'Real-time',       desc: 'Detects Aadhaar and payment forms on fake sites — proof of data theft intent.' },
          ].map((m, i) => (
            <div key={m.name} data-aos="fade-up" data-aos-delay={i * 60}
              style={{ padding: `24px ${i < 3 ? '28px' : '0'} 24px ${i > 0 ? '28px' : '0'}`, borderRight: i < 3 ? '1px solid #E5E7EB' : 'none' }}>
              <span style={{ fontSize: 28, display: 'block', marginBottom: 14 }}>{m.icon}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{m.name}</div>
                {m.tip && <HelpIcon tooltip={m.tip} />}
              </div>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12, lineHeight: 1.6 }}>{m.desc}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: m.color }}>{m.rate}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}