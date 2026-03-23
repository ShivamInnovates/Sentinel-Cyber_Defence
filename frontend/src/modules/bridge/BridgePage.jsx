import { useStore } from '../../store';
import { Button, HelpIcon } from '../../components/ui';
import { TOOLTIPS } from '../../utils/constants';

export default function BridgePage() {
  const { correlations, canaries } = useStore();

  return (
    <div>
      {/* PAGE HEADER */}
      <div style={{ marginBottom: 40, paddingBottom: 32, borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#111827', letterSpacing: '-0.03em', marginBottom: 8 }}>Bridge Correlation</h1>
          <p style={{ fontSize: 16, color: '#6B7280', lineHeight: 1.6, maxWidth: 560 }}>
            Connects external fake websites to internal breaches — revealing the full story of each attack in plain English.
          </p>
        </div>
        <Button variant="ghost" size="sm">Export Report</Button>
      </div>

      {/* HOW IT WORKS */}
      <div style={{ padding: '16px 20px', background: '#F9FAFB', borderRadius: 10, borderLeft: '3px solid #E5E7EB', marginBottom: 40, fontSize: 14, color: '#6B7280', lineHeight: 1.7 }}>
        💡 <strong style={{ color: '#374151' }}>How The Bridge works:</strong> DRISHTI finds fake sites. KAVACH finds internal breaches. The Bridge asks: "Are these part of the same attack?" If someone visits a fake MCD site and their stolen password is later used on the real portal, The Bridge catches that connection automatically.
      </div>

      {/* ATTACK CHAINS */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em', marginBottom: 4 }}>
            Confirmed Attack Chains
            <span style={{ fontSize: 14, color: '#9CA3AF', fontWeight: 400, marginLeft: 10 }}>· {correlations.length} found</span>
          </h2>
          <p style={{ fontSize: 13, color: '#6B7280' }}>Each card shows a complete attack — from the fake website to the internal breach</p>
        </div>

        {correlations.map((c, idx) => (
          <div key={c.id} data-aos="fade-up" data-aos-delay={idx * 80}
            style={{ marginBottom: 24, padding: '24px', border: '1px solid #E5E7EB', borderLeft: `3px solid ${c.confirmed ? '#DC2626' : '#D97706'}`, borderRadius: 12 }}>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: c.confirmed ? '#FEF2F2' : '#FFFBEB', color: c.confirmed ? '#DC2626' : '#D97706', border: `1px solid ${c.confirmed ? '#FECACA' : '#FDE68A'}`, fontWeight: 700 }}>
                {c.confirmed ? '✓ Confirmed Attack' : '⟳ Investigating'}
              </span>
              <span style={{ fontSize: 13, color: '#7C3AED', fontWeight: 600 }}>{c.type}</span>
              <span style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 'auto' }}>Detected at {c.timestamp}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px 1fr 110px', gap: 12, alignItems: 'center', marginBottom: 18 }}>
              <div style={{ padding: '14px 16px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#DC2626', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 7 }}>DRISHTI — Fake Site</div>
                <div style={{ fontSize: 13, color: '#DC2626', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, marginBottom: 4 }}>{c.externalThreat}</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>Collecting citizen login details</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', marginBottom: 5 }}>BRIDGE</div>
                <div style={{ fontSize: 22, color: '#D1D5DB' }}>→</div>
                <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>linked</div>
              </div>

              <div style={{ padding: '14px 16px', borderRadius: 10, background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#16A34A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 7 }}>KAVACH — Internal Breach</div>
                <div style={{ fontSize: 13, color: '#111827', fontWeight: 600, marginBottom: 4 }}>{c.internalEvent}</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>Stolen credentials used on real MCD</div>
              </div>

              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                  Match confidence <HelpIcon tooltip={TOOLTIPS.bridgeConfidence} />
                </div>
                <div style={{ fontSize: 38, fontWeight: 800, color: c.confidence > 90 ? '#DC2626' : '#D97706', letterSpacing: '-0.03em', lineHeight: 1 }}>{c.confidence}%</div>
                <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2, marginTop: 10 }}>
                  <div style={{ height: '100%', width: `${c.confidence}%`, background: c.confidence > 90 ? '#DC2626' : '#D97706', borderRadius: 2, transition: 'width 1s ease' }} />
                </div>
              </div>
            </div>

            <div style={{ padding: '14px 16px', borderRadius: 10, background: '#F9FAFB', borderLeft: '2px solid #E5E7EB' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>What happened — in plain English</div>
              <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>{c.story}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CANARY CREDENTIALS */}
      <div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>Canary Credentials</h2>
            <HelpIcon tooltip={TOOLTIPS.canary} />
          </div>
          <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, maxWidth: 600 }}>
            We plant fake login details (canaries) into phishing sites. If used on the real MCD portal, it is <strong style={{ color: '#374151' }}>legal proof</strong> of credential theft.
          </p>
        </div>
        <table className="data-table">
          <thead>
            <tr>{['Fake Credential', 'Planted Into', 'Injected At', 'Status', 'Used From IP'].map(h => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {canaries.map(c => (
              <tr key={c.id}>
                <td style={{ color: '#D97706', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>{c.credential}</td>
                <td style={{ color: '#DC2626', fontSize: 13 }}>{c.site}</td>
                <td style={{ color: '#9CA3AF', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>{c.injectedAt}</td>
                <td>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: c.status === 'STOLEN' ? '#FEF2F2' : '#FFFBEB', color: c.status === 'STOLEN' ? '#DC2626' : '#D97706', border: `1px solid ${c.status === 'STOLEN' ? '#FECACA' : '#FDE68A'}`, fontWeight: 700 }}>
                    {c.status === 'STOLEN' ? '⚠ Stolen — used on real portal' : '◎ Monitoring…'}
                  </span>
                </td>
                <td style={{ color: '#9CA3AF', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>{c.usedIP || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}