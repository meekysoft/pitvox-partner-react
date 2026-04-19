import { useQuery } from '@tanstack/react-query'
import { usePitVox } from '../provider.jsx'
import { fetchCdnJson } from '../lib/cdn.js'

/**
 * Fetch competitions from the CDN index.
 * In partner mode, filters to this partner's competitions.
 * In global mode (no partnerSlug), returns all competitions.
 */
export function useCompetitions() {
  const { cdnUrl, partnerSlug } = usePitVox()

  return useQuery({
    queryKey: ['pitvox', 'competitions', partnerSlug],
    queryFn: async () => {
      const index = await fetchCdnJson(cdnUrl, 'competitions/index.json')
      if (!index?.competitions) return []
      return partnerSlug
        ? index.competitions.filter((c) => c.partnerSlug === partnerSlug)
        : index.competitions
    },
    staleTime: 60_000,
  })
}

/**
 * Fetch a single competition's config from CDN.
 *
 * @param {string} competitionId
 * @param {object} [options]
 * @param {string} [options.partnerSlug] - Override partner slug (for global mode where slug comes from competition data)
 */
export function useCompetitionConfig(competitionId, options = {}) {
  const ctx = usePitVox()
  const slug = options.partnerSlug || ctx.partnerSlug

  return useQuery({
    queryKey: ['pitvox', 'competition', slug, competitionId, 'config'],
    queryFn: () => fetchCdnJson(ctx.cdnUrl, `competitions/${slug}/${competitionId}/config.json`),
    enabled: !!slug && !!competitionId,
    staleTime: 60_000,
  })
}

/**
 * Fetch championship standings from CDN.
 *
 * @param {string} competitionId
 * @param {object} [options]
 * @param {string} [options.partnerSlug] - Override partner slug
 */
export function useCompetitionStandings(competitionId, options = {}) {
  const ctx = usePitVox()
  const slug = options.partnerSlug || ctx.partnerSlug

  return useQuery({
    queryKey: ['pitvox', 'competition', slug, competitionId, 'standings'],
    queryFn: () => fetchCdnJson(ctx.cdnUrl, `competitions/${slug}/${competitionId}/standings.json`),
    enabled: !!slug && !!competitionId,
    staleTime: 60_000,
  })
}

/**
 * Fetch a single round's results from CDN.
 *
 * @param {string} competitionId
 * @param {number} roundNumber
 * @param {object} [options]
 * @param {string} [options.partnerSlug] - Override partner slug
 */
export function useCompetitionRound(competitionId, roundNumber, options = {}) {
  const ctx = usePitVox()
  const slug = options.partnerSlug || ctx.partnerSlug

  return useQuery({
    queryKey: ['pitvox', 'competition', slug, competitionId, 'round', roundNumber],
    queryFn: () => fetchCdnJson(ctx.cdnUrl, `competitions/${slug}/${competitionId}/rounds/${roundNumber}.json`),
    enabled: !!slug && !!competitionId && roundNumber != null,
    staleTime: 60_000,
  })
}

/**
 * Fetch all finalized round results in parallel.
 *
 * @param {string} competitionId
 * @param {number[]} roundNumbers - Array of round numbers to fetch
 * @param {object} [options]
 * @param {string} [options.partnerSlug] - Override partner slug
 */
export function useCompetitionAllRounds(competitionId, roundNumbers = [], options = {}) {
  const ctx = usePitVox()
  const slug = options.partnerSlug || ctx.partnerSlug

  return useQuery({
    queryKey: ['pitvox', 'competition', slug, competitionId, 'allRounds', roundNumbers],
    queryFn: async () => {
      const results = await Promise.all(
        roundNumbers.map((num) =>
          fetchCdnJson(ctx.cdnUrl, `competitions/${slug}/${competitionId}/rounds/${num}.json`)
            .catch(() => null)
        )
      )
      return results.filter(Boolean)
    },
    enabled: !!slug && !!competitionId && roundNumbers.length > 0,
    staleTime: 60_000,
  })
}

/**
 * Fetch the entry list (registered drivers) for a competition from CDN.
 *
 * @param {string} competitionId
 * @param {object} [options]
 * @param {string} [options.partnerSlug] - Override partner slug
 */
/**
 * Fetch per-driver lap detail for a round from CDN.
 * Returns null gracefully if no lap data exists (e.g. manual-import rounds).
 *
 * @param {string} competitionId
 * @param {number} roundNumber
 * @param {object} [options]
 * @param {string} [options.partnerSlug] - Override partner slug
 */
export function useCompetitionRoundLaps(competitionId, roundNumber, options = {}) {
  const ctx = usePitVox()
  const slug = options.partnerSlug || ctx.partnerSlug

  return useQuery({
    queryKey: ['pitvox', 'competition', slug, competitionId, 'round', roundNumber, 'laps'],
    queryFn: () =>
      fetchCdnJson(ctx.cdnUrl, `competitions/${slug}/${competitionId}/rounds/${roundNumber}/laps.json`)
        .catch(() => null),
    enabled: !!slug && !!competitionId && roundNumber != null,
    staleTime: 60_000,
  })
}

export function useCompetitionEntryList(competitionId, options = {}) {
  const ctx = usePitVox()
  const slug = options.partnerSlug || ctx.partnerSlug

  return useQuery({
    queryKey: ['pitvox', 'competition', slug, competitionId, 'entrylist'],
    queryFn: () => fetchCdnJson(ctx.cdnUrl, `competitions/${slug}/${competitionId}/entrylist.json`),
    enabled: !!slug && !!competitionId,
    staleTime: 60_000,
  })
}
