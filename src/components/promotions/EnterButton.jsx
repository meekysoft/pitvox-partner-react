import {
  usePromotionEntryStatus,
  useEnterPromotion,
  useWithdrawPromotionEntry,
  usePromotionMode,
  usePromotionUrl,
} from '../../hooks/usePromotions.js'

/**
 * Two-mode promotion entry toggle.
 *
 * **Power mode** (onEnterPromotion/onWithdrawPromotionEntry callbacks
 *   provided to the provider): renders a button that calls the mutations.
 *
 * **Basic mode** (no callbacks, default): renders a link to the pitvox.com
 *   promotion page.
 *
 * @param {object} props
 * @param {string} props.promotionId
 * @param {object} [props.driverData] - Data to send when entering (displayName, avatarUrl, etc.)
 * @param {string} [props.className]
 * @param {(state: {isEntered: boolean, isLoading: boolean, enter: () => void, withdraw: () => void, error: Error|null, isPowerMode: boolean, promotionUrl: string}) => import('react').ReactNode} [props.children] - Render prop
 */
export function EnterButton({
  promotionId,
  driverData,
  className,
  children,
}) {
  const { data: status, isLoading: statusLoading } = usePromotionEntryStatus(promotionId)
  const { isPowerMode } = usePromotionMode()
  const promotionUrl = usePromotionUrl(promotionId)
  const enterMutation = useEnterPromotion(promotionId)
  const withdrawMutation = useWithdrawPromotionEntry(promotionId)

  const isEntered = status?.isEntered || false
  const isLoading = statusLoading || enterMutation.isPending || withdrawMutation.isPending
  const error = enterMutation.error || withdrawMutation.error || null

  const enter = () => {
    if (isPowerMode) enterMutation.mutate(driverData || {})
  }

  const withdraw = () => {
    if (isPowerMode) withdrawMutation.mutate()
  }

  // Render prop pattern
  if (typeof children === 'function') {
    return children({ isEntered, isLoading, enter, withdraw, error, isPowerMode, promotionUrl })
  }

  // Basic mode — link to pitvox.com
  if (!isPowerMode) {
    return (
      <a
        href={promotionUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`pvx-promo-enter-link ${className || ''}`}
      >
        {isEntered ? 'View Entry' : 'Enter on PitVox'}
      </a>
    )
  }

  // Power mode — button with mutations
  return (
    <button
      className={`pvx-promo-enter-btn ${className || ''}`}
      onClick={isEntered ? withdraw : enter}
      disabled={isLoading}
    >
      {isLoading ? 'Loading...' : isEntered ? 'Withdraw Entry' : 'Enter Giveaway'}
    </button>
  )
}
