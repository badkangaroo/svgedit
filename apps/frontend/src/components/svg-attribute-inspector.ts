/**
 * SVG Attribute Inspector Component
 * 
 * Displays and allows editing of SVG element attributes.
 * Subscribes to selection state signal to detect selected elements.
 * Generates appropriate input controls based on attribute type.
 * 
 * Requirements: 1.1, 4.1
 */

import { effect } from '../state/signals';
import { documentState, documentStateUpdater } from '../state/document-state';
import { selectionManager } from '../state/selection-manager';
import type { DocumentNode } from '../types';

/**
 * Attribute type classification for input control generation
 */
type AttributeType = 'number' | 'color' | 'text' | 'select' | 'viewBox';

/**
 * Attribute metadata for input control generation
 */
interface AttributeMetadata {
  type: AttributeType;
  label: string;
  options?: string[]; // For select inputs
  min?: number; // For number inputs
  max?: number; // For number inputs
  step?: number; // For number inputs
}

/**
 * SVGAttributeInspector Web Component
 * 
 * Displays attributes of selected SVG elements with appropriate input controls.
 * Automatically updates when selection changes.
 * Supports single and multi-element selection.
 */
export class SVGAttributeInspector extends HTMLElement {
  private inspectorContainer: HTMLDivElement | null = null;
  private disposeEffects: (() => void)[] = [];
  private currentAttributes: Map<string, string> = new Map();
  private selectedElement: SVGElement | null = null;

  // Attribute type mappings
  private readonly ATTRIBUTE_METADATA: Record<string, AttributeMetadata> = {
    // Position attributes
    'x': { type: 'number', label: 'X Position', step: 1 },
    'y': { type: 'number', label: 'Y Position', step: 1 },
    'cx': { type: 'number', label: 'Center X', step: 1 },
    'cy': { type: 'number', label: 'Center Y', step: 1 },
    'x1': { type: 'number', label: 'X1', step: 1 },
    'y1': { type: 'number', label: 'Y1', step: 1 },
    'x2': { type: 'number', label: 'X2', step: 1 },
    'y2': { type: 'number', label: 'Y2', step: 1 },
    
    // Size attributes
    'width': { type: 'number', label: 'Width', min: 0, step: 1 },
    'height': { type: 'number', label: 'Height', min: 0, step: 1 },
    'r': { type: 'number', label: 'Radius', min: 0, step: 1 },
    'rx': { type: 'number', label: 'Radius X', min: 0, step: 1 },
    'ry': { type: 'number', label: 'Radius Y', min: 0, step: 1 },
    
    // Appearance attributes
    'fill': { type: 'color', label: 'Fill Color' },
    'stroke': { type: 'color', label: 'Stroke Color' },
    'stroke-width': { type: 'number', label: 'Stroke Width', min: 0, step: 0.1 },
    'opacity': { type: 'number', label: 'Opacity', min: 0, max: 1, step: 0.01 },
    'fill-opacity': { type: 'number', label: 'Fill Opacity', min: 0, max: 1, step: 0.01 },
    'stroke-opacity': { type: 'number', label: 'Stroke Opacity', min: 0, max: 1, step: 0.01 },
    
    // Text attributes
    'font-size': { type: 'number', label: 'Font Size', min: 0, step: 1 },
    'font-family': { type: 'text', label: 'Font Family' },
    'font-weight': { 
      type: 'select', 
      label: 'Font Weight',
      options: ['normal', 'bold', 'bolder', 'lighter', '100', '200', '300', '400', '500', '600', '700', '800', '900']
    },
    'text-anchor': {
      type: 'select',
      label: 'Text Anchor',
      options: ['start', 'middle', 'end']
    },
    
    // Transform and other attributes
    'transform': { type: 'text', label: 'Transform' },
    'd': { type: 'text', label: 'Path Data' },
    'points': { type: 'text', label: 'Points' },
    'viewBox': { type: 'viewBox', label: 'ViewBox' },
    'id': { type: 'text', label: 'ID' },
    'class': { type: 'text', label: 'Class' },
  };

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEffects();
    this.registerWithSelectionManager();
  }

  disconnectedCallback() {
    this.disposeEffects.forEach(dispose => dispose());
    this.disposeEffects = [];
  }

  /**
   * Render the attribute inspector component structure
   */
  private render() {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          background-color: var(--color-surface);
          color: var(--color-on-surface);
          overflow: hidden;
        }

        .inspector-container {
          width: 100%;
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .inspector-header {
          padding: var(--spacing-sm) var(--spacing-md);
          font-weight: 600;
          font-size: 14px;
          border-bottom: 1px solid var(--color-outline);
          margin-bottom: var(--spacing-sm);
          color: var(--color-on-surface);
          position: sticky;
          top: 0;
          background-color: var(--color-surface);
          z-index: 10;
        }

        .inspector-content {
          padding: var(--spacing-md);
        }

        .empty-state {
          padding: var(--spacing-xl);
          text-align: center;
          color: var(--color-on-surface-variant);
        }

        .empty-state-icon {
          font-size: 32px;
          margin-bottom: var(--spacing-sm);
          opacity: 0.5;
        }

        .empty-state-text {
          font-size: 14px;
        }

        .multi-select-state {
          padding: var(--spacing-xl);
          text-align: center;
          color: var(--color-on-surface-variant);
        }

        .multi-select-icon {
          font-size: 32px;
          margin-bottom: var(--spacing-sm);
          opacity: 0.5;
        }

        .multi-select-text {
          font-size: 14px;
        }

        .multi-select-count {
          font-weight: 600;
          color: var(--color-primary);
        }

        .element-info {
          padding: var(--spacing-md);
          background-color: var(--color-surface-variant);
          border-radius: var(--radius-md);
          margin-bottom: var(--spacing-md);
        }

        .element-tag {
          font-size: 16px;
          font-weight: 600;
          color: var(--color-primary);
          font-family: var(--font-mono, monospace);
        }

        .element-id {
          font-size: 12px;
          color: var(--color-on-surface-variant);
          margin-top: var(--spacing-xs);
        }

        .attribute-group {
          margin-bottom: var(--spacing-lg);
        }

        .attribute-group-title {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--color-on-surface-variant);
          margin-bottom: var(--spacing-sm);
          padding-bottom: var(--spacing-xs);
          border-bottom: 1px solid var(--color-outline-variant, var(--color-outline));
        }

        .attribute-field {
          margin-bottom: var(--spacing-md);
        }

        .attribute-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: var(--spacing-xs);
          color: var(--color-on-surface);
        }

        .attribute-name {
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          color: var(--color-on-surface-variant);
          margin-left: var(--spacing-xs);
        }

        .attribute-input {
          width: 100%;
          padding: var(--spacing-sm);
          border: 1px solid var(--color-outline);
          border-radius: var(--radius-sm);
          background-color: var(--color-surface);
          color: var(--color-on-surface);
          font-size: 13px;
          font-family: inherit;
          transition: border-color var(--transition-fast);
        }

        .attribute-input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px var(--color-primary-container);
        }

        .attribute-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .attribute-input[type="color"] {
          height: 40px;
          padding: var(--spacing-xs);
          cursor: pointer;
        }

        .attribute-input[type="number"] {
          font-family: var(--font-mono, monospace);
        }

        .color-input-wrapper {
          display: flex;
          gap: var(--spacing-sm);
          align-items: center;
        }

        .color-input-wrapper input[type="color"] {
          width: 60px;
          flex-shrink: 0;
        }

        .color-input-wrapper input[type="text"] {
          flex: 1;
          font-family: var(--font-mono, monospace);
        }

        select.attribute-input {
          cursor: pointer;
        }

        .no-attributes {
          padding: var(--spacing-lg);
          text-align: center;
          color: var(--color-on-surface-variant);
          font-size: 13px;
        }

        .attribute-error {
          font-size: 11px;
          color: var(--color-error);
          margin-top: var(--spacing-xs);
          display: none;
        }

        .attribute-field.error .attribute-input {
          border-color: var(--color-error);
        }

        .attribute-field.error .attribute-error {
          display: block;
        }
      </style>

      <div class="inspector-container">
        <div class="inspector-header">Attribute Inspector</div>
        <div class="inspector-content" id="inspector-content">
          <!-- Content will be rendered here -->
        </div>
      </div>
    `;

    this.inspectorContainer = this.shadowRoot.querySelector('#inspector-content');
  }

  /**
   * Set up reactive effects to respond to state changes
   */
  private setupEffects() {
    // Effect: Update inspector when selection changes
    const selectionEffect = effect(() => {
      const selectedElements = documentState.selectedElements.get();
      const selectedNodes = documentState.selectedNodes.get();
      this.updateInspector(selectedElements, selectedNodes);
    });
    this.disposeEffects.push(selectionEffect);
  }

  /**
   * Update the inspector based on current selection
   */
  private updateInspector(selectedElements: SVGElement[], selectedNodes: DocumentNode[]) {
    if (!this.inspectorContainer) return;

    // Clear existing content
    this.inspectorContainer.innerHTML = '';

    // Handle different selection states
    if (selectedElements.length === 0) {
      // No selection - show empty state
      this.showEmptyState();
    } else if (selectedElements.length === 1) {
      // Single selection - show attributes
      this.selectedElement = selectedElements[0];
      const node = selectedNodes.length > 0 ? selectedNodes[0] : null;
      this.showAttributes(selectedElements[0], node);
    } else {
      // Multi-selection - show multi-select state
      this.showMultiSelectState(selectedElements.length);
    }
  }

  /**
   * Show empty state when no element is selected
   */
  private showEmptyState() {
    if (!this.inspectorContainer) return;

    this.inspectorContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎯</div>
        <div class="empty-state-text">Select an element to view its attributes</div>
      </div>
    `;
  }

  /**
   * Show multi-select state when multiple elements are selected
   */
  private showMultiSelectState(count: number) {
    if (!this.inspectorContainer) return;

    this.inspectorContainer.innerHTML = `
      <div class="multi-select-state">
        <div class="multi-select-icon">📦</div>
        <div class="multi-select-text">
          <span class="multi-select-count">${count}</span> elements selected
        </div>
        <div class="empty-state-text" style="margin-top: var(--spacing-sm);">
          Select a single element to edit attributes
        </div>
      </div>
    `;
  }

  /**
   * Show attributes for a single selected element
   */
  private showAttributes(element: SVGElement, node: DocumentNode | null) {
    if (!this.inspectorContainer) return;

    // Show element info
    const infoDiv = document.createElement('div');
    infoDiv.classList.add('element-info');
    infoDiv.innerHTML = `
      <div class="element-tag">&lt;${element.tagName.toLowerCase()}&gt;</div>
      ${element.id ? `<div class="element-id">#${element.id}</div>` : ''}
    `;
    this.inspectorContainer.appendChild(infoDiv);

    // Get all attributes from the node if available, otherwise from the element
    if (node && node.attributes) {
      this.currentAttributes = new Map(node.attributes);
    } else {
      // Fallback: get attributes directly from the element
      this.currentAttributes = new Map();
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        this.currentAttributes.set(attr.name, attr.value);
      }
    }

    if (this.currentAttributes.size === 0) {
      // No attributes
      const noAttrsDiv = document.createElement('div');
      noAttrsDiv.classList.add('no-attributes');
      noAttrsDiv.textContent = 'This element has no attributes';
      this.inspectorContainer.appendChild(noAttrsDiv);
      return;
    }

    // Group attributes by category
    const groups = this.groupAttributes(this.currentAttributes);

    // Render each group
    groups.forEach((attributes, groupName) => {
      const groupDiv = this.createAttributeGroup(groupName, attributes);
      if (this.inspectorContainer) {
        this.inspectorContainer.appendChild(groupDiv);
      }
    });
  }

  /**
   * Group attributes by category
   */
  private groupAttributes(attributes: Map<string, string>): Map<string, Map<string, string>> {
    const groups = new Map<string, Map<string, string>>();

    // Define attribute categories
    const positionAttrs = ['x', 'y', 'cx', 'cy', 'x1', 'y1', 'x2', 'y2'];
    const sizeAttrs = ['width', 'height', 'r', 'rx', 'ry'];
    const appearanceAttrs = ['fill', 'stroke', 'stroke-width', 'opacity', 'fill-opacity', 'stroke-opacity'];
    const textAttrs = ['font-size', 'font-family', 'font-weight', 'text-anchor'];
    const transformAttrs = ['transform'];
    const pathAttrs = ['d', 'points'];
    const identityAttrs = ['id', 'class'];

    // Initialize groups
    groups.set('Position', new Map());
    groups.set('Size', new Map());
    groups.set('Appearance', new Map());
    groups.set('Text', new Map());
    groups.set('Transform', new Map());
    groups.set('Path', new Map());
    groups.set('Identity', new Map());
    groups.set('Other', new Map());

    // Categorize attributes
    attributes.forEach((value, name) => {
      if (positionAttrs.includes(name)) {
        groups.get('Position')!.set(name, value);
      } else if (sizeAttrs.includes(name)) {
        groups.get('Size')!.set(name, value);
      } else if (appearanceAttrs.includes(name)) {
        groups.get('Appearance')!.set(name, value);
      } else if (textAttrs.includes(name)) {
        groups.get('Text')!.set(name, value);
      } else if (transformAttrs.includes(name)) {
        groups.get('Transform')!.set(name, value);
      } else if (pathAttrs.includes(name)) {
        groups.get('Path')!.set(name, value);
      } else if (identityAttrs.includes(name)) {
        groups.get('Identity')!.set(name, value);
      } else {
        groups.get('Other')!.set(name, value);
      }
    });

    // Remove empty groups
    const result = new Map<string, Map<string, string>>();
    groups.forEach((attrs, groupName) => {
      if (attrs.size > 0) {
        result.set(groupName, attrs);
      }
    });

    return result;
  }

  /**
   * Create an attribute group element
   */
  private createAttributeGroup(groupName: string, attributes: Map<string, string>): HTMLElement {
    const groupDiv = document.createElement('div');
    groupDiv.classList.add('attribute-group');

    // Group title
    const titleDiv = document.createElement('div');
    titleDiv.classList.add('attribute-group-title');
    titleDiv.textContent = groupName;
    groupDiv.appendChild(titleDiv);

    // Render each attribute
    attributes.forEach((value, name) => {
      const fieldDiv = this.createAttributeField(name, value);
      groupDiv.appendChild(fieldDiv);
    });

    return groupDiv;
  }

  /**
   * Create an attribute field with appropriate input control
   */
  private createAttributeField(name: string, value: string): HTMLElement {
    const fieldDiv = document.createElement('div');
    fieldDiv.classList.add('attribute-field');
    fieldDiv.dataset.attributeName = name;

    // Get metadata for this attribute
    const metadata = this.ATTRIBUTE_METADATA[name] || { type: 'text', label: name };

    // Create label
    const label = document.createElement('label');
    label.classList.add('attribute-label');
    label.innerHTML = `
      ${metadata.label}
      <span class="attribute-name">${name}</span>
    `;
    fieldDiv.appendChild(label);

    // Create input control based on type
    const inputElement = this.createInputControl(name, value, metadata);
    fieldDiv.appendChild(inputElement);

    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.classList.add('attribute-error');
    fieldDiv.appendChild(errorDiv);

    return fieldDiv;
  }

  /**
   * Create input control based on attribute type
   */
  private createInputControl(name: string, value: string, metadata: AttributeMetadata): HTMLElement {
    switch (metadata.type) {
      case 'color':
        return this.createColorInput(name, value);
      case 'number':
        return this.createNumberInput(name, value, metadata);
      case 'select':
        return this.createSelectInput(name, value, metadata);
      case 'viewBox':
        return this.createViewBoxInput(name, value);
      default:
        return this.createTextInput(name, value);
    }
  }

  /**
   * Create a viewBox input (4 number inputs)
   */
  private createViewBoxInput(name: string, value: string): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'grid';
    wrapper.style.gridTemplateColumns = '1fr 1fr 1fr 1fr';
    wrapper.style.gap = '4px';

    // Parse viewBox values (min-x min-y width height)
    // Default to "0 0 0 0" if invalid or empty
    const parts = value.trim().split(/\s+/).map(Number);
    const values = [
      isNaN(parts[0]) ? 0 : parts[0],
      isNaN(parts[1]) ? 0 : parts[1],
      isNaN(parts[2]) ? 0 : parts[2],
      isNaN(parts[3]) ? 0 : parts[3],
    ];
    
    const labels = ['x', 'y', 'w', 'h'];
    const inputs: HTMLInputElement[] = [];

    values.forEach((val, index) => {
      const container = document.createElement('div');
      
      const label = document.createElement('div');
      label.textContent = labels[index];
      label.style.fontSize = '10px';
      label.style.color = 'var(--color-on-surface-variant)';
      label.style.marginBottom = '2px';
      
      const input = document.createElement('input');
      input.type = 'number';
      input.classList.add('attribute-input');
      input.value = val.toString();
      input.style.padding = '4px';
      
      input.addEventListener('change', () => {
        // Update specific value in the array
        values[index] = parseFloat(input.value) || 0;
        // Construct new viewBox string
        const newValue = values.join(' ');
        this.handleAttributeChange(name, newValue);
      });
      
      inputs.push(input);
      container.appendChild(label);
      container.appendChild(input);
      wrapper.appendChild(container);
    });

    return wrapper;
  }

  /**
   * Create a text input
   */
  private createTextInput(name: string, value: string): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.classList.add('attribute-input');
    input.value = value;
    
    // Store original value for rollback on validation failure
    let lastValidValue = value;
    
    input.addEventListener('blur', () => {
      const isValid = this.validateAttribute(name, input.value);
      if (isValid) {
        lastValidValue = input.value;
        this.handleAttributeChange(name, input.value);
      } else {
        // Rollback to last valid value
        input.value = lastValidValue;
      }
    });
    
    return input;
  }

  /**
   * Create a number input
   */
  private createNumberInput(name: string, value: string, metadata: AttributeMetadata): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'number';
    input.classList.add('attribute-input');
    input.value = value;
    
    if (metadata.min !== undefined) input.min = metadata.min.toString();
    if (metadata.max !== undefined) input.max = metadata.max.toString();
    if (metadata.step !== undefined) input.step = metadata.step.toString();
    
    // Store original value for rollback on validation failure
    let lastValidValue = value;
    
    input.addEventListener('blur', () => {
      const isValid = this.validateAttribute(name, input.value);
      if (isValid) {
        lastValidValue = input.value;
        this.handleAttributeChange(name, input.value);
      } else {
        // Rollback to last valid value
        input.value = lastValidValue;
      }
    });
    
    return input;
  }

  /**
   * Create a color input (with text input for hex values)
   */
  private createColorInput(name: string, value: string): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.classList.add('color-input-wrapper');

    // Normalize color value for color picker
    const normalizedColor = this.normalizeColorValue(value);

    // Store original value for rollback on validation failure
    let lastValidValue = value;

    // Color picker
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.classList.add('attribute-input');
    colorInput.value = normalizedColor;
    colorInput.addEventListener('change', () => {
      textInput.value = colorInput.value;
      lastValidValue = colorInput.value;
      this.handleAttributeChange(name, colorInput.value);
    });

    // Text input for hex value
    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.classList.add('attribute-input');
    textInput.value = value;
    textInput.addEventListener('blur', () => {
      const isValid = this.validateAttribute(name, textInput.value);
      if (isValid) {
        const normalized = this.normalizeColorValue(textInput.value);
        if (normalized) {
          colorInput.value = normalized;
        }
        lastValidValue = textInput.value;
        this.handleAttributeChange(name, textInput.value);
      } else {
        // Rollback to last valid value
        textInput.value = lastValidValue;
      }
    });

    wrapper.appendChild(colorInput);
    wrapper.appendChild(textInput);

    return wrapper;
  }

  /**
   * Create a select input
   */
  private createSelectInput(name: string, value: string, metadata: AttributeMetadata): HTMLSelectElement {
    const select = document.createElement('select');
    select.classList.add('attribute-input');

    // Add options
    metadata.options?.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option;
      optionElement.textContent = option;
      optionElement.selected = option === value;
      select.appendChild(optionElement);
    });

    select.addEventListener('change', () => {
      // Select inputs are always valid (constrained to options)
      this.handleAttributeChange(name, select.value);
    });

    return select;
  }

  /**
   * Normalize color value for color picker (must be #RRGGBB format)
   */
  private normalizeColorValue(value: string): string {
    // Handle common color formats
    if (!value) return '#000000';
    
    // Already in #RRGGBB format
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      return value;
    }
    
    // Short hex format #RGB
    if (/^#[0-9A-Fa-f]{3}$/.test(value)) {
      const r = value[1];
      const g = value[2];
      const b = value[3];
      return `#${r}${r}${g}${g}${b}${b}`;
    }
    
    // Named colors - convert to hex (basic set)
    const namedColors: Record<string, string> = {
      'black': '#000000',
      'white': '#ffffff',
      'red': '#ff0000',
      'green': '#008000',
      'blue': '#0000ff',
      'yellow': '#ffff00',
      'cyan': '#00ffff',
      'magenta': '#ff00ff',
      'gray': '#808080',
      'grey': '#808080',
      'none': '#000000',
      'transparent': '#000000',
    };
    
    const lowerValue = value.toLowerCase();
    if (namedColors[lowerValue]) {
      return namedColors[lowerValue];
    }
    
    // Default to black if we can't parse
    return '#000000';
  }

  /**
   * Handle attribute value change
   * Only updates the document if validation passes
   */
  private handleAttributeChange(name: string, value: string) {
    if (!this.selectedElement) return;

    // Validate the attribute value before applying
    const isValid = this.validateAttribute(name, value);
    
    if (!isValid) {
      // Don't update the document if validation fails
      return;
    }

    // Update the attribute on the element
    this.selectedElement.setAttribute(name, value);

    // Update the current attributes map
    this.currentAttributes.set(name, value);

    // Update the document state
    // This will trigger updates in other views (canvas, raw SVG, hierarchy)
    const doc = documentState.svgDocument.get();
    if (doc) {
      // Serialize the updated document
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(doc);
      documentStateUpdater.updateRawSVG(svgString);
    }
  }

  /**
   * Validate attribute value
   * Returns true if valid, false otherwise
   */
  private validateAttribute(name: string, value: string): boolean {
    const fieldDiv = this.inspectorContainer?.querySelector(
      `.attribute-field[data-attribute-name="${name}"]`
    ) as HTMLElement | null;

    if (!fieldDiv) return true;

    const errorDiv = fieldDiv.querySelector('.attribute-error') as HTMLElement;
    const metadata = this.ATTRIBUTE_METADATA[name];

    // Clear previous error
    fieldDiv.classList.remove('error');
    if (errorDiv) errorDiv.textContent = '';

    // Validate based on type
    if (metadata?.type === 'number') {
      return this.validateNumberAttribute(value, metadata, fieldDiv, errorDiv);
    }

    if (metadata?.type === 'color') {
      return this.validateColorAttribute(value, fieldDiv, errorDiv);
    }

    if (metadata?.type === 'text') {
      return this.validateTextAttribute(name, value, fieldDiv, errorDiv);
    }

    if (metadata?.type === 'select') {
      return this.validateSelectAttribute(value, metadata, fieldDiv, errorDiv);
    }

    if (metadata?.type === 'viewBox') {
      // Basic validation: must be 4 numbers
      const parts = value.trim().split(/\s+/);
      if (parts.length !== 4 || parts.some(p => isNaN(parseFloat(p)))) {
        this.showValidationError(fieldDiv, errorDiv, 'Must be 4 numbers (x y w h)');
        return false;
      }
      return true;
    }

    return true;
  }

  /**
   * Validate number attribute
   */
  private validateNumberAttribute(
    value: string,
    metadata: AttributeMetadata,
    fieldDiv: HTMLElement,
    errorDiv: HTMLElement
  ): boolean {
    // Check if valid number first (parseFloat handles empty strings as NaN)
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      this.showValidationError(fieldDiv, errorDiv, 'Must be a valid number');
      return false;
    }

    // Check if infinite
    if (!isFinite(numValue)) {
      this.showValidationError(fieldDiv, errorDiv, 'Must be a finite number');
      return false;
    }

    // Check minimum value
    if (metadata.min !== undefined && numValue < metadata.min) {
      this.showValidationError(fieldDiv, errorDiv, `Must be at least ${metadata.min}`);
      return false;
    }

    // Check maximum value
    if (metadata.max !== undefined && numValue > metadata.max) {
      this.showValidationError(fieldDiv, errorDiv, `Must be at most ${metadata.max}`);
      return false;
    }

    return true;
  }

  /**
   * Validate color attribute
   */
  private validateColorAttribute(
    value: string,
    fieldDiv: HTMLElement,
    errorDiv: HTMLElement
  ): boolean {
    // Check if empty
    if (value.trim() === '') {
      this.showValidationError(fieldDiv, errorDiv, 'Color value is required');
      return false;
    }

    // Valid color formats:
    // - Hex: #RGB or #RRGGBB
    // - RGB: rgb(r, g, b)
    // - RGBA: rgba(r, g, b, a)
    // - Named colors: red, blue, etc.
    // - Special values: none, transparent, currentColor

    const trimmedValue = value.trim();

    // Check hex format
    if (trimmedValue.startsWith('#')) {
      const hexPattern = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
      if (hexPattern.test(trimmedValue)) {
        return true;
      }
      this.showValidationError(fieldDiv, errorDiv, 'Invalid hex color format (use #RGB or #RRGGBB)');
      return false;
    }

    // Check rgb/rgba format
    if (trimmedValue.startsWith('rgb')) {
      const rgbPattern = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;
      const rgbaPattern = /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(0|1|0?\.\d+)\s*\)$/;
      
      if (rgbPattern.test(trimmedValue) || rgbaPattern.test(trimmedValue)) {
        // Validate RGB values are in range 0-255
        const matches = trimmedValue.match(/\d+/g);
        if (matches) {
          const values = matches.slice(0, 3).map(Number);
          if (values.some(v => v < 0 || v > 255)) {
            this.showValidationError(fieldDiv, errorDiv, 'RGB values must be between 0 and 255');
            return false;
          }
        }
        return true;
      }
      this.showValidationError(fieldDiv, errorDiv, 'Invalid rgb/rgba format');
      return false;
    }

    // Check named colors and special values
    const namedColors = [
      'none', 'transparent', 'currentColor',
      'black', 'white', 'red', 'green', 'blue', 'yellow', 'cyan', 'magenta',
      'gray', 'grey', 'silver', 'maroon', 'olive', 'lime', 'aqua', 'teal',
      'navy', 'fuchsia', 'purple', 'orange', 'pink', 'brown', 'gold',
      'indigo', 'violet', 'tan', 'beige', 'coral', 'crimson', 'khaki',
      'lavender', 'salmon', 'turquoise', 'wheat'
    ];

    if (namedColors.includes(trimmedValue.toLowerCase())) {
      return true;
    }

    this.showValidationError(
      fieldDiv,
      errorDiv,
      'Invalid color format (use hex, rgb, rgba, or named color)'
    );
    return false;
  }

  /**
   * Validate text attribute
   */
  private validateTextAttribute(
    name: string,
    value: string,
    fieldDiv: HTMLElement,
    errorDiv: HTMLElement
  ): boolean {
    // Some text attributes are required and cannot be empty
    const requiredTextAttributes = ['id'];

    if (requiredTextAttributes.includes(name) && value.trim() === '') {
      this.showValidationError(fieldDiv, errorDiv, 'This attribute is required');
      return false;
    }

    // Validate ID format (must be valid XML ID)
    if (name === 'id' && value.trim() !== '') {
      // XML ID must start with letter or underscore, followed by letters, digits, hyphens, underscores, or periods
      const idPattern = /^[a-zA-Z_][a-zA-Z0-9_.-]*$/;
      if (!idPattern.test(value)) {
        this.showValidationError(
          fieldDiv,
          errorDiv,
          'ID must start with a letter or underscore and contain only letters, numbers, hyphens, underscores, or periods'
        );
        return false;
      }
    }

    return true;
  }

  /**
   * Validate select attribute (enum)
   */
  private validateSelectAttribute(
    value: string,
    metadata: AttributeMetadata,
    fieldDiv: HTMLElement,
    errorDiv: HTMLElement
  ): boolean {
    // Check if value is in the allowed options
    if (metadata.options && !metadata.options.includes(value)) {
      this.showValidationError(
        fieldDiv,
        errorDiv,
        `Must be one of: ${metadata.options.join(', ')}`
      );
      return false;
    }

    return true;
  }

  /**
   * Show validation error
   */
  private showValidationError(fieldDiv: HTMLElement, errorDiv: HTMLElement, message: string) {
    fieldDiv.classList.add('error');
    if (errorDiv) {
      errorDiv.textContent = message;
    }
  }

  /**
   * Register inspector sync callback with selection manager
   */
  private registerWithSelectionManager() {
    selectionManager.registerSyncCallbacks({
      onInspectorSync: () => {
        // Inspector sync is handled automatically through reactive effects
        // This callback is here for consistency with the architecture
      },
    });
  }

  /**
   * Get current attributes (for testing)
   */
  public getCurrentAttributes(): Map<string, string> {
    return new Map(this.currentAttributes);
  }

  /**
   * Get selected element (for testing)
   */
  public getSelectedElement(): SVGElement | null {
    return this.selectedElement;
  }
}

// Register the custom element
customElements.define('svg-attribute-inspector', SVGAttributeInspector);
