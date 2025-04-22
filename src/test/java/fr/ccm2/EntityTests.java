package fr.ccm2;

import fr.ccm2.entities.Room;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
class EntityTests {

    @Inject
    EntityManager entityManager;

    @Test
    @Transactional
    void testRoomEntityPersistence() {
        // Créer un objet Room
        Room room = new Room();
        room.setName("Salle A");
        room.setCapacity(10);
        // Suppression de setLocation() car le champ n'existe pas dans Room

        // Persister l'objet
        entityManager.persist(room);
        entityManager.flush();

        // Rechercher l'objet persistant
        Room found = entityManager.find(Room.class, room.getId());

        // Assertions avec JUnit 5
        assertNotNull(found, "La salle trouvée ne doit pas être nulle");
        assertEquals("Salle A", found.getName(), "Le nom de la salle doit être 'Salle A'");
        assertEquals(10, found.getCapacity(), "La capacité de la salle doit être 10");
    }
}
