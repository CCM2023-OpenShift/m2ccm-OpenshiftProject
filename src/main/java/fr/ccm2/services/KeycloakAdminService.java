package fr.ccm2.services;

import fr.ccm2.resources.KeycloakAdminResource;
import fr.ccm2.dto.keycloak.KeycloakTokenResponse;
import fr.ccm2.dto.keycloak.KeycloakUserResponse;
import fr.ccm2.dto.user.UserDTO;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.rest.client.inject.RestClient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@ApplicationScoped
public class KeycloakAdminService {

    private static final Logger LOGGER = Logger.getLogger(KeycloakAdminService.class.getName());

    @Inject
    @RestClient
    KeycloakAdminResource keycloakClient;

    @ConfigProperty(name = "keycloak.admin.realm")
    String adminRealm;

    @ConfigProperty(name = "keycloak.admin.client-id")
    String adminClientId;

    // Pour Service Account : client-secret au lieu de username/password
    @ConfigProperty(name = "keycloak.admin.client-secret", defaultValue = "")
    String adminClientSecret;

    // Fallback vers username/password si pas de service account
    @ConfigProperty(name = "keycloak.admin.username", defaultValue = "")
    String adminUsername;

    @ConfigProperty(name = "keycloak.admin.password", defaultValue = "")
    String adminPassword;

    private String cachedAdminToken;
    private LocalDateTime tokenExpiry;

    private String getValidAdminToken() {
        try {
            if (cachedAdminToken != null && tokenExpiry != null &&
                    LocalDateTime.now().isBefore(tokenExpiry.minusMinutes(5))) {
                return cachedAdminToken;
            }

            LOGGER.info("🔍 Requesting new Keycloak admin token for realm: " + adminRealm);

            KeycloakTokenResponse tokenResponse;

            if (adminClientSecret != null && !adminClientSecret.isEmpty()) {
                LOGGER.info("🔐 Using Service Account authentication (Client Credentials)");
                tokenResponse = keycloakClient.getServiceAccountToken(
                        adminRealm,
                        adminClientId,
                        adminClientSecret,
                        "client_credentials"
                );
            } else {
                LOGGER.info("🔑 Using username/password authentication (Resource Owner Password)");
                tokenResponse = keycloakClient.getAdminToken(
                        adminRealm,
                        adminClientId,
                        adminUsername,
                        adminPassword,
                        "password"
                );
            }

            cachedAdminToken = tokenResponse.accessToken;
            tokenExpiry = LocalDateTime.now().plusSeconds(tokenResponse.expiresIn);

            LOGGER.info("✅ New admin token obtained, expires at: " + tokenExpiry);
            return cachedAdminToken;

        } catch (Exception e) {
            LOGGER.severe("❌ Error getting Keycloak admin token: " + e.getMessage());
            throw new RuntimeException("Failed to get Keycloak admin token", e);
        }
    }

    // ... (reste du code identique)

    public List<UserDTO> getAllActiveUsers() {
        try {
            LOGGER.info("🔍 Fetching all active users from Keycloak realm: " + adminRealm);

            String token = getValidAdminToken();
            String authHeader = "Bearer " + token;

            List<KeycloakUserResponse> keycloakUsers = keycloakClient.getUsers(
                    adminRealm,
                    authHeader,
                    100,
                    true
            );

            List<UserDTO> users = keycloakUsers.stream()
                    .filter(ku -> ku.enabled != null && ku.enabled)
                    .map(this::mapToUserDTO)
                    .collect(Collectors.toList());

            LOGGER.info("✅ Retrieved " + users.size() + " active users from Keycloak");
            return users;

        } catch (Exception e) {
            LOGGER.severe("❌ Error fetching users from Keycloak: " + e.getMessage());
            throw new RuntimeException("Failed to fetch users from Keycloak", e);
        }
    }

    public List<UserDTO> searchUsers(String searchTerm) {
        try {
            LOGGER.info("🔍 Searching users in Keycloak with term: " + searchTerm);

            String token = getValidAdminToken();
            String authHeader = "Bearer " + token;

            List<KeycloakUserResponse> keycloakUsers = keycloakClient.searchUsers(
                    adminRealm,
                    authHeader,
                    searchTerm,
                    20
            );

            List<UserDTO> users = keycloakUsers.stream()
                    .filter(ku -> ku.enabled != null && ku.enabled)
                    .map(this::mapToUserDTO)
                    .collect(Collectors.toList());

            LOGGER.info("✅ Found " + users.size() + " users matching: " + searchTerm);
            return users;

        } catch (Exception e) {
            LOGGER.severe("❌ Error searching users in Keycloak: " + e.getMessage());
            throw new RuntimeException("Failed to search users in Keycloak", e);
        }
    }

    private UserDTO mapToUserDTO(KeycloakUserResponse keycloakUser) {
        UserDTO user = new UserDTO();
        user.id = keycloakUser.id;
        user.username = keycloakUser.username;
        user.email = keycloakUser.email;
        user.firstName = keycloakUser.firstName;
        user.lastName = keycloakUser.lastName;
        user.enabled = keycloakUser.enabled != null ? keycloakUser.enabled : true;

        if (user.firstName != null && user.lastName != null) {
            user.displayName = user.firstName + " " + user.lastName;
        } else if (user.firstName != null) {
            user.displayName = user.firstName;
        } else if (user.email != null && !user.email.equals(user.username)) {
            user.displayName = user.email;
        } else {
            user.displayName = user.username;
        }

        if (keycloakUser.createdTimestamp != null) {
            user.createdAt = java.time.Instant.ofEpochMilli(keycloakUser.createdTimestamp).toString();
        }

        return user;
    }

    public boolean testConnection() {
        try {
            getValidAdminToken();
            return true;
        } catch (Exception e) {
            LOGGER.warning("⚠️ Keycloak connection test failed: " + e.getMessage());
            return false;
        }
    }
}