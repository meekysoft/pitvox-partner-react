/**
 * Full promotion detail view — poster, markdown description, entry action
 * with public-display disclosure, entrants grid, and the winners panel once
 * announced.
 *
 * @param {object} props
 * @param {string} props.promotionId
 * @param {object} [props.driverData] - Data passed to the enter callback (displayName, avatarUrl)
 * @param {() => void} [props.onBack] - Called when the back link is clicked (omit to hide it)
 * @param {string} [props.className]
 */

import Markdown from 'react-markdown'
import { usePitVox } from '../../provider.jsx'
import {
  usePromotionConfig,
  usePromotionEntryList,
  getPromotionStatus,
} from '../../hooks/usePromotions.js'
import { CompLoadingState, CompEmptyState } from '../competitions/shared.jsx'
import { EnterButton } from './EnterButton.jsx'
import {
  PromotionStatusBadge,
  PromotionTypeBadge,
  formatPromotionDate,
  GiftGlyph,
} from './shared.jsx'

export function PromotionDetail({ promotionId, driverData, onBack, className }) {
  const { cdnUrl, getSteamId } = usePitVox()
  const { data: config, isLoading } = usePromotionConfig(promotionId)
  const { data: entryList } = usePromotionEntryList(promotionId)

  if (isLoading) {
    return <CompLoadingState message="Loading promotion..." />
  }

  if (!config) {
    return <CompEmptyState message="Promotion not found." />
  }

  const status = getPromotionStatus(config)
  const winners = config.winners || []
  const entrants = entryList?.entrants || []
  const entryCount = entrants.length || config.entryCount || 0
  const isFull = config.maxEntrants && entryCount >= config.maxEntrants
  const posterUrl = config.posterCdnPath ? `${cdnUrl}/${config.posterCdnPath}` : null
  const steamId = getSteamId()

  return (
    <div className={`pvx-promo-detail ${className || ''}`}>
      {onBack && (
        <button type="button" className="pvx-promo-back" onClick={onBack}>
          ← All promotions
        </button>
      )}

      {posterUrl && (
        <div className="pvx-promo-detail-poster">
          <img src={posterUrl} alt={config.title} />
        </div>
      )}

      <div className="pvx-promo-detail-header">
        <div className="pvx-promo-card-badges">
          <PromotionStatusBadge promotion={config} status={status} />
          <PromotionTypeBadge type={config.type} />
          {config.game && <span className="pvx-promo-game">{config.game}</span>}
        </div>
        <h2 className="pvx-promo-detail-title">{config.title}</h2>
        {config.prizeDescription && (
          <p className="pvx-promo-detail-prize">{config.prizeDescription}</p>
        )}
        <div className="pvx-promo-detail-meta">
          {config.opensAt && status === 'upcoming' && (
            <span>Opens {formatPromotionDate(config.opensAt)}</span>
          )}
          {config.closesAt && (
            <span>
              {status === 'open' || status === 'upcoming' ? 'Closes' : 'Closed'}{' '}
              {formatPromotionDate(config.closesAt)}
            </span>
          )}
          <span>
            {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
            {config.maxEntrants ? ` / ${config.maxEntrants}` : ''}
          </span>
        </div>
      </div>

      {/* Winners panel */}
      {winners.length > 0 && (
        <div className="pvx-promo-winners">
          <h3 className="pvx-promo-section-title">
            {winners.length === 1 ? 'Winner' : 'Winners'}
          </h3>
          <div className="pvx-promo-winners-list">
            {winners.map((w) => (
              <div key={w.steamId} className="pvx-promo-winner">
                {w.avatarUrl ? (
                  <img src={w.avatarUrl} alt="" className="pvx-promo-avatar pvx-promo-avatar--lg" />
                ) : (
                  <div className="pvx-promo-avatar pvx-promo-avatar--lg pvx-promo-avatar--placeholder">
                    <GiftGlyph className="pvx-promo-avatar-glyph" />
                  </div>
                )}
                <span className="pvx-promo-winner-name">{w.displayName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entry action */}
      <div className="pvx-promo-action">
        {status === 'upcoming' && (
          <p className="pvx-promo-action-note">
            Entries aren't open yet — come back {config.opensAt ? formatPromotionDate(config.opensAt) : 'soon'}.
          </p>
        )}

        {(status === 'closed' || status === 'winners') && (
          <p className="pvx-promo-action-note">
            Entries have closed.
            {status === 'closed' && ' Winners will be announced here once the draw is done.'}
          </p>
        )}

        {status === 'open' && !steamId && (
          <p className="pvx-promo-action-note">Sign in with Steam to enter this giveaway.</p>
        )}

        {status === 'open' && steamId && (
          <EnterButton promotionId={promotionId} driverData={driverData}>
            {({ isEntered, isLoading, enter, withdraw, error, isPowerMode, promotionUrl }) => (
              <div className="pvx-promo-action-row">
                <div className="pvx-promo-action-text">
                  {error && <p className="pvx-promo-error">{error.message}</p>}
                  <p className="pvx-promo-action-note">
                    {isEntered
                      ? "✓ You're in the draw."
                      : isFull
                        ? 'This giveaway is full.'
                        : "One click and you're in the draw."}
                  </p>
                  {!isEntered && !isFull && (
                    <p className="pvx-promo-disclosure">
                      Entering displays your Steam name and avatar publicly; winners are announced by name.
                    </p>
                  )}
                </div>
                {isPowerMode ? (
                  <button
                    type="button"
                    className={isEntered ? 'pvx-promo-withdraw-btn' : 'pvx-promo-enter-btn'}
                    onClick={isEntered ? withdraw : enter}
                    disabled={isLoading || (!isEntered && isFull)}
                  >
                    {isLoading ? 'Loading...' : isEntered ? 'Withdraw Entry' : 'Enter Giveaway'}
                  </button>
                ) : (
                  <a
                    href={promotionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pvx-promo-enter-link"
                  >
                    {isEntered ? 'View Entry' : 'Enter on PitVox'}
                  </a>
                )}
              </div>
            )}
          </EnterButton>
        )}
      </div>

      {/* Description */}
      {config.description && (
        <div className="pvx-promo-description">
          <Markdown>{config.description}</Markdown>
        </div>
      )}

      {/* Entrants grid */}
      {entrants.length > 0 && (
        <div className="pvx-promo-entrants">
          <h3 className="pvx-promo-section-title">
            Entrants <span className="pvx-promo-section-count">({entrants.length})</span>
          </h3>
          <div className="pvx-promo-entrants-grid">
            {entrants.map((entrant) => (
              <div key={entrant.steamId} className="pvx-promo-entrant">
                {entrant.avatarUrl ? (
                  <img src={entrant.avatarUrl} alt="" className="pvx-promo-avatar" />
                ) : (
                  <div className="pvx-promo-avatar pvx-promo-avatar--placeholder">
                    <GiftGlyph className="pvx-promo-avatar-glyph" />
                  </div>
                )}
                <span className="pvx-promo-entrant-name" title={entrant.displayName}>
                  {entrant.displayName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
