import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// The boundary sits inside StrictMode rather than around it, so it also covers
// the extra mount/unmount pass StrictMode runs in development — the pass that
// surfaces a browser-translation conflict first, and the one in the crash
// report that prompted this.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
