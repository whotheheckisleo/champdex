import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useChampdexData } from '../../app/champdex-data-context'
import {
  getDisplayDexNumber,
  getPokemonCardHoverStyle,
  getPokemonGradientTokens,
  getPokemonImageUrl,
  getPokemonSlug,
  getTypeChipClass,
  shouldDisplayPokemon,
} from './pokedex-utils'

export function PokedexPage() {
  const state = useChampdexData()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchQuery = searchParams.get('search') ?? ''
  const activeType = searchParams.get('type') ?? 'All'
  const showOnlyMegaForms = searchParams.get('mega') === '1'

  function updateSearchParams(updates: {
    search?: string
    type?: string
    mega?: boolean
  }) {
    const nextParams = new URLSearchParams()

    const nextSearch = updates.search ?? searchQuery
    const nextType = updates.type ?? activeType
    const nextMega = updates.mega ?? showOnlyMegaForms

    if (nextSearch.trim().length > 0) {
      nextParams.set('search', nextSearch)
    }

    if (nextType !== 'All') {
      nextParams.set('type', nextType)
    }

    if (nextMega) {
      nextParams.set('mega', '1')
    }

    const current = searchParams.toString()
    const next = nextParams.toString()

    if (current !== next) {
      setSearchParams(nextParams, { replace: true })
    }
  }

  const visiblePokemon = useMemo(() => {
    if (state.status !== 'ready') {
      return []
    }

    const normalizedQuery = searchQuery.trim().toLowerCase()
    const pokemonPool = showOnlyMegaForms
      ? state.data.pokemonPack.pokemon.filter((entry) => entry.tags.includes('mega'))
      : state.data.pokemonPack.pokemon.filter((entry) => shouldDisplayPokemon(entry.tags))

    return pokemonPool
      .filter((entry) => {
        const matchesSearch =
          normalizedQuery.length === 0 || entry.name.toLowerCase().includes(normalizedQuery)
        const matchesType = activeType === 'All' || entry.types.includes(activeType)

        return matchesSearch && matchesType
      })
  }, [activeType, searchQuery, showOnlyMegaForms, state])

  const availableTypes = useMemo(() => {
    if (state.status !== 'ready') {
      return ['All']
    }

    return [
      'All',
      ...new Set(
        (showOnlyMegaForms
          ? state.data.pokemonPack.pokemon.filter((entry) => entry.tags.includes('mega'))
          : state.data.pokemonPack.pokemon.filter((entry) => shouldDisplayPokemon(entry.tags))
        ).flatMap((entry) => entry.types),
      ),
    ]
  }, [showOnlyMegaForms, state])

  const totalPokemon = useMemo(() => {
    if (state.status !== 'ready') {
      return 0
    }

    return showOnlyMegaForms
      ? state.data.pokemonPack.pokemon.filter((entry) => entry.tags.includes('mega')).length
      : state.data.pokemonPack.pokemon.filter((entry) => shouldDisplayPokemon(entry.tags)).length
  }, [showOnlyMegaForms, state])

  const dexQueryString = searchParams.toString()
  const detailSearch = dexQueryString.length > 0 ? `?${dexQueryString}` : ''
  useEffect(() => {
    const bodyStyle = document.body.style

    if (activeType === 'All') {
      bodyStyle.background = '#080d14'
      bodyStyle.backgroundAttachment = ''
      bodyStyle.backgroundRepeat = ''
      bodyStyle.backgroundSize = ''

      return () => {
        bodyStyle.background = '#080d14'
        bodyStyle.backgroundAttachment = ''
        bodyStyle.backgroundRepeat = ''
        bodyStyle.backgroundSize = ''
      }
    }

    const gradient = getPokemonGradientTokens([activeType])

    bodyStyle.backgroundColor = '#080d14'
    bodyStyle.backgroundImage = `linear-gradient(90deg, ${gradient.start}, ${gradient.end})`
    bodyStyle.backgroundAttachment = 'fixed'
    bodyStyle.backgroundRepeat = 'no-repeat'
    bodyStyle.backgroundSize = 'cover'

    return () => {
      bodyStyle.background = '#080d14'
      bodyStyle.backgroundAttachment = ''
      bodyStyle.backgroundRepeat = ''
      bodyStyle.backgroundSize = ''
    }
  }, [activeType])

  return (
    <div className="space-y-6">
      <section className="panel-surface rounded-2xl p-6 sm:p-7">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="display-title text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Pokemon Dex
            </h1>
            <p className="text-sm text-slate-300 sm:text-base">
              Browse Pokemon by name and type.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_240px_auto] xl:items-end">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-300">Search species</span>
              <input
                className="field-surface w-full rounded-2xl px-4 py-3 text-white transition placeholder:text-slate-500 focus:border-amber-500"
                onChange={(event) => updateSearchParams({ search: event.target.value })}
                placeholder="Search by name"
                type="search"
                value={searchQuery}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-300">Filter by type</span>
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

            <label className="flex xl:self-end">
              <span className="panel-surface-soft flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-200">
                <input
                  checked={showOnlyMegaForms}
                  className="h-4 w-4 accent-amber-500"
                  onChange={(event) => updateSearchParams({ mega: event.target.checked })}
                  type="checkbox"
                />
                Show Mega Forms
              </span>
            </label>
          </div>
        </div>
      </section>

      {state.status === 'loading' ? (
        <section className="panel-surface-soft rounded-2xl px-4 py-3 text-sm text-slate-300">
          Loading Pokemon.
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
            Showing {visiblePokemon.length} of {totalPokemon} Pokemon.
          </p>

          {visiblePokemon.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <p className="text-lg font-semibold text-slate-300">No Pokémon match your filters</p>
              <p className="text-sm text-slate-400">Try adjusting your search or type filter.</p>
              <button
                className="mt-2 rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
                onClick={() => updateSearchParams({ search: '', type: 'All', mega: false })}
                type="button"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visiblePokemon.map((entry) => (
                <Link
                  className="pokemon-card-surface card-surface block rounded-3xl p-4 transition hover:-translate-y-0.5"
                  key={entry.id}
                  style={getPokemonCardHoverStyle(entry.types)}
                  to={`/dex/pokemon/${getPokemonSlug(entry.name)}${detailSearch}`}
                >
                  <article className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold tracking-[0.18em] text-slate-400">
                          #{getDisplayDexNumber(entry.dexNumber, entry.name, entry.tags)}
                        </div>
                        <h2 className="mt-2 text-xl font-bold text-white">{entry.name}</h2>
                      </div>
                      <img
                        alt={entry.name}
                        className="h-20 w-20 object-contain"
                        loading="lazy"
                        src={getPokemonImageUrl(entry.dexNumber, entry.name, entry.tags)}
                      />
                    </div>
                    <ul className="flex flex-wrap gap-2">
                      {entry.types.map((type) => (
                        <li
                          className={[
                            'rounded-full border px-3 py-1 text-xs font-medium',
                            getTypeChipClass(type),
                          ].join(' ')}
                          key={type}
                        >
                          {type}
                        </li>
                      ))}
                    </ul>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  )
}