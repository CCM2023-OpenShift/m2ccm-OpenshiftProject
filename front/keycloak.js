import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
    url: 'http://keycloak-lmagniez03-dev.apps.rm2.thpm.p1.openshiftapps.com',
    realm: 'myrealm',
    clientId: 'my-app',
});

export default keycloak;
