package fr.ccm2.dto.booking_equipment;

import fr.ccm2.dto.equipment.EquipmentResponseDTO;

public class BookingEquipmentResponseDTO {
    public Long id;
    public Long bookingId;

    public EquipmentResponseDTO equipment;
    public Long equipmentId;

    public int quantity;
    public String startTime;
    public String endTime;
}