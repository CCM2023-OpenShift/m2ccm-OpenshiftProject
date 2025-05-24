package fr.ccm2.resources;

import fr.ccm2.dto.room.*;
import fr.ccm2.entities.Room;
import fr.ccm2.mapper.RoomMapper;
import fr.ccm2.services.RoomService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.stream.Collectors;

@Path("/rooms")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class RoomResource {

    @Inject
    RoomService roomService;

    @GET
    @RolesAllowed({"user", "admin"})
    public Response list() {
        List<Room> rooms = roomService.getRoomsWithRelations();
        List<RoomResponseDTO> response = rooms.stream()
                .map(room -> RoomMapper.toResponse(room, true))
                .collect(Collectors.toList());

        return Response.ok(response).build();
    }

    @GET
    @Path("/{id}")
    @RolesAllowed({"user", "admin"})
    public Response get(@PathParam("id") Long id) {
        Room room = roomService.getRoomByIdWithRelations(id);
        if (room == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        RoomResponseDTO responseDTO = RoomMapper.toResponse(room, true); // On inclut les équipements ici aussi
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
    @RolesAllowed({"admin"})
    public Response update(@PathParam("id") Long id, RoomUpdateDTO dto) {
        try {
            Room room = roomService.updateRoom(id, dto);
            if (room == null) {
                return Response.status(Response.Status.NOT_FOUND).entity("Salle non trouvée.").build();
            }

            RoomResponseDTO responseDTO = RoomMapper.toResponse(room, true);
            return Response.ok(responseDTO).build();
        } catch (Exception e) {
            e.printStackTrace();
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
}