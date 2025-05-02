package fr.ccm2.mapper;

import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.MediaType;

import java.util.HashMap;
import java.util.Map;

// Le gestionnaire d'exceptions global
@Provider // Annoncer que cette classe est un provider pour les exceptions
public class ErrorMapper implements ExceptionMapper<Exception> {

    // Cette méthode gère toutes les exceptions non capturées dans l'application
    @Override
    public Response toResponse(Exception exception) {
        // Créer une map pour stocker le message d'erreur
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("message", exception.getMessage());

        // Adapter le code d'état HTTP en fonction du type d'exception
        if (exception instanceof IllegalArgumentException) {
            // Erreur liée à un argument invalide
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(errorResponse)
                    .type(MediaType.APPLICATION_JSON)  // Définir le type de la réponse en JSON
                    .build();
        } else if (exception instanceof IllegalStateException) {
            // Erreur liée à un état invalide
            return Response.status(Response.Status.CONFLICT)
                    .entity(errorResponse)
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        } else {
            // Erreur interne (ex : erreur serveur)
            errorResponse.put("message", "Erreur interne du serveur");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(errorResponse)
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }
}
