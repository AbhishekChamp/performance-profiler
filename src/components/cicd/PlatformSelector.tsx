import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Check, 
  ChevronDown, 
  FileCode,
  Server
} from 'lucide-react';
import type { CIPlatform, PlatformInfo } from '@/types/cicd';
import { PLATFORMS } from '@/core/ci-cd';
import { useClickOutside } from '@/hooks/useClickOutside';

// Platform icons as SVG components
const PlatformIcons: Record<string, React.FC<{ className?: string }>> = {
  github: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  ),
  gitlab: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.955 13.587l-1.342-4.135-2.664-8.189c-.135-.423-.73-.423-.867 0L16.418 9.45H7.582L4.919 1.263C4.783.84 4.187.84 4.05 1.26L1.386 9.45.044 13.587c-.121.374.013.79.332 1.024l11.323 8.23 11.318-8.228c.322-.235.454-.65.338-1.026z"/>
    </svg>
  ),
  circleci: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4.909a7.09 7.09 0 110 14.182 7.09 7.09 0 010-14.182zm0 2.909a4.182 4.182 0 100 8.364 4.182 4.182 0 000-8.364z"/>
    </svg>
  ),
  azure: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.483 21.3H24L14.025 4.013l-3.038 8.347 5.836 6.938L5.483 21.3zM13.23 2.7L6.105 8.677 0 19.253h5.505l8.435-9.695L13.23 2.7z"/>
    </svg>
  ),
  jenkins: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.286c1.514 0 2.914.455 4.09 1.234-.396.175-.79.396-1.095.67a5.587 5.587 0 00-2.995-.86 5.6 5.6 0 00-2.995.86c-.305-.274-.7-.495-1.095-.67A6.728 6.728 0 0112 2.286z"/>
    </svg>
  ),
  vercel: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 22.525H0l12-21.05 12 21.05z"/>
    </svg>
  ),
  netlify: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.49 19.04h-.23L6.04 18l4.26-4.23 1.64 1.64a.68.68 0 000-.96l-6.14-6.13a.68.68 0 00-.96 0l-6.14 6.13a.68.68 0 000 .96l1.64 1.64 2.82-2.82a.68.68 0 10-.96-.96L.68 17.04l-1.04 2.05 2.05-1.04 2.05 1.04-1.04 2.05 2.05-1.04 1.74 1.74zM17.51 4.96h.23l.22 1.04-4.26 4.23-1.64-1.64a.68.68 0 000 .96l6.14 6.13a.68.68 0 00.96 0l6.14-6.13a.68.68 0 000-.96l-1.64-1.64-2.82 2.82a.68.68 0 10.96.96l2.82-2.82 2.05 1.04-1.04-2.05-2.05 1.04-1.04-2.05 2.05-1.04-1.74-1.74z"/>
    </svg>
  ),
};

interface PlatformSelectorProps {
  selected: CIPlatform | null;
  onSelect: (platform: CIPlatform) => void;
}

export function PlatformSelector({ selected, onSelect }: PlatformSelectorProps): React.ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useClickOutside(containerRef, () => setIsOpen(false));
  
  const selectedPlatform = PLATFORMS.find(p => p.id === selected);
  const SelectedIcon = selectedPlatform ? (PlatformIcons[selectedPlatform.icon] ?? Server) : null;
  
  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between gap-3 px-4 py-3
          bg-dev-surface border border-dev-border rounded-xl
          hover:border-dev-accent/50 transition-colors
          ${isOpen ? 'border-dev-accent ring-2 ring-dev-accent/20' : ''}
        `}
      >
        {selectedPlatform && SelectedIcon ? (
          <div className="flex items-center gap-3">
            <SelectedIcon className="w-6 h-6 text-dev-accent" />
            <div className="text-left">
              <p className="font-medium text-dev-text">{selectedPlatform.name}</p>
              <p className="text-sm text-dev-text-muted">{selectedPlatform.description}</p>
            </div>
          </div>
        ) : (
          <span className="text-dev-text-muted">Select a CI/CD platform...</span>
        )}
        <ChevronDown 
          className={`w-5 h-5 text-dev-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 top-full left-0 right-0 mt-2 bg-dev-surface border border-dev-border 
                       rounded-xl shadow-xl overflow-hidden"
          >
            <div className="p-2 space-y-1 max-h-80 overflow-y-auto">
              {PLATFORMS.map(platform => {
                const Icon = PlatformIcons[platform.icon] ?? Server;
                const isSelected = selected === platform.id;
                
                return (
                  <button
                    key={platform.id}
                    onClick={() => {
                      onSelect(platform.id);
                      setIsOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left
                      transition-colors
                      ${isSelected 
                        ? 'bg-dev-accent/10 border border-dev-accent/30' 
                        : 'hover:bg-dev-surface-hover'
                      }
                    `}
                  >
                    <Icon className={`w-6 h-6 ${isSelected ? 'text-dev-accent' : 'text-dev-text-muted'}`} />
                    <div className="flex-1">
                      <p className={`font-medium ${isSelected ? 'text-dev-accent' : 'text-dev-text'}`}>
                        {platform.name}
                      </p>
                      <p className="text-sm text-dev-text-muted">{platform.description}</p>
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-dev-accent" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface PlatformCardProps {
  platform: PlatformInfo;
  isSelected: boolean;
  onClick: () => void;
}

export function PlatformCard({ platform, isSelected, onClick }: PlatformCardProps): React.ReactNode {
  const Icon = PlatformIcons[platform.icon] ?? FileCode;
  
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative p-5 rounded-xl border-2 text-left transition-all duration-300
        ${isSelected 
          ? 'border-dev-accent bg-dev-accent/5 shadow-lg shadow-dev-accent/10' 
          : 'border-dev-border bg-dev-surface hover:border-dev-accent/30'
        }
      `}
    >
      <div className="flex items-start gap-4">
        <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center transition-colors
          ${isSelected ? 'bg-dev-accent/20' : 'bg-dev-bg'}
        `}>
          <Icon className={`
            w-6 h-6
            ${isSelected ? 'text-dev-accent' : 'text-dev-text'}
          `} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-dev-text">{platform.name}</h3>
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-5 h-5 rounded-full bg-dev-accent flex items-center justify-center"
              >
                <Check size={12} className="text-white" />
              </motion.div>
            )}
          </div>
          <p className="text-sm text-dev-text-muted mt-1">{platform.description}</p>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs px-2 py-1 rounded-md bg-dev-bg text-dev-text-muted">
              {platform.supportedFormats.join(', ')}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
