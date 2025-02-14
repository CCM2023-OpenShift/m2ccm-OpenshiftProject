package fr.ccm2;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/")
@Tag(name = "Main", description = "Main API endpoint")
public class MainResource {

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Page principale", description = "Retourne un message de bienvenue")
    public String home() {
        return "Bienvenue sur l'API Quarkus !";
    }
}
