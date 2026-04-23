import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useChampdexData } from '../../app/champdex-data-context'

export function ItemsDexPage() {
  const state = useChampdexData()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchQuery = searchParams.get('search') ?? ''

  const allItems = useMemo(() => {
    if (state.status !== 'ready') {
      return []
    }

    return Object.values(state.data.regulationDexData.items).sort((left, right) =>
      left.name.localeCompare(right.name),
    )
  }, [state])

  const hasAvailabilityFlags = useMemo(
    () => allItems.some((item) => item.inChampions !== undefined),
    [allItems],
  )

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

  const visibleItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return allItems
      .filter((item) => item.inChampions !== false)
      .filter((item) => {
        if (normalizedQuery.length === 0) {
          return true
        }

        return (
          item.name.toLowerCase().includes(normalizedQuery) ||
          item.description.toLowerCase().includes(normalizedQuery)
        )
      })
  }, [allItems, searchQuery])

  const totalItems = allItems.filter((item) => item.inChampions !== false).length

  return (
    <div className="space-y-6">
      <section className="panel-surface rounded-2xl p-6 sm:p-7">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="display-title text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Items Dex
            </h1>
            <p className="text-sm text-slate-300 sm:text-base">
              Browse item data from the current regulation pack.
            </p>
          </div>

          <label className="grid gap-2 xl:max-w-md">
            <span className="text-sm font-medium text-slate-300">Search items</span>
            <input
              className="field-surface w-full rounded-2xl px-4 py-3 text-white transition placeholder:text-slate-500 focus:border-amber-500"
              onChange={(event) => updateSearchQuery(event.target.value)}
              placeholder="Search by item name or effect"
              type="search"
              value={searchQuery}
            />
          </label>
        </div>
      </section>

      {state.status === 'loading' ? (
        <section className="panel-surface-soft rounded-2xl px-4 py-3 text-sm text-slate-300">
          Loading items.
        </section>
      ) : null}

      {state.status === 'error' ? (
        <section className="rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-100">
          <strong>Data load failed.</strong> {state.message}
        </section>
      ) : null}

      {state.status === 'ready' ? (
        <section className="space-y-4">
          {!hasAvailabilityFlags ? (
            <section className="rounded-2xl border border-amber-500/30 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
              This item dataset does not currently mark which entries are available in Champions, so the page may include unavailable items.
            </section>
          ) : null}

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Showing {visibleItems.length} of {totalItems} items.
          </p>

          {visibleItems.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {visibleItems.map((item) => (
                <article
                  className="card-surface rounded-xl p-5"
                  key={item.name}
                >
                  <h2 className="text-xl font-bold text-white">{item.name}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{item.description}</p>
                </article>
              ))}
            </div>
          ) : (
            <section className="rounded-2xl border border-slate-800 bg-[#121722] px-4 py-3 text-sm text-slate-300">
              No items match the current search.
            </section>
          )}
        </section>
      ) : null}
    </div>
  )
}