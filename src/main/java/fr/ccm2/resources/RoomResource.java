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

import java.io.IOException;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@Path("/rooms")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class RoomResource {

    private static final Logger LOGGER = Logger.getLogger(RoomResource.class.getName());

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
            LOGGER.log(Level.SEVERE, "Error fetching rooms", e);
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
    @Consumes(MediaType.APPLICATION_JSON)
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
            LOGGER.log(Level.SEVERE, "Erreur lors de la mise à jour de la salle ID=" + id, e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity("Erreur serveur : " + e.getMessage()).build();
        }
    }

    @DELETE
    @Path("/{id}/image")
    @RolesAllowed({"admin"})
    public Response deleteImage(@PathParam("id") Long roomId) {
        try {
            LOGGER.info("🔍 Starting image deletion for room ID: " + roomId);

            Room room = roomService.getRoomById(roomId);
            if (room == null) {
                LOGGER.warning("Room not found with ID: " + roomId);
                return Response.status(Response.Status.NOT_FOUND)
                        .entity("{\"error\": \"Salle non trouvée\"}").build();
            }

            String imageUrl = room.getImageUrl();
            LOGGER.info("Current image URL: " + imageUrl);

            if (imageUrl != null && !imageUrl.trim().isEmpty()) {
                try {
                    LOGGER.info("Deleting physical image file: " + imageUrl);
                    imageService.deleteRoomImageFile(imageUrl);
                    LOGGER.info("Physical image file deleted successfully");
                } catch (Exception e) {
                    LOGGER.log(Level.WARNING, "Error deleting physical image file: " + e.getMessage(), e);
                    // Continue with database update even if physical deletion fails
                }
            } else {
                LOGGER.info("No image URL to delete");
            }

            LOGGER.info("Updating room to remove image URL reference");
            roomService.updateImageUrl(roomId, null);
            LOGGER.info("Database updated successfully");

            return Response.ok()
                    .entity("{\"message\": \"Image supprimée avec succès\"}")
                    .build();
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error in deleteImage: " + e.getMessage(), e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"Erreur lors de la suppression de l'image: " + e.getMessage() + "\"}").build();
        }
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed({"admin"})
    public Response delete(@PathParam("id") Long id) {
        try {
            Room room = roomService.getRoomById(id);
            if (room == null) {
                return Response.status(Response.Status.NOT_FOUND).build();
            }

            // Handle image deletion before deleting the room
            if (room.getImageUrl() != null && !room.getImageUrl().trim().isEmpty()) {
                try {
                    imageService.deleteRoomImageFile(room.getImageUrl());
                    LOGGER.info("Image deleted for room: " + id);
                } catch (Exception e) {
                    LOGGER.log(Level.WARNING, "Failed to delete image: " + e.getMessage(), e);
                    // Continue with room deletion even if image deletion fails
                }
            }

            roomService.deleteRoom(id);
            return Response.noContent().build();
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error deleting room: " + e.getMessage(), e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"" + e.getMessage() + "\"}").build();
        }
    }

    // ========== ENDPOINTS POUR LES IMAGES ==========

    @POST
    @Path("/{id}/image")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed({"admin"})
    public Response uploadImage(@PathParam("id") Long roomId,
                                @FormParam("file") FileUpload file) {
        try {
            if (roomService.getRoomById(roomId) == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity("{\"error\": \"Salle non trouvée\"}").build();
            }
            if (file == null || file.size() == 0) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity("{\"error\": \"Aucun fichier fourni\"}").build();
            }

            String imageUrl = imageService.saveRoomImage(file);
            roomService.updateImageUrl(roomId, imageUrl);

            return Response.ok()
                    .entity("{\"message\": \"Image uploadée avec succès\", \"imageUrl\": \"" + imageUrl + "\"}")
                    .build();

        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"" + e.getMessage() + "\"}").build();
        } catch (IOException e) {
            LOGGER.log(Level.SEVERE, "Error saving room image", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"Erreur lors de la sauvegarde de l'image\"}").build();
        }
    }
}