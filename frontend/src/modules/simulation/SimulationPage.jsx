import { useRef, useCallback } from 'react';
import { useStore } from '../../store';
import { Panel, Button, ModuleHeader, StatusDot } from '../../components/ui';
import { SIM_STEPS } from '../../services/mockApi';

const ACTOR_COLORS = {
  DRISHTI: 'var(--medium)',
  KAVACH:  'var(--teal-bright)',
  BRIDGE:  'var(--mauve-bright)',
  CANARY:  'var(--high)',
  SYSTEM:  'var(--text-muted)',
};

const SEV_COLORS = {
  CRITICAL: 'var(--critical)',
  HIGH:     'var(--high)',
  MEDIUM:   'var(--medium)',
  INFO:     'var(--info)',
};

export default function SimulationPage() {
  const { simActive, simLog, simStep, startSimulation, addSimStep, endSimulation } = useStore();
  const timeoutsRef = useRef([]);

  const runSim = useCallback(() => {
    if (simActive) return;

    // clear old timeouts
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    startSimulation();

    SIM_STEPS.forEach((step, idx) => {
      const id = setTimeout(() => {
        addSimStep(step);
        if (idx === SIM_STEPS.length - 1) {
          setTimeout(() => endSimulation(), 1500);
        }
      }, step.ms);
      timeoutsRef.current.push(id);
    });
  }, [simActive]);

  const progress = SIM_STEPS.length > 0 ? Math.round((simLog.length / SIM_STEPS.length) * 100) : 0;

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
      <ModuleHeader
        icon="▶"
        name="Attack Simulation"
        subtitle="Watch a real cyberattack unfold step-by-step — designed for non-technical staff"
        color="var(--high)"
      >
        <Button
          variant={simActive ? 'ghost' : 'warning'}
          size="md"
          disabled={simActive}
          onClick={runSim}
          icon={simActive ? null : '▶'}
        >
          {simActive ? 'Simulation Running…' : simLog.length > 0 ? 'Replay Simulation' : 'Run Simulation'}
        </Button>
      </ModuleHeader>

      {/* What is this? */}
      <div data-aos="fade-up" className="card" style={{
        padding: '18px 22px', marginBottom: 20,
        borderLeft: '3px solid var(--high)',
        background: 'rgba(251,146,60,0.04)',
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: 6 }}>
          What does this show?
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          This simulation plays back a <strong style={{ color: 'var(--text-primary)' }}>real attack scenario</strong>:
          a criminal creates a fake MCD website, steals citizen credentials, and tries to break into the real MCD system.
          Watch how SENTINEL detects and responds at every stage — step by step.
          Each step includes a plain-English explanation of what is happening.
        </div>
      </div>

      {/* Progress bar (when active) */}
      {(simActive || simLog.length > 0) && (
        <div data-aos="fade-up" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
              ATTACK TIMELINE PROGRESS
            </span>
            <span style={{ fontSize: 11, color: simActive ? 'var(--high)' : 'var(--success)', fontFamily: 'var(--font-mono)' }}>
              {simActive ? `${progress}% — Running...` : '100% — Complete'}
            </span>
          </div>
          <div style={{ height: 6, background: 'var(--bg-raised)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              background: simActive
                ? 'linear-gradient(90deg, var(--medium), var(--high))'
                : 'var(--success)',
              borderRadius: 3, transition: 'width 0.5s ease',
              boxShadow: simActive ? '0 0 10px rgba(251,146,60,0.4)' : 'none',
            }} />
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14 }}>
        {/* Main log */}
        <Panel title="// SENTINEL — LIVE ATTACK TIMELINE" accent="var(--teal-bright)">
          {simLog.length === 0 && !simActive && (
            <div style={{ textAlign: 'center', padding: '60px 24px' }}>
              <div style={{ fontSize: 52, marginBottom: 16, opacity: 0.3 }}>▶</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-secondary)', marginBottom: 8 }}>
                Ready to Run
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 360, margin: '0 auto', lineHeight: 1.7 }}>
                Press "Run Simulation" above to watch a phishing attack unfold in real-time.
                Each event is explained in plain English.
              </div>
            </div>
          )}

          <div style={{ maxHeight: 520, overflowY: 'auto' }}>
            {simLog.map((step, i) => (
              <div
                key={i}
                className="fade-in"
                style={{
                  padding: '14px 16px',
                  marginBottom: 8,
                  borderRadius: 10,
                  background: 'var(--bg-raised)',
                  borderLeft: `3px solid ${ACTOR_COLORS[step.actor] || 'var(--border-mid)'}`,
                  opacity: simActive && i === simLog.length - 1 ? 1 : 0.88,
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
                    color: ACTOR_COLORS[step.actor], fontFamily: 'var(--font-mono)',
                  }}>{step.actor}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{step.ts}</span>
                  <span style={{
                    fontSize: 10, padding: '2px 7px', borderRadius: 4,
                    background: `${SEV_COLORS[step.severity]}18`,
                    color: SEV_COLORS[step.severity],
                    fontFamily: 'var(--font-mono)', fontWeight: 700,
                  }}>{step.severity}</span>
                </div>

                {/* Technical message */}
                <div style={{
                  fontSize: 13,
                  color: step.severity === 'CRITICAL' ? 'var(--critical)' : 'var(--text-secondary)',
                  lineHeight: 1.5, fontFamily: 'var(--font-mono)',
                  marginBottom: 10,
                }}>
                  {step.msg}
                </div>

                {/* Plain English */}
                <div style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  lineHeight: 1.6,
                  padding: '8px 10px',
                  background: 'var(--bg-card)',
                  borderRadius: 6,
                  borderLeft: '2px solid var(--border-mid)',
                }}>
                  <span style={{ color: 'var(--teal-dim)', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em' }}>
                    PLAIN ENGLISH:{' '}
                  </span>
                  {step.plain}
                </div>
              </div>
            ))}

            {/* Blinking cursor when active */}
            {simActive && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '8px 16px', color: 'var(--teal-bright)', fontSize: 13 }}>
                <span style={{ animation: 'blink 0.8s ease infinite', fontFamily: 'var(--font-mono)' }}>█</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>Processing next event…</span>
              </div>
            )}
          </div>
        </Panel>

        {/* Right: step tracker */}
        <div>
          <Panel title="STEP TRACKER" accent="var(--mauve-bright)" style={{ marginBottom: 14 }}>
            {SIM_STEPS.map((step, i) => {
              const done = simLog.length > i;
              const active = simActive && simLog.length === i + 1;
              return (
                <div key={i} style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  marginBottom: 12,
                  opacity: done ? 1 : active ? 0.8 : 0.25,
                  transition: 'opacity 0.5s ease',
                }}>
                  {/* Step indicator */}
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    border: `1.5px solid ${ACTOR_COLORS[step.actor]}`,
                    background: done ? ACTOR_COLORS[step.actor] : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, color: done ? 'var(--bg-deep)' : 'transparent',
                    fontWeight: 800, marginTop: 1,
                    animation: active ? 'pulse-dot 1s ease infinite' : 'none',
                  }}>✓</div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: ACTOR_COLORS[step.actor], letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
                      {step.actor}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {step.plain.slice(0, 60)}…
                    </div>
                  </div>
                </div>
              );
            })}
          </Panel>

          {/* Legend */}
          <Panel title="MODULE KEY" accent="var(--text-dim)">
            {[
              { actor: 'DRISHTI', color: 'var(--medium)', desc: 'External detection' },
              { actor: 'KAVACH',  color: 'var(--teal-bright)', desc: 'Internal defense' },
              { actor: 'BRIDGE',  color: 'var(--mauve-bright)', desc: 'Correlation engine' },
              { actor: 'CANARY',  color: 'var(--high)', desc: 'Forensic proof' },
              { actor: 'SYSTEM',  color: 'var(--text-muted)', desc: 'Auto-response' },
            ].map(m => (
              <div key={m.actor} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: m.color, fontFamily: 'var(--font-mono)', fontWeight: 600, width: 58 }}>{m.actor}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.desc}</span>
              </div>
            ))}
          </Panel>
        </div>
      </div>
    </div>
  );
}
