package fr.ccm2.resources;

import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.Optional;

@Path("/debug")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ConfigDebugResource {

    @ConfigProperty(name = "app.supabase.key")
    Optional<String> supabaseKey;

    @ConfigProperty(name = "app.supabase.url")
    Optional<String> supabaseUrl;

    @ConfigProperty(name = "app.image.storage.type", defaultValue = "local")
    String storageType;

    @GET
    @Path("/key")
    @RolesAllowed({"admin"})
    @Produces(MediaType.TEXT_PLAIN)
    public String getKey() {
        return supabaseKey.orElse("CLÉS NON DÉFINIE");
    }

    @GET
    @Path("/supabase-key")
    @RolesAllowed({"admin"})
    @Produces(MediaType.TEXT_PLAIN)
    public Response getSupabaseKey() {
        try {
            String result;
            if (supabaseKey.isPresent()) {
                String key = supabaseKey.get();
                // Masquer partiellement la clé pour la sécurité
                if (key.length() > 10) {
                    result = "Supabase Key: " + key.substring(0, 5) + "..." + key.substring(key.length() - 5);
                } else {
                    result = "Supabase Key: [MASQUÉ - longueur: " + key.length() + "]";
                }
            } else {
                result = "Supabase Key: NON DÉFINIE";
            }
            return Response.ok(result).build();
        } catch (Exception e) {
            return Response.status(500)
                    .entity("Erreur lors de la récupération de la clé: " + e.getMessage())
                    .build();
        }
    }

    @GET
    @Path("/supabase-key-full")
    @RolesAllowed({"admin"})
    @Produces(MediaType.TEXT_PLAIN)
    public Response getSupabaseKeyFull() {
        try {
            String result = supabaseKey.orElse("NON DÉFINIE");
            return Response.ok("Supabase Key Full: " + result).build();
        } catch (Exception e) {
            return Response.status(500)
                    .entity("Erreur lors de la récupération de la clé complète: " + e.getMessage())
                    .build();
        }
    }

    @GET
    @Path("/config")
    @RolesAllowed({"admin"})
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAllConfig() {
        try {
            String json = "{\n" +
                    "  \"storageType\": \"" + storageType + "\",\n" +
                    "  \"supabaseUrl\": \"" + (supabaseUrl.isPresent() ? supabaseUrl.get() : "NON DÉFINIE") + "\",\n" +
                    "  \"supabaseKeyPresent\": " + supabaseKey.isPresent() + ",\n" +
                    "  \"supabaseKeyLength\": " + (supabaseKey.isPresent() ? supabaseKey.get().length() : 0) + "\n" +
                    "}";
            return Response.ok(json).build();
        } catch (Exception e) {
            return Response.status(500)
                    .entity("{\"error\": \"" + e.getMessage() + "\"}")
                    .build();
        }
    }

    @GET
    @Path("/health")
    @RolesAllowed({"admin"})
    @Produces(MediaType.TEXT_PLAIN)
    public Response health() {
        return Response.ok("DEBUG ENDPOINT OK").build();
    }
}