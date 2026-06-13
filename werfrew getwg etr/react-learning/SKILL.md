# SKILL.md — bsuite-frontend

## Overview

This file defines reusable AI "skills" for generating code in the **bsuite-frontend** repository. Every skill produces output that is architecturally, stylistically, and conventionally consistent with the existing codebase.

**Stack summary:**
- **React 19** + **TypeScript ~5.9** (strict, `verbatimModuleSyntax`)
- **Vite 7** SPA (no Next.js / SSR)
- **MUI v7** + **Emotion** for all UI and styling (no Tailwind, no CSS Modules)
- **Redux Toolkit** (global store) + **RTK Query** (all API calls)
- **react-router-dom v7** (lazy routes via `lazyWithSuspense`)
- **dayjs** for dates, **`en-IN` / INR** locale for formatting

---

## Skill Format

Each skill follows this structure:

- **Skill Name** — short, action-based
- **When to Use** — precise trigger condition
- **Instructions** — step-by-step, repo-aware
- **Output Requirements** — hard constraints
- **Example Invocation** — natural language command

---

## Required Skills

---

### Skill 1 — Create a New UI Component

#### When to Use

When asked to create a reusable UI element (button, card, input wrapper, badge, etc.) that will live in `src/components/atom/<category>/` or a feature's `components/` folder.

#### Instructions

1. **Determine scope.** If the component is truly generic (no domain logic), place it in `src/components/atom/<category>/ComponentName.tsx`. If it belongs to one feature, place it in `src/features/<domain>/.../components/ComponentName.tsx`.
2. **Use MUI primitives** — `Box`, `Typography`, `Stack`, `IconButton`, `Chip`, etc. Never invent raw HTML layout when an MUI component exists.
3. **Style exclusively with the `sx` prop** or `useTheme()`. Do not write inline `style={{}}` objects except for imperative DOM operations (drag offsets, refs). Never use CSS files or CSS Modules.
4. **Props interface** — declare a named `interface ComponentNameProps { ... }` at the top of the file (above the component). Use `type` only for union/alias shapes.
5. **`import type`** for all type-only imports (`import type { Foo } from '...'`).
6. **Export as named function** — `export function ComponentName({ ... }: ComponentNameProps) { ... }`. No default exports.
7. **Use `useTheme()`** when you need palette/shadow values; never hardcode color hex strings.
8. **Accept and spread `sx`** when the component should be layout-composable by callers: `sx?: SxProps<Theme>`, and spread it last inside the root element's `sx`.
9. **Loading state pattern:** If the component has a loading state, accept a `loading?: boolean` prop and render `"Loading ..."` as the button label (mirror `PrimaryButton`).
10. **Wrap in `<>`** (fragment) only when returning multiple siblings; otherwise return the root MUI element directly.

#### Output Requirements

- File: `PascalCase.tsx`
- No default exports
- No raw HTML outside of MUI
- `import type` for all type-only imports
- `sx` prop accepted and spread last on root element when composable
- `useTheme()` for all color/shadow references

#### Example Invocation

> "Create a `StatusBadge` atom component that accepts a `status` string and renders a colored MUI `Chip`."

---

### Skill 2 — Create a Page / View

#### When to Use

When asked to create a new route-level page, tab view, or section container that fetches its own data and composes feature-local components.

#### Instructions

1. **Location:** `src/features/<domain>/<subdomain>/FeatureNameView.tsx` or `FeatureNamePage.tsx`. Use `View` for tab-embedded content, `Page` for standalone routed pages.
2. **Route wiring:** Add the route in `src/routes/AppRoutes.tsx` using `lazyWithSuspense`:
   ```tsx
   {
     path: "domain/subpath",
     element: lazyWithSuspense(() => import("../features/domain/subpath/MyPage")),
   }
   ```
3. **Wrap in route guards** if permissions are required: `<RouteGuard permission="view_something">`.
4. **Data fetching:** Use RTK Query hooks from the feature's `api/*.api.ts`. Call queries at the top of the component. Pass data down to child components as props — do not fetch inside presentational children.
5. **Loading/error states:** Render `<CircularProgress />` (centered in a `<Box display="flex" justifyContent="center">`) when `isLoading`. Show a `<Snackbar>` or inline error message when `isError`.
6. **Local state:** Use `useState` for UI-only state (modal open, selected row, form field values). Do not create a Redux slice for ephemeral UI state.
7. **Snackbar pattern:** Use the local pattern with `useState<{ open: boolean; message: string; color: AlertColor }>` + `<Snackbar>` from `src/components/atom/snackbar` (not the global context) for page-level feedback.
8. **Layout:** Use MUI `Box` and `Stack` for layout. Use `Typography variant="h6"` for page headings, `variant="subtitle1" fontWeight={700}` for section headings.
9. **No default exports.**

#### Output Requirements

- Data fetched via RTK Query hooks only
- Loading state: centered `<CircularProgress />`
- Error state: `<Snackbar color="error" />`
- Local snackbar state pattern (not global context)
- Named export, no default export
- Route registered in `AppRoutes.tsx`

#### Example Invocation

> "Create a `LeaveSummaryPage` under `src/features/people/leave/` that fetches leave balance data and shows it in a `StandardTable`."

---

### Skill 3 — Style a Component

#### When to Use

When asked to apply visual styles to a component, adjust spacing/colors/typography, or implement a themed design.

#### Instructions

1. **Primary tool: `sx` prop.** Pass all styles through `sx={{ ... }}` on MUI components. Never add a `.css`, `.module.css`, or `styled-components` block unless absolutely necessary for a global override.
2. **`useTheme()` for dynamic values:**
   ```tsx
   const theme = useTheme();
   // Use theme.palette.primary.main, theme.spacing(2), theme.shadows[4], etc.
   ```
3. **Never hardcode colors.** Use `theme.palette.*` or `"divider"`, `"text.secondary"`, `"background.paper"` string shorthands.
4. **Border radius:** Use `borderRadius: 2` (MUI `shape.borderRadius` × 2 = 16 px) for cards/modals; `borderRadius: 1` for smaller elements. Match the existing 8 px base in `ThemeCustomization`.
5. **Spacing:** Use MUI spacing multiples — `p: 2`, `mb: 1.5`, `gap: 1`, etc. Never use `px` values inline unless forced by a calculation.
6. **Typography variants:** Follow the existing hierarchy — `h5/h6` for major headings, `subtitle1 fontWeight={700}` for section titles, `body2` for descriptive text, `caption` for metadata.
7. **Conditional styles:** Use ternary inside `sx` — `sx={{ color: isActive ? 'primary.main' : 'text.disabled' }}`.
8. **`Emotion styled`** — use `styled` from `@emotion/styled` only for complex components that need multiple class-based variants (rare; prefer `sx`).
9. **INR currency formatting:**
   ```ts
   new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)
   ```
10. **`withAlpha`** — for transparent palette colors, import from `src/utils/colorUtils`.

#### Output Requirements

- All styles via `sx` prop or `useTheme()`
- No raw CSS files
- No hardcoded hex colors
- Spacing in MUI units only
- Currency formatted as `en-IN` / INR

#### Example Invocation

> "Style the `SummaryCard` component to match the existing card pattern — white background, 16 px border radius, subtle shadow, grey subtitle."

---

### Skill 4 — Fetch and Handle API Data

#### When to Use

When asked to connect a component or page to a backend endpoint, add a new API endpoint, or handle API mutations (create/update/delete).

#### Instructions

1. **All API calls go through RTK Query.** Never use `axios` or raw `fetch` directly in components.
2. **Feature API file:** Add endpoints in `src/features/<domain>/.../api/<name>.api.ts` via `baseApi.injectEndpoints(...)`.
3. **Endpoint structure:**
   ```ts
   import { baseApi } from "@/api/base.api"; // use relative path
   import type { ApiResponse } from "...";

   export const MyFeatureApi = baseApi.injectEndpoints({
     endpoints: (builder) => ({
       getThings: builder.query<ThingResponse, void>({
         query: () => "/things",
         transformResponse: (res: ApiResponse<ThingResponse>) => res.data,
         providesTags: ["Things"],
       }),
       createThing: builder.mutation<ThingCreated, ThingPayload>({
         query: (body) => ({ url: "/things", method: "POST", body }),
         invalidatesTags: ["Things"],
       }),
     }),
   });

   export const { useGetThingsQuery, useCreateThingMutation } = MyFeatureApi;
   ```
4. **Tag types:** Register new tags in `src/api/base.api.ts` `tagTypes` array before using them.
5. **`transformResponse`:** Always unwrap `response.data` — the backend always returns `{ data: ..., message: ..., ... }`.
6. **In components:** Destructure only what you need — `const { data, isLoading, isError } = useGetThingsQuery();`
7. **Mutations:**
   ```tsx
   const [createThing, { isLoading: isCreating }] = useCreateThingMutation();
   const handleSubmit = async () => {
     try {
       await createThing(payload).unwrap();
       setSnackbar({ open: true, message: "Created!", color: "success" });
     } catch (err: unknown) {
       setSnackbar({ open: true, message: getErrorMessage(err), color: "error" });
     }
   };
   ```
8. **`getErrorMessage`:** Import from the feature's local `utils.ts` or `src/features/people/salary/payrun/runpayroll/utils.ts` if cross-feature. Do not inline error extraction.
9. **Cache patching:** For optimistic status updates, use `dispatch(baseApi.util.updateQueryData(...))`. Only use this for immediate UI feedback; always refetch in the background.
10. **File downloads:** Use `responseHandler: "blob"` in the query and create an object URL in the component.
11. **`skip`:** Use `skip: !id || isNaN(id)` to conditionally fire queries that depend on route params.

#### Output Requirements

- No `axios` / raw `fetch` in components
- All endpoints in `api/*.api.ts` with `injectEndpoints`
- `transformResponse` unwraps `response.data`
- Tags registered in `base.api.ts`
- Mutations wrapped in `try/catch` with `getErrorMessage`
- No inline error string extraction

#### Example Invocation

> "Add a `useGetEmployeeLeavesQuery` endpoint to the leave API file and wire it up to the `LeaveSummaryPage`."

---

### Skill 5 — Manage State

#### When to Use

When asked to add, modify, or refactor state — whether local UI state, server cache state, or shared global state.

#### Instructions

**Local / ephemeral UI state → `useState`**

- Use for: modal open/close, selected row, form field values, snackbar, toggle flags.
- Never persist ephemeral state in Redux.

**Modal open/close → `useModal`**

```tsx
import { useModal } from "../../hooks/useDialog";
const { open, handleOpen, handleClose } = useModal();
```

**Server / async state → RTK Query**

- Use `useXxxQuery` for GET data.
- Use `useXxxMutation` for POST/PUT/DELETE.
- RTK Query owns all caching — do not duplicate server data in Redux slices.

**Shared global / cross-cutting state → Redux slice**

- Create `src/features/<domain>/slice/<name>.slice.ts` using `createSlice`.
- Export the reducer and add it to `src/store/store.ts`.
- Use `useSelector` / `useDispatch` from `react-redux` in components.
- Typical candidates: auth tokens, persisted user preferences, UI-wide filters.

**Context → existing providers only**

- Use `useConfig()` for theme preset.
- Use `useSnackbar()` (global) sparingly; prefer local snackbar state in pages.
- Do not create new Context providers unless no other mechanism fits.

**Form state → controlled `useState`**

```tsx
const [value, setValue] = useState("");
// Pass to MUI TextField:
<TextField value={value} onChange={(e) => setValue(e.target.value)} />
```
Do not introduce `react-hook-form` — it is not used in this codebase.

#### Output Requirements

- Ephemeral UI state: `useState` only
- Modal state: `useModal` hook
- Server state: RTK Query (no duplication in Redux)
- Global shared state: Redux slice + store registration
- No `react-hook-form`, no Zustand

#### Example Invocation

> "Add state to track which employee row is selected in the payroll table, and open a details modal when clicked."

---

### Skill 6 — Reuse Existing Components and Utilities

#### When to Use

Always — before writing any new component or utility, check whether an existing one covers the need. This skill enforces the "reuse first" rule.

#### Instructions

**Buttons**

| Need | Component | Import path |
|---|---|---|
| Primary action | `PrimaryButton` | `src/components/atom/button` |
| Secondary action | `SecondaryButton` | `src/components/atom/button` |
| Icon button | `PrimaryIconButton` | `src/components/atom/button` |

**Inputs / selects**

| Need | Component | Import path |
|---|---|---|
| Text input | `TextField` | `src/components/atom/text-field` |
| Single select dropdown | `SingleSelect` | `src/components/atom/select-field` |
| Multi select | `MultiSelect` | `src/components/atom/select-field` |
| Date picker | `DatePicker` | `src/components/atom/date-picker` |
| Month/year picker | `MonthYearPicker` | `src/components/atom/date-picker` |
| Autocomplete | `Autocomplete` | `src/components/atom/autocomplete` |
| Phone input | `react-phone-input-2` (already installed) | — |

**Feedback**

| Need | Component | Import path |
|---|---|---|
| Toast / feedback | `Snackbar` | `src/components/atom/snackbar` |
| Loading skeleton | `TableSkeletonRows` | `src/components/atom/skeleton` |
| Confirm dialog | `ConfirmDialog` | `src/components/dialogs/confirm-dialog` |

**Modals**

Use `ModalElement` from `src/components/dialogs/modal-element` for all modal dialogs. It handles drag, focus, close button, and a standard Save action.

```tsx
<ModalElement
  open={open}
  onClose={handleClose}
  title="Edit Record"
  maxWidth="sm"
  onClick={handleSave}
  disabled={!isValid}
>
  {/* form content */}
</ModalElement>
```

**Tables**

Use `StandardTable` from `src/components/tables/standard-table` for all data tables.

```tsx
<StandardTable
  columns={[
    { id: "name", label: "Name", width: 200, render: (row: any) => row.name },
    { id: "amount", label: "Amount", align: "right", width: 120, render: (row: any) => formatCurrency(row.amount) },
  ]}
  rows={items.map((item, idx) => ({ id: item.id ?? idx, ...item }))}
  loading={isLoading}
  showSkeleton={isFetching && rows.length === 0}
  emptyMessage="No records found"
/>
```

**Number / currency formatting**

```ts
import { formatINR } from "../../utils/numberFormatter"; // or use Intl directly
const formatted = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
```

**Error extraction from RTK Query errors**

```ts
import { getErrorMessage } from "../utils"; // feature-local utils.ts
```

**Modal open/close state**

```ts
import { useModal } from "../../hooks/useDialog";
const { open, handleOpen, handleClose } = useModal();
```

**Color utilities**

```ts
import { withAlpha } from "../../utils/colorUtils";
```

#### Output Requirements

- `PrimaryButton` / `SecondaryButton` — never MUI `Button` directly in feature code
- `ModalElement` — never raw MUI `Dialog` in feature code
- `StandardTable` — never raw MUI `Table` in feature code
- `useModal` — never ad-hoc `const [open, setOpen] = useState(false)` for modals
- Formatting via `Intl` / `en-IN` — never raw `.toLocaleString()` without locale

#### Example Invocation

> "Add a delete confirmation modal to the payrun page — reuse existing components."

---

### Skill 7 — Add a New Feature Slice (Full Feature Scaffold)

#### When to Use

When asked to scaffold a complete new feature area (list + detail + API + slice) under `src/features/`.

#### Instructions

Create the following file tree:

```
src/features/<domain>/<feature>/
├── <Feature>View.tsx          # Tab-embedded list/hub view
├── <Feature>Page.tsx          # Routed detail page (if needed)
├── api/
│   └── <feature>.api.ts       # RTK Query injectEndpoints module
├── components/
│   └── <FeatureTable>.tsx     # StandardTable wrapper
├── slice/
│   └── <feature>.slice.ts     # Redux slice (only if global state needed)
├── types.ts                   # Local TypeScript types/unions
└── utils.ts                   # getErrorMessage + domain helpers
```

**Step-by-step:**

1. **`types.ts`** — define all domain types as `export type`. Use discriminated unions for status fields.
2. **`utils.ts`** — copy the `getErrorMessage` pattern from `runpayroll/utils.ts`. Add any domain-specific formatters.
3. **`api/<feature>.api.ts`** — `baseApi.injectEndpoints(...)` with full CRUD. Register any new tag strings in `src/api/base.api.ts`.
4. **`components/<FeatureTable>.tsx`** — `StandardTable` with typed columns. Keep render functions in `(row: any) =>` form (consistent with existing tables).
5. **`<Feature>View.tsx`** — uses query hooks, local `useState` for snackbar and modal state, renders `FeatureTable` + action buttons.
6. **`slice/<feature>.slice.ts`** — only if cross-page shared state is needed. Add reducer to `src/store/store.ts`.
7. **Route:** Register in `AppRoutes.tsx` using `lazyWithSuspense`.

#### Output Requirements

- Matches the exact folder structure above
- No new libraries introduced
- API file uses `injectEndpoints` on `baseApi`
- Types in `types.ts`, errors via `utils.ts`
- Route registered with `lazyWithSuspense`

#### Example Invocation

> "Scaffold a new `Expenses` feature under `src/features/books/expenses/` with list view, API, and table component."

---

### Skill 8 — Refactor Code to Match Repo Standards

#### When to Use

When existing code uses patterns inconsistent with the codebase (e.g., raw `fetch`, CSS files, `react-hook-form`, default exports, hardcoded colors, raw MUI `Dialog`/`Button`/`Table`).

#### Instructions

Apply these transforms in order:

| Anti-pattern found | Correct replacement |
|---|---|
| `export default function` | `export function` (named export) |
| Raw `fetch(...)` or `axios.get(...)` in component | Move to `api/*.api.ts` as RTK Query endpoint |
| `import React from 'react'` | Remove — not needed with `react-jsx` |
| `import { Foo } from '...'` where `Foo` is type-only | `import type { Foo } from '...'` |
| `style={{ color: '#333' }}` inline | `sx={{ color: 'text.secondary' }}` via MUI |
| `.css` / `.module.css` import | Migrate to `sx` prop |
| Raw MUI `<Dialog>` | `<ModalElement>` from `src/components/dialogs/modal-element` |
| Raw MUI `<Button variant="contained">` | `<PrimaryButton>` from `src/components/atom/button` |
| Raw MUI `<Table><TableHead>...` | `<StandardTable>` from `src/components/tables/standard-table` |
| `const [open, setOpen] = useState(false)` for modals | `const { open, handleOpen, handleClose } = useModal()` |
| `try { } catch(e) { e.message }` | `getErrorMessage(e)` from local `utils.ts` |
| `new Date().toLocaleDateString()` | `dayjs(...).format('DD MMM YYYY')` |

#### Output Requirements

- All replacements must produce identical runtime behavior
- Do not change component public API (props) unless explicitly asked
- Run through the full anti-pattern table before finishing

#### Example Invocation

> "Refactor `OldInvoiceForm.tsx` to match the repo's coding standards — replace raw Dialog, Button, and fetch calls."

---

## Constraints

- **DO NOT** introduce any library not already in `package.json`.
- **DO NOT** use `react-hook-form`, Zustand, SWR, styled-components, Tailwind, or CSS Modules.
- **DO NOT** create default exports.
- **DO NOT** write `import React from 'react'` — it is not required with Vite's `react-jsx` transform.
- **DO NOT** hardcode color hex values — always use `useTheme()` or MUI system color strings.
- **ALWAYS** use `import type` for type-only imports (`verbatimModuleSyntax` is enabled).
- **ALWAYS** format currency as `en-IN` / INR.
- **ALWAYS** use `getErrorMessage(err)` for RTK Query error extraction.
- **ALWAYS** use `useModal()` for modal open state.
- **ALWAYS** use `PrimaryButton`, `ModalElement`, `StandardTable` — never the raw MUI equivalents in feature code.
- **PREFER** the most common pattern when multiple exist (e.g., local snackbar state over global context in pages).

---

## Output Quality

All generated code must be:

- **Precise** — no placeholder comments, no `// TODO`, complete implementations
- **Actionable** — can be dropped into the repo without modification
- **Context-aware** — imports use correct relative paths based on file location
- **Immediately compilable** — TypeScript strict mode with no type errors
