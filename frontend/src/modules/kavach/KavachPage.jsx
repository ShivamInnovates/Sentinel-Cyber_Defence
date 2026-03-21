import Swal from 'sweetalert2';
import { useStore } from '../../store';
import { Panel, SeverityBadge, Button, ModuleHeader, HelpIcon, StatusDot } from '../../components/ui';
import { ZoneActivityChart } from '../../components/charts';
import { TOOLTIPS, ZONES } from '../../utils/constants';

export default function KavachPage() {
  const { events, resolvEvent, zoneActivity } = useStore();
  const unresolved = events.filter(e => !e.resolved);
  const resolved = events.filter(e => e.resolved);

  const handleResolve = (event) => {
    Swal.fire({
      title: 'Mark as Handled?',
      html: `
        <p style="color:#8fb8cc;font-size:14px;margin-bottom:10px">Confirm that this threat has been investigated and handled:</p>
        <div style="background:#0d2035;border:1px solid #234567;border-radius:8px;padding:12px;margin-bottom:10px">
          <div style="color:#e8f4f8;font-size:14px;font-weight:600;margin-bottom:4px">${event.label}</div>
          <div style="color:#4d7a93;font-size:12px">${event.zone} Zone · ${event.timestamp}</div>
        </div>
        <p style="color:#4d7a93;font-size:12px">${event.detail}</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Mark as Handled',
      cancelButtonText: 'Not Yet',
      background: '#081625',
      color: '#e8f4f8',
      confirmButtonColor: '#38d9d9',
      cancelButtonColor: '#234567',
    }).then(result => {
      if (result.isConfirmed) {
        resolvEvent(event.id);
        Swal.fire({
          title: 'Event Resolved',
          text: 'The threat has been marked as handled and removed from the active queue.',
          icon: 'success',
          background: '#081625',
          color: '#e8f4f8',
          confirmButtonColor: '#38d9d9',
          confirmButtonText: 'OK',
          timer: 2000,
          timerProgressBar: true,
        });
      }
    });
  };

  const RULES = [
    { name: 'Failed Login Spike', rule: 'More than 10 failed logins in 5 minutes', detail: 'This catches attackers using stolen passwords to try breaking in.', triggers: 34, sev: 'CRITICAL' },
    { name: 'Off-Hours Admin Access', rule: 'Admin login outside 9 AM – 7 PM', detail: 'Legitimate staff rarely log in at 3 AM. This flags suspicious after-hours access.', triggers: 12, sev: 'HIGH' },
    { name: 'Port Scanning', rule: 'More than 100 network ports probed in 60s', detail: 'Attackers scan ports to find weaknesses before breaking in.', triggers: 8, sev: 'HIGH' },
    { name: 'Large Data Export', rule: 'More than 500MB transferred in one session', detail: 'Normal work doesn\'t involve moving huge files. This catches data theft.', triggers: 3, sev: 'MEDIUM' },
    { name: 'Foreign IP Access', rule: 'Connection from non-Indian IP address', detail: 'MCD staff work from India. Any foreign IP on internal systems is suspicious.', triggers: 19, sev: 'CRITICAL' },
  ];

  const sevColors = { CRITICAL: 'var(--critical)', HIGH: 'var(--high)', MEDIUM: 'var(--medium)', LOW: 'var(--low)' };

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
      <ModuleHeader icon="◆" name="KAVACH" subtitle="Internal network defense — watching 2,400 MCD computers across 12 zones" color="var(--teal-bright)">
        <Button variant="ghost" size="sm" icon="↻">Refresh</Button>
      </ModuleHeader>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Active Threats', value: unresolved.length, color: 'var(--critical)', sub: 'Needs attention' },
          { label: 'Resolved Today', value: resolved.length, color: 'var(--success)', sub: 'Handled by team' },
          { label: 'Zones Monitored', value: 12, color: 'var(--teal-bright)', sub: 'All online' },
          { label: 'Computers Covered', value: '2,400', color: 'var(--medium)', sub: 'Real-time monitoring' },
        ].map(s => (
          <div key={s.label} data-aos="fade-up" className="card" style={{ padding: '16px 18px', borderTop: `2px solid ${s.color}` }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 14, marginBottom: 14 }}>
        {/* Radar */}
        <div>
          <Panel title="◉ 12-Zone Status Heatmap" accent="var(--accent-primary)">
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
    {ZONES.map(z => {
      const count = unresolved.filter(e => e.zone === z.name).length;
      const color = count === 0 ? 'var(--success)'
                  : count === 1 ? 'var(--medium)'
                  : count === 2 ? 'var(--high)'
                  : 'var(--critical)';
      const bg    = count === 0 ? 'var(--success-bg)'
                  : count === 1 ? 'var(--medium-bg)'
                  : count === 2 ? 'var(--high-bg)'
                  : 'var(--critical-bg)';
      return (
        <div key={z.id} style={{
          padding: '10px 8px', borderRadius: 8, textAlign: 'center',
          background: bg, border: `1px solid ${color}44`,
          transition: 'all 0.2s ease',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>{z.id}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginTop: 2 }}>{z.name}</div>
          <div style={{ fontSize: 16, fontWeight: 800, color, fontFamily: 'var(--font-display)', marginTop: 4 }}>
            {count === 0 ? '✓' : count}
          </div>
        </div>
      );
    })}
  </div>
  {/* Legend */}
  <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
    {[
      { label: 'Clear', color: 'var(--success)' },
      { label: 'Watch', color: 'var(--medium)' },
      { label: 'Alert', color: 'var(--high)' },
      { label: 'Critical', color: 'var(--critical)' },
    ].map(l => (
      <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>{l.label}</span>
      </div>
    ))}
  </div>
</Panel>
          <Panel title="⬡ Zone Activity" accent="var(--medium)">
            <div style={{ height: 160 }}>
              <ZoneActivityChart data={zoneActivity} />
            </div>
          </Panel>
        </div>

        {/* Rules engine */}
        <Panel title="◆ Detection Rules — What KAVACH Watches For" accent="var(--teal-bright)">
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.6 }}>
            These are the automatic rules that trigger alerts. Each rule is designed to catch a specific type of attack.
          </p>
          {RULES.map(r => (
            <div key={r.name} style={{
              display: 'flex', gap: 14, alignItems: 'center',
              padding: '12px 0', borderBottom: '1px solid rgba(30,53,80,0.5)',
            }}>
              <div style={{ width: 4, height: 44, borderRadius: 2, background: sevColors[r.sev], flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', marginBottom: 3 }}>{r.name}</div>
                <div style={{ fontSize: 11, color: 'var(--teal-mid)', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>Rule: {r.rule}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.detail}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: sevColors[r.sev], fontFamily: 'var(--font-display)' }}>{r.triggers}</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>triggers today</div>
                <SeverityBadge severity={r.sev} small />
              </div>
            </div>
          ))}
        </Panel>
      </div>

      {/* Active events table */}
      <Panel
        title="⚠ Active Security Events — Action Required"
        accent="var(--critical)"
        action={
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {unresolved.length} pending
          </span>
        }
      >
        {unresolved.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--success)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>All clear — No active threats</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Great work! All events have been handled.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-dim)' }}>
                  {['ID', 'What Happened', 'Zone', 'Severity', 'When', 'What It Means', 'Action'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.14em', fontFamily: 'var(--font-mono)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {unresolved.map(e => (
                  <tr key={e.id}
                    style={{ borderBottom: '1px solid rgba(30,53,80,0.4)', transition: 'background 0.15s' }}
                    onMouseEnter={ev => ev.currentTarget.style.background = 'var(--bg-raised)'}
                    onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 12px', fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{e.id}</td>
                    <td style={{ padding: '12px 12px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{e.label}</td>
                    <td style={{ padding: '12px 12px' }}>
                      <span style={{ fontSize: 12, color: 'var(--teal-bright)', fontFamily: 'var(--font-mono)' }}>{e.zone}</span>
                    </td>
                    <td style={{ padding: '12px 12px' }}><SeverityBadge severity={e.severity} small /></td>
                    <td style={{ padding: '12px 12px', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{e.timestamp}</td>
                    <td style={{ padding: '12px 12px', fontSize: 12, color: 'var(--text-secondary)', maxWidth: 220 }}>{e.detail}</td>
                    <td style={{ padding: '12px 12px' }}>
                      <Button variant="primary" size="sm" onClick={() => handleResolve(e)}>
                        Mark Handled
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
