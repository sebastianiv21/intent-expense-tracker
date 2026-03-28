# Quickstart: Financial Profile Sheet Redesign

**Branch**: `007-financial-profile-sheet-redesign`  
**Date**: 2026-03-27

---

## Prerequisites

- Node.js 24 and pnpm installed
- `.env` configured with database credentials (copy from `.env.example`)

## Setup

```bash
# Clone / switch to the feature branch
git checkout 007-financial-profile-sheet-redesign

# Install dependencies (from repo root)
cd web && pnpm install
```

## Development

```bash
# Start the dev server (from web/)
pnpm dev
# App runs at http://localhost:3000
```

Navigate to **Profile → Edit** (tap the "Edit" button on the financial profile card) to open the sheet under development.

## Scope of Change

Only one file is modified:

```
web/components/financial-profile-sheet.tsx
```

No database migrations, no new routes, no new components.

## Verification Checklist

Before committing, confirm each item manually and via tooling:

**Manual (in browser / mobile emulator at 375px width)**:

- [ ] Opening the sheet shows an allocation bar with three coloured segments proportional to saved percentages
- [ ] Moving any slider updates the bar segments in real time with a smooth transition
- [ ] When total < 100%, a neutral remainder segment appears and the counter shows "−X% remaining" in destructive colour
- [ ] When total > 100%, the counter shows "+X% over" in destructive colour
- [ ] When total = 100%, the counter shows "100%" in income colour (green)
- [ ] Entering a positive income value shows a chip below each slider with the correct dollar amount
- [ ] Setting income to zero/empty hides all chips
- [ ] The annual preview ("= $X / year") appears below the income input when income > 0
- [ ] The annual preview is hidden when income is empty or zero
- [ ] The Save button is disabled when total ≠ 100% or income ≤ 0
- [ ] Saving with valid values closes the sheet without errors
- [ ] Cancelling discards changes (re-open shows original saved values)
- [ ] All sliders are draggable by touch on mobile
- [ ] With `prefers-reduced-motion` enabled (OS setting), transitions are instantaneous

**Tooling**:

```bash
# From web/ directory
pnpm lint          # Must pass with zero errors
pnpm build         # Must succeed without type errors
```

## Key Files for Reference

| File | Purpose |
|------|---------|
| `web/components/financial-profile-sheet.tsx` | The component to modify |
| `web/lib/finance-utils.ts` | `BUCKET_DEFINITIONS`, `formatCurrency` — use these, do not redefine |
| `web/app/globals.css` | Design tokens — `--income`, `--destructive`, `--bucket-*` colours |
| `web/components/profile-page.tsx` | Reference for existing allocation bar pattern |
| `web/components/bucket-card.tsx` | Reference for bucket colour usage with inline `style` |
| `specs/007-financial-profile-sheet-redesign/research.md` | All technical decisions with code snippets |
