package fr.ccm2.resources;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;

import java.util.List;

import fr.ccm2.entities.Room;

@Path("/rooms")
@Produces(MediaType.APPLICATION_JSON)
public class RoomResource {
    @Inject
    EntityManager em;

    @GET
    public List<Room> list() {
        return em.createQuery("FROM Room", Room.class).getResultList();
    }
}
