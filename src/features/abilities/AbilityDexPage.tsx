import { useMemo } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useChampdexData } from '../../app/champdex-data-context'
import { getAbilitySlug } from './ability-utils'

export function AbilityDexPage() {
  const state = useChampdexData()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchQuery = searchParams.get('search') ?? ''

  function updateSearchQuery(nextQuery: string) {
    const nextParams = new URLSearchParams(searchParams)

    if (nextQuery.trim().length > 0) {
      nextParams.set('search', nextQuery)
    } else {
      nextParams.delete('search')
    }

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true })
    }
  }

  const visibleAbilities = useMemo(() => {
    if (state.status !== 'ready') {
      return []
    }

    const normalizedQuery = searchQuery.trim().toLowerCase()

    return Object.values(state.data.regulationDexData.abilities)
      .sort((left, right) => left.name.localeCompare(right.name))
      .filter((ability) => {
        if (normalizedQuery.length === 0) {
          return true
        }

        return (
          ability.name.toLowerCase().includes(normalizedQuery) ||
          ability.description.toLowerCase().includes(normalizedQuery)
        )
      })
  }, [searchQuery, state])

  const totalAbilities =
    state.status === 'ready' ? Object.keys(state.data.regulationDexData.abilities).length : 0

  return (
    <div className="space-y-6">
      <section className="panel-surface rounded-2xl p-6 sm:p-7">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="display-title text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Ability Dex
            </h1>
            <p className="text-sm text-slate-300 sm:text-base">
              Browse Pokemon Champions abilities and their descriptions.
            </p>
          </div>

          <label className="grid gap-2 xl:max-w-md">
            <span className="text-sm font-medium text-slate-300">Search abilities</span>
            <input
              className="field-surface w-full rounded-2xl px-4 py-3 text-white transition placeholder:text-slate-500 focus:border-amber-500"
              onChange={(event) => updateSearchQuery(event.target.value)}
              placeholder="Search by ability name or effect"
              type="search"
              value={searchQuery}
            />
          </label>
        </div>
      </section>

      {state.status === 'loading' ? (
        <section className="panel-surface-soft rounded-2xl px-4 py-3 text-sm text-slate-300">
          Loading abilities.
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
            Showing {visibleAbilities.length} of {totalAbilities} abilities.
          </p>

          {visibleAbilities.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {visibleAbilities.map((ability) => (
                <Link
                  className="block"
                  key={ability.name}
                  to={`/dex/abilities/${getAbilitySlug(ability.name)}${location.search}`}
                >
                  <article className="ability-card-surface card-surface flex h-96 flex-col overflow-hidden rounded-xl p-5 transition hover:-translate-y-0.5">
                    <h2 className="ability-link text-xl font-bold text-white">{ability.name}</h2>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{ability.description}</p>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <section className="rounded-2xl border border-slate-800 bg-[#121722] px-4 py-3 text-sm text-slate-300">
              No abilities match the current search.
            </section>
          )}
        </section>
      ) : null}
    </div>
  )
}