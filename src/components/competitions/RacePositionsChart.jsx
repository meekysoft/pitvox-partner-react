/**
 * Race-positions chart for LMU competition rounds.
 *
 * Pure-SVG (no charting dependency — the SDK ships zero runtime deps). Consumes
 * the structured `positions.json` published by sync-competitions, which is
 * itself derived server-side from the LMU XML `<Score>` stream by
 * telemetry-service (so parsing logic lives in one place, not the client).
 *
 * Multi-class events render one chart per class, with positions re-ranked
 * within each class. Single-class (or class-less) events render one chart.
 *
 * @module RacePositionsChart
 */

import { useMemo, useState, useCallback } from 'react'

const DRIVER_COLOURS = [
  '#f59e0b', '#3b82f6', '#ef4444', '#10b981', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1',
  '#14b8a6', '#e11d48', '#a855f7', '#0ea5e9', '#d946ef',
  '#eab308', '#22c55e', '#f43f5e', '#2dd4bf', '#fb923c',
  '#818cf8', '#4ade80', '#f87171', '#38bdf8',
]

/**
 * Re-rank a class's drivers within the class at every timing point.
 * Input positions are overall race positions; class position at a timing
 * point = rank of the driver's overall position among same-class drivers
 * present (non-null) at that point.
 */
function rerankWithinClass(classDrivers, tpCount) {
  return classDrivers.map((d) => ({
    driverName: d.driverName,
    carClass: d.carClass,
    positions: d.positions.map((_, i) => {
      const here = classDrivers
        .filter((x) => x.positions[i] != null)
        .sort((a, b) => a.positions[i] - b.positions[i])
      const idx = here.findIndex((x) => x.driverName === d.driverName)
      return idx === -1 ? null : idx + 1
    }),
  }))
}

function ClassChart({ title, drivers, timingPoints }) {
  const [selected, setSelected] = useState(() => new Set())

  const toggle = useCallback((name) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }, [])

  const { series, maxPos } = useMemo(() => {
    let mp = 1
    const s = drivers.map((d, i) => {
      for (const p of d.positions) if (p != null && p > mp) mp = p
      return { ...d, colour: DRIVER_COLOURS[i % DRIVER_COLOURS.length] }
    })
    return { series: s, maxPos: mp }
  }, [drivers])

  if (!series.length || timingPoints.length < 2) {
    return (
      <div className="pvx-positions-empty">No position data for {title || 'this race'}.</div>
    )
  }

  // SVG geometry (viewBox units; scales responsively via width:100%).
  const W = 800
  const padL = 34
  const padR = 12
  const padT = 12
  const rowH = 22
  const padB = 34
  const plotW = W - padL - padR
  const plotH = Math.max(rowH * (maxPos - 1), rowH)
  const H = padT + plotH + padB
  const n = timingPoints.length

  const xAt = (i) => padL + (n === 1 ? 0 : (i / (n - 1)) * plotW)
  const yAt = (pos) => padT + (maxPos === 1 ? 0 : ((pos - 1) / (maxPos - 1)) * plotH)

  // Contiguous runs of non-null positions become polyline segments, so a
  // retirement / late join doesn't draw a line across the gap.
  const segmentsFor = (positions) => {
    const segs = []
    let cur = []
    positions.forEach((p, i) => {
      if (p == null) {
        if (cur.length) { segs.push(cur); cur = [] }
      } else {
        cur.push([xAt(i), yAt(p)])
      }
    })
    if (cur.length) segs.push(cur)
    return segs
  }

  const hasSelection = selected.size > 0
  // X-axis label thinning so they don't overlap on long races.
  const labelStep = Math.ceil(n / 24)

  return (
    <div className="pvx-positions-chart">
      {title && <div className="pvx-positions-title">{title}</div>}
      <svg
        className="pvx-positions-svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Race position progression${title ? ` — ${title}` : ''}`}
      >
        {/* Y gridlines + P labels */}
        {Array.from({ length: maxPos }, (_, k) => k + 1).map((pos) => (
          <g key={`y${pos}`}>
            <line
              className="pvx-positions-grid"
              x1={padL} y1={yAt(pos)} x2={W - padR} y2={yAt(pos)}
            />
            <text className="pvx-positions-axis" x={padL - 6} y={yAt(pos) + 3} textAnchor="end">
              P{pos}
            </text>
          </g>
        ))}

        {/* X labels */}
        {timingPoints.map((tp, i) => (
          (i % labelStep === 0) && (
            <text
              key={`x${i}`}
              className="pvx-positions-axis"
              x={xAt(i)}
              y={H - padB + 16}
              textAnchor="middle"
            >
              {tp.label}
            </text>
          )
        ))}

        {/* Driver lines */}
        {series.map((d) => {
          const dim = hasSelection && !selected.has(d.driverName)
          return (
            <g key={d.driverName} opacity={dim ? 0.12 : 1}>
              {segmentsFor(d.positions).map((seg, si) => (
                <polyline
                  key={si}
                  fill="none"
                  stroke={d.colour}
                  strokeWidth={dim ? 1 : 2}
                  points={seg.map(([x, y]) => `${x},${y}`).join(' ')}
                />
              ))}
              {!dim && d.positions.map((p, i) => (
                p != null && (
                  <circle key={i} cx={xAt(i)} cy={yAt(p)} r={2.4} fill={d.colour}>
                    <title>{`${d.driverName} — ${timingPoints[i].label}: P${p}`}</title>
                  </circle>
                )
              ))}
            </g>
          )
        })}
      </svg>

      <div className="pvx-positions-legend">
        {series.map((d) => {
          const dim = hasSelection && !selected.has(d.driverName)
          return (
            <button
              key={d.driverName}
              type="button"
              className="pvx-positions-legend-item"
              style={{ opacity: dim ? 0.4 : 1 }}
              onClick={() => toggle(d.driverName)}
            >
              <span className="pvx-positions-swatch" style={{ background: d.colour }} />
              {d.driverName}
            </button>
          )
        })}
        {hasSelection && (
          <button
            type="button"
            className="pvx-positions-legend-clear"
            onClick={() => setSelected(new Set())}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * @param {object} props
 * @param {object} props.positions - The positions.json payload:
 *   `{ roundNumber, timingPoints: [{lap,point,label}], drivers: [{driverName, carClass, positions: [int|null]}] }`
 */
export function RacePositionsChart({ positions }) {
  const timingPoints = positions?.timingPoints || []
  const drivers = positions?.drivers || []

  const classGroups = useMemo(() => {
    const classes = [...new Set(drivers.map((d) => d.carClass).filter(Boolean))]
    // Single class (or no class info) → one combined chart, overall positions.
    if (classes.length <= 1) {
      return [{ title: classes[0] || null, drivers }]
    }
    // Multi-class → one chart per class, re-ranked within class.
    return classes
      .sort()
      .map((cls) => ({
        title: cls,
        drivers: rerankWithinClass(
          drivers.filter((d) => d.carClass === cls),
          timingPoints.length,
        ),
      }))
  }, [drivers, timingPoints.length])

  if (!timingPoints.length || !drivers.length) {
    return <div className="pvx-positions-empty">No position data available for this race.</div>
  }

  return (
    <div className="pvx-positions">
      {classGroups.map((g, i) => (
        <ClassChart
          key={g.title || i}
          title={classGroups.length > 1 ? g.title : null}
          drivers={g.drivers}
          timingPoints={timingPoints}
        />
      ))}
    </div>
  )
}
