import { useStore } from '../../store';
import { KPICard, Panel, SeverityBadge, StatusDot, HelpIcon, Button } from '../../components/ui';
import { ThreatTrendChart, SeverityDonut } from '../../components/charts';
import RadarMap from '../../components/shared/RadarMap';
import LiveFeed from '../../components/shared/LiveFeed';
import { TOOLTIPS } from '../../utils/constants';

export default function OverviewPage() {
  const { kpis, events, correlations, trendData, zoneActivity, setActiveModule } = useStore();
  const unresolvedEvents = events.filter(e => !e.resolved);

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
      {/* ── KPI ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <KPICard
          label="Active Threats"
          value={kpis.activeThreats}
          sub={`${kpis.criticalCount} critical right now`}
          color="var(--critical)" icon="⚠" delta={12}
          tooltip="Total number of security threats that have been detected and not yet resolved."
          aos="fade-up"
        />
        <KPICard
          label="Live Phishing Sites"
          value={kpis.livePhishingSites}
          sub="Fake MCD sites online now"
          color="var(--high)" icon="◈" delta={8}
          tooltip="Fake websites impersonating MCD that are currently live and stealing citizen data."
          aos="fade-up" 
        />
        <KPICard
          label="Login Anomalies"
          value={kpis.loginAnomalies}
          sub="Last 60 min — above normal"
          color="var(--medium)" icon="◉"
          tooltip={TOOLTIPS.zscore}
          aos="fade-up"
        />
        <KPICard
          label="Confirmed Attacks"
          value={correlations.filter(c => c.confirmed).length}
          sub="Fully traced attack chains"
          color="var(--mauve-bright)" icon="⬢"
          tooltip="Complete attack stories confirmed by The Bridge — fake site to internal breach."
          aos="fade-up"
        />
      </div>

      {/* ── MAIN 3-COL GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 240px', gap: 14, marginBottom: 14 }}>

        {/* Radar */}
        <Panel title="◉ Zone Radar · 12 Zones" accent="var(--teal-bright)">
          <RadarMap events={unresolvedEvents} />
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[
              { label: 'Clear', color: '#4d7a93' },
              { label: 'Watch', color: '#60a5fa' },
              { label: 'Alert', color: '#fb923c' },
              { label: 'Critical', color: '#f43f5e' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: l.color }} />
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Trend Chart */}
        <Panel
          title="◆ Threat & Anomaly Trend — Last 24 Hours"
          accent="var(--critical)"
          action={
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Updates every 30s
            </span>
          }
        >
          <div style={{ height: 200 }}>
            <ThreatTrendChart data={trendData} />
          </div>
          <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--bg-raised)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            💡 Red line = fake websites detected. Teal line = unusual login attempts on real MCD systems.
          </div>
        </Panel>

        {/* Live Feed */}
        <Panel
          title="⬡ Live Event Feed"
          accent="var(--teal-bright)"
          action={<StatusDot color="var(--success)" pulse size={7} />}
        >
          <LiveFeed maxHeight={230} />
        </Panel>
      </div>

      {/* ── BOTTOM 3-COL GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 1fr', gap: 14, marginBottom: 14 }}>

        {/* Recent threats */}
        <Panel
          title="⚠ Recent Threats — Click to Investigate"
          accent="var(--critical)"
          action={<Button variant="ghost" size="sm" onClick={() => setActiveModule('kavach')}>View All →</Button>}
        >
          {unresolvedEvents.slice(0, 4).map(e => (
            <div key={e.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 0', borderBottom: '1px solid var(--border-dim)',
            }}>
              <div style={{
                width: 4, borderRadius: 2, alignSelf: 'stretch',
                background: e.severity === 'CRITICAL' ? 'var(--critical)' : e.severity === 'HIGH' ? 'var(--high)' : 'var(--medium)',
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{e.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.zone} Zone · {e.timestamp}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>{e.detail}</div>
              </div>
              <SeverityBadge severity={e.severity} small />
            </div>
          ))}
          {unresolvedEvents.length === 0 && (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--success)', fontSize: 13 }}>
              ✓ No active threats
            </div>
          )}
        </Panel>

        {/* Severity donut */}
        <Panel title="◎ By Severity" accent="var(--text-muted)">
          <div style={{ height: 160 }}>
            <SeverityDonut events={unresolvedEvents} />
          </div>
        </Panel>

        {/* Bridge correlations */}
        <Panel
          title="⬢ Latest Attack Correlations"
          accent="var(--mauve-bright)"
          action={<Button variant="ghost" size="sm" onClick={() => setActiveModule('bridge')}>View All →</Button>}
        >
          {correlations.slice(0, 3).map(c => (
            <div key={c.id} style={{
              padding: '10px', marginBottom: 8,
              background: 'var(--bg-raised)',
              borderRadius: 8,
              border: `1px solid ${c.confirmed ? 'var(--critical-border)' : 'var(--high-border)'}`,
            }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                <span style={{
                  fontSize: 10, padding: '2px 6px', borderRadius: 4,
                  background: c.confirmed ? 'var(--critical-bg)' : 'var(--high-bg)',
                  color: c.confirmed ? 'var(--critical)' : 'var(--high)',
                  fontFamily: 'var(--font-mono)', fontWeight: 700,
                }}>
                  {c.confirmed ? 'CONFIRMED' : 'INVESTIGATING'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--mauve-mid)', fontFamily: 'var(--font-mono)' }}>
                  {c.confidence}% match
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {c.story.slice(0, 100)}...
              </div>
            </div>
          ))}
        </Panel>
      </div>

      {/* ── QUICK STATS ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        {[
          { label: 'Domains Monitored', value: '18,447', color: 'var(--medium)', tooltip: TOOLTIPS.certstream },
          { label: 'Computers Protected', value: '2,400', color: 'var(--teal-bright)', tooltip: 'All computers across 12 MCD zones monitored in real-time.' },
          { label: 'IT Staff Covered', value: '40', color: 'var(--text-secondary)', tooltip: 'MCD IT staff who receive automated alerts.' },
          { label: 'Zones Protected', value: '12', color: 'var(--teal-bright)', tooltip: '12 geographic zones of Delhi covered by KAVACH.' },
          { label: 'Avg Detection', value: '< 4 min', color: 'var(--high)', tooltip: 'Average time from threat emergence to SENTINEL alert.' },
        ].map(s => (
          <div key={s.label} data-aos="fade-up" className="card" style={{
            padding: '14px 16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)', marginBottom: 4 }}>
              {s.value}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</span>
              <HelpIcon tooltip={s.tooltip} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
