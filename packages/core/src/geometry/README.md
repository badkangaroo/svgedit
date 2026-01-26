# Geometry Module

This module provides mathematical utilities for SVG geometry operations, including 2D affine transformations, bounding box calculations, and path manipulation.

## Matrix Transformations

The matrix transformation utilities provide operations for working with 2D affine transformation matrices used in SVG transforms.

### Matrix Representation

Matrices are represented as 6-element tuples `[a, b, c, d, e, f]` corresponding to the transformation matrix:

```
| a c e |
| b d f |
| 0 0 1 |
```

When applied to a point (x, y), the transformation is:
- `x' = a*x + c*y + e`
- `y' = b*x + d*y + f`

### Core Operations

#### `identity(): Matrix`
Creates an identity matrix that performs no transformation.

```typescript
const id = identity(); // [1, 0, 0, 1, 0, 0]
```

#### `compose(m1: Matrix, m2: Matrix): Matrix`
Composes two transformation matrices by multiplying them. The result applies m2 first, then m1.

```typescript
const translate = [1, 0, 0, 1, 10, 20];
const scale = [2, 0, 0, 2, 0, 0];
const combined = compose(translate, scale);
// First scales by 2, then translates by (10, 20)
```

#### `inverse(m: Matrix): Result<Matrix, MatrixError>`
Calculates the inverse of a transformation matrix. Returns an error if the matrix is singular (determinant is zero).

```typescript
const m = [2, 0, 0, 2, 10, 20];
const result = inverse(m);

if (result.ok) {
  const inv = result.value;
  const id = compose(m, inv); // Should equal identity
}
```

#### `applyToPoint(m: Matrix, point: Point): Point`
Applies a transformation matrix to a point.

```typescript
const translate = [1, 0, 0, 1, 10, 20];
const point = { x: 5, y: 5 };
const transformed = applyToPoint(translate, point);
// transformed === { x: 15, y: 25 }
```

### Helper Functions

#### `translate(tx: number, ty: number): Matrix`
Creates a translation matrix that shifts points by (tx, ty).

```typescript
const m = translate(10, 20);
```

#### `scale(sx: number, sy: number): Matrix`
Creates a scale matrix that multiplies coordinates by (sx, sy).

```typescript
const m = scale(2, 3);
```

#### `rotate(angle: number): Matrix`
Creates a rotation matrix that rotates points counterclockwise by the given angle (in radians).

```typescript
const m = rotate(Math.PI / 2); // 90 degrees
```

#### `decompose(m: Matrix): TransformComponents`
Decomposes a transformation matrix into its constituent components: translate, rotate, scale, and skew.

```typescript
const m = compose(
  translate(10, 20),
  compose(rotate(Math.PI / 4), scale(2, 3))
);

const components = decompose(m);
// components.translateX === 10
// components.translateY === 20
// components.rotation === Math.PI / 4
// components.scaleX === 2
// components.scaleY === 3
// components.skew === 0
```

**Note**: Matrix decomposition is not unique. For example, a matrix can represent the same transformation with different combinations of rotation and skew. This function returns one valid decomposition using the QR decomposition method.

## Usage Examples

### Basic Transformation

```typescript
import { translate, applyToPoint } from '@svg-edit/core';

const point = { x: 10, y: 20 };
const transform = translate(5, 10);
const result = applyToPoint(transform, point);
// result === { x: 15, y: 30 }
```

### Composing Transformations

```typescript
import { translate, scale, rotate, compose, applyToPoint } from '@svg-edit/core';

// Create individual transformations
const t = translate(100, 100);
const s = scale(2, 2);
const r = rotate(Math.PI / 4); // 45 degrees

// Compose them (applied right to left: rotate, then scale, then translate)
const combined = compose(t, compose(s, r));

// Apply to a point
const point = { x: 10, y: 0 };
const result = applyToPoint(combined, point);
```

### Undoing Transformations

```typescript
import { translate, scale, compose, inverse, applyToPoint } from '@svg-edit/core';

const original = { x: 100, y: 200 };

// Create and apply transformation
const transform = compose(translate(50, 100), scale(2, 3));
const transformed = applyToPoint(transform, original);

// Get inverse and apply to restore original
const invResult = inverse(transform);
if (invResult.ok) {
  const restored = applyToPoint(invResult.value, transformed);
  // restored ≈ original
}
```

### Nested Group Transformations

```typescript
import { translate, scale, rotate, compose, applyToPoint } from '@svg-edit/core';

// Simulate nested SVG groups with transforms
const parentTransform = translate(100, 100);
const childTransform = scale(2, 2);
const elementTransform = rotate(Math.PI / 4);

// Compose all transforms (parent is applied last)
const combined = compose(
  parentTransform,
  compose(childTransform, elementTransform)
);

const point = { x: 10, y: 0 };
const result = applyToPoint(combined, point);
```

### Analyzing Transformations

```typescript
import { decompose } from '@svg-edit/core';

// Given an existing transformation matrix
const matrix = [1.414, 1.414, -1.414, 1.414, 10, 20];

// Extract its components
const components = decompose(matrix);
console.log(`Translation: (${components.translateX}, ${components.translateY})`);
console.log(`Rotation: ${components.rotation} radians`);
console.log(`Scale: (${components.scaleX}, ${components.scaleY})`);
console.log(`Skew: ${components.skew}`);
```

## Mathematical Properties

The matrix operations satisfy several important mathematical properties:

### Associativity
Matrix composition is associative: `(A * B) * C = A * (B * C)`

### Identity Element
The identity matrix is neutral: `I * M = M * I = M`

### Inverse Property
For invertible matrices: `M * M^-1 = M^-1 * M = I`

### Non-Commutativity
Matrix multiplication is not commutative: `A * B ≠ B * A` (in general)

## Error Handling

Operations that can fail (like `inverse`) return a `Result<T, E>` type:

```typescript
const result = inverse(matrix);

if (result.ok) {
  // Success - use result.value
  const inv = result.value;
} else {
  // Error - check result.error
  console.error(result.error.message);
  console.error(result.error.code); // ErrorCode.INVALID_MATRIX
}
```

## Testing

The module includes comprehensive test coverage:

- **Matrix unit tests** (`matrix.test.ts`): 61 tests covering all operations and edge cases
- **Matrix integration tests** (`matrix.integration.test.ts`): 14 tests covering realistic SVG transformation scenarios
- **Bounding box unit tests** (`bbox.test.ts`): 38 tests covering all basic shapes and edge cases

Run tests with:
```bash
npm test
```

## Bounding Box Calculations

The bounding box utilities calculate the smallest axis-aligned rectangle that completely contains an SVG shape. Bounding boxes are essential for hit testing, selection, layout, and collision detection.

### BoundingBox Type

A bounding box is represented as:

```typescript
interface BoundingBox {
  x: number;      // X coordinate of top-left corner
  y: number;      // Y coordinate of top-left corner
  width: number;  // Width of the bounding box
  height: number; // Height of the bounding box
}
```

All coordinates are in the element's local coordinate system (before any transforms are applied).

### Basic Shape Functions

#### `bboxRect(x: number, y: number, width: number, height: number): BoundingBox`
Calculates the bounding box for a rectangle element.

```typescript
const bbox = bboxRect(10, 20, 100, 50);
// bbox = { x: 10, y: 20, width: 100, height: 50 }
```

For rectangles, the bounding box is simply the rectangle itself.

#### `bboxCircle(cx: number, cy: number, r: number): BoundingBox`
Calculates the bounding box for a circle element.

```typescript
const bbox = bboxCircle(50, 50, 25);
// bbox = { x: 25, y: 25, width: 50, height: 50 }
```

The bounding box is the smallest square that contains the circle.

#### `bboxEllipse(cx: number, cy: number, rx: number, ry: number): BoundingBox`
Calculates the bounding box for an ellipse element.

```typescript
const bbox = bboxEllipse(50, 50, 30, 20);
// bbox = { x: 20, y: 30, width: 60, height: 40 }
```

The bounding box is the smallest rectangle that contains the ellipse.

#### `bboxLine(x1: number, y1: number, x2: number, y2: number): BoundingBox`
Calculates the bounding box for a line element.

```typescript
const bbox = bboxLine(10, 20, 100, 80);
// bbox = { x: 10, y: 20, width: 90, height: 60 }
```

The bounding box is the smallest rectangle containing both endpoints. Note: This does not account for stroke width.

#### `bboxPath(pathData: string): BoundingBox`
Calculates the bounding box for a path element by parsing the path data and analyzing all commands.

```typescript
// Simple line path
const bbox1 = bboxPath("M 10 10 L 50 50");
// bbox1 = { x: 10, y: 10, width: 40, height: 40 }

// Path with curve
const bbox2 = bboxPath("M 0 0 Q 50 100 100 0");
// bbox2 accounts for the curve's peak

// Complex path with multiple commands
const bbox3 = bboxPath("M 10 10 H 110 V 60 H 10 Z");
// bbox3 = { x: 10, y: 10, width: 100, height: 50 }
```

This function handles all SVG path commands including:
- **Move/Line commands**: M, m, L, l, H, h, V, v
- **Cubic Bezier curves**: C, c, S, s (including extrema calculation)
- **Quadratic Bezier curves**: Q, q, T, t (including extrema calculation)
- **Elliptical arcs**: A, a
- **Close path**: Z, z

The bounding box calculation accounts for curve extrema to ensure the box completely contains the path, not just its control points and endpoints.

#### `bboxGroup(children: BoundingBox[]): BoundingBox`
Calculates the bounding box for a group element by computing the union of all child bounding boxes.

```typescript
// Group with two rectangles
const child1 = bboxRect(0, 0, 50, 50);
const child2 = bboxRect(40, 40, 50, 50);
const groupBox = bboxGroup([child1, child2]);
// groupBox = { x: 0, y: 0, width: 90, height: 90 }

// Empty group
const emptyBox = bboxGroup([]);
// emptyBox = { x: 0, y: 0, width: 0, height: 0 }

// Single child
const singleBox = bboxGroup([bboxCircle(50, 50, 25)]);
// singleBox = { x: 25, y: 25, width: 50, height: 50 }

// Mixed shape types
const rect = bboxRect(0, 0, 50, 50);
const circle = bboxCircle(100, 100, 25);
const line = bboxLine(150, 150, 200, 200);
const mixedBox = bboxGroup([rect, circle, line]);
// mixedBox = { x: 0, y: 0, width: 200, height: 200 }
```

This function is useful for:
- Calculating bounds of nested SVG structures
- Determining selection bounds for multiple elements
- Layout calculations for grouped content
- Handling SVG `<g>` elements

The union is the smallest rectangle that contains all child bounding boxes.

#### `bboxTransform(bbox: BoundingBox, matrix: Matrix): BoundingBox`
Applies a transformation matrix to a bounding box and returns the new axis-aligned bounding box.

```typescript
import { bboxRect, bboxTransform, translate, rotate, scale } from '@svg-edit/core';

// Original bounding box
const bbox = bboxRect(0, 0, 100, 50);

// Translate by (10, 20)
const translated = bboxTransform(bbox, translate(10, 20));
// translated = { x: 10, y: 20, width: 100, height: 50 }

// Scale by 2x
const scaled = bboxTransform(bbox, scale(2, 2));
// scaled = { x: 0, y: 0, width: 200, height: 100 }

// Rotate by 45 degrees (π/4 radians)
const rotated = bboxTransform(bbox, rotate(Math.PI / 4));
// rotated will be larger due to rotation, containing all corners

// Complex transform (scale then rotate then translate)
const complex = compose(translate(50, 50), compose(rotate(Math.PI / 6), scale(1.5, 1.5)));
const transformed = bboxTransform(bbox, complex);
```

This function:
1. Transforms all four corners of the bounding box using the matrix
2. Calculates the new axis-aligned bounding box that contains all transformed corners

**Note**: The result is always an axis-aligned bounding box, even if the original box is rotated. This means the transformed box may be larger than the original if rotation is involved.

This is essential for:
- Calculating screen-space bounds of transformed elements
- Hit testing with transforms
- Layout calculations with rotated/scaled elements
- Selection bounds for transformed shapes

### Usage Examples

#### Basic Bounding Box Calculation

```typescript
import { bboxRect, bboxCircle } from '@svg-edit/core';

// Rectangle
const rectBox = bboxRect(0, 0, 100, 50);

// Circle
const circleBox = bboxCircle(50, 50, 25);

// Check if they overlap
const overlaps = !(
  rectBox.x + rectBox.width < circleBox.x ||
  circleBox.x + circleBox.width < rectBox.x ||
  rectBox.y + rectBox.height < circleBox.y ||
  circleBox.y + circleBox.height < rectBox.y
);
```

#### Hit Testing

```typescript
import { bboxRect } from '@svg-edit/core';

function pointInBoundingBox(
  point: { x: number; y: number },
  bbox: BoundingBox
): boolean {
  return (
    point.x >= bbox.x &&
    point.x <= bbox.x + bbox.width &&
    point.y >= bbox.y &&
    point.y <= bbox.y + bbox.height
  );
}

const bbox = bboxRect(10, 10, 100, 100);
const isInside = pointInBoundingBox({ x: 50, y: 50 }, bbox); // true
```

#### Edge Cases

```typescript
import { bboxLine, bboxCircle } from '@svg-edit/core';

// Horizontal line (zero height)
const hLine = bboxLine(10, 50, 100, 50);
// hLine = { x: 10, y: 50, width: 90, height: 0 }

// Vertical line (zero width)
const vLine = bboxLine(50, 10, 50, 100);
// vLine = { x: 50, y: 10, width: 0, height: 90 }

// Point (zero dimensions)
const point = bboxCircle(50, 50, 0);
// point = { x: 50, y: 50, width: 0, height: 0 }
```

### Important Notes

1. **Local Coordinates**: All bounding boxes are calculated in the element's local coordinate system, before any transforms are applied.

2. **Stroke Width**: The basic shape functions do not account for stroke width. For a complete visual bounding box, you would need to expand the box by half the stroke width in all directions.

3. **Transforms**: For transform-aware bounding boxes, use the `bboxTransform` function to apply transformation matrices to bounding boxes.

4. **Zero Dimensions**: Bounding boxes can have zero width or height (for lines) or both (for points).

## Future Enhancements

Planned additions to the geometry module:

- **Path manipulation**: Parse, simplify, split, and merge SVG paths

## References

- [SVG Transforms Specification](https://www.w3.org/TR/SVG/coords.html#TransformMatrixDefined)
- [Affine Transformation](https://en.wikipedia.org/wiki/Affine_transformation)
- [SVG Basic Shapes](https://www.w3.org/TR/SVG/shapes.html)
- [SVG Path Data](https://www.w3.org/TR/SVG/paths.html)
- Requirements: 11.1, 11.2, 11.3, 11.4, 12.1, 12.2, 12.3 from core-engine specification
