import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <section className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 text-center">
      <div className="max-w-3xl">
        <h1 className="brand-logo text-3xl leading-tight text-white sm:text-4xl lg:text-5xl">
          ChampDex
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg">
          A companion app for Pokemon Champions
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            className="inline-flex rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10 hover:text-white"
            to="/dex"
          >
            Dex
          </Link>
          <Link
            className="inline-flex rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
            to="/team-planner"
          >
            Team Planner
          </Link>
        </div>
      </div>
    </section>
  )
}