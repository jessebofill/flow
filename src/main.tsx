import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'
import.meta.glob('./components/nodes/*.tsx', { eager: true });

createRoot(document.getElementById('root')!).render(
    // <StrictMode>
        <div className='app' style={{ width: '100vw', height: '100vh' }}>
            <App />
        </div>
    // </StrictMode>,
)
