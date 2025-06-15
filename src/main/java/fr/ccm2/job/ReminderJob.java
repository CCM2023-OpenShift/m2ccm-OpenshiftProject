package fr.ccm2.job;

import fr.ccm2.services.ReminderService;
import io.quarkus.runtime.Quarkus;
import io.quarkus.runtime.QuarkusApplication;
import io.quarkus.runtime.annotations.QuarkusMain;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

@QuarkusMain
public class ReminderJob implements QuarkusApplication {

    private static final Logger LOG = Logger.getLogger(ReminderJob.class);

    @Inject
    ReminderService reminderService;

    @Override
    public int run(String... args) {
        try {
            // Extraire le type de rappel depuis les arguments
            String reminderType = extractReminderType(args);

            LOG.info("Démarrage du job de rappel de type: " + reminderType);
            int sent = reminderService.sendContextualReminders(reminderType);
            LOG.info("Job terminé avec succès. " + sent + " notifications envoyées.");
            return 0; // Code de retour 0 = succès
        } catch (Exception e) {
            LOG.error("Erreur dans l'exécution du job", e);
            return 1; // Code de retour non-zéro = échec
        }
    }

    private String extractReminderType(String[] args) {
        // Valeur par défaut
        String reminderType = "24h";

        // Chercher l'argument --type
        for (int i = 0; i < args.length; i++) {
            if ("--type".equals(args[i]) && i + 1 < args.length) {
                reminderType = args[i+1];
                break;
            }
        }

        return reminderType;
    }

    public static void main(String[] args) {
        Quarkus.run(ReminderJob.class, args);
    }
}