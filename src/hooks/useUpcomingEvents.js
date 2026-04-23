import { useMemo } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { usePitVox } from '../provider.jsx'
import { fetchCdnJson } from '../lib/cdn.js'

/**
 * Fetch upcoming competition rounds the current user is registered for.
 *
 * Composes CDN data: competitions index + entry lists per competition.
 * Optionally fetches server passwords via onFetchServerPassword callback.
 * Returns a flat, sorted array of upcoming rounds with competition context.
 *
 * @returns {{ data: Array, isLoading: boolean }}
 */
export function useUpcomingEvents() {
  const { cdnUrl, partnerSlug, getSteamId, onFetchServerPassword } = usePitVox()
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

  // Step 3: Derive upcoming events (without passwords)
  const upcomingEvents = useMemo(() => {
    if (!competitions || !steamId || entryListsLoading) return []

    const now = new Date()
    const upcoming = []

    for (let i = 0; i < competitions.length; i++) {
      const comp = competitions[i]
      const entryList = entryListQueries[i]?.data

      // Check if user is registered
      const isRegistered = entryList?.drivers?.some((d) => d.steamId === steamId)
      if (!isRegistered) continue

      // Find upcoming or live rounds
      const isHotlap = comp.type === 'hotlap'
      const rounds = comp.rounds || []
      for (const round of rounds) {
        // For hotlap, isFinalized is set incrementally for CDN updates,
        // so only skip if the server has actually stopped
        if (round.isFinalized && (!isHotlap || round.dediStatus === 'completed')) continue

        const isLive = round.dediStatus === 'running' || round.dediStatus === 'provisioning'
        const isScheduled = round.dediStatus === 'scheduled'
        const isFuture = round.startTime && new Date(round.startTime) > now
        const isDediServer = isLive || isScheduled || round.dediServerAddress

        if (!isLive && !isFuture && !isDediServer) continue

        upcoming.push({
          competitionId: comp.id,
          competitionName: comp.name,
          roundNumber: round.roundNumber,
          track: round.track || 'TBD',
          startTime: round.startTime,
          dediStatus: round.dediStatus || null,
          dediServerAddress: round.dediServerAddress || null,
        })
      }
    }

    // Sort: live rounds first, then by start time
    upcoming.sort((a, b) => {
      const aLive = a.dediStatus === 'running' || a.dediStatus === 'provisioning'
      const bLive = b.dediStatus === 'running' || b.dediStatus === 'provisioning'
      if (aLive && !bLive) return -1
      if (!aLive && bLive) return 1
      return new Date(a.startTime) - new Date(b.startTime)
    })

    // Mark the first one as "next"
    if (upcoming.length > 0) {
      upcoming[0].isNext = true
    }

    return upcoming
  }, [competitions, steamId, entryListsLoading, entryListQueries])

  // Step 4: Fetch server passwords for each upcoming event
  // Each unique competitionId+roundNumber gets its own query
  const serverInfoQueries = useQueries({
    queries: upcomingEvents.map((event) => ({
      queryKey: ['pitvox', 'serverInfo', event.competitionId, event.roundNumber],
      queryFn: () => onFetchServerPassword(event.competitionId, event.roundNumber),
      enabled: !!onFetchServerPassword && upcomingEvents.length > 0,
      staleTime: 5 * 60_000, // 5 minutes
      retry: false,
    })),
  })

  // Step 5: Merge server info into events
  const events = useMemo(() => {
    if (!upcomingEvents.length) return []
    if (!onFetchServerPassword) return upcomingEvents

    return upcomingEvents.map((event, i) => {
      const serverInfo = serverInfoQueries[i]?.data
      if (!serverInfo?.success) return event
      return {
        ...event,
        serverAddress: serverInfo.serverAddress || null,
        serverPassword: serverInfo.serverPassword || null,
      }
    })
  }, [upcomingEvents, onFetchServerPassword, serverInfoQueries])

  return {
    data: events,
    isLoading: compsLoading || (!!steamId && entryListsLoading),
  }
}
