import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Handle Vite chunk preload errors (occurs when code is redeployed and old chunk hashes are requested by client)
window.addEventListener('vite:preloadError', (event) => {
  window.location.reload();
});

window.addEventListener('error', (e) => {
  const isChunkError = 
    e.message && 
    (e.message.includes('Failed to fetch dynamically imported module') || 
     e.message.includes('Importing a module script failed'));
  if (isChunkError) {
    window.location.reload();
  }
}, true);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
