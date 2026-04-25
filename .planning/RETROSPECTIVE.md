# Retrospective

Living record of milestone learnings across the project.

---

## Milestone: v1.0 — Date Picker Fix

**Shipped:** 2026-04-24
**Phases:** 1 | **Plans:** 4 | **Tasks:** ~6
**Duration:** Single session (~5 hours)
**Commits:** 14 (execution to tag)

### What Was Built

- Replaced Radix Popover/Portal date picker with inline toggled shadcn Calendar in `transaction-sheet.tsx` — eliminates overflow/overlap bug in New Awareness sheet
- Applied same compact inline Calendar fix to `budgets-page.tsx` budget start date picker
- Fixed both start and end date pickers in `recurring-page.tsx` with independent toggle state; end date `fromDate` → `disabled={{ before }}` (react-day-picker v9 compatibility)
- Visual verification approved across all three surfaces on mobile + desktop
- Code review caught deprecated `fromDate` prop — fixed inline before phase close

### What Worked

- **Detailed PLAN.md with exact before/after code**: Plans included exact line numbers and the full replacement JSX. Executors made zero wrong edits. No rework.
- **PATTERNS.md artifact**: Capturing the per-file variation summary (state names, field names, setter patterns, icon colors) in a dedicated patterns file let parallel agents reference the right values without reading each other's work.
- **Code review gate caught a real bug**: `fromDate` silently ignored at runtime in react-day-picker v9 — code review surfaced it immediately, fixed in the same session before milestone close.
- **Parallel Wave 1 execution**: Three files modified in parallel across worktrees — no conflicts, clean merge.

### What Was Inefficient

- **Worktree isolation + bash permissions**: Plans 01-02 and 01-03 agents couldn't commit inside their worktrees due to permission prompts (needed bash to run `git commit`). Orchestrator had to commit the changes manually. Could be avoided by granting bash in project settings or running in sequential mode for simple single-file plans.
- **01-03 agent committed to main**: The recurring-page agent bypassed worktree isolation and committed directly to main. Didn't cause harm (no conflicts) but violates the intended isolation model.
- **REQUIREMENTS.md checkboxes not auto-updated**: Phase completion didn't mark requirements `[x]` in REQUIREMENTS.md — had to update manually at milestone close. Traceability table stayed "Pending" throughout.

### Patterns Established

- **Inline Calendar toggle pattern**: `onClick={() => setState((v) => !v)}` on Button, `{state && <Calendar .../>}` rendered below trigger — stateless, no Radix dependency
- **Compact Calendar props**: `className="mt-2 w-full ... [--cell-size:1.75rem]"` + `classNames={{ root: "w-full", month: "flex w-full flex-col gap-2", week: "mt-1 flex w-full" }}` + `showOutsideDays={false}` — both `className` and `classNames.root` needed for full-width
- **react-day-picker v9 date restriction**: Use `disabled={{ before: parseISO(date) }}` — `fromDate` exists in types but is a no-op at runtime in v9.14.0

### Key Lessons

1. **Always check react-day-picker v9 API**: `fromDate`/`toDate` are deprecated stubs — use `disabled` prop for day-cell restrictions, `startMonth`/`endMonth` for navigation constraints
2. **Specify bash permissions upfront for worktree agents**: Agents that need `git commit` inside a worktree should be granted bash access before spawning — saves orchestrator cleanup
3. **PATTERNS.md pays off for multi-file identical fixes**: When the same structural change applies to N files with small variations, a patterns document is worth creating in the plan phase

### Cost Observations

- Single session, one milestone, one phase
- Wave 1: 3 parallel executor agents (~2 min each)
- Code review: 1 agent (~2.5 min)
- Verifier: 2 runs (~2 min each, second after gap fix)
- Total subagent calls: ~8 agents

---

## Cross-Milestone Trends

| Metric | v1.0 |
|--------|------|
| Phases | 1 |
| Plans | 4 |
| Rework cycles | 1 (fromDate gap closure) |
| Verification score | 11/11 |
| Code review critical findings | 1 (resolved same session) |
| Session count | 1 |
