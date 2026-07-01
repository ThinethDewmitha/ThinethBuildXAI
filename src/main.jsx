import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'
import App from './App.jsx'

registerSW({
  immediate: true,
  onRegistered(registration) {
    if (registration) {
      console.info('BuildX AI PWA service worker registered.');
    }
  },
  onRegisterError(error) {
    console.warn('PWA service worker registration failed:', error);
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
