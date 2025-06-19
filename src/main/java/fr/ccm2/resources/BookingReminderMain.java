//package fr.ccm2.resources;
//
//import fr.ccm2.services.ReminderService;
//import io.quarkus.runtime.Quarkus;
//import io.quarkus.runtime.QuarkusApplication;
//import io.quarkus.runtime.annotations.QuarkusMain;
//import jakarta.inject.Inject;
//import org.jboss.logging.Logger;
//
//@QuarkusMain
//public class BookingReminderMain implements QuarkusApplication {
//    private static final Logger LOG = Logger.getLogger(BookingReminderMain.class);
//
//    @Inject
//    ReminderService reminderService;
//
//    public static void main(String[] args) {
//        Quarkus.run(BookingReminderMain.class, args);
//    }
//
//    @Override
//    public int run(String... args) throws Exception {
//        String reminderType = null;
//
//        for (int i = 0; i < args.length; i++) {
//            if ("--type".equals(args[i]) && i + 1 < args.length) {
//                reminderType = args[i + 1];
//                break;
//            }
//        }
//
//        if (reminderType == null) {
//            LOG.info("Argument --type manquant, démarre le serveur normalement.");
//            // Retourner Quarkus constant qui démarre le serveur HTTP
//            Quarkus.waitForExit();
//            return 0;
//        }
//
//        LOG.infof("Démarrage du job de rappel de type %s", reminderType);
//
//        if (!("24h".equals(reminderType) || "1h".equals(reminderType))) {
//            LOG.error("Type de rappel invalide. Utilisez '24h' ou '1h'");
//            return 1;
//        }
//
//        try {
//            int sent = reminderService.sendContextualReminders(reminderType);
//            LOG.infof("Job de rappel terminé avec succès: %d notification(s) envoyée(s)", sent);
//            return 0;
//        } catch (Exception e) {
//            LOG.errorf(e, "Erreur lors de l'exécution du job de rappel");
//            return 1;
//        }
//    }
//}
