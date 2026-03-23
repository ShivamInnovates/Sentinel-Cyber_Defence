import { useEffect } from 'react';
import AOS from 'aos';
import { useStore } from './store';
import Navbar from './components/layout/Navbar';

import OverviewPage        from './modules/overview/OverviewPage.jsx';
import DrishtiPage         from './modules/drishti/DrishtiPage.jsx';
import FakeSiteDetection   from './modules/drishti/FakeSiteDetection.jsx';
import PhishingMonitor     from './modules/drishti/PhishingMonitor.jsx';
import SiteTakedowns       from './modules/drishti/SiteTakedowns.jsx';
import KavachPage          from './modules/kavach/KavachPage.jsx';
import LoginAnomalies      from './modules/kavach/LoginAnomalies.jsx';
import ZoneWatch           from './modules/kavach/ZoneWatch.jsx';
import DetectionRules      from './modules/kavach/DetectionRules.jsx';
import BridgePage          from './modules/bridge/BridgePage.jsx';
import AttackChains        from './modules/bridge/AttackChains.jsx';
import CanaryCredentials   from './modules/bridge/CanaryCredentials.jsx';
import SimulationPage      from './modules/simulation/SimulationPage.jsx';

import './styles/globals.css';

const PAGES = {
  overview:           <OverviewPage />,
  drishti:            <DrishtiPage />,
  'fake-sites':       <FakeSiteDetection />,
  'phishing-monitor': <PhishingMonitor />,
  'site-takedowns':   <SiteTakedowns />,
  kavach:             <KavachPage />,
  'login-anomalies':  <LoginAnomalies />,
  'zone-watch':       <ZoneWatch />,
  'detection-rules':  <DetectionRules />,
  bridge:             <BridgePage />,
  'attack-chains':    <AttackChains />,
  'canary-creds':     <CanaryCredentials />,
  simulation:         <SimulationPage />,
};

export default function App() {
  const { activeModule } = useStore();

  useEffect(() => {
    AOS.init({ duration: 400, easing: 'ease-out-cubic', once: true, offset: 12 });
  }, []);

  useEffect(() => { setTimeout(() => AOS.refresh(), 50); }, [activeModule]);

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>
      <Navbar />
      <main
        style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px 80px' }}
        key={activeModule}
      >
        {PAGES[activeModule] || <OverviewPage />}
      </main>
    </div>
  );
}