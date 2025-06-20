package fr.ccm2.services;

import fr.ccm2.dto.user.UserDTO;
import fr.ccm2.entities.Booking;
import fr.ccm2.entities.Room;
import fr.ccm2.entities.SentNotification;
import io.quarkus.mailer.Mail;
import io.quarkus.mailer.Mailer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@ApplicationScoped
public class ReminderService {

    private static final Logger LOG = Logger.getLogger(ReminderService.class);
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    @Inject
    EntityManager em;

    @Inject
    Mailer mailer;

    @Inject
    KeycloakAdminService keycloakAdminService;

    @Inject
    UserService userService;

    @ConfigProperty(name = "app.mail.test.enabled", defaultValue = "false")
    boolean testModeEnabled;

    @ConfigProperty(name = "app.mail.test.recipient")
    String testEmailRecipient;

    // Instructions d'accès par bâtiment
    private final Map<String, String> buildingAccessInstructions = Map.of(
            "A", "Accès par l'entrée principale, badge nécessaire après 18h",
            "B", "Accès côté cafétéria, code d'accès: 3456",
            "C", "Accès par le parking enseignants, interphone disponible"
    );

    /**
     * Envoie des rappels pour les réservations à venir selon le type spécifié
     * @param reminderType Type de rappel: "24h" ou "1h"
     * @return Nombre de notifications envoyées
     */
    @Transactional
    public int sendContextualReminders(String reminderType) {
        LOG.info("Envoi des rappels de type: " + reminderType);

        // Déterminer l'intervalle de temps selon le type de rappel
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start, end;

        if ("24h".equals(reminderType)) {
            // Réservations qui commencent dans 23-25 heures
            start = now.plusHours(23);
            end = now.plusHours(25);
        } else if ("1h".equals(reminderType)) {
            // Réservations qui commencent dans 45-75 minutes
            start = now.plusMinutes(45);
            end = now.plusMinutes(75);
        } else {
            LOG.error("Type de rappel non reconnu: " + reminderType);
            return 0;
        }

        // Trouver les réservations à venir dans la fenêtre temporelle
        List<Booking> bookings = em.createQuery(
                        "FROM Booking b WHERE b.startTime BETWEEN :start AND :end",
                        Booking.class)
                .setParameter("start", start)
                .setParameter("end", end)
                .getResultList();

        LOG.info("Trouvé " + bookings.size() + " réservations pour rappel de type " + reminderType);

        // Filtrer les réservations pour lesquelles une notification a déjà été envoyée
        List<Booking> bookingsToNotify = filterAlreadyNotified(bookings, reminderType);
        LOG.info("Après filtrage des notifications déjà envoyées: " + bookingsToNotify.size() + " réservations à notifier");

        if (testModeEnabled) {
            LOG.info("Mode test activé: tous les emails seront envoyés à " + testEmailRecipient);
        }

        int sent = 0;
        for (Booking booking : bookingsToNotify) {
            try {
                String organizerUsername = booking.getOrganizer();
                if (organizerUsername == null || organizerUsername.isEmpty()) {
                    LOG.warn("Organisateur manquant pour la réservation " + booking.getId());
                    continue;
                }

                // Trouver l'utilisateur via la recherche keycloak
                List<UserDTO> users = keycloakAdminService.searchUsers(organizerUsername);
                UserDTO organizer = null;
                for (UserDTO user : users) {
                    if (user.username.equals(organizerUsername)) {
                        organizer = user;
                        break;
                    }
                }

                if (organizer == null || organizer.email == null || organizer.email.isEmpty()) {
                    LOG.warn("Email manquant pour l'organisateur: " + organizerUsername);
                    continue;
                }

                // En mode test, on garde l'email original pour les logs, mais on envoie à l'email de test
                String originalEmail = organizer.email;
                String emailToUse = testModeEnabled ? testEmailRecipient : originalEmail;
                String fullName = organizer.displayName != null ? organizer.displayName : organizerUsername;

                Room room = booking.getRoom();

                // Préparer l'email selon le type de rappel
                String subject, content;
                if ("24h".equals(reminderType)) {
                    subject = "Rappel: Votre réservation de salle demain";
                    content = buildAdvanceReminderEmail(booking, room, fullName, organizerUsername, originalEmail);
                } else {
                    subject = "⚠️ Votre réservation commence bientôt";
                    content = buildImminentReminderEmail(booking, room, fullName, organizerUsername, originalEmail);
                }

                // Envoyer l'email à l'adresse déterminée
                mailer.send(Mail.withText(emailToUse, subject, content));

                // Enregistrer la notification comme envoyée (avec l'email original)
                SentNotification notification = new SentNotification(booking, reminderType, originalEmail);
                em.persist(notification);

                LOG.info("Email " + reminderType + " envoyé à " +
                        (testModeEnabled ? testEmailRecipient + " (destinataire original: " + originalEmail + ")" : originalEmail) +
                        " pour la réservation " + booking.getId());
                sent++;

            } catch (Exception e) {
                LOG.error("Erreur lors de l'envoi du rappel pour la réservation " + booking.getId(), e);
            }
        }

        LOG.info("Total des notifications envoyées: " + sent);
        return sent;
    }

    // Autres méthodes restent inchangées...

    /**
     * Génère le contenu de l'email pour un rappel 24h avant
     */
    private String buildAdvanceReminderEmail(Booking booking, Room room, String organizerName, String username, String email) {
        StringBuilder body = new StringBuilder();

        body.append("Bonjour ").append(organizerName).append(",\n\n");
        body.append("Nous vous rappelons votre réservation pour demain:\n\n");
        body.append("Titre: ").append(booking.getTitle()).append("\n");
        body.append("Salle: ").append(room.getName()).append("\n");
        body.append("Bâtiment: ").append(room.getBuilding()).append("\n");
        body.append("Étage: ").append(room.getFloor()).append("\n");
        body.append("Date: ").append(booking.getStartTime().format(DATE_TIME_FORMATTER)).append("\n");
        body.append("Durée: ").append(ChronoUnit.MINUTES.between(booking.getStartTime(), booking.getEndTime())).append(" minutes\n");

        if (booking.getAttendees() != null) {
            body.append("Participants: ").append(booking.getAttendees()).append("\n\n");
        }

        // Utiliser getRoomEquipments() au lieu de getEquipments()
        if (room.getRoomEquipments() != null && !room.getRoomEquipments().isEmpty()) {
            body.append("Équipements disponibles dans la salle:\n");
            room.getRoomEquipments().forEach(roomEquipment ->
                    body.append("- ").append(roomEquipment.getEquipment().getName()).append("\n")
            );
            body.append("\n");
        }

        // Instructions spécifiques selon le type de salle
        body.append("Informations importantes:\n");
        String roomType = room.getType();
        if (roomType != null) {
            if (roomType.contains("LAB")) {
                body.append("- Cette salle est un laboratoire, pensez à respecter les consignes de sécurité\n");
                body.append("- L'utilisation des équipements nécessite une formation préalable\n");
            } else if (roomType.contains("AMPHI")) {
                body.append("- Pour utiliser le système audio, contactez l'accueil du bâtiment\n");
                body.append("- Les lumières s'éteignent automatiquement après 10 minutes d'inactivité\n");
            }
        }

        body.append("\nPour annuler ou modifier votre réservation, connectez-vous à l'application.\n\n");
        body.append("Cordialement,\nLe service de réservation");

        // Information de déboggage en mode test
        if (testModeEnabled) {
            body.append("\n\n--------------------------------------\n");
            body.append("INFORMATION MODE TEST: Ce message était destiné à:\n");
            body.append("Utilisateur: ").append(username).append("\n");
            body.append("Email: ").append(email).append("\n");
            body.append("--------------------------------------");
        }

        return body.toString();
    }

    /**
     * Génère le contenu de l'email pour un rappel 1h avant
     */
    private String buildImminentReminderEmail(Booking booking, Room room, String organizerName, String username, String email) {
        String buildingCode = room.getBuilding();
        StringBuilder body = new StringBuilder();

        body.append("Bonjour ").append(organizerName).append(",\n\n");
        body.append("Votre réservation commence bientôt!\n\n");
        body.append("Titre: ").append(booking.getTitle()).append("\n");
        body.append("Salle: ").append(room.getName()).append("\n");
        body.append("Heure de début: ").append(booking.getStartTime().format(TIME_FORMATTER)).append("\n\n");

        // Instructions d'accès
        body.append("Comment y accéder:\n");
        body.append("Bâtiment: ").append(buildingCode).append("\n");
        body.append("Étage: ").append(room.getFloor()).append("\n");

        // Instructions spécifiques au bâtiment
        if (buildingAccessInstructions.containsKey(buildingCode)) {
            body.append("Instructions d'accès: ").append(buildingAccessInstructions.get(buildingCode)).append("\n");
        }

        // Lien vers le plan (adapté à votre application)
        body.append("\nPlan d'accès: https://vite-oc-gregorydhmccm-dev.apps.rm1.0a51.p1.openshiftapps.com/rooms/").append(room.getId()).append("\n\n");

        // Coordonnées en cas de problème
        body.append("En cas de problème d'accès, contactez:\n");
        body.append("- Service de réservation: 01 23 45 67 89\n\n");

        body.append("Bonne séance!\n");
        body.append("Le service de réservation");

        // Information de déboggage en mode test
        if (testModeEnabled) {
            body.append("\n\n--------------------------------------\n");
            body.append("INFORMATION MODE TEST: Ce message était destiné à:\n");
            body.append("Utilisateur: ").append(username).append("\n");
            body.append("Email: ").append(email).append("\n");
            body.append("--------------------------------------");
        }

        return body.toString();
    }

    private List<Booking> filterAlreadyNotified(List<Booking> bookings, String reminderType) {
        return bookings.stream()
                .filter(booking -> {
                    // Vérifier si une notification a déjà été envoyée pour cette réservation et ce type
                    Long notificationCount = em.createQuery(
                                    "SELECT COUNT(n) FROM SentNotification n " +
                                            "WHERE n.booking.id = :bookingId AND n.notificationType = :type",
                                    Long.class)
                            .setParameter("bookingId", booking.getId())
                            .setParameter("type", reminderType)
                            .getSingleResult();

                    // Garder uniquement les réservations sans notification
                    return notificationCount == 0;
                })
                .collect(Collectors.toList());  // Compatible avec Java 8+
    }
}
