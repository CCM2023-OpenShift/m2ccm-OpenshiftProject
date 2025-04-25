package fr.ccm2.resources;

import fr.ccm2.dto.equipment.EquipmentCreateDTO;
import fr.ccm2.dto.equipment.EquipmentUpdateDTO;
import fr.ccm2.services.EquipmentService;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

import fr.ccm2.entities.Equipment;
import jakarta.ws.rs.core.Response;

@Path("/equipment")
@Produces(MediaType.APPLICATION_JSON)
public class EquipmentResource {
    @Inject
    EquipmentService equipmentService;

    @GET
    public Response list() { return Response.ok(equipmentService.getAllEquipments()).build(); }

    @GET
    @Path("/{id}")
    public Response get(@PathParam("id") Long id) {
        Equipment equipment = equipmentService.getEquipmentById(id);
        if (equipment == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(equipment).build();
    }

    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response create(
            @FormParam("name") String name,
            @FormParam("description") String description) {
        EquipmentCreateDTO dto = new EquipmentCreateDTO();
        dto.name = name;
        dto.description = description;

        Equipment equipment = equipmentService.createEquipment(dto);
        if (equipment == null) {
            return Response.status(Response.Status.BAD_REQUEST).entity("Equipment creation failed").build();
        }
        return Response.status(Response.Status.CREATED).entity(equipment).build();
    }

    @PUT
    @Path("/{id}")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response update(@PathParam("id") Long id,
                           @FormParam("name") String name,
                           @FormParam("description") String description) {
        EquipmentUpdateDTO dto = new EquipmentUpdateDTO();
        dto.name = name;
        dto.description = description;

        Equipment equipment = equipmentService.updateEquipment(id, dto);
        if (equipment == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(equipment).build();
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        equipmentService.deleteEquipment(id);
        return Response.noContent().build();
    }
}
