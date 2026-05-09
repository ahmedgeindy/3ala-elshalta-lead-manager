# Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add client-side pagination to the lead table, rendering only 20 rows per page to eliminate slow rendering with large datasets.

**Architecture:** TanStack Table v8 already provides `getPaginationRowModel()` — we add it to the existing `useReactTable` config, introduce a `pageIndex` state, and render a compact `PaginationControls` component below the table. Row selection resets on page change. The `#` column shows the global index (page × 20 + local) rather than the row index within the filtered dataset.

**Tech Stack:** React 18, @tanstack/react-table v8 (already installed), Framer Motion (already installed), existing CSS custom properties from `index.css`.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/components/LeadTable.tsx` | **Modify** | Add pagination state, `getPaginationRowModel`, `PaginationControls` component, reset selection on page/filter change |
| `src/index.css` | **Modify** | Add `.pagination-btn` utility class for consistent button styling |

---

## Task 1: Add pagination model and controls to LeadTable

**Files:**
- Modify: `src/components/LeadTable.tsx`

- [ ] **Step 1: Add `getPaginationRowModel` import and `PAGE_SIZE` constant**

In `LeadTable.tsx`, add the import for `getPaginationRowModel` alongside the existing imports:

```tsx
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type RowSelectionState,
  type FilterFn,
} from '@tanstack/react-table';
```

Add a constant just below the `Filter` type:

```tsx
const PAGE_SIZE = 20;
```

- [ ] **Step 2: Add `pageIndex` state and wire pagination into `useReactTable`**

Inside the `LeadTable` function, add `pageIndex` state next to the existing state declarations:

```tsx
const [pageIndex, setPageIndex] = useState(0);
```

Update the `useReactTable` call to include pagination:

```tsx
const table = useReactTable({
  data: filtered,
  columns,
  state: { rowSelection, globalFilter: search, pagination: { pageIndex, pageSize: PAGE_SIZE } },
  onRowSelectionChange: setRowSelection,
  onGlobalFilterChange: setSearch,
  globalFilterFn: globalFilter,
  enableRowSelection: (row) => row.original.status === 'pending',
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  manualPagination: false,
  pageCount: Math.ceil(filtered.length / PAGE_SIZE),
});
```

- [ ] **Step 3: Reset page and selection on filter/search changes**

Replace the filter button's `onClick`:

```tsx
onClick={() => { setFilter(f); setRowSelection({}); setPageIndex(0); }}
```

Add a `useEffect` that resets page when search changes (add `useEffect` to the import from `react` if not already there):

```tsx
useEffect(() => { setPageIndex(0); }, [search]);
```

Also reset page when the `filter` changes beyond the button (add to the `setFilter` call — already done above in the onClick).

- [ ] **Step 4: Fix the `#` column to show global index**

Replace the `index` column cell to calculate the global position:

```tsx
colHelper.display({
  id: 'index',
  size: 44,
  header: () => <span className="label">#</span>,
  cell: ({ row }) => {
    const pageOffset = table.getState().pagination.pageIndex * PAGE_SIZE;
    return (
      <span style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }} className="tabular-nums">
        {pageOffset + row.index + 1}
      </span>
    );
  },
}),
```

- [ ] **Step 5: Add `CaretLeft` and `CaretRight` icon imports**

Add to the Phosphor import:

```tsx
import {
  MagnifyingGlass, DownloadSimple,
  WhatsappLogo, CheckCircle, Clock, Lightning,
  CaretLeft, CaretRight,
} from '@phosphor-icons/react';
```

- [ ] **Step 6: Add `PaginationControls` component at the bottom of the component**

Inside `LeadTable`'s return, replace the closing `</div>` of the table scroll area with a wrapper that includes the pagination controls. Change:

```tsx
      </div>

      <AnimatePresence>
```

To:

```tsx
      </div>

      {filtered.length > PAGE_SIZE && (
        <PaginationControls table={table} setPageIndex={setPageIndex} />
      )}

      <AnimatePresence>
```

- [ ] **Step 7: Add the `PaginationControls` component definition**

Add this as a new function component at the bottom of the file (before `Checkbox`):

```tsx
function PaginationControls({ table, setPageIndex }: { table: ReturnType<typeof useReactTable<Lead>>; setPageIndex: React.Dispatch<React.SetStateAction<number>> }) {
  const { pageIndex } = table.getState().pagination;
  const totalPages = table.getPageCount();
  const rowCount = table.getFilteredRowModel().rows.length;

  const canPrevious = pageIndex > 0;
  const canNext = pageIndex < totalPages - 1;

  const pageNumbers = (() => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      pages.push(0);
      if (pageIndex > 2) pages.push('...');
      const start = Math.max(1, pageIndex - 1);
      const end = Math.min(totalPages - 2, pageIndex + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (pageIndex < totalPages - 3) pages.push('...');
      pages.push(totalPages - 1);
    }
    return pages;
  })();

  return (
    <div
      className="flex items-center justify-between"
      style={{
        padding: '10px 20px',
        borderTop: '1px solid var(--border-subtle)',
        flexShrink: 0,
        fontSize: 12,
        color: 'var(--text-secondary)',
      }}
    >
      <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
        {rowCount} result{rowCount !== 1 ? 's' : ''}
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setPageIndex(0)}
          disabled={!canPrevious}
          style={{
            background: 'none',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 6px',
            color: canPrevious ? 'var(--text-secondary)' : 'var(--text-muted)',
            cursor: canPrevious ? 'pointer' : 'not-allowed',
            opacity: canPrevious ? 1 : 0.35,
            transition: 'all var(--transition-fast)',
            display: 'flex',
            alignItems: 'center',
          }}
          onMouseEnter={e => { if (canPrevious) e.currentTarget.style.borderColor = 'var(--accent-border)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        >
          <CaretLeft size={12} /><CaretLeft size={12} style={{ marginLeft: -6 }} />
        </button>
        <button
          onClick={() => setPageIndex(p => Math.max(0, p - 1))}
          disabled={!canPrevious}
          style={{
            background: 'none',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 8px',
            color: canPrevious ? 'var(--text-secondary)' : 'var(--text-muted)',
            cursor: canPrevious ? 'pointer' : 'not-allowed',
            opacity: canPrevious ? 1 : 0.35,
            transition: 'all var(--transition-fast)',
            display: 'flex',
            alignItems: 'center',
          }}
          onMouseEnter={e => { if (canPrevious) e.currentTarget.style.borderColor = 'var(--accent-border)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        >
          <CaretLeft size={12} />
        </button>

        {pageNumbers.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} style={{ padding: '4px 4px', color: 'var(--text-muted)' }}>…</span>
          ) : (
            <button
              key={p}
              onClick={() => setPageIndex(p)}
              style={{
                background: p === pageIndex ? 'var(--accent-muted)' : 'none',
                border: `1px solid ${p === pageIndex ? 'var(--accent-border)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '4px 8px',
                fontWeight: p === pageIndex ? 600 : 400,
                color: p === pageIndex ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                transition: 'all var(--transition-fast)',
                minWidth: 32,
              }}
            >
              {p + 1}
            </button>
          )
        )}

        <button
          onClick={() => setPageIndex(p => Math.min(totalPages - 1, p + 1))}
          disabled={!canNext}
          style={{
            background: 'none',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 8px',
            color: canNext ? 'var(--text-secondary)' : 'var(--text-muted)',
            cursor: canNext ? 'pointer' : 'not-allowed',
            opacity: canNext ? 1 : 0.35,
            transition: 'all var(--transition-fast)',
            display: 'flex',
            alignItems: 'center',
          }}
          onMouseEnter={e => { if (canNext) e.currentTarget.style.borderColor = 'var(--accent-border)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        >
          <CaretRight size={12} />
        </button>
        <button
          onClick={() => setPageIndex(totalPages - 1)}
          disabled={!canNext}
          style={{
            background: 'none',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 6px',
            color: canNext ? 'var(--text-secondary)' : 'var(--text-muted)',
            cursor: canNext ? 'pointer' : 'not-allowed',
            opacity: canNext ? 1 : 0.35,
            transition: 'all var(--transition-fast)',
            display: 'flex',
            alignItems: 'center',
          }}
          onMouseEnter={e => { if (canNext) e.currentTarget.style.borderColor = 'var(--accent-border)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        >
          <CaretRight size={12} /><CaretRight size={12} style={{ marginLeft: -6 }} />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Use `table.getPageCount()` instead of `Math.ceil`**

In the `useReactTable` config, remove the manual `pageCount` line since `getPaginationRowModel` computes it automatically. The line to remove:

```tsx
  pageCount: Math.ceil(filtered.length / PAGE_SIZE),
```

`getPaginationRowModel` handles this internally.

- [ ] **Step 9: Verify the build compiles**

```bash
cd shalta-app
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 10: Test in browser**

1. Run `npm run dev`
2. Login with the password
3. Upload a CSV with 40+ contacts
4. Verify: only 20 rows render at a time
5. Click page 2 — rows 21-40 appear
6. Search filters apply across all pages
7. Click "Pending" filter — resets to page 1
8. Select leads on page 1, switch to page 2, switch back — selection persists
9. Bulk send from any page works

---

## Self-Review

**Spec coverage check:**
- ✅ Only 20 rows rendered at a time — Task 1 (PAGE_SIZE constant + getPaginationRowModel)
- ✅ Page controls visible when results exceed 20 — Task 1 (conditional render)
- ✅ Filter/search changes reset to page 1 — Task 1 (setPageIndex(0) in onClick + useEffect)
- ✅ Global row numbers (# column) correct across pages — Task 1 (pageOffset calculation)
- ✅ Selection persists across page changes — existing TanStack behavior, no reset
- ✅ No new dependencies — uses existing @tanstack/react-table pagination model

**Placeholder scan:** None found. All code blocks are complete.

**Type consistency:**
- `PaginationControls` receives `table` typed as `ReturnType<typeof useReactTable<Lead>>` which matches the table instance
- `setPageIndex` typed as `React.Dispatch<React.SetStateAction<number>>`
- `PAGE_SIZE` is a module-level constant, used consistently
- `pageIndex` state initialized to `0`, reset on filter/search changes

**Edge cases covered:**
- Fewer than 20 leads — pagination controls hidden, all rows shown
- Exactly 20 leads — controls hidden (not needed)
- 21+ leads — controls appear
- Filter reduces total below current page — TanStack auto-adjusts to last valid page
- Empty search results — "0 results" shown, no error