import { useEffect, useState } from 'react';
import { Download, Laptop, Smartphone, X } from 'lucide-react';
import { usePWAStore } from '@/stores/pwaStore';
import { AnimatePresence, motion } from 'framer-motion';

export function InstallPrompt(): React.JSX.Element | null {
  const { canInstall, isInstalled, installApp } = usePWAStore();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Check if user previously dismissed the prompt
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed != null) {
      const dismissedTime = parseInt(dismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        setIsDismissed(true);
      }
    }
  }, []);

  const handleDismiss = (): void => {
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleInstall = async (): Promise<void> => {
    setIsInstalling(true);
    
    try {
      const success = await installApp();
      
      if (success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.error('[InstallPrompt] Install failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  // Don't show if already installed or can't install or dismissed
  if (isInstalled || !canInstall || isDismissed) {
    return null;
  }

  // Detect platform
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const InstallIcon = isMobile ? Smartphone : Laptop;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50"
      >
        <div className="
          bg-dev-surface border border-dev-border rounded-xl shadow-2xl
          p-4
        ">
          {showSuccess ? (
            <div className="flex items-center gap-3 text-green-500">
              <Download className="w-5 h-5" aria-hidden="true" />
              <span className="font-medium">App installed successfully!</span>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <div className="
                  w-10 h-10 rounded-lg bg-dev-accent/10 
                  flex items-center justify-center flex-shrink-0
                ">
                  <InstallIcon className="w-5 h-5 text-dev-accent" aria-hidden="true" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-dev-text text-sm">
                    Install Performance Profiler
                  </h3>
                  <p className="text-xs text-dev-text-muted mt-1">
                    Add to your {isMobile ? 'home screen' : 'desktop'} for quick access and offline viewing.
                  </p>
                </div>
                
                <button
                  onClick={handleDismiss}
                  className="
                    p-1 rounded-md text-dev-text-subtle
                    hover:bg-dev-surface-hover hover:text-dev-text
                    transition-colors
                    focus:outline-none focus:ring-2 focus:ring-dev-accent/50
                  "
                  aria-label="Dismiss install prompt"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleDismiss}
                  className="
                    flex-1 px-3 py-2 rounded-lg text-xs font-medium
                    text-dev-text-muted hover:text-dev-text
                    hover:bg-dev-surface-hover
                    transition-colors
                    focus:outline-none focus:ring-2 focus:ring-dev-accent/50
                  "
                >
                  Not now
                </button>
                <button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="
                    flex-1 px-3 py-2 rounded-lg text-xs font-medium
                    bg-dev-accent text-white
                    hover:bg-dev-accent-hover
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors
                    focus:outline-none focus:ring-2 focus:ring-dev-accent/50
                  "
                >
                  {isInstalling ? 'Installing...' : 'Install'}
                </button>
              </div>

              {/* Platform-specific instructions */}
              <div className="mt-3 pt-3 border-t border-dev-border">
                <p className="text-xs text-dev-text-subtle">
                  {isMobile ? (
                    <>Look for "Add to Home Screen" in your browser menu.</>
                  ) : (
                    <>Installs as a desktop app for quick access.</>
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Button variant for settings/header
export function InstallButton(): React.JSX.Element | null {
  const { canInstall, isInstalled, installApp } = usePWAStore();
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async (): Promise<void> => {
    setIsInstalling(true);
    await installApp();
    setIsInstalling(false);
  };

  if (isInstalled) {
    return (
      <button
        disabled
        className="
          flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
          text-green-500 bg-green-500/10 border border-green-500/30
          cursor-default
        "
      >
        <Download className="w-4 h-4" aria-hidden="true" />
        <span>Installed</span>
      </button>
    );
  }

  if (!canInstall) {
    return null;
  }

  return (
    <button
      onClick={handleInstall}
      disabled={isInstalling}
      className="
        flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
        bg-dev-accent text-white
        hover:bg-dev-accent-hover
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors
        focus:outline-none focus:ring-2 focus:ring-dev-accent/50
      "
      title="Install app for offline access"
    >
      <Download className="w-4 h-4" aria-hidden="true" />
      <span>{isInstalling ? 'Installing...' : 'Install App'}</span>
    </button>
  );
}
