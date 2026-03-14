import { describe, it, expect, beforeEach } from 'vitest';
import { useBudgetStore, checkBudget } from '../budgetStore';

describe('BudgetStore', () => {
  beforeEach(() => {
    const store = useBudgetStore.getState();
    store.resetBudget();
  });

  it('should initialize with default budget', () => {
    const state = useBudgetStore.getState();
    
    expect(state.budget).toBeDefined();
    expect(state.budget.bundleSize).toBe(500 * 1024);
    expect(state.budget.domNodes).toBe(1500);
  });

  it('should update budget values', () => {
    const store = useBudgetStore.getState();
    
    store.setBudget({ bundleSize: 1000000 });
    
    expect(useBudgetStore.getState().budget.bundleSize).toBe(1000000);
  });

  it('should check budget status', () => {
    const store = useBudgetStore.getState();
    store.setBudget({ bundleSize: 1000000 });
    
    const { statuses } = checkBudget(store.budget, { bundleSize: 500000 });
    
    expect(statuses).toBeDefined();
    expect(statuses.length).toBeGreaterThan(0);
    
    const bundleStatus = statuses.find(s => s.metric === 'Bundle Size');
    expect(bundleStatus).toBeDefined();
    expect(bundleStatus?.status).toBe('pass');
  });

  it('should generate alerts when exceeding budget', () => {
    const store = useBudgetStore.getState();
    store.setBudget({ bundleSize: 500000 });
    
    const { alerts } = checkBudget(store.budget, { bundleSize: 750000 });
    
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].type).toBe('error');
  });

  it('should generate warning when approaching budget', () => {
    const store = useBudgetStore.getState();
    store.setBudget({ bundleSize: 500000 });
    
    const { statuses } = checkBudget(store.budget, { bundleSize: 550000 });
    
    // 550000/500000 = 110%, which should be warning (between 100-120%)
    const bundleStatus = statuses.find(s => s.metric === 'Bundle Size');
    expect(bundleStatus?.status).toBe('warning');
  });

  it('should reset budget to defaults', () => {
    const store = useBudgetStore.getState();
    
    store.setBudget({ bundleSize: 999 });
    store.resetBudget();
    
    expect(useBudgetStore.getState().budget.bundleSize).toBe(500 * 1024);
  });

  it('should export budget as JSON', () => {
    const store = useBudgetStore.getState();
    
    const exported = store.exportBudget();
    
    expect(exported).toContain('version');
    expect(exported).toContain('budget');
    expect(exported).toContain('exportedAt');
  });

  it('should import budget from JSON', () => {
    const store = useBudgetStore.getState();
    
    const json = JSON.stringify({
      version: '1.0',
      budget: { bundleSize: 2000000 },
      exportedAt: new Date().toISOString(),
    });
    
    store.importBudget(json);
    
    expect(useBudgetStore.getState().budget.bundleSize).toBe(2000000);
  });

  it('should check multiple metrics at once', () => {
    const store = useBudgetStore.getState();
    
    const { statuses } = checkBudget(store.budget, {
      bundleSize: 400000,  // under budget
      domNodes: 2000,      // over budget
    });
    
    expect(statuses.length).toBe(2);
  });
});
