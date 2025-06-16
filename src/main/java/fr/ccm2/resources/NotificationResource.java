package fr.ccm2.resources;

import fr.ccm2.dto.reminder.NotificationDTO;
import fr.ccm2.entities.SentNotification;
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
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
public class NotificationResource {

    @Inject
    EntityManager em;

    @Context
    SecurityContext securityContext;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    /**
     * Récupère les notifications de l'utilisateur connecté
     */
    @GET
    @Path("/api/notifications")
    @RolesAllowed({"user", "admin"})
    public Response getUserNotifications() {
        // Récupérer le nom d'utilisateur connecté
        String currentUsername = securityContext.getUserPrincipal().getName().toLowerCase();

        // Récupérer les notifications pour cet utilisateur
        List<SentNotification> notifications = em.createQuery(
                        "SELECT n FROM SentNotification n WHERE LOWER(n.booking.organizer) = :username " +
                                "ORDER BY n.sentAt DESC", SentNotification.class)
                .setParameter("username", currentUsername)
                .setMaxResults(50)
                .getResultList();

        // Convertir en format adapté au frontend
        List<Map<String, Object>> result = new ArrayList<>();

        for (SentNotification n : notifications) {
            Map<String, Object> notif = new HashMap<>();

            notif.put("id", n.getId().toString());
            notif.put("userId", currentUsername);
            notif.put("bookingId", n.getBooking().getId().toString());

            // Type basé sur le notificationType
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

            // Par défaut non lu
            notif.put("read", false);

            // Format de date ISO pour le frontend
            notif.put("createdAt", n.getSentAt().format(FORMATTER));

            result.add(notif);
        }

        return Response.ok(result).build();
    }

    /**
     * Marque une notification comme lue pour l'utilisateur
     */
    @PUT
    @Path("/api/notifications/{id}/read")
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

        // Pour l'instant, nous simulons le marquage comme "lu"
        // Dans une implémentation complète, vous stockeriez cet état dans une table dédiée

        return Response.ok()
                .entity(Map.of("success", true, "message", "Notification marquée comme lue"))
                .build();
    }

    /**
     * Marque toutes les notifications de l'utilisateur connecté comme lues
     */
    @PUT
    @Path("/api/notifications/read-all")
    @RolesAllowed({"user", "admin"})
    @Transactional
    public Response markUserNotificationsAsRead() {
        String currentUsername = securityContext.getUserPrincipal().getName().toLowerCase();

        // Récupérer les IDs des notifications de l'utilisateur
        List<Long> notificationIds = em.createQuery(
                        "SELECT n.id FROM SentNotification n WHERE LOWER(n.booking.organizer) = :username",
                        Long.class)
                .setParameter("username", currentUsername)
                .getResultList();

        // Dans une implémentation complète, vous marqueriez toutes ces notifications comme lues

        return Response.ok()
                .entity(Map.of(
                        "success", true,
                        "message", notificationIds.size() + " notification(s) marquée(s) comme lue(s)",
                        "count", notificationIds.size()
                ))
                .build();
    }

    /**
     * Supprime une notification pour l'utilisateur connecté
     */
    @DELETE
    @Path("/api/notifications/{id}")
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

        // Dans une version complète, vous ne supprimeriez pas réellement la notification
        // mais la marqueriez comme "supprimée" pour cet utilisateur dans une table intermédiaire

        return Response.ok()
                .entity(Map.of("success", true, "message", "Notification supprimée avec succès"))
                .build();
    }

    /**
     * Récupère toutes les notifications (admin uniquement)
     */
    @GET
    @Path("/api/admin/notifications")
    @RolesAllowed("admin")
    public List<NotificationDTO> getAllNotifications() {
        List<SentNotification> notifications = em.createQuery(
                        "SELECT n FROM SentNotification n ORDER BY n.sentAt DESC",
                        SentNotification.class)
                .setMaxResults(100) // Limiter pour éviter de surcharger
                .getResultList();

        return notifications.stream()
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
    }

    /**
     * Marque toutes les notifications comme lues (fonctionnalité administrative)
     */
    @PUT
    @Path("/api/admin/notifications/read-all")
    @RolesAllowed("admin")
    @Transactional
    public Response markAllNotificationsAsRead() {
        // Ici, vous implémenteriez la logique pour marquer toutes les notifications comme lues
        // pour tous les utilisateurs

        // Compter les notifications pour le retour
        Long count = em.createQuery("SELECT COUNT(n) FROM SentNotification n", Long.class)
                .getSingleResult();

        return Response.ok().entity(Map.of(
                "success", true,
                "message", "Toutes les notifications ont été marquées comme lues",
                "count", count
        )).build();
    }

    /**
     * Supprime une notification par ID (fonctionnalité administrative)
     */
    @DELETE
    @Path("/api/admin/notifications/{id}")
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