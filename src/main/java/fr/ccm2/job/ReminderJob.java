package fr.ccm2.job;

import fr.ccm2.services.ReminderService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Response;

@Path("/admin/reminders")
public class ReminderJob {

    @Inject
    ReminderService reminderService;

    @GET
    @Path("/send")
    public Response sendReminders(@QueryParam("type") String type) {
        if (type == null) {
            type = "24h"; // Valeur par défaut
        }

        int sent = reminderService.sendContextualReminders(type);

        return Response.ok("Rappels envoyés: " + sent).build();
    }
}