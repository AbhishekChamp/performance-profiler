import { useEffect, useState } from 'react';
import { FileText, Image, Type, X } from 'lucide-react';
import type { WaterfallResource } from '@/core/waterfall/timingCalculator';

interface ResourcePreviewProps {
  resource: WaterfallResource;
  onClose: () => void;
}

/**
 * Preview component for images and fonts
 */
export function ResourcePreview({ resource, onClose }: ResourcePreviewProps): React.ReactNode {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPreview = async (): Promise<void> => {
      try {
        setLoading(true);
        
        if (resource.type === 'image') {
          // For images, just use the URL directly
          setContent(resource.url);
        } else if (resource.type === 'font') {
          // For fonts, create a preview text
          setContent('Aa Bb Cc 123');
        } else {
          setContent(null);
        }
      } catch (_err) {
        setError('Failed to load preview');
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
  }, [resource]);

  const isImage = resource.type === 'image';
  const isFont = resource.type === 'font';

  if (!isImage && !isFont) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-dev-surface border border-dev-border rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dev-border">
          <div className="flex items-center gap-3">
            {isImage ? (
              <Image className="w-5 h-5 text-dev-accent" />
            ) : (
              <Type className="w-5 h-5 text-dev-accent" />
            )}
            <div>
              <h3 className="font-medium text-dev-text">
                {resource.url.split('/').pop() ?? resource.url}
              </h3>
              <p className="text-xs text-dev-text-muted">
                {(resource.size / 1024).toFixed(1)} KB • {resource.type}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dev-surface-hover rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-dev-text-muted" />
          </button>
        </div>

        {/* Preview Content */}
        <div className="p-6 flex items-center justify-center min-h-[300px] bg-dev-bg">
          {loading ? (
            <div className="animate-pulse text-dev-text-muted">Loading preview...</div>
          ) : error !== null ? (
            <div className="text-dev-danger flex flex-col items-center gap-2">
              <FileText className="w-12 h-12 opacity-50" />
              <p>{error}</p>
            </div>
          ) : isImage ? (
            <img
              src={content ?? ''}
              alt="Resource preview"
              className="max-w-full max-h-[400px] object-contain rounded-lg"
              onError={() => setError('Failed to load image')}
            />
          ) : isFont ? (
            <div className="text-center">
              <p
                className="text-6xl mb-4"
                style={{
                  fontFamily: resource.url.includes('woff2') ? 'sans-serif' : 'serif',
                }}
              >
                {content}
              </p>
              <p className="text-sm text-dev-text-muted">
                Font preview (actual font may vary)
              </p>
            </div>
          ) : null}
        </div>

        {/* Details */}
        <div className="p-4 border-t border-dev-border bg-dev-surface/50">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-dev-text-muted">URL:</span>
              <p className="text-dev-text truncate" title={resource.url}>
                {resource.url}
              </p>
            </div>
            <div>
              <span className="text-dev-text-muted">Load Time:</span>
              <p className="text-dev-text">{Math.round(resource.duration)}ms</p>
            </div>
            <div>
              <span className="text-dev-text-muted">Priority:</span>
              <p className="text-dev-text capitalize">{resource.priority}</p>
            </div>
            <div>
              <span className="text-dev-text-muted">Blocking:</span>
              <p className={resource.isBlocking ? 'text-dev-danger' : 'text-dev-success-bright'}>
                {resource.isBlocking ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
