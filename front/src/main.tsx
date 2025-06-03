import {createRoot} from 'react-dom/client';
import {ReactKeycloakProvider} from '@react-keycloak/web';
import keycloak from '../keycloak.js';
import App from './App.tsx';
import './index.css';

const initOptions = {
    onLoad: 'login-required',
    checkLoginIframe: false,
    pkceMethod: 'S256'
};

// Fonction de nettoyage en cas de déconnexion
keycloak.onAuthLogout = () => {
    if (keycloak.token) {
        keycloak.clearToken();
        window.location.reload();
    }
};

createRoot(document.getElementById('root')!).render(
    <ReactKeycloakProvider
        authClient={keycloak}
        initOptions={initOptions}
    >
        <App/>
    </ReactKeycloakProvider>
);
