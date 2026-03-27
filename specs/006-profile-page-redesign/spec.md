# Feature Specification: Profile Page Redesign

**Feature Branch**: `006-profile-page-redesign`  
**Created**: 2026-03-27  
**Status**: Draft  
**Input**: User description: "Redesign the Profile page for the Intent expense tracker app (web/components/profile-page.tsx and web/app/(app)/profile/page.tsx). The redesign should: use PageHeader component for consistency, format financial data with formatCurrency, display allocation split visually with colored progress bars using bucket colors, replace generic navigation card with clean settings rows using correct icons (Tag for Categories, BarChart2 for Insights), move logout action into a contextual account section, add staggered fade-in animations, and preserve all existing functionality."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Account Identity at a Glance (Priority: P1)

A user opens the Profile page and immediately sees their identity — name, email, avatar, and how long they have been a member — in a visually distinctive header section that feels personal and polished, consistent with the rest of the app.

**Why this priority**: The identity section is the first thing a user sees on the Profile page. It sets the tone for the entire page and anchors the user's sense of ownership over the app.

**Independent Test**: Can be fully tested by navigating to the Profile page and verifying the user's name, email, avatar (or initials fallback), and member-since date are all visible in a cohesive header area. Delivers an immediately improved first impression.

**Acceptance Scenarios**:

1. **Given** a logged-in user with a profile image, **When** they navigate to the Profile page, **Then** their avatar, full name, email, and "Member since [Month Year]" are displayed in a visually prominent identity section at the top.
2. **Given** a logged-in user without a profile image, **When** they navigate to the Profile page, **Then** initials derived from their name are shown as an avatar fallback in the identity section.
3. **Given** a logged-in user, **When** the Profile page loads, **Then** a page header with the title "Profile" and a subtitle is visible, consistent with the header style used across other app pages (Insights, Transactions, etc.).

---

### User Story 2 - Understand Financial Profile at a Glance (Priority: P2)

A user views their financial profile — monthly income target and 50/30/20 allocation split — in a section that makes the percentages immediately scannable through visual indicators (colored bars or badges using the established bucket colors), with currency values formatted for readability.

**Why this priority**: The financial profile is the most data-dense section on the page. Improving its visual clarity directly reduces cognitive load and helps users understand their setup without needing to mentally parse raw numbers.

**Independent Test**: Can be fully tested by checking the financial profile section independently: verify that income is formatted as currency, the three allocation buckets (needs/wants/future) are displayed with their respective colors and visual proportion indicators, and the "Edit" action remains accessible.

**Acceptance Scenarios**:

1. **Given** a user with a configured financial profile, **When** they view the Profile page, **Then** the monthly income target is displayed as formatted currency (e.g., "$5,000.00" not "5000").
2. **Given** a user with allocation percentages set (e.g., 50/30/20), **When** they view the Profile page, **Then** each bucket (needs, wants, future) is shown with its label, percentage, and a colored visual indicator (e.g., progress bar) using the bucket's designated color (sage green, terracotta, gold respectively).
3. **Given** a user viewing the financial profile section, **When** they tap/click the "Edit" button, **Then** the financial profile edit sheet opens correctly.

---

### User Story 3 - Navigate to App Sections from Profile (Priority: P3)

A user navigates to Categories or Insights from the Profile page via a clean, well-labeled list of navigation links that use correct and contextually appropriate icons.

**Why this priority**: Navigation links from the Profile page are secondary utility — the primary nav bar handles most navigation. However, having correct icons and a clean presentation raises the overall quality of the page.

**Independent Test**: Can be fully tested by verifying the navigation section renders two tappable rows — "Categories" with a tag/label icon and "Insights" with a chart/analytics icon — and that each navigates correctly.

**Acceptance Scenarios**:

1. **Given** a user on the Profile page, **When** they view the navigation section, **Then** they see a "Categories" row with a tag/label icon and an "Insights" row with a chart or analytics icon (not a settings/gear icon).
2. **Given** a user on the Profile page, **When** they tap the "Categories" row, **Then** they are navigated to the Categories page.
3. **Given** a user on the Profile page, **When** they tap the "Insights" row, **Then** they are navigated to the Insights page.

---

### User Story 4 - Log Out Safely (Priority: P2)

A user can log out of the app from a clearly visible but contextually appropriate logout action on the Profile page, with a confirmation step to prevent accidental logouts.

**Why this priority**: Logout is an important but infrequent action. It must be accessible and safe (confirmed), but should not visually dominate the page or be styled in a way that creates anxiety on every page visit.

**Independent Test**: Can be fully tested by locating the logout action, tapping it, confirming via the dialog, and verifying the user is redirected to the login page.

**Acceptance Scenarios**:

1. **Given** a user on the Profile page, **When** they scroll to the bottom of the page, **Then** a "Log out" action is visible and clearly labeled below a visual separator.
2. **Given** a user who taps the "Log out" action, **When** the confirmation bottom sheet appears, **Then** they can either confirm (which signs them out and redirects to login) or cancel (which dismisses the sheet and keeps them on the Profile page).
3. **Given** a user who confirms logout, **When** the sign-out completes, **Then** they are redirected to the login page.

---

### User Story 5 - Experience Smooth Page Load Animations (Priority: P3)

A user experiences a polished, staggered reveal animation as the Profile page sections load, consistent with the app's motion design language.

**Why this priority**: Animations are a refinement detail. They contribute to perceived quality and delight but do not affect core functionality.

**Independent Test**: Can be fully tested by loading the Profile page and observing that sections animate in sequentially with a short delay between each, and that the `prefers-reduced-motion` accessibility preference disables animations.

**Acceptance Scenarios**:

1. **Given** a user who loads the Profile page, **When** the page mounts, **Then** each major section fades in with a sequential staggered delay (identity → financial profile → navigation → account actions).
2. **Given** a user who has enabled the system-level "reduce motion" accessibility preference, **When** the Profile page loads, **Then** sections appear without animation (static display).

---

### Edge Cases

- What happens when the user's name is a single word (no space for initials split)? — The initials fallback should use the first character only.
- What happens when `createdAt` is unavailable? — The "Member since" field should be hidden gracefully with no broken layout.
- What happens when `monthlyIncomeTarget` is zero or not set? — Income should display as "$0.00" and the allocation bars should show empty/zero state without errors.
- What happens when all three allocation percentages do not sum to 100 (data integrity issue)? — The bars render proportionally to their stored values without crashing; no validation is performed on this page (edit is handled in the sheet).
- How does the page handle a very long user name or email? — Text should truncate or wrap gracefully without breaking the identity card layout.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Profile page MUST display a page header with the title "Profile" consistent in style with other app pages (Insights, Transactions).
- **FR-002**: The identity section MUST display the user's avatar (image if available, initials fallback if not), full name, email address, and member-since date (formatted as "Month Year").
- **FR-003**: The monthly income target MUST be displayed as formatted currency using the app's existing currency formatting utility.
- **FR-004**: The three allocation buckets (needs, wants, future) MUST each be displayed with their label, percentage value, and a visual proportion indicator (e.g., colored progress bar) using the bucket's designated color.
- **FR-005**: The financial profile section MUST include an "Edit" action that opens the existing financial profile edit sheet.
- **FR-006**: The navigation section MUST display a "Categories" link with a tag/label icon and an "Insights" link with a chart or analytics icon — not a gear/settings icon.
- **FR-007**: Each navigation row MUST navigate the user to its respective page when tapped.
- **FR-008**: A logout action MUST be present at the bottom of the page, visually separated from the navigation section by spacing and a border. The section carries no label.
- **FR-009**: The logout action MUST trigger a confirmation bottom sheet before signing the user out.
- **FR-010**: Confirming logout MUST sign the user out and redirect them to the login page.
- **FR-011**: Page sections MUST animate in with a staggered fade-in effect on mount, respecting the `prefers-reduced-motion` accessibility preference.
- **FR-012**: All existing functionality (FinancialProfileSheet, router navigation) MUST be preserved in the redesigned component. The logout confirmation is upgraded from a centered `Dialog` to a bottom `Sheet` to comply with Constitution Principle I.
- **FR-013**: The app version label ("Intent v1.0") MUST remain visible on the page.

### Constraints

- **CON-001**: The redesign MUST NOT introduce new npm packages. All animations, visual elements, and UI components MUST be implemented using existing project dependencies: Tailwind CSS (including `motion-safe:` utilities), tw-animate-css, shadcn/ui primitives, and lucide-react icons.

### Key Entities

- **User**: The authenticated account holder. Attributes relevant to this page: name, email, avatar image URL, account creation date.
- **Financial Profile**: The user's financial configuration. Attributes: monthly income target (currency), needs percentage, wants percentage, future percentage.
- **Allocation Bucket**: One of three spending categories (needs, wants, future), each with a designated color and semantic meaning within the 50/30/20 budgeting framework.

## Clarifications

### Session 2026-03-27

- Q: Can the redesign introduce new npm dependencies for animations or visual elements? → A: No — must use existing dependencies only (Tailwind CSS, tw-animate-css, shadcn/ui, lucide-react).
- Q: Should the logout section carry a label (e.g., "Account", "Danger zone")? → A: No label — the section is visually separated from the navigation section by spacing and a border only.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can identify their name, email, and member-since date within 3 seconds of the Profile page loading, without scrolling.
- **SC-002**: A user can understand their current allocation split (which bucket has the highest percentage) within 5 seconds of viewing the financial profile section, without needing to mentally compare raw numbers.
- **SC-003**: The Profile page maintains visual and structural consistency with at least 2 other redesigned pages (Insights, Transactions) as judged by shared header style, card treatment, and color usage.
- **SC-004**: All 4 primary user actions (edit financial profile, navigate to categories, navigate to insights, log out) are reachable within 2 taps from the Profile page.
- **SC-005**: Page sections animate on load in a way that is perceived as polished and intentional, with no layout shift or flickering during the animation sequence.
- **SC-006**: The profile page passes accessibility review — all interactive elements have accessible labels, focus is manageable, and reduced-motion preference is honored.
