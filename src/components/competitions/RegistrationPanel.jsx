/**
 * RegistrationPanel — Form for unregistered users, entry list + unregister for registered users.
 *
 * Mirrors pitvox-website's CompetitionRegister page patterns:
 * - Auto-filled driver info (display name from entry list or getSteamId)
 * - Discord username, experience level, comments form fields
 * - Entry list with current user highlighted + "(you)" marker
 * - Unregister with confirmation step
 * - Capacity/deadline/closed state handling
 *
 * Works in both power mode (callbacks) and basic mode (link to pitvox.com).
 *
 * @param {object} props
 * @param {string} props.competitionId
 * @param {object} props.registration - Registration config from competition config (isOpen, deadline, maxParticipants, currentCount)
 * @param {string} [props.className]
 */

import { useState } from 'react'
import { usePitVox } from '../../provider.jsx'
import { useRegistrationStatus, useRegister, useWithdraw, useRegistrationMode, useRegistrationUrl } from '../../hooks/useRegistration.js'
import { useCompetitionEntryList } from '../../hooks/useCompetitions.js'
import { CompLoadingState } from './shared.jsx'

export function RegistrationPanel({ competitionId, registration, onWithdrawSuccess, className }) {
  const { getSteamId } = usePitVox()
  const { isPowerMode } = useRegistrationMode()
  const registrationUrl = useRegistrationUrl(competitionId)
  const { data: status, isLoading: statusLoading } = useRegistrationStatus(competitionId)
  const { data: entryList, isLoading: entryLoading } = useCompetitionEntryList(competitionId)
  const registerMutation = useRegister(competitionId)
  const withdrawMutation = useWithdraw(competitionId)

  const steamId = getSteamId()
  const isRegistered = status?.isRegistered || false
  const drivers = entryList?.drivers || entryList?.entries || []

  const reg = registration || {}
  // Use live entry list length (optimistically updated) rather than stale currentCount from CDN
  const currentCount = drivers.length || reg.currentCount || 0
  const isFull = reg.maxParticipants && currentCount >= reg.maxParticipants
  const deadlinePassed = reg.deadline && new Date(reg.deadline) < new Date()
  const regOpen = reg.isOpen && !deadlinePassed && !isFull

  if (statusLoading || entryLoading) {
    return <CompLoadingState message="Loading registration..." />
  }

  // Already registered — show entry list + unregister option
  if (isRegistered) {
    return (
      <div className={`pvx-reg-panel ${className || ''}`}>
        <RegisteredView
          competitionId={competitionId}
          drivers={drivers}
          steamId={steamId}
          isPowerMode={isPowerMode}
          registrationUrl={registrationUrl}
          withdrawMutation={withdrawMutation}
          onWithdrawSuccess={onWithdrawSuccess}
          registration={reg}
        />
      </div>
    )
  }

  // Registration closed / full / deadline passed
  if (!regOpen) {
    return (
      <div className={`pvx-reg-panel ${className || ''}`}>
        <div className="pvx-reg-status-msg">
          {isFull ? 'Registration is full.' : deadlinePassed ? 'Registration deadline has passed.' : 'Registration is closed.'}
        </div>
        {drivers.length > 0 && (
          <DriverList drivers={drivers} steamId={steamId} />
        )}
      </div>
    )
  }

  // No Steam ID — prompt to sign in (or link to pitvox.com in basic mode)
  if (!steamId) {
    return (
      <div className={`pvx-reg-panel ${className || ''}`}>
        {isPowerMode ? (
          <div className="pvx-reg-status-msg">Sign in to register for this competition.</div>
        ) : (
          <div className="pvx-reg-status-msg">
            <a href={registrationUrl} target="_blank" rel="noopener noreferrer" className="pvx-comp-register-link">
              Register on PitVox
            </a>
          </div>
        )}
      </div>
    )
  }

  // Open + not registered — show form (power mode) or link (basic mode)
  if (!isPowerMode) {
    return (
      <div className={`pvx-reg-panel ${className || ''}`}>
        <a href={registrationUrl} target="_blank" rel="noopener noreferrer" className="pvx-comp-register-link">
          Register on PitVox
        </a>
      </div>
    )
  }

  return (
    <div className={`pvx-reg-panel ${className || ''}`}>
      <RegistrationForm
        competitionId={competitionId}
        registerMutation={registerMutation}
        registration={reg}
      />
    </div>
  )
}

// ─── Registration Form ──────────────────────────────────────────────────────

function RegistrationForm({ competitionId, registerMutation, registration }) {
  const [discordUsername, setDiscordUsername] = useState('')
  const [experience, setExperience] = useState('intermediate')
  const [comments, setComments] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    registerMutation.mutate({
      discordUsername: discordUsername || undefined,
      experience,
      comments: comments || undefined,
    })
  }

  const reg = registration || {}
  const count = reg.currentCount || 0
  const max = reg.maxParticipants

  return (
    <form className="pvx-reg-form" onSubmit={handleSubmit}>
      <div className="pvx-reg-form-header">
        <h3 className="pvx-reg-form-title">Register</h3>
        {max && (
          <CapacityBadge count={count} max={max} />
        )}
      </div>

      {registerMutation.error && (
        <div className="pvx-reg-error">
          {registerMutation.error.message || 'Registration failed'}
        </div>
      )}

      <div className="pvx-reg-field">
        <label className="pvx-reg-label" htmlFor={`pvx-discord-${competitionId}`}>
          Discord Username <span className="pvx-reg-optional">(optional)</span>
        </label>
        <input
          id={`pvx-discord-${competitionId}`}
          type="text"
          className="pvx-reg-input"
          placeholder="e.g. username"
          value={discordUsername}
          onChange={(e) => setDiscordUsername(e.target.value)}
        />
      </div>

      <div className="pvx-reg-field">
        <label className="pvx-reg-label" htmlFor={`pvx-exp-${competitionId}`}>
          Experience Level
        </label>
        <select
          id={`pvx-exp-${competitionId}`}
          className="pvx-reg-select"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <div className="pvx-reg-field">
        <label className="pvx-reg-label" htmlFor={`pvx-comments-${competitionId}`}>
          Comments <span className="pvx-reg-optional">(optional)</span>
        </label>
        <textarea
          id={`pvx-comments-${competitionId}`}
          className="pvx-reg-textarea"
          rows={3}
          placeholder="Anything the organisers should know?"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        />
      </div>

      <div className="pvx-reg-actions">
        <button
          type="submit"
          className="pvx-comp-register-btn"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? 'Registering...' : 'Register'}
        </button>
      </div>
    </form>
  )
}

// ─── Registered View (entry list + unregister) ──────────────────────────────

function RegisteredView({ competitionId, drivers, steamId, isPowerMode, registrationUrl, withdrawMutation, onWithdrawSuccess, registration }) {
  const [confirmUnregister, setConfirmUnregister] = useState(false)

  const handleUnregister = () => {
    withdrawMutation.mutate(undefined, {
      onSuccess: () => {
        setConfirmUnregister(false)
        if (onWithdrawSuccess) onWithdrawSuccess()
      },
    })
  }

  const reg = registration || {}
  const count = drivers.length || reg.currentCount || 0
  const max = reg.maxParticipants

  return (
    <>
      <div className="pvx-reg-form-header">
        <h3 className="pvx-reg-form-title">Registered Drivers</h3>
        {max && <CapacityBadge count={count} max={max} />}
      </div>

      <DriverList drivers={drivers} steamId={steamId} />

      {withdrawMutation.error && (
        <div className="pvx-reg-error">
          {withdrawMutation.error.message || 'Withdrawal failed'}
        </div>
      )}

      {isPowerMode ? (
        <div className="pvx-reg-actions">
          {!confirmUnregister ? (
            <button
              type="button"
              className="pvx-reg-unregister-btn"
              onClick={() => setConfirmUnregister(true)}
            >
              Unregister
            </button>
          ) : (
            <div className="pvx-reg-confirm">
              <p className="pvx-reg-confirm-text">Are you sure you want to unregister?</p>
              <div className="pvx-reg-confirm-actions">
                <button
                  type="button"
                  className="pvx-reg-cancel-btn"
                  onClick={() => setConfirmUnregister(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="pvx-reg-danger-btn"
                  onClick={handleUnregister}
                  disabled={withdrawMutation.isPending}
                >
                  {withdrawMutation.isPending ? 'Unregistering...' : 'Yes, Unregister'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="pvx-reg-actions">
          <a href={registrationUrl} target="_blank" rel="noopener noreferrer" className="pvx-comp-register-link">
            Manage on PitVox
          </a>
        </div>
      )}
    </>
  )
}

// ─── Driver List with current user highlight ────────────────────────────────

function DriverList({ drivers, steamId }) {
  if (!drivers.length) {
    return <div className="pvx-reg-no-drivers">No drivers registered yet.</div>
  }

  // Sort current user to top
  const sorted = [...drivers].sort((a, b) => {
    const aIsYou = steamId && a.steamId === steamId ? -1 : 0
    const bIsYou = steamId && b.steamId === steamId ? -1 : 0
    return aIsYou - bIsYou
  })

  return (
    <div className="pvx-reg-driver-list">
      {sorted.map((driver) => {
        const isCurrentUser = steamId && (driver.steamId === steamId)
        return (
          <div
            key={driver.steamId || driver.driverId}
            className={`pvx-reg-driver-row ${isCurrentUser ? 'pvx-reg-driver-row--you' : ''}`}
          >
            {driver.avatarUrl ? (
              <img src={driver.avatarUrl} alt="" className="pvx-reg-driver-avatar" />
            ) : (
              <div className="pvx-reg-driver-avatar pvx-reg-driver-avatar--placeholder">
                {driver.displayName?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <span className="pvx-reg-driver-name">
              {driver.displayName}
              {isCurrentUser && <span className="pvx-entry-you"> (you)</span>}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Capacity Badge ─────────────────────────────────────────────────────────

function CapacityBadge({ count, max }) {
  const pct = max ? (count / max) * 100 : 0
  const variant = pct >= 100 ? 'full' : pct >= 75 ? 'warning' : 'ok'
  return (
    <span className={`pvx-reg-capacity pvx-reg-capacity--${variant}`}>
      {count}/{max} drivers
    </span>
  )
}
