import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Check, 
  ChevronDown, 
  CircleDot, 
  Cloud, 
  CloudCog, 
  Github,
  Gitlab,
  Server,
  Triangle
} from 'lucide-react';
import type { CIPlatform, PlatformInfo } from '@/types/cicd';
import { PLATFORMS } from '@/core/ci-cd';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useRef } from 'react';

const ICONS: Record<string, React.ElementType> = {
  github: Github,
  gitlab: Gitlab,
  circleci: CircleDot,
  azure: Cloud,
  jenkins: Server,
  vercel: Triangle,
  netlify: CloudCog,
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
        {selectedPlatform ? (
          <div className="flex items-center gap-3">
            <>{((): React.ReactNode => {
              const Icon = ICONS[selectedPlatform.icon] ?? Server;
              return <Icon className="w-6 h-6 text-dev-accent" />;
            })()}</>
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
                const Icon = ICONS[platform.icon] ?? Server;
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

export function PlatformCard({ platform, isSelected, onClick }: {
  platform: PlatformInfo;
  isSelected: boolean;
  onClick: () => void;
}): React.ReactNode {
  const Icon = ICONS[platform.icon] ?? Server;
  
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        p-4 rounded-xl border text-left transition-all
        ${isSelected 
          ? 'bg-dev-accent/10 border-dev-accent' 
          : 'bg-dev-surface border-dev-border hover:border-dev-accent/50'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`
          p-2 rounded-lg
          ${isSelected ? 'bg-dev-accent/20' : 'bg-dev-surface-hover'}
        `}>
          <Icon className={`w-6 h-6 ${isSelected ? 'text-dev-accent' : 'text-dev-text'}`} />
        </div>
        <div className="flex-1">
          <h3 className={`font-medium ${isSelected ? 'text-dev-accent' : 'text-dev-text'}`}>
            {platform.name}
          </h3>
          <p className="text-sm text-dev-text-muted mt-1">{platform.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs px-2 py-0.5 bg-dev-surface-hover rounded text-dev-text-muted">
              {platform.supportedFormats.join(', ')}
            </span>
          </div>
        </div>
        {isSelected && (
          <Check className="w-5 h-5 text-dev-accent" />
        )}
      </div>
    </motion.button>
  );
}
