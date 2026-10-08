import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';
import { loadSystemConfig } from './lib/timeZone';

// Carga temprana de la zona horaria/hora del servidor (GET /api/Config).
void loadSystemConfig();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
