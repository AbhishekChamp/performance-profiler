import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useFileUpload } from '../useFileUpload';

describe('useFileUpload', () => {
  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useFileUpload());
    
    expect(result.current.files).toEqual([]);
    expect(result.current.isDragging).toBe(false);
  });

  it('should handle file upload', async () => {
    const { result } = renderHook(() => useFileUpload());
    
    const file = new File(['test content'], 'test.js', { type: 'application/javascript' });
    const fileList = { 0: file, length: 1, item: (i: number) => i === 0 ? file : null } as unknown as FileList;
    
    await act(async () => {
      await result.current.addFiles(fileList);
    });
    
    expect(result.current.files).toHaveLength(1);
    expect(result.current.files[0].name).toBe('test.js');
  });

  it('should reject unsupported file types', async () => {
    const { result } = renderHook(() => useFileUpload());
    
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const fileList = { 0: invalidFile, length: 1, item: (i: number) => i === 0 ? invalidFile : null } as unknown as FileList;
    
    await act(async () => {
      await result.current.addFiles(fileList);
    });
    
    expect(result.current.files).toHaveLength(0);
  });

  it('should remove file', async () => {
    const { result } = renderHook(() => useFileUpload());
    
    const file = new File(['test content'], 'test.js', { type: 'application/javascript' });
    const fileList = { 0: file, length: 1, item: (i: number) => i === 0 ? file : null } as unknown as FileList;
    
    await act(async () => {
      await result.current.addFiles(fileList);
    });
    
    const fileId = result.current.files[0].id;
    
    act(() => {
      result.current.removeFile(fileId);
    });
    
    expect(result.current.files).toHaveLength(0);
  });

  it('should clear all files', async () => {
    const { result } = renderHook(() => useFileUpload());
    
    const file = new File(['test content'], 'test.js', { type: 'application/javascript' });
    const fileList = { 0: file, length: 1, item: (i: number) => i === 0 ? file : null } as unknown as FileList;
    
    await act(async () => {
      await result.current.addFiles(fileList);
    });
    
    act(() => {
      result.current.clearFiles();
    });
    
    expect(result.current.files).toHaveLength(0);
  });

  it('should set dragging state', () => {
    const { result } = renderHook(() => useFileUpload());
    
    act(() => {
      result.current.setIsDragging(true);
    });
    
    expect(result.current.isDragging).toBe(true);
    
    act(() => {
      result.current.setIsDragging(false);
    });
    
    expect(result.current.isDragging).toBe(false);
  });

  it('should skip files larger than 10MB', async () => {
    const { result } = renderHook(() => useFileUpload());
    
    // Create a mock large file (11MB)
    const largeContent = new Array(11 * 1024 * 1024).fill('a').join('');
    const largeFile = new File([largeContent], 'large.js', { type: 'application/javascript' });
    const fileList = { 0: largeFile, length: 1, item: (i: number) => i === 0 ? largeFile : null } as unknown as FileList;
    
    await act(async () => {
      await result.current.addFiles(fileList);
    });
    
    expect(result.current.files).toHaveLength(0);
  });
});
