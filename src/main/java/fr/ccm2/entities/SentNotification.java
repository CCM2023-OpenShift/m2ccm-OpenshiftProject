package fr.ccm2.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "sent_notifications")
public class SentNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Booking booking;

    @Column(name = "notification_type", nullable = false)
    private String notificationType; // "24h", "1h", "manual", "conflict"

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    @Column(name = "organizer_email")
    private String organizerEmail;

    @Column(name = "title")
    private String title;

    @Column(name = "message", length = 1000)
    private String message;

    @Column(name = "read_status")
    private boolean read = false;

    @Column(name = "deleted")
    private boolean deleted = false;

    // Constructors
    public SentNotification() {
    }

    public SentNotification(Booking booking, String notificationType, String organizerEmail) {
        this.booking = booking;
        this.notificationType = notificationType;
        this.organizerEmail = organizerEmail;
        this.sentAt = LocalDateTime.now();
    }

    // Getters & Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Booking getBooking() {
        return booking;
    }

    public void setBooking(Booking booking) {
        this.booking = booking;
    }

    public String getNotificationType() {
        return notificationType;
    }

    public void setNotificationType(String notificationType) {
        this.notificationType = notificationType;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }

    public String getOrganizerEmail() {
        return organizerEmail;
    }

    public void setOrganizerEmail(String organizerEmail) {
        this.organizerEmail = organizerEmail;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isRead() {
        return read;
    }

    public void setRead(boolean read) {
        this.read = read;
    }

    public boolean isDeleted() {
        return deleted;
    }

    public void setDeleted(boolean deleted) {
        this.deleted = deleted;
    }
}