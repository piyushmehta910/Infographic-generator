# CODING RULES

## Language and typing

- Use TypeScript with strict typing.
- Reuse types from `src/lib/types.ts` before introducing new ones.
- Avoid `any` unless there is no practical alternative.

## Project conventions

- Use `@/` path alias for `src/*` imports.
- Keep app routes under `src/app`.
- Keep domain logic in `src/services`.
- Keep state mutations inside Zustand store actions.

## UI and styling

- Prefer Tailwind utility classes.
- Use shared tokens/constants where available (`src/lib/constants.ts`, `globals.css` vars).
- Keep components focused and composable.

## State management

- Use existing stores (`aiStore`, `editorStore`, `projectStore`, `uiStore`) rather than ad-hoc global state.
- Persist only the minimum necessary state in local storage.

## Reliability and errors

- Surface user-facing errors via toast (`useUIStore().showToast` pattern).
- Do not silently swallow failures.
- Preserve existing behavior unless intentionally changing product behavior.

## Files and structure

- Keep service-layer logic separate from rendering components.
- Prefer pure helpers for transform/format logic.
- Add documentation updates when behavior or architecture changes.
