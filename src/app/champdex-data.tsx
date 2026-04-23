import { useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { ChampdexDataContext, type DataState } from './champdex-data-context'
import { loadBootstrapData } from '../lib/data-loader'

export function ChampdexDataProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<DataState>({ status: 'loading' })

  useEffect(() => {
    let isCancelled = false

    void loadBootstrapData()
      .then((data) => {
        if (!isCancelled) {
          setState({ status: 'ready', data })
        }
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown data loading error',
          })
        }
      })

    return () => {
      isCancelled = true
    }
  }, [])

  const value = useMemo(() => state, [state])

  return <ChampdexDataContext.Provider value={value}>{children}</ChampdexDataContext.Provider>
}
