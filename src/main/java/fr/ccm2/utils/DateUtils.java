package fr.ccm2.utils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class DateUtils {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_DATE_TIME;

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
            // Option : logger l'erreur ici si tu veux
            return null;
        }
    }
}
