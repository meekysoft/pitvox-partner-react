# @pitvox/partner-react

React SDK for PitVox partner websites. Provides hooks, components, and complete leaderboard + competition experiences for sim racing communities affiliated with [PitVox](https://pitvox.com).

## Installation

```bash
npm install @pitvox/partner-react
```

### Peer dependencies

The SDK requires these in your project:

```bash
npm install react react-dom @tanstack/react-query react-router-dom
```

## Quick start

Wrap your app with the provider:

```jsx
import { PitVoxPartnerProvider } from '@pitvox/partner-react'

function App() {
  return (
    <BrowserRouter>
      <PitVoxPartnerProvider
        partnerSlug="your-slug"
        cdnUrl="https://cdn.pitvox.com"
        apiUrl="https://api.pitvox.com"
        apiKey="your-api-key"
        getSteamId={() => currentUser?.steamId ?? null}
      >
        {/* your app */}
      </PitVoxPartnerProvider>
    </BrowserRouter>
  )
}
```

> The provider auto-creates a `QueryClient` if your app doesn't already have one. If you use React Query elsewhere, wrap with your own `QueryClientProvider` first and the SDK will share it.

## Leaderboards

### Drop-in (recommended)

One component gives you a complete 4-layer leaderboard with game tabs, version selector, tag filtering, sortable columns, sector highlighting, and drill-down navigation:

```jsx
import { LeaderboardExplorer } from '@pitvox/partner-react'
import '@pitvox/partner-react/styles.css'

function LeaderboardsPage() {
  return <LeaderboardExplorer />
}
```

The `LeaderboardExplorer` manages all state via URL search parameters (`?game=evo&track=...&car=...&driver=...`), so deep-linking and browser back/forward work out of the box.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | — | Additional class on root container |
| `defaultGame` | `'evo' \| 'acc'` | `'evo'` | Default game tab |
| `title` | `string` | `'Leaderboards'` | Page heading |

### Layer components

For more control, use the individual layer components directly. Each handles its own sorting, filtering, and highlighting logic:

```jsx
import { TracksTable, CarsTable, DriversTable, LapHistoryTable } from '@pitvox/partner-react'
import '@pitvox/partner-react/styles.css'
```

- **`<TracksTable>`** — Layer 1: all tracks with record holders, tag filtering
- **`<CarsTable>`** — Layer 2: cars for a selected track, tag filtering
- **`<DriversTable>`** — Layer 3: drivers for a car with sectors (S1/S2/S3), tyre, fuel
- **`<LapHistoryTable>`** — Layer 4: driver's lap history with validity and personal best highlighting

You're responsible for wiring up the navigation between layers and managing URL state.

### Hooks only

For fully custom UIs, use the data hooks directly:

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
- `options.gameVersion` — Filter by EVO version
- Returns `{ data: Track[], isLoading, partner, generatedAt, totalLaps, totalUsers, versions }`

**`useTrackLeaderboard(trackId, layout?, options?)`** — Fetch track entries.
- Without `options.carId`: returns best lap per car (Layer 2)
- With `options.carId`: returns all drivers for that car (Layer 3)
- Returns `{ data: Entry[], isLoading, error }`

**`useDriverLaps(userId, trackId, layout, carId, options?)`** — Fetch a driver's lap history.
- `options.showInvalid` — Include invalid laps (default `false`)
- Returns `{ data: Lap[], isLoading, driverName }`

**`useUserLookup()`** — Returns a lookup function: `(userId, fallback?) => { displayName, avatarUrl, affiliations }`

**`useCarMetadata()`** — Returns `{ tags: string[], cars: Record<string, { tags }> }` for tag filtering.

## Competitions

### Drop-in (recommended)

One component gives you a complete competition experience with card grid, championship standings, round-by-round results with session tabs, and entry lists:

```jsx
import { CompetitionExplorer } from '@pitvox/partner-react'
import '@pitvox/partner-react/styles.css'

function CompetitionsPage() {
  return <CompetitionExplorer />
}
```

The `CompetitionExplorer` manages all state via URL search parameters (`?competition=abc123&tab=standings&round=2`), so deep-linking and browser back/forward work out of the box.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | — | Additional class on root container |
| `title` | `string` | `'Competitions'` | Page heading |

**Features:**
- Competition card grid with poster images, type badges, format/car pills, schedule summary, registration status
- Championship standings with position rank badges, nation flags, wins/podiums columns, per-round cells with dropped round styling
- Round results with session tabs (Practice/Qualifying/Race), best lap with sector hover tooltip, podium highlighting
- Entry list with driver avatars
- Horizontal schedule strip with next-round highlighting
- Breadcrumb navigation between list and detail views

### Layer components

For more control, use the individual layer components directly:

```jsx
import { CompetitionCards, StandingsTable, RoundResults, EntryList } from '@pitvox/partner-react'
import '@pitvox/partner-react/styles.css'
```

- **`<CompetitionCards>`** — Competition card grid with posters, badges, schedule, and registration status
- **`<StandingsTable>`** — Championship standings with per-round breakdowns, podium highlights, dropped rounds
- **`<RoundResults>`** — Round results with session tab bar, driver/car detail, best sector highlighting
- **`<EntryList>`** — Registered drivers grid with avatars
- **`<RegisterButton>`** — Register/withdraw toggle (render prop or default button)

You're responsible for wiring up navigation between views and managing state.

### Hooks only

For fully custom UIs, use the data hooks directly:

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
```

## Driver Dashboard

### Drop-in (recommended)

One component gives you a complete driver dashboard with profile, stats cards, and current records:

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

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `steamId` | `string` | — | Driver's Steam ID (required) |
| `avatarUrl` | `string` | — | Avatar URL from your auth provider |
| `memberSince` | `string` | — | ISO date for "Racing since" display |
| `className` | `string` | — | Additional class on root container |

**Displays:**
- Driver profile (avatar, name, racing since)
- Stats cards: total laps, cars driven, tracks driven, records held, best ranking, driver rating
- Current records table with track, car, lap time, and game badge

### Layer components

For more control, use the individual components directly:

```jsx
import { DriverProfile, StatsCards, RecordsTable } from '@pitvox/partner-react'
import '@pitvox/partner-react/styles.css'
```

- **`<DriverProfile>`** — Avatar, driver name, and "Racing since" date
- **`<StatsCards>`** — Grid of stat cards (accepts `stats` from `useDriverStats` and `rating` from `useDriverRating`)
- **`<RecordsTable>`** — Table of current records held

### Hooks only

For fully custom UIs, use the data hooks directly:

```jsx
import { useDriverStats, useDriverRating } from '@pitvox/partner-react'
```

**`useDriverStats(steamId)`** — Fetch driver stats, records, and ranking from CDN.
- Shares the same query cache as `useDriverLaps` (same CDN file)
- Returns `{ data: { driverName, lapCount, trackBreakdown, carBreakdown, recordsHeld, currentRecords, bestRanking, bestRankingTrackId, bestRankingLayout, bestRankingCarId }, isLoading, error }`

**`useDriverRating(steamId)`** — Fetch driver's rating from the partner ratings file.
- Returns `{ data: { rating, rank, totalDrivers, comboCount, distinctCars, combos }, isLoading, error }`

## Registration

```jsx
import { useRegistrationStatus, useRegister, useWithdraw } from '@pitvox/partner-react'
```

**`useRegistrationStatus(competitionId)`** — Check if current user (via `getSteamId`) is registered. Returns `{ data: { isRegistered, entryList } }`.

**`useRegister(competitionId)`** — Returns a mutation. Call `mutate(driverData)` with `{ steamId, displayName, ... }`.

**`useWithdraw(competitionId)`** — Returns a mutation. Call `mutate()` to unregister.

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
  formatTyreCompound,  // "SR" → "Soft Race"
} from '@pitvox/partner-react'
```

## Theming

The default stylesheet uses CSS custom properties. Override them to match your brand:

```css
:root {
  --pvx-accent: #e11d48;         /* your brand colour */
  --pvx-bg-card: #1a1a2e;        /* card background */
  --pvx-sector-best: #22d3ee;    /* best sector highlight */
  --pvx-rank-gold: #fbbf24;      /* podium colours */
}
```

All classes are prefixed with `pvx-` to avoid collisions with your existing styles. See `styles.css` for the full list of variables and classes.

## CDN data paths

The SDK reads pre-computed JSON from the PitVox CDN. No API key is needed for read-only leaderboard and competition data.

| Data | Path |
|------|------|
| Leaderboard index | `leaderboards/partners/{slug}/index.json` |
| Track entries | `leaderboards/partners/{slug}/tracks/{trackId}/{layout}.json` |
| Driver laps | `laps/partners/{slug}/{userId}.json` |
| User display names | `users/index.json` |
| Car metadata | `cars/index.json` |
| Competition index | `competitions/index.json` |
| Competition config | `competitions/{slug}/{id}/config.json` |
| Standings | `competitions/{slug}/{id}/standings.json` |
| Round results | `competitions/{slug}/{id}/rounds/{n}.json` |
| Entry list | `competitions/{slug}/{id}/entrylist.json` |
| Driver ratings | `leaderboards/partners/{slug}/ratings.json` |

## Local development

To develop against a local version of the SDK:

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
    dedupe: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
  },
})
```

## License

MIT
