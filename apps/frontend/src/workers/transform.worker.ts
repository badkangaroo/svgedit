/**
 * Transform Web Worker
 * 
 * Handles complex transformations for large SVG documents in a background thread
 * to keep the main UI thread responsive.
 * 
 * Requirements: 14.2
 */

/**
 * Message types for worker communication
 */
interface TransformMessage {
  type: 'move' | 'resize' | 'rotate' | 'delete';
  requestId: string;
  elementIds: string[];
  params: MoveParams | ResizeParams | RotateParams | DeleteParams;
  serializedSVG: string;
}

interface MoveParams {
  deltaX: number;
  deltaY: number;
}

interface ResizeParams {
  elementId: string;
  newWidth: number;
  newHeight: number;
}

interface RotateParams {
  elementId: string;
  angle: number;
  centerX: number;
  centerY: number;
}

interface DeleteParams {
  // No additional params needed for delete
}

interface ProgressMessage {
  type: 'progress';
  requestId: string;
  percent: number;
  message: string;
}

interface ResultMessage {
  type: 'result';
  requestId: string;
  serializedSVG: string;
  success: boolean;
}

interface ErrorMessage {
  type: 'error';
  requestId: string;
  error: string;
}

type WorkerMessage = TransformMessage;
type WorkerResponse = ProgressMessage | ResultMessage | ErrorMessage;

/**
 * Parse SVG text to DOM
 */
function parseSVG(svgText: string): Document {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Failed to parse SVG');
  }
  
  return doc;
}

/**
 * Serialize DOM to SVG text
 */
function serializeSVG(doc: Document): string {
  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc.documentElement);
}

/**
 * Move element by updating position attributes
 */
function moveElement(element: Element, deltaX: number, deltaY: number): void {
  const tagName = element.tagName.toLowerCase();
  
  switch (tagName) {
    case 'rect':
    case 'image':
    case 'text':
    case 'use':
      // These elements use x and y attributes
      moveByXY(element, deltaX, deltaY);
      break;
      
    case 'circle':
    case 'ellipse':
      // Circle and ellipse use cx and cy attributes
      moveByCxCy(element, deltaX, deltaY);
      break;
      
    case 'line':
      // Line uses x1, y1, x2, y2 attributes
      moveLineByCoordinates(element, deltaX, deltaY);
      break;
      
    case 'path':
    case 'polygon':
    case 'polyline':
    case 'g':
      // These elements use transform attribute
      moveByTransform(element, deltaX, deltaY);
      break;
      
    default:
      // For unknown elements, try transform
      moveByTransform(element, deltaX, deltaY);
      break;
  }
}

/**
 * Move element by updating x and y attributes
 */
function moveByXY(element: Element, deltaX: number, deltaY: number): void {
  const x = parseFloat(element.getAttribute('x') || '0');
  const y = parseFloat(element.getAttribute('y') || '0');
  
  element.setAttribute('x', (x + deltaX).toString());
  element.setAttribute('y', (y + deltaY).toString());
}

/**
 * Move element by updating cx and cy attributes
 */
function moveByCxCy(element: Element, deltaX: number, deltaY: number): void {
  const cx = parseFloat(element.getAttribute('cx') || '0');
  const cy = parseFloat(element.getAttribute('cy') || '0');
  
  element.setAttribute('cx', (cx + deltaX).toString());
  element.setAttribute('cy', (cy + deltaY).toString());
}

/**
 * Move line by updating x1, y1, x2, y2 attributes
 */
function moveLineByCoordinates(element: Element, deltaX: number, deltaY: number): void {
  const x1 = parseFloat(element.getAttribute('x1') || '0');
  const y1 = parseFloat(element.getAttribute('y1') || '0');
  const x2 = parseFloat(element.getAttribute('x2') || '0');
  const y2 = parseFloat(element.getAttribute('y2') || '0');
  
  element.setAttribute('x1', (x1 + deltaX).toString());
  element.setAttribute('y1', (y1 + deltaY).toString());
  element.setAttribute('x2', (x2 + deltaX).toString());
  element.setAttribute('y2', (y2 + deltaY).toString());
}

/**
 * Move element by updating or adding a transform attribute
 */
function moveByTransform(element: Element, deltaX: number, deltaY: number): void {
  const currentTransform = element.getAttribute('transform') || '';
  
  // Parse existing translate if present
  const translateMatch = currentTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
  
  if (translateMatch) {
    // Update existing translate
    const currentX = parseFloat(translateMatch[1]);
    const currentY = parseFloat(translateMatch[2]);
    const newX = currentX + deltaX;
    const newY = currentY + deltaY;
    
    const newTransform = currentTransform.replace(
      /translate\([^)]+\)/,
      `translate(${newX}, ${newY})`
    );
    element.setAttribute('transform', newTransform);
  } else {
    // Add new translate
    const newTransform = currentTransform
      ? `translate(${deltaX}, ${deltaY}) ${currentTransform}`
      : `translate(${deltaX}, ${deltaY})`;
    element.setAttribute('transform', newTransform);
  }
}

/**
 * Process move transformation
 */
function processMove(
  doc: Document,
  elementIds: string[],
  params: MoveParams,
  requestId: string
): void {
  postMessage({
    type: 'progress',
    requestId,
    percent: 10,
    message: 'Processing move operation...',
  } as ProgressMessage);
  
  const { deltaX, deltaY } = params;
  const totalElements = elementIds.length;
  
  // Move each element
  elementIds.forEach((id, index) => {
    const element = doc.querySelector(`[id="${id}"]`);
    if (element) {
      moveElement(element, deltaX, deltaY);
    }
    
    // Send progress updates
    const percent = 10 + Math.floor((index / totalElements) * 80);
    if (index % Math.max(1, Math.floor(totalElements / 10)) === 0) {
      postMessage({
        type: 'progress',
        requestId,
        percent,
        message: `Moving elements (${index + 1}/${totalElements})...`,
      } as ProgressMessage);
    }
  });
  
  postMessage({
    type: 'progress',
    requestId,
    percent: 90,
    message: 'Serializing result...',
  } as ProgressMessage);
  
  const serializedSVG = serializeSVG(doc);
  
  postMessage({
    type: 'result',
    requestId,
    serializedSVG,
    success: true,
  } as ResultMessage);
}

/**
 * Process delete transformation
 */
function processDelete(
  doc: Document,
  elementIds: string[],
  requestId: string
): void {
  postMessage({
    type: 'progress',
    requestId,
    percent: 10,
    message: 'Processing delete operation...',
  } as ProgressMessage);
  
  const totalElements = elementIds.length;
  
  // Delete each element
  elementIds.forEach((id, index) => {
    const element = doc.querySelector(`[id="${id}"]`);
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
    
    // Send progress updates
    const percent = 10 + Math.floor((index / totalElements) * 80);
    if (index % Math.max(1, Math.floor(totalElements / 10)) === 0) {
      postMessage({
        type: 'progress',
        requestId,
        percent,
        message: `Deleting elements (${index + 1}/${totalElements})...`,
      } as ProgressMessage);
    }
  });
  
  postMessage({
    type: 'progress',
    requestId,
    percent: 90,
    message: 'Serializing result...',
  } as ProgressMessage);
  
  const serializedSVG = serializeSVG(doc);
  
  postMessage({
    type: 'result',
    requestId,
    serializedSVG,
    success: true,
  } as ResultMessage);
}

/**
 * Worker message handler
 */
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;
  const { type, requestId, elementIds, params, serializedSVG } = message;
  
  try {
    // Parse the SVG
    const doc = parseSVG(serializedSVG);
    
    // Process based on operation type
    switch (type) {
      case 'move':
        processMove(doc, elementIds, params as MoveParams, requestId);
        break;
        
      case 'delete':
        processDelete(doc, elementIds, requestId);
        break;
        
      case 'resize':
      case 'rotate':
        // Not implemented yet - can be added in future tasks
        postMessage({
          type: 'error',
          requestId,
          error: `Operation type "${type}" not yet implemented`,
        } as ErrorMessage);
        break;
        
      default:
        postMessage({
          type: 'error',
          requestId,
          error: `Unknown operation type: ${type}`,
        } as ErrorMessage);
    }
  } catch (error) {
    postMessage({
      type: 'error',
      requestId,
      error: error instanceof Error ? error.message : 'Unknown transformation error',
    } as ErrorMessage);
  }
};

// Export types for use in main thread
export type {
  TransformMessage,
  MoveParams,
  ResizeParams,
  RotateParams,
  DeleteParams,
  ProgressMessage,
  ResultMessage,
  ErrorMessage,
  WorkerMessage,
  WorkerResponse,
};
