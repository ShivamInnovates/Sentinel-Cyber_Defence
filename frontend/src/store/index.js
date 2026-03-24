import { create } from 'zustand';
import {
  getMockDomains, getMockEvents, getMockCorrelations,
  getMockKPIs, getMockCanaries, getMockTrendData,
  getMockZoneActivity, FEED_POOL
} from '../services/mockApi';
import { DateTime } from 'luxon';

const API_BASE = 'http://127.0.0.1:8000/api';
const API_KEY = 'sentinel-demo-key'; // or from env

export const useStore = create((set, get) => ({
  domains: [],
  events: [],
  correlations: [],
  kpis: getMockKPIs(), // keep mock for static parts if needed, overwritten by fetchData
  canaries: [],
  trendData: getMockTrendData(),
  zoneActivity: getMockZoneActivity(),
  liveFeed: [],

  // 'landing' | 'overview' | 'drishti' | 'fake-sites' | 'phishing-monitor'
  // | 'kavach' | 'login-anomalies' | 'zone-watch' | 'detection-rules'
  // | 'bridge' | 'attack-chains' | 'canary-creds'
  // | 'analytics' | 'simulation' | 'support'
  activeModule: 'landing',
  darkMode: true,

  simActive: false,
  simLog: [],
  simStep: 0,

  fetchData: async () => {
    try {
      const headers = { 'X-API-KEY': API_KEY };
      const [kpis, domains, events, canaries, correlations] = await Promise.all([
        fetch(`${API_BASE}/kpi`, { headers }).then(res => res.json()),
        fetch(`${API_BASE}/domains`, { headers }).then(res => res.json()),
        fetch(`${API_BASE}/events`, { headers }).then(res => res.json()),
        fetch(`${API_BASE}/canaries`, { headers }).then(res => res.json()),
        fetch(`${API_BASE}/correlations`, { headers }).then(res => res.json()),
      ]);
      set((s) => ({
        kpis: { ...s.kpis, ...kpis },
        domains, events, canaries, correlations
      }));
    } catch (err) {
      console.warn('Backend fetch failed', err);
    }
  },

  setActiveModule: (module) => set({ activeModule: module }),

  toggleDark: () => set((s) => {
    const next = !s.darkMode;
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    return { darkMode: next };
  }),

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

  startSimulation: () => set({ simActive: true, simLog: [], simStep: 0 }),

  addSimStep: (step) => set((s) => ({
    simLog: [...s.simLog, { ...step, ts: now() }],
    simStep: s.simLog.length,
  })),

  endSimulation: () => set({ simActive: false }),
}));
