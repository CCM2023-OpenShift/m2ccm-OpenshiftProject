package fr.ccm2.dto.room;

import fr.ccm2.dto.equipment.EquipmentResponseDTO;
import fr.ccm2.entities.Equipment;

import java.util.List;

public class RoomResponseDTO {
    public Long id;
    public String name;
    public Integer capacity;
    public List<EquipmentResponseDTO> equipment;
}
