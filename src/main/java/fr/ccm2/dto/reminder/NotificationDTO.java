package fr.ccm2.dto.reminder;

import java.time.LocalDateTime;

public class NotificationDTO {
    private Long id;
    private Long bookingId;
    private String bookingTitle;
    private String roomName;
    private String organizer;
    private String organizerEmail;
    private String notificationType;
    private LocalDateTime sentAt;

    // Constructeurs
    public NotificationDTO() {
    }

    public NotificationDTO(Long id, Long bookingId, String bookingTitle, String roomName,
                           String organizer, String organizerEmail,
                           String notificationType, LocalDateTime sentAt) {
        this.id = id;
        this.bookingId = bookingId;
        this.bookingTitle = bookingTitle;
        this.roomName = roomName;
        this.organizer = organizer;
        this.organizerEmail = organizerEmail;
        this.notificationType = notificationType;
        this.sentAt = sentAt;
    }

    // Getters et setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }

    public String getBookingTitle() {
        return bookingTitle;
    }

    public void setBookingTitle(String bookingTitle) {
        this.bookingTitle = bookingTitle;
    }

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
    }

    public String getOrganizer() {
        return organizer;
    }

    public void setOrganizer(String organizer) {
        this.organizer = organizer;
    }

    public String getOrganizerEmail() {
        return organizerEmail;
    }

    public void setOrganizerEmail(String organizerEmail) {
        this.organizerEmail = organizerEmail;
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
}