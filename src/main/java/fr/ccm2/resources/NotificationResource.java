package fr.ccm2.resources;

import fr.ccm2.dto.reminder.NotificationDTO;
import fr.ccm2.dto.reminder.NotificationCreateDTO;
import fr.ccm2.entities.SentNotification;
import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Path("/notifications")
public class NotificationResource {

    @Inject
    EntityManager em;

    @Context
    SecurityContext securityContext;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    /**
     * Récupère les notifications de l'utilisateur connecté avec support de filtrage et pagination
     */
    @GET
    @RolesAllowed({"user", "admin"})
    public Response getUserNotifications(
            @QueryParam("read") Boolean read,
            @QueryParam("limit") @DefaultValue("50") int limit,
            @QueryParam("offset") @DefaultValue("0") int offset,
            @QueryParam("type") String type) {

        // Récupérer le nom d'utilisateur connecté
        String currentUsername = securityContext.getUserPrincipal().getName().toLowerCase();

        // Construire la requête avec les filtres optionnels
        StringBuilder queryBuilder = new StringBuilder(
                "SELECT n FROM SentNotification n WHERE LOWER(n.booking.organizer) = :username");

        // Ajouter filtres optionnels
        if (read != null) {
            queryBuilder.append(" AND n.read = :read");
        }

        if (type != null && !type.isEmpty()) {
            queryBuilder.append(" AND n.notificationType = :type");
        }

        queryBuilder.append(" ORDER BY n.sentAt DESC");

        // Créer la requête
        TypedQuery<SentNotification> query = em.createQuery(queryBuilder.toString(), SentNotification.class)
                .setParameter("username", currentUsername)
                .setFirstResult(offset)
                .setMaxResults(limit);

        // Ajouter paramètres optionnels
        if (read != null) {
            query.setParameter("read", read);
        }

        if (type != null && !type.isEmpty()) {
            query.setParameter("type", type);
        }

        // Exécuter la requête
        List<SentNotification> notifications = query.getResultList();

        // Convertir en format adapté au frontend
        List<Map<String, Object>> result = new ArrayList<>();

        for (SentNotification n : notifications) {
            Map<String, Object> notif = new HashMap<>();

            notif.put("id", n.getId().toString());
            notif.put("userId", currentUsername);
            notif.put("bookingId", n.getBooking().getId().toString());
            notif.put("type", "BOOKING_REMINDER");

            // Titre et message
            String title, message;
            if ("24h".equals(n.getNotificationType())) {
                title = "Rappel: Votre réservation demain";
                message = "Votre réservation \"" + n.getBooking().getTitle() +
                        "\" dans la salle " + n.getBooking().getRoom().getName() +
                        " est prévue demain.";
            } else {
                title = "⚠️ Votre réservation commence bientôt";
                message = "Votre réservation \"" + n.getBooking().getTitle() +
                        "\" dans la salle " + n.getBooking().getRoom().getName() +
                        " commence dans moins d'une heure.";
            }

            notif.put("title", title);
            notif.put("message", message);
            notif.put("read", read != null ? read : false);
            notif.put("createdAt", n.getSentAt().format(FORMATTER));

            result.add(notif);
        }

        // Ajouter les métadonnées de pagination
        Map<String, Object> response = new HashMap<>();
        response.put("notifications", result);
        response.put("total", countUserNotifications(currentUsername, read, type));
        response.put("limit", limit);
        response.put("offset", offset);

        return Response.ok(response).build();
    }

    /**
     * Renvoie le nombre total de notifications pour un utilisateur
     */
    private long countUserNotifications(String username, Boolean read, String type) {
        StringBuilder queryBuilder = new StringBuilder(
                "SELECT COUNT(n) FROM SentNotification n WHERE LOWER(n.booking.organizer) = :username");

        if (read != null) {
            queryBuilder.append(" AND n.read = :read");
        }

        if (type != null && !type.isEmpty()) {
            queryBuilder.append(" AND n.notificationType = :type");
        }

        TypedQuery<Long> countQuery = em.createQuery(queryBuilder.toString(), Long.class)
                .setParameter("username", username);

        if (read != null) {
            countQuery.setParameter("read", read);
        }

        if (type != null && !type.isEmpty()) {
            countQuery.setParameter("type", type);
        }

        return countQuery.getSingleResult();
    }

    /**
     * Récupère le nombre de notifications non lues pour l'utilisateur connecté
     */
    @GET
    @Path("/unread-count")
    @RolesAllowed({"user", "admin"})
    public Response getUnreadCount() {
        String currentUsername = securityContext.getUserPrincipal().getName().toLowerCase();

        Long count = em.createQuery(
                        "SELECT COUNT(n) FROM SentNotification n WHERE LOWER(n.booking.organizer) = :username AND n.read = false",
                        Long.class)
                .setParameter("username", currentUsername)
                .getSingleResult();

        Map<String, Object> result = new HashMap<>();
        result.put("count", count);

        return Response.ok(result).build();
    }

    /**
     * Retourne la liste des types de notifications disponibles
     */
    @GET
    @Path("/types")
    @RolesAllowed({"user", "admin"})
    public Response getNotificationTypes() {
        List<Map<String, Object>> types = new ArrayList<>();

        // Rappel 24h
        Map<String, Object> type1 = new HashMap<>();
        type1.put("code", "24h");
        type1.put("name", "Rappel 24h avant réservation");
        type1.put("description", "Notification envoyée 24h avant le début d'une réservation");
        types.add(type1);

        // Rappel 1h
        Map<String, Object> type2 = new HashMap<>();
        type2.put("code", "1h");
        type2.put("name", "Rappel 1h avant réservation");
        type2.put("description", "Notification envoyée 1h avant le début d'une réservation");
        types.add(type2);

        // Notification manuelle (pour admins)
        Map<String, Object> type3 = new HashMap<>();
        type3.put("code", "manual");
        type3.put("name", "Notification manuelle");
        type3.put("description", "Notification créée manuellement par un administrateur");
        types.add(type3);

        // Conflit de réservation
        Map<String, Object> type4 = new HashMap<>();
        type4.put("code", "conflict");
        type4.put("name", "Conflit de réservation");
        type4.put("description", "Notification concernant un conflit de réservation");
        types.add(type4);

        return Response.ok(types).build();
    }

    /**
     * Marque une notification comme lue pour l'utilisateur
     */
    @PUT
    @Path("/{id}/read")
    @RolesAllowed({"user", "admin"})
    @Transactional
    public Response markAsRead(@PathParam("id") Long id) {
        String currentUsername = securityContext.getUserPrincipal().getName().toLowerCase();

        // Vérifier que la notification appartient à l'utilisateur
        SentNotification notification = em.find(SentNotification.class, id);

        if (notification == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("success", false, "message", "Notification non trouvée"))
                    .build();
        }

        if (!currentUsername.equalsIgnoreCase(notification.getBooking().getOrganizer()) &&
                !securityContext.isUserInRole("admin")) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of("success", false, "message", "Vous n'êtes pas autorisé à marquer cette notification comme lue"))
                    .build();
        }

        // Marquer comme lue
        notification.setRead(true);
        em.merge(notification);

        return Response.ok()
                .entity(Map.of("success", true, "message", "Notification marquée comme lue"))
                .build();
    }

    /**
     * Marque une notification comme non lue pour l'utilisateur
     */
    @PUT
    @Path("/{id}/unread")
    @RolesAllowed({"user", "admin"})
    @Transactional
    public Response markAsUnread(@PathParam("id") Long id) {
        String currentUsername = securityContext.getUserPrincipal().getName().toLowerCase();

        // Vérifier que la notification appartient à l'utilisateur
        SentNotification notification = em.find(SentNotification.class, id);

        if (notification == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("success", false, "message", "Notification non trouvée"))
                    .build();
        }

        if (!currentUsername.equalsIgnoreCase(notification.getBooking().getOrganizer()) &&
                !securityContext.isUserInRole("admin")) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of("success", false, "message", "Vous n'êtes pas autorisé à modifier cette notification"))
                    .build();
        }

        // Marquer comme non lue
        notification.setRead(false);
        em.merge(notification);

        return Response.ok()
                .entity(Map.of("success", true, "message", "Notification marquée comme non lue"))
                .build();
    }

    /**
     * Marque toutes les notifications de l'utilisateur connecté comme lues
     */
    @PUT
    @Path("/read-all")
    @RolesAllowed({"user", "admin"})
    @Transactional
    public Response markUserNotificationsAsRead() {
        String currentUsername = securityContext.getUserPrincipal().getName().toLowerCase();

        // Récupérer les notifications de l'utilisateur
        List<SentNotification> notifications = em.createQuery(
                        "SELECT n FROM SentNotification n WHERE LOWER(n.booking.organizer) = :username AND n.read = false",
                        SentNotification.class)
                .setParameter("username", currentUsername)
                .getResultList();

        // Marquer toutes comme lues
        int count = 0;
        for (SentNotification notification : notifications) {
            notification.setRead(true);
            em.merge(notification);
            count++;
        }

        return Response.ok()
                .entity(Map.of(
                        "success", true,
                        "message", count + " notification(s) marquée(s) comme lue(s)",
                        "count", count
                ))
                .build();
    }

    /**
     * Supprime une notification pour l'utilisateur connecté
     */
    @DELETE
    @Path("/{id}")
    @RolesAllowed({"user", "admin"})
    @Transactional
    public Response deleteUserNotification(@PathParam("id") Long id) {
        String currentUsername = securityContext.getUserPrincipal().getName().toLowerCase();

        // Vérifier que la notification appartient à l'utilisateur
        SentNotification notification = em.find(SentNotification.class, id);

        if (notification == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("success", false, "message", "Notification non trouvée"))
                    .build();
        }

        // Vérifier que l'utilisateur est l'organisateur de la réservation
        // (sauf pour les admins qui peuvent supprimer n'importe quelle notification)
        if (!securityContext.isUserInRole("admin") &&
                !currentUsername.equalsIgnoreCase(notification.getBooking().getOrganizer())) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of("success", false, "message", "Vous n'êtes pas autorisé à supprimer cette notification"))
                    .build();
        }

        // Marquer comme supprimée (soft delete)
        notification.setDeleted(true);
        em.merge(notification);

        return Response.ok()
                .entity(Map.of("success", true, "message", "Notification supprimée avec succès"))
                .build();
    }

    /**
     * Modifie une notification existante (admin uniquement)
     */
    @PATCH
    @Path("/{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("admin")
    @Transactional
    public Response updateNotification(@PathParam("id") Long id, Map<String, Object> updates) {
        try {
            SentNotification notification = em.find(SentNotification.class, id);
            if (notification == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("success", false, "message", "Notification non trouvée"))
                        .build();
            }

            // Mise à jour des champs fournis
            if (updates.containsKey("title")) {
                notification.setTitle((String) updates.get("title"));
            }

            if (updates.containsKey("message")) {
                notification.setMessage((String) updates.get("message"));
            }

            if (updates.containsKey("notificationType")) {
                notification.setNotificationType((String) updates.get("notificationType"));
            }

            if (updates.containsKey("read")) {
                notification.setRead((Boolean) updates.get("read"));
            }

            em.merge(notification);

            return Response.ok()
                    .entity(Map.of("success", true, "message", "Notification mise à jour avec succès"))
                    .build();

        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("success", false, "message", "Erreur lors de la mise à jour: " + e.getMessage()))
                    .build();
        }
    }

    /**
     * Récupère toutes les notifications (admin uniquement)
     */
    @GET
    @Path("/admin")
    @RolesAllowed("admin")
    public Response getAllNotifications(
            @QueryParam("limit") @DefaultValue("100") int limit,
            @QueryParam("offset") @DefaultValue("0") int offset,
            @QueryParam("type") String type,
            @QueryParam("organizer") String organizer) {

        // Construire la requête avec les filtres optionnels
        StringBuilder queryBuilder = new StringBuilder("SELECT n FROM SentNotification n WHERE n.deleted = false");

        if (type != null && !type.isEmpty()) {
            queryBuilder.append(" AND n.notificationType = :type");
        }

        if (organizer != null && !organizer.isEmpty()) {
            queryBuilder.append(" AND LOWER(n.booking.organizer) = :organizer");
        }

        queryBuilder.append(" ORDER BY n.sentAt DESC");

        // Créer la requête
        TypedQuery<SentNotification> query = em.createQuery(queryBuilder.toString(), SentNotification.class)
                .setFirstResult(offset)
                .setMaxResults(limit);

        // Ajouter paramètres optionnels
        if (type != null && !type.isEmpty()) {
            query.setParameter("type", type);
        }

        if (organizer != null && !organizer.isEmpty()) {
            query.setParameter("organizer", organizer.toLowerCase());
        }

        // Exécuter la requête
        List<SentNotification> notifications = query.getResultList();

        List<NotificationDTO> result = notifications.stream()
                .map(n -> new NotificationDTO(
                        n.getId(),
                        n.getBooking().getId(),
                        n.getBooking().getTitle(),
                        n.getBooking().getRoom().getName(),
                        n.getBooking().getOrganizer(),
                        n.getOrganizerEmail(),
                        n.getNotificationType(),
                        n.getSentAt()
                ))
                .collect(Collectors.toList());

        // Compter le total pour la pagination
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

        Long total = countQuery.getSingleResult();

        // Construire la réponse avec pagination
        Map<String, Object> response = new HashMap<>();
        response.put("notifications", result);
        response.put("total", total);
        response.put("limit", limit);
        response.put("offset", offset);

        return Response.ok(response).build();
    }

    /**
     * Crée une notification manuelle (admin uniquement)
     */
    @POST
    @Path("/admin")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("admin")
    @Transactional
    public Response createManualNotification(NotificationCreateDTO notificationData) {
        try {
            // Validation des données
            if (notificationData.getTitle() == null || notificationData.getTitle().isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("success", false, "message", "Le titre est obligatoire"))
                        .build();
            }

            if (notificationData.getMessage() == null || notificationData.getMessage().isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("success", false, "message", "Le message est obligatoire"))
                        .build();
            }

            // Si la notification est pour tous les utilisateurs
            if (notificationData.isForAllUsers()) {
                // Récupérer tous les organisateurs uniques
                List<String> organizers = em.createQuery(
                                "SELECT DISTINCT b.organizer FROM Booking b", String.class)
                        .getResultList();

                int count = 0;
                // Créer une notification pour chaque utilisateur
                for (String organizer : organizers) {
                    createNotificationForUser(organizer, notificationData);
                    count++;
                }

                return Response.status(Response.Status.CREATED)
                        .entity(Map.of(
                                "success", true,
                                "message", "Notification envoyée à " + count + " utilisateurs",
                                "count", count
                        ))
                        .build();
            }
            // Si la notification est pour des utilisateurs spécifiques
            else if (notificationData.getTargetUsers() != null && !notificationData.getTargetUsers().isEmpty()) {
                int count = 0;
                // Créer une notification pour chaque utilisateur ciblé
                for (String user : notificationData.getTargetUsers()) {
                    createNotificationForUser(user, notificationData);
                    count++;
                }

                return Response.status(Response.Status.CREATED)
                        .entity(Map.of(
                                "success", true,
                                "message", "Notification envoyée à " + count + " utilisateurs",
                                "count", count
                        ))
                        .build();
            }
            // Si aucun utilisateur n'est spécifié
            else {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("success", false, "message", "Aucun destinataire spécifié"))
                        .build();
            }

        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("success", false, "message", "Erreur lors de la création: " + e.getMessage()))
                    .build();
        }
    }

    /**
     * Méthode utilitaire pour créer une notification pour un utilisateur spécifique
     */
    private void createNotificationForUser(String username, NotificationCreateDTO data) {
        // Trouver une réservation de l'utilisateur pour l'associer (requis par le modèle de données)
        List<Long> bookingIds = em.createQuery(
                        "SELECT b.id FROM Booking b WHERE LOWER(b.organizer) = :username ORDER BY b.startTime DESC",
                        Long.class)
                .setParameter("username", username.toLowerCase())
                .setMaxResults(1)
                .getResultList();

        if (!bookingIds.isEmpty()) {
            // Créer la notification
            SentNotification notification = new SentNotification();
            notification.setBooking(em.getReference(fr.ccm2.entities.Booking.class, bookingIds.get(0)));
            notification.setNotificationType("manual");
            notification.setTitle(data.getTitle());
            notification.setMessage(data.getMessage());
            notification.setSentAt(LocalDateTime.now());
            notification.setOrganizerEmail(username + "@example.com"); // Approximation, à remplacer par l'email réel
            notification.setRead(false);
            notification.setDeleted(false);

            em.persist(notification);
        }
    }

    /**
     * Marque toutes les notifications comme lues (fonctionnalité administrative)
     */
    @PUT
    @Path("/admin/read-all")
    @RolesAllowed("admin")
    @Transactional
    public Response markAllNotificationsAsRead() {
        // Marquer toutes les notifications comme lues
        int count = em.createQuery(
                        "UPDATE SentNotification n SET n.read = true WHERE n.read = false")
                .executeUpdate();

        return Response.ok().entity(Map.of(
                "success", true,
                "message", count + " notification(s) marquée(s) comme lue(s)",
                "count", count
        )).build();
    }

    /**
     * Supprime une notification par ID (fonctionnalité administrative)
     */
    @DELETE
    @Path("/admin/{id}")
    @RolesAllowed("admin")
    @Transactional
    public Response deleteAdminNotification(@PathParam("id") Long id) {
        try {
            SentNotification notification = em.find(SentNotification.class, id);
            if (notification == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("success", false, "message", "Notification non trouvée"))
                        .build();
            }

            // Suppression physique (pour les admins)
            em.remove(notification);

            return Response.ok()
                    .entity(Map.of("success", true, "message", "Notification supprimée avec succès"))
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("success", false, "message", "Erreur lors de la suppression: " + e.getMessage()))
                    .build();
        }
    }
}