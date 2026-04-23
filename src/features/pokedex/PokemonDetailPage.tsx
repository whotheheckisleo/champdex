import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { useChampdexData } from '../../app/champdex-data-context'
import { Breadcrumb } from '../../components/Breadcrumb'
import { getAbilitySlug } from '../abilities/ability-utils'
import { getMoveSlug } from '../moves/move-utils'
import {
  getDisplayDexNumber,
  getPokemonGradientTokens,
  getPokemonCardHoverStyle,
  getPokemonImageUrl,
  getPokemonSlug,
  getTypeCardHoverStyle,
  getTypeChipClass,
} from './pokedex-utils'

function formatMovePower(power: number, category: string) {
  if (category === 'Status' || power === 0) {
    return '-'
  }

  return String(power)
}

function formatMoveAccuracy(accuracy: number | null) {
  return accuracy === null ? '-' : `${accuracy}`
}

function getStatBarWidth(value: number) {
  return `${Math.max(0, Math.min(100, (value / 255) * 100))}%`
}

export function PokemonDetailPage() {
  const state = useChampdexData()
  const location = useLocation()
  const { pokemonSlug } = useParams<{ pokemonSlug: string }>()
  const [moveSearchQuery, setMoveSearchQuery] = useState('')
  const [activeMoveType, setActiveMoveType] = useState('All')
  const [activeMoveCategory, setActiveMoveCategory] = useState('All')

  const pokemon = state.status === 'ready'
    ? state.data.pokemonPack.pokemon.find((entry) => getPokemonSlug(entry.name) === pokemonSlug) ?? null
    : null

  useEffect(() => {
    const bodyStyle = document.body.style
    if (!pokemon) return
    const gradient = getPokemonGradientTokens(pokemon.types)
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
  }, [pokemon])

  if (state.status === 'loading') {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
        Loading Pokemon details.
      </section>
    )
  }

  if (state.status === 'error') {
    return (
      <section className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
        <strong>Data load failed.</strong> {state.message}
      </section>
    )
  }

  if (!pokemon) {
    return <Navigate replace to="/dex" />
  }

  const dexBackTarget = `/dex${location.search}`

  const learnset = state.data.regulationDexData.learnsets[pokemon.name]
  const moves = (learnset?.moves ?? [])
    .map((move) => state.data.regulationDexData.moves[move.name])
    .filter((move) => Boolean(move) && move.inChampions)
  const isMegaForm = pokemon.tags.includes('mega')
  const baseForm = state.data.pokemonPack.pokemon.find(
    (entry) => entry.dexNumber === pokemon.dexNumber && entry.tags.includes('base'),
  )
  const megaForms = state.data.pokemonPack.pokemon.filter(
    (entry) => entry.dexNumber === pokemon.dexNumber && entry.tags.includes('mega'),
  )

  const moveTypes = ['All', ...new Set(moves.map((move) => move.type))]
  const moveCategories = ['All', ...new Set(moves.map((move) => move.category))]
  const normalizedQuery = moveSearchQuery.trim().toLowerCase()
  const statRows = [
    { label: 'HP', value: pokemon.stats.hp },
    { label: 'Attack', value: pokemon.stats.attack },
    { label: 'Defense', value: pokemon.stats.defense },
    { label: 'Sp. Atk', value: pokemon.stats.specialAttack },
    { label: 'Sp. Def', value: pokemon.stats.specialDefense },
    { label: 'Speed', value: pokemon.stats.speed },
  ]
  const filteredMoves = moves.filter((move) => {
    const matchesName =
      normalizedQuery.length === 0 || move.name.toLowerCase().includes(normalizedQuery)
    const matchesType = activeMoveType === 'All' || move.type === activeMoveType
    const matchesCategory = activeMoveCategory === 'All' || move.category === activeMoveCategory

    return matchesName && matchesType && matchesCategory
  })

  useEffect(() => {
    const bodyStyle = document.body.style
    const gradient = getPokemonGradientTokens(pokemon.types)

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
  }, [pokemon.types])

  return (
    <div className="space-y-5">
      <Breadcrumb items={[{ label: 'Dex', to: dexBackTarget }, { label: pokemon.name }]} />

      <section
        className="panel-surface rounded-2xl p-5 sm:p-6"
      >
        <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <section className="panel-surface-soft rounded-xl p-5">
              <div className="text-sm font-semibold tracking-[0.18em] text-slate-400">
                #{getDisplayDexNumber(pokemon.dexNumber, pokemon.name, pokemon.tags)}
              </div>
              <div className="mt-4 flex justify-center">
                <div className="flex h-52 w-52 items-center justify-center rounded-full border border-white/6 bg-black/20 shadow-inner shadow-black/30">
                  <img
                    alt={pokemon.name}
                    className="h-44 w-44 object-contain"
                    src={getPokemonImageUrl(pokemon.dexNumber, pokemon.name, pokemon.tags)}
                  />
                </div>
              </div>
              <h1 className="display-title mt-4 text-3xl font-extrabold tracking-tight text-white">{pokemon.name}</h1>
              <ul className="mt-3 flex flex-wrap gap-2">
                {pokemon.types.map((type) => (
                  <li
                    className={[
                      'rounded-full border px-3 py-1 text-sm font-medium',
                      getTypeChipClass(type),
                    ].join(' ')}
                    key={type}
                  >
                    {type}
                  </li>
                ))}
              </ul>
            </section>

            {isMegaForm && baseForm ? (
              <section className="panel-surface-soft rounded-xl p-5">
                <h2 className="text-base font-bold text-white">Base Form</h2>
                <div className="mt-3">
                  <Link
                    className="type-gradient-surface card-surface block rounded-2xl p-4 transition hover:-translate-y-0.5"
                    style={getPokemonCardHoverStyle(baseForm.types)}
                    to={`/dex/pokemon/${getPokemonSlug(baseForm.name)}${location.search}`}
                  >
                    <article>
                      <div>
                        <div>
                          <h3 className="font-semibold text-white">{baseForm.name}</h3>
                          <ul className="mt-2 flex flex-wrap gap-2">
                            {baseForm.types.map((type) => (
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
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-slate-300">
                        Ability: {baseForm.abilities.join(', ')}
                      </div>
                    </article>
                  </Link>
                </div>
              </section>
            ) : null}

            {!isMegaForm && megaForms.length > 0 ? (
              <section className="panel-surface-soft rounded-xl p-5">
                <h2 className="text-base font-bold text-white">Mega Forms</h2>
                <div className={megaForms.length > 1 ? 'mt-3 grid gap-3 lg:grid-cols-2' : 'mt-3'}>
                  {megaForms.map((form) => (
                    <Link
                      className="type-gradient-surface card-surface block rounded-2xl p-4 transition hover:-translate-y-0.5"
                      key={form.id}
                      style={getPokemonCardHoverStyle(form.types)}
                      to={`/dex/pokemon/${getPokemonSlug(form.name)}${location.search}`}
                    >
                      <article>
                        <div>
                          <div>
                            <h3 className="font-semibold text-white">{form.name}</h3>
                            <ul className="mt-2 flex flex-wrap gap-2">
                              {form.types.map((type) => (
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
                          </div>
                        </div>
                        <div className="mt-3 text-sm text-slate-300">
                          Ability: {form.abilities.join(', ')}
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>

          <div className="space-y-5">
            <section className="panel-surface-soft rounded-xl p-5">
              <h2 className="text-base font-bold text-white">Base Stats</h2>
              <div className="mt-4 space-y-3">
                {statRows.map((stat) => (
                  <div className="stat-row" key={stat.label}>
                    <span className="stat-label">{stat.label}</span>
                    <div className="stat-meter">
                      <div
                        className="stat-meter-fill"
                        style={{ width: getStatBarWidth(stat.value) }}
                      />
                    </div>
                    <span className="stat-value">{stat.value}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel-surface-soft rounded-xl p-5">
              <h2 className="text-base font-bold text-white">Abilities</h2>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                {pokemon.abilities.map((ability) => {
                  const abilityDetail = state.data.regulationDexData.abilities[ability]

                  return (
                    <article className="ability-card-surface card-surface rounded-2xl p-4 transition hover:-translate-y-0.5" key={ability}>
                      <Link
                        className="ability-link font-semibold text-white transition"
                        to={`/dex/abilities/${getAbilitySlug(ability)}`}
                      >
                        {ability}
                      </Link>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {abilityDetail?.description ?? 'Description unavailable.'}
                      </p>
                    </article>
                  )
                })}
              </div>
            </section>

            <section className="panel-surface-soft rounded-xl p-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-white">Moveset</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Showing {filteredMoves.length} of {moves.length} legal moves in Champions.
                  </p>
                </div>
              </div>

              {moves.length > 0 ? (
                <>
                  <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_220px_220px]">
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-slate-300">Search moves</span>
                      <input
                        className="w-full rounded-2xl border border-slate-700 bg-[#0a0f18] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-amber-500"
                        onChange={(event) => setMoveSearchQuery(event.target.value)}
                        placeholder="Search by move name"
                        type="search"
                        value={moveSearchQuery}
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-slate-300">Type</span>
                      <select
                        className="w-full rounded-2xl border border-slate-700 bg-[#0a0f18] px-4 py-3 text-white outline-none transition focus:border-amber-500"
                        onChange={(event) => setActiveMoveType(event.target.value)}
                        value={activeMoveType}
                      >
                        {moveTypes.map((type) => (
                          <option className="bg-[#0a0f18] text-white" key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-slate-300">Category</span>
                      <select
                        className="w-full rounded-2xl border border-slate-700 bg-[#0a0f18] px-4 py-3 text-white outline-none transition focus:border-amber-500"
                        onChange={(event) => setActiveMoveCategory(event.target.value)}
                        value={activeMoveCategory}
                      >
                        {moveCategories.map((category) => (
                          <option className="bg-[#0a0f18] text-white" key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {filteredMoves.length > 0 ? (
                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      {filteredMoves.map((move) => (
                        <article
                          className="type-gradient-surface move-card-surface card-surface rounded-2xl p-4"
                          key={move.name}
                          style={getTypeCardHoverStyle(move.type)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <Link
                                className="move-link font-semibold text-white transition"
                                to={`/dex/moves/${getMoveSlug(move.name)}`}
                              >
                                {move.name}
                              </Link>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className={[
                                  'rounded-full border px-3 py-1 text-xs font-medium',
                                  getTypeChipClass(move.type),
                                ].join(' ')}>
                                  {move.type}
                                </span>
                                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                                  {move.category}
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
                          <p className="mt-3 text-sm leading-6 text-slate-300">{move.description}</p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-slate-300">
                      No moves match the current filters.
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-4 text-sm text-slate-300">No learnset data available for this Pokemon yet.</p>
              )}
            </section>
          </div>
        </div>
      </section>
    </div>
  )
}