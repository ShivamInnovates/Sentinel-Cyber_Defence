import { useStore } from '../../store';
import { HelpIcon } from '../../components/ui';
import { TOOLTIPS } from '../../utils/constants';

export default function AttackChains() {
  const { correlations } = useStore();

  return (
    <div>
      <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #E5E7EB' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', marginBottom: 6 }}>Attack Chains</h1>
        <p style={{ fontSize: 15, color: '#6B7280' }}>Confirmed connections between fake websites and internal MCD breaches.</p>
      </div>

      <div style={{ padding: '14px 18px', background: '#F9FAFB', borderRadius: 10, borderLeft: '3px solid #E5E7EB', marginBottom: 28, fontSize: 13, color: '#6B7280', lineHeight: 1.7 }}>
        The Bridge compares the timing and type of every external fake site with every internal event. When a match is found, it calculates a confidence score and creates an attack chain with the full story in plain English.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {correlations.map((c) => (
          <div key={c.id} style={{ padding: '22px', border: '1px solid #E5E7EB', borderLeft: `3px solid ${c.confirmed ? '#DC2626' : '#D97706'}`, borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: c.confirmed ? '#FEF2F2' : '#FFFBEB', color: c.confirmed ? '#DC2626' : '#D97706', border: `1px solid ${c.confirmed ? '#FECACA' : '#FDE68A'}`, fontWeight: 700 }}>
                {c.confirmed ? '✓ Confirmed' : '⟳ Investigating'}
              </span>
              <span style={{ fontSize: 13, color: '#7C3AED', fontWeight: 600 }}>{c.type}</span>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end' }}>
                  Confidence <HelpIcon tooltip={TOOLTIPS.bridgeConfidence} />
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: c.confidence > 90 ? '#DC2626' : '#D97706', letterSpacing: '-0.02em' }}>{c.confidence}%</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: 8, alignItems: 'center', marginBottom: 14 }}>
              <div style={{ padding: '12px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Fake Site</div>
                <div style={{ fontSize: 13, fontFamily: 'IBM Plex Mono, monospace', color: '#DC2626', fontWeight: 600 }}>{c.externalThreat}</div>
              </div>
              <div style={{ textAlign: 'center', fontSize: 18, color: '#D1D5DB' }}>→</div>
              <div style={{ padding: '12px 14px', borderRadius: 10, background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Internal Event</div>
                <div style={{ fontSize: 13, color: '#111827', fontWeight: 600 }}>{c.internalEvent}</div>
              </div>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: 8, background: '#F9FAFB', borderLeft: '2px solid #E5E7EB' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Plain English</div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }}>{c.story}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}