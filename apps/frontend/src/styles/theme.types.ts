/**
 * TypeScript type definitions for theme system
 * 
 * These types provide type safety when working with theme values in TypeScript.
 * Requirements: 2.1, 2.2, 2.3
 */

/**
 * Available theme modes
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Theme color palette interface
 * All colors are hex strings that meet WCAG 2.1 AA contrast requirements
 */
export interface ThemeColors {
  // Background colors
  background: string;
  surface: string;
  surfaceVariant: string;
  
  // Text colors
  onBackground: string;
  onSurface: string;
  onSurfaceVariant: string;
  
  // Primary colors
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  
  // Accent colors
  accent: string;
  onAccent: string;
  accentContainer: string;
  onAccentContainer: string;
  
  // State colors
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  
  warning: string;
  onWarning: string;
  warningContainer: string;
  onWarningContainer: string;
  
  success: string;
  onSuccess: string;
  successContainer: string;
  onSuccessContainer: string;
  
  // Border and outline colors
  outline: string;
  outlineVariant: string;
  outlineFocus: string;
  
  // Interactive states
  hoverOverlay: string;
  pressedOverlay: string;
  selectedOverlay: string;
  disabledOverlay: string;
  
  // Canvas and editor specific
  canvasBackground: string;
  grid: string;
  selectionStroke: string;
  selectionFill: string;
  handle: string;
  handleHover: string;
  
  // Syntax highlighting
  syntaxTag: string;
  syntaxAttribute: string;
  syntaxValue: string;
  syntaxComment: string;
  syntaxText: string;
}

/**
 * Complete theme definition
 */
export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
}

/**
 * Contrast ratio information for WCAG compliance
 */
export interface ContrastRatio {
  foreground: string;
  background: string;
  ratio: number;
  meetsAA: boolean;
  meetsAAA: boolean;
}

/**
 * Theme configuration for the application
 */
export interface ThemeConfig {
  currentTheme: ThemeMode;
  prefersDarkMode: boolean;
  prefersHighContrast: boolean;
  prefersReducedMotion: boolean;
}

/**
 * CSS custom property names for theme colors
 */
export const CSS_VARS = {
  // Background colors
  background: '--color-background',
  surface: '--color-surface',
  surfaceVariant: '--color-surface-variant',
  
  // Text colors
  onBackground: '--color-on-background',
  onSurface: '--color-on-surface',
  onSurfaceVariant: '--color-on-surface-variant',
  
  // Primary colors
  primary: '--color-primary',
  onPrimary: '--color-on-primary',
  primaryContainer: '--color-primary-container',
  onPrimaryContainer: '--color-on-primary-container',
  
  // Accent colors
  accent: '--color-accent',
  onAccent: '--color-on-accent',
  accentContainer: '--color-accent-container',
  onAccentContainer: '--color-on-accent-container',
  
  // State colors
  error: '--color-error',
  onError: '--color-on-error',
  errorContainer: '--color-error-container',
  onErrorContainer: '--color-on-error-container',
  
  warning: '--color-warning',
  onWarning: '--color-on-warning',
  warningContainer: '--color-warning-container',
  onWarningContainer: '--color-on-warning-container',
  
  success: '--color-success',
  onSuccess: '--color-on-success',
  successContainer: '--color-success-container',
  onSuccessContainer: '--color-on-success-container',
  
  // Border and outline colors
  outline: '--color-outline',
  outlineVariant: '--color-outline-variant',
  outlineFocus: '--color-outline-focus',
  
  // Interactive states
  hoverOverlay: '--color-hover-overlay',
  pressedOverlay: '--color-pressed-overlay',
  selectedOverlay: '--color-selected-overlay',
  disabledOverlay: '--color-disabled-overlay',
  
  // Canvas and editor specific
  canvasBackground: '--color-canvas-background',
  grid: '--color-grid',
  selectionStroke: '--color-selection-stroke',
  selectionFill: '--color-selection-fill',
  handle: '--color-handle',
  handleHover: '--color-handle-hover',
  
  // Syntax highlighting
  syntaxTag: '--color-syntax-tag',
  syntaxAttribute: '--color-syntax-attribute',
  syntaxValue: '--color-syntax-value',
  syntaxComment: '--color-syntax-comment',
  syntaxText: '--color-syntax-text',
} as const;

/**
 * Helper function to get CSS custom property value
 */
export function getCSSVar(varName: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

/**
 * Helper function to set CSS custom property value
 */
export function setCSSVar(varName: string, value: string): void {
  document.documentElement.style.setProperty(varName, value);
}

/**
 * Calculate contrast ratio between two colors
 * Based on WCAG 2.1 formula
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    // Apply gamma correction
    const rsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const gsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const bsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
    
    // Calculate relative luminance
    return 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB;
  };
  
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standard
 */
export function meetsWCAG_AA(ratio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? ratio >= 3.0 : ratio >= 4.5;
}

/**
 * Check if contrast ratio meets WCAG AAA standard
 */
export function meetsWCAG_AAA(ratio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? ratio >= 4.5 : ratio >= 7.0;
}
