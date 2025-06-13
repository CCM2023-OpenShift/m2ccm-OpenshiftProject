package fr.ccm2.dto.booking;

import fr.ccm2.dto.booking_equipment.BookingEquipmentCreateDTO;

import java.time.LocalDateTime;
import java.util.List;

public class BookingCreateDTO {
    public String title;
    public Long roomId;
    public LocalDateTime startTime;
    public LocalDateTime endTime;
    public int attendees;
    public String organizer;
    public List<BookingEquipmentCreateDTO> bookingEquipments;
}
