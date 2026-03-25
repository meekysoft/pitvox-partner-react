/**
 * Styled competition cards — Layer 1 of the competition drill-down.
 * Displays a grid of competition cards with poster, details, schedule, and registration info.
 *
 * @param {object} props
 * @param {object[]} props.competitions - Competition data array (from useCompetitions)
 * @param {boolean} [props.isLoading] - Loading state
 * @param {(competitionId: string) => void} props.onSelect - Called when a competition card is clicked
 * @param {(competitionId: string) => void} [props.onRegister] - Called when a register button is clicked (defaults to onSelect)
 * @param {string} [props.className] - Additional class on root container
 */

import { usePitVox } from '../../provider.jsx'
import { useRegistrationStatus, useRegistrationMode, useRegistrationUrl } from '../../hooks/useRegistration.js'
import {
  TypeBadge,
  InfoPill,
  formatScheduleDate,
  CompLoadingState,
  CompEmptyState,
} from './shared.jsx'

export function CompetitionCards({ competitions, isLoading, onSelect, onRegister, className }) {
  if (isLoading) {
    return <CompLoadingState message="Loading competitions..." />
  }

  if (!competitions?.length) {
    return <CompEmptyState message="No competitions available." />
  }

  return (
    <div className={`pvx-comp-grid ${className || ''}`}>
      {competitions.map((comp) => (
        <CompetitionCard key={comp.id} comp={comp} onSelect={onSelect} onRegister={onRegister || onSelect} />
      ))}
    </div>
  )
}

export function CompetitionCard({ comp, onSelect, onRegister }) {
  const { cdnUrl } = usePitVox()
  const posterUrl = comp.posterCdnPath ? `${cdnUrl}/${comp.posterCdnPath}` : null

  const reg = comp.registration
  const regCount = reg?.currentCount || 0
  const regMax = reg?.maxParticipants
  const isFull = regMax && regCount >= regMax
  const deadlinePassed = reg?.deadline && new Date(reg.deadline) < new Date()
  const regOpen = reg?.isOpen && !deadlinePassed && !isFull

  // Find next upcoming round
  const now = new Date()
  const nextRound = comp.rounds?.find((r) => r.startTime && new Date(r.startTime) >= now)
  const totalRounds = comp.rounds?.length || 0
  const finalizedCount = comp.rounds?.filter((r) => r.isFinalized).length || 0

  return (
    <div
      className="pvx-comp-card"
      onClick={() => onSelect(comp.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(comp.id) } }}
    >
      {/* Poster */}
      <div className="pvx-comp-card-poster">
        {posterUrl ? (
          <img src={posterUrl} alt={comp.name} className="pvx-comp-card-poster-img" />
        ) : (
          <div className="pvx-comp-card-poster-placeholder">
            <TrophyIcon />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="pvx-comp-card-body">
        <h3 className="pvx-comp-card-title">{comp.name}</h3>
        {comp.description && (
          <p className="pvx-comp-card-desc">{comp.description}</p>
        )}

        {/* Detail pills */}
        <div className="pvx-comp-card-pills">
          <TypeBadge type={comp.type} />
          {comp.game && <InfoPill>{comp.game.toUpperCase()}</InfoPill>}
          {comp.formatDescription && comp.formatDescription.split(', ').map((session, i) => (
            <InfoPill key={i} variant="format">{session}</InfoPill>
          ))}
        </div>

        {/* Cars */}
        {comp.carsDescription && (
          <div className="pvx-comp-card-pills">
            {comp.carsDescription.split(', ').map((car, i) => (
              <InfoPill key={i}>{car}</InfoPill>
            ))}
          </div>
        )}

        {/* Schedule summary */}
        <div className="pvx-comp-card-schedule">
          {nextRound ? (
            <span className="pvx-comp-card-schedule-next">
              <span className="pvx-comp-card-schedule-label">Next:</span>{' '}
              R{nextRound.roundNumber} {nextRound.track || 'TBD'} — {formatScheduleDate(nextRound.startTime)}
            </span>
          ) : totalRounds > 0 ? (
            <span className="pvx-comp-card-schedule-next">
              {finalizedCount}/{totalRounds} rounds completed
            </span>
          ) : null}
          {totalRounds > 0 && (
            <span className="pvx-comp-card-round-count">{totalRounds} round{totalRounds !== 1 ? 's' : ''}</span>
          )}
        </div>

        {/* Registration section with actionable button */}
        {reg && (
          <RegistrationSection
            competitionId={comp.id}
            regOpen={regOpen}
            isFull={isFull}
            deadlinePassed={deadlinePassed}
            regCount={regCount}
            regMax={regMax}
            onRegister={onRegister}
          />
        )}
      </div>
    </div>
  )
}

function RegistrationSection({ competitionId, regOpen, isFull, deadlinePassed, regCount, regMax, onRegister }) {
  const { isPowerMode } = useRegistrationMode()
  const registrationUrl = useRegistrationUrl(competitionId)
  const { data: status } = useRegistrationStatus(competitionId)
  const isRegistered = status?.isRegistered || false

  const pct = regMax ? (regCount / regMax) * 100 : 0
  const capacityVariant = pct >= 100 ? 'full' : pct >= 75 ? 'warning' : 'ok'

  return (
    <div className="pvx-comp-card-reg">
      <div className="pvx-comp-card-reg-info">
        <span className={`pvx-reg-capacity pvx-reg-capacity--${capacityVariant}`}>
          {regCount}/{regMax || '\u221E'} drivers
        </span>
      </div>
      <div className="pvx-comp-card-reg-action">
        {isRegistered ? (
          <button
            className="pvx-comp-card-reg-btn pvx-comp-card-reg-btn--registered"
            onClick={(e) => { e.stopPropagation(); onRegister(competitionId) }}
          >
            &#10003; Registered
          </button>
        ) : regOpen ? (
          isPowerMode ? (
            <button
              className="pvx-comp-card-reg-btn pvx-comp-card-reg-btn--open"
              onClick={(e) => { e.stopPropagation(); onRegister(competitionId) }}
            >
              Register
            </button>
          ) : (
            <a
              href={registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pvx-comp-card-reg-btn pvx-comp-card-reg-btn--open"
              onClick={(e) => e.stopPropagation()}
            >
              Register
            </a>
          )
        ) : (
          <span className="pvx-comp-card-reg-btn pvx-comp-card-reg-btn--closed">
            {isFull ? 'Full' : 'Closed'}
          </span>
        )}
      </div>
    </div>
  )
}

function TrophyIcon() {
  return (
    <svg className="pvx-comp-trophy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}
