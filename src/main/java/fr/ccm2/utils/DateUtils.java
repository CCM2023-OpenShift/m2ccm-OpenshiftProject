package fr.ccm2.utils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class DateUtils {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_DATE_TIME;
    private static final DateTimeFormatter USER_FRIENDLY_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy 'à' HH:mm");

    private DateUtils() {
        // Constructeur privé pour empêcher l'instanciation
    }

    public static LocalDateTime parseDateOrNull(String dateString) {
        if (dateString == null || dateString.isEmpty()) {
            return null;
        }
        try {
            return LocalDateTime.parse(dateString, FORMATTER);
        } catch (Exception e) {
            return null;
        }
    }

    public static String formatForUser(LocalDateTime dateTime) {
        if (dateTime == null) return "";
        return USER_FRIENDLY_FORMATTER.format(dateTime);
    }
}
