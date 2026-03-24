import { useState } from 'react';
import { useStore } from '../../store';
import { SeverityBar } from '../../components/ui';

/* ── shared styles ── */
const STATUS_STYLE = {
  LIVE:     { bg: 'var(--critical-bg)', color: 'var(--critical)', border: 'var(--critical-border)' },
  TAKEDOWN: { bg: 'var(--success-bg)',  color: 'var(--success)',  border: 'var(--success-border)' },
  WATCH:    { bg: 'var(--high-bg)',     color: 'var(--high)',     border: 'var(--high-border)' },
};

const RISK_STYLE = {
  CRITICAL: { bg: 'var(--critical-bg)', color: 'var(--critical)', border: 'var(--critical-border)' },
  HIGH:     { bg: 'var(--high-bg)',     color: 'var(--high)',     border: 'var(--high-border)' },
  MEDIUM:   { bg: 'var(--medium-bg)',   color: 'var(--medium)',   border: 'var(--medium-border)' },
};

const MESSAGES = [
  { id: 'PM001', channel: 'WhatsApp', text: 'Your MCD property tax is overdue. Pay now to avoid penalty: bit.ly/mcd-pay-now', risk: 'HIGH', detected: '10 min ago' },
  { id: 'PM002', channel: 'SMS', text: 'URGENT: MCD services suspended. Verify Aadhaar at mcd-verify-india.com to restore access.', risk: 'CRITICAL', detected: '22 min ago' },
  { id: 'PM003', channel: 'WhatsApp', text: 'MCD Delhi: Your water connection renewal is pending. Click here to complete KYC.', risk: 'MEDIUM', detected: '1h ago' },
  { id: 'PM004', channel: 'SMS', text: 'Congratulations! You qualify for an MCD subsidy of ₹4,500. Claim at mcdindia-scheme.in', risk: 'HIGH', detected: '2h ago' },
];

/* ── tab: fake sites ── */
function FakeSitesTab() {
  const { domains, requestTakedown } = useStore();
  const [filter, setFilter] = useState('ALL');
  const filtered = filter === 'ALL' ? domains : domains.filter(d => d.status === filter);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{filtered.length} domain{filtered.length !== 1 ? 's' : ''} found</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {['ALL', 'LIVE', 'WATCH', 'TAKEDOWN'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: '3px 12px', borderRadius: 20, border: '1px solid',
                borderColor: filter === f ? 'var(--accent)' : 'var(--border-dim)',
                background: filter === f ? 'var(--accent-light)' : 'transparent',
                color: filter === f ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s',
              }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>{['Domain', 'Similarity', 'Type', 'Age', 'Status', 'Action'].map(h => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map(d => {
              const ss = STATUS_STYLE[d.status] || STATUS_STYLE.WATCH;
              return (
                <tr key={d.id}>
                  <td>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--critical)', fontFamily: 'var(--font-mono)' }}>{d.domain}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{d.ip} · {d.country}</div>
                  </td>
                  <td style={{ minWidth: 140 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1 }}><SeverityBar value={d.similarity} severity={d.severity} /></div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', minWidth: 30 }}>{d.similarity}%</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{d.type}</td>
                  <td style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{d.age}</td>
                  <td>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, fontWeight: 600 }}>
                      {d.status}
                    </span>
                  </td>
                  <td>
                    {d.status !== 'TAKEDOWN'
                      ? <button onClick={() => requestTakedown(d.id)} style={{ fontSize: 11, padding: '4px 12px', borderRadius: 6, border: '1px solid var(--critical-border)', background: 'var(--critical-bg)', color: 'var(--critical)', fontWeight: 600, cursor: 'pointer' }}>Remove</button>
                      : <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>✓ Requested</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── tab: phishing messages ── */
function PhishingTab() {
  const [manualText, setManualText] = useState('');
  const [manualResult, setManualResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzeManual = async () => {
    if (!manualText.trim()) return;
    setLoading(true);
    setManualResult(null);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/classify-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: manualText }),
      });
      const data = await res.json();
      setManualResult(data);
    } catch {
      // Fallback to local scoring if backend is offline
      const lower = manualText.toLowerCase();
      const sev = lower.includes('aadhaar') || lower.includes('urgent') || lower.includes('suspended') ? 'CRITICAL'
               : lower.includes('mcd') || lower.includes('payment') ? 'HIGH' : 'MEDIUM';
      setManualResult({ offline: true, severity: sev });
    }
    setLoading(false);
  };


  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Scanned Today',      value: '18,240',   color: 'var(--accent)' },
          { label: 'Phishing Detected',  value: '4',        color: 'var(--critical)' },
          { label: 'Scan Rate',          value: '1,204/min', color: 'var(--success)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: '-0.03em', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Manual check */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>Manual Message Check</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={manualText}
            onChange={e => { setManualText(e.target.value); setManualResult(null); }}
            placeholder="Paste a suspicious message here..."
            style={{ flex: 1, padding: '9px 12px', borderRadius: 8, background: 'var(--bg-raised)', border: '1px solid var(--border-dim)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-dim)'}
          />
<<<<<<< HEAD
          <button onClick={analyzeManual} disabled={loading} style={{ padding: '9px 18px', borderRadius: 8, background: 'var(--accent)', border: 'none', color: '#0f0f0f', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Analyzing…' : 'Analyze'}
=======
          <button onClick={analyzeManual} style={{ padding: '9px 18px', borderRadius: 8, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Analyze
>>>>>>> e338343057573b469b9d0682195b14e497d6d7a7
          </button>
        </div>
        {manualResult && (
          <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, background: 'var(--bg-raised)', border: '1px solid var(--border-dim)', fontSize: 13, color: 'var(--text-primary)' }}>
            {manualResult.offline ? (
              <span style={{ color: RISK_STYLE[manualResult.severity]?.color }}>⚠ Backend offline — Local risk estimate: <strong>{manualResult.severity}</strong></span>
            ) : (
              <span>
                <strong style={{ color: manualResult.is_new ? 'var(--critical)' : 'var(--success)' }}>
                  {manualResult.is_new ? '🆕 New campaign detected' : `📎 Joined Campaign #${manualResult.campaign_id}`}
                </strong>
                {manualResult.confidence && <span style={{ marginLeft: 10, color: 'var(--text-muted)' }}>Confidence: {manualResult.confidence}%</span>}
                {manualResult.velocity?.alert && <span style={{ marginLeft: 10, color: 'var(--high)' }}>⚡ {manualResult.velocity.alert} ({manualResult.velocity.count} in 2hrs)</span>}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Message cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {MESSAGES.map(m => {
          const rs = RISK_STYLE[m.risk];
          return (
            <div key={m.id} className="card" style={{ padding: '16px 18px', borderLeft: `3px solid ${rs.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}>{m.risk}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{m.channel}</span>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 'auto' }}>{m.detected}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, fontFamily: 'var(--font-mono)' }}>"{m.text}"</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── main page ── */
const TABS = [
  { id: 'fake-sites', label: 'Fake Site Detection', sub: 'Spoofed domains' },
  { id: 'phishing',   label: 'Phishing Monitor',    sub: 'SMS & WhatsApp' },
];

export default function ThreatMonitor() {
  const [activeTab, setActiveTab] = useState('fake-sites');

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>Threat Monitor</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Fake websites and phishing messages impersonating MCD — detected and tracked in real time.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border-dim)', paddingBottom: 0 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1,
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 500 }}>{tab.label}</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{tab.sub}</div>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'fake-sites' ? <FakeSitesTab /> : <PhishingTab />}
    </div>
  );
}
