import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { BudgetAlert, BudgetStatus, PerformanceBudget } from '@/types';
import { get, set } from 'idb-keyval';
import { logError } from '@/utils/errorHandler';

interface BudgetState {
  // Budget configuration
  budget: PerformanceBudget;
  
  // Actions
  setBudget: (budget: Partial<PerformanceBudget>) => void;
  resetBudget: () => void;
  exportBudget: () => string;
  importBudget: (json: string) => void;
}

const defaultBudget: PerformanceBudget = {
  bundleSize: 500 * 1024, // 500 KB
  imageSize: 2 * 1024 * 1024, // 2 MB
  cssSize: 100 * 1024, // 100 KB
  jsSize: 500 * 1024, // 500 KB
  domNodes: 1500,
  maxDepth: 32,
  unusedCSS: 50, // 50%
  overallScore: 70,
};

// Custom storage using idb-keyval for IndexedDB
const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await get(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await set(name, undefined);
  },
};

export const useBudgetStore = create<BudgetState>()(
  devtools(
    persist(
      (setState, getState) => ({
        // Initial state
        budget: defaultBudget,

        // Actions
        setBudget: (budget) => {
          setState((state) => ({
            budget: { ...state.budget, ...budget },
          }));
        },

        resetBudget: () => {
          setState({
            budget: defaultBudget,
          });
        },

        exportBudget: (): string => {
          const { budget } = getState();
          return JSON.stringify({
            version: '1.0',
            budget,
            exportedAt: new Date().toISOString(),
          }, null, 2);
        },

        importBudget: (json): void => {
          try {
            const data = JSON.parse(json) as { budget?: Partial<PerformanceBudget> };
            if (data.budget != null) {
              setState({ budget: { ...defaultBudget, ...data.budget } });
            }
          } catch (error) {
            logError(error instanceof Error ? error : new Error('Failed to import budget'), {
              component: 'BudgetStore',
              action: 'importBudget',
            });
          }
        },
      }),
      {
        name: 'PerformanceBudget',
        storage: idbStorage as never,
        partialize: (state) => ({ budget: state.budget }),
      }
    ),
    { name: 'BudgetStore' }
  )
);

// Selectors
export const selectBudget = (state: BudgetState): PerformanceBudget => state.budget;

// Pure function to check budget against metrics - returns statuses and alerts without modifying state
export function checkBudget(
  budget: PerformanceBudget,
  metrics: {
    bundleSize?: number;
    imageSize?: number;
    cssSize?: number;
    jsSize?: number;
    domNodes?: number;
    maxDepth?: number;
    unusedCSS?: number;
    overallScore?: number;
  }
): { statuses: BudgetStatus[]; alerts: BudgetAlert[] } {
  const statuses: BudgetStatus[] = [];
  const alerts: BudgetAlert[] = [];

  const checks = [
    { key: 'bundleSize', label: 'Bundle Size', value: metrics.bundleSize, limit: budget.bundleSize },
    { key: 'imageSize', label: 'Image Size', value: metrics.imageSize, limit: budget.imageSize },
    { key: 'cssSize', label: 'CSS Size', value: metrics.cssSize, limit: budget.cssSize },
    { key: 'jsSize', label: 'JS Size', value: metrics.jsSize, limit: budget.jsSize },
    { key: 'domNodes', label: 'DOM Nodes', value: metrics.domNodes, limit: budget.domNodes },
    { key: 'maxDepth', label: 'Max Depth', value: metrics.maxDepth, limit: budget.maxDepth },
    { key: 'unusedCSS', label: 'Unused CSS', value: metrics.unusedCSS, limit: budget.unusedCSS },
    { key: 'overallScore', label: 'Overall Score', value: metrics.overallScore, limit: budget.overallScore, inverse: true },
  ];

  for (const check of checks) {
    if (check.value === undefined) continue;

    const percentage = check.inverse === true
      ? (check.value / check.limit) * 100
      : (check.value / check.limit) * 100;

    let status: BudgetStatus['status'];
    if (check.inverse === true) {
      status = percentage >= 100 ? 'pass' : percentage >= 80 ? 'warning' : 'fail';
    } else {
      status = percentage <= 100 ? 'pass' : percentage <= 120 ? 'warning' : 'fail';
    }

    statuses.push({
      metric: check.label,
      limit: check.limit,
      current: check.value,
      percentage: Math.round(percentage),
      status,
    });

    // Generate alerts
    if (status === 'fail') {
      alerts.push({
        type: 'error',
        metric: check.label,
        message: `${check.label} exceeds budget (${check.value} > ${check.limit})`,
        current: check.value,
        limit: check.limit,
      });
    } else if (status === 'warning') {
      alerts.push({
        type: 'warning',
        metric: check.label,
        message: `${check.label} approaching budget limit`,
        current: check.value,
        limit: check.limit,
      });
    }
  }

  return { statuses, alerts };
}
