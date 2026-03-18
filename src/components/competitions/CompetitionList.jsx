import { useCompetitions } from '../../hooks/useCompetitions.js'

/**
 * Headless competition list.
 *
 * @param {object} props
 * @param {string} [props.className] - Root container class
 * @param {string} [props.itemClassName] - Each competition item class
 * @param {(comp: object) => import('react').ReactNode} [props.renderCompetition] - Custom render per competition
 * @param {() => import('react').ReactNode} [props.renderLoading]
 * @param {() => import('react').ReactNode} [props.renderEmpty]
 */
export function CompetitionList({
  className,
  itemClassName,
  renderCompetition,
  renderLoading,
  renderEmpty,
}) {
  const { data: competitions, isLoading } = useCompetitions()

  if (isLoading) {
    return renderLoading ? renderLoading() : null
  }

  if (!competitions?.length) {
    return renderEmpty ? renderEmpty() : null
  }

  if (renderCompetition) {
    return (
      <div className={className}>
        {competitions.map((comp) => (
          <div key={comp.id} className={itemClassName}>
            {renderCompetition(comp)}
          </div>
        ))}
      </div>
    )
  }

  // Default semantic markup
  return (
    <ul className={className}>
      {competitions.map((comp) => (
        <li key={comp.id} className={itemClassName}>
          <h3>{comp.name}</h3>
          {comp.description && <p>{comp.description}</p>}
          <span>{comp.type}</span>
          {comp.rounds && <span> — {comp.rounds.length} rounds</span>}
        </li>
      ))}
    </ul>
  )
}
