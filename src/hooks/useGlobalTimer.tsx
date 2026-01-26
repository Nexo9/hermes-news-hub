import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GlobalTimerState {
  lastRefreshTime: number;
  isRefreshing: boolean;
  setLastRefreshTime: (time: number) => void;
  setIsRefreshing: (value: boolean) => void;
  resetTimer: () => void;
  getTimeLeft: () => number;
}

const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export const useGlobalTimer = create<GlobalTimerState>()(
  persist(
    (set, get) => ({
      lastRefreshTime: Date.now(),
      isRefreshing: false,
      setLastRefreshTime: (time) => set({ lastRefreshTime: time }),
      setIsRefreshing: (value) => set({ isRefreshing: value }),
      resetTimer: () => set({ 
        lastRefreshTime: Date.now() 
      }),
      // Calculate time left based on real elapsed time - works even when tab is closed
      getTimeLeft: () => {
        const elapsed = Date.now() - get().lastRefreshTime;
        return Math.max(0, REFRESH_INTERVAL_MS - elapsed);
      },
    }),
    {
      name: 'hermes-news-timer',
      partialize: (state) => ({ 
        lastRefreshTime: state.lastRefreshTime 
      }),
    }
  )
);

export const REFRESH_INTERVAL = REFRESH_INTERVAL_MS;
