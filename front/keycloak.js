import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
    url: 'https://keycloak-lmagniez03-dev.apps.rm2.thpm.p1.openshiftapps.com',
    realm: 'myrealm',
    clientId: 'my-app',
});

keycloak.init({
    onLoad: 'login-required',
    // désactive complètement l’iframe de vérif’ SSO
    checkLoginIframe: false,
    // empêche tout essai de silent-check-sso (pas de fichier externe)
    silentCheckSsoRedirectUri: window.location.origin + '/',
    // même intervalles à zéro pour ne rien réessayer
    checkLoginIframeInterval: 0,
})
    .then((authenticated) => {
        if (!authenticated) {
            window.location.reload();
        }
    })
    .catch((err) => {
        console.warn('Keycloak init non bloquant, on continue malgré', err);
    });

export default keycloak;
