import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

import App from './App.tsx';
import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="183271342991-s94eau9sad7qs6pd99p5vq1b30tpqcfe.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
);
