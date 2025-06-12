package fr.ccm2.resources;

import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;

@Path("/debug-db")
public class DatabaseDebugResource {

    @Inject
    DataSource dataSource;

    @GET
    @Path("/connection-info")
    @RolesAllowed({"admin"})
    @Produces(MediaType.APPLICATION_JSON)
    public Response getDatabaseConnectionInfo() {
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();

            String url = metaData.getURL();
            String username = metaData.getUserName();
            String databaseProductName = metaData.getDatabaseProductName();
            String databaseProductVersion = metaData.getDatabaseProductVersion();

            String quarkusProfile = System.getenv("QUARKUS_PROFILE");
            String prodDbPassword = System.getenv("PROD_DB_PASSWORD");
            String appSupabaseKey = System.getenv("APP_SUPABASE_KEY");

            String json = "{\n" +
                    "  \"timestamp\": \"" + java.time.Instant.now() + "\",\n" +
                    "  \"quarkus_profile\": \"" + (quarkusProfile != null ? quarkusProfile : "NULL") + "\",\n" +
                    "  \"database_connection\": {\n" +
                    "    \"url\": \"" + url + "\",\n" +
                    "    \"username\": \"" + username + "\",\n" +
                    "    \"product_name\": \"" + databaseProductName + "\",\n" +
                    "    \"product_version\": \"" + databaseProductVersion + "\"\n" +
                    "  },\n" +
                    "  \"environment_variables\": {\n" +
                    "    \"PROD_DB_PASSWORD\": \"" + (prodDbPassword != null ? "DÉFINIE (longueur: " + prodDbPassword.length() + ")" : "NULL") + "\",\n" +
                    "    \"APP_SUPABASE_KEY\": \"" + (appSupabaseKey != null ? "DÉFINIE (longueur: " + appSupabaseKey.length() + ")" : "NULL") + "\"\n" +
                    "  }\n" +
                    "}";

            return Response.ok(json).build();
        } catch (Exception e) {
            return Response.status(500)
                    .entity("{\"error\": \"" + e.getMessage() + "\"}")
                    .build();
        }
    }
}