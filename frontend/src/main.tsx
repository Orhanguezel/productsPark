import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from '@/store';
import App from './App';
import './index.css';
import '@/styles/richtext.css';

const el = document.getElementById('root');
if (!el) throw new Error('Root element #root not found');

const root = createRoot(el);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <div data-app>
        <App />
      </div>
    </Provider>
  </React.StrictMode>,
);

// (Varsa) prerender event’in kalsın
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      document.dispatchEvent(new Event('render-event'));
    }, 2000);
  });
}
