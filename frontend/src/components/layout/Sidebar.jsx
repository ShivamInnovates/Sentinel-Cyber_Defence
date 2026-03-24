import { useStore } from '../../store';
import { StatusDot } from '../ui';

const NAV_ITEMS = [
  { id: 'overview',   icon: '◈', label: 'Overview',    sub: 'Dashboard' },
  { id: 'drishti',    icon: '◉', label: 'DRISHTI',     sub: 'External Threats' },
  { id: 'kavach',     icon: '◆', label: 'KAVACH',      sub: 'Network Defense' },
  { id: 'bridge',     icon: '⬢', label: 'The Bridge',  sub: 'Correlations' },
  { id: 'simulation', icon: '▶', label: 'Attack Sim',  sub: 'Live Playback' },
];

export default function Sidebar() {
  const { activeModule, setActiveModule, sidebarOpen, kpis } = useStore();

  return (
    <aside style={{
      width: sidebarOpen ? 220 : 64,
      minHeight: '100vh',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-dim)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
      flexShrink: 0, position: 'sticky', top: 0, zIndex: 100, overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        padding: sidebarOpen ? '20px 18px 16px' : '20px 14px 16px',
        borderBottom: '1px solid var(--border-dim)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 36, height: 36, flexShrink: 0, borderRadius: 10,
          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 16, color: '#fff',
        }}>S</div>
        {sidebarOpen && (
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, letterSpacing: '0.1em', color: 'var(--text-primary)' }}>SENTINEL</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.12em', fontFamily: 'var(--font-display)', fontWeight: 500 }}>MCD CYBER DEFENSE</div>
          </div>
        )}
      </div>

      {/* Status pill */}
      {sidebarOpen && (
        <div style={{ margin: '12px 12px 0', padding: '10px 12px', background: 'var(--bg-raised)', borderRadius: 10, border: '1px solid var(--border-dim)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <StatusDot color="var(--success)" pulse size={7} />
            <span style={{ fontSize: 10, color: 'var(--success)', fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '0.08em' }}>SYSTEMS NOMINAL</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Active threats</span>
            <span style={{ fontSize: 11, color: kpis.activeThreats > 0 ? 'var(--critical)' : 'var(--success)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{kpis.activeThreats}</span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px' }}>
        {sidebarOpen && (
          <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.16em', fontFamily: 'var(--font-display)', fontWeight: 600, padding: '10px 8px 6px' }}>MODULES</div>
        )}
        {NAV_ITEMS.map(item => {
          const active = activeModule === item.id;
          return (
            <button key={item.id} onClick={() => setActiveModule(item.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                gap: sidebarOpen ? 10 : 0,
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                padding: sidebarOpen ? '10px 10px' : '12px 0',
                borderRadius: 10, border: 'none',
                background: active ? 'rgba(99,132,190,0.15)' : 'transparent',
                cursor: 'pointer', transition: 'all 0.15s ease', marginBottom: 2,
                position: 'relative',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-raised)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              {active && (
                <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, background: 'var(--accent-primary)', borderRadius: '0 3px 3px 0' }} />
              )}
              <span style={{ fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0, color: active ? 'var(--accent-primary)' : 'var(--text-muted)', transition: 'color 0.15s' }}>{item.icon}</span>
              {sidebarOpen && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)', color: active ? 'var(--accent-primary)' : 'var(--text-secondary)', letterSpacing: '0.03em' }}>{item.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 1, fontFamily: 'var(--font-body)' }}>{item.sub}</div>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: sidebarOpen ? '14px 16px' : '14px 0', borderTop: '1px solid var(--border-dim)', display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'space-between' : 'center' }}>
        {sidebarOpen && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 500 }}>v2.0.1</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>MCD Delhi</div>
          </div>
        )}
        <button onClick={() => useStore.getState().toggleSidebar()} style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-dim)', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {sidebarOpen ? '◂' : '▸'}
        </button>
      </div>
    </aside>
  );
}
