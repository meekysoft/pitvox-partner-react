import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usePitVox } from '../provider.jsx'
import { fetchCdnJson } from '../lib/cdn.js'
import { useUserLookup } from './useLeaderboards.js'

/**
 * Derive a promotion's lifecycle status from the clock. The CDN never
 * carries a computed open/closed flag — clients derive it, so CDN files
 * can't go stale between syncs.
 *
 * @param {object} promotion - Promotion data (index entry or config)
 * @param {Date} [now]
 * @returns {'upcoming'|'open'|'closed'|'winners'}
 */
export function getPromotionStatus(promotion, now = new Date()) {
  if (promotion.winnersAnnouncedAt || promotion.winners?.length) return 'winners'
  if (promotion.opensAt && now < new Date(promotion.opensAt)) return 'upcoming'
  if (promotion.closesAt && now >= new Date(promotion.closesAt)) return 'closed'
  return 'open'
}

export const PROMOTION_STATUS_LABELS = {
  upcoming: 'Opens soon',
  open: 'Open',
  closed: 'Closed',
  winners: 'Winners announced',
}

/**
 * Fetch promotions from the CDN index.
 * In partner mode, filters to this partner's promotions.
 * In global mode (no partnerSlug), returns all promotions.
 */
export function usePromotions() {
  const { cdnUrl, partnerSlug } = usePitVox()

  return useQuery({
    queryKey: ['pitvox', 'promotions', partnerSlug],
    queryFn: async () => {
      const index = await fetchCdnJson(cdnUrl, 'promotions/index.json')
      if (!index?.promotions) return []
      return partnerSlug
        ? index.promotions.filter((p) => p.partnerSlug === partnerSlug)
        : index.promotions
    },
    staleTime: 60_000,
  })
}

/**
 * Fetch a single promotion's config from CDN.
 *
 * @param {string} promotionId
 * @param {object} [options]
 * @param {string} [options.partnerSlug] - Override partner slug (for global mode)
 */
export function usePromotionConfig(promotionId, options = {}) {
  const ctx = usePitVox()
  const slug = options.partnerSlug || ctx.partnerSlug

  return useQuery({
    queryKey: ['pitvox', 'promotion', slug, promotionId, 'config'],
    queryFn: () => fetchCdnJson(ctx.cdnUrl, `promotions/${slug}/${promotionId}/config.json`),
    enabled: !!slug && !!promotionId,
    staleTime: 60_000,
  })
}

/**
 * Fetch the entry list for a promotion from CDN (null when no entries yet).
 *
 * @param {string} promotionId
 * @param {object} [options]
 * @param {string} [options.partnerSlug] - Override partner slug
 */
export function usePromotionEntryList(promotionId, options = {}) {
  const ctx = usePitVox()
  const slug = options.partnerSlug || ctx.partnerSlug

  return useQuery({
    queryKey: ['pitvox', 'promotion', slug, promotionId, 'entrylist'],
    queryFn: () => fetchCdnJson(ctx.cdnUrl, `promotions/${slug}/${promotionId}/entrylist.json`),
    enabled: !!slug && !!promotionId,
    staleTime: 60_000,
  })
}

/**
 * Check if the current user (via getSteamId) has entered a promotion.
 * Uses the CDN entry list for a lightweight check.
 *
 * @param {string} promotionId
 */
export function usePromotionEntryStatus(promotionId) {
  const { cdnUrl, partnerSlug, getSteamId } = usePitVox()
  const steamId = getSteamId()

  return useQuery({
    queryKey: ['pitvox', 'promotionEntry', partnerSlug, promotionId, steamId],
    queryFn: async () => {
      const data = await fetchCdnJson(cdnUrl, `promotions/${partnerSlug}/${promotionId}/entrylist.json`)
      if (!data) return { isEntered: false, entryList: null }
      const isEntered = !!steamId && data.entrants?.some((e) => e.steamId === steamId)
      return { isEntered, entryList: data }
    },
    enabled: !!promotionId,
    staleTime: 60_000,
  })
}

/**
 * Enter the current user into a promotion.
 * Delegates to the onEnterPromotion callback provided to PitVoxPartnerProvider.
 *
 * @param {string} promotionId
 */
export function useEnterPromotion(promotionId) {
  const { onEnterPromotion, partnerSlug, getSteamId } = usePitVox()
  const queryClient = useQueryClient()
  const getUserDisplay = useUserLookup()

  return useMutation({
    mutationFn: (driverData) => {
      if (!onEnterPromotion) {
        throw new Error(
          'No onEnterPromotion callback provided to PitVoxPartnerProvider. ' +
          'Provide onEnterPromotion for in-app entry, or use usePromotionUrl() to link to pitvox.com.'
        )
      }
      return onEnterPromotion(promotionId, driverData)
    },
    onSuccess: () => {
      const steamId = getSteamId()

      // Optimistically mark user as entered (CDN won't reflect the change immediately)
      queryClient.setQueriesData(
        { queryKey: ['pitvox', 'promotionEntry', partnerSlug, promotionId] },
        (old) => old ? { ...old, isEntered: true } : { isEntered: true, entryList: null },
      )

      // Optimistically add user to entry list cache
      if (steamId) {
        const userInfo = getUserDisplay(steamId)
        const newEntry = {
          steamId,
          displayName: userInfo.displayName,
          avatarUrl: userInfo.avatarUrl,
        }
        queryClient.setQueriesData(
          { queryKey: ['pitvox', 'promotion', partnerSlug, promotionId, 'entrylist'] },
          (old) => {
            if (!old) return { entrants: [newEntry], count: 1 }
            const exists = old.entrants?.some((e) => e.steamId === steamId)
            if (exists) return old
            const entrants = [...(old.entrants || []), newEntry]
            return { ...old, entrants, count: entrants.length }
          },
        )
      }
    },
  })
}

/**
 * Withdraw the current user's entry from a promotion (while entries are open).
 * Delegates to the onWithdrawPromotionEntry callback provided to PitVoxPartnerProvider.
 *
 * @param {string} promotionId
 */
export function useWithdrawPromotionEntry(promotionId) {
  const { onWithdrawPromotionEntry, partnerSlug, getSteamId } = usePitVox()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (steamId) => {
      if (!onWithdrawPromotionEntry) {
        throw new Error(
          'No onWithdrawPromotionEntry callback provided to PitVoxPartnerProvider. ' +
          'Provide onWithdrawPromotionEntry for in-app withdrawal, or use usePromotionUrl() to link to pitvox.com.'
        )
      }
      const id = steamId || getSteamId()
      if (!id) throw new Error('No Steam ID available')
      return onWithdrawPromotionEntry(promotionId, id)
    },
    onSuccess: () => {
      const steamId = getSteamId()

      // Optimistically mark user as not entered
      queryClient.setQueriesData(
        { queryKey: ['pitvox', 'promotionEntry', partnerSlug, promotionId] },
        (old) => old ? { ...old, isEntered: false } : { isEntered: false, entryList: null },
      )

      // Optimistically remove user from entry list cache
      if (steamId) {
        queryClient.setQueriesData(
          { queryKey: ['pitvox', 'promotion', partnerSlug, promotionId, 'entrylist'] },
          (old) => {
            if (!old?.entrants) return old
            const entrants = old.entrants.filter((e) => e.steamId !== steamId)
            return { ...old, entrants, count: entrants.length }
          },
        )
      }
    },
  })
}

/**
 * Check whether promotions are in power mode (callbacks provided) or basic
 * mode (link to pitvox.com).
 *
 * @returns {{ isPowerMode: boolean, isBasicMode: boolean }}
 */
export function usePromotionMode() {
  const { onEnterPromotion, onWithdrawPromotionEntry } = usePitVox()
  const isPowerMode = !!(onEnterPromotion && onWithdrawPromotionEntry)
  return { isPowerMode, isBasicMode: !isPowerMode }
}

/**
 * Get the pitvox.com page URL for a promotion (basic mode).
 *
 * @param {string} promotionId
 * @returns {string}
 */
export function usePromotionUrl(promotionId) {
  const { pitvoxUrl, partnerSlug } = usePitVox()
  return `${pitvoxUrl}/p/${partnerSlug}/promotions/${promotionId}`
}
