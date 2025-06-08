package fr.ccm2.dto.room;

import fr.ccm2.dto.room_equipment.RoomEquipmentUpdateDTO;

import java.util.List;

public class RoomUpdateDTO {
    public String name;
    public Integer capacity;
    public String imageUrl;
    public List<RoomEquipmentUpdateDTO> equipmentWithQuantities;
}
