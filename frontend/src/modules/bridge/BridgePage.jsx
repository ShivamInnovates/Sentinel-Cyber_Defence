import { useStore } from '../../store';

export default function BridgePage() {
  const { correlations, setActiveModule } = useStore();
  const confirmed = correlations.filter(c => c.confirmed).length;

  const stats = [
    { label: 'Correlations Found', value: correlations.length, color: 'var(--info)' },
    { label: 'Confirmed Attacks',  value: confirmed,           color: 'var(--critical)' },
    { label: 'Investigating',      value: correlations.length - confirmed, color: 'var(--high)' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>Bridge Correlation</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 520 }}>Connects external fake websites to internal breaches — revealing the full story of each attack.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        {stats.map(s => (
          <div key={s.label} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: '-0.03em', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {[
          { id: 'attack-chains', label: 'Attack Chains',      desc: 'Fake site linked to internal breach — full story.', color: 'var(--critical)' },
          { id: 'canary-creds',  label: 'Canary Credentials', desc: 'Forensic proof of credential theft.',               color: 'var(--high)' },
        ].map(item => (
          <button key={item.id} onClick={() => setActiveModule(item.id)}
            className="card card-interactive"
            style={{ padding: '20px 22px', textAlign: 'left', width: '100%' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: item.color, marginBottom: 6 }}>{item.label}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.desc}</div>
            <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 12 }}>Open →</div>
          </button>
        ))}
      </div>
    </div>
  );
}
