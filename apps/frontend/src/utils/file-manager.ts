/**
 * File Manager
 * 
 * Manages file operations for opening and saving SVG files.
 * Uses File System Access API where supported, with fallback to file input.
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */

import type { FileState } from '../types';
import { svgParser } from './svg-parser';
import { documentStateUpdater } from '../state/document-state';
import { editorController } from '../state/editor-controller';
import { loadingIndicator } from './loading-indicator';

/**
 * Check if File System Access API is supported
 */
function isFileSystemAccessSupported(): boolean {
  return 'showOpenFilePicker' in window;
}

/**
 * FileManager class for handling file operations
 */
export class FileManager {
  private currentFileState: FileState = {
    handle: null,
    name: '',
    isDirty: false,
    lastSaved: null,
  };

  /**
   * Create a new blank SVG document
   * Prompts for confirmation if there are unsaved changes
   * 
   * @returns Promise resolving to FileState
   * @throws Error if user cancels or operation fails
   */
  async new(): Promise<FileState> {
    // Check for unsaved changes and prompt user
    if (this.currentFileState.isDirty) {
      const confirmed = confirm(
        'You have unsaved changes. Creating a new document will discard them. Continue?'
      );
      if (!confirmed) {
        throw new Error('New document cancelled by user');
      }
    }

    const loadingHandle = loadingIndicator.show({
      message: 'Creating new document...',
      type: 'spinner',
    });

    try {
      // Create a blank SVG document with default dimensions (800x600)
      const blankSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <!-- New SVG Document -->
</svg>`;

      // Parse the blank SVG
      const parseResult = svgParser.parse(blankSVG);

      if (!parseResult.success) {
        throw new Error('Failed to create blank SVG document');
      }

      // Update document state with blank document
      documentStateUpdater.setDocument(
        parseResult.document,
        parseResult.tree,
        blankSVG
      );

      // Clear undo/redo history
      editorController.clearHistory();

      // Reset file state
      this.currentFileState = {
        handle: null,
        name: '',
        isDirty: false,
        lastSaved: null,
      };

      return { ...this.currentFileState };
    } finally {
      loadingHandle.hide();
    }
  }

  /**
   * Open an SVG file from the user's file system
   * Uses File System Access API where supported, falls back to file input
   * 
   * @returns Promise resolving to FileState
   * @throws Error if file operation fails
   */
  async open(): Promise<FileState> {
    try {
      if (isFileSystemAccessSupported()) {
        return await this.openWithFileSystemAccess();
      } else {
        return await this.openWithFileInput();
      }
    } catch (error) {
      // User cancelled or error occurred
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('File open cancelled by user');
      }
      throw error;
    }
  }

  /**
   * Open file using File System Access API
   * Maintains file handle for future save operations
   */
  private async openWithFileSystemAccess(): Promise<FileState> {
    const loadingHandle = loadingIndicator.show({
      message: 'Opening file...',
      type: 'spinner',
    });

    try {
      // Show file picker
      const [fileHandle] = await (window as any).showOpenFilePicker({
        types: [
          {
            description: 'SVG Files',
            accept: {
              'image/svg+xml': ['.svg'],
            },
          },
        ],
        multiple: false,
      });

      loadingHandle.updateMessage('Reading file...');

      // Get the file
      const file = await fileHandle.getFile();
      const content = await file.text();

      loadingHandle.updateMessage('Parsing SVG...');

      // Parse the SVG content
      const parseResult = svgParser.parse(content);

      if (!parseResult.success) {
        // Show parse errors to user
        const errorMessages = parseResult.errors
          .map(err => `Line ${err.line}, Column ${err.column}: ${err.message}`)
          .join('\n');
        throw new Error(`Failed to parse SVG file:\n${errorMessages}`);
      }

      loadingHandle.updateMessage('Loading document...');

      // Update document state with parsed content
      documentStateUpdater.setDocument(
        parseResult.document,
        parseResult.tree,
        content
      );

      // Clear undo/redo history when loading a new document
      editorController.clearHistory();

      // Update file state
      this.currentFileState = {
        handle: fileHandle,
        name: file.name,
        isDirty: false,
        lastSaved: new Date(file.lastModified),
      };

      return { ...this.currentFileState };
    } finally {
      loadingHandle.hide();
    }
  }

  /**
   * Open file using traditional file input (fallback)
   * Does not maintain file handle
   */
  private async openWithFileInput(): Promise<FileState> {
    return new Promise((resolve, reject) => {
      // Create a file input element
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.svg,image/svg+xml';

      input.onchange = async () => {
        const loadingHandle = loadingIndicator.show({
          message: 'Reading file...',
          type: 'spinner',
        });

        try {
          const file = input.files?.[0];
          if (!file) {
            reject(new Error('No file selected'));
            return;
          }

          // Read file content using FileReader for better compatibility
          const reader = new FileReader();
          
          reader.onload = async (e) => {
            try {
              const content = e.target?.result as string;
              if (!content) {
                reject(new Error('Failed to read file content'));
                return;
              }

              loadingHandle.updateMessage('Parsing SVG...');

              // Parse the SVG content
              const parseResult = svgParser.parse(content);

              if (!parseResult.success) {
                // Show parse errors to user
                const errorMessages = parseResult.errors
                  .map(err => `Line ${err.line}, Column ${err.column}: ${err.message}`)
                  .join('\n');
                reject(new Error(`Failed to parse SVG file:\n${errorMessages}`));
                return;
              }

              loadingHandle.updateMessage('Loading document...');

              // Update document state with parsed content
              documentStateUpdater.setDocument(
                parseResult.document,
                parseResult.tree,
                content
              );

              // Clear undo/redo history when loading a new document
              editorController.clearHistory();

              // Update file state (no handle available in fallback mode)
              this.currentFileState = {
                handle: null,
                name: file.name,
                isDirty: false,
                lastSaved: new Date(file.lastModified),
              };

              resolve({ ...this.currentFileState });
            } catch (error) {
              reject(error);
            } finally {
              loadingHandle.hide();
            }
          };

          reader.onerror = () => {
            loadingHandle.hide();
            reject(new Error('Failed to read file'));
          };

          // Read the file as text
          reader.readAsText(file);
        } catch (error) {
          loadingHandle.hide();
          reject(error);
        }
      };

      input.oncancel = () => {
        reject(new Error('File open cancelled by user'));
      };

      // Trigger the file picker
      input.click();
    });
  }

  /**
   * Get the current file state
   */
  getFileState(): FileState {
    return { ...this.currentFileState };
  }

  /**
   * Mark the document as dirty (modified)
   */
  markDirty(): void {
    this.currentFileState.isDirty = true;
  }

  /**
   * Mark the document as clean (saved)
   */
  markClean(): void {
    this.currentFileState.isDirty = false;
    this.currentFileState.lastSaved = new Date();
  }

  /**
   * Check if File System Access API is supported
   */
  isFileSystemAccessSupported(): boolean {
    return isFileSystemAccessSupported();
  }

  /**
   * Save the current document to a file
   * Uses File System Access API if available and a file handle exists
   * Falls back to download for unsupported browsers or when no handle exists
   * 
   * @param content - The SVG content to save
   * @returns Promise resolving when save is complete
   * @throws Error if save operation fails
   */
  async save(content: string): Promise<void> {
    try {
      // If we have a file handle and File System Access is supported, save to it
      if (this.currentFileState.handle && isFileSystemAccessSupported()) {
        await this.saveWithFileSystemAccess(this.currentFileState.handle, content);
        this.markClean();
      } else {
        // Fall back to download
        await this.saveAsDownload(content, this.currentFileState.name || 'document.svg');
        this.markClean();
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Save cancelled by user');
      }
      throw error;
    }
  }

  /**
   * Save the current document to a new file (Save As)
   * Always prompts for a new file location
   * 
   * @param content - The SVG content to save
   * @returns Promise resolving to updated FileState
   * @throws Error if save operation fails
   */
  async saveAs(content: string): Promise<FileState> {
    try {
      if (isFileSystemAccessSupported()) {
        return await this.saveAsWithFileSystemAccess(content);
      } else {
        // Fall back to download with prompt for filename
        const filename = prompt('Enter filename:', this.currentFileState.name || 'document.svg');
        if (!filename) {
          throw new Error('Save As cancelled by user');
        }
        await this.saveAsDownload(content, filename);
        
        // Update file state
        this.currentFileState = {
          handle: null,
          name: filename,
          isDirty: false,
          lastSaved: new Date(),
        };
        
        return { ...this.currentFileState };
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Save As cancelled by user');
      }
      throw error;
    }
  }

  /**
   * Save to an existing file handle using File System Access API
   */
  private async saveWithFileSystemAccess(handle: FileSystemFileHandle, content: string): Promise<void> {
    const loadingHandle = loadingIndicator.show({
      message: 'Saving file...',
      type: 'spinner',
    });

    try {
      // Create a writable stream
      const writable = await handle.createWritable();
      
      // Write the content
      await writable.write(content);
      
      // Close the stream
      await writable.close();
    } finally {
      loadingHandle.hide();
    }
  }

  /**
   * Save As using File System Access API
   * Prompts user for new file location
   */
  private async saveAsWithFileSystemAccess(content: string): Promise<FileState> {
    // Show save file picker
    const fileHandle = await (window as any).showSaveFilePicker({
      types: [
        {
          description: 'SVG Files',
          accept: {
            'image/svg+xml': ['.svg'],
          },
        },
      ],
      suggestedName: this.currentFileState.name || 'document.svg',
    });

    // Save to the new file handle
    await this.saveWithFileSystemAccess(fileHandle, content);

    // Update file state with new handle
    this.currentFileState = {
      handle: fileHandle,
      name: fileHandle.name,
      isDirty: false,
      lastSaved: new Date(),
    };

    return { ...this.currentFileState };
  }

  /**
   * Save by triggering a browser download (fallback)
   */
  private async saveAsDownload(content: string, filename: string): Promise<void> {
    // Ensure filename has .svg extension
    if (!filename.endsWith('.svg')) {
      filename += '.svg';
    }

    // Create a blob with the SVG content
    const blob = new Blob([content], { type: 'image/svg+xml' });
    
    // Create a download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Trigger the download
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Global file manager instance
 */
export const fileManager = new FileManager();
