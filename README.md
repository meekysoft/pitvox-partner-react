# @pitvox/partner-react

React SDK for PitVox partner websites. Provides hooks, styled components, and a driver dashboard for sim racing communities affiliated with [PitVox](https://pitvox.com).

**Hooks-first**: Use the data hooks with any UI framework (Tailwind, DaisyUI, Shadcn, Preline, etc.). The styled `pvx-*` components are optional building blocks for quick starts.

## Installation

```bash
npm install @pitvox/partner-react
```

### Peer dependencies

```bash
npm install react react-dom @tanstack/react-query
```

## Quick start

Wrap your app with the provider:

```jsx
import { PitVoxPartnerProvider } from '@pitvox/partner-react'

function App() {
  return (
    <PitVoxPartnerProvider
      partnerSlug="your-slug"
      getSteamId={() => currentUser?.steamId ?? null}
    >
      {/* your app */}
    </PitVoxPartnerProvider>
  )
}
```

> The provider auto-creates a `QueryClient` if your app doesn't already have one. If you use React Query elsewhere, wrap with your own `QueryClientProvider` first and the SDK will share it.

## Leaderboards

### Hooks

```jsx
import {
  useLeaderboardIndex,
  useTrackLeaderboard,
  useDriverLaps,
  useUserLookup,
  useCarMetadata,
} from '@pitvox/partner-react'
```

**`useLeaderboardIndex(options?)`** — Fetch all tracks with record holders.
- `options.game` — Filter by game (`'evo'` | `'acc'`)
- Returns `{ data: Track[], isLoading, generatedAt, totalLaps, totalUsers, versions }`

**`useTrackLeaderboard(trackId, layout?, options?)`** — Fetch track entries.
- Without `options.carId`: returns best lap per car (car-level)
- With `options.carId`: returns all drivers for that car (driver-level)
- Returns `{ data: Entry[], isLoading, error }`

**`useDriverLaps(userId, trackId, layout, carId, options?)`** — Fetch a driver's lap history.
- `options.showInvalid` — Include invalid laps (default `false`)
- Returns `{ data: Lap[], isLoading, driverName }`

**`useUserLookup()`** — Returns a lookup function: `(userId, fallback?) => { displayName, avatarUrl, affiliations }`

**`useCarMetadata()`** — Returns `{ tags: string[], cars: Record<string, { tags }> }` for tag filtering.

### Styled components

For building leaderboard pages with the SDK's `pvx-*` styles:

```jsx
import { TracksTable, CarsTable, DriversTable, LapHistoryTable, RankingsTable } from '@pitvox/partner-react'
import '@pitvox/partner-react/styles.css'
```

- **`<TracksTable>`** — All tracks with record holders, tag filtering, sorting
- **`<CarsTable>`** — Cars for a selected track with tag filtering
- **`<DriversTable>`** — Drivers for a car with sectors (S1/S2/S3), tyre, fuel. Accepts optional `highlightId` to visually highlight a specific driver row.
- **`<LapHistoryTable>`** — Driver's lap history with validity and personal best highlighting
- **`<RankingsTable>`** — Driver rankings across all car/track combos, with expandable combo details. Accepts `onComboSelect` callback for drill-down navigation.

You compose these into your own page layout and wire up navigation between layers. See the [partner templates](https://github.com/meekysoft/pitvox-partner-template) for a complete example using React Router.

## Competitions

### Hooks

```jsx
import {
  useCompetitions,
  useCompetitionConfig,
  useCompetitionStandings,
  useCompetitionRound,
  useCompetitionAllRounds,
  useCompetitionEntryList,
} from '@pitvox/partner-react'
```

**`useCompetitions()`** — All competitions for this partner.

**`useCompetitionConfig(competitionId)`** — Single competition config (name, rounds, countingRounds, etc.).

**`useCompetitionStandings(competitionId)`** — Championship standings with per-round breakdowns.

**`useCompetitionRound(competitionId, roundNumber)`** — Single round results with session data.

**`useCompetitionAllRounds(competitionId, roundNumbers)`** — Fetch multiple round results in parallel.

**`useCompetitionEntryList(competitionId)`** — Registered drivers.

### Styled components

```jsx
import {
  CompetitionCards, StandingsTable, RoundResults, RoundSessionResults,
  EntryList, RegisterButton, RegistrationPanel,
} from '@pitvox/partner-react'
import '@pitvox/partner-react/styles.css'
```

- **`<CompetitionCards>`** — Card grid with posters, type badges, schedule, registration status
- **`<StandingsTable>`** — Championship standings with per-round breakdowns, podium highlights
- **`<RoundResults>`** — Standalone round results (fetches data, renders header + sessions)
- **`<RoundSessionResults>`** — Session tabs + results table (data-prop driven, no fetch)
- **`<EntryList>`** — Registered drivers grid with avatars
- **`<RegisterButton>`** — Register/withdraw toggle (render prop or default button)
- **`<RegistrationPanel>`** — Registration form + entry list with unregister

### Shared utilities

Useful when composing competition pages:

```jsx
import { TypeBadge, InfoPill, PODIUM_MEDALS, CompLoadingState, CompEmptyState } from '@pitvox/partner-react'
```

## Driver Dashboard

### Drop-in composite

The `DriverDashboard` is a self-contained component with no routing dependency:

```jsx
import { DriverDashboard } from '@pitvox/partner-react'
import '@pitvox/partner-react/styles.css'

function DashboardPage() {
  return (
    <DriverDashboard
      steamId={user.steamId}
      avatarUrl={user.avatarUrl}
      memberSince={user.createdAt}
    />
  )
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `steamId` | `string` | — | Driver's Steam ID (required) |
| `avatarUrl` | `string` | — | Avatar URL from your auth provider |
| `memberSince` | `string` | — | ISO date for "Racing since" display |
| `className` | `string` | — | Additional class on root container |

The dashboard automatically includes:
- **Upcoming Events** — competition rounds the driver is registered for (CDN-based, always available)
- **Notifications** — only when `onFetchNotifications` is provided to the provider (see [Notifications](#notifications))

### Layer components

```jsx
import { DriverProfile, StatsCards, RecordsTable, UpcomingEvents, NotificationsCard } from '@pitvox/partner-react'
```

- **`<UpcomingEvents>`** — Upcoming competition rounds card (accepts `events` array from `useUpcomingEvents()`)
- **`<NotificationsCard>`** — Notifications list with read/unread state (accepts `notifications`, `unreadCount`, `onMarkRead`, `onMarkAllRead`)

### Hooks

```jsx
import { useDriverStats, useDriverRating, useDriverRatings, useUpcomingEvents } from '@pitvox/partner-react'
```

**`useDriverStats(steamId)`** — Driver stats, records, and ranking from CDN.

**`useDriverRating(steamId)`** — Single driver's rating from the partner ratings file.

**`useDriverRatings(options?)`** — All driver ratings for the rankings table.
- `options.gameVersion` — EVO version filter (null/undefined for ACC)
- `options.enabled` — Whether to enable the query (default `true`)
- Returns `{ data: { drivers: [...], driverCount }, isLoading, error }`

**`useUpcomingEvents()`** — Upcoming competition rounds the current user is registered for (CDN-based).

## Notifications

Notifications require a backend to proxy requests to pitvox-api (keeping the API key server-side). Provide callbacks to the provider:

```jsx
<PitVoxPartnerProvider
  partnerSlug="your-slug"
  getSteamId={() => user?.steamId ?? null}
  onFetchNotifications={async (params) => {
    const res = await fetch(`/api/notifications?limit=${params.limit || 20}`)
    return res.json() // { notifications: [...], unreadCount: number }
  }}
  onMarkNotificationRead={async (id) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
  }}
  onMarkAllNotificationsRead={async () => {
    await fetch('/api/notifications/read-all', { method: 'PATCH' })
  }}
>
```

When no callbacks are provided, notification hooks return disabled/empty state and `DriverDashboard` hides the notifications section.

### Hooks

```jsx
import {
  useNotifications, useUnreadCount, useMarkNotificationRead,
  useMarkAllNotificationsRead, useNotificationsEnabled,
} from '@pitvox/partner-react'
```

**`useNotifications(options?)`** — Fetch notifications (polls every 30s). Returns `{ data: { notifications, unreadCount }, isLoading }`.

**`useUnreadCount()`** — Unread count for navbar badges. Returns `{ count, isLoading }`.

**`useMarkNotificationRead()`** — Mutation to mark a notification as read.

**`useMarkAllNotificationsRead()`** — Mutation to mark all as read.

**`useNotificationsEnabled()`** — Returns `boolean` — whether notification callbacks are provided.

## Registration

The SDK supports two registration modes, determined by whether you provide callbacks to the provider.

### Basic mode (default)

No configuration needed. Registration components render links to pitvox.com where users register with Steam.

### Power mode

For partners with a backend (e.g. Amplify Lambda proxying to pitvox-api), provide callbacks:

```jsx
<PitVoxPartnerProvider
  partnerSlug="your-slug"
  getSteamId={() => user?.steamId ?? null}
  onRegister={async (competitionId, driverData) => {
    await fetch('/api/register', { method: 'POST', body: JSON.stringify({ competitionId, ...driverData }) })
  }}
  onWithdraw={async (competitionId, steamId) => {
    await fetch('/api/withdraw', { method: 'POST', body: JSON.stringify({ competitionId, steamId }) })
  }}
>
```

### Registration hooks

```jsx
import { useRegistrationStatus, useRegister, useWithdraw, useRegistrationMode, useRegistrationUrl } from '@pitvox/partner-react'
```

**`useRegistrationStatus(competitionId)`** — Check if current user is registered.

**`useRegister(competitionId)`** — Mutation delegating to `onRegister` callback.

**`useWithdraw(competitionId)`** — Mutation delegating to `onWithdraw` callback.

**`useRegistrationMode()`** — Returns `{ isPowerMode, isBasicMode }`.

**`useRegistrationUrl(competitionId)`** — Returns pitvox.com registration URL for basic mode.

## Formatting utilities

```jsx
import {
  formatLapTime,       // 92365 → "1:32.365"
  formatSectorTime,    // 34567 → "34.567"
  formatCarName,       // "ks_ferrari_296_gt3" → "Ferrari 296 Gt3"
  formatTrackName,     // "donington_park", "national" → "Donington Park National"
  formatDate,          // ISO string → "27 Feb 2024"
  formatRelativeTime,  // ISO string → "2h ago"
  formatDelta,         // 542 → "+0.542"
  formatTyreCompound,           // "SR" → "Soft Race"
  formatNotificationMessage,    // notification → "X beat your record on Track — Car"
} from '@pitvox/partner-react'
```

## Theming

The default stylesheet uses CSS custom properties. Override them to match your brand:

```css
:root {
  --pvx-accent: #e11d48;
  --pvx-bg-card: #1a1a2e;
  --pvx-sector-best: #22d3ee;
  --pvx-rank-gold: #fbbf24;
}
```

All classes are prefixed with `pvx-` to avoid collisions. See `styles.css` for the full list of variables.

## Partner templates

For a complete working site using this SDK, see:

- **[pitvox-partner-template](https://github.com/meekysoft/pitvox-partner-template)** — Basic template (no auth)
- **[pitvox-partner-template-amplify](https://github.com/meekysoft/pitvox-partner-template-amplify)** — AWS Amplify template with Steam auth and in-app registration

The templates demonstrate how to compose SDK hooks and components into full pages with routing.

## Local development

```bash
# In the SDK repo
npm link

# In your app
npm link @pitvox/partner-react
```

Add `resolve.dedupe` to your Vite config to avoid duplicate React instances:

```js
// vite.config.js
export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom', '@tanstack/react-query'],
  },
})
```

## License

MIT
