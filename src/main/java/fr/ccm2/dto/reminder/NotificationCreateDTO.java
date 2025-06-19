package fr.ccm2.dto.reminder;

import java.util.List;

public class NotificationCreateDTO {
    public String title;
    public String message;
    public List<String> targetUsers;
    public boolean forAllUsers;
    public String notificationType;
}
