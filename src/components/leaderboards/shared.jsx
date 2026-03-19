import { useState, useCallback, useMemo } from 'react'

// ─── Tag filtering ──────────────────────────────────────────────

export const TAG_LABELS = {
  formula: 'Formula', gt3: 'GT3', gt2: 'GT2', gt4: 'GT4', cup: 'Cup',
  prototype: 'Prototype', rally: 'Rally', hypercar: 'Hypercar', supercar: 'Supercar',
  sports_car: 'Sports Car', hot_hatch: 'Hot Hatch', lightweight: 'Lightweight',
  '1960s': '1960s', '1970s': '1970s', '1980s': '1980s', '1990s': '1990s',
  '2000s': '2000s', '2010s': '2010s', '2020s': '2020s',
}

const TAG_CATEGORIES = [
  { id: 'class', tags: ['formula', 'gt3', 'gt2', 'gt4', 'cup', 'prototype', 'rally'] },
  { id: 'tier', tags: ['hypercar', 'supercar', 'sports_car', 'hot_hatch', 'lightweight'] },
  { id: 'era', tags: ['1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'] },
]

function getTagCategory(tag) {
  for (const cat of TAG_CATEGORIES) {
    if (cat.tags.includes(tag)) return cat.id
  }
  return 'other'
}

/**
 * Check if car tags pass the active filter.
 * OR within a category, AND across categories.
 */
export function matchesTagFilter(carTags, activeTags) {
  if (activeTags.size === 0) return true
  const byCategory = {}
  for (const tag of activeTags) {
    const cat = getTagCategory(tag)
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(tag)
  }
  for (const tags of Object.values(byCategory)) {
    if (!tags.some((t) => carTags.includes(t))) return false
  }
  return true
}

export function useTagFilter(controlledTags, onTagChange) {
  const [internalTags, setInternalTags] = useState(new Set())
  const isControlled = controlledTags !== undefined

  const activeTags = isControlled ? controlledTags : internalTags

  const toggle = useCallback((tag) => {
    const next = new Set(activeTags)
    next.has(tag) ? next.delete(tag) : next.add(tag)
    if (isControlled && onTagChange) {
      onTagChange(next)
    } else {
      setInternalTags(next)
    }
  }, [activeTags, isControlled, onTagChange])

  const clear = useCallback(() => {
    if (isControlled && onTagChange) {
      onTagChange(new Set())
    } else {
      setInternalTags(new Set())
    }
  }, [isControlled, onTagChange])

  return { activeTags, toggle, clear }
}

// ─── Sorting ────────────────────────────────────────────────────

export function useSortConfig(initial) {
  const [config, setConfig] = useState(initial)
  const onSort = useCallback((key) => {
    setConfig((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key.includes('timestamp') || key.includes('Date') ? 'desc' : 'asc' }
    )
  }, [])
  return [config, onSort]
}

export function sortEntries(items, config, getVal) {
  return [...items].sort((a, b) => {
    const aVal = getVal(a, config.key)
    const bVal = getVal(b, config.key)
    if (aVal == null && bVal == null) return 0
    if (aVal == null) return 1
    if (bVal == null) return -1
    const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal
    return config.dir === 'desc' ? -cmp : cmp
  })
}

// ─── Best sector calculation ────────────────────────────────────

export function calcBestSectors(entries, validOnly = false) {
  const list = validOnly ? entries?.filter((e) => e.isValid) : entries
  if (!list?.length) return null
  return {
    s1: Math.min(...list.map((e) => e.sector1Ms).filter(Boolean)),
    s2: Math.min(...list.map((e) => e.sector2Ms).filter(Boolean)),
    s3: Math.min(...list.map((e) => e.sector3Ms).filter(Boolean)),
  }
}

// ─── UI primitives ──────────────────────────────────────────────

export function SortIcon({ active, dir }) {
  if (!active) {
    return (
      <svg className="pvx-sort-icon pvx-sort-icon--inactive" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4M16 15l-4 4-4-4" />
      </svg>
    )
  }
  return dir === 'asc' ? (
    <svg className="pvx-sort-icon" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
  ) : (
    <svg className="pvx-sort-icon" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

export function SortTh({ label, sortKey, config, onSort, className = '' }) {
  return (
    <th
      className={`pvx-th pvx-th--sortable ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <span className="pvx-th-inner">
        {label}
        <SortIcon active={config.key === sortKey} dir={config.dir} />
      </span>
    </th>
  )
}

export function DriverCell({ userId, getUserDisplay }) {
  const { displayName, avatarUrl } = getUserDisplay(userId)
  return (
    <span className="pvx-driver">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="pvx-driver-avatar" />
      ) : (
        <span className="pvx-driver-avatar pvx-driver-avatar--placeholder" />
      )}
      <span className="pvx-driver-name">{displayName}</span>
    </span>
  )
}

export function RankBadge({ rank, podium = false }) {
  const cls = podium
    ? rank === 1 ? 'pvx-rank pvx-rank--gold' : rank === 2 ? 'pvx-rank pvx-rank--silver' : rank === 3 ? 'pvx-rank pvx-rank--bronze' : 'pvx-rank'
    : 'pvx-rank'
  return <span className={cls}>{rank}</span>
}

export function TagFilterBar({ availableTags, activeTags, onToggle, onClear }) {
  if (!availableTags || availableTags.length < 2) return null

  const groups = TAG_CATEGORIES
    .map((cat) => ({ id: cat.id, tags: cat.tags.filter((t) => availableTags.includes(t)) }))
    .filter((g) => g.tags.length > 0)

  return (
    <div className="pvx-tag-bar">
      <button
        onClick={onClear}
        className={`pvx-tag ${activeTags.size === 0 ? 'pvx-tag--active' : ''}`}
      >
        All
      </button>
      {groups.map((group, gi) => (
        <span key={group.id} className="contents">
          {gi > 0 && <span className="pvx-tag-separator" />}
          {group.tags.map((tag) => (
            <button
              key={tag}
              onClick={() => onToggle(tag)}
              className={`pvx-tag ${activeTags.has(tag) ? 'pvx-tag--active' : ''}`}
            >
              {TAG_LABELS[tag] || tag}
            </button>
          ))}
        </span>
      ))}
    </div>
  )
}

export function Breadcrumb({ segments }) {
  return (
    <nav className="pvx-breadcrumb" aria-label="Breadcrumb">
      <ol className="pvx-breadcrumb-list">
        {segments.map((seg, i) => {
          const isLast = i === segments.length - 1
          return (
            <li key={seg.key} className="pvx-breadcrumb-item">
              {i > 0 && (
                <svg className="pvx-breadcrumb-chevron" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              )}
              {!isLast && seg.onClick ? (
                <button onClick={seg.onClick} className="pvx-breadcrumb-link">{seg.label}</button>
              ) : (
                <span className="pvx-breadcrumb-current">{seg.label}</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export function EmptyState({ message }) {
  return (
    <div className="pvx-empty">
      <svg className="pvx-empty-icon" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-4.5A3.375 3.375 0 0013.125 10.875h-2.25A3.375 3.375 0 007.5 14.25v4.5" />
      </svg>
      <p>{message}</p>
    </div>
  )
}

export function LoadingState() {
  return <div className="pvx-loading">Loading...</div>
}

export function CheckIcon() {
  return (
    <svg className="pvx-icon pvx-icon--valid" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

export function CrossIcon() {
  return (
    <svg className="pvx-icon pvx-icon--invalid" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
