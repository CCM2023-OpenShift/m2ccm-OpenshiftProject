package fr.ccm2.mapper;

import fr.ccm2.dto.room.RoomResponseDTO;
import fr.ccm2.dto.room_equipment.RoomEquipmentResponseDTO;
import fr.ccm2.entities.Room;
import fr.ccm2.entities.RoomEquipment;

import java.util.stream.Collectors;

public class RoomMapper {

    public static RoomResponseDTO toResponse(Room room, boolean includeEquipments) {
        RoomResponseDTO dto = new RoomResponseDTO();
        dto.id = room.getId();
        dto.name = room.getName();
        dto.capacity = room.getCapacity();
        dto.imageUrl = room.getImageUrl();

        // Ajouter les équipements de la salle (en évitant une boucle infinie)
        if (includeEquipments && room.getRoomEquipments() != null) {
            dto.roomEquipments = room.getRoomEquipments().stream()
                    .map(RoomMapper::mapRoomEquipment)
                    .collect(Collectors.toList());
        }

        return dto;
    }

    private static RoomEquipmentResponseDTO mapRoomEquipment(RoomEquipment re) {
        RoomEquipmentResponseDTO dto = new RoomEquipmentResponseDTO();
        dto.id = re.getId();
        dto.roomId = re.getRoom().getId();
        dto.equipmentId = re.getEquipment().getId();
        dto.quantity = re.getQuantity();
        return dto;
    }
}
