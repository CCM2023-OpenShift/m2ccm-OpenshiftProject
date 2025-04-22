package fr.ccm2.services;

import fr.ccm2.dto.BookingDTO;
import fr.ccm2.entities.Booking;
import fr.ccm2.entities.Equipment;
import fr.ccm2.entities.Room;
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

    @Transactional
    public void createBooking(BookingDTO dto) {
        Booking booking = new Booking();

        booking.setTitle(dto.title);
        booking.setRoom(em.find(Room.class, dto.roomId));
        booking.setStartTime(LocalDateTime.parse(dto.startTime));
        booking.setEndTime(LocalDateTime.parse(dto.endTime));
        booking.setAttendees(dto.attendees);
        booking.setOrganizer(dto.organizer);

        List<Equipment> equipmentList = dto.equipment.stream()
                .map(id -> em.find(Equipment.class, id))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        booking.setEquipment(equipmentList);

        em.persist(booking);
    }
}
