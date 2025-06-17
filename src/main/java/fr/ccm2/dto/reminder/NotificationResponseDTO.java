package fr.ccm2.dto.reminder;

import java.time.LocalDateTime;

public class NotificationResponseDTO {
    public Long id;
    public Long bookingId;
    public String bookingTitle;
    public String roomName;
    public String organizer;
    public String organizerEmail;
    public String notificationType;
    public LocalDateTime sentAt;
    public String title;
    public String message;
    public boolean read;
    public boolean deleted;
}
