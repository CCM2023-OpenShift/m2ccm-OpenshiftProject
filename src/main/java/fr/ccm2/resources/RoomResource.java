package fr.ccm2.resources;

import fr.ccm2.dto.room.RoomCreateDTO;
import fr.ccm2.dto.room.RoomUpdateDTO;
import fr.ccm2.services.RoomService;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;

import java.util.List;

import fr.ccm2.entities.Room;
import jakarta.ws.rs.core.Response;

@Path("/rooms")
@Produces(MediaType.APPLICATION_JSON)
public class RoomResource {
    @Inject
    RoomService roomService;

    @GET
    public Response list() { return Response.ok(roomService.getAllRooms()).build(); }

    @GET
    @Path("/{id}")
    public Response get(Long id) {
        Room room = roomService.getRoomById(id);
        if (room == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(room).build();
    }

    @POST
    public Response create(@FormParam("name") String name,
                           @FormParam("capacity") Integer capacity,
                           @FormParam("equipment") List<Long> equipmentIds) {
        RoomCreateDTO dto = new RoomCreateDTO();
        dto.name = name;
        dto.capacity = capacity;
        dto.equipment = equipmentIds;

        Room room = roomService.createRoom(dto);
        if (room == null) {
            return Response.status(Response.Status.BAD_REQUEST).entity("Room creation failed").build();
        }
        return Response.status(Response.Status.CREATED).entity(room).build();
    }

    @PUT
    @Path("/{id}")
    public Response update(@PathParam("id") Long id,
                           @FormParam("name") String name,
                           @FormParam("capacity") Integer capacity,
                           @FormParam("equipment") List<Long> equipmentIds) {
        RoomUpdateDTO dto = new RoomUpdateDTO();
        dto.name = name;
        dto.capacity = capacity;
        dto.equipment = equipmentIds;

        Room room = roomService.updateRoom(id, dto);
        if (room == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(room).build();
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        roomService.deleteRoom(id);
        return Response.noContent().build();
    }
}
