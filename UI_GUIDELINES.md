# UI GUIDELINES

## Visual direction
- Clean, modern, high-contrast interface
- Soft corners, subtle shadows, gradient accents
- Motion used for feedback and hierarchy (not decoration overload)

## Primary UI patterns
- Input + generation flow in left panel
- Live preview/canvas in central area
- Modal-based settings and export actions
- Toast notifications for status/error feedback

## Typography
- Primary font family: Inter (with additional configured fonts)
- Strong hierarchy: bold headings, compact support text
- Keep body text readable and short in control panels

## Color and tokens
- Base palette and theme tokens are defined in:
  - `src/lib/constants.ts` (`THEMES`)
  - `src/app/globals.css` (`:root` variables)
  - `tailwind.config.ts` (`primary`, `surface`)

## Component behavior
- Buttons should have clear hover/disabled states.
- Loading states must show progress feedback.
- Critical actions (generate/export) should be visually prominent.
- Inputs should retain accessibility and contrast.

## Responsive behavior
- Main layout targets desktop editing workflow first.
- Keep controls usable on smaller widths without hidden critical actions.
