package fr.ccm2.resources;

import fr.ccm2.dto.equipment.EquipmentCreateDTO;
import fr.ccm2.dto.equipment.EquipmentResponseDTO;
import fr.ccm2.dto.equipment.EquipmentUpdateDTO;
import fr.ccm2.entities.Equipment;
import fr.ccm2.mapper.EquipmentMapper;
import fr.ccm2.services.EquipmentService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.stream.Collectors;

@Path("/equipment")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class EquipmentResource {

    @Inject
    EquipmentService equipmentService;

    @GET
    @RolesAllowed({"user", "admin"})
    public Response list() {
        List<EquipmentResponseDTO> dtoList = equipmentService.getAllEquipments()
                .stream()
                .map(EquipmentMapper::toResponse)
                .collect(Collectors.toList());
        return Response.ok(dtoList).build();
    }

    @GET
    @Path("/{id}")
    @RolesAllowed({"user", "admin"})
    public Response get(@PathParam("id") Long id) {
        Equipment equipment = equipmentService.getEquipmentById(id);
        if (equipment == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        EquipmentResponseDTO responseDTO = EquipmentMapper.toResponse(equipment);
        return Response.ok(responseDTO).build();
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed({"admin"})
    public Response create(EquipmentCreateDTO dto) {
        Equipment equipment = equipmentService.createEquipment(dto);
        if (equipment == null) {
            return Response.status(Response.Status.BAD_REQUEST).entity("Equipment creation failed").build();
        }

        EquipmentResponseDTO responseDTO = EquipmentMapper.toResponse(equipment);
        return Response.status(Response.Status.CREATED).entity(responseDTO).build();
    }

    @PUT
    @Path("/{id}")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RolesAllowed({"admin"})
    public Response update(@PathParam("id") Long id,
                           @FormParam("name") String name,
                           @FormParam("description") String description,
                           @FormParam("quantity") int quantity,
                           @FormParam("mobile") boolean mobile) {

        EquipmentUpdateDTO dto = new EquipmentUpdateDTO();
        dto.name = name;
        dto.description = description;
        dto.quantity = quantity;
        dto.mobile = mobile;

        Equipment equipment = equipmentService.updateEquipment(id, dto);
        if (equipment == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        EquipmentResponseDTO responseDTO = EquipmentMapper.toResponse(equipment);
        return Response.ok(responseDTO).build();
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed({"admin"})
    public Response delete(@PathParam("id") Long id) {
        equipmentService.deleteEquipment(id);
        return Response.noContent().build();
    }
}