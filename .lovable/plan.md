
# Collapsible Navigation Sidebar for Trading Pages

## Overview
Add a collapsible sidebar navigation menu with two options:
- **Manual** - Links to the main dashboard (/) with manual trading controls
- **Ladder** - Links to the Auto Trading page (/auto-trading) with the order book ladder

The sidebar will appear on both pages, providing consistent navigation between the two trading modes.

## Layout Structure
```text
+---+------------------------------------------+
| S |              HEADER                       |
| I +------------------------------------------+
| D |                                          |
| E |          PAGE CONTENT                    |
| B |     (Manual Trading OR Ladder)           |
| A |                                          |
| R |                                          |
+---+------------------------------------------+

Sidebar (expanded):        Sidebar (collapsed):
+----------------+         +----+
| [trigger icon] |         | [] |
+----------------+         +----+
| NAVIGATION     |         | M  |
| [icon] Manual  |         +----+
| [icon] Ladder  |         | L  |
+----------------+         +----+
```

## Implementation Steps

### 1. Create Shared Layout Component
**File:** `src/components/layout/TradingLayout.tsx` (new file)

A wrapper component used by both pages that provides:
- `SidebarProvider` wrapper
- Collapsible sidebar with navigation menu
- Header with `SidebarTrigger`
- Main content area for page content

```tsx
function TradingLayout({ children }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <TradingSidebar />
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
```

### 2. Create Navigation Sidebar Component
**File:** `src/components/layout/TradingSidebar.tsx` (new file)

Simple navigation sidebar with:
- Logo/brand header
- Two navigation items with icons
- Active state highlighting using `NavLink`
- Collapsed state shows icons with tooltips

Menu items:
| Label | Route | Icon |
|-------|-------|------|
| Manual Trading | `/` | `Hand` or `MousePointer` |
| Order Ladder | `/auto-trading` | `Layers` or `GitBranch` |

### 3. Update Index Page
**File:** `src/pages/Index.tsx`

- Wrap existing content in `TradingLayout`
- Remove the standalone header (move to layout or keep minimal)
- Page content becomes a child of the layout

### 4. Update AutoTrading Page
**File:** `src/pages/AutoTrading.tsx`

- Wrap existing content in `TradingLayout`
- Remove the standalone header
- Page content becomes a child of the layout

### 5. Remove Link Cards
**File:** `src/components/trading/TradingTabs.tsx`

- Remove the "Link to Auto Trading" card since navigation is now in sidebar

## Sidebar Behavior
- **Expanded**: Shows icon + label (16rem width)
- **Collapsed**: Shows icon only with tooltip (3rem width)
- **Mobile**: Opens as sheet/drawer overlay
- **Keyboard shortcut**: `Ctrl+B` / `Cmd+B` to toggle
- **Persistent state**: Saves preference via cookie

## Visual Design
- Uses existing terminal/dark theme styling
- Active route highlighted with accent background
- Smooth transition animations
- Icons from lucide-react library

## Files to Create/Modify
| File | Action |
|------|--------|
| `src/components/layout/TradingLayout.tsx` | Create - shared layout wrapper |
| `src/components/layout/TradingSidebar.tsx` | Create - navigation sidebar |
| `src/pages/Index.tsx` | Modify - wrap in TradingLayout |
| `src/pages/AutoTrading.tsx` | Modify - wrap in TradingLayout |
| `src/components/trading/TradingTabs.tsx` | Modify - remove auto trading link card |

## Component Hierarchy
```text
App
 +-- TradingLayout
      +-- SidebarProvider
           +-- TradingSidebar
           |    +-- SidebarHeader (logo/trigger)
           |    +-- SidebarContent
           |         +-- SidebarMenu
           |              +-- Manual NavLink
           |              +-- Ladder NavLink
           +-- Main Content
                +-- Index OR AutoTrading page
```
