package fr.ccm2.dto.keycloak;

public class KeycloakRoleRepresentation {
    public String id;
    public String name;
    public String description;
    public boolean composite;
    public boolean clientRole;
    public String containerId;

    public KeycloakRoleRepresentation() {
    }

    public KeycloakRoleRepresentation(String name) {
        this.name = name;
    }
}