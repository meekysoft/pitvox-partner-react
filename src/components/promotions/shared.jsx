/**
 * Shared promotion UI primitives and helpers.
 */

import { getPromotionStatus, PROMOTION_STATUS_LABELS } from '../../hooks/usePromotions.js'

export const PROMOTION_TYPE_LABELS = {
  giveaway: 'Giveaway',
}

// ─── Status badge ───────────────────────────────────────────────────────────

export function PromotionStatusBadge({ promotion, status }) {
  const resolved = status || getPromotionStatus(promotion)
  return (
    <span className={`pvx-promo-status pvx-promo-status--${resolved}`}>
      {PROMOTION_STATUS_LABELS[resolved] || resolved}
    </span>
  )
}

// ─── Type badge ─────────────────────────────────────────────────────────────

export function PromotionTypeBadge({ type }) {
  return (
    <span className={`pvx-promo-type pvx-promo-type--${type || 'giveaway'}`}>
      {PROMOTION_TYPE_LABELS[type] || type}
    </span>
  )
}

// ─── Date formatting ────────────────────────────────────────────────────────

export function formatPromotionDate(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  if (isNaN(d)) return ''
  const date = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return `${date} ${time}`
}

/**
 * One-line entry-window summary appropriate to the promotion's status.
 * Returns null when there's nothing useful to say (e.g. winners announced).
 */
export function promotionWindowSummary(promotion, status) {
  const resolved = status || getPromotionStatus(promotion)
  if (resolved === 'upcoming') return `Entries open ${formatPromotionDate(promotion.opensAt)}`
  if (resolved === 'open' && promotion.closesAt) return `Entries close ${formatPromotionDate(promotion.closesAt)}`
  if (resolved === 'open') return 'Entries open now'
  if (resolved === 'closed') return `Entries closed ${formatPromotionDate(promotion.closesAt)}`
  return null
}

// ─── Gift icon (inline SVG, no icon-library dependency) ─────────────────────

export function GiftGlyph({ className }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
    </svg>
  )
}
