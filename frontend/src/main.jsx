import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './preferences.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { initializeTheme } from './zustand/useTheme'

const render = () => createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

// Mount once themes are ready; a failed theme download must not block sign-in.
initializeTheme().then(render, error => { console.error('Tema yüklenemedi', error); render(); });
