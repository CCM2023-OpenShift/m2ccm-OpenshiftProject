package fr.ccm2.dto.booking;

import fr.ccm2.dto.booking_equipment.BookingEquipmentUpdateDTO;

import java.time.LocalDateTime;
import java.util.List;

public class BookingUpdateDTO {
    public String title;
    public Long roomId;
    public LocalDateTime startTime;
    public LocalDateTime endTime;
    public int attendees;
    public String organizer;
    public List<BookingEquipmentUpdateDTO> bookingEquipments;
}
