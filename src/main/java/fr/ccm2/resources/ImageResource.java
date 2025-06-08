package fr.ccm2.resources;

import fr.ccm2.services.ImageService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;

import java.io.IOException;

@Path("/images/equipments")
public class ImageResource {

    @Inject
    ImageService imageService;

    @GET
    @Path("/{fileName}")
    public Response getImage(@PathParam("fileName") String fileName) {
        try {
            byte[] imageData = imageService.getImage(fileName);
            if (imageData == null) {
                return Response.status(Response.Status.NOT_FOUND).build();
            }

            String contentType = imageService.getContentType(fileName);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return Response.ok(imageData, contentType).build();

        } catch (SecurityException e) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        } catch (IOException e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }
}
