/**
 * Example demonstrating parser and serializer integration
 * 
 * This example shows how the SVG parser and serializer work together
 * to provide round-trip conversion between SVG text and DOM elements.
 */

import { parseSVG } from './svg-parser';
import { serializeSVG } from './svg-serializer';

// Example 1: Parse and serialize a simple SVG
function example1() {
  const svgText = `
    <svg width="100" height="100">
      <rect x="10" y="10" width="80" height="80" fill="blue" />
    </svg>
  `;
  
  // Parse the SVG text
  const parseResult = parseSVG(svgText);
  
  if (parseResult.success && parseResult.document) {
    console.log('Parsed successfully!');
    console.log('Document tree:', parseResult.tree);
    
    // Serialize back to text
    const serialized = serializeSVG(parseResult.document);
    console.log('Serialized SVG:');
    console.log(serialized);
  }
}

// Example 2: Round-trip with editor attributes
function example2() {
  const svgText = `
    <svg width="200" height="200">
      <g id="my-group">
        <circle cx="50" cy="50" r="25" fill="red" />
        <circle cx="150" cy="50" r="25" fill="green" />
      </g>
    </svg>
  `;
  
  // Parse the SVG (adds editor IDs)
  const parseResult = parseSVG(svgText);
  
  if (parseResult.success && parseResult.document) {
    console.log('Original SVG has editor IDs added during parsing');
    
    // The document now has svg-node-* IDs
    const withEditorIds = parseResult.document.outerHTML;
    console.log('With editor IDs:', withEditorIds);
    
    // Serialize (cleans up editor IDs)
    const serialized = serializeSVG(parseResult.document);
    console.log('Serialized (cleaned up):');
    console.log(serialized);
    
    // The serialized output has original IDs restored
    // and editor-specific attributes removed
  }
}

// Example 3: Formatting options
function example3() {
  const svgText = '<svg><rect x="0" y="0" width="100" height="100" /></svg>';
  
  const parseResult = parseSVG(svgText);
  
  if (parseResult.success && parseResult.document) {
    // Default: pretty-printed with 2-space indentation
    const pretty = serializeSVG(parseResult.document);
    console.log('Pretty-printed:');
    console.log(pretty);
    
    // Custom serializer with different options
    const { SVGSerializer } = require('./svg-serializer');
    
    // Compact output
    const compactSerializer = new SVGSerializer({ prettyPrint: false });
    const compact = compactSerializer.serialize(parseResult.document);
    console.log('Compact:', compact);
    
    // Tab indentation
    const tabSerializer = new SVGSerializer({ indent: '\t' });
    const tabbed = tabSerializer.serialize(parseResult.document);
    console.log('Tab-indented:');
    console.log(tabbed);
  }
}

// Example 4: Error handling
function example4() {
  const invalidSVG = '<svg><rect x="10" y="20"</svg>'; // Missing closing >
  
  const parseResult = parseSVG(invalidSVG);
  
  if (!parseResult.success) {
    console.log('Parse failed!');
    console.log('Errors:', parseResult.errors);
    
    // Display errors to user
    parseResult.errors.forEach(error => {
      console.log(`Line ${error.line}, Column ${error.column}: ${error.message}`);
    });
  }
}

// Example 5: Integration with document state
function example5() {
  const svgText = `
    <svg width="300" height="300">
      <rect id="rect1" x="10" y="10" width="100" height="100" />
      <circle id="circle1" cx="200" cy="200" r="50" />
    </svg>
  `;
  
  // Parse the SVG
  const parseResult = parseSVG(svgText);
  
  if (parseResult.success && parseResult.document) {
    // In the actual editor, this would update the document state
    // documentStateUpdater.setDocument(
    //   parseResult.document,
    //   parseResult.tree,
    //   serializeSVG(parseResult.document)
    // );
    
    console.log('Document loaded into editor state');
    console.log('Tree structure:', parseResult.tree);
    
    // Later, when saving...
    const svgToSave = serializeSVG(parseResult.document);
    console.log('SVG ready to save:');
    console.log(svgToSave);
  }
}

// Run examples
if (require.main === module) {
  console.log('=== Example 1: Basic Parse and Serialize ===');
  example1();
  
  console.log('\n=== Example 2: Round-trip with Editor Attributes ===');
  example2();
  
  console.log('\n=== Example 3: Formatting Options ===');
  example3();
  
  console.log('\n=== Example 4: Error Handling ===');
  example4();
  
  console.log('\n=== Example 5: Document State Integration ===');
  example5();
}

export { example1, example2, example3, example4, example5 };
