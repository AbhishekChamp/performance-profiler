import { useState, useRef, useCallback, createContext, useContext } from 'react';
import { motion } from 'framer-motion';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
  defaultTab: string;
  children: React.ReactNode;
  className?: string;
  onChange?: (tabId: string) => void;
}

export function Tabs({ defaultTab, children, className = '', onChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleSetActiveTab = useCallback((id: string) => {
    setActiveTab(id);
    onChange?.(id);
  }, [onChange]);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleSetActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

// Hook to use tabs context
function useTabs() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
}

interface TabListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabList({ children, className = '' }: TabListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    const list = listRef.current;
    if (!list) return;

    const tabs = Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const currentIndex = tabs.findIndex(tab => tab === document.activeElement);

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % tabs.length;
        tabs[nextIndex]?.focus();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        const prevIndex = currentIndex <= 0 ? tabs.length - 1 : currentIndex - 1;
        tabs[prevIndex]?.focus();
        break;
      case 'Home':
        event.preventDefault();
        tabs[0]?.focus();
        break;
      case 'End':
        event.preventDefault();
        tabs[tabs.length - 1]?.focus();
        break;
    }
  }, []);

  return (
    <div
      ref={listRef}
      role="tablist"
      onKeyDown={handleKeyDown}
      className={`flex items-center border-b border-dev-border ${className}`}
    >
      {children}
    </div>
  );
}

interface TabProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Tab({ id, children, disabled = false, className = '' }: TabProps) {
  const { activeTab, setActiveTab } = useTabs();
  const isActive = activeTab === id;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-disabled={disabled}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={() => setActiveTab(id)}
      className={`
        relative px-4 py-3 text-sm font-medium transition-colors
        focus:outline-none focus:ring-2 focus:ring-dev-accent/50 focus:ring-inset
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isActive 
          ? 'text-dev-accent' 
          : 'text-dev-text-muted hover:text-dev-text'
        }
        ${className}
      `}
    >
      {children}
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-dev-accent"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </button>
  );
}

interface TabPanelProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function TabPanel({ id, children, className = '' }: TabPanelProps) {
  const { activeTab } = useTabs();
  const isActive = activeTab === id;

  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      aria-labelledby={`tab-${id}`}
      tabIndex={0}
      className={`focus:outline-none focus:ring-2 focus:ring-dev-accent/50 ${className}`}
    >
      {children}
    </div>
  );
}
