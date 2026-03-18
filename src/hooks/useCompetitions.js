import { useQuery } from '@tanstack/react-query'
import { usePitVox } from '../provider.jsx'
import { fetchCdnJson } from '../lib/cdn.js'

/**
 * Fetch all competitions for this partner from the CDN index.
 * Returns the partner's competitions filtered by partnerSlug.
 */
export function useCompetitions() {
  const { cdnUrl, partnerSlug } = usePitVox()

  return useQuery({
    queryKey: ['pitvox', 'competitions', partnerSlug],
    queryFn: async () => {
      const index = await fetchCdnJson(cdnUrl, 'competitions/index.json')
      if (!index?.competitions) return []
      return index.competitions.filter((c) => c.partnerSlug === partnerSlug)
    },
    staleTime: 60_000,
  })
}

/**
 * Fetch a single competition's config from CDN.
 *
 * @param {string} competitionId
 */
export function useCompetitionConfig(competitionId) {
  const { cdnUrl, partnerSlug } = usePitVox()

  return useQuery({
    queryKey: ['pitvox', 'competition', partnerSlug, competitionId, 'config'],
    queryFn: () => fetchCdnJson(cdnUrl, `competitions/${partnerSlug}/${competitionId}/config.json`),
    enabled: !!competitionId,
    staleTime: 60_000,
  })
}

/**
 * Fetch championship standings from CDN.
 *
 * @param {string} competitionId
 */
export function useCompetitionStandings(competitionId) {
  const { cdnUrl, partnerSlug } = usePitVox()

  return useQuery({
    queryKey: ['pitvox', 'competition', partnerSlug, competitionId, 'standings'],
    queryFn: () => fetchCdnJson(cdnUrl, `competitions/${partnerSlug}/${competitionId}/standings.json`),
    enabled: !!competitionId,
    staleTime: 60_000,
  })
}

/**
 * Fetch a single round's results from CDN.
 *
 * @param {string} competitionId
 * @param {number} roundNumber
 */
export function useCompetitionRound(competitionId, roundNumber) {
  const { cdnUrl, partnerSlug } = usePitVox()

  return useQuery({
    queryKey: ['pitvox', 'competition', partnerSlug, competitionId, 'round', roundNumber],
    queryFn: () => fetchCdnJson(cdnUrl, `competitions/${partnerSlug}/${competitionId}/rounds/${roundNumber}.json`),
    enabled: !!competitionId && roundNumber != null,
    staleTime: 60_000,
  })
}

/**
 * Fetch all finalized round results in parallel.
 *
 * @param {string} competitionId
 * @param {number[]} roundNumbers - Array of round numbers to fetch
 */
export function useCompetitionAllRounds(competitionId, roundNumbers = []) {
  const { cdnUrl, partnerSlug } = usePitVox()

  return useQuery({
    queryKey: ['pitvox', 'competition', partnerSlug, competitionId, 'allRounds', roundNumbers],
    queryFn: async () => {
      const results = await Promise.all(
        roundNumbers.map((num) =>
          fetchCdnJson(cdnUrl, `competitions/${partnerSlug}/${competitionId}/rounds/${num}.json`)
            .catch(() => null)
        )
      )
      return results.filter(Boolean)
    },
    enabled: !!competitionId && roundNumbers.length > 0,
    staleTime: 60_000,
  })
}

/**
 * Fetch the entry list (registered drivers) for a competition from CDN.
 *
 * @param {string} competitionId
 */
export function useCompetitionEntryList(competitionId) {
  const { cdnUrl, partnerSlug } = usePitVox()

  return useQuery({
    queryKey: ['pitvox', 'competition', partnerSlug, competitionId, 'entrylist'],
    queryFn: () => fetchCdnJson(cdnUrl, `competitions/${partnerSlug}/${competitionId}/entrylist.json`),
    enabled: !!competitionId,
    staleTime: 60_000,
  })
}
