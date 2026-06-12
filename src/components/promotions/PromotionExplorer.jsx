/**
 * Drop-in composite — complete promotions experience: card grid → detail
 * view with entry, winners, and entrants.
 *
 * Selection state is kept in the `?promotion=` URL search parameter via the
 * History API (no react-router dependency), so links are shareable and the
 * browser back button works.
 *
 * @param {object} props
 * @param {string} [props.title] - Page heading (default 'Promotions')
 * @param {object} [props.driverData] - Data passed to the enter callback (displayName, avatarUrl)
 * @param {string} [props.className]
 */

import { useState, useEffect, useCallback } from 'react'
import { usePromotions } from '../../hooks/usePromotions.js'
import { PromotionCards } from './PromotionCards.jsx'
import { PromotionDetail } from './PromotionDetail.jsx'

const PARAM = 'promotion'

function readSelectionFromUrl() {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(PARAM)
}

export function PromotionExplorer({ title = 'Promotions', driverData, className }) {
  const { data: promotions = [], isLoading } = usePromotions()
  const [selectedId, setSelectedId] = useState(readSelectionFromUrl)

  // Keep state in sync with browser back/forward
  useEffect(() => {
    const onPopState = () => setSelectedId(readSelectionFromUrl())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const select = useCallback((promotionId) => {
    setSelectedId(promotionId)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (promotionId) {
        url.searchParams.set(PARAM, promotionId)
      } else {
        url.searchParams.delete(PARAM)
      }
      window.history.pushState({}, '', url)
    }
  }, [])

  return (
    <div className={`pvx-promo-explorer ${className || ''}`}>
      {title && <h1 className="pvx-promo-explorer-title">{title}</h1>}
      {selectedId ? (
        <PromotionDetail
          promotionId={selectedId}
          driverData={driverData}
          onBack={() => select(null)}
        />
      ) : (
        <PromotionCards
          promotions={promotions}
          isLoading={isLoading}
          onSelect={select}
        />
      )}
    </div>
  )
}
