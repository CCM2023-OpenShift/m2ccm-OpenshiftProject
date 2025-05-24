package fr.ccm2.services;

import fr.ccm2.dto.booking.BookingCreateDTO;
import fr.ccm2.dto.booking.BookingUpdateDTO;
import fr.ccm2.entities.BookingEquipment;
import fr.ccm2.entities.Booking;
import fr.ccm2.entities.Equipment;
import fr.ccm2.entities.Room;
import fr.ccm2.utils.DateUtils;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@ApplicationScoped
public class BookingService {

    @Inject
    EntityManager em;

    public List<Booking> getAllBookings() {
        return em.createQuery("FROM Booking", Booking.class).getResultList();
    }

    public Booking getBookingById(Long id) {
        return em.find(Booking.class, id);
    }

    public List<Booking> getAvailableRoom(Long roomId, LocalDateTime start, LocalDateTime end) {
        return em.createQuery(
                        "SELECT DISTINCT b FROM Booking b WHERE b.room.id = :roomId " +
                                "AND b.endTime > :start AND b.startTime < :end", Booking.class)
                .setParameter("roomId", roomId)
                .setParameter("start", start)
                .setParameter("end", end)
                .getResultList();
    }

    public List<Booking> getBookingsByOrganizer(String organizer) {
        return em.createQuery(
                        "SELECT DISTINCT b FROM Booking b " +
                                "LEFT JOIN FETCH b.room " +
                                "LEFT JOIN FETCH b.bookingEquipments be " +
                                "LEFT JOIN FETCH be.equipment " +
                                "WHERE b.organizer = :organizer " +
                                "ORDER BY b.startTime DESC", Booking.class)
                .setParameter("organizer", organizer)
                .getResultList();
    }

    private void checkEquipmentAvailability(List<BookingEquipment> requestedEquipments, LocalDateTime start, LocalDateTime end) {
        for (BookingEquipment requested : requestedEquipments) {
            Equipment equipment = em.find(Equipment.class, requested.getEquipment().getId());

            if (equipment == null) {
                throw new IllegalArgumentException("Équipement non trouvé (ID=" + requested.getEquipment().getId() + ")");
            }

            if (equipment.isMobile()) {
                Long reservedQuantity = em.createQuery(
                                "SELECT COALESCE(SUM(be.quantity), 0) FROM BookingEquipment be " +
                                        "JOIN be.booking b " +
                                        "WHERE be.equipment.id = :equipmentId " +
                                        "AND b.endTime > :start AND b.startTime < :end", Long.class)
                        .setParameter("equipmentId", equipment.getId())
                        .setParameter("start", start)
                        .setParameter("end", end)
                        .getSingleResult();

                if (reservedQuantity + requested.getQuantity() > equipment.getQuantity()) {
                    throw new IllegalStateException(
                            "Quantité insuffisante pour l'équipement mobile '" + equipment.getName() + "'. " +
                                    "Demandé: " + requested.getQuantity() + ", Disponible: " +
                                    (equipment.getQuantity() - reservedQuantity)
                    );
                }
            }
        }
    }


    @Transactional
    public Booking createBooking(BookingCreateDTO dto) {
        Room room = em.find(Room.class, dto.roomId);
        System.out.println("Salle recherchée : " + dto.roomId);

        if (room == null) {
            throw new IllegalArgumentException("Salle introuvable (ID=" + dto.roomId + ")");
        }

        if (dto.startTime.isAfter(dto.endTime)) {
            throw new IllegalArgumentException("La date de début ne peut pas être après la date de fin.");
        }

        if (dto.attendees > room.getCapacity()) {
            throw new IllegalArgumentException(
                    "Nombre de participants (" + dto.attendees +
                            ") > capacité de la salle (" + room.getCapacity() + ")."
            );
        }

        List<Booking> conflicts = getAvailableRoom(room.getId(), dto.startTime, dto.endTime);
        if (!conflicts.isEmpty()) {
            StringBuilder message = new StringBuilder("La salle est déjà réservée pour les périodes suivantes :\n");
            for (Booking conflict : conflicts) {
                message.append("Du ")
                        .append(DateUtils.formatForUser(conflict.getStartTime()))
                        .append(" au ")
                        .append(DateUtils.formatForUser(conflict.getEndTime()))
                        .append("\n");
            }
            System.out.println("Conflits détectés : " + message);
            throw new IllegalStateException(message.toString());
        }

        Booking booking = new Booking();
        System.out.println("Réservation créée : " + booking);

        booking.setTitle(dto.title);
        booking.setStartTime(dto.startTime);
        booking.setEndTime(dto.endTime);
        booking.setAttendees(dto.attendees);
        booking.setOrganizer(dto.organizer);
        booking.setRoom(room);

        booking.setBookingEquipments(new ArrayList<>());

        em.persist(booking);
        System.out.println("Réservation persistée avec succès : " + booking.getId());

        if (dto.bookingEquipments != null) {
            Map<Long, BookingEquipment> equipmentMap = new HashMap<>();

            for (var beDto : dto.bookingEquipments) {
                String key = beDto.equipmentId + "-" + beDto.startTime + "-" + beDto.endTime;

                if (!equipmentMap.containsKey(beDto.equipmentId)) {
                    Equipment equipment = em.find(Equipment.class, beDto.equipmentId);
                    if (equipment == null) {
                        continue;
                    }

                    BookingEquipment be = new BookingEquipment();
                    be.setEquipment(equipment);
                    be.setQuantity(beDto.quantity);
                    be.setBooking(booking);
                    be.setStartTime(beDto.startTime);
                    be.setEndTime(beDto.endTime);

                    equipmentMap.put(beDto.equipmentId, be);

                    booking.getBookingEquipments().add(be);

                    em.persist(be);
                }
            }

            checkEquipmentAvailability(new ArrayList<>(equipmentMap.values()), dto.startTime, dto.endTime);
        }

        em.flush();
        return booking;
    }

    @Transactional
    public Booking updateBooking(Long id, BookingUpdateDTO dto) {
        Booking booking = em.find(Booking.class, id);
        if (booking != null) {
            booking.setTitle(dto.title);
            booking.setRoom(em.find(Room.class, dto.roomId));
            booking.setStartTime(dto.startTime);
            booking.setEndTime(dto.endTime);
            booking.setAttendees(dto.attendees);
            booking.setOrganizer(dto.organizer);
        }

        return booking;
    }

    @Transactional
    public void deleteBooking(Long id) {
        Booking booking = em.find(Booking.class, id);
        if (booking != null) {
            em.remove(booking);
        }
    }

    public Booking getBookingByIdWithRelations(Long id) {
        return em.createQuery(
                        "SELECT DISTINCT b FROM Booking b " +
                                "LEFT JOIN FETCH b.room " +
                                "LEFT JOIN FETCH b.bookingEquipments be " +
                                "LEFT JOIN FETCH be.equipment " +
                                "WHERE b.id = :id", Booking.class)
                .setParameter("id", id)
                .getSingleResult();
    }

    public List<Booking> getBookingsWithRelations() {
        return em.createQuery(
                        "SELECT DISTINCT b FROM Booking b " +
                                "LEFT JOIN FETCH b.room " +
                                "LEFT JOIN FETCH b.bookingEquipments be " +
                                "LEFT JOIN FETCH be.equipment", Booking.class)
                .getResultList();
    }

    public List<Map<String, Object>> getAvailableEquipmentsForPeriod(LocalDateTime start, LocalDateTime end) {
        // Récupérer tous les équipements mobiles
        List<Equipment> allMobileEquipments = em.createQuery(
                        "SELECT e FROM Equipment e WHERE e.mobile = true", Equipment.class)
                .getResultList();

        // Récupérer tous les BookingEquipment qui chevauchent l'intervalle
        List<BookingEquipment> overlappingBookings = em.createQuery(
                        "SELECT be FROM BookingEquipment be WHERE be.startTime < :end AND be.endTime > :start", BookingEquipment.class)
                .setParameter("start", start)
                .setParameter("end", end)
                .getResultList();

        // Calcul de la quantité réservée
        Map<Long, Integer> usedQuantities = new HashMap<>();
        for (BookingEquipment be : overlappingBookings) {
            Long equipmentId = be.getEquipment().getId();
            usedQuantities.put(equipmentId,
                    usedQuantities.getOrDefault(equipmentId, 0) + be.getQuantity());
        }

        // Résultat structuré
        List<Map<String, Object>> result = new ArrayList<>();
        for (Equipment eq : allMobileEquipments) {
            int total = eq.getQuantity();
            int used = usedQuantities.getOrDefault(eq.getId(), 0);
            int available = Math.max(0, total - used);

            Map<String, Object> equipmentData = new HashMap<>();
            equipmentData.put("equipmentId", eq.getId());
            equipmentData.put("name", eq.getName());
            equipmentData.put("description", eq.getDescription());
            equipmentData.put("total", total);
            equipmentData.put("reserved", used);
            equipmentData.put("available", available);

            result.add(equipmentData);
        }

        return result;
    }
}
