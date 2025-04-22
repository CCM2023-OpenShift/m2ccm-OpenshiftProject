package fr.ccm2.resources;

import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

import fr.ccm2.entities.Equipment;

@Path("/equipment")
@Produces(MediaType.APPLICATION_JSON)
public class EquipmentResource {
    @Inject
    EntityManager em;

    @GET
    public List<Equipment> list() {
        return em.createQuery("FROM Equipment", Equipment.class).getResultList();
    }
}
