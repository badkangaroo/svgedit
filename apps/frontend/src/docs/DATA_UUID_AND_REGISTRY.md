# data-uuid and Element Registry

This document describes how SVG elements are identified in the editor and how the **Element Registry** maps `data-uuid` values to DOM elements and document nodes.

## Overview

Each editable SVG element in the editor has a **`data-uuid`** attribute: a stable, unique identifier used for selection, updates, and cross-panel sync. The **Element Registry** (`element-registry.ts`) maintains in-memory maps from UUIDs to SVG elements and to the tree nodes (`DocumentNode`), so lookups are O(1).

- **Why `data-uuid`?** SVG `id` values can be missing, duplicated, or change when the user edits markup. A separate UUID gives a reliable handle for the lifetime of the element in the session.
- **Where it lives:** On the element as `data-uuid="<uuid>"`. It is **not** written to saved/exported SVG unless explicitly requested (see Serialization below).

## Table Mapping: data-uuid ↔ SVG Element

The Element Registry keeps four maps that together form the mapping between identifiers and elements:

| Map | Key | Value | Purpose |
|-----|-----|--------|---------|
| `uuidToElement` | `data-uuid` (string) | `SVGElement` | Primary lookup: UUID → DOM element |
| `uuidToNode` | `data-uuid` (string) | `DocumentNode` | UUID → tree node (attributes, children) |
| `idToUuid` | `id` attribute (string) | `data-uuid` (string) | Resolve `id` → UUID for selection/lookup |
| `elementToUuid` | `SVGElement` | `data-uuid` (string) | Reverse lookup: element → UUID |

**Lifecycle:**

1. **Build:** When the document is loaded or replaced, `ElementRegistry.rebuild(doc, tree)` is called. It walks the `DocumentNode` tree (or, if the tree is empty, the DOM via `querySelectorAll('[data-uuid]')`) and fills the four maps.
2. **Lookup:** Use `getElement(uuid)`, `getNode(uuid)`, `getUUID(element)`, or `getUUIDById(id)`.
3. **Updates:** Attribute changes via `setAttribute(uuid, name, value)` and `removeAttribute(uuid, name)` update both the DOM element and the node’s `attributes` map and notify the optional `onAttributeChange` callback (e.g. for raw SVG sync).
4. **Structure changes:** Any add/remove/move of elements requires a full `rebuild()` so the maps stay in sync; `structureVersion` is incremented so consumers can react.

## Where data-uuid Is Assigned

| Location | When | Notes |
|----------|------|--------|
| **SVG Parser** (`utils/svg-parser.ts`) | Parsing SVG text into a document | If an element has no `data-uuid`, the parser assigns one (e.g. `crypto.randomUUID()`). Preserves existing `data-uuid` when re-parsing. |
| **Primitive tools** (`utils/primitive-tools.ts`, `primitive-tools-simple.ts`) | Creating new rect, circle, ellipse, line, etc. | Each new element gets `element.setAttribute('data-uuid', generateUUID())`. |

After assignment, the registry is rebuilt (or the new subtree is part of the next rebuild) so the new element appears in the UUID ↔ element tables.

## Where data-uuid Is Used

- **Selection:** Canvas and hierarchy panel resolve clicks to an element, then use `getUUID(element)` or the element’s `data-uuid` to set selection state.
- **Attribute inspector:** Operates on the selected UUID; registry’s `setAttribute`/`removeAttribute` update the DOM and node.
- **Transform engine:** Resolves a given identifier (e.g. from hierarchy or tests) to an element via `getElement(uuid)` or fallback `querySelector('[data-uuid="..."]')`.
- **Tests and helpers:** E2E and helpers target elements by `data-uuid` so they don’t rely on `id` and don’t accidentally select UI overlays (e.g. selection handles). See [Test helpers and data-uuid](#test-helpers-and-data-uuid).

## Serialization and Export

- **Default:** The SVG Serializer (`utils/svg-serializer.ts`) **strips** `data-uuid` (and other editor-only attributes) when saving or exporting, so output is clean and portable.
- **Optional:** Serializer options include `keepUUID: true` so that `data-uuid` is retained in the serialized string when needed (e.g. for tests or round-trips).

## Test Helpers and data-uuid

- **Selection helpers:** Prefer selecting by `data-uuid` inside the content SVG (e.g. `svg [data-uuid="${uuid}"]`) so the same element is targeted across canvas and hierarchy.
- **Drag helpers:** Resolve elements by `id`, `data-original-id`, or `data-uuid` in the content SVG.
- **Tool helpers:** After creating a primitive, new elements are found via `querySelectorAll('...[data-uuid]')`; helpers like `getLastCreatedElementUUID()` return the `data-uuid` of the last created element for assertions.
- **Requirements (UI testing spec):** Helpers use `data-uuid` for finding elements when possible; new elements (tools or raw edit) get a `data-uuid`; helpers like `getElementPosition` and `dragElement` support lookup by `data-uuid`; element counts differentiate content elements (with `data-uuid`) from UI overlays.

## Summary

| Concept | Description |
|--------|-------------|
| **Attribute** | `data-uuid` on each editable SVG element; stable for the session. |
| **Registry** | In-memory maps: UUID ↔ element, UUID ↔ node, id ↔ UUID, element ↔ UUID. |
| **Assign** | Parser (on load) and primitive tools (on create). |
| **Use** | Selection, attributes, transform engine, tests. |
| **Export** | Stripped by default; can be kept via serializer option. |
