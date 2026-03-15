import { describe, expect, it } from 'vitest';
import { formatDate, formatDuration, formatRelativeTime } from '../formatDate';

describe('formatDate', () => {
  it('should format date to readable string', () => {
    const date = new Date('2024-01-15T10:30:00');
    const result = formatDate(date);
    
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should format relative time for recent dates', () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    const result = formatRelativeTime(fiveMinutesAgo);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should format duration in milliseconds', () => {
    const result = formatDuration(1500);
    expect(typeof result).toBe('string');
  });

  it('should handle timestamp numbers', () => {
    const timestamp = Date.now();
    const result = formatDate(timestamp);
    expect(typeof result).toBe('string');
  });
});
