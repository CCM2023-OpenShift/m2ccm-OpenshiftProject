package fr.ccm2.resources;

import fr.ccm2.dto.room.RoomCreateDTO;
import fr.ccm2.dto.room.RoomResponseDTO;
import fr.ccm2.dto.room.RoomUpdateDTO;
import fr.ccm2.entities.Room;
import fr.ccm2.mapper.RoomMapper;
import fr.ccm2.services.RoomService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/rooms")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class RoomResource {

    @Inject
    RoomService roomService;

    @GET
    public Response list() {
        return Response.ok(roomService.getRoomsWithRelations()).build();
    }

    @GET
    @Path("/{id}")
    public Response get(@PathParam("id") Long id) {
        Room room = roomService.getRoomByIdWithRelations(id);
        if (room == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        // Mapper la chambre vers un DTO de réponse avec ses relations
        RoomResponseDTO responseDTO = RoomMapper.toResponse(room, true);
        return Response.ok(responseDTO).build();
    }

    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
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

        RoomResponseDTO responseDTO = RoomMapper.toResponse(room, true);
        return Response.status(Response.Status.CREATED).entity(responseDTO).build();
    }

    @PUT
    @Path("/{id}")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
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

        RoomResponseDTO responseDTO = RoomMapper.toResponse(room, true);
        return Response.ok(responseDTO).build();
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        roomService.deleteRoom(id);
        return Response.noContent().build();
    }
}
