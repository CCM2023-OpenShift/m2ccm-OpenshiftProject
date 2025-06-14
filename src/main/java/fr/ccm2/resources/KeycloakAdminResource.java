package fr.ccm2.resources;

import fr.ccm2.dto.keycloak.KeycloakTokenResponse;
import fr.ccm2.dto.keycloak.KeycloakUserResponse;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

import java.util.List;

@RegisterRestClient(configKey = "keycloak-admin")
@Path("/")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public interface KeycloakAdminResource {

    /**
     * Token avec username/password (Resource Owner Password)
     */
    @POST
    @Path("/realms/{realm}/protocol/openid-connect/token")
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    KeycloakTokenResponse getAdminToken(
            @PathParam("realm") String realm,
            @FormParam("client_id") String clientId,
            @FormParam("username") String username,
            @FormParam("password") String password,
            @FormParam("grant_type") String grantType
    );

    /**
     * Token avec Service Account (Client Credentials)
     */
    @POST
    @Path("/realms/{realm}/protocol/openid-connect/token")
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    KeycloakTokenResponse getServiceAccountToken(
            @PathParam("realm") String realm,
            @FormParam("client_id") String clientId,
            @FormParam("client_secret") String clientSecret,
            @FormParam("grant_type") String grantType // "client_credentials"
    );

    @GET
    @Path("/admin/realms/{realm}/users")
    List<KeycloakUserResponse> getUsers(
            @PathParam("realm") String realm,
            @HeaderParam("Authorization") String authorization,
            @QueryParam("max") Integer max,
            @QueryParam("briefRepresentation") Boolean briefRepresentation
    );

    @GET
    @Path("/admin/realms/{realm}/users")
    List<KeycloakUserResponse> searchUsers(
            @PathParam("realm") String realm,
            @HeaderParam("Authorization") String authorization,
            @QueryParam("search") String searchTerm,
            @QueryParam("max") Integer max
    );

    @GET
    @Path("/admin/realms/{realm}/users/{userId}")
    KeycloakUserResponse getUser(
            @PathParam("realm") String realm,
            @PathParam("userId") String userId,
            @HeaderParam("Authorization") String authorization
    );

    /**
     * Met à jour un utilisateur
     */
    @PUT
    @Path("/admin/realms/{realm}/users/{userId}")
    void updateUser(
            @PathParam("realm") String realm,
            @PathParam("userId") String userId,
            @HeaderParam("Authorization") String authorization,
            KeycloakUserResponse user
    );

    /**
     * Envoie un email de réinitialisation de mot de passe
     */
    @PUT
    @Path("/admin/realms/{realm}/users/{userId}/execute-actions-email")
    void sendResetPasswordEmail(
            @PathParam("realm") String realm,
            @PathParam("userId") String userId,
            @HeaderParam("Authorization") String authorization,
            List<String> actions
    );
}