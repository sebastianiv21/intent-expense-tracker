# Feature Specification: Financial Profile Sheet Redesign

**Feature Branch**: `007-financial-profile-sheet-redesign`  
**Created**: 2026-03-27  
**Status**: Draft  
**Input**: User description: "Redesign the web/components/financial-profile-sheet.tsx bottom sheet to be more visually informative and polished, while keeping all existing logic and the shadcn/ui Sheet wrapper intact."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualise Allocation at a Glance (Priority: P1)

A user opens the financial profile sheet and immediately sees a segmented horizontal bar that shows how their income is split across Needs, Wants, and Future buckets. As they move any slider, the bar segments resize in real time. The total counter reflects the current sum, and a green indicator appears only when all three percentages add up to exactly 100%.

**Why this priority**: The allocation bar replaces three separate percentage numbers with a single, scannable visual. It is the single biggest clarity improvement and makes every other slider interaction more comprehensible.

**Independent Test**: Open the sheet with any saved profile. The allocation bar renders immediately showing three colored segments proportional to the saved percentages. Moving a slider updates the bar within the same interaction frame.

**Acceptance Scenarios**:

1. **Given** the sheet is open with Needs 50%, Wants 30%, Future 20%, **When** the user views the allocation section, **Then** a horizontal bar shows three segments filling 50%, 30%, and 20% of the total width in Needs, Wants, and Future colors respectively.
2. **Given** the total of the three sliders is 90%, **When** the user views the allocation bar, **Then** a 10% neutral/destructive-tinted unfilled segment is visible at the end of the bar and the counter reads "−10% remaining".
3. **Given** the total equals 100%, **When** the user views the counter area, **Then** the counter text colour changes to the success/income colour (the same colour token used elsewhere in the app for positive financial values).
4. **Given** the user drags the Needs slider from 50% to 60%, **When** the drag is in progress, **Then** the Needs segment on the allocation bar grows and the unfilled remainder shrinks in real time with a smooth transition.

---

### User Story 2 - Adjust Sliders with Rich Per-Bucket Feedback (Priority: P2)

A user drags each bucket's slider to set their preferred split. Alongside the percentage label, a styled chip shows the exact dollar amount allocated to that bucket based on the current income value. The chip color matches the bucket, making it easy to associate the dollar figure with the right category.

**Why this priority**: Showing dollar amounts alongside percentages closes the gap between abstract percentages and concrete money, helping users make intentional decisions. It builds directly on the allocation bar but scoped to individual sliders.

**Independent Test**: Enter an income value and move one slider. A chip appears below that slider showing the correctly calculated dollar amount formatted as currency. The other two chips also display their own amounts.

**Acceptance Scenarios**:

1. **Given** monthly income is $5,000 and Needs is at 50%, **When** the user views the Needs slider, **Then** a chip styled in the Needs color displays "$2,500 / month".
2. **Given** the income field is empty or zero, **When** the user views the bucket chips, **Then** the chips are hidden entirely (not shown in the UI).
3. **Given** the user changes the income value from $5,000 to $6,000, **When** the change is made, **Then** all three bucket chips update to reflect the new income without requiring any slider interaction.
4. **Given** the user drags a slider, **When** the percentage changes, **Then** the corresponding chip value transitions smoothly (brief fade or scale animation) to the new amount.

---

### User Story 3 - Understand Income Input with Annual Preview (Priority: P3)

A user types their monthly income into the income field and instantly sees a formatted annual equivalent (e.g., "= $72,000 / year") displayed beneath the input. The income field itself is visually prominent so it reads as the primary driver of all other figures in the sheet.

**Why this priority**: The annual preview adds useful context for users who think in yearly terms, and the larger input treatment anchors the sheet's information hierarchy. It is lower priority than the allocation improvements because the existing field is already functional.

**Independent Test**: Type a monthly income value. A line below the input field immediately shows the correctly calculated annual equivalent formatted as currency.

**Acceptance Scenarios**:

1. **Given** the user types "5000" in the income field, **When** the value is entered, **Then** the text "= $60,000 / year" appears beneath the field.
2. **Given** the income field is cleared or contains an invalid value, **When** the user views the annual preview, **Then** the preview is hidden entirely (not shown in the UI).
3. **Given** the income field is displayed, **When** the user views the sheet, **Then** the income input is visually larger and more prominent than the bucket slider labels, establishing clear visual hierarchy.

---

### Edge Cases

- What happens when all three sliders are at 0%? The allocation bar should show an empty/unfilled state and the save button must remain disabled.
- What happens when a single bucket is set to 100% and the others are at 0%? The bar shows one full-width segment and the total reads "100%"; save is enabled.
- What happens if the user rapidly moves multiple sliders so the total briefly exceeds or falls below 100%? The validation state (bar remainder, counter color, save button) must update correctly on every change without lag.
- What happens when the income value is extremely large (e.g., $999,999,999)? The chip and annual preview must display the formatted value without layout overflow.
- What happens when the sheet is opened, values are changed but not saved, and then cancelled? The original saved values must be restored on next open.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The sheet MUST display a horizontally segmented allocation bar directly below the "Allocation split" label, with three colored segments representing Needs, Wants, and Future proportional to their current percentages.
- **FR-002**: The allocation bar MUST update in real time as any slider is moved, with smooth CSS transitions on segment widths.
- **FR-003**: When the three bucket percentages do not sum to 100%, the allocation bar MUST show an unfilled remainder segment styled in a neutral or destructive color.
- **FR-004**: The total counter MUST show the deficit or surplus (e.g., "−5% remaining") when the sum is not 100%. When the sum equals exactly 100%, the counter text MUST change colour to the success/income colour token — no additional icon or label is required.
- **FR-005**: Each bucket slider MUST be visually styled so the filled track and thumb reflect the bucket's designated color (Needs: sage green, Wants: terracotta, Future: warm gold).
- **FR-006**: Each bucket MUST display a styled chip below its slider showing the formatted dollar amount allocated to that bucket per month. When monthly income is zero or the field is empty, the chip MUST be hidden entirely.
- **FR-007**: The bucket amount chips MUST update whenever either the income value or the corresponding slider percentage changes.
- **FR-008**: The income input MUST display a formatted annual equivalent (monthly value × 12) beneath the field whenever the income is a valid positive number.
- **FR-009**: The income input MUST be visually more prominent than the bucket slider controls, establishing it as the primary data point in the sheet.
- **FR-010**: All existing save/cancel logic, server action calls, error display, and accessibility attributes MUST be preserved without change.
- **FR-011**: The save button MUST remain disabled whenever the bucket total is not exactly 100% or the income is not a valid positive number.
- **FR-012**: The overall sheet container and Sheet component structure from shadcn/ui MUST remain unchanged.

### Key Entities

- **Financial Profile**: The user's saved configuration consisting of a monthly income target and three allocation percentages (Needs, Wants, Future).
- **Bucket**: One of three spending/saving categories. Each bucket has a label, a color, and a percentage value (0–100). The three bucket percentages must sum to 100 for the profile to be valid.
- **Allocation Bar**: A composite visual element composed of three colored segments whose widths reflect bucket percentages, plus an optional unfilled remainder segment.
- **Bucket Chip**: A styled inline element that pairs a bucket's color with the formatted currency amount derived from income × (bucket percentage / 100).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can see the current allocation split without reading any percentage numbers — the allocation bar alone communicates the proportional breakdown at a glance.
- **SC-002**: All allocation bar segments and bucket chip values update within the same visual frame as a slider drag event, with no perceptible delay.
- **SC-003**: A user with a valid income and a balanced allocation (summing to 100%) can complete editing and save their profile in under 60 seconds from opening the sheet.
- **SC-004**: The validation state (save button enabled/disabled, counter label, bar remainder) is always consistent — no state where the save button is enabled with an invalid total, or disabled with a valid one.
- **SC-005**: The annual income preview is visible and correctly calculated whenever the monthly income field contains a valid positive number, requiring zero additional user interaction.
- **SC-006**: All existing functionality (save, cancel, error handling, server action) continues to work correctly after the redesign — zero regression in save/load behavior.

## Clarifications

### Session 2026-03-27

- Q: When monthly income is zero or empty, should bucket amount chips be hidden or show a placeholder? → A: Hide chips entirely.
- Q: What form should the "balanced" indicator take when allocation totals exactly 100%? → A: Counter text colour changes to the success/income colour (mirroring the existing destructive colour logic for invalid totals).

## Assumptions

- The three bucket colors (Needs: `#8b9a7e`, Wants: `#c97a5a`, Future: `#a89562`) are treated as fixed design tokens for this feature; changing them is out of scope.
- Custom slider styling will be achieved through CSS only (no new slider library dependencies).
- The chip and annual preview are purely display elements and do not introduce any new persisted fields.
- "Smooth transition" means a CSS duration of approximately 150–200ms, matching the existing app animation conventions.
- The sheet is used on mobile (bottom sheet pattern), so all new elements must be touch-friendly and not introduce horizontal scroll.
