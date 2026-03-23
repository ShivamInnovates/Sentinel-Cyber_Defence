import { useRef, useCallback } from 'react';
import { useStore } from '../../store';
import { Button } from '../../components/ui';
import { SIM_STEPS } from '../../services/mockApi';

const ACTOR_COLORS = { DRISHTI: '#6384BE', KAVACH: '#16A34A', BRIDGE: '#7C3AED', CANARY: '#D97706', SYSTEM: '#9CA3AF' };
const SEV_COLORS   = { CRITICAL: '#DC2626', HIGH: '#D97706', MEDIUM: '#6384BE', INFO: '#9CA3AF' };
const SEV_BG       = { CRITICAL: '#FEF2F2', HIGH: '#FFFBEB', MEDIUM: '#EFF4FF', INFO: '#F9FAFB' };
const SEV_BORDER   = { CRITICAL: '#FECACA', HIGH: '#FDE68A', MEDIUM: '#BFCFEA', INFO: '#E5E7EB' };

export default function SimulationPage() {
  const { simActive, simLog, startSimulation, addSimStep, endSimulation } = useStore();
  const timeouts = useRef([]);

  const runSim = useCallback(() => {
    if (simActive) return;
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
    startSimulation();
    SIM_STEPS.forEach((step, idx) => {
      const id = setTimeout(() => {
        addSimStep(step);
        if (idx === SIM_STEPS.length - 1) setTimeout(() => endSimulation(), 1500);
      }, step.ms);
      timeouts.current.push(id);
    });
  }, [simActive]);

  const progress = SIM_STEPS.length > 0 ? Math.round((simLog.length / SIM_STEPS.length) * 100) : 0;

  return (
    <div>
      {/* PAGE HEADER */}
      <div style={{ marginBottom: 40, paddingBottom: 32, borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#111827', letterSpacing: '-0.03em', marginBottom: 8 }}>Attack Simulation</h1>
          <p style={{ fontSize: 16, color: '#6B7280', lineHeight: 1.6, maxWidth: 560 }}>
            Watch a real cyberattack unfold step by step — from fake website creation to internal breach. Designed for everyone, not just IT professionals.
          </p>
        </div>
        <Button variant={simActive ? 'ghost' : 'warning'} size="md" disabled={simActive} onClick={runSim} icon={simActive ? null : '▶'}>
          {simActive ? 'Simulation Running…' : simLog.length > 0 ? 'Replay Simulation' : 'Run Simulation'}
        </Button>
      </div>

      {/* HOW IT WORKS */}
      <div style={{ padding: '16px 20px', background: '#F9FAFB', borderRadius: 10, borderLeft: '3px solid #E5E7EB', marginBottom: 36, fontSize: 14, color: '#6B7280', lineHeight: 1.7 }}>
        🎬 <strong style={{ color: '#374151' }}>What this shows:</strong> A criminal creates a fake MCD website → citizens enter their login details → the criminal uses those stolen details to break into the real MCD system. Watch how SENTINEL detects and responds at every stage with plain-English explanations.
      </div>

      {/* PROGRESS BAR */}
      {(simActive || simLog.length > 0) && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Timeline Progress</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: simActive ? '#D97706' : '#16A34A' }}>
              {simActive ? `${progress}% — Running…` : '100% — Complete ✓'}
            </span>
          </div>
          <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: simActive ? 'linear-gradient(90deg, #6384BE, #D97706)' : '#16A34A', borderRadius: 2, transition: 'width 0.5s ease' }} />
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 48 }}>
        {/* MAIN LOG */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em', marginBottom: 20 }}>Live Attack Timeline</h2>

          {simLog.length === 0 && !simActive && (
            <div style={{ textAlign: 'center', padding: '72px 24px', borderTop: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 52, marginBottom: 16, opacity: 0.2 }}>▶</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Ready to Run</div>
              <div style={{ fontSize: 14, color: '#9CA3AF', maxWidth: 340, margin: '0 auto', lineHeight: 1.7 }}>
                Press "Run Simulation" above to watch a phishing attack unfold. Each event is explained in plain English as it happens.
              </div>
            </div>
          )}

          <div style={{ maxHeight: 600, overflowY: 'auto' }}>
            {simLog.map((step, i) => (
              <div key={i} className="fade-in" style={{ padding: '18px 20px', marginBottom: 10, borderRadius: 10, background: SEV_BG[step.severity] || '#F9FAFB', border: `1px solid ${SEV_BORDER[step.severity] || '#E5E7EB'}`, borderLeft: `3px solid ${ACTOR_COLORS[step.actor] || '#E5E7EB'}` }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: ACTOR_COLORS[step.actor], textTransform: 'uppercase' }}>{step.actor}</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'IBM Plex Mono, monospace' }}>{step.ts}</span>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'white', color: SEV_COLORS[step.severity], border: `1px solid ${SEV_BORDER[step.severity]}`, fontWeight: 700 }}>{step.severity}</span>
                </div>
                <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.6, fontFamily: 'IBM Plex Mono, monospace', marginBottom: 12 }}>{step.msg}</div>
                <div style={{ padding: '11px 14px', borderRadius: 8, background: 'white', border: '1px solid #E5E7EB' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Plain English: </span>
                  <span style={{ fontSize: 13, color: '#111827', lineHeight: 1.6 }}>{step.plain}</span>
                </div>
              </div>
            ))}
            {simActive && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '12px 4px', color: '#9CA3AF', fontSize: 13 }}>
                <span style={{ animation: 'blink 0.8s ease infinite', fontFamily: 'IBM Plex Mono, monospace' }}>█</span>
                <span>Processing next event…</span>
              </div>
            )}
          </div>
        </div>

        {/* STEP TRACKER */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em', marginBottom: 18 }}>Step Tracker</h2>
          {SIM_STEPS.map((step, i) => {
            const done   = simLog.length > i;
            const active = simActive && simLog.length === i + 1;
            return (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14, opacity: done ? 1 : active ? 0.8 : 0.22, transition: 'opacity 0.5s ease' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, border: `1.5px solid ${ACTOR_COLORS[step.actor]}`, background: done ? ACTOR_COLORS[step.actor] : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: done ? 'white' : 'transparent', fontWeight: 800, marginTop: 1, animation: active ? 'pulse-dot 1s ease infinite' : 'none' }}>✓</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: ACTOR_COLORS[step.actor], letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>{step.actor}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.4 }}>{step.plain.slice(0, 55)}…</div>
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Module Key</div>
            {[
              { actor: 'DRISHTI', color: '#6384BE', desc: 'External detection' },
              { actor: 'KAVACH',  color: '#16A34A', desc: 'Internal defense' },
              { actor: 'BRIDGE',  color: '#7C3AED', desc: 'Correlation engine' },
              { actor: 'CANARY',  color: '#D97706', desc: 'Forensic proof' },
              { actor: 'SYSTEM',  color: '#9CA3AF', desc: 'Auto-response' },
            ].map(m => (
              <div key={m.actor} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: m.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: m.color, width: 64 }}>{m.actor}</span>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>{m.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}