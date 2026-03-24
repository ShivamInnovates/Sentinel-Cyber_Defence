import { useStore } from '../../store';
import logoDark from '../../assets/trinetra-logo-dark.svg';
import logoLight from '../../assets/trinetra-logo-light.svg';

const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  eye:   'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  lock:  'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z M7 11V7a5 5 0 0 1 10 0v4',
  link:  'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  bar:   'M18 20V10 M12 20V4 M6 20v-6',
  play:  'M5 3l14 9-14 9V3z',
  help:  'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3 M12 17h.01',
  arrow: 'M5 12h14 M12 5l7 7-7 7',
};

const FEATURES = [
  { icon: 'eye',  color: '#3b82f6', label: 'Drishti',           module: 'drishti',    title: 'External Threat Detection', desc: 'Monitors fake MCD websites and phishing messages in real-time.' },
  { icon: 'lock', color: '#60a5fa', label: 'Kavach',            module: 'kavach',     title: 'Internal Network Defense',  desc: 'Watches 2,400 computers across 12 Delhi zones for anomalies.' },
  { icon: 'link', color: '#a78bfa', label: 'Bridge Correlation',module: 'bridge',     title: 'Attack Chain Analysis',     desc: 'Connects phishing to internal breaches with forensic evidence.' },
  { icon: 'bar',  color: '#f59e0b', label: 'Analytics',         module: 'analytics',  title: 'Threat Intelligence Logs',  desc: 'Full audit trail of every detected event and response action.' },
  { icon: 'play', color: '#ef4444', label: 'Attack Simulation', module: 'simulation', title: 'Live Attack Playback',       desc: 'Watch a real cyberattack unfold step by step.' },
  { icon: 'help', color: '#3b82f6', label: 'Support',           module: 'support',    title: 'How It Works',              desc: 'System architecture, feedback, and bug reporting.' },
];

const STATS = [
  { value: '18,447', label: 'Domains Monitored' },
  { value: '2,400',  label: 'Computers Protected' },
  { value: '12',     label: 'Delhi Zones' },
  { value: '< 4min', label: 'Avg Detection Time' },
];

export default function LandingPage() {
  const { setActiveModule, darkMode } = useStore();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>

      {/* Hero */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 24px 60px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background glow — blue */}
        <div style={{
          position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
          width: 700, height: 500, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(59,130,246,0.1) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <img
          src={darkMode ? logoDark : logoLight}
          alt="TRINETRA"
          style={{ width: 88, height: 88, objectFit: 'contain', marginBottom: 24, filter: 'drop-shadow(0 4px 20px rgba(59,130,246,0.35))' }}
        />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '5px 14px', borderRadius: 20,
          background: 'var(--accent-light)', border: '1px solid rgba(59,130,246,0.3)',
          fontSize: 11, fontWeight: 600, color: 'var(--accent)',
          marginBottom: 24, letterSpacing: '0.05em',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse-dot 2s ease infinite', display: 'inline-block' }} />
          LIVE · MCD Delhi Cyber Defense
        </div>

        <h1 style={{
          fontSize: 'clamp(48px, 7vw, 80px)', fontWeight: 800,
          color: 'var(--text-primary)', letterSpacing: '-0.04em',
          lineHeight: 1.05, marginBottom: 10,
        }}>
          TRINETRA
        </h1>

        <p style={{
          fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.18em',
          fontWeight: 500, textTransform: 'uppercase', marginBottom: 22,
        }}>
          Cyber Intelligence System
        </p>

        <p style={{
          fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.7,
          maxWidth: 500, marginBottom: 36,
        }}>
          Detects fake government websites, monitors internal networks, and correlates attacks — all in real time.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => setActiveModule('overview')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '11px 24px', borderRadius: 8,
              background: 'var(--accent)', border: 'none',
              color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.15s',
              boxShadow: '0 4px 16px rgba(59,130,246,0.4)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-dark)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(59,130,246,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(59,130,246,0.4)'; e.currentTarget.style.transform = 'none'; }}
          >
            Open Dashboard <Icon d={ICONS.arrow} size={15} />
          </button>
          <button
            onClick={() => setActiveModule('simulation')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '11px 24px', borderRadius: 8,
              background: 'transparent', border: '1px solid var(--border-light)',
              color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.transform = 'none'; }}
          >
            <Icon d={ICONS.play} size={14} /> Watch Simulation
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', marginTop: 64,
          border: '1px solid var(--border-dim)', borderRadius: 14,
          overflow: 'hidden', background: 'var(--bg-card)',
          boxShadow: 'var(--shadow-card)',
          flexWrap: 'wrap',
        }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{
              padding: '20px 36px', textAlign: 'center',
              borderRight: i < STATS.length - 1 ? '1px solid var(--border-dim)' : 'none',
              minWidth: 120,
            }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.03em', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '60px 32px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 10 }}>
            Everything you need
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto' }}>
            Six integrated modules covering every layer of MCD's cyber defense.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 14 }}>
          {FEATURES.map(f => (
            <div
              key={f.label}
              className="card card-interactive"
              onClick={() => setActiveModule(f.module)}
              style={{ padding: '22px 24px' }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `${f.color}18`, border: `1px solid ${f.color}35`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: f.color, marginBottom: 14,
                boxShadow: `0 2px 8px ${f.color}20`,
              }}>
                <Icon d={ICONS[f.icon]} size={17} />
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: f.color, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>{f.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 7 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</div>
              <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 14, fontWeight: 500 }}>Open →</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '0 32px 80px', textAlign: 'center' }}>
        <div style={{
          maxWidth: 560, margin: '0 auto',
          padding: '44px 40px', borderRadius: 16,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-dim)',
          boxShadow: 'var(--shadow-card)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: 320, height: 180,
            background: 'radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 10 }}>
            Ready to explore?
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
            Open the live dashboard to see real-time threats across Delhi's network.
          </p>
          <button
            onClick={() => setActiveModule('overview')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '11px 28px', borderRadius: 8,
              background: 'var(--accent)', border: 'none',
              color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.15s',
              boxShadow: '0 4px 16px rgba(59,130,246,0.4)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-dark)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = 'none'; }}
          >
            Go to Dashboard <Icon d={ICONS.arrow} size={15} />
          </button>
        </div>
      </section>
    </div>
  );
}
