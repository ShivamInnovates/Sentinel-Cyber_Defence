import { useStore } from '../../store';
import { SeverityBadge, Button, HelpIcon } from '../../components/ui';
import { ThreatTrendChart, SeverityDonut } from '../../components/charts';
import LiveFeed from '../../components/shared/LiveFeed';
import { TOOLTIPS } from '../../utils/constants';

export default function OverviewPage() {
  const { kpis, events, correlations, trendData, setActiveModule } = useStore();
  const unresolved = events.filter(e => !e.resolved);

  return (
    <div>
      {/* PAGE HEADER */}
      <div style={{ marginBottom: 40, paddingBottom: 32, borderBottom: '1px solid #E5E7EB' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#111827', letterSpacing: '-0.03em', marginBottom: 8, lineHeight: 1.2 }}>
          Security Overview
        </h1>
        <p style={{ fontSize: 16, color: '#6B7280', lineHeight: 1.6, maxWidth: 560 }}>
          Real-time view of all threats across MCD Delhi's digital infrastructure — fake sites, internal breaches, and confirmed attack chains.
        </p>
      </div>

      {/* KPI ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 48, paddingBottom: 40, borderBottom: '1px solid #E5E7EB' }}>
        {[
          { label: 'Active Threats',      value: kpis.activeThreats,                          color: '#DC2626', sub: `${kpis.criticalCount} need immediate action`, tip: 'Total unresolved security threats detected right now.' },
          { label: 'Live Phishing Sites', value: kpis.livePhishingSites,                      color: '#D97706', sub: 'Fake MCD sites currently online',              tip: TOOLTIPS.certstream },
          { label: 'Login Anomalies',     value: kpis.loginAnomalies,                         color: '#1D4ED8', sub: 'Unusual logins in the last 60 minutes',         tip: TOOLTIPS.zscore },
          { label: 'Confirmed Attacks',   value: correlations.filter(c => c.confirmed).length, color: '#7C3AED', sub: 'Fully traced attack chains',                   tip: TOOLTIPS.bridgeConfidence },
        ].map((s, i) => (
          <div key={s.label} data-aos="fade-up" data-aos-delay={i * 60}
            style={{ padding: '0 32px 0 0', borderRight: i < 3 ? '1px solid #E5E7EB' : 'none' }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: s.color, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 10, animation: 'countUp 0.5s ease both' }}>
              {s.value}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              {s.label} <HelpIcon tooltip={s.tip} />
            </div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* TREND CHART + LIVE FEED */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 40, marginBottom: 48, paddingBottom: 40, borderBottom: '1px solid #E5E7EB' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em', marginBottom: 4 }}>Threat & Anomaly Trend</h2>
              <p style={{ fontSize: 13, color: '#6B7280' }}>Last 24 hours · Updates every 30 seconds</p>
            </div>
          </div>
          <div style={{ height: 220 }}><ThreatTrendChart data={trendData} /></div>
          <div style={{ marginTop: 14, padding: '12px 14px', background: '#F9FAFB', borderRadius: 8, fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
            💡 <strong style={{ color: '#374151' }}>Red line</strong> = fake websites detected. <strong style={{ color: '#374151' }}>Blue line</strong> = unusual login attempts on real MCD systems.
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>Live Events</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#16A34A' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
              LIVE
            </div>
          </div>
          <LiveFeed maxHeight={260} />
        </div>
      </div>

      {/* RECENT THREATS + DONUT + CORRELATIONS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 1fr', gap: 40, marginBottom: 48, paddingBottom: 40, borderBottom: '1px solid #E5E7EB' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>Recent Threats</h2>
            <button onClick={() => setActiveModule('kavach')} style={{ fontSize: 13, fontWeight: 500, color: '#6384BE', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>View all →</button>
          </div>
          {unresolved.length === 0
            ? <div style={{ padding: '28px 0', color: '#16A34A', fontSize: 14, fontWeight: 600 }}>✓ All clear — no active threats</div>
            : unresolved.slice(0, 4).map(e => (
              <div key={e.id} style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: '1px solid #F3F4F6', alignItems: 'flex-start' }}>
                <div style={{ width: 3, borderRadius: 2, alignSelf: 'stretch', flexShrink: 0, background: e.severity === 'CRITICAL' ? '#DC2626' : e.severity === 'HIGH' ? '#D97706' : '#6384BE' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 3 }}>{e.label}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>{e.zone} Zone · {e.timestamp}</div>
                  <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>{e.detail}</div>
                </div>
                <SeverityBadge severity={e.severity} small />
              </div>
            ))
          }
        </div>

        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em', marginBottom: 18 }}>By Severity</h2>
          <div style={{ height: 190 }}><SeverityDonut events={unresolved} /></div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>Attack Correlations</h2>
            <button onClick={() => setActiveModule('bridge')} style={{ fontSize: 13, fontWeight: 500, color: '#6384BE', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>View all →</button>
          </div>
          {correlations.slice(0, 3).map(c => (
            <div key={c.id} style={{ padding: '14px 0', borderBottom: '1px solid #F3F4F6' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 7, alignItems: 'center' }}>
                <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: c.confirmed ? '#FEF2F2' : '#FFFBEB', color: c.confirmed ? '#DC2626' : '#D97706', fontWeight: 700, border: `1px solid ${c.confirmed ? '#FECACA' : '#FDE68A'}` }}>
                  {c.confirmed ? '✓ Confirmed' : '⟳ Investigating'}
                </span>
                <span style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 'auto' }}>{c.confidence}% match</span>
              </div>
              <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>{c.story.slice(0, 100)}...</div>
            </div>
          ))}
        </div>
      </div>

      {/* STATS ROW */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em', marginBottom: 24 }}>System Coverage</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {[
            { label: 'Domains Monitored',   value: '18,447',  color: '#6384BE', tip: TOOLTIPS.certstream },
            { label: 'Computers Protected', value: '2,400',   color: '#16A34A', tip: 'All MCD computers monitored in real-time.' },
            { label: 'IT Staff Covered',    value: '40',      color: '#374151', tip: 'IT staff who receive automated alerts.' },
            { label: 'Zones Protected',     value: '12 / 12', color: '#16A34A', tip: '12 geographic zones of Delhi — all online.' },
            { label: 'Avg Detection Time',  value: '< 4 min', color: '#D97706', tip: 'Average time from threat appearance to alert.' },
          ].map((s, i) => (
            <div key={s.label} data-aos="fade-up" data-aos-delay={i * 50}
              style={{ padding: '0 24px', borderRight: i < 4 ? '1px solid #E5E7EB' : 'none', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: '-0.03em', marginBottom: 6 }}>{s.value}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, fontSize: 12, color: '#6B7280' }}>
                {s.label} <HelpIcon tooltip={s.tip} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}