package fr.ccm2.resources;

import fr.ccm2.services.ReminderService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Response;
import java.time.LocalDateTime;
import java.util.Map;

@Path("/api/admin/test-reminder")
@RolesAllowed("admin")
public class TestReminderResource {

    @Inject
    ReminderService reminderService;

    @GET
    public Response sendTestReminders(@QueryParam("type") String reminderType) {
        if (reminderType == null) {
            reminderType = "24h";
        }

        if (!reminderType.equals("24h") && !reminderType.equals("1h")) {
            return Response.status(400)
                    .entity("Le type de rappel doit être '24h' ou '1h'")
                    .build();
        }

        int sent = reminderService.sendContextualReminders(reminderType);

        return Response.ok(Map.of(
                "success", true,
                "sent", sent,
                "type", reminderType,
                "timestamp", LocalDateTime.now().toString()
        )).build();
    }
}