export function AboutPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="brand-logo text-3xl leading-tight text-white sm:text-4xl lg:text-5xl">
        ChampDex
      </h1>
      <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg">
        A companion web app for Pokemon Champions.
      </p>

      <div className="mt-10 space-y-8">
        <div>
          <h2 className="text-xl font-bold text-white sm:text-2xl">Dex</h2>
          <p className="mt-2 text-sm leading-7 text-slate-400 sm:text-base">
            The Dex consists of four separate dexes: the Pokedex, MoveDex, AbilityDex and ItemDex,
            covering all Pokemon, moves, abilities and items released in Pokemon Champions.
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-400 sm:text-base">
            Search Pokemon by name or type, toggle Mega Evolutions, and tap any entry to see full
            details — stats, types, abilities, learnsets, and more.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white sm:text-2xl">Team Builder</h2>
          <p className="mt-2 text-sm leading-7 text-slate-400 sm:text-base">
            Build a team of up to 6 Pokemon, browse their stats, types, abilities and moves side by
            side, then import or export in the standard Pokemon Showdown format.
          </p>
        </div>
      </div>
    </section>
  )
}