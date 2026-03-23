import { SeverityBadge } from '../../components/ui';

const RULES = [
  { id: 'R001', name: 'Failed Login Spike',     condition: 'More than 10 failed logins in 5 minutes',    why: 'Attackers try many passwords quickly when using stolen credential lists.',             triggers: 34, sev: 'CRITICAL' },
  { id: 'R002', name: 'Off-Hours Admin Access', condition: 'Admin login outside 9 AM – 7 PM',            why: 'Real staff work during business hours. A 3 AM login is almost always suspicious.',    triggers: 12, sev: 'HIGH'     },
  { id: 'R003', name: 'Port Scanning',          condition: '100+ ports probed in under 60 seconds',      why: 'Scanning ports is how attackers map a network before breaking in.',                   triggers: 8,  sev: 'HIGH'     },
  { id: 'R004', name: 'Large Data Export',      condition: 'More than 500MB transferred in one session', why: "Legitimate work rarely involves huge file transfers. This catches data theft.",       triggers: 3,  sev: 'MEDIUM'   },
  { id: 'R005', name: 'Foreign IP Access',      condition: 'Connection attempt from non-Indian IP',      why: 'All MCD staff work from India. A foreign IP means an outsider is trying to get in.', triggers: 19, sev: 'CRITICAL' },
  { id: 'R006', name: 'Privilege Escalation',   condition: 'User gains admin rights without approval',   why: 'Attackers often try to gain admin access after their initial entry.',                  triggers: 2,  sev: 'HIGH'     },
];

const SEV_C = { CRITICAL: '#DC2626', HIGH: '#D97706', MEDIUM: '#6384BE' };

export default function DetectionRules() {
  return (
    <div>
      <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #E5E7EB' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', marginBottom: 6 }}>
          Detection Rules
        </h1>
        <p style={{ fontSize: 15, color: '#6B7280' }}>
          The rules that tell KAVACH what to look for — and why each one matters.
        </p>
      </div>

      <div style={{ padding: '14px 18px', background: '#F9FAFB', borderRadius: 10, borderLeft: '3px solid #E5E7EB', marginBottom: 28, fontSize: 13, color: '#6B7280', lineHeight: 1.7 }}>
        KAVACH checks every computer action against these rules automatically. When a rule triggers, an alert is raised immediately with a plain-English explanation.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #E5E7EB' }}>
        {[
          { label: 'Active Rules',      value: RULES.length,                               color: '#16A34A' },
          { label: 'Triggers Today',    value: RULES.reduce((a, r) => a + r.triggers, 0), color: '#DC2626' },
          { label: 'Checks Per Minute', value: '12,400',                                   color: '#6384BE' },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: '0 32px 0 0', borderRight: i < 2 ? '1px solid #E5E7EB' : 'none' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color, letterSpacing: '-0.03em', marginBottom: 6 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {RULES.map((r, i) => (
        <div key={r.id} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '18px 0', borderBottom: i < RULES.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
          <div style={{ width: 3, height: 52, borderRadius: 2, background: SEV_C[r.sev], flexShrink: 0, marginTop: 3 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{r.name}</div>
            <div style={{ fontSize: 12, color: '#6384BE', fontFamily: 'IBM Plex Mono, monospace', marginBottom: 5 }}>Triggers when: {r.condition}</div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>{r.why}</div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: SEV_C[r.sev], letterSpacing: '-0.02em' }}>{r.triggers}</div>
            <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 6 }}>triggers today</div>
            <SeverityBadge severity={r.sev} small />
          </div>
        </div>
      ))}
    </div>
  );
}