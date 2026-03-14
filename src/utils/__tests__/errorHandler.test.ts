import { describe, it, expect } from 'vitest';
import { 
  AppError, 
  ErrorCodes, 
  getErrorMessage, 
  safeJsonParse, 
  safeLocalStorage,
  withErrorHandling,
} from '../errorHandler';

describe('errorHandler', () => {
  describe('AppError', () => {
    it('should create AppError with default values', () => {
      const error = new AppError('Test message');
      
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('UNKNOWN_ERROR');
      expect(error.name).toBe('AppError');
    });

    it('should create AppError with custom code and context', () => {
      const error = new AppError(
        'Analysis failed',
        ErrorCodes.ANALYSIS_FAILED,
        { component: 'Analyzer', action: 'parse' }
      );
      
      expect(error.message).toBe('Analysis failed');
      expect(error.code).toBe('ANALYSIS_FAILED');
      expect(error.context.component).toBe('Analyzer');
    });
  });

  describe('getErrorMessage', () => {
    it('should return AppError message for known error codes', () => {
      const error = new AppError(
        'Custom message',
        ErrorCodes.FILE_READ_ERROR
      );
      
      const message = getErrorMessage(error);
      expect(message).toBeTruthy();
    });

    it('should handle regular Error objects', () => {
      const error = new Error('Regular error');
      const message = getErrorMessage(error);
      expect(message).toBe('Regular error');
    });

    it('should handle network errors', () => {
      const error = new Error('Failed to fetch data');
      const message = getErrorMessage(error);
      expect(typeof message).toBe('string');
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const result = safeJsonParse('{"key": "value"}', {});
      expect(result).toEqual({ key: 'value' });
    });

    it('should return fallback for invalid JSON', () => {
      const fallback = { default: true };
      const result = safeJsonParse('invalid json', fallback);
      expect(result).toEqual(fallback);
    });

    it('should return fallback for empty string', () => {
      const fallback: unknown[] = [];
      const result = safeJsonParse('', fallback);
      expect(result).toEqual(fallback);
    });
  });

  describe('safeLocalStorage', () => {
    it('should retrieve stored value', () => {
      localStorage.setItem('test-key', JSON.stringify({ data: true }));
      const result = safeLocalStorage('test-key', {});
      expect(result).toEqual({ data: true });
    });

    it('should return fallback for missing key', () => {
      const fallback = { default: 'value' };
      const result = safeLocalStorage('non-existent-key', fallback);
      expect(result).toEqual(fallback);
    });
  });

  describe('withErrorHandling', () => {
    it('should return result on success', async () => {
      const fn = async () => 'success';
      const wrapped = withErrorHandling(fn);
      
      const result = await wrapped();
      expect(result).toBe('success');
    });

    it('should throw AppError on failure', async () => {
      const fn = async () => { throw new Error('Failed'); };
      const wrapped = withErrorHandling(fn, { component: 'Test' });
      
      await expect(wrapped()).rejects.toThrow(AppError);
    });
  });
});
