import { useEffect, useState, useCallback, useMemo } from 'react';
import { Share2, Copy, CheckCircle } from 'lucide-react';
import type { WaterfallData } from '@/core/waterfall/timingCalculator';
import toast from 'react-hot-toast';

interface WaterfallShareProps {
  data: WaterfallData;
}

/**
 * Component for sharing waterfall view via URL hash
 */
export function WaterfallShare({ data }: WaterfallShareProps): JSX.Element {
  const [copied, setCopied] = useState(false);
  
  const shareUrl = useMemo(() => {
    // Generate shareable URL with hash
    const params = new URLSearchParams({
      view: 'waterfall',
      totalDuration: String(Math.round(data.totalDuration)),
      resourceCount: String(data.resources.length),
    });

    // Add resource filters if any
    const resourceTypes = [...new Set(data.resources.map(r => r.type))];
    params.set('types', resourceTypes.join(','));

    const url = new URL(window.location.href);
    url.hash = params.toString();
    return url.toString();
  }, [data]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  }, [shareUrl]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Performance Waterfall',
          text: `Waterfall analysis with ${data.resources.length} resources`,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  }, [shareUrl, data.resources.length, handleCopyLink]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleShare}
        className="dev-button-secondary flex items-center gap-2 text-sm"
        title="Share waterfall view"
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>
      <button
        onClick={handleCopyLink}
        className="dev-button-secondary flex items-center gap-2 text-sm"
        title="Copy link to clipboard"
      >
        {copied ? (
          <CheckCircle className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
    </div>
  );
}

/**
 * Hook to parse waterfall view from URL hash
 */
export function useWaterfallShare(): {
  view: string;
  filters: string[];
} | null {
  const [sharedView, setSharedView] = useState<{
    view: string;
    filters: string[];
  } | null>(null);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash.length === 0) return;

    const params = new URLSearchParams(hash);
    const view = params.get('view');
    
    if (view === 'waterfall') {
      const types = params.get('types');
      setSharedView({
        view,
        filters: types !== null && types.length > 0 ? types.split(',') : [],
      });
    }
  }, []);

  return sharedView;
}
