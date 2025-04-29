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
        Equipment equipment = new Equipment();

        equipment.setName(dto.name);
        equipment.setDescription(dto.description);

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
