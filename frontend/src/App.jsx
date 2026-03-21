import { useEffect } from 'react';
import AOS from 'aos';
import { useStore } from './store';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import OverviewPage from './modules/overview/OverviewPage';
import DrishtiPage from './modules/drishti/DrishtiPage';
import KavachPage from './modules/kavach/KavachPage';
import BridgePage from './modules/bridge/BridgePage';
import SimulationPage from './modules/simulation/SimulationPage';
import './styles/globals.css';

export default function App() {
  const { activeModule } = useStore();

  useEffect(() => {
    AOS.init({ duration: 500, easing: 'ease-out-cubic', once: true, offset: 20 });
  }, []);

  useEffect(() => { setTimeout(() => AOS.refresh(), 50); }, [activeModule]);

  const pages = {
    overview:   <OverviewPage />,
    drishti:    <DrishtiPage />,
    kavach:     <KavachPage />,
    bridge:     <BridgePage />,
    simulation: <SimulationPage />,
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-deep)' }}>
      <div className="scanline-overlay" />
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Topbar />
        <main className="grid-bg" style={{ flex: 1, overflowY: 'auto', padding: '24px' }} key={activeModule}>
          {pages[activeModule] || <OverviewPage />}
        </main>
      </div>
    </div>
  );
}
