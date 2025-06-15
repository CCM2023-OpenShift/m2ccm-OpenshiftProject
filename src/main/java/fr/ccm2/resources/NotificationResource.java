package fr.ccm2.resources;

import fr.ccm2.dto.reminder.NotificationDTO;
import fr.ccm2.entities.SentNotification;
import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.List;
import java.util.stream.Collectors;

@Path("/api/admin/notifications")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
public class NotificationResource {

    @Inject
    EntityManager em;

    @GET
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
}