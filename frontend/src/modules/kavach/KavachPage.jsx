import Swal from 'sweetalert2';
import { useStore } from '../../store';
import { SeverityBadge, Button } from '../../components/ui';
import { ZONES } from '../../utils/constants';

export default function KavachPage() {
  const { events, resolvEvent, zoneActivity } = useStore();
  const unresolved = events.filter(e => !e.resolved);
  const resolved   = events.filter(e => e.resolved);

  const handleResolve = (event) => {
    Swal.fire({
      title: 'Mark as Handled?',
      html: `<p style="color:#6B7280;font-size:14px;margin-bottom:10px">Confirm this threat has been investigated:</p><div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:12px;margin-bottom:10px"><div style="color:#111827;font-size:14px;font-weight:600;margin-bottom:4px">${event.label}</div><div style="color:#9CA3AF;font-size:12px">${event.zone} Zone · ${event.timestamp}</div></div><p style="color:#9CA3AF;font-size:12px">${event.detail}</p>`,
      icon: 'question', showCancelButton: true,
      confirmButtonText: 'Yes, Mark as Handled', cancelButtonText: 'Not Yet',
      background: '#FFFFFF', color: '#111827',
      confirmButtonColor: '#6384BE', cancelButtonColor: '#F3F4F6',
    }).then(r => {
      if (r.isConfirmed) {
        resolvEvent(event.id);
        Swal.fire({ title: 'Event Resolved', text: 'Marked as handled and removed from the active queue.', icon: 'success', background: '#FFFFFF', confirmButtonColor: '#6384BE', timer: 2000, timerProgressBar: true });
      }
    });
  };

  const SEV_C = { CRITICAL: '#DC2626', HIGH: '#D97706', MEDIUM: '#6384BE', LOW: '#9CA3AF' };

  const RULES = [
    { name: 'Failed Login Spike',     rule: 'More than 10 failed logins in 5 minutes',   detail: 'Catches attackers using stolen passwords to break in.',                           triggers: 34, sev: 'CRITICAL' },
    { name: 'Off-Hours Admin Access', rule: 'Admin login outside 9 AM – 7 PM',           detail: 'Legitimate staff rarely log in at 3 AM — flags suspicious after-hours access.',   triggers: 12, sev: 'HIGH'     },
    { name: 'Port Scanning',          rule: '100+ network ports probed in 60 seconds',   detail: 'Attackers scan ports to find weaknesses before breaking in.',                      triggers: 8,  sev: 'HIGH'     },
    { name: 'Large Data Export',      rule: '500MB+ transferred in one session',          detail: 'Normal work doesn\'t move huge files — catches data theft attempts.',            triggers: 3,  sev: 'MEDIUM'   },
    { name: 'Foreign IP Access',      rule: 'Connection from a non-Indian IP address',   detail: 'MCD staff work from India. Any foreign IP on internal systems is suspicious.',    triggers: 19, sev: 'CRITICAL' },
  ];

  return (
    <div>
      {/* PAGE HEADER */}
      <div style={{ marginBottom: 40, paddingBottom: 32, borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#111827', letterSpacing: '-0.03em', marginBottom: 8 }}>KAVACH</h1>
          <p style={{ fontSize: 16, color: '#6B7280', lineHeight: 1.6, maxWidth: 560 }}>
            Internal network defense — watches all 2,400 MCD computers across 12 Delhi zones for suspicious activity, unusual logins, and data theft attempts.
          </p>
        </div>
        <Button variant="ghost" size="sm">↻ Refresh</Button>
      </div>

      {/* HOW IT WORKS */}
      <div style={{ padding: '16px 20px', background: '#F9FAFB', borderRadius: 10, borderLeft: '3px solid #E5E7EB', marginBottom: 36, fontSize: 14, color: '#6B7280', lineHeight: 1.7 }}>
        💡 <strong style={{ color: '#374151' }}>How KAVACH works:</strong> Every login, file transfer, and network connection is compared against normal patterns. If something is unusual — a login at 3 AM, 47 failed attempts in 90 seconds — KAVACH raises an alert with a plain-English explanation.
      </div>

      {/* STATS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 40, paddingBottom: 32, borderBottom: '1px solid #E5E7EB' }}>
        {[
          { label: 'Active Threats',    value: unresolved.length, color: '#DC2626', sub: 'Needs attention now' },
          { label: 'Resolved Today',    value: resolved.length,   color: '#16A34A', sub: 'Handled by the team' },
          { label: 'Zones Monitored',   value: 12,                 color: '#6384BE', sub: 'All currently online' },
          { label: 'Computers Covered', value: '2,400',            color: '#374151', sub: 'Real-time monitoring' },
        ].map((s, i) => (
          <div key={s.label} data-aos="fade-up" style={{ padding: '0 32px 0 0', borderRight: i < 3 ? '1px solid #E5E7EB' : 'none' }}>
            <div style={{ fontSize: 40, fontWeight: 800, color: s.color, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 8 }}>{s.value}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ZONE HEATMAP + DETECTION RULES */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 48, marginBottom: 40, paddingBottom: 32, borderBottom: '1px solid #E5E7EB' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em', marginBottom: 6 }}>12-Zone Status</h2>
          <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>Real-time threat status per zone</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {ZONES.map(z => {
              const count = unresolved.filter(e => e.zone === z.name).length;
              const color  = count === 0 ? '#16A34A' : count === 1 ? '#6384BE' : count === 2 ? '#D97706' : '#DC2626';
              const bg     = count === 0 ? '#F0FDF4' : count === 1 ? '#EFF4FF' : count === 2 ? '#FFFBEB' : '#FEF2F2';
              const border = count === 0 ? '#BBF7D0' : count === 1 ? '#BFCFEA' : count === 2 ? '#FDE68A' : '#FECACA';
              return (
                <div key={z.id} style={{ padding: '9px 6px', borderRadius: 8, textAlign: 'center', background: bg, border: `1px solid ${border}`, transition: 'all 0.2s' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: '0.04em' }}>{z.id}</div>
                  <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 1 }}>{z.name}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color, marginTop: 3 }}>{count === 0 ? '✓' : count}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            {[{ l: 'Clear', c: '#16A34A' }, { l: 'Watch', c: '#6384BE' }, { l: 'Alert', c: '#D97706' }, { l: 'Critical', c: '#DC2626' }].map(l => (
              <div key={l.l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 7, height: 7, borderRadius: 2, background: l.c }} />
                <span style={{ fontSize: 10, color: '#9CA3AF' }}>{l.l}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em', marginBottom: 6 }}>Detection Rules</h2>
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Each rule catches a specific type of attack — automatically, 24/7</p>
          {RULES.map((r, i) => (
            <div key={r.name} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '14px 0', borderBottom: i < RULES.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
              <div style={{ width: 3, height: 50, borderRadius: 2, background: SEV_C[r.sev], flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 3 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: '#6384BE', fontFamily: 'IBM Plex Mono, monospace', marginBottom: 4 }}>Rule: {r.rule}</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{r.detail}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: SEV_C[r.sev], letterSpacing: '-0.02em' }}>{r.triggers}</div>
                <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 4 }}>triggers today</div>
                <SeverityBadge severity={r.sev} small />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ACTIVE EVENTS TABLE */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em', marginBottom: 4 }}>Active Security Events</h2>
            <p style={{ fontSize: 13, color: '#6B7280' }}>Review each event and mark as handled once resolved</p>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: unresolved.length > 0 ? '#DC2626' : '#16A34A' }}>{unresolved.length} pending</span>
        </div>

        {unresolved.length === 0
          ? <div style={{ textAlign: 'center', padding: '48px 0', borderTop: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#16A34A', marginBottom: 4 }}>All clear</div>
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>No active threats — all events have been resolved.</div>
            </div>
          : <table className="data-table">
              <thead>
                <tr>{['ID', 'What Happened', 'Zone', 'Severity', 'When', 'What It Means', 'Action'].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {unresolved.map(e => (
                  <tr key={e.id}>
                    <td style={{ color: '#9CA3AF', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>{e.id}</td>
                    <td style={{ fontWeight: 600, color: '#111827' }}>{e.label}</td>
                    <td><span style={{ fontSize: 12, color: '#6384BE', fontWeight: 600 }}>{e.zone}</span></td>
                    <td><SeverityBadge severity={e.severity} small /></td>
                    <td style={{ color: '#9CA3AF', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, whiteSpace: 'nowrap' }}>{e.timestamp}</td>
                    <td style={{ fontSize: 13, color: '#6B7280', maxWidth: 220 }}>{e.detail}</td>
                    <td><Button variant="accent" size="sm" onClick={() => handleResolve(e)}>Mark Handled</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>
    </div>
  );
}