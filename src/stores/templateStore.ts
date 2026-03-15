import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { get, set } from 'idb-keyval';
import type { ReportTemplate, TemplateDetectionResult, UploadedFile } from '@/types';
import { BUILTIN_TEMPLATES, DEFAULT_TEMPLATE, getTemplateById } from '@/core/templates/presets';
import { logError } from '@/utils/errorHandler';

interface TemplateState {
  // Current template
  currentTemplate: ReportTemplate;
  
  // Custom templates
  customTemplates: ReportTemplate[];
  
  // Auto-detection
  lastDetectedTemplate: TemplateDetectionResult | null;
  autoDetectEnabled: boolean;
  
  // Actions
  setTemplate: (template: ReportTemplate) => void;
  setTemplateById: (id: string) => void;
  addCustomTemplate: (template: Omit<ReportTemplate, 'isBuiltIn' | 'createdAt'>) => void;
  updateCustomTemplate: (id: string, updates: Partial<ReportTemplate>) => void;
  deleteCustomTemplate: (id: string) => void;
  exportTemplate: (id: string) => string;
  importTemplate: (json: string) => ReportTemplate | null;
  detectTemplate: (files: UploadedFile[]) => TemplateDetectionResult;
  setAutoDetectEnabled: (enabled: boolean) => void;
  resetToDefault: () => void;
  
  // Getters
  getAllTemplates: () => ReportTemplate[];
  getCustomTemplates: () => ReportTemplate[];
}

// Custom storage using idb-keyval
const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await get(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
};

export const useTemplateStore = create<TemplateState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentTemplate: DEFAULT_TEMPLATE,
        customTemplates: [],
        lastDetectedTemplate: null,
        autoDetectEnabled: true,

        // Set current template
        setTemplate: (template) => {
          set({ currentTemplate: template });
        },

        // Set template by ID
        setTemplateById: (id) => {
          const template = getTemplateById(id) ?? 
            get().customTemplates.find(t => t.id === id);
          
          if (template) {
            set({ currentTemplate: template });
          }
        },

        // Add custom template
        addCustomTemplate: (templateData) => {
          const newTemplate: ReportTemplate = {
            ...templateData,
            isBuiltIn: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          set((state) => ({
            customTemplates: [...state.customTemplates, newTemplate],
          }));
        },

        // Update custom template
        updateCustomTemplate: (id, updates) => {
          set((state) => ({
            customTemplates: state.customTemplates.map((t) =>
              t.id === id
                ? { ...t, ...updates, updatedAt: Date.now() }
                : t
            ),
          }));
        },

        // Delete custom template
        deleteCustomTemplate: (id) => {
          set((state) => ({
            customTemplates: state.customTemplates.filter((t) => t.id !== id),
            // Reset to default if current template was deleted
            currentTemplate:
              state.currentTemplate.id === id
                ? DEFAULT_TEMPLATE
                : state.currentTemplate,
          }));
        },

        // Export template as JSON
        exportTemplate: (id) => {
          const template =
            getTemplateById(id) ??
            get().customTemplates.find((t) => t.id === id);

          if (!template) return '';

          const exportData = {
            ...template,
            exportedAt: Date.now(),
            version: '1.0',
          };

          return JSON.stringify(exportData, null, 2);
        },

        // Import template from JSON
        importTemplate: (json) => {
          try {
            const data = JSON.parse(json);

            // Validate required fields
            if (
              typeof data.id !== 'string' ||
              typeof data.name !== 'string' ||
              data.options === undefined ||
              data.options === null
            ) {
              throw new Error('Invalid template format');
            }

            // Generate new ID to avoid conflicts
            const newId = `custom-${Date.now()}`;
            const importedTemplate: ReportTemplate = {
              ...data,
              id: newId,
              isBuiltIn: false,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };

            set((state) => ({
              customTemplates: [...state.customTemplates, importedTemplate],
            }));

            return importedTemplate;
          } catch (error) {
            logError(error instanceof Error ? error : new Error('Failed to import template'), {
              component: 'TemplateStore',
              action: 'importTemplate',
            });
            return null;
          }
        },

        // Detect template based on uploaded files
        detectTemplate: (files) => {
          const fileNames = files.map((f) => f.name.toLowerCase());
          const fileExtensions = fileNames.map((f) => {
            const parts = f.split('.');
            return parts[parts.length - 1];
          });

          const scores: Record<string, { score: number; reasons: string[] }> = {};

          // Score each template
          BUILTIN_TEMPLATES.forEach((template) => {
            scores[template.id] = { score: 0, reasons: [] };

            // Check suggested file patterns
            template.suggestedFiles.forEach((pattern) => {
              const regex = new RegExp(pattern.replace('*', '.*'));
              const matches = fileNames.filter((f) => regex.test(f));
              if (matches.length > 0) {
                scores[template.id].score += matches.length * 10;
                scores[template.id].reasons.push(
                  `Found ${matches.length} matching ${pattern} files`
                );
              }
            });

            // Category-specific checks
            switch (template.category) {
              case 'ecommerce':
                if (fileNames.some((f) => f.includes('product') || f.includes('cart'))) {
                  scores[template.id].score += 20;
                  scores[template.id].reasons.push('E-commerce file patterns detected');
                }
                if (fileNames.some((f) => f.includes('shopify') || f.includes('woocommerce'))) {
                  scores[template.id].score += 30;
                  scores[template.id].reasons.push('E-commerce platform files found');
                }
                break;

              case 'spa':
                if (fileExtensions.includes('tsx') || fileExtensions.includes('jsx')) {
                  scores[template.id].score += 20;
                  scores[template.id].reasons.push('React/JSX files detected');
                }
                if (fileNames.some((f) => f.includes('router') || f.includes('route'))) {
                  scores[template.id].score += 15;
                  scores[template.id].reasons.push('Routing configuration found');
                }
                if (fileNames.includes('vite.config.ts') || fileNames.includes('vite.config.js')) {
                  scores[template.id].score += 10;
                  scores[template.id].reasons.push('Vite configuration found');
                }
                break;

              case 'blog':
                if (fileExtensions.includes('md') || fileExtensions.includes('mdx')) {
                  scores[template.id].score += 30;
                  scores[template.id].reasons.push('Markdown content files detected');
                }
                if (fileNames.some((f) => f.includes('blog') || f.includes('post'))) {
                  scores[template.id].score += 20;
                  scores[template.id].reasons.push('Blog-related files found');
                }
                break;

              case 'dashboard':
                if (fileNames.some((f) => f.includes('dashboard') || f.includes('chart') || f.includes('graph'))) {
                  scores[template.id].score += 25;
                  scores[template.id].reasons.push('Dashboard/chart files detected');
                }
                if (fileNames.some((f) => f.includes('data') || f.includes('table'))) {
                  scores[template.id].score += 15;
                  scores[template.id].reasons.push('Data visualization patterns found');
                }
                break;

              case 'landing':
                if (fileNames.some((f) => f.includes('landing') || f.includes('hero'))) {
                  scores[template.id].score += 25;
                  scores[template.id].reasons.push('Landing page patterns detected');
                }
                if (fileNames.includes('index.html') && files.length < 10) {
                  scores[template.id].score += 15;
                  scores[template.id].reasons.push('Simple HTML structure (typical for landing pages)');
                }
                break;

              case 'library':
                if (fileNames.includes('package.json')) {
                  scores[template.id].score += 20;
                  scores[template.id].reasons.push('Package.json found');
                }
                if (fileNames.some((f) => f.includes('rollup') || f.includes('tsup') || f.includes('esbuild'))) {
                  scores[template.id].score += 20;
                  scores[template.id].reasons.push('Library build tools detected');
                }
                if (!fileNames.some((f) => f.endsWith('.html'))) {
                  scores[template.id].score += 10;
                  scores[template.id].reasons.push('No HTML files (typical for libraries)');
                }
                break;
            }
          });

          // Find highest scoring template
          let bestMatch = { templateId: 'default', score: 0, reasons: [] as string[] };
          
          Object.entries(scores).forEach(([id, data]) => {
            if (data.score > bestMatch.score) {
              bestMatch = { templateId: id, score: data.score, reasons: data.reasons };
            }
          });

          // Calculate confidence (0-1)
          const confidence = Math.min(bestMatch.score / 100, 1);

          const result: TemplateDetectionResult = {
            templateId: bestMatch.templateId,
            confidence,
            reasons: bestMatch.reasons,
          };

          set({ lastDetectedTemplate: result });
          return result;
        },

        // Toggle auto-detection
        setAutoDetectEnabled: (enabled) => {
          set({ autoDetectEnabled: enabled });
        },

        // Reset to default template
        resetToDefault: () => {
          set({
            currentTemplate: DEFAULT_TEMPLATE,
            lastDetectedTemplate: null,
          });
        },

        // Get all templates (built-in + custom)
        getAllTemplates: () => {
          return [DEFAULT_TEMPLATE, ...BUILTIN_TEMPLATES, ...get().customTemplates];
        },

        // Get only custom templates
        getCustomTemplates: () => {
          return get().customTemplates;
        },
      }),
      {
        name: 'TemplateStore',
        storage: idbStorage as never,
        partialize: (state) => ({
          currentTemplate: state.currentTemplate,
          customTemplates: state.customTemplates,
          autoDetectEnabled: state.autoDetectEnabled,
        }),
      }
    ),
    { name: 'TemplateStore' }
  )
);

// Selectors
export const selectCurrentTemplate = (state: TemplateState): ReportTemplate =>
  state.currentTemplate;
export const selectCustomTemplates = (state: TemplateState): ReportTemplate[] =>
  state.customTemplates;
export const selectAllTemplates = (state: TemplateState): ReportTemplate[] =>
  state.getAllTemplates();
export const selectAutoDetectEnabled = (state: TemplateState): boolean =>
  state.autoDetectEnabled;
export const selectLastDetectedTemplate = (state: TemplateState): TemplateDetectionResult | null =>
  state.lastDetectedTemplate;
