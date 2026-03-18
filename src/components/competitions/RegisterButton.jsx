import { useRegistrationStatus, useRegister, useWithdraw } from '../../hooks/useRegistration.js'

/**
 * Headless registration toggle.
 * Provides registration state and actions via render prop or default button.
 *
 * @param {object} props
 * @param {string} props.competitionId
 * @param {object} [props.driverData] - Data to send when registering (displayName, steamId, etc.)
 * @param {string} [props.className]
 * @param {(state: {isRegistered: boolean, isLoading: boolean, register: () => void, withdraw: () => void, error: Error|null}) => import('react').ReactNode} [props.children] - Render prop
 */
export function RegisterButton({
  competitionId,
  driverData,
  className,
  children,
}) {
  const { data: status, isLoading: statusLoading } = useRegistrationStatus(competitionId)
  const registerMutation = useRegister(competitionId)
  const withdrawMutation = useWithdraw(competitionId)

  const isRegistered = status?.isRegistered || false
  const isLoading = statusLoading || registerMutation.isPending || withdrawMutation.isPending
  const error = registerMutation.error || withdrawMutation.error || null

  const register = () => {
    if (driverData) registerMutation.mutate(driverData)
  }

  const withdraw = () => {
    withdrawMutation.mutate()
  }

  // Render prop pattern
  if (typeof children === 'function') {
    return children({ isRegistered, isLoading, register, withdraw, error })
  }

  // Default button
  return (
    <button
      className={className}
      onClick={isRegistered ? withdraw : register}
      disabled={isLoading}
    >
      {isLoading ? 'Loading...' : isRegistered ? 'Withdraw' : 'Register'}
    </button>
  )
}
