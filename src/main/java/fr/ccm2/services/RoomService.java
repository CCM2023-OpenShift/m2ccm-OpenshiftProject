package fr.ccm2.services;

import fr.ccm2.dto.room.RoomCreateDTO;
import fr.ccm2.dto.room.RoomUpdateDTO;
import fr.ccm2.entities.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import java.util.*;
import java.util.logging.Logger;

@ApplicationScoped
public class RoomService {
    private static final Logger LOGGER = Logger.getLogger(RoomService.class.getName());

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
        room.setImageUrl(dto.imageUrl);  // Ajout de l'image

        em.persist(room);
        em.flush();

        if (dto.equipmentWithQuantities != null) {
            for (var eq : dto.equipmentWithQuantities) {
                Equipment equipment = em.find(Equipment.class, eq.equipmentId);
                if (equipment == null || equipment.isMobile()) continue;

                RoomEquipment re = new RoomEquipment();
                re.setRoom(room);
                re.setEquipment(equipment);
                re.setQuantity(eq.quantity);
                em.persist(re);
            }
        }

        em.flush();
        return room;
    }

    @Transactional
    public Room updateRoom(Long id, RoomUpdateDTO dto) {
        Room room = em.find(Room.class, id);
        if (room == null) return null;

        room.setName(dto.name);
        room.setCapacity(dto.capacity);
        if (dto.imageUrl != null) {
            room.setImageUrl(dto.imageUrl);  // Mise à jour de l'image
        }

        List<RoomEquipment> currentEquipments = em.createQuery(
                        "SELECT re FROM RoomEquipment re WHERE re.room.id = :roomId", RoomEquipment.class)
                .setParameter("roomId", room.getId())
                .getResultList();

        for (RoomEquipment re : currentEquipments) {
            em.remove(re);
        }

        if (dto.equipmentWithQuantities != null) {
            for (var eq : dto.equipmentWithQuantities) {
                Equipment equipment = em.find(Equipment.class, eq.equipmentId);
                if (equipment == null || equipment.isMobile()) continue;

                RoomEquipment re = new RoomEquipment();
                re.setRoom(room);
                re.setEquipment(equipment);
                re.setQuantity(eq.quantity);
                em.persist(re);
            }
        }

        room = em.createQuery(
                        "SELECT r FROM Room r LEFT JOIN FETCH r.roomEquipments WHERE r.id = :id", Room.class)
                .setParameter("id", room.getId())
                .getSingleResult();

        return room;
    }

    @Transactional
    public void updateImageUrl(Long roomId, String imageUrl) {
        LOGGER.info("Updating room " + roomId + " with image URL: " + imageUrl);
        Room room = em.find(Room.class, roomId);
        if (room != null) {
            room.setImageUrl(imageUrl);
            em.merge(room);
            em.flush();
            LOGGER.info("Successfully updated image URL for room " + roomId);
        } else {
            LOGGER.warning("Room not found with ID: " + roomId);
        }
    }

    @Transactional
    public void deleteRoom(Long id) {
        Room room = em.find(Room.class, id);
        if (room != null) {
            for (Booking booking : room.getBookings()) {
                booking.setRoom(null);
            }

            List<RoomEquipment> roomEquipments = em.createQuery(
                            "SELECT re FROM RoomEquipment re WHERE re.room.id = :roomId", RoomEquipment.class)
                    .setParameter("roomId", id)
                    .getResultList();

            for (RoomEquipment re : roomEquipments) {
                em.remove(re);
            }

            em.remove(room);
        }
    }

    public Room getRoomByIdWithRelations(Long id) {
        return em.createQuery(
                        "SELECT r FROM Room r " +
                                "WHERE r.id = :id", Room.class)
                .setParameter("id", id)
                .getSingleResult();
    }

    public List<Room> getRoomsWithRelations() {
        return em.createQuery(
                        "SELECT r FROM Room r LEFT JOIN FETCH r.roomEquipments", Room.class)
                .getResultList();
    }
}
