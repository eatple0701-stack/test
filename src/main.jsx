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

// Offline support, in built bundles only.
//
// Not in development on purpose: a service worker caching Vite's dev modules
// fights HMR and produces the worst class of bug there is — one where the
// code on screen is not the code on disk. `npm run build && npm run preview`
// is where this gets exercised.
//
// Registered after load rather than during it. The worker's whole job is the
// *second* visit; racing it against the first paint would spend a traveller's
// bandwidth on caching while they are still waiting to see a table.
//
// See public/sw.js for what it will and will not cache — in particular, that
// nothing from Supabase is ever stored.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // An unregistered worker means no offline support, which is exactly
      // where this app was before. Nothing else should break, so nothing
      // here is worth interrupting anybody over.
    });
  });
}
