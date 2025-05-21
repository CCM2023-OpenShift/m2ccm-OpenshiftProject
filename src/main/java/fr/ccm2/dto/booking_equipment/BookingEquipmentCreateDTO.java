package fr.ccm2.dto.booking_equipment;

import java.time.LocalDateTime;

public class BookingEquipmentCreateDTO {
    public Long equipmentId;
    public int quantity;
    public LocalDateTime startTime;
    public LocalDateTime endTime;
}
