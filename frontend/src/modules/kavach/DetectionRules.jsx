const RULES = [
  { id: 'R001', name: 'Failed Login Spike',     condition: 'More than 10 failed logins in 5 minutes',    why: 'Catches attackers using stolen credential lists.',                    triggers: 34, sev: 'CRITICAL' },
  { id: 'R002', name: 'Off-Hours Admin Access', condition: 'Admin login outside 9 AM – 7 PM',            why: 'A 3 AM login is almost always suspicious.',                           triggers: 12, sev: 'HIGH'     },
  { id: 'R003', name: 'Port Scanning',          condition: '100+ ports probed in under 60 seconds',      why: 'Attackers scan ports to map a network before breaking in.',            triggers: 8,  sev: 'HIGH'     },
  { id: 'R004', name: 'Large Data Export',      condition: 'More than 500MB transferred in one session', why: 'Legitimate work rarely involves huge file transfers.',                 triggers: 3,  sev: 'MEDIUM'   },
  { id: 'R005', name: 'Foreign IP Access',      condition: 'Connection attempt from non-Indian IP',      why: 'All MCD staff work from India. Foreign IP = outsider.',               triggers: 19, sev: 'CRITICAL' },
  { id: 'R006', name: 'Privilege Escalation',   condition: 'User gains admin rights without approval',   why: 'Attackers often escalate privileges after initial entry.',             triggers: 2,  sev: 'HIGH'     },
];

const SEV_C = { CRITICAL: 'var(--critical)', HIGH: 'var(--high)', MEDIUM: 'var(--medium)' };

export default function DetectionRules() {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>Detection Rules</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>The rules that tell KAVACH what to look for — and why each one matters.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Active Rules',      value: RULES.length,                               color: 'var(--success)' },
          { label: 'Triggers Today',    value: RULES.reduce((a, r) => a + r.triggers, 0), color: 'var(--critical)' },
          { label: 'Checks Per Minute', value: '12,400',                                   color: 'var(--medium)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: '-0.03em', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {RULES.map((r, i) => (
          <div key={r.id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '16px 20px', borderBottom: i < RULES.length - 1 ? '1px solid var(--border-dim)' : 'none' }}>
            <div style={{ width: 3, height: 44, borderRadius: 2, background: SEV_C[r.sev], flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{r.name}</div>
              <div style={{ fontSize: 11, color: 'var(--medium)', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>Triggers when: {r.condition}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.why}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: SEV_C[r.sev], letterSpacing: '-0.02em' }}>{r.triggers}</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>today</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
