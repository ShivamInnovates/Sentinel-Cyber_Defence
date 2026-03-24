import { useStore } from '../../store';

export default function KavachPage() {
  const { events, setActiveModule } = useStore();
  const unresolved = events.filter(e => !e.resolved);

  const stats = [
    { label: 'Active Threats',    value: unresolved.length, color: 'var(--critical)' },
    { label: 'Zones Monitored',   value: 12,                color: 'var(--accent)' },
    { label: 'Computers Covered', value: '2,400',           color: 'var(--medium)' },
    { label: 'Checks/min',        value: '12,400',          color: 'var(--high)' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>Kavach</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 520 }}>Internal network defense — watches 2,400 MCD computers across 12 Delhi zones for suspicious activity.</p>
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
          { id: 'login-anomalies', label: 'Login Anomalies', desc: 'Unusual login patterns across 2,400 computers.', color: 'var(--critical)' },
          { id: 'zone-watch',      label: '12 Zone Watch',   desc: 'Real-time status of all Delhi MCD zones.',       color: 'var(--accent)' },
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
