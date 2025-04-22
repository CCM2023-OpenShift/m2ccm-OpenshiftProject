package fr.ccm2.dto;

import java.util.List;

public class BookingDTO {
    public String title;
    public Long roomId;
    public String startTime;
    public String endTime;
    public int attendees;
    public List<Long> equipment;
    public String organizer;
}
