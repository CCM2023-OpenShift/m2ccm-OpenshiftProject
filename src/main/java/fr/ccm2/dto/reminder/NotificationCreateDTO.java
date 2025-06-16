package fr.ccm2.dto.reminder;

import java.util.List;

public class NotificationCreateDTO {
    private String title;
    private String message;
    private List<String> targetUsers;
    private boolean forAllUsers;

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

    public List<String> getTargetUsers() {
        return targetUsers;
    }

    public void setTargetUsers(List<String> targetUsers) {
        this.targetUsers = targetUsers;
    }

    public boolean isForAllUsers() {
        return forAllUsers;
    }

    public void setForAllUsers(boolean forAllUsers) {
        this.forAllUsers = forAllUsers;
    }
}