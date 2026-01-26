/**
 * File Manager Tests
 * 
 * Tests for file operations including open functionality
 * with File System Access API and fallback support.
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileManager } from './file-manager';
import { documentState } from '../state/document-state';

describe('FileManager', () => {
  let fileManager: FileManager;

  beforeEach(() => {
    fileManager = new FileManager();
    // Clear document state before each test
    documentState.svgDocument.set(null);
    documentState.documentTree.set([]);
    documentState.rawSVG.set('');
  });

  describe('File System Access API detection', () => {
    it('should detect if File System Access API is supported', () => {
      const isSupported = fileManager.isFileSystemAccessSupported();
      expect(typeof isSupported).toBe('boolean');
    });
  });

  describe('File state management', () => {
    it('should initialize with empty file state', () => {
      const state = fileManager.getFileState();
      expect(state.handle).toBeNull();
      expect(state.name).toBe('');
      expect(state.isDirty).toBe(false);
      expect(state.lastSaved).toBeNull();
    });

    it('should mark document as dirty', () => {
      fileManager.markDirty();
      const state = fileManager.getFileState();
      expect(state.isDirty).toBe(true);
    });

    it('should mark document as clean', () => {
      fileManager.markDirty();
      fileManager.markClean();
      const state = fileManager.getFileState();
      expect(state.isDirty).toBe(false);
      expect(state.lastSaved).toBeInstanceOf(Date);
    });
  });

  describe('File opening with fallback', () => {
    it('should handle file input fallback for opening files', async () => {
      // Ensure File System Access API is not available for this test
      const originalShowOpenFilePicker = (window as any).showOpenFilePicker;
      delete (window as any).showOpenFilePicker;

      // Mock the file input behavior
      const svgContent = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100"/></svg>';
      const mockFile = new File([svgContent], 'test.svg', { type: 'image/svg+xml' });

      // Create a mock for the file input
      const mockInput = {
        type: 'file',
        accept: '.svg,image/svg+xml',
        files: [mockFile],
        click: vi.fn(),
        onchange: null as any,
        oncancel: null as any,
      };

      // Mock document.createElement to return our mock input
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'input') {
          return mockInput as any;
        }
        return originalCreateElement(tagName);
      });

      // Start the open operation
      const openPromise = fileManager.open();

      // Simulate the file selection
      if (mockInput.onchange) {
        await mockInput.onchange();
      }

      // Wait for the promise to resolve
      const fileState = await openPromise;

      // Verify the file was loaded
      expect(fileState.name).toBe('test.svg');
      expect(fileState.isDirty).toBe(false);

      // Verify document state was updated
      expect(documentState.svgDocument.get()).not.toBeNull();
      expect(documentState.rawSVG.get()).toContain('<svg');

      // Restore the original createElement and showOpenFilePicker
      vi.restoreAllMocks();
      if (originalShowOpenFilePicker) {
        (window as any).showOpenFilePicker = originalShowOpenFilePicker;
      }
    });

    it('should handle cancellation in file input fallback', async () => {
      // Ensure File System Access API is not available for this test
      const originalShowOpenFilePicker = (window as any).showOpenFilePicker;
      delete (window as any).showOpenFilePicker;

      // Create a mock for the file input
      const mockInput = {
        type: 'file',
        accept: '.svg,image/svg+xml',
        files: null,
        click: vi.fn(),
        onchange: null as any,
        oncancel: null as any,
      };

      // Mock document.createElement
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'input') {
          return mockInput as any;
        }
        return originalCreateElement(tagName);
      });

      // Start the open operation
      const openPromise = fileManager.open();

      // Simulate cancellation
      if (mockInput.oncancel) {
        mockInput.oncancel();
      }

      // Verify the promise rejects
      await expect(openPromise).rejects.toThrow('cancelled');

      // Restore
      vi.restoreAllMocks();
      if (originalShowOpenFilePicker) {
        (window as any).showOpenFilePicker = originalShowOpenFilePicker;
      }
    });

    it('should handle invalid SVG content', async () => {
      // Ensure File System Access API is not available for this test
      const originalShowOpenFilePicker = (window as any).showOpenFilePicker;
      delete (window as any).showOpenFilePicker;

      // Mock the file input with invalid SVG
      const mockFile = new File(['<invalid>not valid svg</invalid>'], 'invalid.svg', { type: 'image/svg+xml' });

      const mockInput = {
        type: 'file',
        accept: '.svg,image/svg+xml',
        files: [mockFile],
        click: vi.fn(),
        onchange: null as any,
        oncancel: null as any,
      };

      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'input') {
          return mockInput as any;
        }
        return originalCreateElement(tagName);
      });

      // Start the open operation
      const openPromise = fileManager.open();

      // Simulate the file selection
      if (mockInput.onchange) {
        await mockInput.onchange();
      }

      // Verify the promise rejects with parse error
      await expect(openPromise).rejects.toThrow('Root element must be <svg>');

      // Restore
      vi.restoreAllMocks();
      if (originalShowOpenFilePicker) {
        (window as any).showOpenFilePicker = originalShowOpenFilePicker;
      }
    });
  });

  describe('File opening with File System Access API', () => {
    it('should use File System Access API when available', async () => {
      // Check if the API is actually available in the test environment
      if (!('showOpenFilePicker' in window)) {
        // Skip this test if API is not available
        return;
      }

      // Mock the File System Access API
      const mockFileHandle = {
        getFile: vi.fn().mockResolvedValue({
          name: 'test.svg',
          lastModified: Date.now(),
          text: vi.fn().mockResolvedValue(
            '<svg xmlns="http://www.w3.org/2000/svg"><circle r="50"/></svg>'
          ),
        }),
      };

      (window as any).showOpenFilePicker = vi.fn().mockResolvedValue([mockFileHandle]);

      // Open the file
      const fileState = await fileManager.open();

      // Verify the file was loaded
      expect(fileState.name).toBe('test.svg');
      expect(fileState.handle).toBe(mockFileHandle);
      expect(fileState.isDirty).toBe(false);

      // Verify document state was updated
      expect(documentState.svgDocument.get()).not.toBeNull();
      expect(documentState.rawSVG.get()).toContain('<svg');

      // Clean up
      delete (window as any).showOpenFilePicker;
    });
  });

  describe('Document state integration', () => {
    it('should update document state when file is loaded', async () => {
      // Ensure File System Access API is not available for this test
      const originalShowOpenFilePicker = (window as any).showOpenFilePicker;
      delete (window as any).showOpenFilePicker;

      const svgContent = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100"/></svg>';
      const mockFile = new File([svgContent], 'test.svg', { type: 'image/svg+xml' });

      const mockInput = {
        type: 'file',
        accept: '.svg,image/svg+xml',
        files: [mockFile],
        click: vi.fn(),
        onchange: null as any,
        oncancel: null as any,
      };

      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'input') {
          return mockInput as any;
        }
        return originalCreateElement(tagName);
      });

      const openPromise = fileManager.open();
      if (mockInput.onchange) {
        await mockInput.onchange();
      }
      await openPromise;

      // Verify document state
      const doc = documentState.svgDocument.get();
      expect(doc).not.toBeNull();
      expect(doc?.tagName.toLowerCase()).toBe('svg');

      const tree = documentState.documentTree.get();
      expect(tree.length).toBeGreaterThan(0);
      expect(tree[0].tagName.toLowerCase()).toBe('svg');

      const rawSVG = documentState.rawSVG.get();
      expect(rawSVG).toBe(svgContent);

      vi.restoreAllMocks();
      if (originalShowOpenFilePicker) {
        (window as any).showOpenFilePicker = originalShowOpenFilePicker;
      }
    });
  });

  describe('File saving with fallback', () => {
    it('should save file using download fallback when no handle exists', async () => {
      // Set up a document to save
      const svgContent = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100"/></svg>';
      
      // Mock URL.createObjectURL and URL.revokeObjectURL
      const mockUrl = 'blob:mock-url';
      const originalCreateObjectURL = URL.createObjectURL;
      const originalRevokeObjectURL = URL.revokeObjectURL;
      
      URL.createObjectURL = vi.fn().mockReturnValue(mockUrl);
      URL.revokeObjectURL = vi.fn();

      // Mock document.createElement for the download link
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };

      const originalCreateElement = document.createElement.bind(document);
      const originalAppendChild = document.body.appendChild.bind(document.body);
      const originalRemoveChild = document.body.removeChild.bind(document.body);

      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          return mockLink as any;
        }
        return originalCreateElement(tagName);
      });

      vi.spyOn(document.body, 'appendChild').mockImplementation((node: any) => {
        return node;
      });

      vi.spyOn(document.body, 'removeChild').mockImplementation((node: any) => {
        return node;
      });

      // Save the file
      await fileManager.save(svgContent);

      // Verify the download was triggered
      expect(mockLink.href).toBe(mockUrl);
      expect(mockLink.download).toBe('document.svg');
      expect(mockLink.click).toHaveBeenCalled();
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);

      // Verify file state was updated
      const fileState = fileManager.getFileState();
      expect(fileState.isDirty).toBe(false);

      // Restore
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
      vi.restoreAllMocks();
    });

    it('should save file with existing filename', async () => {
      // Set up file manager with a filename
      const svgContent = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100"/></svg>';
      
      // First, simulate opening a file to set the filename
      const originalShowOpenFilePicker = (window as any).showOpenFilePicker;
      delete (window as any).showOpenFilePicker;

      const mockFile = new File([svgContent], 'existing.svg', { type: 'image/svg+xml' });
      const mockInput = {
        type: 'file',
        accept: '.svg,image/svg+xml',
        files: [mockFile],
        click: vi.fn(),
        onchange: null as any,
        oncancel: null as any,
      };

      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'input') {
          return mockInput as any;
        }
        if (tagName === 'a') {
          return {
            href: '',
            download: '',
            click: vi.fn(),
          } as any;
        }
        return originalCreateElement(tagName);
      });

      // Mock URL methods
      const mockUrl = 'blob:mock-url';
      URL.createObjectURL = vi.fn().mockReturnValue(mockUrl);
      URL.revokeObjectURL = vi.fn();

      vi.spyOn(document.body, 'appendChild').mockImplementation((node: any) => node);
      vi.spyOn(document.body, 'removeChild').mockImplementation((node: any) => node);

      // Open the file first
      const openPromise = fileManager.open();
      if (mockInput.onchange) {
        await mockInput.onchange();
      }
      await openPromise;

      // Now save it
      await fileManager.save(svgContent);

      // Verify the file state
      const fileState = fileManager.getFileState();
      expect(fileState.name).toBe('existing.svg');
      expect(fileState.isDirty).toBe(false);

      // Restore
      vi.restoreAllMocks();
      if (originalShowOpenFilePicker) {
        (window as any).showOpenFilePicker = originalShowOpenFilePicker;
      }
    });
  });

  describe('File saving with File System Access API', () => {
    it('should save to existing file handle when available', async () => {
      // Check if the API is actually available in the test environment
      if (!('showOpenFilePicker' in window)) {
        // Skip this test if API is not available
        return;
      }

      const svgContent = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100"/></svg>';

      // Mock the writable stream
      const mockWritable = {
        write: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
      };

      // Mock the file handle
      const mockFileHandle = {
        name: 'test.svg',
        getFile: vi.fn().mockResolvedValue({
          name: 'test.svg',
          lastModified: Date.now(),
          text: vi.fn().mockResolvedValue(svgContent),
        }),
        createWritable: vi.fn().mockResolvedValue(mockWritable),
      };

      // Mock showOpenFilePicker to return our mock handle
      (window as any).showOpenFilePicker = vi.fn().mockResolvedValue([mockFileHandle]);

      // Open the file first to get a handle
      await fileManager.open();

      // Now save it
      await fileManager.save(svgContent);

      // Verify the file was written
      expect(mockFileHandle.createWritable).toHaveBeenCalled();
      expect(mockWritable.write).toHaveBeenCalledWith(svgContent);
      expect(mockWritable.close).toHaveBeenCalled();

      // Verify file state
      const fileState = fileManager.getFileState();
      expect(fileState.isDirty).toBe(false);

      // Clean up
      delete (window as any).showOpenFilePicker;
    });
  });

  describe('Save As functionality', () => {
    it('should prompt for new filename with fallback', async () => {
      // Ensure File System Access API is not available
      const originalShowSaveFilePicker = (window as any).showSaveFilePicker;
      delete (window as any).showSaveFilePicker;

      const svgContent = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100"/></svg>';

      // Mock prompt
      const originalPrompt = window.prompt;
      window.prompt = vi.fn().mockReturnValue('newfile.svg');

      // Mock URL methods
      const mockUrl = 'blob:mock-url';
      URL.createObjectURL = vi.fn().mockReturnValue(mockUrl);
      URL.revokeObjectURL = vi.fn();

      // Mock download link
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };

      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          return mockLink as any;
        }
        return originalCreateElement(tagName);
      });

      vi.spyOn(document.body, 'appendChild').mockImplementation((node: any) => node);
      vi.spyOn(document.body, 'removeChild').mockImplementation((node: any) => node);

      // Save As
      const fileState = await fileManager.saveAs(svgContent);

      // Verify prompt was called
      expect(window.prompt).toHaveBeenCalled();

      // Verify download was triggered
      expect(mockLink.download).toBe('newfile.svg');
      expect(mockLink.click).toHaveBeenCalled();

      // Verify file state
      expect(fileState.name).toBe('newfile.svg');
      expect(fileState.isDirty).toBe(false);

      // Restore
      window.prompt = originalPrompt;
      vi.restoreAllMocks();
      if (originalShowSaveFilePicker) {
        (window as any).showSaveFilePicker = originalShowSaveFilePicker;
      }
    });

    it('should handle cancellation in Save As fallback', async () => {
      // Ensure File System Access API is not available
      const originalShowSaveFilePicker = (window as any).showSaveFilePicker;
      delete (window as any).showSaveFilePicker;

      const svgContent = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100"/></svg>';

      // Mock prompt to return null (cancelled)
      const originalPrompt = window.prompt;
      window.prompt = vi.fn().mockReturnValue(null);

      // Save As should throw
      await expect(fileManager.saveAs(svgContent)).rejects.toThrow('cancelled');

      // Restore
      window.prompt = originalPrompt;
      if (originalShowSaveFilePicker) {
        (window as any).showSaveFilePicker = originalShowSaveFilePicker;
      }
    });

    it('should use File System Access API for Save As when available', async () => {
      // Check if the API is actually available in the test environment
      if (!('showSaveFilePicker' in window)) {
        // Skip this test if API is not available
        return;
      }

      const svgContent = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100"/></svg>';

      // Mock the writable stream
      const mockWritable = {
        write: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
      };

      // Mock the file handle
      const mockFileHandle = {
        name: 'newfile.svg',
        createWritable: vi.fn().mockResolvedValue(mockWritable),
      };

      // Mock showSaveFilePicker
      (window as any).showSaveFilePicker = vi.fn().mockResolvedValue(mockFileHandle);

      // Save As
      const fileState = await fileManager.saveAs(svgContent);

      // Verify the file picker was shown
      expect((window as any).showSaveFilePicker).toHaveBeenCalled();

      // Verify the file was written
      expect(mockFileHandle.createWritable).toHaveBeenCalled();
      expect(mockWritable.write).toHaveBeenCalledWith(svgContent);
      expect(mockWritable.close).toHaveBeenCalled();

      // Verify file state
      expect(fileState.name).toBe('newfile.svg');
      expect(fileState.handle).toBe(mockFileHandle);
      expect(fileState.isDirty).toBe(false);

      // Clean up
      delete (window as any).showSaveFilePicker;
    });
  });
});
