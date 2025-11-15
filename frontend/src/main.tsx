import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { MaxUI } from '@maxhub/max-ui';
import '@maxhub/max-ui/dist/styles.css';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { initMaxBridge } from './lib/maxBridge';
import App from './App';
import './index.css';

// Инициализация MAX Bridge при загрузке
if (typeof window !== 'undefined') {
  initMaxBridge();
}

const Root = () => {
  useEffect(() => {
    // Дополнительная инициализация после монтирования
    console.log('[MAX] App initialized as MAX mini-app');
  }, []);

  return (
    <StrictMode>
      <MaxUI>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </MaxUI>
    </StrictMode>
  );
};

createRoot(document.getElementById('root')!).render(<Root />);

