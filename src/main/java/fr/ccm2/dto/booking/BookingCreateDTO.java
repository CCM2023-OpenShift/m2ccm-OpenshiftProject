package fr.ccm2.dto.booking;

import java.time.LocalDateTime;

public class BookingCreateDTO {
    public String title;
    public Long roomId;
    public LocalDateTime startTime;
    public LocalDateTime endTime;
    public int attendees;
    public String organizer;
}
