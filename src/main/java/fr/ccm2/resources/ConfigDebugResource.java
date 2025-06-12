package fr.ccm2.resources;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.Optional;

@Path("/debug")
public class ConfigDebugResource {

    @ConfigProperty(name = "app.supabase.key")
    Optional<String> supabaseKey;

    @ConfigProperty(name = "app.supabase.url")
    Optional<String> supabaseUrl;

    @ConfigProperty(name = "app.image.storage.type", defaultValue = "local")
    String storageType;

    @GET
    @Path("/supabase-key")
    @Produces(MediaType.TEXT_PLAIN)
    public String getSupabaseKey() {
        if (supabaseKey.isPresent()) {
            return "Supabase Key: " + supabaseKey.get();
        } else {
            return "Supabase Key: NON DÉFINIE";
        }
    }

    @GET
    @Path("/config")
    @Produces(MediaType.APPLICATION_JSON)
    public String getAllConfig() {
        return "{\n" +
                "  \"storageType\": \"" + storageType + "\",\n" +
                "  \"supabaseUrl\": \"" + (supabaseUrl.isPresent() ? supabaseUrl.get() : "NON DÉFINIE") + "\",\n" +
                "  \"supabaseKey\": \"" + (supabaseKey.isPresent() ? supabaseKey.get() : "NON DÉFINIE") + "\"\n" +
                "}";
    }
}