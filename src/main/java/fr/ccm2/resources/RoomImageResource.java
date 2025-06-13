package fr.ccm2.resources;

import fr.ccm2.services.ImageService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.annotation.security.RolesAllowed;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.IOException;

@Path("/images/rooms")
public class RoomImageResource {

    @Inject
    ImageService imageService;

    @GET
    @Path("/config")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed({"user", "admin"})
    public Response getUploadConfig() {
        try {
            ImageService.UploadConfig config = imageService.getUploadConfig();
            return Response.ok(config).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"Erreur lors de la récupération de la configuration\"}")
                    .build();
        }
    }

    @GET
    @Path("/{fileName}")
    public Response getImage(@PathParam("fileName") String fileName) {
        try {
            byte[] imageData = imageService.getRoomImage(fileName);
            if (imageData == null) {
                return Response.status(Response.Status.NOT_FOUND).build();
            }

            String contentType = imageService.getRoomContentType(fileName);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return Response.ok(imageData, contentType).build();

        } catch (SecurityException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"Nom de fichier invalide\"}").build();
        } catch (IOException e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"Erreur lors de la lecture de l'image\"}").build();
        }
    }

    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    public Response uploadImage(@FormParam("file") FileUpload file) {
        try {
            if (file == null || file.size() == 0) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity("{\"error\": \"Aucun fichier fourni\"}").build();
            }

            String imageUrl = imageService.saveRoomImage(file);
            return Response.ok("{\"imageUrl\":\"" + imageUrl + "\"}").build();

        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"" + e.getMessage() + "\"}").build();
        } catch (IOException e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"Erreur lors de l'upload\"}").build();
        }
    }

    @DELETE
    @Path("/{fileName}")
    public Response deleteImage(@PathParam("fileName") String fileName) {
        try {
            System.out.println("🗑️ DELETE /images/rooms/" + fileName);
            imageService.deleteRoomImageFile("/images/rooms/" + fileName);
            return Response.ok("{\"message\": \"Image supprimée avec succès\"}").build();

        } catch (IOException e) {
            System.err.println("❌ Erreur suppression: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"Erreur lors de la suppression: " + e.getMessage() + "\"}").build();
        }
    }

    @DELETE
    @Consumes(MediaType.APPLICATION_JSON)
    public Response deleteImageByUrl(String requestBody) {
        try {
            String imageUrl = requestBody.replaceAll(".*\"imageUrl\"\\s*:\\s*\"([^\"]+)\".*", "$1");

            System.out.println("🗑️ DELETE room image par URL: " + imageUrl);
            imageService.deleteRoomImageFile(imageUrl);
            return Response.ok("{\"message\": \"Image supprimée avec succès\"}").build();

        } catch (IOException e) {
            System.err.println("❌ Erreur suppression par URL: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"Erreur lors de la suppression: " + e.getMessage() + "\"}").build();
        }
    }
}