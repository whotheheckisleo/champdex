import { useMemo } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useChampdexData } from '../../app/champdex-data-context'
import { getTypeCardHoverStyle, getTypeChipClass } from '../pokedex/pokedex-utils'
import { getMoveSlug } from './move-utils'

function formatMovePower(power: number, category: string) {
  if (category === 'Status' || power === 0) {
    return '-'
  }

  return String(power)
}

function formatMoveAccuracy(accuracy: number | null) {
  return accuracy === null ? '-' : String(accuracy)
}

export function MovesDexPage() {
  const state = useChampdexData()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchQuery = searchParams.get('search') ?? ''
  const activeType = searchParams.get('type') ?? 'All'
  const activeCategory = searchParams.get('category') ?? 'All'
  const activeTarget = searchParams.get('target') ?? 'All'

  function updateSearchParams(updates: {
    search?: string
    type?: string
    category?: string
    target?: string
  }) {
    const nextParams = new URLSearchParams(searchParams)

    if (updates.search !== undefined) {
      if (updates.search.trim().length > 0) {
        nextParams.set('search', updates.search)
      } else {
        nextParams.delete('search')
      }
    }

    if (updates.type !== undefined) {
      if (updates.type !== 'All') {
        nextParams.set('type', updates.type)
      } else {
        nextParams.delete('type')
      }
    }

    if (updates.category !== undefined) {
      if (updates.category !== 'All') {
        nextParams.set('category', updates.category)
      } else {
        nextParams.delete('category')
      }
    }

    if (updates.target !== undefined) {
      if (updates.target !== 'All') {
        nextParams.set('target', updates.target)
      } else {
        nextParams.delete('target')
      }
    }

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true })
    }
  }

  const allMoves = useMemo(() => {
    if (state.status !== 'ready') {
      return []
    }

    return Object.values(state.data.regulationDexData.moves)
      .filter((move) => move.inChampions)
      .sort((left, right) => left.name.localeCompare(right.name))
  }, [state])

  const availableTypes = useMemo(
    () => ['All', ...new Set(allMoves.map((move) => move.type))],
    [allMoves],
  )

  const availableCategories = useMemo(
    () => ['All', ...new Set(allMoves.map((move) => move.category))],
    [allMoves],
  )

  const availableTargets = useMemo(
    () => ['All', ...new Set(allMoves.map((move) => move.target))],
    [allMoves],
  )

  const visibleMoves = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return allMoves.filter((move) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        move.name.toLowerCase().includes(normalizedQuery) ||
        move.description.toLowerCase().includes(normalizedQuery)
      const matchesType = activeType === 'All' || move.type === activeType
      const matchesCategory = activeCategory === 'All' || move.category === activeCategory
      const matchesTarget = activeTarget === 'All' || move.target === activeTarget

      return matchesQuery && matchesType && matchesCategory && matchesTarget
    })
  }, [activeCategory, activeTarget, activeType, allMoves, searchQuery])

  return (
    <div className="space-y-6">
      <section className="panel-surface rounded-4xl p-6 sm:p-7">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="display-title text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Moves Dex
            </h1>
            <p className="text-sm text-slate-300 sm:text-base">
              Browse legal Pokemon Champions moves and filter them by name, type, category, or target.
            </p>
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_220px_220px_220px]">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-300">Search moves</span>
              <input
                className="field-surface w-full rounded-2xl px-4 py-3 text-white transition placeholder:text-slate-500 focus:border-amber-500"
                onChange={(event) => updateSearchParams({ search: event.target.value })}
                placeholder="Search by move name or effect"
                type="search"
                value={searchQuery}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-300">Type</span>
              <select
                className="field-surface w-full rounded-2xl px-4 py-3 text-white transition focus:border-amber-500"
                onChange={(event) => updateSearchParams({ type: event.target.value })}
                value={activeType}
              >
                {availableTypes.map((type) => (
                  <option className="bg-[#0a0f18] text-white" key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-300">Category</span>
              <select
                className="field-surface w-full rounded-2xl px-4 py-3 text-white transition focus:border-amber-500"
                onChange={(event) => updateSearchParams({ category: event.target.value })}
                value={activeCategory}
              >
                {availableCategories.map((category) => (
                  <option className="bg-[#0a0f18] text-white" key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-300">Target</span>
              <select
                className="field-surface w-full rounded-2xl px-4 py-3 text-white transition focus:border-amber-500"
                onChange={(event) => updateSearchParams({ target: event.target.value })}
                value={activeTarget}
              >
                {availableTargets.map((target) => (
                  <option className="bg-[#0a0f18] text-white" key={target} value={target}>
                    {target}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      {state.status === 'loading' ? (
        <section className="panel-surface-soft rounded-2xl px-4 py-3 text-sm text-slate-300">
          Loading moves.
        </section>
      ) : null}

      {state.status === 'error' ? (
        <section className="rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-100">
          <strong>Data load failed.</strong> {state.message}
        </section>
      ) : null}

      {state.status === 'ready' ? (
        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Showing {visibleMoves.length} of {allMoves.length} legal moves.
          </p>

          {visibleMoves.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {visibleMoves.map((move) => (
                <Link
                  className="block"
                  key={move.name}
                  style={getTypeCardHoverStyle(move.type)}
                  to={`/dex/moves/${getMoveSlug(move.name)}${location.search}`}
                >
                  <article className="type-gradient-surface move-card-surface card-surface rounded-[1.75rem] p-5 transition hover:-translate-y-0.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="move-link text-xl font-bold text-white">{move.name}</h2>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span
                            className={[
                              'rounded-full border px-3 py-1 text-xs font-medium',
                              getTypeChipClass(move.type),
                            ].join(' ')}
                          >
                            {move.type}
                          </span>
                          <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300">
                            {move.category}
                          </span>
                          <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300">
                            {move.target}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-right text-xs text-slate-400">
                        <span>Power</span>
                        <span className="text-slate-200">{formatMovePower(move.power, move.category)}</span>
                        <span>Acc.</span>
                        <span className="text-slate-200">{formatMoveAccuracy(move.accuracy)}</span>
                        <span>PP</span>
                        <span className="text-slate-200">{move.pp}</span>
                        <span>Priority</span>
                        <span className="text-slate-200">{move.priority}</span>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-300">{move.description}</p>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <section className="rounded-2xl border border-slate-800 bg-[#121722] px-4 py-3 text-sm text-slate-300">
              No moves match the current filters.
            </section>
          )}
        </section>
      ) : null}
    </div>
  )
}