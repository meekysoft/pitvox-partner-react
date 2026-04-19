# Changelog

## [0.7.5](https://github.com/meekysoft/pitvox-partner-react/compare/v0.7.4...v0.7.5) (2026-04-19)

## [0.7.4](https://github.com/meekysoft/pitvox-partner-react/compare/v0.7.3...v0.7.4) (2026-04-19)

## [0.7.3](https://github.com/meekysoft/pitvox-partner-react/compare/v0.7.2...v0.7.3) (2026-04-17)

## [0.7.2](https://github.com/meekysoft/pitvox-partner-react/compare/v0.7.1...v0.7.2) (2026-04-16)

## [0.7.1](https://github.com/meekysoft/pitvox-partner-react/compare/v0.6.8...v0.7.1) (2026-04-10)

## [0.7.0] - 2026-04-10

### Changed
- **BREAKING:** `useDriverLaps` now fetches a per-(driver, track, layout) CDN file instead of a single per-driver file. The hook signature is unchanged but the underlying CDN layout has moved to `laps/{userId}/{trackId}/{layout}.json` (and `laps/partners/{slug}/{userId}/{trackId}/{layout}.json` for partner mode). Driver totals, breakdowns, records and best ranking now live in a separate index file at `laps/{userId}/index.json`.
- **BREAKING:** `buildLapsPath(partnerSlug, userId)` is now `buildLapsPath(partnerSlug, userId, trackId, layout)`. Callers building paths manually must pass the track + layout.
- `useDriverStats` now fetches the new driver index file (`laps/{steamId}/index.json`); return shape is unchanged.

### Added
- `buildDriverIndexPath(partnerSlug, userId)` path builder for the new driver index file. Exported from the package root.

### Fixed
- Driver lap history (Layer 4) no longer silently drops laps when a driver has more than 500 leaderboard-eligible laps total. Previously, the per-driver CDN file was capped at the 500 most recent laps, causing record-holder laps on combos a driver hadn't run recently to disappear from the drill-down. Each per-(track, layout) file now holds up to 2000 laps, more than enough for any realistic combo.

## 0.6.8 (2026-04-02)

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.6.7] - 2026-03-31

### Added
- `CompetitionResultsTabs` component — tabbed results view replacing the accordion pattern. Championships show Standings + round tabs; series/events show round tabs only.
- Per-position podium cell highlighting in `StandingsTable` (P1 gold, P2 silver, P3 bronze backgrounds and coloured position labels).

### Changed
- `StandingsTable` podium cells now use distinct colours per position instead of a single generic podium background.

## [0.6.6] - 2026-03-31

### Fixed
- Null guard in `formatTrackName` — no longer throws when `trackId` is null/undefined.

## [0.6.5] - 2026-03-31

### Changed
- `formatSectorTime` now uses M:SS.mmm format for sector times >= 60 seconds, matching `formatLapTime` for readability on long tracks.

## [0.6.4] - 2026-03-31

### Added
- `theoreticalBest` return value on `useDriverLaps` — computes the sum of best individual sectors across valid laps. Returns `{ lapTimeMs, sector1Ms, sector2Ms, sector3Ms }` when faster than the actual best lap.
- `LapHistoryTable` component now displays the theoretical best above the lap table.

## [0.6.0] - 2026-03-30

### Added
- Global mode — `partnerSlug` is now optional on `PitVoxPartnerProvider`. Omit it for global (non-partner-scoped) data.
- `useRecentLaps` hook — fetches recent lap activity (global or partner-scoped).
- `CompetitionCard` export — individual card component for custom grid layouts.
- Path builder utilities exported: `fetchCdnJson`, `buildLeaderboardPath`, `buildLapsPath`, `buildRecentLapsPath`.
- Competition detail hooks (`useCompetitionConfig`, `useCompetitionStandings`, `useCompetitionRound`, `useCompetitionAllRounds`, `useCompetitionEntryList`) now accept `options.partnerSlug` override for use in global mode.

### Changed
- All leaderboard hooks (`useLeaderboardIndex`, `useTrackLeaderboard`, `useDriverLaps`) now conditionally build global or partner-scoped CDN paths based on provider context.
- `useDriverRatings` and `useDriverRating` now support global paths when no partner slug is set.
- `useCompetitions` returns all competitions (unfiltered) when in global mode.

## [0.5.12] - 2026-03-29

### Changed
- Competition cards grid layout moved from SDK's CSS grid to template-level Tailwind grid, giving partners full control over layout.

## [0.5.0] - 2026-03-24

### Added
- `StandingsTable` component for championship standings with per-round breakdowns.
- `RoundResults` and `RoundSessionResults` components for round result display.
- `EntryList` component for registered drivers.
- `RegisterButton` with power mode (in-app) and basic mode (link to pitvox.com).
- `RegistrationPanel` composite component.
- `useRegistrationStatus`, `useRegister`, `useWithdraw`, `useRegistrationMode`, `useRegistrationUrl` hooks.
- `useCompetitions`, `useCompetitionConfig`, `useCompetitionStandings`, `useCompetitionRound`, `useCompetitionAllRounds`, `useCompetitionEntryList` hooks.
- Competition shared utilities: `TypeBadge`, `InfoPill`, `PODIUM_MEDALS`, `CompLoadingState`, `CompEmptyState`.
