import { useRef, useCallback, useEffect, useState } from 'react';
import { useStore } from '../../store';

const ACTOR_COLORS = { DRISHTI: '#3ecf8e', KAVACH: '#6384BE', BRIDGE: '#a78bfa', CANARY: '#f59e0b', SYSTEM: '#6b7280' };
const SEV_COLORS   = { CRITICAL: '#ef4444', HIGH: '#f59e0b', MEDIUM: '#6384BE', INFO: '#6b7280' };

const EXPECTED_STEPS = [
  { actor: 'SYSTEM',  plain: 'Initialise models and clear previous data' },
  { actor: 'DRISHTI', plain: 'Detect new SSL certificate on fake domain' },
  { actor: 'DRISHTI', plain: 'Score domain similarity vs mcd.delhi.gov.in' },
  { actor: 'DRISHTI', plain: 'Headless browser captures fake site screenshot' },
  { actor: 'DRISHTI', plain: 'Visual phishing analysis: Aadhaar form detected' },
  { actor: 'CANARY',  plain: 'Canary credential injected into fake site' },
  { actor: 'KAVACH',  plain: 'Cluster incoming citizen phishing reports' },
  { actor: 'KAVACH',  plain: '5 reports joined same phishing campaign' },
  { actor: 'KAVACH',  plain: 'Login spike: 580 failed logins detected' },
  { actor: 'KAVACH',  plain: 'Foreign IPs blocked — credential stuffing' },
  { actor: 'KAVACH',  plain: 'Off-hours admin login flagged' },
  { actor: 'CANARY',  plain: 'Canary credential stolen — forensic proof' },
  { actor: 'BRIDGE',  plain: 'Correlating external attack to internal breach' },
  { actor: 'BRIDGE',  plain: 'Unified attack narrative confirmed' },
  { actor: 'SYSTEM',  plain: 'CERT-In takedown request auto-generated' },
];

export default function SimulationPage() {
  const { simActive, simLog, startSimulation, addSimStep, endSimulation, setActiveModule } = useStore();
  const pollRef    = useRef(null);
  const [seenCount, setSeenCount] = useState(0);

  // Poll /api/sim-log when simulation is running
  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch('http://127.0.0.1:8000/api/sim-log');
        const data = await res.json();
        const steps = data.steps || [];
        const state = data.state || {};

        // Push any new steps that arrived since last poll
        setSeenCount(prev => {
          const newSteps = steps.slice(prev);
          newSteps.forEach(step => addSimStep(step));
          return steps.length;
        });

        // Stop polling when backend says done
        if (state.done && !state.running) {
          clearInterval(pollRef.current);
          pollRef.current = null;
          endSimulation();
        }
      } catch {
        // backend not ready yet — keep polling
      }
    }, 800);
  }, [addSimStep, endSimulation]);

  const runSim = useCallback(() => {
    if (simActive) return;
    setSeenCount(0);
    startSimulation();

    fetch('http://127.0.0.1:8000/api/simulate', { method: 'POST' })
      .then(() => startPolling())
      .catch(err => {
        console.error('Backend offline:', err);
        endSimulation();
      });
  }, [simActive, startSimulation, startPolling, endSimulation]);

  // Cleanup on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const progress = EXPECTED_STEPS.length > 0 ? Math.min(100, Math.round((simLog.length / EXPECTED_STEPS.length) * 100)) : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>Attack Simulation</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 480 }}>
            Watch a real cyberattack unfold — every step driven by live Python model output.
          </p>
        </div>
        <button onClick={runSim} disabled={simActive} style={{
          padding: '9px 20px', borderRadius: 8,
          background: simActive ? 'var(--bg-raised)' : 'var(--accent)',
          border: simActive ? '1px solid var(--border-dim)' : 'none',
          color: simActive ? 'var(--text-muted)' : '#0f0f0f',
          fontSize: 13, fontWeight: 700, cursor: simActive ? 'not-allowed' : 'pointer',
          opacity: simActive ? 0.6 : 1, transition: 'all 0.15s',
        }}>
          {simActive ? '⚙ Running…' : simLog.length > 0 ? '↺ Replay' : '▶ Run Simulation'}
        </button>
      </div>

      {(simActive || simLog.length > 0) && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Live Progress
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: simActive ? 'var(--high)' : 'var(--success)' }}>
              {simActive ? `${simLog.length} steps completed — waiting for backend…` : `${simLog.length} steps · Done ✓`}
            </span>
          </div>
          <div style={{ height: 3, background: 'var(--bg-raised)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: simActive ? 'var(--accent)' : 'var(--success)', borderRadius: 2, transition: 'width 0.5s ease' }} />
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 24 }}>
        {/* Live log */}
        <div>
          {simLog.length === 0 && !simActive && (
            <div className="card" style={{ padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.15 }}>▶</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Ready to Run</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 300, margin: '0 auto', lineHeight: 1.6 }}>
                Press "Run Simulation" — every event you see below will be emitted by the real Python AI models as they execute.
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 560, overflowY: 'auto' }}>
            {simLog.map((step, i) => (
              <div key={i} className="fade-in card" style={{ padding: '16px 18px', borderLeft: `3px solid ${ACTOR_COLORS[step.actor] || 'var(--border-dim)'}` }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: ACTOR_COLORS[step.actor], textTransform: 'uppercase' }}>{step.actor}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{step.ts}</span>
                  <span style={{
                    fontSize: 10, padding: '1px 7px', borderRadius: 20,
                    background: (SEV_COLORS[step.severity] || '#6b7280') + '15',
                    color: SEV_COLORS[step.severity] || '#6b7280',
                    border: `1px solid ${(SEV_COLORS[step.severity] || '#6b7280')}30`,
                    fontWeight: 700,
                  }}>{step.severity}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, fontFamily: 'var(--font-mono)', marginBottom: 10 }}>{step.msg}</div>
                <div style={{ padding: '9px 12px', borderRadius: 6, background: 'var(--bg-raised)', border: '1px solid var(--border-dim)' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Plain English: </span>
                  <span style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.6 }}>{step.plain}</span>
                </div>
              </div>
            ))}
            {simActive && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 4px', color: 'var(--text-dim)', fontSize: 12 }}>
                <span style={{ animation: 'blink 0.8s ease infinite', fontFamily: 'var(--font-mono)' }}>█</span>
                Backend executing — next step arriving live…
              </div>
            )}
          </div>
        </div>

        {/* Step tracker sidebar */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>Pipeline Steps</div>
          {EXPECTED_STEPS.map((step, i) => {
            const done   = simLog.length > i;
            const active = simActive && simLog.length === i;
            return (
<<<<<<< HEAD
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 12, opacity: done ? 1 : active ? 0.8 : 0.2, transition: 'opacity 0.5s' }}>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                  border: `1.5px solid ${ACTOR_COLORS[step.actor]}`,
                  background: done ? ACTOR_COLORS[step.actor] : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, color: done ? '#0f0f0f' : 'transparent', fontWeight: 800, marginTop: 1,
                  animation: active ? 'pulse-dot 1s ease infinite' : 'none',
                }}>✓</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: ACTOR_COLORS[step.actor], letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 1 }}>{step.actor}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{step.plain.slice(0, 52)}…</div>
=======
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 12, opacity: done ? 1 : active ? 0.9 : 0.55, transition: 'opacity 0.5s' }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, border: `1.5px solid ${ACTOR_COLORS[step.actor]}`, background: done ? ACTOR_COLORS[step.actor] : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: done ? '#0f0f0f' : 'transparent', fontWeight: 800, marginTop: 1, animation: active ? 'pulse-dot 1s ease infinite' : 'none' }}>✓</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: ACTOR_COLORS[step.actor], letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 1 }}>{step.actor}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{step.plain.slice(0, 50)}…</div>
>>>>>>> e338343057573b469b9d0682195b14e497d6d7a7
                </div>
              </div>
            );
          })}

          {/* Legend */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-dim)' }}>
            {[
              { actor: 'DRISHTI', color: '#3ecf8e', desc: 'External detection' },
              { actor: 'KAVACH',  color: '#6384BE', desc: 'Internal defense' },
              { actor: 'BRIDGE',  color: '#a78bfa', desc: 'Correlation' },
              { actor: 'CANARY',  color: '#f59e0b', desc: 'Forensic proof' },
              { actor: 'SYSTEM',  color: '#6b7280', desc: 'Auto-response' },
            ].map(m => (
              <div key={m.actor} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: 2, background: m.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: m.color, width: 56 }}>{m.actor}</span>
                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{m.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
