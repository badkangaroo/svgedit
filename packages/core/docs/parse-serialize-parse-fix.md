# Parse-Serialize-Parse Equivalence Fix

## Issue

Task 4.1 required ensuring that parsing, then serializing, then parsing again produces an equivalent document structure (Requirement 2.6). During testing, a discrepancy was discovered in attribute handling related to HTML entity escaping.

## Problem

The parser was not unescaping HTML entities when parsing attribute values. This caused a double-escaping issue:

1. **Input**: `<text data="value with &quot;quotes&quot; &amp; &lt;brackets&gt;" />`
2. **First parse**: Attribute stored as `value with &quot;quotes&quot; &amp; &lt;brackets&gt;` (entities not unescaped)
3. **Serialize**: Entities get escaped again: `value with &amp;quot;quotes&amp;quot; &amp;amp; &amp;lt;brackets&amp;gt;`
4. **Second parse**: Attribute becomes double-escaped

This violated the round-trip fidelity property.

## Solution

Added HTML entity unescaping to the parser's `parseAttributeValue()` method:

```typescript
/**
 * Unescape HTML entities in attribute values.
 */
private unescapeAttributeValue(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&'); // Must be last to avoid double-unescaping
}
```

The order of replacements is important: `&amp;` must be replaced last to avoid double-unescaping sequences like `&amp;quot;`.

## Testing

Created comprehensive parse-serialize-parse equivalence tests in `parse-serialize-parse.test.ts`:

- ✅ Simple elements
- ✅ Nested elements
- ✅ Multiple attributes
- ✅ Special characters in attributes
- ✅ Deeply nested structures
- ✅ Multiple sibling elements
- ✅ Complex SVG documents
- ✅ Identical serialization after re-parse
- ✅ Empty elements
- ✅ Mixed quote styles

All tests pass, confirming that:
1. Parse → Serialize → Parse produces structurally equivalent documents
2. Attribute values are preserved correctly through the round-trip
3. HTML entities are properly escaped/unescaped

## Validation

- All 96 tests in the core package pass
- Round-trip fidelity is maintained for all test cases
- No regressions in existing parser or serializer tests

## Requirements Validated

✅ **Requirement 2.6**: FOR ALL valid Document_Model objects, parsing then serializing then parsing SHALL produce an equivalent document structure (round-trip property)
