package fr.ccm2.dto.room;

import fr.ccm2.dto.room_equipment.RoomEquipmentCreateDTO;

import java.util.List;

public class RoomCreateDTO {
    public String name;
    public Integer capacity;
    public List<RoomEquipmentCreateDTO> equipmentWithQuantities;
}
