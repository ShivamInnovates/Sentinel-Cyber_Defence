import { useStore } from '../../store';
import { HelpIcon } from '../../components/ui';
import { TOOLTIPS } from '../../utils/constants';

export default function CanaryCredentials() {
  const { canaries } = useStore();

  return (
    <div>
      <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>Canary Credentials</h1>
          <HelpIcon tooltip={TOOLTIPS.canary} />
        </div>
        <p style={{ fontSize: 15, color: '#6B7280' }}>Fake login details planted in phishing sites to catch credential theft in action.</p>
      </div>

      <div style={{ padding: '14px 18px', background: '#F9FAFB', borderRadius: 10, borderLeft: '3px solid #E5E7EB', marginBottom: 28, fontSize: 13, color: '#6B7280', lineHeight: 1.7 }}>
        We plant fake usernames and passwords into phishing sites. If those credentials are ever used on the real MCD portal, it is legal proof that the site stole real citizen data.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #E5E7EB' }}>
        {[
          { label: 'Canaries Planted',  value: canaries.length,                                    color: '#6384BE' },
          { label: 'Confirmed Stolen',  value: canaries.filter(c => c.status === 'STOLEN').length, color: '#DC2626' },
          { label: 'Cases Opened',      value: canaries.filter(c => c.status === 'STOLEN').length, color: '#7C3AED' },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: '0 32px 0 0', borderRight: i < 2 ? '1px solid #E5E7EB' : 'none' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color, letterSpacing: '-0.03em', marginBottom: 6 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {canaries.map(c => (
          <div key={c.id} style={{
            padding: '18px 20px', borderRadius: 12,
            border: `1px solid ${c.status === 'STOLEN' ? '#FECACA' : '#FDE68A'}`,
            borderLeft: `3px solid ${c.status === 'STOLEN' ? '#DC2626' : '#D97706'}`,
            background: c.status === 'STOLEN' ? '#FEF2F2' : '#FFFBEB',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontFamily: 'IBM Plex Mono, monospace', color: '#D97706', fontWeight: 600, marginBottom: 3 }}>{c.credential}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                  Planted in <span style={{ color: '#DC2626' }}>{c.site}</span> at {c.injectedAt}
                </div>
              </div>
              <span style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'white',
                color: c.status === 'STOLEN' ? '#DC2626' : '#D97706',
                border: `1px solid ${c.status === 'STOLEN' ? '#FECACA' : '#FDE68A'}`,
                fontWeight: 700,
              }}>
                {c.status === 'STOLEN' ? '⚠ Stolen' : '◎ Monitoring'}
              </span>
            </div>
            {c.status === 'STOLEN' && (
              <div style={{ padding: '10px 12px', background: 'white', borderRadius: 8, border: '1px solid #FECACA', fontSize: 13, color: '#374151' }}>
                Used on the real MCD portal at <strong>{c.usedAt}</strong> from IP{' '}
                <strong style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{c.usedIP}</strong>. This is forensic proof of credential theft.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}