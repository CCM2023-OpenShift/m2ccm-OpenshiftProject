package fr.ccm2.services;

import fr.ccm2.dto.equipment.EquipmentCreateDTO;
import fr.ccm2.dto.equipment.EquipmentUpdateDTO;
import fr.ccm2.entities.Equipment;
import fr.ccm2.entities.Room;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@ApplicationScoped
public class EquipmentService {

    @Inject
    EntityManager em;

    public List<Equipment> getAllEquipments() {
        return em.createQuery("FROM Equipment", Equipment.class).getResultList();
    }

    public Equipment getEquipmentById(Long id) {
        return em.find(Equipment.class, id);
    }

    @Transactional
    public Equipment createEquipment(EquipmentCreateDTO dto) {
        if (dto.name == null || dto.name.trim().isEmpty()) {
            throw new IllegalArgumentException("Le nom de l'équipement est obligatoire.");
        }

        if (dto.description == null || dto.description.trim().isEmpty()) {
            throw new IllegalArgumentException("La description de l'équipement est obligatoire.");
        }

        if (dto.quantity < 0) {
            throw new IllegalArgumentException("La quantité ne peut pas être négative.");
        }

        Equipment equipment = new Equipment();
        equipment.setName(dto.name);
        equipment.setDescription(dto.description);
        equipment.setQuantity(dto.quantity);
        equipment.setMobile(dto.mobile);

        em.persist(equipment);
        em.flush();

        return equipment;
    }

    @Transactional
    public Equipment updateEquipment(Long id, EquipmentUpdateDTO dto) {
        Equipment equipment = em.find(Equipment.class, id);
        if (equipment != null) {
            equipment.setName(dto.name);
            equipment.setDescription(dto.description);
            equipment.setQuantity(dto.quantity);
            equipment.setMobile(dto.mobile);
        }
        return equipment;
    }

    @Transactional
    public void deleteEquipment(Long id) {
        Equipment equipment = em.find(Equipment.class, id);
        if (equipment != null) {
            em.remove(equipment);
        }
    }

    
}
