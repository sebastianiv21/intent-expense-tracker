# Frontend Design Research: Insights Page Redesign

This document compiles research findings on frontend design patterns for the Insights page redesign, focusing on React/Next.js with Tailwind CSS and Recharts.

---

## 1. Typography for Financial Dashboards

### Core Principles (from Datawrapper)

**Sans-serif typefaces are preferred for data visualization** because they:
- Look cleaner and are easier to skim than serif fonts
- Work better for numbers in charts, tables, and tooltips
- Are the standard for financial dashboards (Bloomberg, The Economist)

**Key font requirements for financial data:**

1. **Lining and tabular figures** - Numbers should be the same height (lining) and same width (tabular) for proper alignment in tables and charts
   - Oldstyle figures (like Georgia) drop below the baseline and are hard to read in data contexts
   - Tabular figures make `124.17` and `680.90` the same length for easy comparison

2. **Comprehensive glyph support** - Must include:
   - Currency symbols: `$ € £ ¥`
   - Math symbols: `+ ÷ × = %`
   - Superscript numbers for footnotes: `¹ ² ³`

3. **Appropriate weight usage:**
   - Regular (400) or Medium (500) for body text and descriptions
   - Bold (700) only for titles and emphasis
   - Avoid thin fonts (< 300) - they're hard to read and look like faded text

4. **Font size considerations:**
   - Minimum 12px for chart labels
   - 14-16px for body text in annotations
   - Use high-contrast colors (black/near-black) for most text

### Complementary Fonts for Plus Jakarta Sans

**Current project uses Plus Jakarta Sans** - a geometric sans-serif with a modern, calm aesthetic.

**Recommended pairings for display/heading text:**

| Font | Type | Use Case | Notes |
|------|------|----------|-------|
| **Lora** | Serif | Headlines, section titles | Creates elegant contrast; free via Google Fonts |
| **SangBleu Versailles** | Serif | Premium feel headings | More distinctive; used by fintech platform Carta |
| **DM Sans** | Sans-serif | Alternative UI font | Similar geometric feel; narrower for dense data |
| **Manrope** | Sans-serif | Dashboard headings | Variable font with good weight range |
| **Satoshi** | Sans-serif | Modern headings | Distinctive geometric alternative |

**Recommendation:** Stay with Plus Jakarta Sans as primary, but consider:
- Using weight contrast (Medium 500 → Semibold 600 → Bold 700) for visual hierarchy
- Adding **Lora** for section headers to create a refined, traditional financial feel
- Or use **Plus Jakarta Sans in heavier weights** (Bold/ExtraBold) for display text

### Implementation for Tailwind

```css
/* In globals.css or tailwind config */
--font-display: var(--font-plus-jakarta); /* or Lora for serif contrast */
--font-data: var(--font-plus-jakarta); /* for numbers with tabular figures */

/* For tabular numbers in CSS */
.tabular-nums {
  font-variant-numeric: tabular-nums lining-nums;
}
```

```tsx
// Tailwind usage
<span className="font-semibold text-2xl tabular-nums">
  {formatCurrency(value)}
</span>
```

---

## 2. Asymmetric Layout Patterns for Financial Dashboards

### Core Pattern: Visual Hierarchy Through Weighted Grids

Modern financial apps use **asymmetric grids** to establish clear visual hierarchy:

1. **Primary content (60-70% width)** - Main charts, key metrics
2. **Secondary content (30-40% width)** - Supporting data, summaries
3. **Stacked on mobile** - Primary stays on top

### Common Layout Patterns

**Pattern A: Two-Column Weighted Grid (Current Implementation)**
```
┌────────────────────────────┬──────────────┐
│                            │              │
│   Primary Chart            │   Summary    │
│   (Donut/Pie)              │   Card       │
│   ~60% width               │   ~40% width │
│                            │              │
├────────────────────────────┴──────────────┤
│                                            │
│   Secondary Chart (Bar Chart - Full Width) │
│                                            │
├──────────┬──────────┬──────────┤
│ Card 1   │ Card 2   │ Card 3   │
└──────────┴──────────┴──────────┘
```

**Pattern B: Editorial/Magazine Style**
```
┌────────────────────────────────────────────┐
│  Key Metric (Hero)                         │
├────────────────────┬───────────────────────┤
│                    │                       │
│  Supporting Chart  │   Detail Cards        │
│  ~55%              │   ~45% stacked        │
│                    │                       │
├────────────────────┴───────────────────────┤
│  Secondary Content Row                      │
└────────────────────────────────────────────┘
```

**Pattern C: Bento Grid (Modern Fintech)**
```
┌──────────────┬──────┬──────┐
│              │      │      │
│   Main       │ M1   │ M2   │
│   Metric     │      │      │
│              ├──────┴──────┤
│              │              │
├──────────────┤   Chart B    │
│   Chart A    │              │
│              │              │
└──────────────┴──────────────┘
```

### Asymmetric Grid Implementation (Tailwind)

```tsx
// Current pattern in insights-page.tsx
<div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
  {/* Primary chart gets 1.2x the space */}
  <Card>{/* Donut chart */}</Card>
  <Card>{/* Summary */}</Card>
</div>

// Alternative: More dramatic asymmetry
<div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
  {/* 60/40 split */}
</div>

// Bento-style asymmetric grid
<div className="grid gap-4 grid-cols-2 lg:grid-cols-[1fr_1fr_1fr]">
  <div className="col-span-2 lg:col-span-1 lg:row-span-2">
    {/* Large primary card */}
  </div>
  <div>{/* Smaller card */}</div>
  <div>{/* Smaller card */}</div>
</div>
```

### Fintech-Specific Visual Trust Patterns

From Eleken's Fintech Design Guide:

1. **Visual trust cues** - Padlock icons, security badges, encryption indicators
2. **Generous whitespace** - Creates sense of calm and control
3. **Clear typography** - High contrast, readable sizes
4. **Transparent microcopy** - Explain what data means, avoid jargon
5. **Consistent patterns** - Same card styles, button treatments across all views

---

## 3. Recharts Animation Patterns

### Built-in Animation Properties

Recharts components support animation through several props:

```tsx
<Pie
  data={data}
  dataKey="value"
  isAnimationActive={true}        // Enable/disable animation
  animationBegin={0}              // Delay before animation starts (ms)
  animationDuration={1000}        // Total animation time (ms)
  animationEasing="ease-out"      // Easing function
/>

<Bar
  dataKey="value"
  isAnimationActive={true}
  animationBegin={0}
  animationDuration={800}
  animationEasing="ease-out"
/>
```

### Staggered Reveal Implementation

For sequential chart animations:

```tsx
// Component-level staggered delays
const CHART_ANIMATION_DELAYS = {
  hero: 0,
  primaryChart: 100,
  secondaryChart: 300,
  cards: 500,
};

function AnimatedChart({ delay = 0 }) {
  return (
    <Pie
      animationBegin={delay}
      animationDuration={800}
      animationEasing="ease-out"
    />
  );
}
```

### Accessibility: prefers-reduced-motion

**Critical for accessibility** - respect user preferences:

```css
/* In globals.css */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```tsx
// Or detect in React
const prefersReducedMotion = 
  typeof window !== 'undefined' && 
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

<Pie
  isAnimationActive={!prefersReducedMotion}
  animationDuration={prefersReducedMotion ? 0 : 1000}
/>
```

### Performance Considerations

1. **Disable animations on data updates** - Only animate initial render
   ```tsx
   const [hasAnimated, setHasAnimated] = useState(false);
   
   <Pie
     isAnimationActive={!hasAnimated}
     onAnimationEnd={() => setHasAnimated(true)}
   />
   ```

2. **Use `ease-out` easing** - Feels more natural for data visualization
3. **Keep duration under 1000ms** - Longer animations feel sluggish
4. **GPU-accelerated properties only** - Opacity, transform (not width/height)

### Hover States in Recharts

```tsx
// Custom active shape for hover effects
const ActivePieSlice = (props: PieSectorData) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 8}  // Expand on hover
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      style={{
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))',
        transition: 'all 150ms ease-out',
      }}
    />
  );
};

<Pie
  activeIndex={activeIndex}
  activeShape={ActivePieSlice}
  onMouseEnter={(_, index) => setActiveIndex(index)}
/>
```

---

## 4. Mobile-First Responsive Data Visualization

### Core Principles (from Visual Cinnamon & Boundev)

**"One Screen, One Thought"** - Each mobile view should answer one question

Key constraints:
- Mobile screen shows **3-5 data points** comfortably (vs 15-20 on desktop)
- Touch targets: **minimum 44-48px**
- Load time budget: **3 seconds** on mid-range device over 4G

### Responsive Chart Strategies

| Strategy | When to Use | Implementation |
|----------|-------------|----------------|
| **Scale Down** | Simple charts, narrow to start | `scale_factor = width / base_width` |
| **Stack Vertically** | Multiple charts side-by-side | CSS Grid/Flexbox with breakpoints |
| **Reposition Data** | Circle/network charts | Different layouts per breakpoint |
| **Different Charts** | Dense vs sparse data | Conditionally render chart types |
| **Progressive Disclosure** | Complex data | Show summary → tap for details |

### Mobile-First Breakpoint Strategy

```tsx
// Tailwind responsive patterns for charts
<div className="h-48 sm:h-56 md:h-64 lg:h-72">
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      {/* Chart adjusts to container */}
    </PieChart>
  </ResponsiveContainer>
</div>

// Responsive grid layouts
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr]">
  <Card>{/* Primary */}</Card>
  <Card>{/* Secondary */}</Card>
</div>

// Hide/show based on breakpoint
<div className="hidden lg:block">
  <DetailedChart />
</div>
<div className="lg:hidden">
  <SimplifiedChart />
</div>
```

### Chart Type Adaptations

**Donut Chart → Mobile:**
- Max 5 segments
- Legend below, not beside
- Consider simplifying to top 3 + "Other"

**Bar Chart → Mobile:**
- Max 5-7 bars
- Horizontal bars for better label readability
- Rotate X-axis labels 45° if needed

**Line Chart → Mobile:**
- Max 2-3 series
- Tap-to-reveal tooltips (no hover)
- Consider sparklines for overview

### Touch-First Interactions

Replace hover with tap:

```tsx
// Desktop: Hover-based tooltip
<Tooltip trigger="hover" />

// Mobile: Tap-based tooltip
<Tooltip 
  trigger="click" 
  position={{ x: 0, y: 0 }}
  wrapperStyle={{ position: 'relative' }}
/>

// Swipe for time navigation
<Swipeable onSwipedLeft={nextPeriod} onSwipedRight={prevPeriod}>
  <Chart />
</Swipeable>
```

### Implementation Checklist

```tsx
// 1. Responsive container heights
const chartHeight = {
  base: 180,    // 375px mobile
  sm: 200,      // 640px
  md: 240,      // 768px tablet
  lg: 280,      // 1024px desktop
  xl: 320,      // 1280px+
};

// 2. Dynamic chart props based on screen
const outerRadius = width < 640 ? 60 : 80;
const innerRadius = width < 640 ? 40 : 50;
const barSize = width < 640 ? 16 : 24;

// 3. Simplified data for mobile
const mobileData = data.slice(0, 5);
const displayData = isMobile ? mobileData : data;
```

---

## 5. Skeleton Loading for Charts

### Effective Chart Skeleton Patterns

**Goal:** Represent the shape of the chart, not just a generic rectangle

**Donut Chart Skeleton:**
```tsx
function DonutSkeleton() {
  return (
    <div className="relative h-48 flex items-center justify-center">
      {/* Outer ring */}
      <div className="absolute w-40 h-40 rounded-full bg-muted animate-pulse" />
      {/* Inner ring (hole) */}
      <div className="absolute w-24 h-24 rounded-full bg-background" />
      {/* Center content placeholder */}
      <div className="relative z-10">
        <Skeleton className="h-8 w-16 mx-auto" />
        <Skeleton className="h-3 w-12 mx-auto mt-1" />
      </div>
    </div>
  );
}
```

**Bar Chart Skeleton:**
```tsx
function BarChartSkeleton() {
  return (
    <div className="h-64 flex items-end gap-3 px-4">
      {[60, 80, 45, 90, 70, 55, 85].map((height, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-md bg-muted animate-pulse"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}
```

**Card with KPI Skeleton:**
```tsx
function KPICardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-4 w-24" /> {/* Label */}
        <Skeleton className="h-8 w-32" /> {/* Value */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-16" /> {/* Trend */}
        </div>
        <Skeleton className="h-2 w-full rounded-full" /> {/* Progress bar */}
      </CardContent>
    </Card>
  );
}
```

### Using Existing Skeleton Component

The project has a skeleton component at `web/components/ui/skeleton.tsx`:

```tsx
// Current skeleton implementation uses Tailwind animate-pulse
<div className="animate-pulse rounded-md bg-muted" />
```

**Current Insights skeleton** (`insights-skeleton.tsx`):
```tsx
export function InsightsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      {/* ... */}
    </div>
  );
}
```

### Enhanced Skeleton Implementation

For better chart-specific skeletons:

```tsx
// ChartSkeleton component
import { cn } from "@/lib/utils";

interface ChartSkeletonProps {
  type: 'donut' | 'bar' | 'line' | 'kpi';
  className?: string;
}

export function ChartSkeleton({ type, className }: ChartSkeletonProps) {
  if (type === 'donut') {
    return (
      <div className={cn("relative flex items-center justify-center", className)}>
        <Skeleton className="absolute w-36 h-36 rounded-full" />
        <Skeleton className="absolute w-20 h-20 rounded-full bg-background" />
        <div className="relative text-center">
          <Skeleton className="h-6 w-14" />
        </div>
      </div>
    );
  }
  
  if (type === 'bar') {
    return (
      <div className={cn("flex items-end gap-2 h-full", className)}>
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="flex-1 rounded-t" 
            style={{ height: `${30 + Math.random() * 60}%` }}
          />
        ))}
      </div>
    );
  }
  
  // ... other types
}
```

### Animation Options

**Option 1: Pulse (Current)**
- Uses Tailwind `animate-pulse`
- Simple, lightweight
- May feel "heavy" on large areas

**Option 2: Shimmer (Recommended)**
```css
/* In globals.css */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    var(--muted) 0%,
    var(--secondary) 20%,
    var(--muted) 40%,
    var(--muted) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s linear infinite;
}
```

**Option 3: Wave (with react-loading-skeleton)**
```bash
npm install react-loading-skeleton
```

```tsx
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

<SkeletonTheme 
  baseColor="var(--muted)" 
  highlightColor="var(--secondary)"
>
  <Skeleton circle width={40} height={40} />
  <Skeleton count={2} />
</SkeletonTheme>
```

---

## Summary: Actionable Recommendations

### Typography
- **Keep Plus Jakarta Sans** as primary font
- Use `font-variant-numeric: tabular-nums` for all numbers
- Consider **Lora for section headings** if serif contrast is desired
- Weight hierarchy: Medium (500) → Semibold (600) → Bold (700)

### Asymmetric Layouts
- Use `lg:grid-cols-[1.2fr_1fr]` or `lg:grid-cols-[1.5fr_1fr]` for weighted grids
- Primary content (charts) on left/center, supporting data on right
- Stack vertically on mobile with `grid gap-4`

### Recharts Animations
- Enable animations with `animationDuration={800}` and `ease-out`
- Respect `prefers-reduced-motion` media query
- Implement staggered delays: 0ms → 150ms → 300ms for visual flow
- Custom hover states via `activeShape` prop

### Mobile Responsiveness
- 375px base → scale up with breakpoints
- Dynamic chart dimensions: `outerRadius={isMobile ? 60 : 80}`
- Tap-tooltips instead of hover on mobile
- Max 5-7 data points for mobile charts

### Skeleton Loading
- Chart-specific shapes (donut rings, bar heights)
- Shimmer animation preferred over pulse
- Match skeleton dimensions to actual content
- Current `InsightsSkeleton` needs enhancement for chart shapes

---

## References

- [Datawrapper: Fonts for Data Visualization](https://www.datawrapper.de/blog/fonts-for-data-visualization)
- [Eleken: Modern Fintech Design Guide 2026](https://www.eleken.co/blog-posts/modern-fintech-design-guide)
- [Visual Cinnamon: Mobile vs Desktop DataViz](https://www.visualcinnamon.com/2019/04/mobile-vs-desktop-dataviz/)
- [Boundev: Mobile Data Visualization Design Guide](https://www.boundev.com/blog/mobile-data-visualization-design-guide)
- [LogRocket: React Loading Skeleton](https://blog.logrocket.com/handling-react-loading-states-react-loading-skeleton/)
- [Recharts Documentation](https://recharts.org/)
- [Plus Jakarta Sans Font Pairings](https://maxibestof.one/typefaces/plus-jakarta-sans)
