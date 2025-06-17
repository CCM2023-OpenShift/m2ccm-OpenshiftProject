package fr.ccm2.resources;

import fr.ccm2.dto.reminder.NotificationResponseDTO;
import fr.ccm2.dto.reminder.NotificationCreateDTO;
import fr.ccm2.dto.reminder.NotificationUpdateDTO;
import fr.ccm2.entities.SentNotification;
import fr.ccm2.services.NotificationService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import java.util.*;

@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Path("/notifications")
public class NotificationResource {

    @Inject
    EntityManager em;

    @Inject
    NotificationService notificationService;

    @Context
    SecurityContext securityContext;

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

        String currentUsername = securityContext.getUserPrincipal().getName().toLowerCase();

        List<NotificationResponseDTO> result = notificationService.getUserNotifications(
                currentUsername, read, type, limit, offset);

        Map<String, Object> response = new HashMap<>();
        response.put("notifications", result);
        response.put("total", notificationService.countUserNotifications(currentUsername, read, type));
        response.put("limit", limit);
        response.put("offset", offset);

        return Response.ok(response).build();
    }

    /**
     * Récupère le nombre de notifications non lues pour l'utilisateur connecté
     */
    @GET
    @Path("/unread-count")
    @RolesAllowed({"user", "admin"})
    public Response getUnreadCount() {
        String currentUsername = securityContext.getUserPrincipal().getName().toLowerCase();

        Long count = notificationService.getUnreadCount(currentUsername);

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

        SentNotification notification = notificationService.getNotificationById(id);
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

        notification = notificationService.updateReadStatus(notification, true);
        NotificationResponseDTO updatedNotification = notificationService.convertToResponseDTO(notification);

        return Response.ok()
                .entity(Map.of(
                        "success", true,
                        "message", "Notification marquée comme lue",
                        "notification", updatedNotification
                ))
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

        SentNotification notification = notificationService.getNotificationById(id);
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

        notification = notificationService.updateReadStatus(notification, false);
        NotificationResponseDTO updatedNotification = notificationService.convertToResponseDTO(notification);

        return Response.ok()
                .entity(Map.of(
                        "success", true,
                        "message", "Notification marquée comme non lue",
                        "notification", updatedNotification
                ))
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

        int count = notificationService.markAllAsRead(currentUsername);

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

        SentNotification notification = notificationService.getNotificationById(id);
        if (notification == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("success", false, "message", "Notification non trouvée"))
                    .build();
        }

        if (!securityContext.isUserInRole("admin") &&
                !currentUsername.equalsIgnoreCase(notification.getBooking().getOrganizer())) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of("success", false, "message", "Vous n'êtes pas autorisé à supprimer cette notification"))
                    .build();
        }

        notificationService.softDeleteNotification(notification);

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
    public Response updateNotification(@PathParam("id") Long id, NotificationUpdateDTO updates) {
        try {
            SentNotification notification = notificationService.getNotificationById(id);
            if (notification == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("success", false, "message", "Notification non trouvée"))
                        .build();
            }

            notification = notificationService.updateNotification(notification, updates);
            NotificationResponseDTO updatedNotification = notificationService.convertToResponseDTO(notification);

            return Response.ok()
                    .entity(Map.of(
                            "success", true,
                            "message", "Notification mise à jour avec succès",
                            "notification", updatedNotification
                    ))
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

        List<NotificationResponseDTO> result = notificationService.getAllNotifications(type, organizer, limit, offset);
        long total = notificationService.countAllNotifications(type, organizer);

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
            if (notificationData.title == null || notificationData.title.isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("success", false, "message", "Le titre est obligatoire"))
                        .build();
            }

            if (notificationData.message == null || notificationData.message.isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("success", false, "message", "Le message est obligatoire"))
                        .build();
            }

            // Si la notification est pour tous les utilisateurs
            if (notificationData.forAllUsers) {
                List<String> organizers = em.createQuery(
                                "SELECT DISTINCT b.organizer FROM Booking b", String.class)
                        .getResultList();

                int count = 0;
                List<NotificationResponseDTO> createdNotifications = new ArrayList<>();

                for (String organizer : organizers) {
                    SentNotification notification = notificationService.createNotificationForUser(organizer, notificationData);
                    if (notification != null) {
                        createdNotifications.add(notificationService.convertToResponseDTO(notification));
                        count++;
                    }
                }

                return Response.status(Response.Status.CREATED)
                        .entity(Map.of(
                                "success", true,
                                "message", "Notification envoyée à " + count + " utilisateurs",
                                "count", count,
                                "notifications", createdNotifications
                        ))
                        .build();
            }
            // Si la notification est pour des utilisateurs spécifiques
            else if (notificationData.targetUsers != null && !notificationData.targetUsers.isEmpty()) {
                int count = 0;
                List<NotificationResponseDTO> createdNotifications = new ArrayList<>();

                for (String user : notificationData.targetUsers) {
                    SentNotification notification = notificationService.createNotificationForUser(user, notificationData);
                    if (notification != null) {
                        createdNotifications.add(notificationService.convertToResponseDTO(notification));
                        count++;
                    }
                }

                return Response.status(Response.Status.CREATED)
                        .entity(Map.of(
                                "success", true,
                                "message", "Notification envoyée à " + count + " utilisateurs",
                                "count", count,
                                "notifications", createdNotifications
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
     * Marque toutes les notifications comme lues (fonctionnalité administrative)
     */
    @PUT
    @Path("/admin/read-all")
    @RolesAllowed("admin")
    @Transactional
    public Response markAllNotificationsAsRead() {
        int count = notificationService.markAllNotificationsAsRead();

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
            SentNotification notification = notificationService.getNotificationById(id);
            if (notification == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("success", false, "message", "Notification non trouvée"))
                        .build();
            }

            notificationService.hardDeleteNotification(notification);

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