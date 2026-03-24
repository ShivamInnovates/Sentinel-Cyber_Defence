import { useStore } from '../../store';

export default function DrishtiPage() {
  const { domains, setActiveModule } = useStore();

  const stats = [
    { label: 'Domains Tracked',  value: '18,447',              color: 'var(--accent)' },
    { label: 'Detected Today',   value: domains.length,        color: 'var(--critical)' },
    { label: 'Takedowns Filed',  value: domains.filter(d => d.status === 'TAKEDOWN').length, color: 'var(--high)' },
    { label: 'Scan Rate',        value: '847/min',             color: 'var(--medium)' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>Drishti</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 520 }}>External threat detection — monitors the internet 24/7 for fake MCD websites and phishing messages.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {stats.map(s => (
          <div key={s.label} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: '-0.03em', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {[
          { id: 'fake-sites',       label: 'Fake Site Detection', desc: 'Every fake MCD website found online today.', color: 'var(--critical)' },
          { id: 'phishing-monitor', label: 'Phishing Monitor',    desc: 'SMS and WhatsApp impersonation messages.',   color: 'var(--high)' },
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
