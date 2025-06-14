package fr.ccm2.services;

import fr.ccm2.dto.user.UserDTO;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.Collections;
import java.util.List;
import java.util.logging.Logger;

@ApplicationScoped
public class UserService {

    private static final Logger LOGGER = Logger.getLogger(UserService.class.getName());

    @Inject
    JsonWebToken jwt;

    @Inject
    KeycloakAdminService keycloakAdminService;

    /**
     * Récupère l'utilisateur actuel depuis le token JWT
     */
    public UserDTO getCurrentUser() {
        try {
            UserDTO user = new UserDTO();

            // Récupération des infos depuis le token Keycloak
            user.id = jwt.getClaim("sub");
            user.username = jwt.getClaim("preferred_username");
            user.firstName = jwt.getClaim("given_name");
            user.lastName = jwt.getClaim("family_name");
            user.email = jwt.getClaim("email");
            user.enabled = true;

            // Construction du nom d'affichage
            if (user.firstName != null && user.lastName != null) {
                user.displayName = user.firstName + " " + user.lastName;
            } else if (user.firstName != null) {
                user.displayName = user.firstName;
            } else {
                user.displayName = user.username;
            }

            LOGGER.info("✅ Current user retrieved: " + user.username);
            return user;

        } catch (Exception e) {
            LOGGER.severe("❌ Error getting current user from JWT: " + e.getMessage());
            throw new RuntimeException("Error retrieving current user", e);
        }
    }

    /**
     * Récupère les utilisateurs depuis Keycloak (admin seulement)
     */
    public List<UserDTO> getUsersForBooking() {
        try {
            LOGGER.info("🔍 Getting users for booking from Keycloak...");

            // Test de connectivité Keycloak d'abord
            if (!keycloakAdminService.testConnection()) {
                LOGGER.warning("⚠️ Keycloak connection failed, returning only current admin user");
                return getCurrentAdminOnly();
            }

            // Récupérer depuis Keycloak
            List<UserDTO> users = keycloakAdminService.getAllActiveUsers();

            // Marquer l'utilisateur actuel
            UserDTO currentUser = getCurrentUser();
            users.forEach(user -> {
                if (user.username.equals(currentUser.username)) {
                    user.displayName = user.displayName + " (Vous)";
                }
            });

            LOGGER.info("✅ Retrieved " + users.size() + " users from Keycloak for booking");
            return users;

        } catch (Exception e) {
            LOGGER.severe("❌ Error getting users from Keycloak: " + e.getMessage());
            LOGGER.warning("⚠️ Keycloak connection failed, returning only current admin user");
            return getCurrentAdminOnly();
        }
    }

    /**
     * Recherche d'utilisateurs (admin seulement)
     */
    public List<UserDTO> searchUsers(String searchTerm) {
        try {
            if (searchTerm == null || searchTerm.trim().isEmpty()) {
                return getUsersForBooking();
            }

            LOGGER.info("🔍 Searching users with term: " + searchTerm);
            return keycloakAdminService.searchUsers(searchTerm.trim());

        } catch (Exception e) {
            LOGGER.severe("❌ Error searching users: " + e.getMessage());
            return getCurrentAdminOnly();
        }
    }

    /**
     * Retourne seulement l'utilisateur admin connecté (fallback minimal)
     */
    private List<UserDTO> getCurrentAdminOnly() {
        try {
            UserDTO currentUser = getCurrentUser();
            currentUser.displayName = currentUser.displayName + " (Vous - Connexion Keycloak échouée)";

            LOGGER.info("⚠️ Using admin-only fallback: " + currentUser.username);
            return Collections.singletonList(currentUser);

        } catch (Exception e) {
            LOGGER.severe("❌ Error getting current admin user: " + e.getMessage());

            // Fallback ultime si même le JWT ne fonctionne pas
            UserDTO fallback = new UserDTO();
            fallback.id = "ultimate-fallback";
            fallback.username = "M0rd0rian";
            fallback.displayName = "M0rd0rian (Fallback ultime)";
            fallback.enabled = true;

            LOGGER.warning("⚠️ Using ultimate fallback user: M0rd0rian");
            return Collections.singletonList(fallback);
        }
    }

    /**
     * Valide si un nom d'utilisateur est acceptable
     */
    public boolean isValidUsername(String username) {
        if (username == null || username.trim().isEmpty()) {
            return false;
        }

        // Validation basique : lettres, chiffres, points, tirets, underscores
        // Longueur entre 2 et 50 caractères
        return username.matches("^[a-zA-Z0-9._-]+$") &&
                username.length() >= 2 &&
                username.length() <= 50;
    }
}