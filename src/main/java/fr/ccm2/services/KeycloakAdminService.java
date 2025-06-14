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
import java.util.Collections;
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

    /**
     * Met à jour le statut (enabled/disabled) d'un utilisateur
     */
    public UserDTO updateUserStatus(String userId, boolean enabled) {
        try {
            LOGGER.info("🔄 Updating user status for " + userId + " to: " + (enabled ? "enabled" : "disabled"));

            String token = getValidAdminToken();
            LOGGER.info("✓ Admin token obtained");
            String authHeader = "Bearer " + token;

            // Récupérer d'abord l'utilisateur actuel
            LOGGER.info("⬇️ Fetching current user data for userId: " + userId);
            KeycloakUserResponse user = keycloakClient.getUser(adminRealm, userId, authHeader);
            LOGGER.info("✓ User data fetched successfully: " + user.username);

            // Mettre à jour le statut
            user.enabled = enabled;
            LOGGER.info("⬆️ Sending user update with new status: " + enabled);

            // Enregistrer les modifications
            keycloakClient.updateUser(adminRealm, userId, authHeader, user);
            LOGGER.info("✅ Update request sent successfully");

            // Récupérer l'utilisateur mis à jour pour confirmation
            KeycloakUserResponse updatedUser = keycloakClient.getUser(adminRealm, userId, authHeader);
            LOGGER.info("✓ Updated user retrieved, new status: " + updatedUser.enabled);

            return mapToUserDTO(updatedUser);

        } catch (Exception e) {
            LOGGER.severe("❌ Error updating user status: " + e.getMessage());
            LOGGER.severe("Stack trace: " + java.util.Arrays.toString(e.getStackTrace()));
            throw new RuntimeException("Failed to update user status", e);
        }
    }

    /**
     * Envoie un email de réinitialisation de mot de passe
     */
    public void sendPasswordResetEmail(String userId) {
        try {
            LOGGER.info("📧 Sending password reset email to user: " + userId);

            String token = getValidAdminToken();
            String authHeader = "Bearer " + token;

            // Liste des actions à effectuer
            List<String> actions = Collections.singletonList("UPDATE_PASSWORD");

            keycloakClient.sendResetPasswordEmail(adminRealm, userId, authHeader, actions);

            LOGGER.info("✅ Password reset email sent to user: " + userId);

        } catch (Exception e) {
            LOGGER.severe("❌ Error sending password reset email: " + e.getMessage());
            throw new RuntimeException("Failed to send password reset email", e);
        }
    }

    /**
     * Récupère tous les utilisateurs, actifs et inactifs
     */
    public List<UserDTO> getAllUsers() {
        try {
            LOGGER.info("🔍 Fetching all users (including inactive) from Keycloak realm: " + adminRealm);

            String token = getValidAdminToken();
            String authHeader = "Bearer " + token;

            List<KeycloakUserResponse> keycloakUsers = keycloakClient.getUsers(
                    adminRealm,
                    authHeader,
                    100,
                    true
            );

            // Ne pas filtrer par statut enabled
            List<UserDTO> users = keycloakUsers.stream()
                    .map(this::mapToUserDTO)
                    .collect(Collectors.toList());

            LOGGER.info("✅ Retrieved " + users.size() + " users (active and inactive) from Keycloak");
            return users;

        } catch (Exception e) {
            LOGGER.severe("❌ Error fetching users from Keycloak: " + e.getMessage());
            throw new RuntimeException("Failed to fetch users from Keycloak", e);
        }
    }
}