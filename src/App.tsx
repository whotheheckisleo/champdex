import { AppRoutes } from './app/routes'
import { ChampdexDataProvider } from './app/champdex-data'

function App() {
  return (
    <ChampdexDataProvider>
      <AppRoutes />
    </ChampdexDataProvider>
  )
}

export default App
