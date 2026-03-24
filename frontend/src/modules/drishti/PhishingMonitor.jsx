import { useState } from 'react';

const MESSAGES = [
  { id: 'PM001', channel: 'WhatsApp', text: 'Your MCD property tax is overdue. Pay now to avoid penalty: bit.ly/mcd-pay-now', risk: 'HIGH', detected: '10 min ago' },
  { id: 'PM002', channel: 'SMS', text: 'URGENT: MCD services suspended. Verify Aadhaar at mcd-verify-india.com to restore access.', risk: 'CRITICAL', detected: '22 min ago' },
  { id: 'PM003', channel: 'WhatsApp', text: 'MCD Delhi: Your water connection renewal is pending. Click here to complete KYC.', risk: 'MEDIUM', detected: '1h ago' },
  { id: 'PM004', channel: 'SMS', text: 'Congratulations! You qualify for an MCD subsidy of ₹4,500. Claim at mcdindia-scheme.in', risk: 'HIGH', detected: '2h ago' },
];

const RISK_STYLE = {
  CRITICAL: { bg: 'var(--critical-bg)', color: 'var(--critical)', border: 'var(--critical-border)' },
  HIGH:     { bg: 'var(--high-bg)',     color: 'var(--high)',     border: 'var(--high-border)' },
  MEDIUM:   { bg: 'var(--medium-bg)',   color: 'var(--medium)',   border: 'var(--medium-border)' },
};

export default function PhishingMonitor() {
  const [manualText, setManualText] = useState('');
  const [manualResult, setManualResult] = useState(null);

  const analyzeManual = () => {
    if (!manualText.trim()) return;
    const lower = manualText.toLowerCase();
    const isHigh = lower.includes('aadhaar') || lower.includes('urgent') || lower.includes('suspended');
    const isMed = lower.includes('mcd') || lower.includes('delhi') || lower.includes('payment');
    setManualResult(isHigh ? 'CRITICAL' : isMed ? 'HIGH' : 'MEDIUM');
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>Phishing Monitor</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>SMS and WhatsApp messages impersonating MCD — detected in the last 24 hours.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Scanned Today', value: '18,240', color: 'var(--accent)' },
          { label: 'Phishing Detected', value: '4', color: 'var(--critical)' },
          { label: 'Scan Rate', value: '1,204/min', color: 'var(--success)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: '-0.03em', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Manual entry */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>Manual Message Check</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={manualText}
            onChange={e => { setManualText(e.target.value); setManualResult(null); }}
            placeholder="Paste a suspicious message here..."
            style={{ flex: 1, padding: '9px 12px', borderRadius: 8, background: 'var(--bg-raised)', border: '1px solid var(--border-dim)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-body)' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-dim)'}
          />
          <button onClick={analyzeManual} style={{ padding: '9px 18px', borderRadius: 8, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Analyze
          </button>
        </div>
        {manualResult && (
          <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, background: RISK_STYLE[manualResult].bg, border: `1px solid ${RISK_STYLE[manualResult].border}`, fontSize: 13, color: RISK_STYLE[manualResult].color, fontWeight: 600 }}>
            Risk Level: {manualResult} — {manualResult === 'CRITICAL' ? 'Highly suspicious. Contains Aadhaar/urgency triggers.' : 'Contains MCD-related keywords. Monitor closely.'}
          </div>
        )}
      </div>

      {/* Messages */}
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
