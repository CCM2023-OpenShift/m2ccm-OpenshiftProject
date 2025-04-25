package fr.ccm2.services;

import fr.ccm2.dto.room.RoomResponseDTO;
import fr.ccm2.dto.room.RoomCreateDTO;
import fr.ccm2.dto.room.RoomUpdateDTO;
import fr.ccm2.entities.Equipment;
import fr.ccm2.entities.Room;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@ApplicationScoped
public class RoomService {

    @Inject
    EntityManager em;

    public List<Room> getAllRooms() {
        return em.createQuery("FROM Room", Room.class).getResultList();
    }

    public Room getRoomById(Long id) {
        return em.find(Room.class, id);
    }

    @Transactional
    public Room createRoom(RoomCreateDTO dto) {
        Room room = new Room();

        room.setName(dto.name);
        room.setCapacity(dto.capacity);
        List<Equipment> equipmentList = dto.equipment.stream()
                .map(id -> em.find(Equipment.class, id))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        room.setEquipment(equipmentList);

        em.persist(room);
        em.flush();

        return room;
    }

    @Transactional
    public Room updateRoom(Long id, RoomUpdateDTO dto) {
        Room room = em.find(Room.class, id);
        if (room != null) {
            room.setName(dto.name);
            room.setCapacity(dto.capacity);
            List<Equipment> equipmentList = dto.equipment.stream()
                    .map(equipment -> em.find(Equipment.class, equipment))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            room.setEquipment(equipmentList);
        }

        return room;
    }

    @Transactional
    public void deleteRoom(Long id) {
        Room room = em.find(Room.class, id);
        if (room != null) {
            em.remove(room);
        }
    }
}