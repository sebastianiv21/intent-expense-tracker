# Feature Specification: Mobile Navigation Access

**Feature Branch**: `012-mobile-nav-access`
**Created**: 2026-03-28
**Status**: Draft
**Input**: User description: "Mobile navigation access issue: Budgets, Categories, and Recurring pages are inaccessible on mobile devices. The BottomNav component only includes Home, Activity, Stats, and Profile with a central + FAB for transactions. Budgets/Categories/Recurring exist only in SideNav which is desktop-only. Need a mobile-friendly solution to access these secondary pages."

## Clarifications

### Session 2026-03-28

- Q: Which navigation placement strategy for Budgets, Categories, and Recurring? → A: Budgets in bottom bar (replace/augment Profile slot), Categories & Recurring in "More" overflow
- Q: Where should Budgets be positioned in the bottom bar? → A: Replace Profile with Budgets; Profile moves to overflow menu (4 items: Home, Activity, Budgets, Stats)
- Q: Where should the "More" overflow trigger be placed? → A: Place More on the right side with Budgets, creating symmetric layout (Home, Activity on left; Budgets, More on right; FAB in center)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Access Budgets Page on Mobile (Priority: P1)

A mobile user wants to manage their budgets while away from their desktop. They open the app on their phone and tap the Budgets icon directly in the bottom navigation bar to review spending limits and adjust allocations.

**Why this priority**: Budgets is a high-frequency feature for expense tracking—users need quick, one-tap access to monitor spending against their limits. Placing it in the bottom bar reflects its importance.

**Independent Test**: Can be fully tested by tapping the Budgets icon in the mobile bottom navigation and verifying the page loads correctly with all budget data visible.

**Acceptance Scenarios**:

1. **Given** a user is on a mobile device, **When** they look at the bottom navigation bar, **Then** they see a "Budgets" icon directly visible.
2. **Given** a user taps "Budgets" in the bottom navigation, **When** the page loads, **Then** they see their full budgets list with all interactive elements functional.
3. **Given** a user is on the Budgets page on mobile, **When** they look at the bottom nav, **Then** the Budgets icon indicates active state.

---

### User Story 2 - Access Categories Page on Mobile (Priority: P2)

A mobile user wants to categorize their spending or manage category settings while on the go. They open the "More" overflow menu and select Categories to view, create, or edit spending categories. Categories remains accessible from the Profile page as well.

**Why this priority**: Categories is a medium-frequency feature used periodically to organize spending. It is accessible via overflow menu and Profile page, providing flexible access without cluttering the bottom bar.

**Independent Test**: Can be fully tested by opening the "More" overflow menu, selecting Categories, and verifying all category management functions work (view list, add category, edit category).

**Acceptance Scenarios**:

1. **Given** a user is on a mobile device, **When** they open the "More" overflow menu, **Then** they see "Categories" as an available option.
2. **Given** a user taps "Categories" from the overflow menu, **When** the page loads, **Then** they see their categories list with icons, names, and bucket assignments.
3. **Given** a user is on the Profile page, **When** they tap the Categories row, **Then** they navigate to the Categories page.

---

### User Story 3 - Access Recurring Page on Mobile (Priority: P2)

A mobile user wants to manage their recurring transactions (subscriptions, regular bills, income) from their phone. They open the "More" overflow menu and select Recurring to view, pause, or edit recurring items.

**Why this priority**: Recurring transactions are managed periodically rather than daily. Overflow menu placement provides access without adding clutter to the high-frequency bottom bar navigation.

**Independent Test**: Can be fully tested by opening the "More" overflow menu, selecting Recurring, and verifying recurring transaction management works (view list, toggle active/paused, edit details).

**Acceptance Scenarios**:

1. **Given** a user is on a mobile device, **When** they open the "More" overflow menu, **Then** they see "Recurring" as an available option.
2. **Given** a user taps "Recurring" from the overflow menu, **When** the page loads, **Then** they see their recurring transactions with status indicators (active/paused).
3. **Given** a user is on the Recurring page on mobile, **When** they look at the overflow menu, **Then** the Recurring item indicates active state.

---

### User Story 4 - Discover Overflow Navigation (Priority: P3)

A new mobile user explores the app and needs to discover that additional pages exist beyond the visible bottom navigation items (Home, Activity, Budgets).

**Why this priority**: Discoverability ensures users know all features are available. The "More" overflow provides access to Categories and Recurring.

**Independent Test**: Can be tested by observing a new user interact with the mobile navigation and confirming they can identify and access the overflow menu without guidance.

**Acceptance Scenarios**:

1. **Given** a user is on any mobile page, **When** they look at the bottom navigation area, **Then** they see a "More" button (ellipsis icon or label) for accessing additional navigation options.
2. **Given** a user opens the overflow menu, **When** they view the menu contents, **Then** Stats, Categories, Recurring, and Profile are listed with clear labels and icons.

---

### Edge Cases

- What happens when a user navigates to a secondary page and rotates their device to landscape? The navigation pattern should gracefully adapt or trigger the desktop sidebar.
- How does the system handle deep links to Budgets/Categories/Recurring pages on mobile? Users arriving via deep link should land on the correct page without needing to use the overflow menu.
- What happens if a user has many secondary navigation items (future feature expansion)? The overflow menu should accommodate additional items without requiring horizontal scrolling.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST add Budgets as a directly accessible item in the mobile bottom navigation bar.
- **FR-002**: System MUST provide a "More" overflow menu containing Profile, Stats, Categories, and Recurring navigation options.
- **FR-003**: System MUST preserve the central FAB position and functionality for creating new transactions.
- **FR-004**: System MUST indicate visually that the overflow menu contains additional navigation options (e.g., "More" label or ellipsis icon).
- **FR-005**: System MUST show icons and labels for all overflow menu items consistent with the desktop sidebar design.
- **FR-006**: System MUST allow users to navigate to Categories or Recurring with a single tap from the overflow menu.
- **FR-007**: System MUST close the overflow menu after a navigation selection is made.
- **FR-008**: System MUST indicate the active page in the overflow menu when Categories or Recurring is currently displayed.
- **FR-009**: System MUST only display the overflow navigation pattern on screens where the desktop sidebar is hidden.
- **FR-010**: System MUST provide access to Categories from both the overflow menu and the Profile page.
- **FR-011**: System MUST maintain the existing bottom navigation items (Home, Activity) on the left side while adding Budgets and a "More" overflow trigger on the right side.
- **FR-012**: System MUST remove Stats and Profile from the bottom bar and provide access via the overflow menu.

### Key Entities

- **Navigation Item**: Represents a single destination in the app. Has a label, icon, and route path. Categorized as primary (shown in bottom nav: Home, Activity on left; Budgets, More on right) or overflow (shown in "More" menu: Stats, Categories, Recurring, Profile).
- **Overflow Menu**: A temporary panel triggered by the "More" button in the bottom nav, containing Stats, Categories, Recurring, and Profile navigation items. Appears on mobile devices only.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Mobile users can access Budgets with 1 tap directly from the bottom navigation bar.
- **SC-002**: Mobile users can access Categories or Recurring within 2 taps from any screen (via overflow menu).
- **SC-003**: 100% of navigation items available on desktop sidebar are also accessible on mobile devices.
- **SC-004**: Users complete navigation to any secondary page in under 3 seconds on average.
- **SC-005**: Zero increase in the number of taps required to access existing primary navigation items (Home, Activity) compared to the current implementation.
- **SC-006**: The overflow menu trigger is identifiable by users within 5 seconds of first viewing the navigation area.
- **SC-007**: Stats, Categories, Recurring, and Profile are accessible within 2 taps via the overflow menu.

## Assumptions

- The overflow menu will use a bottom sheet pattern to match the existing design language (transaction sheet, recurring sheet).
- The bottom navigation bar will have a symmetric layout: Home and Activity on the left, FAB in center, Budgets and More on the right.
- The "More" overflow trigger will use an ellipsis icon positioned on the right side of the bottom bar.
- Stats, Categories, Recurring, and Profile will be accessible from the overflow menu.
- Users are familiar with overflow menu patterns from other mobile applications.
- Categories will remain accessible from the Profile page as an alternative entry point (when navigating to Profile via overflow).
- No additional overflow items will be added in the immediate future beyond Stats, Categories, Recurring, and Profile.
- The existing `SideNav` items list can inform the overflow menu content to maintain consistency between desktop and mobile navigation.
