import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { useChampdexData } from '../../app/champdex-data-context'
import { Breadcrumb } from '../../components/Breadcrumb'
import {
  getDisplayDexNumber,
  getPokemonCardHoverStyle,
  getPokemonImageUrl,
  getPokemonSlug,
  getTypeChipClass,
} from '../pokedex/pokedex-utils'
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

export function MoveDetailPage() {
  const state = useChampdexData()
  const location = useLocation()
  const { moveSlug } = useParams<{ moveSlug: string }>()

  if (state.status === 'loading') {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
        Loading move details.
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

  const move = Object.values(state.data.regulationDexData.moves).find(
    (entry) => entry.inChampions && getMoveSlug(entry.name) === moveSlug,
  )

  if (!move) {
    return <Navigate replace to="/dex/moves" />
  }

  const matchingPokemon = state.data.pokemonPack.pokemon
    .filter((pokemon) => {
      const learnset = state.data.regulationDexData.learnsets[pokemon.name]

      return (learnset?.moves ?? []).some((learnsetMove) => learnsetMove.name === move.name)
    })
    .sort((left, right) => {
      if (left.dexNumber !== right.dexNumber) {
        return Number(left.dexNumber) - Number(right.dexNumber)
      }

      return left.name.localeCompare(right.name)
    })

  const movesDexBackTarget = `/dex/moves${location.search}`

  return (
    <div className="space-y-5">
      <Breadcrumb items={[{ label: 'Moves', to: movesDexBackTarget }, { label: move.name }]} />

      <section className="panel-surface rounded-2xl p-5 sm:p-6">
        <div className="space-y-5">
          <section className="panel-surface-soft rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="display-title text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  {move.name}
                </h1>
                <div className="mt-3 flex flex-wrap gap-2">
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

            <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300 sm:text-base">
              {move.description}
            </p>
          </section>

          <section className="panel-surface-soft rounded-xl p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white">Pokemon That Learn This Move</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {matchingPokemon.length} Pokemon currently learn {move.name} in Champions.
                </p>
              </div>
            </div>

            {matchingPokemon.length > 0 ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {matchingPokemon.map((pokemon) => (
                  <Link
                    className="pokemon-card-surface card-surface block rounded-3xl p-4 transition hover:-translate-y-0.5"
                    key={pokemon.id}
                    style={getPokemonCardHoverStyle(pokemon.types)}
                    to={`/dex/pokemon/${getPokemonSlug(pokemon.name)}`}
                  >
                    <article className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold tracking-[0.18em] text-slate-400">
                            #{getDisplayDexNumber(pokemon.dexNumber, pokemon.name, pokemon.tags)}
                          </div>
                          <h3 className="mt-2 text-xl font-bold text-white">{pokemon.name}</h3>
                        </div>
                        <img
                          alt={pokemon.name}
                          className="h-20 w-20 object-contain"
                          src={getPokemonImageUrl(pokemon.dexNumber, pokemon.name, pokemon.tags)}
                        />
                      </div>

                      <ul className="flex flex-wrap gap-2">
                        {pokemon.types.map((type) => (
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
            ) : (
              <p className="mt-4 text-sm text-slate-300">No Pokemon learn this move in the current data.</p>
            )}
          </section>
        </div>
      </section>
    </div>
  )
}