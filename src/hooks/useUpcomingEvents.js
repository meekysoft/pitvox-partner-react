import { useMemo } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { usePitVox } from '../provider.jsx'
import { fetchCdnJson } from '../lib/cdn.js'

/**
 * Fetch upcoming competition rounds the current user is registered for.
 *
 * Composes CDN data: competitions index + entry lists per competition.
 * Returns a flat, sorted array of upcoming rounds with competition context.
 *
 * @returns {{ data: Array, isLoading: boolean }}
 */
export function useUpcomingEvents() {
  const { cdnUrl, partnerSlug, getSteamId } = usePitVox()
  const steamId = getSteamId()

  // Step 1: Fetch all partner competitions
  const { data: competitions, isLoading: compsLoading } = useQuery({
    queryKey: ['pitvox', 'competitions', partnerSlug],
    queryFn: async () => {
      const index = await fetchCdnJson(cdnUrl, 'competitions/index.json')
      if (!index?.competitions) return []
      return index.competitions.filter((c) => c.partnerSlug === partnerSlug)
    },
    staleTime: 60_000,
  })

  // Step 2: For each competition, check if user is in the entry list
  const competitionIds = competitions?.map((c) => c.id) || []

  const entryListQueries = useQueries({
    queries: competitionIds.map((id) => ({
      queryKey: ['pitvox', 'competition', partnerSlug, id, 'entrylist'],
      queryFn: () => fetchCdnJson(cdnUrl, `competitions/${partnerSlug}/${id}/entrylist.json`),
      enabled: !!steamId && competitionIds.length > 0,
      staleTime: 60_000,
    })),
  })

  const entryListsLoading = entryListQueries.some((q) => q.isLoading)

  // Step 3: Derive upcoming events
  const events = useMemo(() => {
    if (!competitions || !steamId || entryListsLoading) return []

    const now = new Date()
    const upcoming = []

    for (let i = 0; i < competitions.length; i++) {
      const comp = competitions[i]
      const entryList = entryListQueries[i]?.data

      // Check if user is registered
      const isRegistered = entryList?.drivers?.some((d) => d.steamId === steamId)
      if (!isRegistered) continue

      // Find upcoming (non-finalized) rounds with future start times
      const rounds = comp.rounds || []
      for (const round of rounds) {
        if (round.isFinalized) continue
        if (!round.startTime || new Date(round.startTime) <= now) continue

        upcoming.push({
          competitionId: comp.id,
          competitionName: comp.name,
          roundNumber: round.roundNumber,
          track: round.track || 'TBD',
          startTime: round.startTime,
        })
      }
    }

    // Sort by startTime ascending
    upcoming.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))

    // Mark the first one as "next"
    if (upcoming.length > 0) {
      upcoming[0].isNext = true
    }

    return upcoming
  }, [competitions, steamId, entryListsLoading, entryListQueries])

  return {
    data: events,
    isLoading: compsLoading || (!!steamId && entryListsLoading),
  }
}
