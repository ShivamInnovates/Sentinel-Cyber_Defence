import { useState, useEffect } from 'react';
import { useStore } from '../../store';
import logoDark from '../../assets/trinetra-logo-dark.svg';
import logoLight from '../../assets/trinetra-logo-light.svg';

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  grid:    'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z',
  eye:     'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  lock:    'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z M7 11V7a5 5 0 0 1 10 0v4',
  link:    'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  bar:     'M18 20V10 M12 20V4 M6 20v-6',
  play:    'M5 3l14 9-14 9V3z',
  help:    'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3 M12 17h.01',
  sun:     'M12 1v2 M12 21v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M1 12h2 M21 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42 M12 5a7 7 0 1 0 0 14A7 7 0 0 0 12 5z',
  moon:   'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
  chevron: 'M9 18l6-6-6-6',
  alert:   'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01',
  menu:    'M3 12h18 M3 6h18 M3 18h18',
  close:   'M18 6L6 18 M6 6l12 12',
};

const NAV = [
  { id: 'overview',   icon: 'grid',  label: 'Dashboard',         sub: 'Overview' },
  {
    id: 'drishti', icon: 'eye', label: 'Drishti', sub: 'External Threats',
    children: [
      { id: 'threat-monitor', label: 'Threat Monitor' },
    ],
  },
  {
    id: 'kavach', icon: 'lock', label: 'Kavach', sub: 'Network Defense',
    children: [
      { id: 'login-anomalies', label: 'Login Anomalies' },
      { id: 'zone-watch',      label: '12 Zone Watch' },
    ],
  },
  {
    id: 'bridge', icon: 'link', label: 'Bridge Correlation', sub: 'Attack Chains',
    children: [
      { id: 'attack-chains', label: 'Attack Chains' },
      { id: 'canary-creds',  label: 'Canary Credentials' },
    ],
  },
  { id: 'analytics',  icon: 'bar',  label: 'Analytics',         sub: 'Logs' },
  { id: 'simulation', icon: 'play', label: 'Attack Simulation', sub: 'Live Playback' },
  { id: 'support',    icon: 'help', label: 'Support',           sub: 'Help & Feedback' },
];

const PARENT_IDS = {
  'threat-monitor': 'drishti',
  'login-anomalies': 'kavach', 'zone-watch': 'kavach',
  'attack-chains': 'bridge', 'canary-creds': 'bridge',
};

export default function Navbar({ collapsed, onToggle }) {
  const { activeModule, setActiveModule, darkMode, toggleDark, kpis } = useStore();
  const [expanded, setExpanded] = useState(() => {
    const parent = PARENT_IDS[activeModule];
    return parent ? { [parent]: true } : {};
  });

  useEffect(() => {
    const parent = PARENT_IDS[activeModule];
    if (parent) setExpanded(e => ({ ...e, [parent]: true }));
  }, [activeModule]);

  // Close sub-menus when collapsing
  useEffect(() => {
    if (collapsed) setExpanded({});
  }, [collapsed]);

  const navigate = (id) => setActiveModule(id);

  const toggleExpand = (id) => {
    if (collapsed) {
      onToggle(); // expand sidebar first, then open submenu
      setExpanded({ [id]: true });
    } else {
      setExpanded(e => ({ ...e, [id]: !e[id] }));
    }
  };

  const isActive = (item) => {
    if (item.id === activeModule) return true;
    if (item.children) return item.children.some(c => c.id === activeModule);
    return false;
  };

  return (
    <aside className={`app-sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Logo + toggle */}
      <div style={{
        display: 'flex', alignItems: 'center',
        borderBottom: '1px solid var(--border-dim)',
        flexShrink: 0, overflow: 'hidden',
        minHeight: 60,
      }}>
        {collapsed ? (
          /* When collapsed: clicking the logo icon expands the sidebar */
          <button
            onClick={onToggle}
            title="Expand sidebar"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '100%', padding: '14px 0',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', transition: 'color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <img
              src={darkMode ? logoDark : logoLight}
              alt="TRINETRA"
              style={{ width: 30, height: 30, objectFit: 'contain' }}
            />
          </button>
        ) : (
          <>
            <button
              onClick={() => navigate('landing')}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '14px 12px',
                background: 'none', border: 'none', cursor: 'pointer',
                flex: 1, textAlign: 'left', overflow: 'hidden',
              }}
            >
              <img
                src={darkMode ? logoDark : logoLight}
                alt="TRINETRA"
                style={{ width: 30, height: 30, objectFit: 'contain', flexShrink: 0 }}
              />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.06em', lineHeight: 1.2, whiteSpace: 'nowrap' }}>TRINETRA</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.05em', marginTop: 1, whiteSpace: 'nowrap' }}>Cyber Intelligence System</div>
              </div>
            </button>

            {/* Collapse button */}
            <button
              onClick={onToggle}
              title="Collapse sidebar"
              style={{
                flexShrink: 0, width: 28, height: 28, margin: '0 8px 0 0',
                borderRadius: 6, background: 'transparent', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-dim)', transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-light)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon d={ICONS.close} size={13} />
            </button>
          </>
        )}
      </div>

      {/* Critical alert strip */}
      {kpis.criticalCount > 0 && !collapsed && (
        <div style={{
          margin: '10px 10px 0',
          padding: '8px 12px',
          borderRadius: 8,
          background: 'var(--critical-bg)',
          border: '1px solid var(--critical-border)',
          display: 'flex', alignItems: 'center', gap: 7,
          fontSize: 11, color: 'var(--critical)', fontWeight: 600,
          whiteSpace: 'nowrap', overflow: 'hidden',
        }}>
          <Icon d={ICONS.alert} size={12} />
          {kpis.criticalCount} critical threat{kpis.criticalCount > 1 ? 's' : ''}
        </div>
      )}

      {/* Nav items */}
      <nav style={{ flex: 1, padding: collapsed ? '10px 4px' : '10px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {!collapsed && (
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '6px 10px 8px', whiteSpace: 'nowrap' }}>
            Navigation
          </div>
        )}

        {NAV.map(item => {
          const active = isActive(item);
          const isExpanded = expanded[item.id];

          return (
            <div key={item.id} style={{ marginBottom: 1 }}>
              <button
                onClick={() => item.children ? toggleExpand(item.id) : navigate(item.id)}
                title={collapsed ? item.label : undefined}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  gap: collapsed ? 0 : 9,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? '10px 0' : '8px 10px',
                  borderRadius: 8, border: 'none',
                  background: active && !item.children ? 'var(--accent-light)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer', transition: 'all 0.14s', textAlign: 'left',
                  boxShadow: active && !item.children ? 'inset 0 0 0 1px rgba(59,130,246,0.25)' : 'none',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  if (!active || item.children)
                    e.currentTarget.style.background = 'var(--bg-raised)';
                }}
                onMouseLeave={e => {
                  if (!active || item.children)
                    e.currentTarget.style.background =
                      active && !item.children ? 'var(--accent-light)' : 'transparent';
                }}
              >
                {/* Active indicator bar */}
                {!collapsed && (
                  <span style={{
                    position: 'absolute', left: 8,
                    width: 3, height: 20, borderRadius: 2,
                    background: active && !item.children ? 'var(--accent)' : 'transparent',
                    transition: 'background 0.14s',
                  }} />
                )}

                <span style={{
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                  flexShrink: 0,
                  marginLeft: collapsed ? 0 : 6,
                }}>
                  <Icon d={ICONS[item.icon]} size={15} />
                </span>

                {!collapsed && (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: active ? 600 : 500, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 1 }}>{item.sub}</div>
                  </div>
                )}

                {item.children && !collapsed && (
                  <span style={{
                    color: 'var(--text-dim)',
                    transform: isExpanded ? 'rotate(90deg)' : 'none',
                    transition: 'transform 0.15s',
                    flexShrink: 0,
                  }}>
                    <Icon d={ICONS.chevron} size={12} />
                  </span>
                )}
              </button>

              {/* Sub-items — only shown when expanded and not collapsed */}
              {item.children && isExpanded && !collapsed && (
                <div style={{
                  marginLeft: 28, marginTop: 2, marginBottom: 4,
                  borderLeft: '1px solid var(--border-dim)',
                  paddingLeft: 10,
                }}>
                  {item.children.map(child => {
                    const childActive = activeModule === child.id;
                    return (
                      <button
                        key={child.id}
                        onClick={() => navigate(child.id)}
                        style={{
                          width: '100%', display: 'block',
                          padding: '6px 10px', borderRadius: 6,
                          border: 'none', textAlign: 'left',
                          background: childActive ? 'var(--accent-light)' : 'transparent',
                          color: childActive ? 'var(--accent)' : 'var(--text-muted)',
                          fontSize: 12, fontWeight: childActive ? 600 : 400,
                          cursor: 'pointer', transition: 'all 0.12s', marginBottom: 1,
                          boxShadow: childActive ? 'inset 0 0 0 1px rgba(59,130,246,0.2)' : 'none',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => { if (!childActive) e.currentTarget.style.background = 'var(--bg-raised)'; }}
                        onMouseLeave={e => { if (!childActive) e.currentTarget.style.background = 'transparent'; }}
                      >
                        {child.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer: theme toggle + version */}
      <div style={{
        padding: collapsed ? '12px 0' : '12px 12px',
        borderTop: '1px solid var(--border-dim)',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        flexShrink: 0,
      }}>
        {!collapsed && <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>v2.0 · MCD Delhi</span>}
        <button
          onClick={toggleDark}
          title={darkMode ? 'Light mode' : 'Dark mode'}
          style={{
            width: 30, height: 30, borderRadius: 7,
            background: 'var(--bg-raised)',
            border: '1px solid var(--border-dim)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-dim)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <Icon d={darkMode ? ICONS.sun : ICONS.moon} size={13} />
        </button>
      </div>
    </aside>
  );
}
