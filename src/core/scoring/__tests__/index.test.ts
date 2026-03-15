import { describe, expect, it } from 'vitest';
import {
  calculatePerformanceScore,
  calculateRenderRisk,
  getScoreColor,
  getScoreLabel,
} from '../index';
import type { BundleAnalysis, PerformanceScore } from '@/types';

describe('calculatePerformanceScore', () => {
  it('should return default score when no analysis provided', () => {
    const score = calculatePerformanceScore();
    expect(score.overall).toBe(50);
  });

  it('should calculate weighted score correctly', () => {
    const bundle: BundleAnalysis = {
      totalSize: 500 * 1024,
      gzippedSize: 200 * 1024,
      moduleCount: 10,
      largestModules: [],
      duplicateLibraries: [],
      vendorSize: 100 * 1024,
      vendorPercentage: 20,
      modules: [],
    };

    const score = calculatePerformanceScore(bundle);
    expect(score.overall).toBeGreaterThan(0);
    expect(score.overall).toBeLessThanOrEqual(100);
    expect(score.bundle).toBeDefined();
  });

  it('should penalize large bundle sizes', () => {
    const smallBundle: BundleAnalysis = {
      totalSize: 500 * 1024,
      gzippedSize: 200 * 1024,
      moduleCount: 10,
      largestModules: [],
      duplicateLibraries: [],
      vendorSize: 100 * 1024,
      vendorPercentage: 20,
      modules: [],
    };

    const largeBundle: BundleAnalysis = {
      totalSize: 5000 * 1024,
      gzippedSize: 2000 * 1024,
      moduleCount: 100,
      largestModules: [],
      duplicateLibraries: [],
      vendorSize: 3000 * 1024,
      vendorPercentage: 60,
      modules: [],
    };

    const smallScore = calculatePerformanceScore(smallBundle);
    const largeScore = calculatePerformanceScore(largeBundle);

    expect(smallScore.bundle).toBeGreaterThan(largeScore.bundle);
  });

  it('should handle missing categories gracefully', () => {
    const score = calculatePerformanceScore(undefined, undefined, undefined, undefined, []);
    expect(score.overall).toBeGreaterThan(0);
  });
});

describe('calculateRenderRisk', () => {
  it('should return low risk for good scores', () => {
    const score: PerformanceScore = {
      overall: 85,
      bundle: 90,
      dom: 80,
      css: 85,
      assets: 90,
      javascript: 85,
    };

    const risk = calculateRenderRisk(score);
    expect(risk.level).toBe('low');
  });

  it('should return high risk for poor scores', () => {
    const score: PerformanceScore = {
      overall: 40,
      bundle: 30,
      dom: 50,
      css: 45,
      assets: 40,
      javascript: 35,
    };

    const risk = calculateRenderRisk(score);
    expect(risk.level).toBe('high');
  });

  it('should identify bundle size risk', () => {
    const score: PerformanceScore = {
      overall: 70,
      bundle: 60,
      dom: 80,
      css: 80,
      assets: 80,
      javascript: 80,
    };

    const bundle: BundleAnalysis = {
      totalSize: 3000 * 1024,
      gzippedSize: 1000 * 1024,
      moduleCount: 50,
      largestModules: [],
      duplicateLibraries: [],
      vendorSize: 2000 * 1024,
      vendorPercentage: 66,
      modules: [],
    };

    const risk = calculateRenderRisk(score, bundle);
    expect(risk.reasons.some((r) => r.includes('bundle'))).toBe(true);
  });
});

describe('getScoreColor', () => {
  it('should return green for excellent scores', () => {
    expect(getScoreColor(95)).toBe('#3fb950');
    expect(getScoreColor(90)).toBe('#3fb950');
  });

  it('should return yellow for good scores', () => {
    expect(getScoreColor(75)).toBe('#d29922');
    expect(getScoreColor(70)).toBe('#d29922');
  });

  it('should return red for poor scores', () => {
    expect(getScoreColor(40)).toBe('#da3633');
    expect(getScoreColor(20)).toBe('#da3633');
  });
});

describe('getScoreLabel', () => {
  it('should return "Excellent" for scores >= 90', () => {
    expect(getScoreLabel(95)).toBe('Excellent');
    expect(getScoreLabel(90)).toBe('Excellent');
  });

  it('should return "Good" for scores >= 70', () => {
    expect(getScoreLabel(75)).toBe('Good');
    expect(getScoreLabel(70)).toBe('Good');
  });

  it('should return "Fair" for scores >= 50', () => {
    expect(getScoreLabel(60)).toBe('Fair');
    expect(getScoreLabel(50)).toBe('Fair');
  });

  it('should return "Poor" for scores < 50', () => {
    expect(getScoreLabel(40)).toBe('Poor');
    expect(getScoreLabel(0)).toBe('Poor');
  });
});
