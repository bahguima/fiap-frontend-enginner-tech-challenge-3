import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { getShellQueryClient, ShellProviders } from './components/ShellProviders';
import { bindEncryptedQueryPersistence } from './session/encryptedQueryPersistence';
import { enableBrowserMocks } from '@banking/shared/testing/browser';

const container = document.getElementById('root');
if (!container) throw new Error('#root element not found');

/**
 * Composition root da persistência: só o shell (dono do QueryClient único)
 * injeta o storage. O cache é cifrado com a chave da sessão (AES-GCM, não
 * extraível) e só é restaurado/gravado enquanto houver sessão.
 */
const resolveStorage = (): Storage | null => {
  try {
    return window.localStorage;
  } catch {
    // Storage bloqueado (modo privado/política do navegador): segue sem persistir.
    return null;
  }
};

const renderApplication = async () => {
  await enableBrowserMocks();
  bindEncryptedQueryPersistence(getShellQueryClient(), {
    storage: resolveStorage(),
  });

  createRoot(container).render(
    <StrictMode>
      <ShellProviders>
        <App />
      </ShellProviders>
    </StrictMode>
  );
};

void renderApplication();
