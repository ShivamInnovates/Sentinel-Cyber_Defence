import { create } from 'zustand';
import {
  getMockDomains, getMockEvents, getMockCorrelations,
  getMockKPIs, getMockCanaries, getMockTrendData,
  getMockZoneActivity, FEED_POOL
} from '../services/mockApi';
import { DateTime } from 'luxon';

export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
export const API_KEY = import.meta.env.VITE_API_KEY || 'TRINETRA-demo-key';
const now = () => new Date().toISOString();

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
    const headers = { 'X-API-KEY': API_KEY };

    // Helper: fetch JSON, fall back to null if unavailable (HTML 404 etc.)
    const safeJson = async (url) => {
      try {
        const res = await fetch(url, { headers });
        if (!res.ok) return null;
        const ct = res.headers.get('content-type') ?? '';
        if (!ct.includes('application/json')) return null;
        return await res.json();
      } catch { return null; }
    };

    const [kpis, domains, events, canaries, correlations] = await Promise.all([
      safeJson(`${API_BASE}/kpi`),
      safeJson(`${API_BASE}/domains`),
      safeJson(`${API_BASE}/events`),
      safeJson(`${API_BASE}/canaries`),
      safeJson(`${API_BASE}/correlations`),
    ]);

    set((s) => ({
      kpis:         kpis         ? { ...s.kpis, ...kpis }    : s.kpis,
      domains:      domains      ?? getMockDomains(),
      events:       events       ?? getMockEvents(),
      canaries:     canaries     ?? getMockCanaries(),
      correlations: correlations ?? getMockCorrelations(),
    }));
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
