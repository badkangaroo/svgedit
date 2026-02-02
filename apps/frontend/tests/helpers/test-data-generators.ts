/**
 * Test Data Generators
 * 
 * Utilities for generating SVG content for testing purposes.
 * These generators create valid SVG strings that can be loaded into the editor.
 * 
 * IMPORTANT: All generated elements include `data-uuid` attributes for stable test assertions.
 * This matches the behavior of the parser which assigns UUIDs on load.
 */

/**
 * Generate a UUID v4 string
 * Uses crypto.randomUUID() if available, otherwise generates a compliant UUID
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate a standard test SVG with various element types
 * 
 * Includes:
 * - Rectangle
 * - Circle
 * - Ellipse
 * - Line
 * - Text
 * - Group with nested elements
 * 
 * All elements include `data-uuid` attributes for stable test identification.
 * 
 * @returns SVG string content
 */
export function generateTestSVG(): string {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" data-uuid="${generateUUID()}">
  <!-- Basic Shapes -->
  <rect id="test-rect" data-uuid="${generateUUID()}" x="100" y="100" width="100" height="100" fill="red" stroke="black" stroke-width="1"/>
  <circle id="test-circle" data-uuid="${generateUUID()}" cx="300" cy="150" r="50" fill="blue" stroke="none"/>
  <ellipse id="test-ellipse" data-uuid="${generateUUID()}" cx="500" cy="150" rx="60" ry="40" fill="green" stroke="none"/>
  
  <!-- Line -->
  <line id="test-line" data-uuid="${generateUUID()}" x1="50" y1="50" x2="200" y2="50" stroke="black" stroke-width="2"/>
  
  <!-- Text -->
  <text id="test-text" data-uuid="${generateUUID()}" x="100" y="300" font-family="Arial" font-size="24" fill="black">Test Text</text>
  
  <!-- Group -->
  <g id="test-group" data-uuid="${generateUUID()}" transform="translate(400, 300)">
    <rect id="group-rect" data-uuid="${generateUUID()}" x="0" y="0" width="50" height="50" fill="purple"/>
    <circle id="group-circle" data-uuid="${generateUUID()}" cx="25" cy="25" r="15" fill="yellow"/>
  </g>
</svg>
`.trim();
}

/**
 * Generate a large SVG document for performance testing
 * 
 * Creates a grid of rectangles. All elements include `data-uuid` attributes.
 * 
 * @param elementCount - Number of elements to generate
 * @returns SVG string content
 */
export function generateLargeSVG(elementCount: number): string {
  const width = Math.max(1000, Math.ceil(Math.sqrt(elementCount)) * 60);
  const height = width;
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" data-uuid="${generateUUID()}">\n`;
  
  const cols = Math.ceil(Math.sqrt(elementCount));
  
  for (let i = 0; i < elementCount; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    
    const x = col * 60 + 10;
    const y = row * 60 + 10;
    
    // Vary colors to make it visually interesting/distinct
    const r = Math.floor((i / elementCount) * 255);
    const g = Math.floor((col / cols) * 255);
    const b = Math.floor((row / cols) * 255);
    const color = `rgb(${r},${g},${b})`;
    
    svg += `  <rect id="rect-${i}" data-uuid="${generateUUID()}" x="${x}" y="${y}" width="50" height="50" fill="${color}" stroke="black" stroke-width="1"/>\n`;
  }
  
  svg += '</svg>';
  return svg;
}

/**
 * Generate a simple SVG for basic testing
 * 
 * All elements include `data-uuid` attributes.
 * 
 * @returns SVG string content
 */
export function generateSimpleTestSVG(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" data-uuid="${generateUUID()}">
  <rect id="simple-rect" data-uuid="${generateUUID()}" x="10" y="10" width="80" height="80" fill="blue" stroke="black"/>
</svg>`;
}

/**
 * Generate SVG for attribute-editing tests
 * 
 * All elements include `data-uuid` attributes.
 *
 * @returns SVG string content
 */
export function generateAttributeTestSVG(): string {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" data-uuid="${generateUUID()}">
  <rect id="attr-rect" data-uuid="${generateUUID()}" x="50" y="50" width="100" height="100" fill="#ff0000" opacity="0.5" transform="rotate(45 100 100)"/>
  <circle id="attr-circle" data-uuid="${generateUUID()}" cx="250" cy="100" r="40" fill="#00ff00" stroke="#0000ff" stroke-width="5"/>
  <text id="attr-text" data-uuid="${generateUUID()}" x="50" y="250" font-size="20" font-family="serif">Editable Text</text>
</svg>
`.trim();
}
