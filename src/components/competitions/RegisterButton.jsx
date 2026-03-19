import { useRegistrationStatus, useRegister, useWithdraw, useRegistrationMode, useRegistrationUrl } from '../../hooks/useRegistration.js'

/**
 * Two-mode registration toggle.
 *
 * **Power mode** (onRegister/onWithdraw callbacks provided to provider):
 *   Renders a button that calls the registration mutations.
 *
 * **Basic mode** (no callbacks, default):
 *   Renders a link to the pitvox.com registration page.
 *
 * @param {object} props
 * @param {string} props.competitionId
 * @param {object} [props.driverData] - Data to send when registering (displayName, steamId, etc.)
 * @param {string} [props.className]
 * @param {(state: {isRegistered: boolean, isLoading: boolean, register: () => void, withdraw: () => void, error: Error|null, isPowerMode: boolean, registrationUrl: string}) => import('react').ReactNode} [props.children] - Render prop
 */
export function RegisterButton({
  competitionId,
  driverData,
  className,
  children,
}) {
  const { data: status, isLoading: statusLoading } = useRegistrationStatus(competitionId)
  const { isPowerMode } = useRegistrationMode()
  const registrationUrl = useRegistrationUrl(competitionId)
  const registerMutation = useRegister(competitionId)
  const withdrawMutation = useWithdraw(competitionId)

  const isRegistered = status?.isRegistered || false
  const isLoading = statusLoading || registerMutation.isPending || withdrawMutation.isPending
  const error = registerMutation.error || withdrawMutation.error || null

  const register = () => {
    if (isPowerMode) registerMutation.mutate(driverData || {})
  }

  const withdraw = () => {
    if (isPowerMode) withdrawMutation.mutate()
  }

  // Render prop pattern
  if (typeof children === 'function') {
    return children({ isRegistered, isLoading, register, withdraw, error, isPowerMode, registrationUrl })
  }

  // Basic mode — link to pitvox.com
  if (!isPowerMode) {
    return (
      <a
        href={registrationUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`pvx-comp-register-link ${className || ''}`}
      >
        {isRegistered ? 'View Registration' : 'Register on PitVox'}
      </a>
    )
  }

  // Power mode — button with mutations
  return (
    <button
      className={`pvx-comp-register-btn ${className || ''}`}
      onClick={isRegistered ? withdraw : register}
      disabled={isLoading}
    >
      {isLoading ? 'Loading...' : isRegistered ? 'Withdraw' : 'Register'}
    </button>
  )
}
