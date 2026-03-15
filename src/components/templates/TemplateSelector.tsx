import { useRef, useState } from 'react';
import { useTemplateStore } from '@/stores/templateStore';
import type { ReportTemplate } from '@/types';
import { 
  AppWindow, 
  Check, 
  Download, 
  FileJson, 
  FileText, 
 
  LayoutDashboard,
  Megaphone,
  Package,
  Plus,
  Settings,
  ShoppingCart,
  Sparkles,
  Trash2,
  Upload,
  X,

} from 'lucide-react';
import toast from 'react-hot-toast';

const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingCart,
  AppWindow,
  FileText,
  LayoutDashboard,
  Megaphone,
  Package,
  Settings,
};

interface TemplateSelectorProps {
  onSelect?: (template: ReportTemplate) => void;
  showCustomOnly?: boolean;
}

export function TemplateSelector({ onSelect, showCustomOnly = false }: TemplateSelectorProps): React.ReactNode {
  const { 
    currentTemplate, 
    setTemplate, 
    customTemplates, 
    getAllTemplates,
    exportTemplate,
    importTemplate,
    deleteCustomTemplate,
  } = useTemplateStore();
  
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'builtin' | 'custom'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allTemplates = getAllTemplates();
  const builtinTemplates = allTemplates.filter(t => t.isBuiltIn && t.id !== 'default');
  const templates = showCustomOnly ? customTemplates : 
    activeTab === 'all' ? allTemplates :
    activeTab === 'builtin' ? builtinTemplates :
    customTemplates;

  const handleSelect = (template: ReportTemplate): void => {
    setTemplate(template);
    onSelect?.(template);
    toast.success(`Applied "${template.name}" template`, { duration: 2000 });
  };

  const handleExport = (template: ReportTemplate, e: React.MouseEvent): void => {
    e.stopPropagation();
    const json = exportTemplate(template.id);
    
    // Download as file
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-${template.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Template exported!', { duration: 2000 });
  };

  const handleImport = (): void => {
    const template = importTemplate(importJson);
    if (template) {
      setShowImportModal(false);
      setImportJson('');
      toast.success(`Imported "${template.name}" template`, { duration: 2000 });
    } else {
      toast.error('Failed to import template. Invalid format.');
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const template = importTemplate(content);
      if (template) {
        toast.success(`Imported "${template.name}" template`, { duration: 2000 });
      } else {
        toast.error('Failed to import template. Invalid format.');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = (template: ReportTemplate, e: React.MouseEvent): void => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
      deleteCustomTemplate(template.id);
      toast.success('Template deleted', { duration: 2000 });
    }
  };

  const TemplateCard = ({ template }: { template: ReportTemplate }): React.ReactNode => {
    const Icon = ICON_MAP[template.icon] ?? Settings;
    const isActive = currentTemplate.id === template.id;
    const isCustom = !template.isBuiltIn;

    return (
      <button
        onClick={() => handleSelect(template)}
        className={`
          relative w-full text-left p-4 rounded-xl border-2 transition-all duration-200
          ${isActive 
            ? 'border-dev-accent bg-dev-accent/5' 
            : 'border-dev-border bg-dev-surface hover:border-dev-accent/30 hover:bg-dev-surface-hover'
          }
        `}
      >
        {/* Active indicator */}
        {isActive && (
          <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-dev-accent flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}

        {/* Custom badge */}
        {isCustom && (
          <div className="absolute top-3 right-3">
            <span className="text-xs px-2 py-0.5 bg-dev-accent/10 text-dev-accent rounded-full">
              Custom
            </span>
          </div>
        )}

        <div className="flex items-start gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${template.color}20` }}
          >
            <Icon className="w-6 h-6" style={{ color: template.color }} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-dev-text truncate pr-8">
              {template.name}
            </h3>
            <p className="text-xs text-dev-text-muted mt-1 line-clamp-2">
              {template.description}
            </p>
            
            {/* Analyzer badges */}
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.entries(template.options)
                .filter(([, enabled]) => enabled)
                .slice(0, 4)
                .map(([key]) => (
                  <span 
                    key={key}
                    className="text-[10px] px-1.5 py-0.5 bg-dev-bg rounded text-dev-text-subtle"
                  >
                    {key.replace('include', '')}
                  </span>
                ))}
              {Object.values(template.options).filter(Boolean).length > 4 && (
                <span className="text-[10px] px-1.5 py-0.5 text-dev-text-subtle">
                  +{Object.values(template.options).filter(Boolean).length - 4}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-dev-border">
          <button
            onClick={(e) => handleExport(template, e)}
            className="p-1.5 rounded-md text-dev-text-subtle hover:text-dev-text hover:bg-dev-surface-hover transition-colors"
            title="Export template"
          >
            <Download className="w-4 h-4" />
          </button>
          
          {isCustom && (
            <button
              onClick={(e) => handleDelete(template, e)}
              className="p-1.5 rounded-md text-dev-text-subtle hover:text-dev-danger hover:bg-dev-danger/10 transition-colors"
              title="Delete template"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="w-full max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-dev-text">Analysis Templates</h2>
          <p className="text-sm text-dev-text-muted">
            Choose a preset configuration or create your own
          </p>
        </div>
        
        {!showCustomOnly && (
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-dev-text-muted hover:text-dev-text hover:bg-dev-surface-hover transition-colors"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-dev-accent text-white hover:bg-dev-accent-hover transition-colors"
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      {!showCustomOnly && (
        <div className="flex items-center gap-1 mb-4 p-1 bg-dev-surface rounded-lg border border-dev-border">
          {(['all', 'builtin', 'custom'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                flex-1 px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors
                ${activeTab === tab
                  ? 'bg-dev-accent text-white'
                  : 'text-dev-text-muted hover:text-dev-text hover:bg-dev-surface-hover'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Current template indicator */}
      <div className="flex items-center gap-2 mb-4 p-3 bg-dev-accent/5 border border-dev-accent/20 rounded-lg">
        <Sparkles className="w-4 h-4 text-dev-accent" />
        <span className="text-sm text-dev-text">
          Active: <strong>{currentTemplate.name}</strong>
        </span>
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>

      {/* Empty state */}
      {templates.length === 0 && (
        <div className="text-center py-12">
          <FileJson className="w-12 h-12 text-dev-text-subtle mx-auto mb-4" />
          <p className="text-dev-text-muted">No templates found</p>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-dev-surface rounded-xl border border-dev-border shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dev-text">Import Template</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-2 rounded-lg text-dev-text-subtle hover:text-dev-text hover:bg-dev-surface-hover"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-dev-text-muted mb-4">
              Paste your template JSON below or import from a file.
            </p>
            
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder="Paste template JSON here..."
              className="w-full h-48 p-3 rounded-lg bg-dev-bg border border-dev-border text-dev-text text-sm font-mono resize-none focus:outline-none focus:border-dev-accent"
            />
            
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-dev-text-muted hover:text-dev-text transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!importJson.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-dev-accent text-white hover:bg-dev-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for sidebar/settings
export function TemplateSelectorCompact(): React.ReactNode {
  const { currentTemplate, setTemplate, getAllTemplates } = useTemplateStore();
  const [isOpen, setIsOpen] = useState(false);
  
  const templates = getAllTemplates();
  const Icon = ICON_MAP[currentTemplate.icon] ?? Settings;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-2 w-full px-3 py-2 rounded-lg
          bg-dev-surface border border-dev-border
          text-dev-text hover:bg-dev-surface-hover transition-colors
          focus:outline-none focus:ring-2 focus:ring-dev-accent/50
        "
      >
        <Icon className="w-4 h-4" style={{ color: currentTemplate.color }} />
        <span className="flex-1 text-left text-sm truncate">{currentTemplate.name}</span>
        <span className="text-xs text-dev-text-subtle">
          {currentTemplate.isBuiltIn ? 'Built-in' : 'Custom'}
        </span>
      </button>

      {isOpen && (
        <div className="
          absolute top-full left-0 right-0 mt-1 z-50
          bg-dev-surface border border-dev-border rounded-lg shadow-xl
          max-h-64 overflow-y-auto
        ">
          {templates.map((template) => {
            const TIcon = ICON_MAP[template.icon] ?? Settings;
            return (
              <button
                key={template.id}
                onClick={() => {
                  setTemplate(template);
                  setIsOpen(false);
                  toast.success(`Applied "${template.name}"`, { duration: 1500 });
                }}
                className={`
                  flex items-center gap-2 w-full px-3 py-2 text-left
                  hover:bg-dev-surface-hover transition-colors
                  ${currentTemplate.id === template.id ? 'bg-dev-accent/10' : ''}
                `}
              >
                <TIcon className="w-4 h-4" style={{ color: template.color }} />
                <span className="flex-1 text-sm truncate">{template.name}</span>
                {currentTemplate.id === template.id && (
                  <Check className="w-4 h-4 text-dev-accent" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
