import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

interface PWAState {
  // Install state
  canInstall: boolean;
  isInstalled: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
  
  // Network state
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineAt: number | null;
  
  // Update state
  hasUpdate: boolean;
  waitingWorker: ServiceWorker | null;
  
  // Actions
  setCanInstall: (canInstall: boolean) => void;
  setIsInstalled: (isInstalled: boolean) => void;
  setDeferredPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
  setIsOnline: (isOnline: boolean) => void;
  setWasOffline: (wasOffline: boolean) => void;
  setLastOnlineAt: (timestamp: number) => void;
  setHasUpdate: (hasUpdate: boolean) => void;
  setWaitingWorker: (worker: ServiceWorker | null) => void;
  
  // Methods
  installApp: () => Promise<boolean>;
  skipWaiting: () => void;
  checkOnlineStatus: () => boolean;
}

export const usePWAStore = create<PWAState>()(
  devtools(
    (set, get) => ({
      // Initial state
      canInstall: false,
      isInstalled: false,
      deferredPrompt: null,
      isOnline: navigator.onLine,
      wasOffline: false,
      lastOnlineAt: Date.now(),
      hasUpdate: false,
      waitingWorker: null,

      // Actions
      setCanInstall: (canInstall) => set({ canInstall }),
      setIsInstalled: (isInstalled) => set({ isInstalled }),
      setDeferredPrompt: (deferredPrompt) => set({ deferredPrompt }),
      setIsOnline: (isOnline) => {
        const prevState = get().isOnline;
        set({ isOnline });
        
        // Track if we were offline and now online
        if (!prevState && isOnline) {
          set({ wasOffline: true, lastOnlineAt: Date.now() });
        }
      },
      setWasOffline: (wasOffline) => set({ wasOffline }),
      setLastOnlineAt: (lastOnlineAt) => set({ lastOnlineAt }),
      setHasUpdate: (hasUpdate) => set({ hasUpdate }),
      setWaitingWorker: (waitingWorker) => set({ waitingWorker }),

      // Install the PWA
      installApp: async () => {
        const { deferredPrompt } = get();
        
        if (!deferredPrompt) {
          return false;
        }

        try {
          // Show the install prompt
          deferredPrompt.prompt();
          
          // Wait for the user to respond
          const result = await deferredPrompt.userChoice;
          
          if (result.outcome === 'accepted') {
            set({ isInstalled: true, canInstall: false, deferredPrompt: null });
            return true;
          } else {
            set({ deferredPrompt: null });
            return false;
          }
        } catch {
          set({ deferredPrompt: null });
          return false;
        }
      },

      // Skip waiting for service worker update
      skipWaiting: () => {
        const { waitingWorker } = get();
        if (waitingWorker) {
          waitingWorker.postMessage({ type: 'SKIP_WAITING' });
          set({ hasUpdate: false, waitingWorker: null });
        }
      },

      // Check online status
      checkOnlineStatus: () => {
        const online = navigator.onLine;
        set({ isOnline: online });
        return online;
      },
    }),
    { name: 'PWAStore' }
  )
);

// Selectors
export const selectCanInstall = (state: PWAState) => state.canInstall;
export const selectIsInstalled = (state: PWAState) => state.isInstalled;
export const selectIsOnline = (state: PWAState) => state.isOnline;
export const selectWasOffline = (state: PWAState) => state.wasOffline;
export const selectHasUpdate = (state: PWAState) => state.hasUpdate;
