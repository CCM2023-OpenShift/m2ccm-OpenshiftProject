package fr.ccm2.dto.room;

import fr.ccm2.dto.room_equipment.RoomEquipmentResponseDTO;

import java.util.List;

public class RoomResponseDTO {
    public Long id;
    public String name;
    public Integer capacity;
    public String building;
    public String floor;
    public String type;
    public String imageUrl;
    public List<RoomEquipmentResponseDTO> roomEquipments;
}
