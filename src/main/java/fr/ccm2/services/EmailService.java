package fr.ccm2.services;

import io.quarkus.mailer.Mail;
import io.quarkus.mailer.Mailer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class EmailService {

    @Inject
    Mailer mailer;

    public void sendNotificationEmail(String recipient, String subject, String body) {
        mailer.send(
                Mail.withText(recipient, subject, body)
        );
    }
}