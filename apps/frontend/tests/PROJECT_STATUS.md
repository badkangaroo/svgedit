# Frontend Project Status

**Last updated:** February 2, 2026

## Executive Summary

The frontend is **well along**: core editing (selection, attributes, tools, drag, hierarchy, file ops, keyboard shortcuts), data-uuid lifecycle, and E2E/unit test infrastructure are in place. **Remaining work** is mainly: accessibility E2E, CI/CD, test docs/fixtures, one skipped UUID test, and a few app TODOs (paste, select-all).

---

## 1. Leftover TODOs in Codebase

| Location | TODO | Notes |
|----------|------|--------|
| `tests/e2e/playwright/uuid-lifecycle.spec.ts` | Re-enable "should assign data-uuid to newly created elements" when E2E count reflects new rect | App fix in place (last direct child + set data-uuid); test still skipped—count stays 2 in E2E |
| `src/state/keyboard-shortcut-manager.ts` | Implement full paste functionality | Paste handler placeholder |
| `src/state/keyboard-shortcut-manager.ts` | Implement select all functionality | Select-all handler placeholder |
| `tests/UI_TESTING_SETUP.md` | Write more E2E tests: cover remaining scenarios from spec | General call to expand coverage |

---

## 2. How Far Along (Tasks)

From `.kiro/specs/ui-testing-expansion/tasks.md`:

### Completed (Tasks 1–18)

- **1–7:** Helper library (selection, attribute, tool, drag, test data, svg-helpers) — all done, `data-uuid` used.
- **8:** Element selection E2E — done.
- **9:** Attribute editing E2E — done.
- **10:** Tool palette E2E — done (some tests may be flaky on “newly created” data-uuid).
- **11:** Checkpoint core functionality — done.
- **12:** Drag operations E2E — done (12.2 run across browsers marked optional).
- **13:** Keyboard shortcuts E2E — done.
- **14:** File operations E2E — done.
- **15:** Checkpoint advanced interaction — done.
- **16:** Hierarchy panel E2E — done.
- **17:** Raw SVG panel E2E — specs written (17.2 run across browsers optional).
- **18:** Performance E2E — specs and baselines done.

### Not Done (Tasks 19–24)

- **19:** Accessibility E2E — not started (19.1–19.3).
- **20:** Checkpoint quality/performance — not done.
- **21:** CI/CD — no GitHub Actions workflow (21.1–21.4).
- **22:** Test documentation — README exists; maintenance/troubleshooting guides and UUID docs not fully done (22.1–22.3).
- **23:** Test fixtures — no `tests/fixtures/` SVG files (23.1).
- **24:** Final validation — no full suite run, coverage analysis, or CI verification (24.1–24.4).

**Rough completion:** ~18 / 24 task groups done → **~75% of planned UI testing expansion**.

---

## 3. How Well It Tests

### Unit tests (Vitest)

- **Scope:** Helpers (selection, attribute, tool, drag, test-data-generators), `svg-parser`, `svg-serializer`, `document-state`, `selection-manager`, `keyboard-shortcut-manager`, `transform-engine`, `history-manager`, `file-manager`, components (`svg-editor-app`, `svg-canvas`, `svg-tool-palette`, `svg-attribute-inspector`, `svg-hierarchy-panel`, `svg-raw-panel`), workers, theme, signals.
- **Count:** Dozens of test files under `src/**/*.test.ts` and `tests/unit/*.test.ts`.
- **Notable:** Serializer UUID behavior (strip by default, keep with `keepUUID`) is covered by unit tests.

### E2E tests (Playwright)

- **Spec files:** 17 `.spec.ts` files in `tests/e2e/playwright/` (including helper specs and uuid-lifecycle).
- **Approx. test cases:** ~110 `test(` / `test.skip` across those files (×3 browsers when not skipped).
- **Areas covered:**
  - App load, panels, theme, resize (`svg-editor.spec.ts`)
  - SVG loading (`svg-loading.spec.ts`)
  - Element selection, multi-select, sync (`element-selection.spec.ts`)
  - Attribute editing and validation (`attribute-editing.spec.ts`)
  - Tool palette and primitive creation (`tool-palette.spec.ts`)
  - Drag-to-move and sync (`drag-operations.spec.ts`)
  - Keyboard shortcuts – file and tool (`keyboard-shortcuts.spec.ts`)
  - File menu and Save/Save As (`file-operations.spec.ts`)
  - Hierarchy panel (`hierarchy-panel.spec.ts`)
  - Raw SVG panel (`raw-svg-panel.spec.ts`)
  - Performance (`performance.spec.ts`)
  - UUID lifecycle – assign on load, preserve on edit, strip on save (`uuid-lifecycle.spec.ts`; one test skipped for “newly created” data-uuid)
  - Helper contracts (`*-helpers.spec.ts`)
- **Known skips:** UUID “newly created elements” (1 test); some browser-specific (e.g. Chromium File System Access, WebKit multi-drag) per CHECKPOINT_15.

### Gaps

- **Accessibility:** No E2E a11y suite (ARIA, keyboard nav, focus, axe).
- **Undo/Redo/Delete:** Covered in unit/implementation; E2E coverage not called out in the same detail as other flows.
- **CI:** No automated run in CI; no shared “all green” baseline.
- **Coverage number:** No 90%+ coverage target or report cited in status.

---

## 4. What Is Remaining to Do

### High impact

1. **Re-enable and fix “newly created elements” data-uuid**  
   Either ensure new primitives get `data-uuid` in the canvas DOM after `finalizePrimitiveCreation`, or adjust the test so the spec still reflects intended behavior.

2. **Accessibility E2E (Task 19)**  
   Add `accessibility.spec.ts`: ARIA on tools/theme, keyboard nav, focus, roles, optional axe-core.

3. **CI/CD (Task 21)**  
   Add `.github/workflows/ui-tests.yml`: install Playwright, run unit + E2E, upload reports/artifacts; target &lt;5 min, retries, timeouts.

### Medium impact

4. **Keyboard shortcuts – paste and select-all**  
   Implement paste and select-all in `keyboard-shortcut-manager.ts` (or document as out of scope).

5. **Test documentation (Task 22)**  
   - README: document `data-uuid` and Element Registry usage, helper usage, UUID lifecycle.  
   - Maintenance/troubleshooting guide; optional troubleshooting for UUID/registry.

6. **Test fixtures (Task 23)**  
   Add `tests/fixtures/` (e.g. `simple.svg`, `complex.svg`, `large.svg`) if you want file-based E2E in addition to programmatic `generateTestSVG`/`generateLargeSVG`.

### Lower priority / polish

7. **Final validation (Task 24)**  
   Full suite run (unit + E2E, 3 browsers), flakiness run (e.g. 3×), coverage analysis, final CI check.

8. **Optional task items**  
   Tasks marked with * (e.g. 12.2, 17.2 “run across all browsers”) can be done for extra confidence.

---

## 5. References

- **Tasks:** `.kiro/specs/ui-testing-expansion/tasks.md`
- **Design:** `.kiro/specs/ui-testing-expansion/design.md`
- **Requirements:** `.kiro/specs/ui-testing-expansion/requirements.md`
- **Checkpoint 15:** `tests/CHECKPOINT_15_VERIFICATION.md`
- **Data UUID and registry:** `src/docs/DATA_UUID_AND_REGISTRY.md`
- **Test README:** `tests/README.md`
