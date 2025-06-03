import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
    url: 'https://keycloak-gregorydhmccm-dev.apps.rm1.0a51.p1.openshiftapps.com',
    realm: 'myrealm',
    clientId: 'my-app',
});

export default keycloak;
