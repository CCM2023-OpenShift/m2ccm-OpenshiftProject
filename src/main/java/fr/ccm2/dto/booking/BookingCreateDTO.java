package fr.ccm2.dto.booking;

import fr.ccm2.entities.Equipment;

import java.util.List;

public class BookingCreateDTO {
    public String title;
    public Long roomId;
    public String startTime;
    public String endTime;
    public int attendees;
    public List<Long> equipment;
    public String organizer;
}
