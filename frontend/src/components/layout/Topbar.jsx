import { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import { StatusDot } from '../ui';
import { useStore } from '../../store';

export default function Topbar() {
  const [time, setTime] = useState(DateTime.now().setZone('Asia/Kolkata'));
  const { kpis, activeModule } = useStore();

  useEffect(() => {
    const id = setInterval(() => setTime(DateTime.now().setZone('Asia/Kolkata')), 1000);
    return () => clearInterval(id);
  }, []);

  const MODULE_TITLES = {
    overview:   { title: 'Overview',        sub: 'Unified threat dashboard — all systems' },
    drishti:    { title: 'DRISHTI',         sub: 'External threat monitoring — fake sites & phishing' },
    kavach:     { title: 'KAVACH',          sub: 'Internal network defense — 12 zones, 2,400 computers' },
    bridge:     { title: 'The Bridge',      sub: 'Attack correlation engine — connecting the dots' },
    simulation: { title: 'Attack Simulation', sub: 'Watch a real cyberattack unfold step-by-step' },
  };

  const current = MODULE_TITLES[activeModule] || MODULE_TITLES.overview;

  return (
    <>
      {/* Critical strip */}
      {kpis.criticalCount > 0 && (
        <div style={{ background: 'var(--critical-bg)', borderBottom: '1px solid var(--critical-border)', padding: '6px 24px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
          <span style={{ animation: 'blink 0.8s ease infinite', color: 'var(--critical)', fontSize: 14 }}>⚠</span>
          <span style={{ color: 'var(--critical)', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '0.06em', fontSize: 11 }}>CRITICAL ALERT:</span>
          <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: 12 }}>{kpis.criticalCount} critical threat{kpis.criticalCount > 1 ? 's' : ''} require immediate attention.</span>
          <button onClick={() => useStore.getState().setActiveModule('kavach')} style={{ marginLeft: 'auto', background: 'none', border: '1px solid var(--critical-border)', color: 'var(--critical)', padding: '2px 10px', borderRadius: 5, cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-display)', fontWeight: 600 }}>VIEW THREATS →</button>
        </div>
      )}

      {/* Main bar */}
      <header style={{ height: 58, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-dim)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 90, flexShrink: 0 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>{current.title}</h1>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1, fontFamily: 'var(--font-body)' }}>{current.sub}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Quick stats */}
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            {[
              { label: 'Threats', value: kpis.activeThreats, color: 'var(--critical)' },
              { label: 'Phish Sites', value: kpis.livePhishingSites, color: 'var(--high)' },
              { label: 'Zones OK', value: '12/12', color: 'var(--success)' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-display)', fontWeight: 500, letterSpacing: '0.06em' }}>{s.label.toUpperCase()}</div>
              </div>
            ))}
          </div>

          <div style={{ width: 1, height: 26, background: 'var(--border-dim)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <StatusDot color="var(--success)" pulse size={7} />
            <span style={{ fontSize: 10, color: 'var(--success)', fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '0.08em' }}>LIVE</span>
          </div>

          <div style={{ width: 1, height: 26, background: 'var(--border-dim)' }} />

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 15, fontFamily: 'var(--font-display)', color: 'var(--accent-secondary)', fontWeight: 700, letterSpacing: '0.04em' }}>{time.toFormat('HH:mm:ss')}</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 500 }}>{time.toFormat('dd MMM yyyy')} IST</div>
          </div>
        </div>
      </header>
    </>
  );
}
