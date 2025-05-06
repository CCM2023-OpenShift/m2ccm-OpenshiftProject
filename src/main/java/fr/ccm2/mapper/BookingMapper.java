package fr.ccm2.mapper;

import fr.ccm2.dto.booking_equipment.BookingEquipmentResponseDTO;
import fr.ccm2.dto.booking.BookingResponseDTO;
import fr.ccm2.dto.booking.BookingCreateDTO;
import fr.ccm2.dto.booking.BookingUpdateDTO;
import fr.ccm2.entities.Booking;
import fr.ccm2.entities.BookingEquipment;
import fr.ccm2.entities.Room;

import java.util.List;
import java.util.stream.Collectors;

public class BookingMapper {

    // Méthode pour convertir une entité Booking en BookingResponseDTO
    public static BookingResponseDTO toResponse(Booking booking, boolean includeRoom, boolean includeEquipments) {
        BookingResponseDTO dto = new BookingResponseDTO();
        dto.id = booking.getId();
        dto.title = booking.getTitle();

        if (includeRoom) {
            dto.room = RoomMapper.toResponse(booking.getRoom(), true);
        }

        dto.startTime = booking.getStartTime().toString();
        dto.endTime = booking.getEndTime().toString();
        dto.attendees = booking.getAttendees();
        dto.organizer = booking.getOrganizer();

        // Si on inclut les équipements, on les ajoute
        if (includeEquipments && booking.getBookingEquipments() != null) {
            List<BookingEquipmentResponseDTO> equipmentDTOs = booking.getBookingEquipments().stream()
                    .map(BookingMapper::mapBookingEquipment)
                    .collect(Collectors.toList());
            dto.bookingEquipments = equipmentDTOs;
        }

        return dto;
    }


    // Mapper les équipements associés à la réservation
    private static BookingEquipmentResponseDTO mapBookingEquipment(BookingEquipment bookingEquipment) {
        BookingEquipmentResponseDTO dto = new BookingEquipmentResponseDTO();
        dto.equipmentId = bookingEquipment.getEquipment().getId();
        dto.quantity = bookingEquipment.getQuantity();
        return dto;
    }

    // Convertir un BookingCreateDTO en entité Booking
    public static Booking fromCreateDTO(BookingCreateDTO dto) {
        Booking booking = new Booking();
        booking.setTitle(dto.title);
        booking.setStartTime(dto.startTime);
        booking.setEndTime(dto.endTime);
        booking.setAttendees(dto.attendees);
        booking.setOrganizer(dto.organizer);
        // Associer la room avec l'ID sans setter l'id
        Room room = new Room();
        room = new Room();
        room.setId(dto.roomId); // Récupérer l'ID de la Room sans setter un ID manuellement
        booking.setRoom(room);
        return booking;
    }

    // Convertir un BookingUpdateDTO en entité Booking
    public static Booking fromUpdateDTO(BookingUpdateDTO dto) {
        Booking booking = new Booking();
        booking.setTitle(dto.title);
        booking.setStartTime(dto.startTime);
        booking.setEndTime(dto.endTime);
        booking.setAttendees(dto.attendees);
        booking.setOrganizer(dto.organizer);
        // Associer la room selon l'ID
        Room room = new Room();
        room.setId(dto.roomId); // Toujours associer une Room via son ID sans setter l'id
        booking.setRoom(room);
        return booking;
    }
}
