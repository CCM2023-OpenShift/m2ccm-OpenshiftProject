package fr.ccm2.job;

import fr.ccm2.services.ReminderService;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

@ApplicationScoped
public class ReminderScheduler {

    private static final Logger LOG = Logger.getLogger(ReminderScheduler.class);

    @Inject
    ReminderService reminderService;

    // Exécution toutes les heures
    @Scheduled(cron = "0 0 * * * ?", identity = "reminder-24h")
    void sendReminder24h() {
        LOG.info("Exécution planifiée du job de rappel 24h");
        reminderService.sendContextualReminders("24h");
    }

    // Exécution toutes les 15 minutes
    @Scheduled(cron = "0 */15 * * * ?", identity = "reminder-1h")
    void sendReminder1h() {
        LOG.info("Exécution planifiée du job de rappel 1h");
        reminderService.sendContextualReminders("1h");
    }
}