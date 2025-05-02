package fr.ccm2.services;

import fr.ccm2.dto.booking.BookingCreateDTO;
import fr.ccm2.dto.booking.BookingUpdateDTO;
import fr.ccm2.dto.room.RoomResponseDTO;
import fr.ccm2.entities.Booking;
import fr.ccm2.entities.Equipment;
import fr.ccm2.entities.Room;
import fr.ccm2.utils.DateUtils;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

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

    public boolean isRoomAvailable(Long roomId, LocalDateTime start, LocalDateTime end) {
        List<Booking> conflicts = em.createQuery(
                        "SELECT b FROM Booking b WHERE b.room.id = :roomId " +
                                "AND b.endTime > :start AND b.startTime < :end", Booking.class)
                .setParameter("roomId", roomId)
                .setParameter("start", start)
                .setParameter("end", end)
                .getResultList();

        return conflicts.isEmpty();
    }

    @Transactional
    public Booking createBooking(BookingCreateDTO dto) {
        Room room = em.find(Room.class, dto.roomId);
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

        if (!isRoomAvailable(room.getId(), dto.startTime, dto.endTime)) {
            throw new IllegalStateException(
                    "La salle est déjà réservée entre " +
                            dto.startTime + " et " + dto.endTime + "."
            );
        }

        Booking booking = new Booking();
        booking.setTitle(dto.title);
        booking.setStartTime(dto.startTime);
        booking.setEndTime(dto.endTime);
        booking.setAttendees(dto.attendees);
        booking.setOrganizer(dto.organizer);
        booking.setRoom(room);

        em.persist(booking);
        em.flush();
        return booking;
    }

    @Transactional
    public Booking updateBooking(Long id, BookingUpdateDTO dto) {
        Booking booking = em.find(Booking.class, id);
        if (booking != null) {
            booking.setTitle(dto.title);
            booking.setRoom(em.find(Room.class, dto.roomId));
            booking.setStartTime(DateUtils.parseDateOrNull(dto.startTime));
            booking.setEndTime(DateUtils.parseDateOrNull(dto.endTime));
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
                        "SELECT b FROM Booking b " +
                                "LEFT JOIN FETCH b.room r " +
                                "LEFT JOIN FETCH r.equipment " +
                                "WHERE b.id = :id", Booking.class)
                .setParameter("id", id)
                .getSingleResult();
    }

    public List<Booking> getBookingsWithRelations() {
        return em.createQuery(
                        "SELECT DISTINCT b FROM Booking b " +
                                "LEFT JOIN FETCH b.room r " +
                                "LEFT JOIN FETCH r.equipment", Booking.class)
                .getResultList();
    }
}
