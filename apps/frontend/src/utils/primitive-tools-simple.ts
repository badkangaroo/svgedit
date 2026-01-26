/**
 * Primitive Creation Tools (Simplified)
 * 
 * Handles creation of SVG primitives without document state dependencies.
 * This avoids circular dependency issues.
 * 
 * Requirements: 6.1, 6.2, 6.4
 */

import type { ToolType } from '../types';

/**
 * Default attributes for each primitive type
 */
export const DEFAULT_ATTRIBUTES = {
  rectangle: {
    width: 100,
    height: 80,
    fill: '#3b82f6',
    stroke: '#1e40af',
    strokeWidth: 2,
  },
  circle: {
    r: 50,
    fill: '#10b981',
    stroke: '#047857',
    strokeWidth: 2,
  },
  ellipse: {
    rx: 60,
    ry: 40,
    fill: '#8b5cf6',
    stroke: '#6d28d9',
    strokeWidth: 2,
  },
  line: {
    stroke: '#ef4444',
    strokeWidth: 3,
    strokeLinecap: 'round',
  },
  path: {
    fill: 'none',
    stroke: '#f59e0b',
    strokeWidth: 3,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  },
  text: {
    fill: '#1f2937',
    fontSize: 24,
    fontFamily: 'Arial, sans-serif',
    textContent: 'Text',
  },
  group: {
    // Groups don't have visual attributes by default
  },
};

/**
 * Get the SVG element tag name for a tool type
 */
export function getElementTagName(tool: ToolType): string {
  switch (tool) {
    case 'rectangle':
      return 'rect';
    case 'circle':
      return 'circle';
    case 'ellipse':
      return 'ellipse';
    case 'line':
      return 'line';
    case 'path':
      return 'path';
    case 'text':
      return 'text';
    case 'group':
      return 'g';
    default:
      return 'rect';
  }
}

/**
 * Create a primitive element with default attributes
 */
export function createPrimitiveElement(
  tool: ToolType,
  startX: number,
  startY: number,
  currentX: number,
  currentY: number
): SVGElement {
  const element = document.createElementNS('http://www.w3.org/2000/svg', getElementTagName(tool));
  setPrimitiveAttributes(element, tool, startX, startY, currentX, currentY);
  return element;
}

/**
 * Set attributes on a primitive element
 */
function setPrimitiveAttributes(
  element: SVGElement,
  tool: ToolType,
  startX: number,
  startY: number,
  currentX: number,
  currentY: number
): void {
  switch (tool) {
    case 'rectangle': {
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);
      const x = Math.min(startX, currentX);
      const y = Math.min(startY, currentY);
      
      const finalWidth = width < 10 ? DEFAULT_ATTRIBUTES.rectangle.width : width;
      const finalHeight = height < 10 ? DEFAULT_ATTRIBUTES.rectangle.height : height;
      
      element.setAttribute('x', x.toString());
      element.setAttribute('y', y.toString());
      element.setAttribute('width', finalWidth.toString());
      element.setAttribute('height', finalHeight.toString());
      element.setAttribute('fill', DEFAULT_ATTRIBUTES.rectangle.fill);
      element.setAttribute('stroke', DEFAULT_ATTRIBUTES.rectangle.stroke);
      element.setAttribute('stroke-width', DEFAULT_ATTRIBUTES.rectangle.strokeWidth.toString());
      break;
    }

    case 'circle': {
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);
      const radius = Math.sqrt(width * width + height * height) / 2;
      const finalRadius = radius < 10 ? DEFAULT_ATTRIBUTES.circle.r : radius;
      
      element.setAttribute('cx', startX.toString());
      element.setAttribute('cy', startY.toString());
      element.setAttribute('r', finalRadius.toString());
      element.setAttribute('fill', DEFAULT_ATTRIBUTES.circle.fill);
      element.setAttribute('stroke', DEFAULT_ATTRIBUTES.circle.stroke);
      element.setAttribute('stroke-width', DEFAULT_ATTRIBUTES.circle.strokeWidth.toString());
      break;
    }

    case 'ellipse': {
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);
      const finalRx = width < 10 ? DEFAULT_ATTRIBUTES.ellipse.rx : width / 2;
      const finalRy = height < 10 ? DEFAULT_ATTRIBUTES.ellipse.ry : height / 2;
      
      element.setAttribute('cx', startX.toString());
      element.setAttribute('cy', startY.toString());
      element.setAttribute('rx', finalRx.toString());
      element.setAttribute('ry', finalRy.toString());
      element.setAttribute('fill', DEFAULT_ATTRIBUTES.ellipse.fill);
      element.setAttribute('stroke', DEFAULT_ATTRIBUTES.ellipse.stroke);
      element.setAttribute('stroke-width', DEFAULT_ATTRIBUTES.ellipse.strokeWidth.toString());
      break;
    }

    case 'line': {
      const distance = Math.sqrt(
        Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2)
      );
      
      let x2 = currentX;
      let y2 = currentY;
      
      if (distance < 10) {
        x2 = startX + 100;
        y2 = startY;
      }
      
      element.setAttribute('x1', startX.toString());
      element.setAttribute('y1', startY.toString());
      element.setAttribute('x2', x2.toString());
      element.setAttribute('y2', y2.toString());
      element.setAttribute('stroke', DEFAULT_ATTRIBUTES.line.stroke);
      element.setAttribute('stroke-width', DEFAULT_ATTRIBUTES.line.strokeWidth.toString());
      element.setAttribute('stroke-linecap', DEFAULT_ATTRIBUTES.line.strokeLinecap);
      break;
    }

    case 'path': {
      const distance = Math.sqrt(
        Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2)
      );
      
      let endX = currentX;
      let endY = currentY;
      
      if (distance < 10) {
        endX = startX + 100;
        endY = startY + 50;
      }
      
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      const d = `M ${startX} ${startY} Q ${midX} ${startY}, ${midX} ${midY} T ${endX} ${endY}`;
      
      element.setAttribute('d', d);
      element.setAttribute('fill', DEFAULT_ATTRIBUTES.path.fill);
      element.setAttribute('stroke', DEFAULT_ATTRIBUTES.path.stroke);
      element.setAttribute('stroke-width', DEFAULT_ATTRIBUTES.path.strokeWidth.toString());
      element.setAttribute('stroke-linecap', DEFAULT_ATTRIBUTES.path.strokeLinecap);
      element.setAttribute('stroke-linejoin', DEFAULT_ATTRIBUTES.path.strokeLinejoin);
      break;
    }

    case 'text':
      element.setAttribute('x', startX.toString());
      element.setAttribute('y', startY.toString());
      element.setAttribute('fill', DEFAULT_ATTRIBUTES.text.fill);
      element.setAttribute('font-size', DEFAULT_ATTRIBUTES.text.fontSize.toString());
      element.setAttribute('font-family', DEFAULT_ATTRIBUTES.text.fontFamily);
      element.textContent = DEFAULT_ATTRIBUTES.text.textContent;
      break;

    case 'group':
      element.setAttribute('transform', `translate(${startX}, ${startY})`);
      break;
  }
}
