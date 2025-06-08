package fr.ccm2.mapper;

import fr.ccm2.dto.equipment.EquipmentResponseDTO;
import fr.ccm2.entities.Equipment;

public class EquipmentMapper {

    public static EquipmentResponseDTO toResponse(Equipment equipment) {
        EquipmentResponseDTO dto = new EquipmentResponseDTO();
        dto.id = equipment.getId();
        dto.name = equipment.getName();
        dto.description = equipment.getDescription();
        dto.quantity = equipment.getQuantity();
        dto.mobile = equipment.isMobile();
        dto.imageUrl = equipment.getImageUrl();
        return dto;
    }
}