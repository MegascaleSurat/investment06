# Zero-Thinking Trading System — Frontend Master Instructions

> **This file is the single source of truth for all frontend development.**
> Every developer must read this file completely before writing a single line of code.
> No exceptions. No shortcuts. No personal judgment.

---

## Table of Contents

1. [How to Use This File](#1-how-to-use-this-file)
2. [Design System Reference](#2-design-system-reference)
3. [Tech Stack — Locked, No Substitutions](#3-tech-stack--locked-no-substitutions)
4. [Project Structure](#4-project-structure)
5. [Naming Conventions](#5-naming-conventions)
6. [shadcn/ui — Mandatory Component Rules](#6-shadcnui--mandatory-component-rules)
7. [Mobile-First Rules](#7-mobile-first-rules)
8. [TypeScript Rules](#8-typescript-rules)
9. [State Management Architecture](#9-state-management-architecture)
10. [API Layer Rules](#10-api-layer-rules)
11. [WebSocket Rules](#11-websocket-rules)
12. [Number & Data Formatting](#12-number--data-formatting)
13. [Business Domain Rules](#13-business-domain-rules)
14. [Screen-by-Screen Instructions](#14-screen-by-screen-instructions)
15. [Shared Component Specifications](#15-shared-component-specifications)
16. [Build Order — Mandatory Sequence](#16-build-order--mandatory-sequence)
17. [Performance Rules](#17-performance-rules)
18. [Error Handling Rules](#18-error-handling-rules)
19. [What You Must Never Do](#19-what-you-must-never-do)

---

## 1. How to Use This File

- Read sections 2, 3, 4, 5, 6, 7, 8 first. These are the global rules that apply to every file you create.
- Then read sections 9, 10, 11 for infrastructure understanding.
- Then read sections 14 and 15 before building any screen or component.
- Follow the build order in section 16 exactly. Do not jump ahead.
- When in doubt about any decision, come back to this file. The answer is here.

---

## 2. Design System Reference

### 2.1 Primary Reference — DESIGN.md

> **MANDATORY:** Before writing any component, page, or layout, read the file at:
>
> ```
> client/DESIGN.md
> ```
>
> This file contains the project's visual design tokens, color palette, typography scale,
> spacing system, shadow levels, border radius values, and component-specific visual rules.
> Every visual decision must align with `client/DESIGN.md`.
> If this file and any section below conflict, `client/DESIGN.md` wins.

### 2.2 Theme

The application is **dark-mode first**. The default theme is dark. Light mode is optional and not a priority for v1.

Every color used in code must come from either:
- The tokens defined in `client/DESIGN.md`, or
- shadcn/ui CSS variables (e.g. `hsl(var(--background))`, `hsl(var(--foreground))`)

Never hardcode hex values like `#1a1a1a` or RGB values anywhere in component code.

### 2.3 Typography Rules

- All numbers displayed on screen (prices, percentages, volumes, ratios, quantities) must use a **monospace font**. Use the `font-mono` Tailwind class.
- Use `font-mono` for: LTP, P&L %, P&L ₹, volume ratio, stop loss, target, holding days, order qty.
- Do not use `font-mono` for: stock names, sector names, status labels, navigation, headings.
- Font sizes must follow the scale in `client/DESIGN.md`. Do not invent new sizes.

### 2.4 Color Semantics — These Are Fixed, Never Change Them

| Meaning | Tailwind class | When to use |
|---|---|---|
| Profit / positive / strong | `text-emerald-500` | Positive P&L, STRONG status, READY signal |
| Loss / negative / weak | `text-red-500` | Negative P&L, WEAK status, BLOCKED signal |
| Warning / neutral / caution | `text-amber-500` | NEUTRAL status, low volume, WAITING state |
| Live signal / info | `text-blue-400` | ACTIVE trade state, informational |
| Muted / secondary | `text-muted-foreground` | Subtitles, secondary values, timestamps |
| Primary text | `text-foreground` | All primary content |

For backgrounds of status badges:

| Status | Background | Text |
|---|---|---|
| STRONG / VERY_STRONG / READY | `bg-emerald-950` | `text-emerald-400` |
| NEUTRAL / WAITING | `bg-amber-950` | `text-amber-400` |
| WEAK / BLOCKED / FAILED | `bg-red-950` | `text-red-400` |
| ACTIVE | `bg-blue-950` | `text-blue-400` |
| TRAILING | `bg-emerald-950` | `text-emerald-300` |
| CLOSED | `bg-muted` | `text-muted-foreground` |

### 2.5 Density

This is a trading dashboard. It is a **dense information interface**, not a marketing page. Do not add unnecessary whitespace to look "modern". Every visible pixel should carry information. Padding inside cards is tight. Tables have compact row heights. Numbers are the heroes, not empty space.

---

## 3. Tech Stack — Locked, No Substitutions

These libraries are the only approved options. Do not install alternatives.

| Role | Library | Version |
|---|---|---|
| Framework | React | 18 |
| Language | TypeScript | 5+ |
| Bundler | Vite | Latest |
| Styling | Tailwind CSS | v3 |
| UI Components | **shadcn/ui** | Latest |
| Routing | React Router DOM | v6 |
| Server state | TanStack Query | v5 |
| Client state | Zustand | v4 |
| Forms | React Hook Form | Latest |
| Validation | Zod | Latest |
| HTTP client | Axios | Latest |
| WebSocket | socket.io-client | Latest |
| Charts | Recharts | Latest |
| Date utilities | date-fns | Latest |

**Strictly forbidden substitutions:**

- Do not use `fetch()` directly — use Axios through the shared instance in `src/lib/axios.ts`
- Do not use Redux, MobX, Jotai, or any other state library — only Zustand
- Do not use `moment.js` — only `date-fns`
- Do not use any chart library other than Recharts
- Do not use any UI component library other than shadcn/ui
- Do not use `React.useState` for server data — that is TanStack Query's job

---

## 4. Project Structure

The folder structure below is mandatory. Every file must live exactly where shown.
Do not create new top-level folders in `src/` without updating this file.

```
src/
│
├── api/                        # All Axios API functions. One file per domain. No React here.
│   ├── auth.api.ts
│   ├── broker.api.ts
│   ├── market.api.ts
│   ├── sector.api.ts
│   ├── watchlist.api.ts
│   ├── trades.api.ts
│   ├── orders.api.ts
│   └── analytics.api.ts
│
├── components/
│   ├── ui/                     # shadcn/ui generated components. Never edit these manually.
│   ├── layout/                 # AppShell, Sidebar, TopStatusBar, MobileNav
│   ├── market/                 # MarketStatusBadge, NiftyTicker
│   ├── sector/                 # SectorBadge, SectorTable, SectorRow
│   ├── trades/                 # StateChip, LivePrice, VolumeRatioCell, ConfirmationTimer,
│   │                           # TradeCard, PnLSparkline, TradeLogDrawer, ForceExitModal
│   ├── watchlist/              # WatchlistUploadModal, WatchlistRow
│   ├── orders/                 # OrderStatusBadge, OrderRow
│   ├── charts/                 # EquityCurveChart, PnLDistributionChart, ExitReasonPieChart
│   └── shared/                 # PageError, PageSkeleton, EmptyState, ConfirmDialog, StatCard
│
├── hooks/
│   ├── useWebSocket.ts         # Central WS connection. Called once in AppShell only.
│   ├── useMarketStatus.ts
│   ├── useSectors.ts
│   ├── useTrackedStocks.ts
│   ├── useInvestedStocks.ts
│   ├── useOrders.ts
│   └── useAuth.ts
│
├── stores/
│   ├── auth.store.ts           # User + access token
│   ├── ws.store.ts             # WS connection status + all live tick data
│   └── ui.store.ts             # Sidebar open/closed, active modals
│
├── types/
│   ├── trade.types.ts          # All trading domain types
│   ├── market.types.ts
│   ├── order.types.ts
│   └── auth.types.ts
│
├── lib/
│   ├── axios.ts                # Single Axios instance with interceptors
│   ├── socket.ts               # socket.io singleton
│   ├── queryClient.ts          # TanStack Query client config
│   └── formatters.ts           # All number/date/color formatter functions
│
├── constants/
│   ├── app.ts                  # API URLs, WS namespace, thresholds
│   └── routes.ts               # All route path strings
│
└── pages/
    ├── Login.tsx
    ├── Dashboard.tsx
    ├── SectorDashboard.tsx
    ├── TrackedStocks.tsx
    ├── InvestedStocks.tsx
    ├── OrderBook.tsx
    ├── Analytics.tsx
    ├── Logs.tsx
    └── Settings.tsx
```

---

## 5. Naming Conventions

These rules apply to every file without exception.

| Item | Convention | Example |
|---|---|---|
| Component files | PascalCase | `TradeCard.tsx`, `SectorBadge.tsx` |
| Hook files | camelCase, prefix `use` | `useTrackedStocks.ts` |
| Store files | camelCase, suffix `.store` | `ws.store.ts` |
| API files | camelCase, suffix `.api` | `trades.api.ts` |
| Type files | camelCase, suffix `.types` | `trade.types.ts` |
| Lib/util files | camelCase | `formatters.ts`, `axios.ts` |
| Constant files | camelCase | `app.ts`, `routes.ts` |
| CSS classes | Tailwind utility only, no custom class names unless from shadcn |
| Variables | camelCase | `volumeRatio`, `entryPrice` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_TRADES`, `VOLUME_RATIO_STRONG` |
| TypeScript interfaces | PascalCase, no `I` prefix | `TrackedStock`, `MarketMetrics` |
| TypeScript enums / union types | PascalCase | `TradeState`, `SectorStatus` |
| Props interfaces | ComponentName + `Props` | `TradeCardProps`, `SectorBadgeProps` |

---

## 6. shadcn/ui — Mandatory Component Rules

### 6.1 Core Rule

**Always use a shadcn/ui component if one exists for the job. Never build from scratch what shadcn already provides.**

Before building any UI element, check this list first:

| UI need | Use this shadcn component |
|---|---|
| Any button | `Button` |
| Text input | `Input` |
| Number input | `Input` with `type="number"` |
| Dropdown select | `Select` |
| Multi-select or combobox | `Command` + `Popover` |
| Modal / dialog | `Dialog` |
| Confirmation dialog | `AlertDialog` |
| Slide-in panel | `Sheet` |
| Tabs | `Tabs` |
| Badge / chip | `Badge` |
| Tooltip | `Tooltip` |
| Table | `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` |
| Form field with label + error | `Form`, `FormField`, `FormItem`, `FormLabel`, `FormMessage` |
| Loading spinner | `Skeleton` (not a spinner — use skeleton for page loads) |
| Toast notification | `Sonner` (or shadcn `Toast`) |
| Popover / floating panel | `Popover` |
| Toggle switch | `Switch` |
| Checkbox | `Checkbox` |
| Radio group | `RadioGroup` |
| Date picker | `Calendar` + `Popover` |
| Separator / divider | `Separator` |
| Card container | `Card`, `CardHeader`, `CardContent`, `CardFooter` |
| Dropdown menu | `DropdownMenu` |
| Context menu | `ContextMenu` |
| Progress bar | `Progress` |
| Accordion | `Accordion` |
| Scroll area with custom scrollbar | `ScrollArea` |
| Avatar | `Avatar` |

### 6.2 Component Customization Rules

- Customize shadcn components using the `className` prop with Tailwind utilities.
- Do not edit the generated files inside `src/components/ui/` directly unless you are changing the base variant in `cva`.
- Use `cn()` utility from `src/lib/utils.ts` (auto-generated by shadcn) to merge class names.
- Never inline `style={{}}` props. Use Tailwind classes.

### 6.3 Form Rules

Every form in the application must use `react-hook-form` + `Zod` + shadcn `Form` components together. No exceptions.

Pattern for every form field:
```tsx
<FormField
  control={form.control}
  name="entry_price"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Entry price</FormLabel>
      <FormControl>
        <Input type="number" placeholder="310.00" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### 6.4 Dialog / Sheet Rules

- All modals use shadcn `Dialog`.
- All slide-in drawers (trade logs, mobile nav) use shadcn `Sheet`.
- Never use `position: fixed` divs built from scratch for overlays.
- All destructive confirmation dialogs (force exit, delete watchlist item) use shadcn `AlertDialog`.

### 6.5 Table Rules

- All data tables use shadcn `Table` components.
- Add `overflow-x-auto` wrapper on mobile for horizontal scroll — never truncate column data.
- Column headers are sortable where specified. Use a local `useState` for sort state, not URL params.

---

## 7. Mobile-First Rules

**Every screen and every component must be fully usable on a 375px viewport.**
This is not a nice-to-have. It is a hard requirement. Build mobile layout first, then add desktop enhancements.

### 7.1 Breakpoint Usage

Always use Tailwind's mobile-first breakpoints:

```
Default (no prefix) = mobile (≥ 0px)
sm:                  = ≥ 640px
md:                  = ≥ 768px
lg:                  = ≥ 1024px
xl:                  = ≥ 1280px
```

Write styles for mobile first, then override for larger screens:
```tsx
// Correct — mobile first
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

// Wrong — desktop first
<div className="grid grid-cols-4 gap-3">
```

### 7.2 Navigation — Mobile vs Desktop

**Desktop (md and above):** Fixed left sidebar, always visible, width 240px.

**Mobile (below md):** 
- Sidebar is hidden.
- Bottom navigation bar is shown with icons for the 5 most important routes: Dashboard, Tracked, Invested, Orders, Settings.
- Use shadcn `Sheet` for the full menu accessible via a hamburger icon in the top bar.

Implementation: `AppShell` renders both sidebar and bottom nav. Bottom nav is `md:hidden`. Sidebar is `hidden md:flex`.

### 7.3 Tables on Mobile

Every data table must be wrapped in `<ScrollArea className="w-full">` with `overflow-x-auto` so it scrolls horizontally. Never hide columns on mobile by default — let the user scroll.

Exception: on the Invested Stocks screen, switch from table view to card view on mobile. Cards are the default on mobile, table is the default on desktop.

### 7.4 Cards vs Tables

| Screen | Mobile layout | Desktop layout |
|---|---|---|
| Sector Dashboard | Scrollable cards, one per sector | Full-width sortable table |
| Tracked Stocks | Stacked rows, each stock as a card | Full-width table |
| Invested Stocks | Trade cards, 1 column | 2-column card grid or table toggle |
| Order Book | Paginated cards | Full-width table |
| Logs | Stacked log entries | Same — logs are already list-style |
| Analytics | Charts stacked vertically | 2-column grid |
| Dashboard | Summary stats stacked | 4-column stats row |

### 7.5 Touch Targets

All interactive elements (buttons, table rows, badge chips, close icons) must have a minimum touch target of **44×44px**. Use `min-h-11 min-w-11` Tailwind classes on small buttons.

### 7.6 Top Status Bar on Mobile

On mobile, the top status bar shows only: connection dot, market status, and clock.
P&L and trade count are hidden on mobile (available on Dashboard page instead).

### 7.7 Modals on Mobile

All shadcn `Dialog` components must use full-screen layout on mobile:
```tsx
<DialogContent className="sm:max-w-lg max-w-full h-full sm:h-auto rounded-none sm:rounded-lg">
```

All shadcn `Sheet` components for drawers must use `side="bottom"` on mobile, `side="right"` on desktop:
```tsx
// Use a hook or breakpoint check to determine side
const isMobile = useMediaQuery('(max-width: 767px)')
<Sheet>
  <SheetContent side={isMobile ? 'bottom' : 'right'} className="sm:max-w-md">
```

---

## 8. TypeScript Rules

- `strict: true` is enabled in `tsconfig.json`. No exceptions.
- No `any` type anywhere. If you do not know the type, use `unknown` and narrow it.
- No `// @ts-ignore` or `// @ts-expect-error` comments.
- All component props must have an explicit interface. No inline prop types on exported components.
- All API response shapes must be typed. Define the shape in `src/types/` before writing the API call.
- All Zustand stores must be typed with an explicit interface.
- All Zod schemas must be paired with a `z.infer<typeof schema>` type export.

```typescript
// Pattern for every Zod schema
export const watchlistRowSchema = z.object({
  stock_code: z.string().min(2).max(20),
  entry_price: z.number().positive(),
  stop_loss: z.number().positive(),
  target_1: z.number().positive(),
  target_mode: z.enum(['FIXED', 'PARTIAL_TRAIL', 'DYNAMIC_TRAIL']),
  step_percent: z.number().min(0.5).max(20).optional(),
}).refine(d => d.stop_loss < d.entry_price, {
  message: 'Stop loss must be below entry price',
  path: ['stop_loss'],
})

// Always export the inferred type alongside the schema
export type WatchlistRow = z.infer<typeof watchlistRowSchema>
```

---

## 9. State Management Architecture

There are two types of state in this application. They must never be mixed.

### 9.1 Server State — TanStack Query

Use TanStack Query for any data that lives on the backend and needs to be fetched, cached, or mutated.

| Data | Query key | Refresh interval |
|---|---|---|
| Sector metrics | `['sectors']` | 5 minutes |
| Tracked stocks | `['tracked']` | 5 minutes |
| Invested positions (initial load) | `['invested']` | On WS event only |
| Today's trade summary | `['summary', 'today']` | 60 seconds |
| Orders | `['orders', { page, date, status }]` | On WS event only |
| Alerts | `['alerts']` | On WS event only |
| Analytics summary | `['analytics', 'summary', period]` | Manual only |
| P&L history | `['analytics', 'pnl', period]` | Manual only |
| Logs | `['logs', { page, type, stock_code }]` | On WS event for live tail |
| Settings | `['settings']` | Manual only |

`refetchOnWindowFocus` is set to `false` globally. This is a live dashboard — unexpected refetches confuse users.

### 9.2 Client State — Zustand

Use Zustand for UI state and real-time tick data that comes from WebSocket.

**`auth.store.ts`** — `user`, `accessToken`, `isAuthenticated`

**`ws.store.ts`** — The most critical store:
```typescript
interface WSStore {
  // Connection
  status: 'connected' | 'reconnecting' | 'disconnected'

  // Per-stock tick data — keyed by stock_code
  // Updated by WS 'stock:tick' event
  ticks: Record<string, StockTick>

  // Per-position live P&L — keyed by trade_id
  // Updated by WS 'position:pnl' event
  positionUpdates: Record<string, PositionUpdate>

  // Market-level data
  // Updated by WS 'market:update' event
  marketData: MarketMetrics | null

  // Pending alerts for toast display
  alerts: Alert[]
}
```

**`ui.store.ts`** — `sidebarOpen`, `activeDrawerTradeId`, `activeModal`

### 9.3 The Hybrid Pattern — Critical

For the Invested Stocks screen, data flows in two layers:

1. **Initial data** — fetched once via TanStack Query `['invested']`. This gives you entry price, stop loss, holding days, target, all static trade info.
2. **Live updates** — pushed every second via WS `position:pnl` event into `ws.store.positionUpdates[trade_id]`.

In the `TradeCard` component:
```typescript
function TradeCard({ position }: { position: InvestedStock }) {
  // Layer 1: static data from TanStack Query (passed as prop)
  // Layer 2: live data from WS store (read directly)
  const liveUpdate = useWSStore(s => s.positionUpdates[position.trade_id])

  // Always prefer live data when available, fall back to static
  const displayPnl = liveUpdate?.pnl_pct ?? position.pnl_pct
  const displayPrice = liveUpdate?.current_price ?? position.current_price
  const displaySL = liveUpdate?.stop_loss ?? position.stop_loss
}
```

This pattern means the P&L card never triggers a network request on every price update. It only reads from memory.

### 9.4 WS Store Selectors — Preventing Re-renders

When reading tick data for a single stock, always use a selector that returns only that stock's data:

```typescript
// Wrong — re-renders on ANY stock tick update
const ticks = useWSStore(s => s.ticks)
const myTick = ticks[stock_code]

// Correct — re-renders only when THIS stock's tick changes
const tick = useWSStore(s => s.ticks[stock_code])
```

---

## 10. API Layer Rules

### 10.1 Axios Instance

There is one and only one Axios instance in the entire app. It lives at `src/lib/axios.ts`.
All API functions import `api` from this file. Direct `axios.create()` calls elsewhere are forbidden.

The instance handles:
- Base URL from `VITE_API_URL` env variable
- `Authorization: Bearer <token>` header injection on every request
- Automatic token refresh on 401 (retry once, then redirect to login)
- 10-second timeout on every request

### 10.2 API Function Rules

- API functions are plain `async` functions that return typed data. They are not hooks.
- Every API function must return a typed response, not `any`.
- API functions throw errors — they do not catch them. TanStack Query handles error states.
- One file per domain. No cross-domain imports between API files.

```typescript
// Correct
export const fetchTrackedStocks = (): Promise<TrackedStock[]> =>
  api.get('/api/watchlist/tracked').then(r => r.data)

// Wrong — returning any, catching errors internally
export const fetchTrackedStocks = async () => {
  try {
    const res = await api.get('/api/watchlist/tracked')
    return res.data
  } catch (e) {
    return []
  }
}
```

### 10.3 Mutation Pattern

All data mutations use TanStack Query `useMutation`. Always invalidate the relevant query on success.

```typescript
const removeMutation = useMutation({
  mutationFn: (stock_code: string) => removeFromWatchlist(stock_code),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tracked'] })
    toast.success('Stock removed from watchlist')
  },
  onError: () => {
    toast.error('Failed to remove stock. Please try again.')
  },
})
```

---

## 11. WebSocket Rules

### 11.1 Connection Lifecycle

- `useWebSocket()` is called **exactly once**, inside `AppShell.tsx`.
- It is never called in any page or child component.
- The socket connects when AppShell mounts (after authentication).
- The socket disconnects when AppShell unmounts (on logout).

### 11.2 Event → Store Mapping

Every WS event has exactly one handler that writes to exactly one store:

| WS event | Handler action |
|---|---|
| `stock:tick` | `wsStore.updateTick(data)` |
| `position:pnl` | `wsStore.updatePosition(data)` |
| `market:update` | `wsStore.setMarketData(data)` |
| `sector:update` | `queryClient.setQueryData(['sectors'], updater)` |
| `alert:new` | `wsStore.addAlert(data)` + `toast()` |
| `trade:state_change` | `queryClient.invalidateQueries(['invested'])` + `queryClient.invalidateQueries(['tracked'])` |
| `order:update` | `queryClient.invalidateQueries(['orders'])` |
| `connect` | `wsStore.setStatus('connected')` + `queryClient.invalidateQueries()` |
| `disconnect` | `wsStore.setStatus('disconnected')` |
| `reconnect_attempt` | `wsStore.setStatus('reconnecting')` |

### 11.3 Reconnection Rules

- socket.io handles reconnection automatically with exponential backoff.
- On reconnect (`connect` event fires again): invalidate all TanStack Query cache so fresh data is fetched.
- Show a stale data warning banner when `ws.store.status !== 'connected'` for more than 30 seconds.

### 11.4 What WebSocket Is NOT Used For

- Do not send any trade commands over WebSocket. All mutations go through REST API.
- Do not send auth credentials over WebSocket beyond the initial handshake token.

---

## 12. Number & Data Formatting

**All formatting must use the functions from `src/lib/formatters.ts`. Never format numbers inline in JSX.**

### 12.1 Formatter Functions (implement all of these)

```typescript
// Price in Indian Rupees — always 2 decimal places
formatPrice(2450)        // → "₹2,450.00"

// Percentage — always signed, always 2 decimal places
formatPct(4.94)          // → "+4.94%"
formatPct(-2.10)         // → "-2.10%"

// Volume in Indian lakh/crore shorthand
formatVolume(1250000)    // → "12.5L"
formatVolume(19000000)   // → "1.9Cr"
formatVolume(950000)     // → "9.5L"

// Volume ratio — 2 decimal places with 'x' suffix
formatVolumeRatio(1.82)  // → "1.82x"

// Holding days
formatDays(1)            // → "1d"
formatDays(7)            // → "7d"

// Date/time — relative for recent, absolute for older
formatTime('2024-01-15T14:32:05') // → "14:32:05" (if today)
formatTime('2024-01-14T14:32:05') // → "14 Jan 14:32" (if not today)
```

### 12.2 Color Functions (return Tailwind class strings)

```typescript
// Returns text color class based on positive/negative
colorForPct(4.94)   // → "text-emerald-500"
colorForPct(-2.10)  // → "text-red-500"
colorForPct(0)      // → "text-muted-foreground"

// Returns text color class based on volume ratio thresholds
colorForVolumeRatio(2.0)   // → "text-emerald-500"  (>= 2.0 very strong)
colorForVolumeRatio(1.8)   // → "text-emerald-500"  (>= 1.5 strong)
colorForVolumeRatio(1.3)   // → "text-amber-500"    (>= 1.2 normal)
colorForVolumeRatio(1.0)   // → "text-red-500"      (< 1.2 weak)

// Returns full badge class string for status values
colorForStatus('STRONG')   // → "bg-emerald-950 text-emerald-400 border border-emerald-800"
colorForStatus('NEUTRAL')  // → "bg-amber-950 text-amber-400 border border-amber-800"
colorForStatus('WEAK')     // → "bg-red-950 text-red-400 border border-red-800"
colorForStatus('READY')    // → "bg-emerald-950 text-emerald-300 border border-emerald-700"
colorForStatus('BLOCKED')  // → "bg-red-950 text-red-400 border border-red-800"
colorForStatus('ACTIVE')   // → "bg-blue-950 text-blue-400 border border-blue-800"
colorForStatus('TRAILING') // → "bg-emerald-950 text-emerald-300 border border-emerald-700"
```

---

## 13. Business Domain Rules

These rules come directly from the trading SOP. Frontend must enforce them visually and logically.

### 13.1 Volume Ratio Thresholds

These exact thresholds must be used in all UI coloring and labeling. They are defined in `src/constants/app.ts`.

| Volume ratio | Label | Color |
|---|---|---|
| `< 1.2` | Weak — reject | `text-red-500` |
| `1.2 – 1.49` | Normal — watch only | `text-amber-500` |
| `>= 1.5` | Strong — entry allowed | `text-emerald-500` |
| `>= 2.0` | Very strong | `text-emerald-400` (brighter) |

### 13.2 Market Status Display Rules

| Market status | Badge color | System behavior shown in UI |
|---|---|---|
| STRONG | Green | Normal trades allowed — no warning |
| NEUTRAL | Amber | Selective trades — show amber indicator |
| WEAK | Red | New entries blocked — show red warning banner on Tracked Stocks screen |

When `market_status = WEAK`, display a red banner at the top of the Tracked Stocks screen:
```
⚠ Market is WEAK — new entries blocked. Weak-market exception applies to stocks with outperformance ≥ 1.0% and volume ratio ≥ 1.5 only.
```

### 13.3 Trade State Machine — Visual States

The full state machine must be represented visually on the Invested Stocks detail view as a horizontal step tracker:

```
[NEW] → [WAITING_CONFIRMATION] → [READY] → [ORDER_PLACED] → [ACTIVE] → [TRAILING] → [EXIT_TRIGGERED] → [CLOSED]
```

- Current state: full color highlight
- Past states: muted/gray
- Future states: empty/outline
- `BLOCKED` and `FAILED` are shown as a red branch off `ORDER_PLACED`

### 13.4 Stop Loss Display Rules

- Stop loss value is always shown in the `TradeCard`.
- When stop loss has been moved to entry price (no-loss zone): display a green label "No-loss zone" next to the stop loss value.
- When stop loss was recently updated (within last 60 seconds, driven by WS): briefly animate the SL value with an amber highlight for 1 second.

### 13.5 Weak Market Exception Display

On the Tracked Stocks screen, when a stock passes the weak-market exception, show it with:
- `(50% qty)` label next to the `READY` status chip
- A tooltip explaining: "Weak market exception — order will be placed at 50% of normal quantity"

### 13.6 Confirmation Timer

When `entry_status = WAITING_CONFIRMATION`, show a countdown timer in MM:SS format.
The `seconds_remaining` value comes from the API. Frontend counts down locally every second.
If the timer reaches 0 and status has not changed to READY, trigger a query refetch for that stock.

### 13.7 P&L Color Logic

P&L percentage and absolute value must always be colored:
- Positive P&L: `text-emerald-500`, prefix `+`
- Negative P&L: `text-red-500`, prefix `-` (already in value)
- Zero: `text-muted-foreground`

### 13.8 Maximum Simultaneous Trades

The system allows maximum 10 simultaneous active trades. The top status bar shows `Active: X/10`.
When `X = 10`, the available slot count shows in red: `Active: 10/10` with `text-red-500`.

---

## 14. Screen-by-Screen Instructions

### 14.1 Login (`/login`)

- Full-page centered layout, no sidebar.
- shadcn `Card` with application name, email `Input`, password `Input`, `Button`.
- `react-hook-form` + Zod validation. Show `FormMessage` for field errors.
- On submit: `POST /api/auth/login`. Store token in auth store. Store refresh token in `localStorage`. Navigate to `/dashboard`.
- On error: show error message using shadcn `toast.error()`.
- No "remember me", no social login for v1.

---

### 14.2 Dashboard (`/dashboard`)

**Purpose:** At-a-glance system health. First screen the user sees every session.

**Desktop layout:** 4-column summary row, then 2-column grid (P&L chart left, active positions strip right), then alerts panel.

**Mobile layout:** All sections stacked vertically, full-width.

**Sections:**

**A. Summary Stats Row** — 4 `StatCard` components:
- Active Trades (live count from `['invested']` query)
- Today's Entries (from `['summary', 'today']`)
- Today's Exits (from `['summary', 'today']`)
- Available Slots (10 − active count)
- Available Slots card shows `text-red-500` when 0 slots remain

**B. P&L Chart** — Recharts `AreaChart`
- Period toggle: Today / 30D — stored in local `useState`
- Data from `fetchPnLHistory(period)`
- X-axis: time for today, date for 30D
- Area fill and stroke color dynamically set based on whether total P&L is positive or negative
- No legend, no tooltip on mobile (too small)

**C. Active Positions Strip** — Horizontal `ScrollArea` on desktop, vertical stack on mobile
- Each position shown as a compact mini-card: stock code, entry, LTP, P&L %
- LTP and P&L from `ws.store.positionUpdates` (live, no polling)
- Clicking a card navigates to `/invested` with that trade highlighted

**D. Recent Alerts** — Last 10 unread alerts from `['alerts']`
- Each alert has type badge, message, time, and "Mark seen" button
- "Mark all seen" button at top right

---

### 14.3 Sector Dashboard (`/sectors`)

**Purpose:** Rank all sectors by strength. User picks top 2–3 sectors to focus on daily.

**Desktop:** Full-width sortable shadcn `Table`.

**Mobile:** Stacked shadcn `Card` components, one per sector. Each card shows: rank, sector name, outperformance, breadth, status badge.

**Table columns (desktop):**

| Column | Format | Sortable | Notes |
|---|---|---|---|
| Rank | Number | Default sort ascending | |
| Sector name | Plain text | No | |
| Sector return % | `formatPct()` + `colorForPct()` | Yes | |
| Market return % | `formatPct()` + `colorForPct()` | Yes | |
| Outperformance % | `formatPct()` + bold if >= 1.0% | Yes | Key column — highlight |
| Breadth % | Number + inline progress bar | Yes | |
| Avg vol ratio | `formatVolumeRatio()` + `colorForVolumeRatio()` | Yes | |
| Status | `<SectorBadge />` | Yes | |
| Stocks | Count | No | |

**Top 2 rows** (rank 1 and 2): add a subtle `border-l-2 border-emerald-600` to highlight the best sectors.

**Inline breadth progress bar:**
```tsx
<div className="flex items-center gap-2">
  <span className="font-mono text-sm">{value.toFixed(0)}%</span>
  <Progress value={value} className="w-14 h-1.5" />
</div>
```

**Row click:** Expand inline using shadcn `Accordion` to show the top 5 constituent stocks with their `price_change_pct` and `volume_ratio`.

**Data refresh:** TanStack Query `refetchInterval: 5 * 60 * 1000`. WS `sector:update` patches a single row in the query cache without full refetch.

**Last updated:** Show `formatTime(updated_at)` above the table.

---

### 14.4 Tracked Stocks (`/tracked`)

**Purpose:** Show all watchlisted stocks and their entry readiness status.

**Desktop:** Full-width shadcn `Table` with READY stocks pinned to top.

**Mobile:** Stack of compact cards. Each card shows: stock code, LTP (live), entry price, volume ratio, status chip.

**Alert banner when market is WEAK:** Full-width red `Alert` (shadcn) at top of page.

**Filter bar:**
- Shadcn `Tabs` for status filter: All / READY / WAITING / BLOCKED
- shadcn `Select` for sector filter
- Both stored in local `useState`

**Table columns:**

| Column | Component | Notes |
|---|---|---|
| Stock code | Plain text, bold | |
| LTP | `<LivePrice stock_code={...} />` | Live from WS |
| Entry price | `formatPrice()` | Static |
| Above entry? | Green check / red cross icon | Derived from ltp > entry_price |
| Volume ratio | `<VolumeRatioCell ratio={...} />` | Live from WS |
| Sector status | `<SectorBadge />` | |
| Market status | `<MarketStatusBadge />` | |
| Timer | `<ConfirmationTimer />` | Only shows when WAITING_CONFIRMATION |
| Entry status | `<StateChip />` | |
| Actions | Remove button (shadcn `Button` size="sm" variant="ghost") | |

**Upload button:** Top right, shadcn `Button`. Opens `<WatchlistUploadModal>`.

---

### 14.5 Invested Stocks (`/invested`)

**Purpose:** Real-time monitoring of all active trades. Most critical screen.

**Desktop:** 2-column `TradeCard` grid. Toggle to table view via a `Button` with icon in top right.

**Mobile:** Single column `TradeCard` stack. No table view on mobile.

**Data architecture:** Initial load from TanStack Query `['invested']`. Live P&L from `ws.store.positionUpdates`. Never poll for live values.

**`TradeCard` contents:**

```
┌─────────────────────────────────┐
│ RELIANCE            [TRAILING]  │  ← stock code (bold, mono) + StateChip
├─────────────────────────────────┤
│ Entry: ₹2,450.00               │
│ Current: ₹2,571.00  +4.94%  ▲  │  ← current price (LivePrice) + P&L colored
│ Stop Loss: ₹2,450.00  [No-loss] │  ← SL + no-loss badge if SL = entry
│ Target: ₹2,700.00              │
├─────────────────────────────────┤
│ Holding: 3d    Vol: 1.82x      │
│ Sector: IT [STRONG]            │
│ [sparkline chart]              │
├─────────────────────────────────┤
│ [View Logs]    [Force Exit]     │
└─────────────────────────────────┘
```

- `[View Logs]`: shadcn `Button` variant="outline" → opens `<TradeLogDrawer>`
- `[Force Exit]`: shadcn `Button` variant="destructive" → opens `<ForceExitModal>`
- Sparkline: Recharts `LineChart` 80×24px, no axes, no tooltip on mobile

**EXIT_TRIGGERED state:** Overlay the card with a semi-transparent banner:
```
EXIT TRIGGERED: STOP_LOSS_HIT
Sell order placed — awaiting fill
```
Use shadcn `Badge` variant="destructive" for the exit reason label.

---

### 14.6 Order Book (`/orders`)

**Purpose:** Complete audit trail of all broker orders.

**Desktop:** Paginated shadcn `Table`.

**Mobile:** Paginated stack of `Card` components, each showing key fields.

**Filters:**
- shadcn `Select` for status (ALL / REQUESTED / FILLED / PARTIAL / FAILED / CANCELLED)
- shadcn `Select` for side (ALL / BUY / SELL)
- shadcn `Calendar` + `Popover` for date — defaults to today

**Table columns:** Time, Stock, Side, Requested qty, Filled qty, Status badge, Broker order ID, Actions

**Row expand:** Click row → show raw broker JSON response in a shadcn `Accordion` below the row. Format JSON with syntax highlighting using a monospaced `<pre>` block.

**Export:** shadcn `Button` variant="outline" top right. Links to `GET /api/orders/export?format=csv` with `download` attribute.

**Pagination:** shadcn `Pagination` component. 50 rows per page. Server-side pagination.

---

### 14.7 Logs (`/logs`)

**Purpose:** Full system event log. Terminal-style interface.

**Layout:** Full width, same on mobile and desktop.

**Filters:** Log type `Select` + stock code `Input` + date range

**Log entry layout:**
```
[14:32:05]  TRADE   RELIANCE   SL moved to entry price ₹2,450.00
```

Color per log type:
- `TRADE` → `text-blue-400`
- `ORDER` → `text-emerald-400`
- `SIGNAL` → `text-amber-400`
- `SYSTEM` → `text-muted-foreground`
- `ERROR` → `text-red-400`

**Live tail toggle:** shadcn `Switch` labeled "Live tail". When ON, WS `log:new` event appends to local list. Auto-scroll to bottom using `useRef` on the scroll container.

**Pagination:** 50 per page. Infinite scroll or traditional pagination — developer's choice.

---

### 14.8 Analytics (`/analytics`)

**Purpose:** Historical performance reporting.

**Period selector:** shadcn `Tabs` — 7D / 30D / 90D / All. Stored in local `useState`. Changes trigger new TanStack Query fetch for all sections.

**Desktop:** 2-column grid for charts. **Mobile:** All charts stacked vertically.

**Sections:**

A. Summary stats — 6 `StatCard` components: Win Rate, Avg P&L, Best Trade, Worst Trade, Total Trades, Gross P&L

B. Equity curve — Recharts `AreaChart`, full-width, dynamic color based on final value

C. P&L distribution — Recharts `BarChart`, buckets: < -10%, -10 to -5%, -5 to 0%, 0 to 5%, 5 to 10%, > 10%

D. Exit reason breakdown — Recharts `PieChart` with custom legend. Exit reasons: SL Hit, Target Hit, Time Exit, Volume Weakness, Sector Weakness, Manual Exit

E. Sector performance — shadcn `Table` with sector name, total trades, win rate, avg P&L

---

### 14.9 Settings (`/settings`)

**Purpose:** System configuration. Four independent sections.

Each section uses `react-hook-form` + Zod + shadcn `Form`. Each section saves independently via its own `useMutation`.

**Section A — Broker Connection:**
- API Key `Input` with show/hide toggle (eye icon)
- Secret `Input` with show/hide toggle
- shadcn `Button` "Test connection" — `GET /api/broker/status`
- Status indicator: green/red dot with last authenticated time

**Section B — Risk Configuration:**
- Capital per trade: `Input` type number
- Max simultaneous trades: `Input` type number (max 10 enforced by Zod)
- Weak market exception: shadcn `Switch`
- Force exit on WEAK market: shadcn `Switch`
- Cooldown period (hours): `Input` type number

**Section C — Strategy Selection:**
- Model 1 vs Model 2: shadcn `RadioGroup`
- Conditional form fields appear based on selection using `watch()` from react-hook-form
- Model 1 fields: Fixed target %, Stop loss %, Time-based exit days
- Model 2 fields: Step percent, Initial SL %, Partial exit at %, Partial exit qty %

**Section D — Notifications:**
- 4 shadcn `Switch` toggles: Exit Alert, Entry Signal, Order Failed, SL Moved

**Layout:** shadcn `Separator` between sections. Each section has its own "Save" `Button` that shows a loading state while the mutation is pending.

---

## 15. Shared Component Specifications

### 15.1 `StateChip`

Renders a trade state as a styled badge.

```tsx
interface StateChipProps {
  status: TradeState
  showPulse?: boolean   // defaults to true for READY and TRAILING
  size?: 'sm' | 'md'   // defaults to 'sm'
}
```

Uses shadcn `Badge`. Custom className from `colorForStatus()`. READY and TRAILING states get CSS `animate-pulse` class. Use `cn()` to merge classes.

### 15.2 `LivePrice`

Renders a price that updates from WS tick data with a brief color flash on change.

```tsx
interface LivePriceProps {
  stock_code: string
  fallback: number
  className?: string
}
```

Reads from `useWSStore(s => s.ticks[stock_code])`. Uses `useRef` to track previous value. On change: sets flash state (`'up' | 'down' | null`). Flash lasts 500ms via `setTimeout`. During flash: `text-emerald-400` for up, `text-red-400` for down. After flash: `text-foreground`. Always `font-mono`.

### 15.3 `SectorBadge`

```tsx
interface SectorBadgeProps {
  status: SectorStatus
  size?: 'sm' | 'md'
}
```

Uses shadcn `Badge` with custom `className` from `colorForStatus()`. VERY_STRONG adds a subtle `animate-pulse` to indicate exceptional sector strength.

### 15.4 `VolumeRatioCell`

```tsx
interface VolumeRatioCellProps {
  ratio: number
  showLabel?: boolean   // defaults to true
}
```

Shows `formatVolumeRatio(ratio)` colored by `colorForVolumeRatio()`. Below that, a small label: "Very strong" / "Strong" / "Normal" / "Weak" in `text-xs text-muted-foreground`. Label can be hidden with `showLabel={false}` for compact table views.

### 15.5 `ConfirmationTimer`

```tsx
interface ConfirmationTimerProps {
  seconds_remaining: number
  onExpire: () => void   // called when timer hits 0
}
```

Uses `useEffect` with `setInterval(1000)`. Displays `MM:SS` in amber `font-mono`. When `seconds_remaining <= 30`, color changes to `text-red-400` to create urgency.

### 15.6 `PnLSparkline`

```tsx
interface PnLSparklineProps {
  data: number[]   // last 20 price points
  positive: boolean
}
```

Recharts `LineChart` 80px × 24px. No axes, no tooltip, no legend, no dot markers. Stroke color: `#10b981` if positive, `#ef4444` if negative. `strokeWidth={1.5}`. No fill.

### 15.7 `StatCard`

```tsx
interface StatCardProps {
  label: string
  value: string | number
  valueClassName?: string   // for applying color classes
  subLabel?: string
}
```

Uses shadcn `Card` with compact padding. Label in `text-xs text-muted-foreground uppercase tracking-wide`. Value in `text-2xl font-mono font-medium`. SubLabel in `text-xs text-muted-foreground`.

### 15.8 `EmptyState`

```tsx
interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}
```

Centered layout inside a shadcn `Card`. Uses shadcn `Button` for action.

### 15.9 `PageError`

```tsx
interface PageErrorProps {
  message?: string
  onRetry: () => void
}
```

Centered layout. Error icon. Message in `text-muted-foreground`. shadcn `Button` "Try again" calling `onRetry`.

### 15.10 `WatchlistUploadModal`

Full specification:

- shadcn `Dialog`
- Two-tab layout using shadcn `Tabs`: "Upload CSV" and "Add manually"
- **CSV tab:** shadcn drag-and-drop file input accepting `.csv` only. On file select: parse CSV client-side (comma-separated), show preview in shadcn `Table`. Validate each row against `watchlistRowSchema`. Show row-level errors inline.
- **Manual tab:** `react-hook-form` form with one row of fields: stock_code, entry_price, stop_loss, target_1, target_mode, step_percent. "Add row" button adds another row. Rows can be removed.
- **Submit button:** shadcn `Button` "Upload X stocks". Calls `POST /api/watchlist/upload` via `useMutation`.
- **Progress view:** After submit, shows a per-stock status list. Each stock shows: spinner (pending), green check (done), red x (failed). Polls `GET /api/watchlist/upload-status/:jobId` every 2 seconds.
- **Completion:** On all done, shows "X stocks ready" message. Auto-close after 3 seconds OR manual close.

### 15.11 `TradeLogDrawer`

- shadcn `Sheet` — `side="right"` on desktop, `side="bottom"` on mobile
- Header: Stock code + "Trade Logs"
- Content: `ScrollArea` with chronological log entries
- Data: TanStack Query `['logs', trade_id]` — fetches when drawer opens
- Log entry format: `[time] [type badge] message`
- Color-coded by log type (same as Logs page)

### 15.12 `ForceExitModal`

- shadcn `AlertDialog`
- Warning icon at top
- Message: "This will immediately place a market SELL order for all X shares."
- Input: shadcn `Input` — user must type "CONFIRM" exactly
- Confirm button: disabled until input matches "CONFIRM" exactly (case-sensitive)
- On confirm: `POST /api/trades/:id/force-exit` via `useMutation`
- Show loading state on button while mutation is pending
- On success: close modal + `toast.success()` + invalidate `['invested']`
- On error: show `toast.error()` — do not close modal

### 15.13 `MarketStatusBadge`

Reads from `useWSStore(s => s.marketData?.market_status)`. Returns a `StateChip`-style badge. When market is WEAK, badge pulses. Also shows Nifty change % next to the badge.

---

## 16. Build Order — Mandatory Sequence

Do not start a phase until all items in the previous phase are verified working.

### Phase 0 — Foundation (do not skip anything)
- [ ] Vite + React + TypeScript project initialized
- [ ] All npm packages installed (see section 3)
- [ ] Full folder structure created (see section 4)
- [ ] `src/constants/app.ts` — all thresholds, URLs, state machine values
- [ ] `src/constants/routes.ts` — all route path strings
- [ ] `src/types/` — all TypeScript interfaces defined (all 4 files complete)
- [ ] `.env.development` and `.env.production` with correct URLs
- [ ] shadcn/ui initialized (`npx shadcn@latest init`) with all required components added

### Phase 1 — Auth + Routing + API
- [ ] `src/lib/axios.ts` — instance + interceptors + token refresh logic
- [ ] `src/stores/auth.store.ts` — user, accessToken, isAuthenticated
- [ ] `src/lib/queryClient.ts` — TanStack Query config
- [ ] `src/lib/formatters.ts` — all formatter and color functions
- [ ] All 8 API files in `src/api/` with typed return values
- [ ] `src/pages/Login.tsx` — form + submit + token storage + redirect
- [ ] `src/App.tsx` — router + AuthGuard + lazy page imports
- [ ] **Verify:** login works, token stored, 401 auto-refreshes, redirect works

### Phase 2 — WebSocket + Real-time Infrastructure
- [ ] `src/lib/socket.ts` — socket.io singleton with auth
- [ ] `src/stores/ws.store.ts` — full store with all update functions
- [ ] `src/hooks/useWebSocket.ts` — all event bindings
- [ ] `src/stores/ui.store.ts`
- [ ] **Verify:** WS connects on login, ticks write to store, status updates correctly

### Phase 3 — App Shell + Layout
- [ ] `src/components/layout/AppShell.tsx` — calls `useWebSocket()` here only
- [ ] `src/components/layout/Sidebar.tsx` — desktop only, `hidden md:flex`
- [ ] `src/components/layout/TopStatusBar.tsx` — reads from ws.store
- [ ] `src/components/layout/MobileNav.tsx` — bottom nav, `md:hidden`
- [ ] Alert toast system inside AppShell driven by ws.store.alerts
- [ ] Stale data banner (shown when WS disconnected > 30s)
- [ ] Stub placeholder `<div>Page coming soon</div>` for all 8 routes
- [ ] **Verify:** sidebar shows on desktop, bottom nav shows on mobile, status bar updates live

### Phase 4 — Read-Only Screens
- [ ] `src/components/shared/` — `StatCard`, `EmptyState`, `PageError`, `PageSkeleton`
- [ ] `src/components/sector/SectorBadge.tsx`
- [ ] `src/components/market/MarketStatusBadge.tsx`
- [ ] `src/pages/SectorDashboard.tsx` — full table + mobile cards + WS patch
- [ ] `src/pages/Dashboard.tsx` — summary cards + P&L chart + positions strip + alerts
- [ ] **Verify:** sector table updates without page reload, dashboard stats are live

### Phase 5 — Trade Screens
- [ ] `src/components/trades/StateChip.tsx`
- [ ] `src/components/trades/LivePrice.tsx` — flash animation from WS
- [ ] `src/components/trades/VolumeRatioCell.tsx`
- [ ] `src/components/trades/ConfirmationTimer.tsx`
- [ ] `src/components/watchlist/WatchlistUploadModal.tsx`
- [ ] `src/pages/TrackedStocks.tsx` — filters + table + upload modal + weak market banner
- [ ] `src/components/trades/PnLSparkline.tsx`
- [ ] `src/components/trades/TradeLogDrawer.tsx`
- [ ] `src/components/trades/ForceExitModal.tsx`
- [ ] `src/components/trades/TradeCard.tsx` — hybrid WS + REST data
- [ ] `src/pages/InvestedStocks.tsx` — card grid + table toggle + card/table mobile switch
- [ ] **Verify:** P&L updates every second on invested screen without API calls

### Phase 6 — Secondary Screens
- [ ] `src/pages/OrderBook.tsx` — paginated table + mobile cards + filters + CSV export
- [ ] `src/pages/Logs.tsx` — terminal style + live tail + filters
- [ ] `src/pages/Analytics.tsx` — all 5 chart sections + period toggle
- [ ] **Verify:** all 8 routes fully functional on both desktop and mobile

### Phase 7 — Settings + Production Polish
- [ ] `src/pages/Settings.tsx` — 4 sections with independent save
- [ ] Error boundaries wrapping every page
- [ ] Loading skeletons for every page (use `PageSkeleton` component)
- [ ] Empty states for every list and table
- [ ] Route-level code splitting via `React.lazy` on all page imports
- [ ] `ForceExitModal` CONFIRM text gate verification
- [ ] Mobile viewport testing at 375px for all 8 screens
- [ ] TypeScript `tsc --noEmit` passes with zero errors
- [ ] **Final verify:** full trade lifecycle end-to-end in browser

---

## 17. Performance Rules

- **Tick data never triggers re-renders outside the component that uses it.** Use `useWSStore(s => s.ticks[stock_code])` per component, not `useWSStore(s => s.ticks)`.
- **P&L updates never trigger network requests.** They read from `ws.store.positionUpdates` only.
- **Never use `refetchInterval` below 30 seconds for any query.** WS handles anything faster than that.
- **All 8 page imports are lazy-loaded.** Use `React.lazy` + `Suspense` with a `PageSkeleton` fallback.
- **Large lists use `ScrollArea` with fixed height**, not unconstrained scroll that causes layout shift.
- **The order book and logs pages use server-side pagination.** Never load all records at once.
- **Recharts charts use `ResponsiveContainer`** so they resize correctly on orientation change.
- **Do not put `console.log` in production code.** Remove all debug logs before commit.

---

## 18. Error Handling Rules

### 18.1 Every Page Has an Error Boundary

```tsx
import { ErrorBoundary } from 'react-error-boundary'

<ErrorBoundary fallback={<PageError onRetry={() => window.location.reload()} />}>
  <SectorDashboard />
</ErrorBoundary>
```

### 18.2 Every Mutation Has `onError`

```tsx
const mutation = useMutation({
  mutationFn: someApiCall,
  onSuccess: () => toast.success('Done'),
  onError: (error) => {
    toast.error(error?.message ?? 'Something went wrong. Please try again.')
  },
})
```

### 18.3 Network Error Recovery

- If a query fails, TanStack Query retries twice automatically (configured in `queryClient.ts`).
- After 2 retries, `PageError` component shows with a "Try again" button that calls `refetch()`.

### 18.4 ForceExit Error Handling

The Force Exit modal must NOT close on error. It must stay open and show the error message so the user can retry. This is a safety-critical action.

### 18.5 WebSocket Disconnection

Show the stale data banner (amber, full-width) whenever `ws.store.status !== 'connected'` for more than 30 seconds. The banner reads:
```
⚠ Live data paused. Attempting to reconnect... Prices shown may be outdated.
```

---

## 19. What You Must Never Do

These rules are non-negotiable. If you find yourself doing any of the following, stop and re-read the relevant section.

| Forbidden action | Why | Correct approach |
|---|---|---|
| Use `fetch()` directly | Bypasses auth interceptor | Use `api` from `src/lib/axios.ts` |
| Build a custom modal from scratch | Inconsistent UX | Use shadcn `Dialog` or `AlertDialog` |
| Build custom form inputs from scratch | No validation integration | Use shadcn `Form` + `Input` + `react-hook-form` |
| Format numbers inline in JSX | Inconsistent formatting | Use functions from `formatters.ts` |
| Use any type | Hides bugs | Use specific types or `unknown` with narrowing |
| Call `useWebSocket()` from a page or component | Creates duplicate WS connections | Only call it in `AppShell.tsx` |
| Use `refetchInterval` < 30s for any query | Unnecessary load | WS handles anything faster |
| Read all ticks with `useWSStore(s => s.ticks)` | Causes mass re-renders | Use `useWSStore(s => s.ticks[stock_code])` |
| Hardcode hex colors | Breaks dark mode, breaks design system | Use Tailwind classes or CSS variables |
| Use `any` in a Zod schema | Defeats validation | Define the actual expected type |
| Poll for P&L updates | Hammers the API | Read from `ws.store.positionUpdates` |
| Use `localStorage` for sensitive data | Security risk | Access token stays in memory (Zustand) |
| Build without mobile layout | Breaks on phone | Build mobile-first, every component |
| Skip error boundary on a page | Crashes whole app on error | Every page wrapped in `ErrorBoundary` |
| Let `ForceExitModal` close on error | User loses ability to retry critical action | Keep modal open, show inline error |
| Use a UI library component that is not shadcn | Inconsistency | Always use shadcn equivalent |
| Import directly from `lucide-react` without size | Inconsistent icon sizes | Always pass `size={16}` or use className |

---

*End of FRONTEND_MASTER_INSTRUCTIONS.md*
*Version: 1.0 — update this file when any architectural decision changes.*
*Last updated: refer to git history.*
