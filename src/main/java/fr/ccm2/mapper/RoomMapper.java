package fr.ccm2.mapper;

import fr.ccm2.dto.room.RoomResponseDTO;
import fr.ccm2.entities.Room;

import java.util.ArrayList;
import java.util.stream.Collectors;

public class RoomMapper {
    public static RoomResponseDTO toResponse(Room room, boolean includeEquipment) {
        RoomResponseDTO dto = new RoomResponseDTO();
        dto.id = room.getId();
        dto.name = room.getName();
        dto.capacity = room.getCapacity();

        if (includeEquipment && room.getEquipment() != null) {
            dto.equipment = room.getEquipment().stream()
                    .map(EquipmentMapper::toResponse)
                    .collect(Collectors.toList());
        } else {
            dto.equipment = new ArrayList<>();
        }

        return dto;
    }
}
