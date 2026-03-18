/**
 * CompetitionExplorer — Drop-in composite competition component.
 *
 * Manages all state via URL search parameters:
 *   ?competition=abc123            → competition detail (standings tab)
 *   ?competition=abc123&tab=rounds → rounds tab
 *   ?competition=abc123&tab=rounds&round=2 → specific round expanded
 *   ?competition=abc123&tab=drivers → entry list
 *
 * Without a competition param, shows the competition card grid.
 *
 * @param {object} props
 * @param {string} [props.className] - Additional class on root container
 * @param {string} [props.title] - Page heading (default: 'Competitions')
 */

import { useSearchParams } from 'react-router-dom'
import { useCompetitions, useCompetitionConfig, useCompetitionAllRounds } from '../../hooks/useCompetitions.js'
import { CompetitionCards } from './CompetitionCards.jsx'
import { StandingsTable } from './StandingsTable.jsx'
import { RoundResults } from './RoundResults.jsx'
import { EntryList } from './EntryList.jsx'
import { CompLoadingState, CompEmptyState, TypeBadge, InfoPill, formatScheduleDate } from './shared.jsx'

const TABS = [
  { id: 'standings', label: 'Standings' },
  { id: 'rounds', label: 'Rounds' },
  { id: 'drivers', label: 'Drivers' },
]

export function CompetitionExplorer({ className, title = 'Competitions' }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const competitionId = searchParams.get('competition')
  const activeTab = searchParams.get('tab') || 'standings'
  const selectedRound = searchParams.get('round') ? Number(searchParams.get('round')) : null

  const { data: competitions, isLoading: loadingList } = useCompetitions()

  // ─── Navigation handlers ───────────────────────────────────────

  function handleSelectCompetition(id) {
    setSearchParams({ competition: id })
  }

  function handleBackToList() {
    setSearchParams({})
  }

  function handleTabChange(tab) {
    const params = { competition: competitionId, tab }
    setSearchParams(params)
  }

  function handleSelectRound(roundNumber) {
    setSearchParams({ competition: competitionId, tab: 'rounds', round: String(roundNumber) })
  }

  function handleDeselectRound() {
    setSearchParams({ competition: competitionId, tab: 'rounds' })
  }

  // ─── Competition list view ─────────────────────────────────────

  if (!competitionId) {
    return (
      <div className={`pvx-comp-explorer ${className || ''}`}>
        <div className="pvx-explorer-header">
          <h2 className="pvx-explorer-title">{title}</h2>
          {!loadingList && competitions?.length > 0 && (
            <div className="pvx-explorer-stats">
              <span>{competitions.length} competition{competitions.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        <CompetitionCards
          competitions={competitions}
          isLoading={loadingList}
          onSelect={handleSelectCompetition}
        />
      </div>
    )
  }

  // ─── Competition detail view ───────────────────────────────────

  return (
    <div className={`pvx-comp-explorer ${className || ''}`}>
      <CompetitionDetail
        competitionId={competitionId}
        activeTab={activeTab}
        selectedRound={selectedRound}
        onBack={handleBackToList}
        onTabChange={handleTabChange}
        onSelectRound={handleSelectRound}
        onDeselectRound={handleDeselectRound}
      />
    </div>
  )
}

function CompetitionDetail({
  competitionId,
  activeTab,
  selectedRound,
  onBack,
  onTabChange,
  onSelectRound,
  onDeselectRound,
}) {
  const { data: config, isLoading } = useCompetitionConfig(competitionId)

  if (isLoading) {
    return <CompLoadingState message="Loading competition..." />
  }

  if (!config) {
    return (
      <div>
        <CompEmptyState message="Competition not found." />
        <div className="pvx-comp-back-link-wrap">
          <button onClick={onBack} className="pvx-comp-back-link">
            &larr; Back to competitions
          </button>
        </div>
      </div>
    )
  }

  const isChampionship = config.type === 'championship'
  const finalizedRounds = config.rounds?.filter((r) => r.isFinalized) || []
  const allRounds = config.rounds || []

  // Filter tabs: only show standings for championships, only show rounds if any are finalized
  const visibleTabs = TABS.filter((t) => {
    if (t.id === 'standings' && !isChampionship) return false
    if (t.id === 'rounds' && finalizedRounds.length === 0) return false
    return true
  })

  // If active tab is not visible, fall back
  const effectiveTab = visibleTabs.find((t) => t.id === activeTab)
    ? activeTab
    : visibleTabs[0]?.id || 'standings'

  return (
    <>
      {/* Breadcrumb / back link */}
      <button onClick={onBack} className="pvx-comp-back-link">
        &larr; Competitions
      </button>

      {/* Header */}
      <div className="pvx-comp-detail-header">
        <h2 className="pvx-explorer-title">{config.name}</h2>
        {config.description && (
          <p className="pvx-comp-detail-desc">{config.description}</p>
        )}
        <div className="pvx-comp-detail-meta">
          <TypeBadge type={config.type} />
          {config.game && <InfoPill>{config.game.toUpperCase()}</InfoPill>}
          {config.countingRounds > 0 && (
            <InfoPill variant="format">
              Best {config.countingRounds} of {allRounds.length} rounds count
            </InfoPill>
          )}
          {allRounds.length > 0 && (
            <InfoPill>{allRounds.length} round{allRounds.length !== 1 ? 's' : ''}</InfoPill>
          )}
        </div>
      </div>

      {/* Schedule */}
      {allRounds.length > 0 && (
        <CompetitionSchedule rounds={allRounds} />
      )}

      {/* Tabs */}
      {visibleTabs.length > 1 && (
        <div className="pvx-comp-tabs">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`pvx-comp-tab ${effectiveTab === tab.id ? 'pvx-comp-tab--active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      {effectiveTab === 'standings' && (
        <StandingsTable competitionId={competitionId} />
      )}

      {effectiveTab === 'rounds' && (
        <RoundsView
          competitionId={competitionId}
          finalizedRounds={finalizedRounds}
          selectedRound={selectedRound}
          onSelectRound={onSelectRound}
          onDeselectRound={onDeselectRound}
        />
      )}

      {effectiveTab === 'drivers' && (
        <EntryList competitionId={competitionId} />
      )}
    </>
  )
}

function CompetitionSchedule({ rounds }) {
  const now = new Date()
  const nextRound = rounds.find((r) => r.startTime && new Date(r.startTime) >= now)

  return (
    <div className="pvx-comp-schedule">
      <div className="pvx-comp-schedule-list">
        {rounds.map((r) => {
          const isNext = r === nextRound
          const isPast = r.startTime && new Date(r.startTime) < now
          return (
            <div
              key={r.roundNumber}
              className={`pvx-comp-schedule-item ${isNext ? 'pvx-comp-schedule-item--next' : ''} ${isPast ? 'pvx-comp-schedule-item--past' : ''}`}
            >
              <span className="pvx-comp-schedule-round">R{r.roundNumber}</span>
              <span className="pvx-comp-schedule-track">{r.track || 'TBD'}</span>
              <span className="pvx-comp-schedule-date">{formatScheduleDate(r.startTime)}</span>
              {r.isFinalized && <span className="pvx-comp-schedule-badge">Results</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RoundsView({ competitionId, finalizedRounds, selectedRound, onSelectRound, onDeselectRound }) {
  if (!finalizedRounds.length) {
    return <CompEmptyState message="No finalised rounds yet." />
  }

  return (
    <div className="pvx-comp-rounds">
      {/* Round selector pills */}
      <div className="pvx-comp-round-pills">
        {finalizedRounds.map((r) => (
          <button
            key={r.roundNumber}
            onClick={() =>
              selectedRound === r.roundNumber ? onDeselectRound() : onSelectRound(r.roundNumber)
            }
            className={`pvx-comp-round-pill ${selectedRound === r.roundNumber ? 'pvx-comp-round-pill--active' : ''}`}
          >
            <span className="pvx-comp-round-pill-num">R{r.roundNumber}</span>
            {r.track && <span className="pvx-comp-round-pill-track">{r.track}</span>}
          </button>
        ))}
      </div>

      {/* Selected round results */}
      {selectedRound ? (
        <RoundResults competitionId={competitionId} roundNumber={selectedRound} />
      ) : (
        <div className="pvx-empty">
          <p>Select a round to view results.</p>
        </div>
      )}
    </div>
  )
}
