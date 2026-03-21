import { useState } from 'react';
import Swal from 'sweetalert2';
import { useStore } from '../../store';
import { Panel, SeverityBadge, SeverityBar, Button, ModuleHeader, HelpIcon, StatusDot } from '../../components/ui';
import { TOOLTIPS } from '../../utils/constants';

export default function DrishtiPage() {
  const { domains, requestTakedown } = useStore();
  const [filter, setFilter] = useState('ALL');

  const filtered = filter === 'ALL' ? domains : domains.filter(d => d.status === filter);

  const handleTakedown = (domain) => {
    Swal.fire({
      title: 'Request Site Removal?',
      html: `
        <p style="color:#8fb8cc;font-size:14px;margin-bottom:12px">
          This will send a formal takedown request to <strong style="color:#e8f4f8">CERT-In</strong> (India's national cyber authority) to remove:
        </p>
        <div style="background:#0d2035;border:1px solid #234567;border-radius:8px;padding:12px;color:#f43f5e;font-family:'IBM Plex Mono',monospace;font-size:13px">
          ${domain.domain}
        </div>
        <p style="color:#4d7a93;font-size:12px;margin-top:12px">40 IT staff members will be notified automatically.</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Request Removal',
      cancelButtonText: 'Cancel',
      background: '#081625',
      color: '#e8f4f8',
      confirmButtonColor: '#f43f5e',
      cancelButtonColor: '#234567',
      borderRadius: '12px',
    }).then(result => {
      if (result.isConfirmed) {
        requestTakedown(domain.id);
        Swal.fire({
          title: 'Takedown Requested',
          html: `<p style="color:#8fb8cc;font-size:14px">CERT-In has been notified. The site will typically go offline within 24–48 hours.</p>`,
          icon: 'success',
          background: '#081625',
          color: '#e8f4f8',
          confirmButtonColor: '#38d9d9',
          confirmButtonText: 'OK',
        });
      }
    });
  };

  const statusColors = { LIVE: 'var(--critical)', TAKEDOWN: 'var(--success)', WATCH: 'var(--high)' };
  const statusBgs = { LIVE: 'var(--critical-bg)', TAKEDOWN: 'var(--success-bg)', WATCH: 'var(--high-bg)' };
  const statusLabels = {
    LIVE: 'Live — Actively stealing data',
    TAKEDOWN: 'Takedown requested — Being removed',
    WATCH: 'Under watch — Monitoring',
  };

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
      <ModuleHeader icon="◈" name="DRISHTI" subtitle="External threat detection — monitoring the internet for fake MCD websites" color="var(--medium)">
        <Button variant="ghost" size="sm" icon="↻">Refresh</Button>
      </ModuleHeader>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'CertStream', value: 'LIVE', color: 'var(--success)', icon: '◉', sub: 'Monitoring new certificates' },
          { label: 'Domains Tracked', value: '18,447', color: 'var(--medium)', icon: '◈', sub: 'Across all TLDs' },
          { label: 'Detected Today', value: domains.length, color: 'var(--critical)', icon: '⚠', sub: 'New phishing sites' },
          { label: 'Takedowns Sent', value: domains.filter(d => d.status === 'TAKEDOWN').length, color: 'var(--high)', icon: '✓', sub: 'Removal requests filed' },
        ].map(s => (
          <div key={s.label} data-aos="fade-up" className="card" style={{ padding: '16px 18px', borderTop: `2px solid ${s.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em', fontFamily: 'var(--font-mono)' }}>{s.label}</span>
              <span style={{ fontSize: 18, opacity: 0.4, color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)', margin: '6px 0 4px' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Domain table */}
      <Panel
        title="◈ Detected Phishing Domains"
        accent="var(--critical)"
        style={{ marginBottom: 20 }}
        action={
          <div style={{ display: 'flex', gap: 6 }}>
            {['ALL', 'LIVE', 'WATCH', 'TAKEDOWN'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '3px 10px', borderRadius: 5, border: '1px solid',
                borderColor: filter === f ? 'var(--teal-bright)' : 'var(--border-dim)',
                background: filter === f ? 'var(--teal-glow)' : 'transparent',
                color: filter === f ? 'var(--teal-bright)' : 'var(--text-muted)',
                fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-mono)',
                letterSpacing: '0.08em',
              }}>{f}</button>
            ))}
          </div>
        }
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-dim)' }}>
                {['ID', 'Domain', 'Similarity Score', 'Type', 'Detected', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.14em', fontFamily: 'var(--font-mono)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr key={d.id} style={{ borderBottom: '1px solid rgba(30,53,80,0.4)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-raised)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 12px', fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{d.id}</td>
                  <td style={{ padding: '12px 12px' }}>
                    <div style={{ fontSize: 13, color: 'var(--critical)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{d.domain}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>IP: {d.ip} · {d.country}</div>
                  </td>
                  <td style={{ padding: '12px 12px', minWidth: 160 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <SeverityBar value={d.similarity} severity={d.severity} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', minWidth: 36 }}>
                        {d.similarity}%
                        <HelpIcon tooltip={TOOLTIPS.similarity} />
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{d.type}</td>
                  <td style={{ padding: '12px 12px', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{d.age}</td>
                  <td style={{ padding: '12px 12px' }}>
                    <div>
                      <span style={{
                        fontSize: 10, padding: '3px 8px', borderRadius: 5,
                        background: statusBgs[d.status], color: statusColors[d.status],
                        fontWeight: 700, fontFamily: 'var(--font-mono)',
                        display: 'inline-block',
                      }}>{d.status}</span>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 3, maxWidth: 130 }}>{statusLabels[d.status]}</div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 12px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {d.status !== 'TAKEDOWN' && (
                        <Button variant="danger" size="sm" onClick={() => handleTakedown(d)}>Remove</Button>
                      )}
                      <Button variant="ghost" size="sm">Report</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Detection methods */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.14em', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
          HOW DRISHTI DETECTS FAKE SITES
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {[
            { name: 'Name Comparison', icon: '◈', color: 'var(--medium)', rate: '847 checks/min', desc: 'Compares every new website name to "mcd.delhi.gov.in". If it\'s 80%+ similar, it\'s flagged immediately.', tooltip: TOOLTIPS.levenshtein },
            { name: 'Visual Matching', icon: '◉', color: 'var(--high)', rate: '312 scans/min', desc: 'Takes screenshots of suspected fake sites and compares them visually to the real MCD website.', tooltip: null },
            { name: 'Message Analysis', icon: '◆', color: 'var(--mauve-bright)', rate: '1,204 msgs/min', desc: 'Scans SMS and WhatsApp messages for phishing content pretending to be MCD.', tooltip: null },
            { name: 'Form Detection', icon: '⬡', color: 'var(--teal-bright)', rate: 'Real-time', desc: 'Automatically detects if a fake site has an Aadhaar or payment form to steal citizen data.', tooltip: null },
          ].map(m => (
            <div key={m.name} data-aos="fade-up" className="card" style={{ padding: '18px', borderTop: `2px solid ${m.color}` }}>
              <div style={{ fontSize: 28, color: m.color, marginBottom: 10, opacity: 0.7 }}>{m.icon}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <div style={{ fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)' }}>{m.name}</div>
                {m.tooltip && <HelpIcon tooltip={m.tooltip} />}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.6 }}>{m.desc}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <StatusDot color={m.color} pulse size={6} />
                <span style={{ fontSize: 11, color: m.color, fontFamily: 'var(--font-mono)' }}>{m.rate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
