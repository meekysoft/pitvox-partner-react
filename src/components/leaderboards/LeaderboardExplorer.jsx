import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLeaderboardIndex, useTrackLeaderboard, useUserLookup, useCarMetadata } from '../../hooks/useLeaderboards.js'
import { formatTrackName } from '../../utils/format.js'
import { TracksTable } from './TracksTable.jsx'
import { CarsTable } from './CarsTable.jsx'
import { DriversTable } from './DriversTable.jsx'
import { LapHistoryTable } from './LapHistoryTable.jsx'

/**
 * Full 4-layer leaderboard explorer.
 *
 * Drop this into a route and get a complete leaderboard experience:
 * game tabs, version selector, tag filtering, sorting, breadcrumbs,
 * and drill-down from tracks → cars → drivers → lap history.
 *
 * All navigation state is managed via URL search parameters.
 *
 * @param {object} [props]
 * @param {string} [props.className] - Additional class for the root container
 * @param {string} [props.defaultGame] - Default game tab ('evo' | 'acc', default 'evo')
 * @param {string} [props.title] - Page title (default 'Leaderboards')
 */
export function LeaderboardExplorer({ className, defaultGame = 'evo', title = 'Leaderboards' }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const getUserDisplay = useUserLookup()
  const carMetadata = useCarMetadata()

  // URL-driven state
  const gameParam = searchParams.get('game') || defaultGame
  const versionParam = searchParams.get('version')
  const trackParam = searchParams.get('track')
  const carParam = searchParams.get('car')
  const driverParam = searchParams.get('driver')
  const showInvalid = searchParams.get('invalid') === 'true'

  // Data
  const {
    data: allTracks,
    isLoading: tracksLoading,
    generatedAt,
    totalLaps,
    totalUsers,
    versions,
  } = useLeaderboardIndex({ game: gameParam })

  const gameVersions = versions?.[gameParam]
  const effectiveVersion = versionParam || gameVersions?.default || null

  const tracks = useMemo(() => {
    if (!allTracks || !effectiveVersion) return allTracks || []
    return allTracks.filter((t) => t.gameVersion === effectiveVersion)
  }, [allTracks, effectiveVersion])

  const selectedTrack = useMemo(() => {
    if (!trackParam) return null
    const [id, layout] = trackParam.split('|')
    return { id, layout: layout || null, displayName: formatTrackName(id, layout, gameParam) }
  }, [trackParam, gameParam])

  const { data: trackEntries, isLoading: entriesLoading } = useTrackLeaderboard(
    selectedTrack?.id,
    selectedTrack?.layout,
    { carId: carParam, game: gameParam, gameVersion: effectiveVersion }
  )

  // Navigation
  function nav(params) { setSearchParams(params) }

  function handleGameChange(game) { nav({ game }) }

  function handleVersionChange(version) {
    const params = { game: gameParam }
    if (version && version !== gameVersions?.default) params.version = version
    nav(params)
  }

  function handleTrackSelect(trackId, layout) {
    const params = { game: gameParam, track: layout ? `${trackId}|${layout}` : trackId }
    if (versionParam) params.version = versionParam
    nav(params)
  }

  function handleCarSelect(carId) {
    const params = { game: gameParam, track: trackParam }
    if (versionParam) params.version = versionParam
    if (carId) params.car = carId
    nav(params)
  }

  function handleDriverSelect(userId) {
    const params = { game: gameParam, track: trackParam, car: carParam, driver: userId }
    if (versionParam) params.version = versionParam
    nav(params)
  }

  function handleBreadcrumbNavigate(layer) {
    const params = { game: gameParam }
    if (versionParam) params.version = versionParam
    if (layer === 'track' || layer === 'car') params.track = trackParam
    if (layer === 'car') params.car = carParam
    nav(params)
  }

  function handleToggleInvalid() {
    const params = { game: gameParam, track: trackParam, car: carParam, driver: driverParam }
    if (versionParam) params.version = versionParam
    if (!showInvalid) params.invalid = 'true'
    nav(params)
  }

  // Render current layer
  const renderLayer = () => {
    if (selectedTrack && carParam && driverParam) {
      return (
        <LapHistoryTable
          userId={driverParam}
          track={selectedTrack}
          carId={carParam}
          game={gameParam}
          gameVersion={effectiveVersion}
          showInvalid={showInvalid}
          getUserDisplay={getUserDisplay}
          onToggleInvalid={handleToggleInvalid}
          onNavigate={handleBreadcrumbNavigate}
        />
      )
    }
    if (selectedTrack && carParam) {
      return (
        <DriversTable
          entries={trackEntries || []}
          isLoading={entriesLoading}
          track={selectedTrack}
          carId={carParam}
          getUserDisplay={getUserDisplay}
          onDriverSelect={handleDriverSelect}
          onNavigate={handleBreadcrumbNavigate}
        />
      )
    }
    if (selectedTrack) {
      return (
        <CarsTable
          entries={trackEntries || []}
          isLoading={entriesLoading}
          track={selectedTrack}
          carMetadata={carMetadata}
          getUserDisplay={getUserDisplay}
          onCarSelect={handleCarSelect}
          onNavigate={handleBreadcrumbNavigate}
        />
      )
    }
    return (
      <TracksTable
        tracks={tracks}
        isLoading={tracksLoading}
        carMetadata={carMetadata}
        getUserDisplay={getUserDisplay}
        onTrackSelect={handleTrackSelect}
      />
    )
  }

  return (
    <div className={`pvx-leaderboard-explorer ${className || ''}`}>
      <div className="pvx-explorer-header">
        <h1 className="pvx-explorer-title">{title}</h1>
        <div className="pvx-explorer-stats">
          {totalLaps > 0 && <span>{totalLaps.toLocaleString()} laps</span>}
          {totalLaps > 0 && totalUsers > 0 && <span className="pvx-explorer-stats-sep">|</span>}
          {totalUsers > 0 && <span>{totalUsers.toLocaleString()} drivers</span>}
        </div>
      </div>

      <div className="pvx-explorer-controls">
        <div className="pvx-game-tabs">
          {['evo', 'acc'].map((g) => (
            <button
              key={g}
              onClick={() => handleGameChange(g)}
              className={`pvx-game-tab ${gameParam === g ? 'pvx-game-tab--active' : ''}`}
            >
              {g === 'evo' ? 'AC EVO' : 'ACC'}
            </button>
          ))}
        </div>
        {gameVersions && (
          <select
            value={effectiveVersion || ''}
            onChange={(e) => handleVersionChange(e.target.value)}
            className="pvx-version-select"
          >
            {gameVersions.available.slice().reverse().map((v) => (
              <option key={v} value={v}>
                v{v}{v === gameVersions.default ? ' (Latest)' : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {renderLayer()}

      {generatedAt && (
        <p className="pvx-data-timestamp">
          Data updated: {new Date(generatedAt).toLocaleString()}
        </p>
      )}
    </div>
  )
}
