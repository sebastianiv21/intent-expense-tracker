# Intent Expense Tracker - UI/UX Specification Document

## Overview

A mindful expense tracker implementing the 50/30/20 budgeting rule (Needs/Wants/Savings). The app features a warm, zen-like aesthetic with a dark theme and terracotta accents.

**Design Approach**: Mobile-First - All designs start at 375px viewport and scale up. Desktop is an enhancement, not the baseline.

---

## Mobile-First Design Principles

### Core Philosophy

- **Design for mobile first**, enhance for desktop
- **Single column layouts** as default
- **Thumb-friendly interactions** - primary actions in the bottom 25% of screen
- **Touch-optimized** - 44px minimum touch targets, generous spacing
- **Bottom sheets over modals** - easier to reach on mobile
- **Gestures** - Swipe actions, pull-to-refresh, horizontal scroll carousels
- **Progressive disclosure** - Show essential info first, details on tap
- **Performance** - Fast load times, skeleton screens, infinite scroll

### Mobile Viewport Baseline

- **Base viewport**: 375px width (iPhone SE / small Android)
- **Touch targets**: Minimum 44x44px
- **Spacing**: 16px base padding, 12-16px between elements
- **Typography**: 16px minimum body text (prevents iOS zoom)
- **Safe areas**: Account for notches, home indicators, status bars

### Thumb Zones

- **Primary actions**: Bottom right or center (easy reach)
- **Destructive actions**: Top corners (harder to reach accidentally)
- **Navigation**: Bottom tab bar (not top)
- **Back buttons**: Top left or swipe gesture

---

## Design System

### Color Palette

- **Background**: `#16110a` (dark brown/black)
- **Card Background**: `#1f1815`
- **Border**: `#2d2420`
- **Primary Text**: `#f5f2ed` (warm white)
- **Secondary Text**: `#a89580` (warm gray)
- **Accent**: `#c97a5a` (terracotta/warm orange)
- **Needs (Green)**: `#8b9a7e`
- **Wants (Orange)**: `#c97a5a`
- **Savings (Gold)**: `#a89562`

### Typography

- **Primary Font**: Plus Jakarta Sans
- **Monospace Font**: Geist Mono
- **Mobile base**: 16px (prevents iOS zoom on inputs)
- **Headings**: 24px (H1), 20px (H2), 18px (H3)
- **Body**: 16px
- **Small/Caption**: 14px

### Spacing Scale (Mobile)

- `xs`: 4px
- `sm`: 8px
- `md`: 12px
- `lg`: 16px
- `xl`: 20px
- `2xl`: 24px
- `3xl`: 32px

---

## Mobile Navigation

### Bottom Tab Bar (Mobile Primary Navigation)

**Position**: Fixed bottom with safe area padding

**Height**: 64px + safe area insets

**Items** (4 primary):

1. **Home** (Dashboard) - House icon
2. **Activity** (Transactions) - List icon
3. **Insights** - Chart/Pie icon
4. **Profile** - User icon

**Active State**:

- Filled icon + accent color (`#c97a5a`)
- Subtle scale animation (1.0 → 1.1)
- Label appears below icon

**Inactive State**:

- Outlined icon + secondary text color
- Smaller scale (0.95)

**Floating Action Button (FAB)**:

- Position: Centered above tab bar, -28px offset
- Size: 56x56px circle
- Icon: Plus (+) in white
- Background: Accent color (`#c97a5a`)
- Shadow: 0 4px 12px rgba(201, 122, 90, 0.4)
- Tap: Scale down to 0.95, then bounce back

**Interaction**:

- Tap to navigate
- Haptic feedback on tab switch (if available)
- Smooth icon transition animation

---

## 1. Authentication Flow (Mobile)

### Mobile-Specific Considerations

- **Keyboard handling**: Input fields scroll into view when focused
- **Auto-focus**: Email field focused on page load
- **Return key**: Advances to next field or submits form
- **Password visibility**: Toggle icon inside input field
- **Biometric auth**: Face ID / Touch ID prompt on login screen (future)

### 1.1 Login Page

**Route**: `/login`

**Layout** (Mobile):

- Full viewport height
- Vertically centered card with 16px horizontal padding
- Card max-width: 100% (full bleed on mobile)
- Status bar aware top padding (safe area)

**Components**:

- Logo/brand (centered, top)
- **Email input**:
  - Type: email
  - Auto-capitalize: off
  - Auto-correct: off
  - Keyboard: email-address
  - Return key: "next"
- **Password input**:
  - Type: password
  - Show/hide toggle button (eye icon)
  - Return key: "done"
- **"Sign In" button**:
  - Full width
  - Height: 48px
  - Positioned above keyboard when active
- **"Create account" link**: Below button, centered

**Mobile Interactions**:

- Swipe down to dismiss keyboard
- Tap outside input to blur
- Loading state: Button shows spinner, disabled
- Error: Shake animation on form + inline message

**Keyboard Handling**:

- Scroll view adjusts when keyboard appears
- "Done" button submits form
- Form stays accessible at all times

---

### 1.2 Register Page

**Route**: `/register`

**Layout** (Mobile): Same as login

**Components**:

- **Full name input**:
  - Type: text
  - Auto-capitalize: words
  - Return key: "next"
- **Email input** (same as login)
- **Password input** (same as login)
- **"Create Account" button** (full width, 48px height)
- **"Already have an account?" link**

**Mobile-Specific**:

- Password strength indicator (inline, below field)
- Progressive validation (check as user types)
- Terms/privacy link at bottom (small text)

---

## 2. Onboarding Flow (Mobile)

### 2.1 Financial Profile Setup

**Route**: `/onboarding`

**Mobile Layout**:

- Single column, vertically scrollable
- 16px horizontal padding
- Progress bar at top (visual indicator)

**Components**:

#### Welcome Section

- Large illustration or icon (centered)
- Heading: "Let's set up your mindful budget"
- Subtext: Brief explanation of 50/30/20 rule

#### Monthly Income Input

- **Label**: "What's your monthly income?"
- **Input**:
  - Type: number
  - Prefix: Currency symbol ($)
  - Keyboard: numeric
  - Large font size (24px) for visibility
  - Placeholder: "0.00"
- Helper text: "This helps us calculate your spending buckets"

#### Allocation Sliders (Mobile-Optimized)

Instead of text inputs, use **interactive sliders**:

- **Needs Slider** (Green):
  - Label: "Needs (50%)"
  - Range: 0-100%
  - Default: 50%
  - Real-time percentage display
  - Haptic feedback at 10% intervals

- **Wants Slider** (Orange):
  - Label: "Wants (30%)"
  - Range: 0-100%
  - Default: 30%

- **Future/Savings Slider** (Gold):
  - Label: "Future (20%)"
  - Range: 0-100%
  - Default: 20%

**Mobile Interactions**:

- Sliders adjust other values to maintain 100% total
- Validation message: "Total must equal 100%" in red
- Visual pie chart preview updates in real-time

#### Completion Button

- **"Complete Setup"** (full width, fixed to bottom with 16px margin)
- Disabled until valid
- Success: Confetti animation + fade to dashboard

**Mobile UX Notes**:

- Sliders easier to use than number inputs on mobile
- Real-time feedback prevents errors
- Fixed CTA button always accessible
- Single screen (no multi-step wizard) for speed

---

## 3. Main Application Views (Mobile)

### 3.1 Dashboard (Home)

**Route**: `/`

**Mobile Layout**:

- Vertical scroll
- 16px horizontal padding
- Pull-to-refresh enabled
- Sticky date header (optional)

**Components** (Mobile-Optimized):

#### Header Section

- **Greeting**: "Good morning, Sarah" (20px, bold)
- **Date**: "Tuesday, February 10" (14px, secondary color)
- **Mindful tip card**:
  - Horizontal scroll if multiple
  - Background: subtle gradient
  - Icon + short text
  - Dismissible (swipe right)

#### Balance Summary Card

- **Current Balance** (large, 32px):
  - "$2,450.00"
  - Color: white
- **Mini sparkline** (simplified for mobile):
  - 7-day trend
  - Tap to expand full chart
- **Month summary**: Income ↑ $3,000 | Expenses ↓ $550

#### 50/30/20 Harmony Cards (Horizontal Scroll)

Instead of grid, use **horizontal carousel**:

- Cards snap to center
- Peek next card (show 20% of next card)
- Swipe left/right to navigate
- Dots indicator below (3 dots)

**Card Design** (per bucket):

- Width: 280px (fits viewport with peek)
- Height: 160px
- Icon top-left
- Amount center (large)
- "of $1,500" below (small)
- Progress bar at bottom
- Color-coded border top

**Mobile Gestures**:

- Horizontal swipe: Navigate between buckets
- Tap: Expand to detailed view
- Long press: Quick add to this bucket

#### Quick Stats Row (Horizontal Scroll)

- **Daily Avg**: "$45/day"
- **Safe to Spend**: "$120"
- **Days Left**: "18 days"
- Cards: 120px width each, horizontal scroll

#### Recent Transactions Widget

- **Header**: "Recent" + "View all →" link
- **List**: Last 5 transactions
- **Transaction Item** (swipeable):
  - Swipe left: Reveal Edit/Delete actions
  - Swipe right: Quick duplicate
  - Tap: Open detail view

#### Planned Outflows Widget

- **Header**: "Upcoming"
- **List**: 3 upcoming recurring items
- **Item**: Icon + description + date + amount

#### Mindful Savings Widget

- Full-width card
- Illustration or icon
- Encouraging message
- Progress to next milestone

**Mobile Interactions**:

- **Pull-to-refresh**: Reload all data
- **Swipe gestures**: On transaction items
- **FAB tap**: Open add transaction bottom sheet
- **Long press**: Context menu on cards

**Empty States**:

- First-time user: Large illustration + "Add your first transaction" CTA
- Hide widgets that have no data

---

### 3.2 Transactions Page

**Route**: `/transactions`

**Mobile Layout**:

- Sticky search bar at top
- Filter chips (horizontal scroll)
- Infinite scroll list
- FAB for quick add

**Components**:

#### Sticky Search Header

- **Search input**:
  - Full width
  - Icon: Search (left)
  - Clear button (right, appears when typing)
  - Placeholder: "Search transactions..."
  - Auto-focus on page load (optional)

#### Filter Chips (Horizontal Scroll)

- Chips: "All", "Income", "Expense", "Date Range", "Amount"
- Active chip: Filled background
- Tap to open filter modal
- Swipe horizontally to see all

#### Transaction List (Infinite Scroll)

- **Grouping**: By date ("Today", "Yesterday", "Feb 8")
- **Transaction Item**:
  - Left: Category icon (44x44px)
  - Center: Description + Category badge
  - Right: Amount (colored)
  - **Swipe left**: Reveal actions (Edit/Delete)
    - Edit: Blue background
    - Delete: Red background
  - **Tap**: Open detail/edit view

**Mobile Gestures**:

- **Swipe left**: Reveal edit/delete
- **Swipe right**: Mark as favorite/important
- **Long press**: Multi-select mode
- **Pull up**: Load more (infinite scroll)

#### Add/Edit Transaction (Bottom Sheet)

- **Sheet height**: 85% of screen (not full screen)
- **Drag handle** at top
- **Fields** (stacked vertically):
  1. Amount (large, numeric keyboard)
  2. Type toggle (Income/Expense - segmented control)
  3. Category (dropdown/bottom sheet)
  4. Date (date picker)
  5. Description (optional)
- **Actions** (sticky bottom):
  - "Cancel" (left, text button)
  - "Save" (right, primary button)

**Mobile UX**:

- Bottom sheet easier to reach than modal
- Drag down to dismiss
- Numeric keypad for amount
- Category picker as separate sheet

#### Empty State

- Centered illustration
- "No transactions yet"
- "Add Transaction" button

---

### 3.3 Budgets Page

**Route**: `/budgets`

**Mobile Layout**:

- Month selector (dropdown/picker)
- Overall summary card
- Budget list (vertical scroll)
- Grouped by allocation bucket

**Components**:

#### Month Selector

- **Display**: "February 2026" with dropdown arrow
- **Tap**: Open month picker (bottom sheet)
- **Navigation**: Left/right arrows to change month

#### Overall Summary Card

- **Total Budgeted**: "$3,000"
- **Total Spent**: "$1,250" (with progress bar)
- **Remaining**: "$1,750"
- **Status**: "On Track" badge

#### Budget List (Grouped)

**Needs Section** (Green header):

- Expandable (accordion)
- Header: "Needs" + total spent/budget
- List of budget cards (vertical)

**Budget Card**:

- Category icon + name
- Progress bar (thin, colored)
- "$450 of $1,500" text
- Percentage badge (right)
- Tap to edit

**Mobile Interactions**:

- **Tap header**: Expand/collapse section
- **Tap card**: Open edit budget sheet
- **Long press**: Quick options (reset, delete)

#### Add/Edit Budget (Bottom Sheet)

- Category dropdown
- Budget amount (numeric input)
- Current spending indicator
- "Save" / "Delete" buttons

#### Empty State

- "No budgets set for this month"
- "Create your first budget" CTA

---

### 3.4 Categories Page

**Route**: `/categories`

**Mobile Layout**:

- Segmented control (Income | Expense)
- Expense view: Tabs for buckets (Needs/Wants/Future)
- Vertical list

**Components**:

#### Segmented Control

- **Options**: "Income" | "Expense"
- Position: Sticky below header
- Animation: Slide indicator

#### Bucket Tabs (Expense Only)

- Horizontal scroll tabs:
  - "Needs (8)" - Green dot
  - "Wants (5)" - Orange dot
  - "Future (3)" - Gold dot
- Active tab: Underline + bold
- Swipe content to switch tabs

#### Category List

- **Category Item**:
  - Icon (44x44px, rounded)
  - Category name
  - Right: Edit icon or swipe actions
- **Swipe left**: Edit/Delete

#### Add/Edit Category (Bottom Sheet)

- **Icon picker**:
  - Grid of emojis/icons
  - Horizontal scroll categories
  - Tap to select
- **Name input**
- **Type**: Income/Expense toggle
- **Allocation bucket** (if expense):
  - Radio buttons: Needs/Wants/Future
  - Color-coded
- **Save/Cancel**

**Mobile UX**:

- Emoji picker optimized for mobile
- Swipe between bucket tabs
- Quick actions on swipe

---

### 3.5 Recurring Transactions Page

**Route**: `/recurring`

**Mobile Layout**:

- Segmented control: "Active (5)" | "Paused (2)"
- List grouped by type

**Components**:

#### Segmented Control

- Shows count badge on each tab
- Active: Filled background

#### Recurring List

**Grouped by**: Income first, then Expense

**Recurring Item**:

- Icon + Description
- Amount (right)
- Below: "Monthly • Next: Feb 15"
- Toggle switch (right, for active/inactive)
- Tap to edit

**Swipe Actions**:

- **Swipe left**: Pause/Activate, Delete
- **Swipe right**: Duplicate

#### Add/Edit Recurring (Bottom Sheet)

- Description
- Amount
- Type toggle
- Category
- **Frequency**:
  - Dropdown or wheel picker
  - Options: Daily, Weekly, Biweekly, Monthly, Quarterly, Yearly
- Start date
- End date (optional)
- Save/Cancel

**Mobile UX**:

- Toggle switch easy to tap
- Frequency picker as wheel (native feel)

---

### 3.6 Insights Page

**Route**: `/insights`

**Mobile Layout**:

- Date range selector (top)
- Scrollable charts section
- Simplified visualizations for small screens

**Components**:

#### Date Range Picker

- **Options**: "This Month", "3 Months", "6 Months", "Year"
- Horizontal scroll chips
- Tap to select

#### 50/30/20 Compliance Card

- **Simplified for mobile**:
  - Donut chart (center hole)
  - Tap segments to see details
  - Legend below (swipeable)
- **Compliance Score**: Large number (0-100)
- Status: "Great job!" or "Needs attention"

#### Spending by Category

- **Horizontal bar chart** (easier to read on mobile than pie)
- Bars sorted by amount
- Color-coded by bucket
- Tap bar for details

#### Allocation Performance

- **Three cards** (vertical stack):
  - Needs: Progress bar + "$450 of $1,500"
  - Wants: Progress bar + variance
  - Future: Progress bar + variance
- Status indicator icon

#### Insights Cards (Scrollable)

- "Top Spending": List of categories
- "Savings Rate": Percentage + trend
- "Biggest Expense": Highlight transaction

**Mobile Optimizations**:

- Charts are tappable for details
- Simplified data visualization
- Swipe through different views
- Pull-to-refresh data

---

### 3.7 Profile Page

**Route**: `/profile`

**Mobile Layout**:

- User info card (top)
- Menu list (scrollable)
- Settings sections

**Components**:

#### User Info Card

- Avatar (large, 80x80px)
- Name (bold)
- Email
- Member since
- Tap to edit (future)

#### Menu List

**Navigation** (tappable rows):

- Categories → (chevron right)
- Insights →
- Settings →

**Settings Section**:

- Personal Info (disabled)
- Preferences (disabled)
- Notifications (disabled)
- Security (disabled)

#### Account Actions

- "Logout" (red text, destructive)
- Confirmation dialog on tap

**Footer**:

- App version
- Links: Terms, Privacy

**Mobile UX**:

- Standard iOS/Android settings pattern
- Chevron indicators for navigation
- Destructive action styling

---

## 4. Mobile Interaction Patterns

### 4.1 Bottom Sheets (Primary Modal Pattern)

**Use For**:

- Add/Edit transactions
- Category picker
- Date picker
- Filter selection
- Confirmation dialogs

**Specs**:

- **Height**: 50-85% of screen
- **Handle bar**: 36px drag area at top
- **Close**: Drag down, tap backdrop, or close button
- **Animation**: Slide up from bottom, spring physics

**States**:

- **Closed**: Hidden below viewport
- **Peeking**: Shows 20% (hint content)
- **Open**: Full height
- **Expanded**: Full screen (rare)

---

### 4.2 Swipe Gestures

**Transaction Items**:

- **Swipe Left**: Reveal Edit (blue), Delete (red)
- **Swipe Right**: Quick actions (duplicate, favorite)
- **Threshold**: 40% of item width to trigger action
- **Animation**: Smooth rubber-band effect

**List Items** (general):

- **Swipe Left**: Actions menu
- **Long Press**: Multi-select mode
- **Pull Down**: Refresh
- **Pull Up**: Load more

---

### 4.3 Pull-to-Refresh

**Implementation**:

- Pull down on scrollable content
- Resistance increases with distance
- Threshold: 80px
- **Spinner**: Native-style or custom
- **Success**: Haptic feedback + fade spinner

**Pages with Pull-to-Refresh**:

- Dashboard
- Transactions
- Budgets
- Insights
- Profile

---

### 4.4 Touch Feedback

**Buttons**:

- **Tap**: Scale to 0.95, opacity 0.8
- **Release**: Spring back to 1.0
- **Duration**: 100ms

**Cards**:

- **Tap**: Subtle background darken
- **Long press**: Scale down slightly

**Lists**:

- **Tap**: Ripple effect (Android) or highlight (iOS)

---

### 4.5 Infinite Scroll

**Implementation**:

- Auto-load next page when 80% scrolled
- Show loading spinner at bottom
- Skeleton items while loading
- Error: "Tap to retry" button

**Pages with Infinite Scroll**:

- Transactions
- Budgets (if many categories)
- Categories (if many)

---

## 5. Mobile Forms

### 5.1 Input Fields

**Text Inputs**:

- Height: 48px minimum
- Padding: 16px horizontal
- Border: 1px, rounded 8px
- Focus: Accent color border + shadow
- Error: Red border + error message below

**Numeric Inputs** (Amount):

- Large font: 24px
- Currency prefix: "$"
- Keyboard: numeric
- Alignment: Right

**Keyboard Handling**:

- Inputs scroll into view when focused
- "Done" button closes keyboard
- Form scrolls to next field on "Next"

### 5.2 Selection Controls

**Dropdowns** (Mobile):

- Don't use native `<select>`
- Use bottom sheet with list
- Searchable if >10 items
- Checkmark for selected

**Toggles**:

- Width: 52px, Height: 32px
- Thumb: 28px circle
- Animation: 200ms spring
- Haptic feedback on change

**Radio Buttons**:

- Use cards or rows (easier to tap)
- Selected state: Filled + accent border
- Unselected: Outline only

---

## 6. Mobile Navigation (Detailed)

### 6.1 Bottom Tab Bar (Detailed)

**Position**: Fixed bottom
**Height**: 64px + safe area bottom
**Background**: Blur + semi-transparent dark

**Items** (Left to Right):

1. **Home** - Dashboard
2. **Activity** - Transactions
3. **FAB** - Add Transaction (center, elevated)
4. **Stats** - Insights
5. **Profile** - Profile

**Active State**:

- Icon: Filled, accent color
- Label: Visible, accent color
- Scale: 1.0

**Inactive State**:

- Icon: Outline, secondary color
- Label: Visible but muted
- Scale: 0.9

**FAB (Center)**:

- Size: 56px
- Position: -28px from tab bar top
- Shadow: Strong (0 4px 20px)
- Animation: Scale bounce on tap

---

### 6.2 Header Navigation

**Standard Header**:

- Height: 56px
- Left: Back arrow (if not root)
- Center: Title
- Right: Action buttons (if any)

**Transparent Header** (Dashboard):

- No background initially
- Blur background on scroll
- Title fades in on scroll

---

### 6.3 Gesture Navigation

**iOS**:

- Swipe from left edge: Go back
- Tap status bar: Scroll to top

**Android**:

- Back button: Navigate back
- System gestures respected

---

## 7. Responsive Breakpoints (Mobile-First)

### Baseline: Mobile (< 768px)

- **Layout**: Single column
- **Navigation**: Bottom tab bar
- **Modals**: Bottom sheets
- **Cards**: Full width, stacked
- **Grid**: 1 column
- **Touch**: All interactions touch-optimized

### Tablet (768px - 1023px)

- **Layout**: Max-width container (720px)
- **Navigation**: Still bottom tab (or collapsible sidebar)
- **Grid**: 2 columns for cards
- **Cards**: Side-by-side where appropriate
- **Typography**: Slightly larger

### Desktop (≥ 1024px)

- **Layout**: Sidebar + content area
- **Navigation**: Left sidebar (fixed)
- **Modals**: Centered dialogs
- **Grid**: Multi-column layouts
- **Cards**: Grid layouts
- **Interactions**: Hover states added

### Large Desktop (≥ 1440px)

- **Container**: Max-width 1200px
- **Grid**: 3-4 columns
- **Sidebar**: Can be wider
- **Whitespace**: More generous

---

## 8. Accessibility (Mobile)

### Touch Targets

- Minimum: 44x44px
- Recommended: 48x48px
- Spacing between: 8px minimum

### Screen Readers

- All icons have aria-labels
- Decorative icons: aria-hidden
- Dynamic content: aria-live regions
- Forms: Proper labels + error announcements

### Color Contrast

- Text on background: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 minimum

### Focus Management

- Visible focus indicators
- Focus trapped in modals
- Returns focus on close

### Motion

- Respect `prefers-reduced-motion`
- Essential animations only
- No auto-playing animations

---

## 9. Performance Guidelines

### Loading States

- Skeleton screens (not spinners)
- Progressive image loading
- Content placeholder while loading

### Image Optimization

- WebP format
- Responsive images
- Lazy loading
- Blur-up placeholders

### Animations

- Use `transform` and `opacity` only
- 60fps target
- Hardware acceleration

### Bundle Size

- Code splitting by route
- Lazy load heavy components (charts)
- Tree shake unused code

---

## 10. Error Handling (Mobile)

### Network Errors

- **Offline Banner**: Fixed top, "No connection"
- **Retry**: Pull-to-refresh or tap button
- **Cached Data**: Show with "last updated" timestamp

### Validation Errors

- Inline field errors
- Shake animation on submit
- Focus first error field

### Empty States

- Centered illustration (200px)
- Friendly message
- Clear CTA button

---

## 11. Assets Required

### Icons (24px, outline + filled sets)

- Navigation: Home, List, Chart, User, Plus
- Actions: Edit, Delete, Search, Filter, Close
- Status: Check, Warning, Error, Info
- Categories: Custom emoji/icon picker

### Illustrations

- Empty states (no transactions, no budgets)
- Error states (offline, generic error)
- Onboarding (optional)
- Success states (optional)

---

_Document Version: 2.0 - Mobile-First_
_Last Updated: 2026-02-10_
_Project: Intent Expense Tracker_
