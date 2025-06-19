package fr.ccm2.dto.keycloak;

public class KeycloakCredentialRepresentation {
    public String type;
    public String value;
    public boolean temporary;

    public KeycloakCredentialRepresentation() {
    }

    public KeycloakCredentialRepresentation(String password, boolean temporary) {
        this.type = "password";
        this.value = password;
        this.temporary = temporary;
    }
}