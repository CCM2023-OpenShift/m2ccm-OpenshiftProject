package fr.ccm2;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

/**
 * Classe de ressource principale.
 */
@Path("/")
@Tag(name = "Main", description = "Main API endpoint")
public final  class MainResource {

    /**
     * Retourne un message de bienvenue.
     *
     * @return Le message de bienvenue.
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Page principale",
            description = "Retourne un message de bienvenue")
    public String home() {
        return "Bienvenue sur l'API Quarkus !";
    }
}
