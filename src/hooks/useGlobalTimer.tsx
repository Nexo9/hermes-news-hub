import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GlobalTimerState {
  timeLeft: number;
  lastRefreshTime: number | null;
  isRefreshing: boolean;
  setTimeLeft: (time: number) => void;
  setLastRefreshTime: (time: number) => void;
  setIsRefreshing: (value: boolean) => void;
  decrementTime: () => void;
  resetTimer: () => void;
}

const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export const useGlobalTimer = create<GlobalTimerState>()(
  persist(
    (set, get) => ({
      timeLeft: REFRESH_INTERVAL_MS,
      lastRefreshTime: null,
      isRefreshing: false,
      setTimeLeft: (time) => set({ timeLeft: time }),
      setLastRefreshTime: (time) => set({ lastRefreshTime: time }),
      setIsRefreshing: (value) => set({ isRefreshing: value }),
      decrementTime: () => {
        const current = get().timeLeft;
        if (current > 1000) {
          set({ timeLeft: current - 1000 });
        }
      },
      resetTimer: () => set({ 
        timeLeft: REFRESH_INTERVAL_MS, 
        lastRefreshTime: Date.now() 
      }),
    }),
    {
      name: 'hermes-news-timer',
      partialize: (state) => ({ 
        timeLeft: state.timeLeft, 
        lastRefreshTime: state.lastRefreshTime 
      }),
    }
  )
);

export const REFRESH_INTERVAL = REFRESH_INTERVAL_MS;
