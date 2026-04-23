import { createContext, useContext } from 'react'
import type { BootstrapData } from '../lib/data-loader'

export type DataState =
  | { status: 'loading' }
  | { status: 'ready'; data: BootstrapData }
  | { status: 'error'; message: string }

export const ChampdexDataContext = createContext<DataState>({ status: 'loading' })

export function useChampdexData() {
  return useContext(ChampdexDataContext)
}