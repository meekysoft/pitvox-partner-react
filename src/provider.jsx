import { createContext, useContext, useMemo } from 'react'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'

const PitVoxContext = createContext(null)

const DEFAULT_CDN_URL = 'https://cdn.pitvox.com'
const DEFAULT_API_URL = 'https://api.pitvox.com'

// Internal QueryClient for when the consumer hasn't provided one
let internalQueryClient = null

/**
 * Provider for PitVox partner SDK.
 *
 * @param {object} props
 * @param {string} props.partnerSlug - Partner identifier (e.g., 'mrgit')
 * @param {string} props.apiKey - Partner API key for pitvox-api
 * @param {string} [props.cdnUrl] - CDN base URL (default: https://cdn.pitvox.com)
 * @param {string} [props.apiUrl] - pitvox-api base URL (default: https://api.pitvox.com)
 * @param {() => string|null} [props.getSteamId] - Function returning current user's Steam ID
 * @param {import('react').ReactNode} props.children
 */
export function PitVoxPartnerProvider({
  partnerSlug,
  apiKey,
  cdnUrl = DEFAULT_CDN_URL,
  apiUrl = DEFAULT_API_URL,
  getSteamId,
  children,
}) {
  const value = useMemo(() => ({
    partnerSlug,
    apiKey,
    cdnUrl: cdnUrl.replace(/\/$/, ''),
    apiUrl: apiUrl.replace(/\/$/, ''),
    getSteamId: getSteamId || (() => null),
  }), [partnerSlug, apiKey, cdnUrl, apiUrl, getSteamId])

  // Check if a QueryClient already exists (consumer provided their own)
  let hasExistingClient = false
  try {
    useQueryClient()
    hasExistingClient = true
  } catch {
    hasExistingClient = false
  }

  if (hasExistingClient) {
    return (
      <PitVoxContext.Provider value={value}>
        {children}
      </PitVoxContext.Provider>
    )
  }

  // No existing QueryClient — provide our own
  if (!internalQueryClient) {
    internalQueryClient = new QueryClient({
      defaultOptions: {
        queries: { staleTime: 60_000 },
      },
    })
  }

  return (
    <QueryClientProvider client={internalQueryClient}>
      <PitVoxContext.Provider value={value}>
        {children}
      </PitVoxContext.Provider>
    </QueryClientProvider>
  )
}

/**
 * Access the PitVox partner context.
 * @returns {{ partnerSlug: string, apiKey: string, cdnUrl: string, apiUrl: string, getSteamId: () => string|null }}
 */
export function usePitVox() {
  const ctx = useContext(PitVoxContext)
  if (!ctx) {
    throw new Error('usePitVox must be used within a <PitVoxPartnerProvider>')
  }
  return ctx
}
