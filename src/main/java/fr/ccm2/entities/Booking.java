package fr.ccm2.entities;

import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "booking")
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    private Integer attendees;
    private String organizer;

    @ManyToOne
    @JoinColumn(name = "room_id")
    @JsonIgnoreProperties("bookings")
    private Room room;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<BookingEquipment> bookingEquipments;

    // Getters et Setters
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    public Integer getAttendees() { return attendees; }
    public void setAttendees(Integer attendees) { this.attendees = attendees; }
    public String getOrganizer() { return organizer; }
    public void setOrganizer(String organizer) { this.organizer = organizer; }
    public Room getRoom() { return room; }
    public void setRoom(Room room) { this.room = room; }
    public List<BookingEquipment> getBookingEquipments() { return bookingEquipments; }
    public void setBookingEquipments(List<BookingEquipment> bookingEquipments) { this.bookingEquipments = bookingEquipments; }
}
