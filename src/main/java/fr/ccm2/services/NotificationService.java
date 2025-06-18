package fr.ccm2.services;

import fr.ccm2.dto.reminder.NotificationCreateDTO;
import fr.ccm2.dto.reminder.NotificationResponseDTO;
import fr.ccm2.dto.reminder.NotificationUpdateDTO;
import fr.ccm2.entities.Booking;
import fr.ccm2.entities.SentNotification;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class NotificationService {

    @Inject
    EntityManager em;

    /**
     * Récupère les notifications d'un utilisateur avec filtrage
     */
    public List<NotificationResponseDTO> getUserNotifications(String username, Boolean read, String type, int limit, int offset) {
        StringBuilder queryBuilder = new StringBuilder(
                "SELECT n FROM SentNotification n WHERE LOWER(n.booking.organizer) = :username AND n.deleted = false");

        if (read != null) {
            queryBuilder.append(" AND n.read = :read");
        }

        if (type != null && !type.isEmpty()) {
            queryBuilder.append(" AND n.notificationType = :type");
        }

        queryBuilder.append(" ORDER BY n.sentAt DESC");

        TypedQuery<SentNotification> query = em.createQuery(queryBuilder.toString(), SentNotification.class)
                .setParameter("username", username.toLowerCase())
                .setFirstResult(offset)
                .setMaxResults(limit);

        if (read != null) {
            query.setParameter("read", read);
        }

        if (type != null && !type.isEmpty()) {
            query.setParameter("type", type);
        }

        List<SentNotification> notifications = query.getResultList();
        return notifications.stream().map(this::convertToResponseDTO).collect(Collectors.toList());
    }

    /**
     * Compte le nombre total de notifications pour un utilisateur
     */
    public long countUserNotifications(String username, Boolean read, String type) {
        StringBuilder queryBuilder = new StringBuilder(
                "SELECT COUNT(n) FROM SentNotification n WHERE LOWER(n.booking.organizer) = :username AND n.deleted = false");

        if (read != null) {
            queryBuilder.append(" AND n.read = :read");
        }

        if (type != null && !type.isEmpty()) {
            queryBuilder.append(" AND n.notificationType = :type");
        }

        TypedQuery<Long> countQuery = em.createQuery(queryBuilder.toString(), Long.class)
                .setParameter("username", username.toLowerCase());

        if (read != null) {
            countQuery.setParameter("read", read);
        }

        if (type != null && !type.isEmpty()) {
            countQuery.setParameter("type", type);
        }

        return countQuery.getSingleResult();
    }

    /**
     * Récupère le nombre de notifications non lues pour un utilisateur
     */
    public long getUnreadCount(String username) {
        return em.createQuery(
                        "SELECT COUNT(n) FROM SentNotification n WHERE LOWER(n.booking.organizer) = :username AND n.read = false AND n.deleted = false",
                        Long.class)
                .setParameter("username", username.toLowerCase())
                .getSingleResult();
    }

    /**
     * Récupère une notification par ID
     */
    public SentNotification getNotificationById(Long id) {
        return em.find(SentNotification.class, id);
    }

    /**
     * Marque une notification comme lue ou non lue
     */
    @Transactional
    public SentNotification updateReadStatus(SentNotification notification, boolean readStatus) {
        notification.setRead(readStatus);
        em.merge(notification);
        return notification;
    }

    /**
     * Marque toutes les notifications d'un utilisateur comme lues
     */
    @Transactional
    public int markAllAsRead(String username) {
        List<SentNotification> notifications = em.createQuery(
                        "SELECT n FROM SentNotification n WHERE LOWER(n.booking.organizer) = :username AND n.read = false AND n.deleted = false",
                        SentNotification.class)
                .setParameter("username", username.toLowerCase())
                .getResultList();

        int count = 0;
        for (SentNotification notification : notifications) {
            notification.setRead(true);
            em.merge(notification);
            count++;
        }
        return count;
    }

    /**
     * Marque toutes les notifications (admin) comme lues
     */
    @Transactional
    public int markAllNotificationsAsRead() {
        return em.createQuery("UPDATE SentNotification n SET n.read = true WHERE n.read = false")
                .executeUpdate();
    }

    /**
     * Supprime une notification (soft delete)
     */
    @Transactional
    public void softDeleteNotification(SentNotification notification) {
        notification.setDeleted(true);
        em.merge(notification);
    }

    /**
     * Supprime définitivement une notification (hard delete)
     */
    @Transactional
    public void hardDeleteNotification(SentNotification notification) {
        em.remove(notification);
    }

    /**
     * Récupère toutes les notifications (admin)
     */
    public List<NotificationResponseDTO> getAllNotifications(String type, String organizer, int limit, int offset) {
        StringBuilder queryBuilder = new StringBuilder("SELECT n FROM SentNotification n WHERE n.deleted = false");

        if (type != null && !type.isEmpty()) {
            queryBuilder.append(" AND n.notificationType = :type");
        }

        if (organizer != null && !organizer.isEmpty()) {
            queryBuilder.append(" AND LOWER(n.booking.organizer) = :organizer");
        }

        queryBuilder.append(" ORDER BY n.sentAt DESC");

        TypedQuery<SentNotification> query = em.createQuery(queryBuilder.toString(), SentNotification.class)
                .setFirstResult(offset)
                .setMaxResults(limit);

        if (type != null && !type.isEmpty()) {
            query.setParameter("type", type);
        }

        if (organizer != null && !organizer.isEmpty()) {
            query.setParameter("organizer", organizer.toLowerCase());
        }

        List<SentNotification> notifications = query.getResultList();
        return notifications.stream().map(this::convertToResponseDTO).collect(Collectors.toList());
    }

    /**
     * Compte le nombre total de notifications pour l'admin
     */
    public long countAllNotifications(String type, String organizer) {
        StringBuilder countQueryBuilder = new StringBuilder("SELECT COUNT(n) FROM SentNotification n WHERE n.deleted = false");

        if (type != null && !type.isEmpty()) {
            countQueryBuilder.append(" AND n.notificationType = :type");
        }

        if (organizer != null && !organizer.isEmpty()) {
            countQueryBuilder.append(" AND LOWER(n.booking.organizer) = :organizer");
        }

        TypedQuery<Long> countQuery = em.createQuery(countQueryBuilder.toString(), Long.class);

        if (type != null && !type.isEmpty()) {
            countQuery.setParameter("type", type);
        }

        if (organizer != null && !organizer.isEmpty()) {
            countQuery.setParameter("organizer", organizer.toLowerCase());
        }

        return countQuery.getSingleResult();
    }

    /**
     * Crée une notification pour un utilisateur spécifique
     */
    @Transactional
    public SentNotification createNotificationForUser(String username, NotificationCreateDTO data) {
        List<Long> bookingIds = em.createQuery(
                        "SELECT b.id FROM Booking b WHERE LOWER(b.organizer) = :username ORDER BY b.startTime DESC",
                        Long.class)
                .setParameter("username", username.toLowerCase())
                .setMaxResults(1)
                .getResultList();

        if (bookingIds.isEmpty()) {
            return null;
        }

        SentNotification notification = new SentNotification();
        notification.setBooking(em.getReference(Booking.class, bookingIds.get(0)));

        // Utiliser le type spécifié ou par défaut "manual"
        String notificationType = data.notificationType;
        notification.setNotificationType(notificationType != null && !notificationType.isEmpty() ? notificationType : "manual");

        notification.setTitle(data.title);
        notification.setMessage(data.message);
        notification.setSentAt(LocalDateTime.now());

        // Récupère l'email réel du destinataire
        String recipientEmail = getEmailForUser(username);
        notification.setOrganizerEmail(recipientEmail);

        notification.setRead(false);
        notification.setDeleted(false);

        em.persist(notification);

        // Envoi d'e-mail après la création de la notification
        if (recipientEmail != null && !recipientEmail.isEmpty()) {
            String subject = data.title;
            String body = data.message;
            emailService.sendNotificationEmail(recipientEmail, subject, body);
        }

        return notification;
    }

    /**
     * Met à jour une notification existante
     */
    @Transactional
    public SentNotification updateNotification(SentNotification notification, NotificationUpdateDTO updates) {
        if (updates.title != null) {
            notification.setTitle(updates.title);
        }

        if (updates.message != null) {
            notification.setMessage(updates.message);
        }

        if (updates.notificationType != null) {
            notification.setNotificationType(updates.notificationType);
        }

        if (updates.read != null) {
            notification.setRead(updates.read);
        }

        em.merge(notification);
        return notification;
    }

    /**
     * Convertit une entité SentNotification en NotificationResponseDTO
     */
    public NotificationResponseDTO convertToResponseDTO(SentNotification n) {
        String title, message;

        if ("24h".equals(n.getNotificationType())) {
            title = n.getTitle() != null ? n.getTitle() : "Rappel: Votre réservation demain";
            message = n.getMessage() != null ? n.getMessage() :
                    "Votre réservation \"" + n.getBooking().getTitle() +
                            "\" dans la salle " + n.getBooking().getRoom().getName() +
                            " est prévue demain.";
        } else if ("1h".equals(n.getNotificationType())) {
            title = n.getTitle() != null ? n.getTitle() : "⚠️ Votre réservation commence bientôt";
            message = n.getMessage() != null ? n.getMessage() :
                    "Votre réservation \"" + n.getBooking().getTitle() +
                            "\" dans la salle " + n.getBooking().getRoom().getName() +
                            " commence dans moins d'une heure.";
        } else {
            title = n.getTitle();
            message = n.getMessage();
        }

        NotificationResponseDTO dto = new NotificationResponseDTO();
        dto.id = n.getId();
        dto.bookingId = n.getBooking().getId();
        dto.bookingTitle = n.getBooking().getTitle();
        dto.roomName = n.getBooking().getRoom().getName();
        dto.organizer = n.getBooking().getOrganizer();
        dto.organizerEmail = n.getOrganizerEmail();
        dto.notificationType = n.getNotificationType();
        dto.sentAt = n.getSentAt();
        dto.title = title;
        dto.message = message;
        dto.read = n.isRead();
        dto.deleted = n.isDeleted();

        return dto;
    }
}