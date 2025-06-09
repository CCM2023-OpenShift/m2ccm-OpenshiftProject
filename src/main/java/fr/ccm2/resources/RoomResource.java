package fr.ccm2.resources;

import fr.ccm2.dto.room.*;
import fr.ccm2.entities.Room;
import fr.ccm2.mapper.RoomMapper;
import fr.ccm2.services.RoomService;
import fr.ccm2.services.ImageService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.resteasy.reactive.multipart.FileUpload;
import org.jboss.logging.Logger;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Path("/rooms")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class RoomResource {

    private static final Logger LOG = Logger.getLogger(RoomResource.class);

    @Inject
    RoomService roomService;

    @Inject
    ImageService imageService;

    @GET
    @RolesAllowed({"user", "admin"})
    public Response list() {
        try {
            List<Room> rooms = roomService.getRoomsWithRelations();
            List<RoomResponseDTO> response = rooms.stream()
                    .map(room -> RoomMapper.toResponse(room, true))
                    .collect(Collectors.toList());

            return Response.ok(response).build();
        } catch (Exception e) {
            return Response.serverError().entity("Erreur serveur: " + e.getMessage()).build();
        }
    }

    @GET
    @Path("/{id}")
    @RolesAllowed({"user", "admin"})
    public Response get(@PathParam("id") Long id) {
        Room room = roomService.getRoomByIdWithRelations(id);
        if (room == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        RoomResponseDTO responseDTO = RoomMapper.toResponse(room, true);
        return Response.ok(responseDTO).build();
    }

    @POST
    @RolesAllowed({"admin"})
    public Response create(RoomCreateDTO dto) {
        Room room = roomService.createRoom(dto);
        if (room == null) {
            return Response.status(Response.Status.BAD_REQUEST).entity("La création de la salle a échoué.").build();
        }

        RoomResponseDTO responseDTO = RoomMapper.toResponse(room, true);
        return Response.status(Response.Status.CREATED).entity(responseDTO).build();
    }

    @PUT
    @Path("/{id}")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RolesAllowed({"admin"})
    public Response update(@PathParam("id") Long id,
                           @FormParam("name") String name,
                           @FormParam("capacity") Integer capacity) {

        RoomUpdateDTO dto = new RoomUpdateDTO();
        dto.name = name;
        dto.capacity = capacity;

        try {
            Room room = roomService.updateRoom(id, dto);
            if (room == null) {
                return Response.status(Response.Status.NOT_FOUND).entity("Salle non trouvée.").build();
            }

            RoomResponseDTO responseDTO = RoomMapper.toResponse(room, true);
            return Response.ok(responseDTO).build();
        } catch (Exception e) {
            // Remplacer printStackTrace() par un logging approprié
            LOG.error("Erreur lors de la mise à jour de la salle ID=" + id, e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity("Erreur serveur : " + e.getMessage()).build();
        }
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed({"admin"})
    public Response delete(@PathParam("id") Long id) {
        roomService.deleteRoom(id);
        return Response.noContent().build();
    }

    // ========== ENDPOINTS POUR LES IMAGES DES SALLES ==========

    @POST
    @Path("/{id}/image")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed({"admin"})
    public Response uploadImage(@PathParam("id") Long roomId,
                                @FormParam("image") FileUpload imageFile) {
        try {
            Room room = roomService.getRoomById(roomId);
            if (room == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity("Salle non trouvée")
                        .build();
            }

            String imageUrl = imageService.saveRoomImage(imageFile);
            roomService.updateImageUrl(roomId, imageUrl);

            return Response.ok()
                    .entity("{\"message\": \"Image uploadée avec succès\", \"imageUrl\": \"" + imageUrl + "\"}")
                    .build();

        } catch (IllegalArgumentException e) {
            LOG.warn("Tentative d'upload d'image invalide: " + e.getMessage());
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"" + e.getMessage() + "\"}")
                    .build();
        } catch (IOException e) {
            LOG.error("Erreur lors de l'upload d'image pour la salle ID=" + roomId, e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"Erreur lors de la sauvegarde de l'image\"}")
                    .build();
        }
    }

    @DELETE
    @Path("/{id}/image")
    @RolesAllowed({"admin"})
    public Response deleteImage(@PathParam("id") Long roomId) {
        try {
            Room room = roomService.getRoomById(roomId);
            if (room == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity("Salle non trouvée")
                        .build();
            }

            if (room.getImageUrl() != null) {
                imageService.deleteRoomImageFile(room.getImageUrl());
                roomService.updateImageUrl(roomId, null);
            }

            return Response.ok()
                    .entity("{\"message\": \"Image supprimée avec succès\"}")
                    .build();

        } catch (IOException e) {
            LOG.error("Erreur lors de la suppression d'image pour la salle ID=" + roomId, e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"Erreur lors de la suppression de l'image\"}")
                    .build();
        }
    }

    // ========== ENDPOINT POUR SERVIR LES IMAGES DES SALLES ==========

    @GET
    @Path("/images/{fileName}")
    @Produces("image/*")
    public Response getRoomImage(@PathParam("fileName") String fileName) {
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
            LOG.warn("Tentative d'accès non autorisé à l'image: " + fileName, e);
            return Response.status(Response.Status.BAD_REQUEST).build();
        } catch (IOException e) {
            LOG.error("Erreur lors de la récupération de l'image: " + fileName, e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }
}