package fr.ccm2.dto.booking;

import fr.ccm2.dto.booking_equipment.BookingEquipmentResponseDTO;
import fr.ccm2.dto.room.RoomResponseDTO;

import java.util.List;

public class BookingResponseDTO {
    public Long id;
    public String title;
    public RoomResponseDTO room;
    public String startTime;
    public String endTime;
    public int attendees;
    public String organizer;
    public List<BookingEquipmentResponseDTO> bookingEquipments;
}
