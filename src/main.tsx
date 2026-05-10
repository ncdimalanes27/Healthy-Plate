import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css' // This line is crucial to load Tailwind!

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)