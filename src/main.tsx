import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'
import.meta.glob('./components/nodes/core/*.tsx', { eager: true });

createRoot(document.getElementById('root')!).render(
    // <StrictMode>
        <div className='app szh-menu-container--theme-dark' style={{ width: '100vw', height: '100vh' }}>
            <App />
        </div>
    // </StrictMode>,
)
