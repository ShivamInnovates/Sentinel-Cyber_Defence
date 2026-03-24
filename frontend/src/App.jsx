import { useEffect, useState } from 'react';
import AOS from 'aos';
import { useStore } from './store';
import Navbar from './components/layout/Navbar';
import CyberBackground from './components/shared/CyberBackground';

import LandingPage        from './modules/landing/LandingPage.jsx';
import OverviewPage       from './modules/overview/OverviewPage.jsx';
import DrishtiPage        from './modules/drishti/DrishtiPage.jsx';
import ThreatMonitor     from './modules/drishti/ThreatMonitor.jsx';
import SiteTakedowns      from './modules/drishti/SiteTakedowns.jsx';
import KavachPage         from './modules/kavach/KavachPage.jsx';
import LoginAnomalies     from './modules/kavach/LoginAnomalies.jsx';
import ZoneWatch          from './modules/kavach/ZoneWatch.jsx';
import DetectionRules     from './modules/kavach/DetectionRules.jsx';
import BridgePage         from './modules/bridge/BridgePage.jsx';
import AttackChains       from './modules/bridge/AttackChains.jsx';
import CanaryCredentials  from './modules/bridge/CanaryCredentials.jsx';
import AnalyticsPage      from './modules/analytics/AnalyticsPage.jsx';
import SimulationPage     from './modules/simulation/SimulationPage.jsx';
import SupportPage        from './modules/support/SupportPage.jsx';

import './styles/globals.css';

const PAGES = {
  landing:            <LandingPage />,
  overview:           <OverviewPage />,
  drishti:            <DrishtiPage />,
  'threat-monitor':   <ThreatMonitor />,
  'site-takedowns':   <SiteTakedowns />,
  kavach:             <KavachPage />,
  'login-anomalies':  <LoginAnomalies />,
  'zone-watch':       <ZoneWatch />,
  'detection-rules':  <DetectionRules />,
  bridge:             <BridgePage />,
  'attack-chains':    <AttackChains />,
  'canary-creds':     <CanaryCredentials />,
  analytics:          <AnalyticsPage />,
  simulation:         <SimulationPage />,
  support:            <SupportPage />,
};

export default function App() {
  const { activeModule, darkMode } = useStore();
  const [navCollapsed, setNavCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    AOS.init({ duration: 400, easing: 'ease-out-cubic', once: true, offset: 12 });
  }, []);

  useEffect(() => { setTimeout(() => AOS.refresh(), 50); }, [activeModule]);

  const isLanding = activeModule === 'landing';

  return (
    <div className="app-shell">
      <CyberBackground />
      <Navbar collapsed={navCollapsed} onToggle={() => setNavCollapsed(v => !v)} />
      <div className={`app-main${navCollapsed ? ' nav-collapsed' : ''}`} style={{ position: 'relative', zIndex: 1 }}>
        {isLanding
          ? <div key={activeModule}>{PAGES[activeModule]}</div>
          : (
            <main
              key={activeModule}
              style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px 80px' }}
            >
              {PAGES[activeModule] || <OverviewPage />}
            </main>
          )
        }
      </div>
    </div>
  );
}
