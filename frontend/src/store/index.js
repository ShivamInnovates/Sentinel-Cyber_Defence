import { create } from 'zustand';
import {
  getMockDomains, getMockEvents, getMockCorrelations,
  getMockKPIs, getMockCanaries, getMockTrendData,
  getMockZoneActivity, FEED_POOL
} from '../services/mockApi';
import { DateTime } from 'luxon';

const now = () => DateTime.now().setZone('Asia/Kolkata').toFormat('HH:mm:ss');

export const useStore = create((set, get) => ({
  // ── DATA ──
  domains: getMockDomains(),
  events: getMockEvents(),
  correlations: getMockCorrelations(),
  kpis: getMockKPIs(),
  canaries: getMockCanaries(),
  trendData: getMockTrendData(),
  zoneActivity: getMockZoneActivity(),
  liveFeed: [],

  // ── UI STATE ──
  sidebarOpen: true,
  activeModule: 'overview',

  // ── SIMULATION ──
  simActive: false,
  simLog: [],
  simStep: 0,

  // ── ACTIONS ──
  setActiveModule: (module) => set({ activeModule: module }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  resolvEvent: (id) => set((s) => ({
    events: s.events.map(e => e.id === id ? { ...e, resolved: true } : e),
    kpis: { ...s.kpis, activeThreats: Math.max(0, s.kpis.activeThreats - 1) },
  })),

  requestTakedown: (id) => set((s) => ({
    domains: s.domains.map(d => d.id === id ? { ...d, status: 'TAKEDOWN' } : d),
    kpis: { ...s.kpis, takedownsSent: s.kpis.takedownsSent + 1 },
  })),

  addFeedItem: (item) => set((s) => ({
    liveFeed: [{ ...item, ts: now(), id: Date.now() }, ...s.liveFeed].slice(0, 25),
  })),

  startSimulation: () => {
    set({ simActive: true, simLog: [], simStep: 0 });
  },
  addSimStep: (step) => set((s) => ({
    simLog: [...s.simLog, { ...step, ts: now() }],
    simStep: s.simLog.length,
  })),
  endSimulation: () => set({ simActive: false }),
}));
