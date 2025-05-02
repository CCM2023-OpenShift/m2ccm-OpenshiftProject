package fr.ccm2.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "room")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private Integer capacity;

    @ManyToMany
    @JoinTable(
            name = "room_equipment",
            joinColumns = @JoinColumn(name = "room_id"),
            inverseJoinColumns = @JoinColumn(name = "equipment_id")
    )
    private List<Equipment> equipment;

    @OneToMany(mappedBy = "room", cascade = CascadeType.REMOVE, orphanRemoval = true)
    @JsonIgnore
    private List<Booking> bookings;

    // Getters et Setters
    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }
    public List<Equipment> getEquipment() { return equipment; }
    public void setEquipment(List<Equipment> equipment) { this.equipment = equipment; }
    public List<Booking> getBookings() { return bookings; }
}
