/**
 * Styled promotion cards — grid of partner promotions (giveaways).
 *
 * @param {object} props
 * @param {object[]} props.promotions - Promotion data array (from usePromotions)
 * @param {boolean} [props.isLoading] - Loading state
 * @param {(promotionId: string) => void} props.onSelect - Called when a card is clicked
 * @param {string} [props.className] - Additional class on root container
 */

import { usePitVox } from '../../provider.jsx'
import { getPromotionStatus } from '../../hooks/usePromotions.js'
import { CompLoadingState, CompEmptyState } from '../competitions/shared.jsx'
import {
  PromotionStatusBadge,
  PromotionTypeBadge,
  promotionWindowSummary,
  GiftGlyph,
} from './shared.jsx'

export function PromotionCards({ promotions, isLoading, onSelect, className }) {
  if (isLoading) {
    return <CompLoadingState message="Loading promotions..." />
  }

  if (!promotions?.length) {
    return <CompEmptyState message="No promotions running right now." />
  }

  // Adapt the layout to the card count (mirrors the competitions page):
  // a lone promotion renders as one wide centred card instead of a third
  // of a 3-column grid; a pair caps at 2 columns.
  const countClass = promotions.length === 1
    ? 'pvx-promo-grid--single'
    : promotions.length === 2
      ? 'pvx-promo-grid--pair'
      : ''

  return (
    <div className={`pvx-promo-grid ${countClass} ${className || ''}`}>
      {promotions.map((promo) => (
        <PromotionCard key={promo.id} promo={promo} onSelect={onSelect} />
      ))}
    </div>
  )
}

export function PromotionCard({ promo, onSelect }) {
  const { cdnUrl } = usePitVox()
  const posterUrl = promo.posterCdnPath ? `${cdnUrl}/${promo.posterCdnPath}` : null
  const status = getPromotionStatus(promo)
  const summary = promotionWindowSummary(promo, status)

  return (
    <div
      className="pvx-promo-card"
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(promo.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect?.(promo.id)
        }
      }}
    >
      <div className="pvx-promo-card-poster">
        {posterUrl ? (
          <img src={posterUrl} alt={promo.title} className="pvx-promo-card-poster-img" />
        ) : (
          <div className="pvx-promo-card-poster-placeholder">
            <GiftGlyph className="pvx-promo-gift-icon" />
          </div>
        )}
      </div>
      <div className="pvx-promo-card-body">
        <div className="pvx-promo-card-badges">
          <PromotionStatusBadge promotion={promo} status={status} />
          <PromotionTypeBadge type={promo.type} />
          {promo.game && <span className="pvx-promo-game">{promo.game}</span>}
        </div>
        <h3 className="pvx-promo-card-title">{promo.title}</h3>
        {promo.prizeDescription && (
          <p className="pvx-promo-card-prize">{promo.prizeDescription}</p>
        )}
        <div className="pvx-promo-card-meta">
          {summary && <span>{summary}</span>}
          <span>
            {promo.entryCount} {promo.entryCount === 1 ? 'entry' : 'entries'}
            {promo.maxEntrants ? ` / ${promo.maxEntrants}` : ''}
          </span>
        </div>
      </div>
    </div>
  )
}
