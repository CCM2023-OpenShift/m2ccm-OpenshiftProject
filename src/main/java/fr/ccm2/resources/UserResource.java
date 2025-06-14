package fr.ccm2.resources;

import fr.ccm2.dto.user.UserDTO;
import fr.ccm2.services.UserService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

@Path("/api/users")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserResource {

    private static final Logger LOGGER = Logger.getLogger(UserResource.class.getName());

    @Inject
    UserService userService;

    /**
     * GET /api/users/current
     * Récupère les informations de l'utilisateur connecté
     */
    @GET
    @Path("/current")
    @RolesAllowed({"user", "admin"})
    public Response getCurrentUser() {
        try {
            LOGGER.info("🔍 Request: Get current user info");

            UserDTO currentUser = userService.getCurrentUser();

            LOGGER.info("✅ Response: Current user " + currentUser.username);
            return Response.ok(currentUser).build();

        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "❌ Error getting current user", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"Erreur lors de la récupération de l'utilisateur actuel\"}")
                    .build();
        }
    }

    /**
     * GET /api/users/booking-organizers
     * Récupère la liste des organisateurs possibles depuis Keycloak (admin seulement)
     */
    @GET
    @Path("/booking-organizers")
    @RolesAllowed({"admin"})
    public Response getBookingOrganizers() {
        try {
            LOGGER.info("🔍 Request: Admin requesting booking organizers list from Keycloak");

            List<UserDTO> users = userService.getUsersForBooking();

            LOGGER.info("✅ Response: " + users.size() + " users available for booking");
            return Response.ok(users).build();

        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "❌ Error fetching booking organizers", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"Erreur lors de la récupération des organisateurs\"}")
                    .build();
        }
    }

    /**
     * GET /api/users/search?q=terme
     * Recherche d'utilisateurs dans Keycloak (admin seulement)
     */
    @GET
    @Path("/search")
    @RolesAllowed({"admin"})
    public Response searchUsers(@QueryParam("q") String searchTerm) {
        try {
            LOGGER.info("🔍 Request: Admin searching users with term: " + searchTerm);

            List<UserDTO> users = userService.searchUsers(searchTerm);

            LOGGER.info("✅ Response: " + users.size() + " users found");
            return Response.ok(users).build();

        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "❌ Error searching users", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"Erreur lors de la recherche d'utilisateurs\"}")
                    .build();
        }
    }

    /**
     * POST /api/users/validate-username
     * Valide un nom d'utilisateur (admin seulement)
     */
    @POST
    @Path("/validate-username")
    @RolesAllowed({"admin"})
    @Consumes(MediaType.TEXT_PLAIN)
    public Response validateUsername(String username) {
        try {
            LOGGER.info("🔍 Request: Validate username '" + username + "'");

            boolean isValid = userService.isValidUsername(username);

            String response = String.format(
                    "{\"username\": \"%s\", \"valid\": %b, \"message\": \"%s\"}",
                    username,
                    isValid,
                    isValid ? "Username valide" : "Username invalide (2-50 caractères, lettres/chiffres/._- seulement)"
            );

            LOGGER.info("✅ Response: Username '" + username + "' is " + (isValid ? "valid" : "invalid"));
            return Response.ok(response).build();

        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "❌ Error validating username", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"Erreur lors de la validation du nom d'utilisateur\"}")
                    .build();
        }
    }

    /**
     * GET /api/users/suggestions
     * Alias pour booking-organizers (pour compatibilité)
     */
    @GET
    @Path("/suggestions")
    @RolesAllowed({"admin"})
    public Response getUserSuggestions() {
        return getBookingOrganizers();
    }
}