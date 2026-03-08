import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface SetupState {
  isFirstRun: boolean;
  hasSeenTour: boolean;
  setupVersion: number;

  // Actions
  completeSetup: () => void;
  resetSetup: () => void;
  markTourAsSeen: () => void;
}

const CURRENT_SETUP_VERSION = 1;

export const useSetupStore = create<SetupState>()(
  devtools(
    persist(
      (set) => ({
        isFirstRun: true,
        hasSeenTour: false,
        setupVersion: 0,

        completeSetup: () => set({
          isFirstRun: false,
          hasSeenTour: true,
          setupVersion: CURRENT_SETUP_VERSION,
        }),

        resetSetup: () => set({
          isFirstRun: true,
          hasSeenTour: false,
          setupVersion: 0,
        }),

        markTourAsSeen: () => set({ hasSeenTour: true }),
      }),
      {
        name: 'SetupStore',
        version: CURRENT_SETUP_VERSION,
        migrate: (persistedState: unknown) => {
          const state = persistedState as Partial<SetupState>;
          // Reset if version mismatch
          if (state.setupVersion !== CURRENT_SETUP_VERSION) {
            return {
              isFirstRun: false, // Don't show wizard again on updates
              hasSeenTour: state.hasSeenTour ?? false,
              setupVersion: CURRENT_SETUP_VERSION,
            };
          }
          return state;
        },
      }
    ),
    { name: 'SetupStore' }
  )
);
