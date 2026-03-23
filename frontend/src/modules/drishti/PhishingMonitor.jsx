const MESSAGES = [
  { id: 'PM001', channel: 'WhatsApp', text: 'Your MCD property tax is overdue. Pay now to avoid penalty: bit.ly/mcd-pay-now', risk: 'HIGH', detected: '10 min ago' },
  { id: 'PM002', channel: 'SMS', text: 'URGENT: MCD services suspended. Verify Aadhaar at mcd-verify-india.com to restore access.', risk: 'CRITICAL', detected: '22 min ago' },
  { id: 'PM003', channel: 'WhatsApp', text: 'MCD Delhi: Your water connection renewal is pending. Click here to complete KYC.', risk: 'MEDIUM', detected: '1h ago' },
  { id: 'PM004', channel: 'SMS', text: 'Congratulations! You qualify for an MCD subsidy of ₹4,500. Claim at mcdindia-scheme.in', risk: 'HIGH', detected: '2h ago' },
];

const RISK = {
  CRITICAL: { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  HIGH:     { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  MEDIUM:   { bg: '#EFF4FF', color: '#6384BE', border: '#BFCFEA' },
};

export default function PhishingMonitor() {
  return (
    <div>
      <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #E5E7EB' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', marginBottom: 6 }}>Phishing Monitor</h1>
        <p style={{ fontSize: 15, color: '#6B7280' }}>SMS and WhatsApp messages pretending to be MCD — detected in the last 24 hours.</p>
      </div>

      <div style={{ padding: '14px 18px', background: '#F9FAFB', borderRadius: 10, borderLeft: '3px solid #E5E7EB', marginBottom: 28, fontSize: 13, color: '#6B7280', lineHeight: 1.7 }}>
        DRISHTI scans 1,200+ messages per minute for MCD impersonation. Each flagged message is scored based on urgency language, fake links, and Aadhaar or payment requests.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #E5E7EB' }}>
        {[
          { label: 'Messages Scanned Today', value: '18,240',    color: '#6384BE' },
          { label: 'Phishing Detected',      value: '4',         color: '#DC2626' },
          { label: 'Scan Rate',              value: '1,204/min', color: '#16A34A' },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: '0 32px 0 0', borderRight: i < 2 ? '1px solid #E5E7EB' : 'none' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color, letterSpacing: '-0.03em', marginBottom: 6 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {MESSAGES.map(m => (
          <div key={m.id} style={{ padding: '18px 20px', border: `1px solid ${RISK[m.risk]?.border}`, borderLeft: `3px solid ${RISK[m.risk]?.color}`, borderRadius: 12, background: RISK[m.risk]?.bg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: 'white', color: RISK[m.risk]?.color, border: `1px solid ${RISK[m.risk]?.border}` }}>{m.risk}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{m.channel}</span>
              <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 'auto' }}>{m.detected}</span>
            </div>
            <div style={{ fontSize: 14, color: '#111827', lineHeight: 1.6, fontFamily: 'IBM Plex Mono, monospace' }}>"{m.text}"</div>
          </div>
        ))}
      </div>
    </div>
  );
}