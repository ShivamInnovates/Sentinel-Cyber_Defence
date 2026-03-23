import { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store';

const Icon = ({ d, size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  globe:  'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10zM2 12h20',
  mail:   'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6',
  ban:    'M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636',
  lock:   'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z M7 11V7a5 5 0 0 1 10 0v4',
  map:    'M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3V7z M9 4v13 M15 7v13',
  list:   'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',
  link:   'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  bird:   'M22 3l-8.97 5.7a2 2 0 0 1-2.06 0L2 3 M2 3l10 13L22 3',
  play:   'M5 3l14 9-14 9V3z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  alert:  'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01',
};

const MEGA_MENUS = {
  drishti: {
    label: 'DRISHTI',
    color: '#6384BE',
    sections: [{
      title: 'External Threat Detection',
      items: [
        { iconKey: 'globe', label: 'Fake Site Detection', sub: 'Every fake MCD website found online',        page: 'fake-sites'       },
        { iconKey: 'mail',  label: 'Phishing Monitor',    sub: 'SMS & WhatsApp impersonation messages',     page: 'phishing-monitor' },
        { iconKey: 'ban',   label: 'Site Takedowns',      sub: 'Removal requests sent to CERT-In',          page: 'site-takedowns'   },
      ],
    }],
  },
  kavach: {
    label: 'KAVACH',
    color: '#16A34A',
    sections: [{
      title: 'Internal Network Defense',
      items: [
        { iconKey: 'lock', label: 'Login Anomalies',  sub: 'Unusual login patterns across 2,400 computers', page: 'login-anomalies' },
        { iconKey: 'map',  label: '12-Zone Watch',    sub: 'Real-time status of all Delhi MCD zones',       page: 'zone-watch'      },
        { iconKey: 'list', label: 'Detection Rules',  sub: 'Rules that trigger alerts — and why',           page: 'detection-rules' },
      ],
    }],
  },
  bridge: {
    label: 'Bridge Correlation',
    color: '#7C3AED',
    sections: [{
      title: 'Attack Correlation Engine',
      items: [
        { iconKey: 'link', label: 'Attack Chains',      sub: 'Fake site linked to internal breach',        page: 'attack-chains' },
        { iconKey: 'bird', label: 'Canary Credentials', sub: 'Forensic proof of credential theft',         page: 'canary-creds'  },
        { iconKey: 'play', label: 'Attack Simulation',  sub: 'Watch a full attack unfold step by step',    page: 'simulation'    },
      ],
    }],
  },
};

const MENU_PAGES = {
  drishti: ['drishti', 'fake-sites', 'phishing-monitor', 'site-takedowns'],
  kavach:  ['kavach', 'login-anomalies', 'zone-watch', 'detection-rules'],
  bridge:  ['bridge', 'attack-chains', 'canary-creds', 'simulation'],
};

function MegaMenu({ menu, onNavigate, onClose }) {
  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 8px)', left: '50%',
      transform: 'translateX(-50%)',
      background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 14,
      boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
      padding: '16px 16px 12px', minWidth: 300, zIndex: 1000,
      animation: 'slideDown 0.16s ease both',
    }}>
      <div style={{
        position: 'absolute', top: -6, left: '50%',
        transform: 'translateX(-50%) rotate(45deg)',
        width: 11, height: 11, background: '#FFFFFF',
        border: '1px solid #E5E7EB', borderBottom: 'none', borderRight: 'none',
      }} />
      {menu.sections.map(section => (
        <div key={section.title}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 8 }}>
            {section.title}
          </div>
          {section.items.map((item, i) => (
            <button key={i}
              onClick={() => { onNavigate(item.page); onClose(); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '9px 10px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s', marginBottom: 2 }}
              onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 34, height: 34, borderRadius: 8, background: menu.color + '12', border: `1px solid ${menu.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon d={ICONS[item.iconKey]} size={15} color={menu.color} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 1 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>{item.sub}</div>
              </div>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id); }, []);
  const fmt = n => String(n).padStart(2, '0');
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', fontFamily: 'IBM Plex Mono, monospace' }}>
        {fmt(time.getHours())}:{fmt(time.getMinutes())}:{fmt(time.getSeconds())}
      </div>
      <div style={{ fontSize: 10, color: '#9CA3AF' }}>
        {time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} IST
      </div>
    </div>
  );
}

export default function Navbar() {
  const { setActiveModule, activeModule, kpis } = useStore();
  const [openMenu, setOpenMenu] = useState(null);
  const navRef = useRef(null);

  useEffect(() => {
    const handler = e => { if (navRef.current && !navRef.current.contains(e.target)) setOpenMenu(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      {kpis.criticalCount > 0 && (
        <div style={{ background: '#FEF2F2', borderBottom: '1px solid #FECACA', padding: '7px 40px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon d={ICONS.alert} size={14} color="#DC2626" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#DC2626' }}>Critical Alert:</span>
          <span style={{ fontSize: 13, color: '#991B1B' }}>
            {kpis.criticalCount} critical threat{kpis.criticalCount > 1 ? 's' : ''} require immediate attention.
          </span>
          <button onClick={() => { setActiveModule('login-anomalies'); setOpenMenu(null); }}
            style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: '#DC2626', background: 'none', border: '1px solid #FECACA', borderRadius: 6, padding: '3px 12px', cursor: 'pointer' }}>
            View Threats →
          </button>
        </div>
      )}

      <nav ref={navRef} style={{ height: 58, background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', padding: '0 40px', position: 'sticky', top: 0, zIndex: 500 }}>

        <button onClick={() => { setActiveModule('overview'); setOpenMenu(null); }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', marginRight: 28, padding: 0, flexShrink: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #0B1E40, #6384BE)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon d={ICONS.shield} size={14} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0B1E40', letterSpacing: '-0.01em', lineHeight: 1.2 }}>SENTINEL</div>
            <div style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 500, letterSpacing: '0.05em' }}>MCD CYBER DEFENSE</div>
          </div>
        </button>

        <div style={{ width: 1, height: 24, background: '#E5E7EB', marginRight: 20, flexShrink: 0 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <button onClick={() => { setActiveModule('overview'); setOpenMenu(null); }}
            style={{ padding: '5px 13px', borderRadius: 7, border: 'none', background: activeModule === 'overview' ? '#F3F4F6' : 'transparent', color: activeModule === 'overview' ? '#111827' : '#6B7280', fontSize: 14, fontWeight: activeModule === 'overview' ? 600 : 500, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { if (activeModule !== 'overview') { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.color = '#374151'; } }}
            onMouseLeave={e => { if (activeModule !== 'overview') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B7280'; } }}>
            Dashboard
          </button>

          {Object.entries(MEGA_MENUS).map(([key, menu]) => {
            const isActive = MENU_PAGES[key]?.includes(activeModule);
            const isOpen   = openMenu === key;
            return (
              <div key={key} style={{ position: 'relative' }}>
                <button onClick={() => setOpenMenu(isOpen ? null : key)}
                  style={{ padding: '5px 13px', borderRadius: 7, border: 'none', background: isActive || isOpen ? '#F3F4F6' : 'transparent', color: isActive || isOpen ? '#111827' : '#6B7280', fontSize: 14, fontWeight: isActive ? 600 : 500, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}
                  onMouseEnter={e => { if (!isActive && !isOpen) { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.color = '#374151'; } }}
                  onMouseLeave={e => { if (!isActive && !isOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B7280'; } }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: menu.color, display: 'inline-block' }} />
                  {menu.label}
                  <span style={{ fontSize: 9, color: '#9CA3AF', display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>▾</span>
                </button>
                {isOpen && <MegaMenu menu={menu} onNavigate={setActiveModule} onClose={() => setOpenMenu(null)} />}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
          {[
            { label: 'THREATS',  value: kpis.activeThreats,     color: '#DC2626' },
            { label: 'PHISHING', value: kpis.livePhishingSites, color: '#D97706' },
            { label: 'ZONES',    value: '12/12',                 color: '#16A34A' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, letterSpacing: '0.06em', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
          <div style={{ width: 1, height: 20, background: '#E5E7EB' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ position: 'relative', width: 8, height: 8, display: 'inline-flex' }}>
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#16A34A', animation: 'ping 1.4s ease-out infinite', opacity: 0.5 }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A', display: 'block' }} />
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#16A34A' }}>Live</span>
          </div>
          <div style={{ width: 1, height: 20, background: '#E5E7EB' }} />
          <Clock />
        </div>
      </nav>
    </>
  );
}