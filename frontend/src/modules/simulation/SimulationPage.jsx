// SimulationPage.jsx — Fixed: merge conflict markers removed, polls real backend
import { useRef, useCallback, useEffect, useState } from 'react';
import { useStore, API_BASE, API_KEY } from '../../store';
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';

const ACTOR_COLORS = {
  DRISHTI: '#3ecf8e',
  KAVACH: '#6384BE',
  BRIDGE: '#a78bfa',
  CANARY: '#f59e0b',
  SYSTEM: '#6b7280',
};

const SEV_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f59e0b',
  MEDIUM: '#6384BE',
  INFO: '#6b7280',
};

const EXPECTED_STEPS = [
  { actor: 'SYSTEM', plain: 'Initialise models and clear previous data' },
  { actor: 'DRISHTI', plain: 'Detect new SSL certificate on fake domain' },
  { actor: 'DRISHTI', plain: 'Score domain similarity vs mcd.delhi.gov.in' },
  { actor: 'DRISHTI', plain: 'HTML analysis: Aadhaar form + govt impersonation' },
  { actor: 'DRISHTI', plain: 'Visual phishing analysis complete' },
  { actor: 'CANARY', plain: 'Canary credential planted in monitoring system' },
  { actor: 'KAVACH', plain: 'Cluster citizen phishing reports (TF-IDF)' },
  { actor: 'KAVACH', plain: '5 reports joined same phishing campaign' },
  { actor: 'KAVACH', plain: 'Login spike: 580 failed logins detected (Z-score)' },
  { actor: 'KAVACH', plain: 'Foreign IPs blocked — credential stuffing confirmed' },
  { actor: 'KAVACH', plain: 'Off-hours admin login flagged' },
  { actor: 'CANARY', plain: 'Canary credential stolen — forensic proof' },
  { actor: 'BRIDGE', plain: 'Correlating external attack to internal breach' },
  { actor: 'BRIDGE', plain: 'Unified attack narrative confirmed' },
  { actor: 'SYSTEM', plain: 'CERT-In takedown request auto-generated' },
];

export default function SimulationPage() {
  const { simActive, simLog, startSimulation, addSimStep, endSimulation } = useStore();
  const pollRef = useRef(null);
  const logRef = useRef(null);
  const [seenCount, setSeenCount] = useState(0);
  const [error, setError] = useState(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/sim-log`, {
          headers: { 'X-API-KEY': API_KEY }
        });
        const data = await res.json();
        const steps = data.steps || [];
        const state = data.state || {};

        // Only reveal logs once the simulation is fully complete
        if (state.done && !state.running) {
          stopPolling();
          steps.forEach(step => addSimStep(step));
          endSimulation();
        }
      } catch {
        // Backend not ready yet — keep polling silently
      }
    }, 800);
  }, [addSimStep, endSimulation, stopPolling]);

  const runSim = useCallback(async () => {
    if (simActive) return;
    setError(null);
    setSeenCount(0);
    startSimulation();

    const API_HEADERS = { 'Content-Type': 'application/json', 'X-API-KEY': API_KEY };

    // Reset backend data first
    try { 
      await fetch(`${API_BASE}/sim-reset`, { 
        method: 'POST',
        headers: API_HEADERS
      }); 
    } catch { }

    try {
      const res = await fetch(`${API_BASE}/simulate`, { 
        method: 'POST',
        headers: API_HEADERS
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      startPolling();
    } catch (err) {
      setError('Backend not reachable. Make sure `uvicorn server:app --reload` is running on port 8000.');
      endSimulation();
    }
  }, [simActive, startSimulation, startPolling, endSimulation]);

  // Auto-scroll log to bottom as new steps arrive
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [simLog]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  return (
    <ErrorBoundary>
      <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>
            Attack Simulation
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 480 }}>
            Watch a real cyberattack unfold — every step driven by live Python model output from the backend.
          </p>
        </div>
        <button
          onClick={runSim}
          disabled={simActive}
          style={{
            padding: '9px 20px', borderRadius: 8,
            background: simActive ? 'var(--bg-raised)' : 'var(--accent)',
            border: simActive ? '1px solid var(--border-dim)' : 'none',
            color: simActive ? 'var(--text-muted)' : '#fff',
            fontSize: 13, fontWeight: 700,
            cursor: simActive ? 'not-allowed' : 'pointer',
            opacity: simActive ? 0.6 : 1, transition: 'all 0.15s',
          }}
        >
          {simActive ? '⚙ Running…' : simLog.length > 0 ? '↺ Replay' : '▶ Run Simulation'}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 8, background: 'var(--critical-bg)', border: '1px solid var(--critical-border)', color: 'var(--critical)', fontSize: 13 }}>
          ⚠ {error}
        </div>
      )}

      {/* Progress Monitor */}
      {(simActive || simLog.length > 0) && (
        <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border-dim)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Live Terminal Output
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: simActive ? 'var(--high)' : 'var(--success)' }}>
              {simActive
                ? `${simLog.length} events — capturing live stdout…`
                : `${simLog.length} events · Execution Finished ✓`}
            </span>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 24 }}>
        {/* Live log */}
        <div>
          {simLog.length === 0 && !simActive && (
            <div className="card" style={{ padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.15 }}>▶</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Ready to Run
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 340, margin: '0 auto', lineHeight: 1.6 }}>
                Press "Run Simulation" — every event below will be emitted by the real Python AI models
                running on the backend. Output also appears on your terminal.
              </div>
            </div>
          )}

          <div
            ref={logRef}
            style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 560, overflowY: 'auto' }}
          >
            {simLog.map((step, i) => (
              <div
                key={i}
                className="fade-in card"
                style={{ padding: '16px 18px', borderLeft: `3px solid ${ACTOR_COLORS[step.actor] || 'var(--border-dim)'}` }}
              >
                <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: ACTOR_COLORS[step.actor], textTransform: 'uppercase' }}>
                    {step.actor}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    {step.ts}
                  </span>
                  <span style={{
                    fontSize: 10, padding: '1px 7px', borderRadius: 20,
                    background: (SEV_COLORS[step.severity] || '#6b7280') + '18',
                    color: SEV_COLORS[step.severity] || '#6b7280',
                    border: `1px solid ${(SEV_COLORS[step.severity] || '#6b7280')}30`,
                    fontWeight: 700,
                  }}>
                    {step.severity}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, fontFamily: 'var(--font-mono)', marginBottom: 10 }}>
                  {step.msg}
                </div>
                <div style={{ padding: '9px 12px', borderRadius: 6, background: 'var(--bg-raised)', border: '1px solid var(--border-dim)' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Plain English:{' '}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                    {step.plain}
                  </span>
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
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
            Pipeline Steps
          </div>
          {EXPECTED_STEPS.map((step, i) => {
            const done = simLog.length > i;
            // FIX: consistent opacity — was 0.2 in one branch, 0.55 in other — unified
            const active = simActive && simLog.length === i;
            return (
              <div key={i} style={{
                display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 12,
                opacity: done ? 1 : active ? 0.9 : 0.3,
                transition: 'opacity 0.5s',
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                  border: `1.5px solid ${ACTOR_COLORS[step.actor]}`,
                  background: done ? ACTOR_COLORS[step.actor] : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, color: done ? '#0f0f0f' : 'transparent', fontWeight: 800, marginTop: 1,
                  animation: active ? 'pulse-dot 1s ease infinite' : 'none',
                }}>✓</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: ACTOR_COLORS[step.actor], letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 1 }}>
                    {step.actor}
                  </div>
                  {/* FIX: consistent text color — was var(--text-muted) in one, var(--text-secondary) in other */}
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {step.plain.slice(0, 52)}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Legend */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-dim)' }}>
            {[
              { actor: 'DRISHTI', color: '#3ecf8e', desc: 'External detection' },
              { actor: 'KAVACH', color: '#6384BE', desc: 'Internal defense' },
              { actor: 'BRIDGE', color: '#a78bfa', desc: 'Correlation' },
              { actor: 'CANARY', color: '#f59e0b', desc: 'Forensic proof' },
              { actor: 'SYSTEM', color: '#6b7280', desc: 'Auto-response' },
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
    </ErrorBoundary>
  );
}