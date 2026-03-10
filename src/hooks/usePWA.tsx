import { useEffect, useCallback } from 'react';
import { usePWAStore } from '@/stores/pwaStore';
import { useRegisterSW } from 'virtual:pwa-register/react';
import toast from 'react-hot-toast';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export function usePWA() {
  const {
    setCanInstall,
    setIsInstalled,
    setDeferredPrompt,
    setIsOnline,
    setWasOffline,
    setHasUpdate,
    setWaitingWorker,
    installApp,
    skipWaiting,
    isOnline,
    wasOffline,
    hasUpdate,
    canInstall,
    isInstalled,
  } = usePWAStore();

  // Register service worker with auto-update
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      console.log('[PWA] Service Worker registered:', swUrl);
      
      // Check for updates every 60 minutes
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('[PWA] Service Worker registration error:', error);
    },
    onOfflineReady() {
      console.log('[PWA] App ready to work offline');
      setOfflineReady(true);
      toast.success('App is ready to work offline!', {
        icon: '✈️',
        duration: 3000,
      });
    },
  });

  // Handle service worker updates
  useEffect(() => {
    if (needRefresh) {
      setHasUpdate(true);
      
      toast.success(
        (t) => (
          <div className="flex items-center gap-3">
            <span>Update available!</span>
            <button
              onClick={() => {
                updateServiceWorker(true);
                toast.dismiss(t.id);
              }}
              className="px-2 py-1 bg-dev-accent text-white rounded text-xs font-medium"
            >
              Update
            </button>
          </div>
        ),
        { duration: 10000, id: 'sw-update' }
      );
    }
  }, [needRefresh, setHasUpdate, updateServiceWorker]);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      
      // Store the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
      
      console.log('[PWA] App can be installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [setCanInstall, setDeferredPrompt]);

  // Check if app is already installed
  useEffect(() => {
    const checkInstalled = () => {
      // Check if running in standalone mode (installed PWA)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || (window.navigator as { standalone?: boolean }).standalone === true;
      
      if (isStandalone) {
        setIsInstalled(true);
        setCanInstall(false);
      }
    };

    checkInstalled();

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      console.log('[PWA] App was installed');
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
      
      toast.success('App installed successfully!', {
        icon: '🎉',
        duration: 3000,
      });
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [setIsInstalled, setCanInstall, setDeferredPrompt]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('[PWA] App is online');
      setIsOnline(true);
      
      // Show reconnection toast
      toast.success('Back online!', {
        icon: '🌐',
        duration: 2000,
      });
    };

    const handleOffline = () => {
      console.log('[PWA] App is offline');
      setIsOnline(false);
      
      // Show offline toast
      toast.error('You are offline. Some features may be limited.', {
        icon: '✈️',
        duration: 5000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline]);

  // Handle wasOffline reset
  useEffect(() => {
    if (wasOffline && isOnline) {
      // Reset wasOffline after showing the reconnection status
      const timer = setTimeout(() => {
        setWasOffline(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [wasOffline, isOnline, setWasOffline]);

  // Listen for messages from service worker
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SKIP_WAITING') {
        setHasUpdate(true);
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, [setHasUpdate]);

  const handleInstall = useCallback(async () => {
    return await installApp();
  }, [installApp]);

  const handleSkipWaiting = useCallback(() => {
    skipWaiting();
    updateServiceWorker(true);
  }, [skipWaiting, updateServiceWorker]);

  return {
    // State
    isOnline,
    wasOffline,
    canInstall,
    isInstalled,
    hasUpdate,
    offlineReady,
    
    // Actions
    installApp: handleInstall,
    skipWaiting: handleSkipWaiting,
    updateServiceWorker: () => updateServiceWorker(true),
  };
}
