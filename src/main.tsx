import {StrictMode, useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

function AppBootstrap() {
  useEffect(() => {
    // C.R.E.A.M. no debe bloquear la orientación. Si el navegador/PWA
    // tuviera un lock previo, intentamos liberarlo al iniciar.
    try {
      const orientation = window.screen?.orientation;
      orientation?.unlock?.();
    } catch {
      // Algunos navegadores móviles no exponen screen.orientation.
    }
  }, []);

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppBootstrap />
  </StrictMode>,
);
