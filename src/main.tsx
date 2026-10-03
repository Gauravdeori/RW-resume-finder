import { StrictMode, startTransition } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initSearch } from './lib/filter';
import { I18nProvider, loadJa, storedLang } from './lib/i18n';
import './index.css';

// A transition lets React split the first render into short slices instead of one long task.
const render = () =>
  startTransition(() =>
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <I18nProvider>
          <App />
        </I18nProvider>
      </StrictMode>,
    ),
  );

// Before the first render: build the sample data (in slices, so no long task) and, only for people who chose
// Japanese, fetch its separate chunk so there is no English flash. index.html shows the top bar meanwhile.
Promise.all([initSearch(), storedLang() === 'ja' ? loadJa().catch(() => null) : null]).then(render);
