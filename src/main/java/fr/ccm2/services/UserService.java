package fr.ccm2.services;

import fr.ccm2.dto.user.UserDTO;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import java.util.logging.Logger;

@ApplicationScoped
public class UserService {

    private static final Logger LOGGER = Logger.getLogger(UserService.class.getName());

    @Inject
    JsonWebToken jwt;

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
     * Liste des utilisateurs connus pour les réservations (admins seulement)
     */
    public List<UserDTO> getUsersForBooking() {
        try {
            UserDTO currentUser = getCurrentUser();

            // 🎯 Liste des utilisateurs connus dans ton système
            // Tu peux la modifier selon tes besoins
            List<String> knownUsernames = Arrays.asList(
                    "M0rd0rian",    // Toi
                    "admin",        // Admin principal
                    "user1",        // Autres utilisateurs
                    "user2",
                    "user3",
                    "manager",
                    "secretary",
                    "director"
            );

            List<UserDTO> users = knownUsernames.stream()
                    .map(username -> {
                        UserDTO user = new UserDTO();
                        user.username = username;
                        user.enabled = true;

                        // Marquer l'utilisateur actuel
                        if (username.equals(currentUser.username)) {
                            user.displayName = username + " (Vous)";
                        } else {
                            user.displayName = username;
                        }

                        return user;
                    })
                    .collect(Collectors.toList());

            LOGGER.info("✅ Retrieved " + users.size() + " known users for booking");
            return users;

        } catch (Exception e) {
            LOGGER.severe("❌ Error getting users for booking: " + e.getMessage());
            throw new RuntimeException("Error retrieving users for booking", e);
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

    /**
     * Ajoute un utilisateur à la liste des connus (pour les admins)
     */
    public UserDTO createKnownUser(String username) {
        if (!isValidUsername(username)) {
            throw new IllegalArgumentException("Username invalide: " + username);
        }

        UserDTO user = new UserDTO();
        user.username = username;
        user.displayName = username;
        user.enabled = true;

        LOGGER.info("✅ Created known user: " + username);
        return user;
    }
}