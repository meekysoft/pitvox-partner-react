/**
 * Weather glyph for round schedule strips. Maps the dedi-server enum values
 * (e.g. `GameModeSelectionWeatherType_CLEAR`) to a Lucide-style SVG, and adds
 * a small corner badge with a refresh glyph when behaviour is Dynamic.
 *
 * Renders nothing when `weatherType` is null/unknown, so callers can drop
 * `<WeatherIcon weatherType={...} weatherBehaviour={...} />` into a layout
 * unconditionally and degrade cleanly while older CDN snapshots roll through.
 *
 * @param {object} props
 * @param {string|null} props.weatherType - One of the GameModeSelectionWeatherType_* values.
 * @param {string|null} [props.weatherBehaviour] - GameModeSelectionWeatherBehaviour_STATIC or _DYNAMIC.
 * @param {string} [props.className] - Extra class on the wrapper.
 */

const WEATHER_LABELS = {
  GameModeSelectionWeatherType_CLEAR: 'Clear',
  GameModeSelectionWeatherType_SCATTERED_CLOUDS: 'Scattered Clouds',
  GameModeSelectionWeatherType_BROKEN_CLOUDS: 'Broken Clouds',
  GameModeSelectionWeatherType_OVERCAST: 'Overcast',
  GameModeSelectionWeatherType_DRIZZLE: 'Drizzle',
  GameModeSelectionWeatherType_DAMP: 'Damp',
  GameModeSelectionWeatherType_RAIN: 'Rain',
  GameModeSelectionWeatherType_HEAVY_RAIN: 'Heavy Rain',
}

const SVG_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function SunPaths() {
  return (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </>
  )
}

function CloudSunPaths() {
  return (
    <>
      <path d="M12 2v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="M20 12h2" />
      <path d="m19.07 4.93-1.41 1.41" />
      <path d="M15.947 12.65a4 4 0 0 0-5.925-4.128" />
      <path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" />
    </>
  )
}

function CloudyPaths() {
  return (
    <>
      <path d="M17.5 21H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
      <path d="M22 10a3 3 0 0 0-3-3h-2.207a5.502 5.502 0 0 0-10.702.5" />
    </>
  )
}

function CloudPaths() {
  return <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
}

function CloudDrizzlePaths() {
  return (
    <>
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M8 19v1" />
      <path d="M8 14v1" />
      <path d="M16 19v1" />
      <path d="M16 14v1" />
      <path d="M12 21v1" />
      <path d="M12 16v1" />
    </>
  )
}

function CloudFogPaths() {
  return (
    <>
      <path d="M16 17H7" />
      <path d="M17 21H9" />
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    </>
  )
}

function CloudRainPaths() {
  return (
    <>
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M16 14v6" />
      <path d="M8 14v6" />
      <path d="M12 16v6" />
    </>
  )
}

function CloudRainWindPaths() {
  return (
    <>
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="m9.2 22 3-7" />
      <path d="m9 13-3 7" />
      <path d="m17 13-3 7" />
    </>
  )
}

const WEATHER_PATHS = {
  GameModeSelectionWeatherType_CLEAR: SunPaths,
  GameModeSelectionWeatherType_SCATTERED_CLOUDS: CloudSunPaths,
  GameModeSelectionWeatherType_BROKEN_CLOUDS: CloudyPaths,
  GameModeSelectionWeatherType_OVERCAST: CloudPaths,
  GameModeSelectionWeatherType_DRIZZLE: CloudDrizzlePaths,
  GameModeSelectionWeatherType_DAMP: CloudFogPaths,
  GameModeSelectionWeatherType_RAIN: CloudRainPaths,
  GameModeSelectionWeatherType_HEAVY_RAIN: CloudRainWindPaths,
}

export function WeatherIcon({ weatherType, weatherBehaviour, className }) {
  const Paths = weatherType ? WEATHER_PATHS[weatherType] : null
  if (!Paths) return null

  const label = WEATHER_LABELS[weatherType] || weatherType
  const isDynamic = weatherBehaviour === 'GameModeSelectionWeatherBehaviour_DYNAMIC'
  const title = isDynamic ? `${label} · Dynamic` : label

  return (
    <span
      className={`pvx-weather-icon ${className || ''}`.trim()}
      title={title}
      aria-label={title}
    >
      <svg className="pvx-weather-icon-main" {...SVG_PROPS}>
        <Paths />
      </svg>
      {isDynamic && (
        <span className="pvx-weather-icon-dynamic" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M8 16H3v5" />
          </svg>
        </span>
      )}
    </span>
  )
}
