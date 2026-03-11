import { Wifi, WifiOff, RefreshCw, Database } from 'lucide-react';
import { usePWAStore } from '@/stores/pwaStore';
import { useEffect, useState } from 'react';
import { getStorageStats, formatStorageSize } from '@/utils/offlineStorage';

export function OfflineIndicator() {
  const { isOnline, wasOffline } = usePWAStore();
  const [storageStats, setStorageStats] = useState<{
    totalReports: number;
    totalSize: number;
    lastSync: number | null;
  } | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Load storage stats
  useEffect(() => {
    const loadStats = async () => {
      const stats = await getStorageStats();
      setStorageStats(stats);
    };

    loadStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Format last sync time
  const getLastSyncText = () => {
    if (!storageStats?.lastSync) return 'Never synced';
    
    // eslint-disable-next-line react-hooks/purity
    const diff = Date.now() - storageStats.lastSync;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `Synced ${days}d ago`;
    if (hours > 0) return `Synced ${hours}h ago`;
    if (minutes > 0) return `Synced ${minutes}m ago`;
    return 'Just synced';
  };

  // Don't show anything if online and no stored data
  if (isOnline && !wasOffline && !storageStats?.totalReports) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
          transition-all duration-200
          ${!isOnline 
            ? 'bg-red-500/10 text-red-500 border border-red-500/30' 
            : wasOffline
              ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/30'
              : 'bg-green-500/10 text-green-600 border border-green-500/30'
          }
          hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-dev-surface focus:ring-current
        `}
        aria-label={!isOnline ? 'You are offline' : wasOffline ? 'Reconnected' : 'Online'}
        aria-expanded={showDetails}
      >
        {!isOnline ? (
          <>
            <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Offline</span>
          </>
        ) : wasOffline ? (
          <>
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reconnected</span>
          </>
        ) : (
          <>
            <Wifi className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Online</span>
          </>
        )}
        
        {storageStats && storageStats.totalReports > 0 && (
          <>
            <span className="mx-1">•</span>
            <Database className="w-3 h-3" aria-hidden="true" />
            <span>{storageStats.totalReports}</span>
          </>
        )}
      </button>

      {/* Details dropdown */}
      {showDetails && (
        <div className="
          absolute top-full right-0 mt-2 w-64
          bg-dev-surface border border-dev-border rounded-lg shadow-lg
          p-3 z-50
        ">
          <div className="space-y-2">
            {/* Connection status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-dev-text-muted">Status</span>
              <span className={`text-sm font-medium ${
                isOnline ? 'text-green-500' : 'text-red-500'
              }`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Stored reports */}
            {storageStats && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dev-text-muted">Stored Reports</span>
                  <span className="text-sm font-medium text-dev-text">
                    {storageStats.totalReports}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dev-text-muted">Storage Used</span>
                  <span className="text-sm font-medium text-dev-text">
                    {formatStorageSize(storageStats.totalSize)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dev-text-muted">Last Sync</span>
                  <span className="text-sm font-medium text-dev-text">
                    {getLastSyncText()}
                  </span>
                </div>
              </>
            )}

            {/* Offline capability note */}
            {!isOnline && (
              <div className="mt-2 pt-2 border-t border-dev-border">
                <p className="text-xs text-dev-text-subtle">
                  You can view saved reports while offline. Analysis requires an internet connection.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
