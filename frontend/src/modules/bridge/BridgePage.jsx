import { useStore } from '../../store';
import { Panel, SeverityBadge, Button, ModuleHeader, HelpIcon } from '../../components/ui';
import { TOOLTIPS } from '../../utils/constants';

export default function BridgePage() {
  const { correlations, canaries } = useStore();

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
      <ModuleHeader icon="⬢" name="The Bridge" subtitle="Connecting fake websites to real breaches — revealing the full attack story" color="var(--mauve-bright)">
        <Button variant="ghost" size="sm">Export Report</Button>
      </ModuleHeader>

      {/* Explainer */}
      <div data-aos="fade-up" className="card" style={{
        padding: '20px 24px', marginBottom: 20,
        borderLeft: '3px solid var(--mauve-bright)',
        background: 'rgba(201,168,212,0.04)',
      }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 32, flexShrink: 0 }}>⬢</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: 6 }}>
              How The Bridge Works
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              DRISHTI watches the internet for fake MCD sites. KAVACH watches MCD computers for unusual activity.
              <strong style={{ color: 'var(--mauve-bright)' }}> The Bridge</strong> automatically asks: "Are these two things part of the same attack?"
              If someone visits a fake MCD site and their stolen password is later used on the real system — The Bridge catches that connection.
            </div>
          </div>
        </div>
      </div>

      {/* Correlation cards */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.14em', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>
          CONFIRMED ATTACK CHAINS · {correlations.length} FOUND
        </div>
        {correlations.map((c, idx) => (
          <div
            key={c.id}
            data-aos="fade-up"
            data-aos-delay={idx * 80}
            className="card"
            style={{
              marginBottom: 14,
              border: `1px solid ${c.confirmed ? 'var(--critical-border)' : 'var(--high-border)'}`,
              borderLeft: `3px solid ${c.confirmed ? 'var(--critical)' : 'var(--high)'}`,
              padding: 20,
            }}
          >
            {/* Header row */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{c.id}</span>
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 5,
                background: c.confirmed ? 'var(--critical-bg)' : 'var(--high-bg)',
                color: c.confirmed ? 'var(--critical)' : 'var(--high)',
                fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.08em',
              }}>
                {c.confirmed ? '✓ CONFIRMED ATTACK' : '⟳ INVESTIGATING'}
              </span>
              <span style={{ fontSize: 11, color: 'var(--mauve-mid)', fontFamily: 'var(--font-mono)' }}>{c.type}</span>
              <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
                Detected at {c.timestamp}
              </span>
            </div>

            {/* Flow diagram */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr 80px', gap: 10, alignItems: 'center', marginBottom: 14 }}>
              {/* External */}
              <div style={{
                padding: '12px 16px', borderRadius: 8,
                background: 'var(--critical-bg)', border: '1px solid var(--critical-border)',
              }}>
                <div style={{ fontSize: 10, color: 'var(--critical)', letterSpacing: '0.14em', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
                  DRISHTI — FAKE SITE
                </div>
                <div style={{ fontSize: 13, color: 'var(--high)', fontFamily: 'var(--font-mono)', fontWeight: 600, marginBottom: 4 }}>
                  {c.externalThreat}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Collecting citizen credentials</div>
              </div>

              {/* Arrow */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, color: 'var(--mauve-bright)' }}>⬢</div>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>BRIDGE</div>
                <div style={{ fontSize: 18, color: 'var(--mauve-dim)', marginTop: 2 }}>→</div>
              </div>

              {/* Internal */}
              <div style={{
                padding: '12px 16px', borderRadius: 8,
                background: 'var(--low-bg)', border: '1px solid var(--low-border)',
              }}>
                <div style={{ fontSize: 10, color: 'var(--teal-bright)', letterSpacing: '0.14em', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
                  KAVACH — INTERNAL EVENT
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>
                  {c.internalEvent}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Stolen credentials used on real MCD</div>
              </div>

              {/* Confidence */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                  MATCH CONFIDENCE
                  <HelpIcon tooltip={TOOLTIPS.bridgeConfidence} />
                </div>
                <div style={{
                  fontSize: 36, fontWeight: 800,
                  color: c.confidence > 90 ? 'var(--critical)' : 'var(--high)',
                  fontFamily: 'var(--font-display)', lineHeight: 1,
                }}>{c.confidence}%</div>
                <div style={{
                  height: 4, background: 'var(--bg-raised)', borderRadius: 2, marginTop: 6,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', width: `${c.confidence}%`,
                    background: c.confidence > 90 ? 'var(--critical)' : 'var(--high)',
                    borderRadius: 2, transition: 'width 1s ease',
                  }} />
                </div>
              </div>
            </div>

            {/* Plain-English story */}
            <div style={{
              padding: '12px 14px', borderRadius: 8,
              background: 'var(--bg-raised)',
              borderLeft: '2px solid var(--mauve-dim)',
            }}>
              <div style={{ fontSize: 10, color: 'var(--mauve-mid)', letterSpacing: '0.14em', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
                WHAT HAPPENED — IN PLAIN ENGLISH
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{c.story}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Canary credentials */}
      <Panel title="🐦 Canary Credentials — Forensic Proof System" accent="var(--high)" action={<HelpIcon tooltip={TOOLTIPS.canary} />}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
          We plant fake login details (canaries) into phishing sites. If those credentials are later used on the real MCD portal,
          it is <strong style={{ color: 'var(--text-primary)' }}>legal proof</strong> the fake site stole data from real citizens.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-dim)' }}>
                {['Fake Credential', 'Planted Into', 'Injected At', 'Status', 'Used At', 'From IP'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.14em', fontFamily: 'var(--font-mono)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {canaries.map(c => (
                <tr key={c.id}
                  style={{ borderBottom: '1px solid rgba(30,53,80,0.4)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-raised)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 12px', color: 'var(--high)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{c.credential}</td>
                  <td style={{ padding: '12px 12px', color: 'var(--critical)', fontSize: 12 }}>{c.site}</td>
                  <td style={{ padding: '12px 12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{c.injectedAt}</td>
                  <td style={{ padding: '12px 12px' }}>
                    <span style={{
                      fontSize: 10, padding: '3px 8px', borderRadius: 5,
                      background: c.status === 'STOLEN' ? 'var(--critical-bg)' : 'var(--high-bg)',
                      color: c.status === 'STOLEN' ? 'var(--critical)' : 'var(--high)',
                      fontFamily: 'var(--font-mono)', fontWeight: 700,
                    }}>
                      {c.status === 'STOLEN' ? '⚠ STOLEN — Credential was used!' : '◎ Monitoring…'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{c.usedAt || '—'}</td>
                  <td style={{ padding: '12px 12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{c.usedIP || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
