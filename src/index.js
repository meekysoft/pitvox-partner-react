// Provider
export { PitVoxPartnerProvider, usePitVox } from './provider.jsx'

// Hooks — Leaderboards
export {
  useLeaderboardIndex,
  useTrackLeaderboard,
  useDriverLaps,
  useUserLookup,
  useCarMetadata,
  useCarLeaderboard,
  useRecentLaps,
} from './hooks/useLeaderboards.js'

// Hooks — Competitions
export {
  useCompetitions,
  useCompetitionConfig,
  useCompetitionStandings,
  useCompetitionRound,
  useCompetitionAllRounds,
  useCompetitionEntryList,
  useCompetitionRoundLaps,
  useCompetitionLeaderboard,
} from './hooks/useCompetitions.js'

// Hooks — Registration
export {
  useRegistrationStatus,
  useRegister,
  useWithdraw,
  useRegistrationMode,
  useRegistrationUrl,
} from './hooks/useRegistration.js'

// Components — Leaderboards
export { TracksTable } from './components/leaderboards/TracksTable.jsx'
export { CarsTable } from './components/leaderboards/CarsTable.jsx'
export { DriversTable } from './components/leaderboards/DriversTable.jsx'
export { LapHistoryTable } from './components/leaderboards/LapHistoryTable.jsx'
export { RankingsTable } from './components/leaderboards/RankingsTable.jsx'

// Components — Competitions
export { CompetitionCards, CompetitionCard } from './components/competitions/CompetitionCards.jsx'
export { StandingsTable } from './components/competitions/StandingsTable.jsx'
export { RoundResults, RoundSessionResults } from './components/competitions/RoundResults.jsx'
export { EntryList } from './components/competitions/EntryList.jsx'
export { RegisterButton } from './components/competitions/RegisterButton.jsx'
export { RegistrationPanel } from './components/competitions/RegistrationPanel.jsx'
export { CompetitionResultsTabs } from './components/competitions/CompetitionResultsTabs.jsx'
export { CompletedBadge } from './components/competitions/CompletedBadge.jsx'

// Hooks — Dashboard
export { useDriverStats } from './hooks/useDriverStats.js'
export { useDriverRating, useDriverRatings } from './hooks/useDriverRating.js'
export { useUpcomingEvents } from './hooks/useUpcomingEvents.js'

// Hooks — Notifications
export {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useNotificationsEnabled,
} from './hooks/useNotifications.js'

// Components — Dashboard (composite)
export { DriverDashboard } from './components/dashboard/DriverDashboard.jsx'

// Components — Dashboard (individual layers)
export { DriverProfile } from './components/dashboard/DriverProfile.jsx'
export { StatsCards } from './components/dashboard/StatsCards.jsx'
export { RecordsTable } from './components/dashboard/RecordsTable.jsx'
export { UpcomingEvents } from './components/dashboard/UpcomingEvents.jsx'
export { NotificationsCard } from './components/dashboard/NotificationsCard.jsx'

// Shared — Competition utilities (for composing competition pages)
export {
  TypeBadge,
  InfoPill,
  PODIUM_MEDALS,
  formatSessionLabel,
  CompLoadingState,
  CompEmptyState,
  DEFAULT_COMPLETION_GRACE_DAYS,
  isCompetitionComplete,
  getCompletionDate,
  getCompetitionStatus,
  filterCompetitionsByStatus,
  getCompetitionPodium,
} from './components/competitions/shared.jsx'

// CDN utilities
export { fetchCdnJson, buildLeaderboardPath, buildLapsPath, buildDriverIndexPath, buildRecentLapsPath } from './lib/cdn.js'

// Utilities
export {
  formatLapTime,
  formatSectorTime,
  formatCarName,
  formatTrackName,
  formatDate,
  formatRelativeTime,
  formatDelta,
  formatTyreCompound,
  formatFuel,
  formatNotificationMessage,
} from './utils/format.js'
