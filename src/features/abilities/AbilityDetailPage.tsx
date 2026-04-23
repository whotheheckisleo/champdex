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
import { getAbilitySlug } from './ability-utils'

export function AbilityDetailPage() {
  const state = useChampdexData()
  const location = useLocation()
  const { abilitySlug } = useParams<{ abilitySlug: string }>()

  if (state.status === 'loading') {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
        Loading ability details.
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

  const ability = Object.values(state.data.regulationDexData.abilities).find(
    (entry) => getAbilitySlug(entry.name) === abilitySlug,
  )

  if (!ability) {
    return <Navigate replace to="/dex/abilities" />
  }

  const matchingPokemon = state.data.pokemonPack.pokemon
    .filter((pokemon) => pokemon.abilities.includes(ability.name))
    .sort((left, right) => {
      if (left.dexNumber !== right.dexNumber) {
        return Number(left.dexNumber) - Number(right.dexNumber)
      }

      return left.name.localeCompare(right.name)
    })

  const abilityDexBackTarget = `/dex/abilities${location.search}`

  return (
    <div className="space-y-5">
      <Breadcrumb items={[{ label: 'Abilities', to: abilityDexBackTarget }, { label: ability.name }]} />

      <section className="panel-surface rounded-2xl p-5 sm:p-6">
        <div className="space-y-5">
          <section className="panel-surface-soft rounded-xl p-5">
            <h1 className="display-title text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {ability.name}
            </h1>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300 sm:text-base">
              {ability.description}
            </p>
          </section>

          <section className="panel-surface-soft rounded-xl p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white">Pokemon With This Ability</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {matchingPokemon.length} Pokemon currently have {ability.name} in Champions.
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
              <p className="mt-4 text-sm text-slate-300">No Pokemon use this ability in the current data.</p>
            )}
          </section>
        </div>
      </section>
    </div>
  )
}