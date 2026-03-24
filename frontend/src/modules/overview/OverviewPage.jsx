import { useStore } from '../../store';
import { ThreatTrendChart, SeverityDonut } from '../../components/charts';
import LiveFeed from '../../components/shared/LiveFeed';

const SEV_COLOR = { CRITICAL: '#ef4444', HIGH: '#f59e0b', MEDIUM: '#6384BE', LOW: '#6b7280' };

export default function OverviewPage() {
  const { kpis, events, correlations, trendData, setActiveModule } = useStore();
  const unresolved = events.filter(e => !e.resolved);

  const kpiCards = [
    { label: 'Active Threats',      value: kpis.activeThreats,                           color: '#ef4444', sub: `${kpis.criticalCount} critical` },
    { label: 'Live Phishing Sites', value: kpis.livePhishingSites,                       color: '#f59e0b', sub: 'Fake MCD sites online' },
    { label: 'Login Anomalies',     value: kpis.loginAnomalies,                          color: '#6384BE', sub: 'Last 60 minutes' },
    { label: 'Confirmed Attacks',   value: correlations.filter(c => c.confirmed).length, color: '#a78bfa', sub: 'Traced attack chains' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>Security Overview</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Real-time view of all threats across MCD Delhi's digital infrastructure.</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
        {kpiCards.map((s, i) => (
          <div key={s.label} className="card card-interactive" data-aos="fade-up" data-aos-delay={i * 60}
            style={{ padding: '20px 24px', borderTop: `2px solid ${s.color}` }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: s.color, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 8, animation: 'countUp 0.5s ease both' }}>
              {s.value}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart + Live Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, marginBottom: 16 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Threat & Anomaly Trend</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Last 24 hours</div>
          <div style={{ height: 200 }}><ThreatTrendChart data={trendData} /></div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Live Events</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: 'var(--success)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block', animation: 'pulse-dot 2s ease infinite' }} />
              LIVE
            </span>
          </div>
          <LiveFeed maxHeight={220} />
        </div>
      </div>

      {/* Recent Threats + Donut + Correlations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Recent Threats</span>
            <button onClick={() => setActiveModule('kavach')} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
          </div>
          {unresolved.length === 0
            ? <div style={{ color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>✓ All clear</div>
            : unresolved.slice(0, 4).map(e => (
              <div key={e.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-dim)', alignItems: 'flex-start' }}>
                <div style={{ width: 3, borderRadius: 2, alignSelf: 'stretch', flexShrink: 0, background: SEV_COLOR[e.severity] }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{e.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.zone} · {e.timestamp}</div>
                </div>
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: SEV_COLOR[e.severity] + '15', color: SEV_COLOR[e.severity], border: `1px solid ${SEV_COLOR[e.severity]}30`, fontWeight: 700, flexShrink: 0 }}>
                  {e.severity}
                </span>
              </div>
            ))
          }
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>By Severity</div>
          <div style={{ height: 160 }}><SeverityDonut events={unresolved} /></div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Attack Correlations</span>
            <button onClick={() => setActiveModule('bridge')} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
          </div>
          {correlations.slice(0, 3).map(c => (
            <div key={c.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-dim)' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: c.confirmed ? 'var(--critical-bg)' : 'var(--high-bg)', color: c.confirmed ? 'var(--critical)' : 'var(--high)', border: `1px solid ${c.confirmed ? 'var(--critical-border)' : 'var(--high-border)'}`, fontWeight: 700 }}>
                  {c.confirmed ? '✓ Confirmed' : '⟳ Investigating'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 'auto' }}>{c.confidence}%</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{c.story.slice(0, 90)}…</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
