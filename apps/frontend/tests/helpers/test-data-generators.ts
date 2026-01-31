/**
 * Test Data Generators
 * 
 * Utilities for generating SVG content for testing purposes.
 * These generators create valid SVG strings that can be loaded into the editor.
 */

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
 * @returns SVG string content
 */
export function generateTestSVG(): string {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <!-- Basic Shapes -->
  <rect id="test-rect" x="100" y="100" width="100" height="100" fill="red" stroke="black" stroke-width="1"/>
  <circle id="test-circle" cx="300" cy="150" r="50" fill="blue" stroke="none"/>
  <ellipse id="test-ellipse" cx="500" cy="150" rx="60" ry="40" fill="green" stroke="none"/>
  
  <!-- Line -->
  <line id="test-line" x1="50" y1="50" x2="200" y2="50" stroke="black" stroke-width="2"/>
  
  <!-- Text -->
  <text id="test-text" x="100" y="300" font-family="Arial" font-size="24" fill="black">Test Text</text>
  
  <!-- Group -->
  <g id="test-group" transform="translate(400, 300)">
    <rect id="group-rect" x="0" y="0" width="50" height="50" fill="purple"/>
    <circle id="group-circle" cx="25" cy="25" r="15" fill="yellow"/>
  </g>
</svg>
`.trim();
}

/**
 * Generate a large SVG document for performance testing
 * 
 * Creates a grid of rectangles.
 * 
 * @param elementCount - Number of elements to generate
 * @returns SVG string content
 */
export function generateLargeSVG(elementCount: number): string {
  const width = Math.max(1000, Math.ceil(Math.sqrt(elementCount)) * 60);
  const height = width;
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n`;
  
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
    
    svg += `  <rect id="rect-${i}" x="${x}" y="${y}" width="50" height="50" fill="${color}" stroke="black" stroke-width="1"/>\n`;
  }
  
  svg += '</svg>';
  return svg;
}

/**
 * Generate an SVG with specific attributes for testing attribute editing
 * 
 * @returns SVG string content
 */
export function generateAttributeTestSVG(): string {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
  <rect id="attr-rect" x="50" y="50" width="100" height="100" fill="#ff0000" opacity="0.5" transform="rotate(45 100 100)"/>
  <circle id="attr-circle" cx="250" cy="100" r="40" fill="#00ff00" stroke="#0000ff" stroke-width="5"/>
  <text id="attr-text" x="50" y="250" font-size="20" font-family="serif">Editable Text</text>
</svg>
`.trim();
}
