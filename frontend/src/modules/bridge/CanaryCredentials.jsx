import { useStore } from '../../store';

export default function CanaryCredentials() {
  const { canaries } = useStore();

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>Canary Credentials</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Fake login details planted in phishing sites to catch credential theft in action.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Canaries Planted',  value: canaries.length,                                    color: 'var(--medium)' },
          { label: 'Confirmed Stolen',  value: canaries.filter(c => c.status === 'STOLEN').length, color: 'var(--critical)' },
          { label: 'Cases Opened',      value: canaries.filter(c => c.status === 'STOLEN').length, color: 'var(--info)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: '-0.03em', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {canaries.map(c => {
          const stolen = c.status === 'STOLEN';
          return (
            <div key={c.id} className="card" style={{ padding: '18px 20px', borderLeft: `3px solid ${stolen ? 'var(--critical)' : 'var(--high)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: stolen ? 12 : 0 }}>
                <div>
                  <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--high)', fontWeight: 600, marginBottom: 3 }}>{c.credential}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Planted in <span style={{ color: 'var(--critical)' }}>{c.site}</span> at {c.injectedAt}
                  </div>
                </div>
                <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: stolen ? 'var(--critical-bg)' : 'var(--high-bg)', color: stolen ? 'var(--critical)' : 'var(--high)', border: `1px solid ${stolen ? 'var(--critical-border)' : 'var(--high-border)'}`, fontWeight: 700 }}>
                  {stolen ? '⚠ Stolen' : '◎ Monitoring'}
                </span>
              </div>
              {stolen && (
                <div style={{ padding: '10px 12px', background: 'var(--bg-raised)', borderRadius: 8, border: '1px solid var(--critical-border)', fontSize: 12, color: 'var(--text-secondary)' }}>
                  Used on real MCD portal at <strong style={{ color: 'var(--text-primary)' }}>{c.usedAt}</strong> from IP{' '}
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--critical)' }}>{c.usedIP}</strong> — forensic proof of credential theft.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
