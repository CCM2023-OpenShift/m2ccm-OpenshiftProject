package fr.ccm2.mapper;

import fr.ccm2.dto.booking.BookingResponseDTO;
import fr.ccm2.dto.equipment.EquipmentResponseDTO;
import fr.ccm2.dto.room.RoomResponseDTO;
import fr.ccm2.entities.Booking;
import fr.ccm2.entities.Room;
import org.hibernate.Hibernate;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class BookingMapper {
    public static BookingResponseDTO toResponse(Booking booking, boolean includeRoom, boolean includeEquipment) {
        BookingResponseDTO dto = new BookingResponseDTO();
        dto.id = booking.getId();
        dto.title = booking.getTitle();
        dto.startTime = booking.getStartTime().toString();
        dto.endTime = booking.getEndTime().toString();
        dto.attendees = booking.getAttendees();
        dto.organizer = booking.getOrganizer();

        if (includeRoom && booking.getRoom() != null) {
            dto.room = RoomMapper.toResponse(booking.getRoom(), includeEquipment);
        }

        return dto;
    }
}
