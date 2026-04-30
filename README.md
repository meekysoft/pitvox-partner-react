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

### Global mode

`partnerSlug` is optional. Omit it (or pass `null`) to use global CDN paths instead of partner-scoped ones. This is useful for sites like pitvox.com that display leaderboards and competitions across all partners.

```jsx
<PitVoxPartnerProvider cdnUrl="https://cdn.pitvox.com">
  {/* hooks return global data */}
</PitVoxPartnerProvider>
```

## Leaderboards

### Hooks

```jsx
import {
  useLeaderboardIndex,
  useTrackLeaderboard,
  useDriverLaps,
  useRecentLaps,
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
- Returns `{ data: Lap[], isLoading, driverName, theoreticalBest }`
- `theoreticalBest` — `{ lapTimeMs, sector1Ms, sector2Ms, sector3Ms }` or `null`. Computed from the best individual sectors across all valid laps. Only returned when it's faster than the actual best lap and there are at least 2 valid laps.

**`useRecentLaps()`** — Fetch recent lap activity.
- Returns `{ groups: Activity[], generatedAt, isLoading }`

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

**`useCompetitions()`** — All competitions for this partner (or all competitions in global mode).

**`useCompetitionConfig(competitionId, options?)`** — Single competition config (name, rounds, countingRounds, etc.).

**`useCompetitionStandings(competitionId, options?)`** — Championship standings with per-round breakdowns.

**`useCompetitionRound(competitionId, roundNumber, options?)`** — Single round results with session data.

**`useCompetitionAllRounds(competitionId, roundNumbers, options?)`** — Fetch multiple round results in parallel.

**`useCompetitionEntryList(competitionId, options?)`** — Registered drivers.

All competition detail hooks accept `options.partnerSlug` to override the provider's slug. This is useful in global mode where the partner slug comes from the competition data rather than from context.

### Styled components

```jsx
import {
  CompetitionCards, CompetitionCard, CompetitionResultsTabs,
  StandingsTable, RoundResults, RoundSessionResults,
  EntryList, RegisterButton, RegistrationPanel,
} from '@pitvox/partner-react'
import '@pitvox/partner-react/styles.css'
```

- **`<CompetitionResultsTabs>`** — Tabbed results view for a competition. Championships show a "Standings" tab (default) plus one tab per finalized round. Series/Events show round tabs only, defaulting to the most recent. Self-contained — fetches all data via hooks. Props: `competitionId`, `className`.
- **`<CompetitionCards>`** — Card grid with posters, type badges, schedule, registration status. Bundles its own CSS grid layout. Completed championships automatically show a podium badge and hide the registration section.
- **`<CompetitionCard>`** — Individual competition card. Use this when you want to control the grid layout yourself (e.g. with Tailwind). Props: `comp`, `onSelect`, `onRegister`.
- **`<CompletedBadge>`** — Podium winners badge for completed championships. Fetches standings automatically. Props: `competitionId`, `topN` (default 3), `label` (default "Completed"), `className`.
- **`<StandingsTable>`** — Championship standings with per-round breakdowns and per-position podium cell highlighting
- **`<RoundResults>`** — Standalone round results (fetches data, renders header + sessions)
- **`<RoundSessionResults>`** — Session tabs + results table (data-prop driven, no fetch)
- **`<EntryList>`** — Registered drivers grid with avatars
- **`<RegisterButton>`** — Register/withdraw toggle (render prop or default button)
- **`<RegistrationPanel>`** — Registration form + entry list with unregister

### Shared utilities

Useful when composing competition pages:

```jsx
import {
  TypeBadge, InfoPill, PODIUM_MEDALS, CompLoadingState, CompEmptyState,
  isCompetitionComplete, getCompletionDate, getCompetitionStatus,
  filterCompetitionsByStatus, getCompetitionPodium,
  DEFAULT_COMPLETION_GRACE_DAYS,
} from '@pitvox/partner-react'
```

**`isCompetitionComplete(comp)`** — Returns `true` if all rounds are finalised.

**`getCompletionDate(comp)`** — Returns the latest round's `startTime` as a `Date` (or `null`).

**`getCompetitionStatus(comp, graceDays?)`** — Returns `'active'` | `'recently-completed'` | `'archived'`. A competition is "recently completed" for `graceDays` (default 3) after its final round, then becomes "archived".

**`filterCompetitionsByStatus(competitions, statuses, graceDays?)`** — Filter a list by one or more statuses.

**`getCompetitionPodium(standings, topN?)`** — Extract the top N drivers from a standings payload.

## Driver Dashboard

### Drop-in composite

The `DriverDashboard` is a self-contained component with no routing dependency:

```jsx
import { DriverDashboard } from '@pitvox/partner-react'
import { useNavigate } from 'react-router-dom'
import '@pitvox/partner-react/styles.css'

function DashboardPage() {
  const navigate = useNavigate()

  const handleComboSelect = (combo) => {
    const params = new URLSearchParams()
    params.set('track', `${combo.trackId}|${combo.trackLayout || ''}`)
    params.set('car', combo.carId)
    params.set('highlight', user.steamId)
    navigate(`/leaderboards?${params.toString()}`)
  }

  return (
    <DriverDashboard
      steamId={user.steamId}
      avatarUrl={user.avatarUrl}
      memberSince={user.createdAt}
      onComboSelect={handleComboSelect}
    />
  )
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `steamId` | `string` | — | Driver's Steam ID (required) |
| `avatarUrl` | `string` | — | Avatar URL from your auth provider |
| `memberSince` | `string` | — | ISO date for "Racing since" display |
| `onComboSelect` | `(combo) => void` | — | Called when a Recent Combos row is clicked. Wire to your router to take the driver to the partner-scoped leaderboard for that combo (see example above). When omitted, rows render as static. |
| `onGameRatingSelect` | `(entry) => void` | — | Called when a Driver Rating chip is clicked, with `{game, label, rating, rank, totalDrivers}`. Wire to your rankings page if you have one. |
| `className` | `string` | — | Additional class on root container |

The dashboard automatically includes:
- **Stats Cards** — Total Laps, Cars Used (each with a click-to-toggle breakdown popover), and per-game Driver Rating chips (one chip per game where the driver has a rating, with rank info)
- **Upcoming Events** — competition rounds the driver is registered for (CDN-based, always available)
- **Recent Combos** — every (track, layout, car, game, version) the driver has touched in the partner scope, sorted by lastDrivenAt desc, with rank/gap and a leader-trophy icon for combos where the driver holds the record. Replaces the older Records table — held records surface as trophies on the relevant combo rows.
- **Notifications** — only when `onFetchNotifications` is provided to the provider (see [Notifications](#notifications))

### Layer components

```jsx
import {
  DriverProfile,
  StatsCards,
  RecentCombosCard,
  RecordsTable,
  UpcomingEvents,
  NotificationsCard,
} from '@pitvox/partner-react'
```

- **`<StatsCards>`** — Stats row. Pass `gameRatings` (from `useDriverRatingsByGame`) for the new chips behaviour, or `rating` (from `useDriverRating`) for the legacy single-number layout. Optional `onGameRatingSelect`.
- **`<RecentCombosCard>`** — Recent combos list with rank/gap and trophy treatment. Accepts `combos` (from `useDriverCombos`) and optional `onComboSelect(combo)` for row navigation.
- **`<RecordsTable>`** — Legacy "Current Records" list, still exported for consumers that prefer the explicit records UI. The composite `DriverDashboard` no longer renders it (records are surfaced as trophies on `RecentCombosCard` rows instead).
- **`<UpcomingEvents>`** — Upcoming competition rounds card (accepts `events` array from `useUpcomingEvents()`)
- **`<NotificationsCard>`** — Notifications list with read/unread state (accepts `notifications`, `unreadCount`, `onMarkRead`, `onMarkAllRead`)

### Hooks

```jsx
import {
  useDriverStats,
  useDriverCombos,
  useDriverRating,
  useDriverRatings,
  useDriverRatingsByGame,
  useUpcomingEvents,
} from '@pitvox/partner-react'
```

**`useDriverStats(steamId)`** — Driver stats, records, and ranking from CDN. Always fetches the *global* index (not partner-scoped) so stats reflect the driver's whole career, not just partner-affiliated activity.

**`useDriverCombos(steamId)`** — Per-(track, layout, car, game, version) combo list, partner-scoped via the provider's `partnerSlug`. Each entry: `{trackId, trackLayout, carId, game, gameVersion, lapCount, validLapCount, lastDrivenAt, personalBestMs, rank, totalDrivers, gapToLeaderMs, gapToNextMs}`. Sorted server-side by `lastDrivenAt` desc. Rank/gap fields refresh on the 5-min full pass on the partner CDN path; `lapCount` and `lastDrivenAt` are always fresh.

**`useDriverRating(steamId)`** — Single driver's rating from the partner ratings file (legacy, single game).

**`useDriverRatings(options?)`** — All driver ratings for the rankings table.
- `options.game` — Game identifier (`'evo'`, `'acc'`, `'lmu'`)
- `options.gameVersion` — Version filter for versioned games
- `options.enabled` — Whether to enable the query (default `true`)
- Returns `{ data: { drivers: [...], driverCount }, isLoading, error }`

**`useDriverRatingsByGame(steamId)`** — Per-game rating chips for one driver. Reads default versions from the leaderboard index's `versions` metadata (no hardcode), queries each game's ratings file in parallel, and returns `[{game, label, rating, rank, totalDrivers}]` for games where the driver appears. Order matches the leaderboards page tabs (EVO, ACC, LMU). Drives the chip layout in `<StatsCards>`.

**`useUpcomingEvents()`** — Upcoming competition rounds the current user is registered for (CDN-based). When `onFetchServerPassword` is provided to the provider, each event includes `serverAddress` and `serverPassword` fields.

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

## Server Password

Registered drivers can see server connection details (address + password) for their upcoming events. This requires a backend query that validates registration before returning the password.

Provide the callback to the provider:

```jsx
<PitVoxPartnerProvider
  partnerSlug="your-slug"
  getSteamId={() => user?.steamId ?? null}
  onFetchServerPassword={async (competitionId, roundNumber) => {
    // Call your backend (e.g. AppSync query) which validates registration
    // and returns the server details
    const result = await client.queries.getServerPassword({ competitionId, roundNumber })
    return result.data // { success, serverAddress?, serverPassword?, error? }
  }}
>
```

When provided, `useUpcomingEvents()` automatically fetches server info for each event and the `<UpcomingEvents>` component displays the password with copy-to-clipboard.

When no callback is provided, server info is simply omitted from events.

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
  formatSectorTime,    // 34567 → "34.567", 197487 → "3:17.487"
  formatCarName,       // "ks_ferrari_296_gt3" → "Ferrari 296 Gt3"
  formatTrackName,     // "donington_park", "national" → "Donington Park National"
  formatDate,          // ISO string → "27 Feb 2024"
  formatRelativeTime,  // ISO string → "2h ago"
  formatDelta,         // 542 → "+0.542"
  formatTyreCompound,           // "SR" → "Soft Race"
  formatFuel,                   // 27.822 → "27.8L", 50 → "50L", null → "-"
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
