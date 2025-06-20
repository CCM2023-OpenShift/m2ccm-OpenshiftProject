package fr.ccm2.resources;

import fr.ccm2.dto.booking.BookingCreateDTO;
import fr.ccm2.dto.booking.BookingResponseDTO;
import fr.ccm2.dto.booking.BookingUpdateDTO;
import fr.ccm2.entities.Booking;
import fr.ccm2.mapper.BookingMapper;
import fr.ccm2.services.BookingService;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Path("/bookings")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class BookingResource {

    @Inject
    BookingService bookingService;

    @Inject
    SecurityIdentity securityIdentity;

    @GET
    @RolesAllowed({"user", "admin"})
    public Response list() {
        String currentUser = securityIdentity.getPrincipal().getName();
        boolean isAdmin = securityIdentity.hasRole("admin");

        // Tous les utilisateurs voient toutes les réservations
        List<Booking> allBookings = bookingService.getBookingsWithRelations();

        // Transformer les réservations en DTOs en masquant les informations sensibles si nécessaire
        List<BookingResponseDTO> bookingDTOs = allBookings.stream()
                .map(booking -> {
                    // Pour les administrateurs ou les réservations de l'utilisateur actuel,
                    // afficher toutes les informations
                    boolean isOwner = booking.getOrganizer().equals(currentUser);
                    boolean showFullDetails = isAdmin || isOwner;

                    // Obtenir le DTO avec toutes les informations
                    BookingResponseDTO dto = BookingMapper.toResponse(booking, true, true);

                    // Si ce n'est pas l'admin ni le propriétaire, anonymiser les informations sensibles
                    if (!showFullDetails) {
                        // Remplacer le titre par "Réservé"
                        dto.title = "Réservé";
                        // Masquer l'organisateur
                        dto.organizer = "—";
                        // Masquer le nombre de participants
                        dto.attendees = 0;
                        // On garde startTime, endTime et roomId qui sont nécessaires pour le planning
                    }
                    return dto;
                })
                .collect(Collectors.toList());

        return Response.ok(bookingDTOs).build();
    }

    @GET
    @Path("/{id}")
    @RolesAllowed({"user", "admin"})
    public Response get(@PathParam("id") Long id) {
        Booking booking = bookingService.getBookingByIdWithRelations(id);
        if (booking == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        // Déterminer si l'utilisateur actuel peut voir les détails complets
        String currentUser = securityIdentity.getPrincipal().getName();
        boolean isAdmin = securityIdentity.hasRole("admin");
        boolean isOwner = booking.getOrganizer().equals(currentUser);
        boolean showFullDetails = isAdmin || isOwner;

        // Obtenir le DTO avec toutes les informations
        BookingResponseDTO dto = BookingMapper.toResponse(booking, true, true);

        // Si ce n'est pas l'admin ni le propriétaire, anonymiser les informations sensibles
        if (!showFullDetails) {
            dto.title = "Réservé";
            dto.organizer = "—";
            dto.attendees = 0;
            // On garde uniquement les informations de base : salle, dates de début et fin
        }

        return Response.ok(dto).build();
    }

    // Le reste du code reste inchangé...

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed({"user", "admin"})
    public Response create(BookingCreateDTO dto) {
        try {
            // Associer automatiquement l'utilisateur connecté comme organisateur
            dto.organizer = securityIdentity.getPrincipal().getName();

            Booking booking = bookingService.createBooking(dto);
            booking = bookingService.getBookingByIdWithRelations(booking.getId());

            BookingResponseDTO responseDTO = BookingMapper.toResponse(booking, true, true);
            return Response.status(Response.Status.CREATED).entity(responseDTO).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Erreur de validation: " + e.getMessage()).build();
        } catch (IllegalStateException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return Response.status(Response.Status.CONFLICT)
                    .entity(error)
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }

    @PUT
    @Path("/{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed({"user", "admin"})
    public Response update(@PathParam("id") Long id, BookingUpdateDTO dto) {
        try {
            System.out.println("🔧 PUT /bookings/" + id + " called with DTO: " + dto.title);

            Booking existingBooking = bookingService.getBookingById(id);
            if (existingBooking == null) {
                return Response.status(Response.Status.NOT_FOUND).build();
            }

            String currentUser = securityIdentity.getPrincipal().getName();
            if (!securityIdentity.hasRole("admin") && !existingBooking.getOrganizer().equals(currentUser)) {
                return Response.status(Response.Status.FORBIDDEN)
                        .entity("Vous n'êtes pas autorisé à modifier cette réservation").build();
            }

            if (!securityIdentity.hasRole("admin")) {
                dto.organizer = currentUser;
            }

            Booking booking = bookingService.updateBooking(id, dto);
            BookingResponseDTO responseDTO = BookingMapper.toResponse(booking, true, true);

            System.out.println("Booking updated successfully: " + responseDTO.title);
            return Response.ok(responseDTO).build();
        } catch (Exception e) {
            System.err.println("Error updating booking " + id + ": " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"Erreur serveur : " + e.getMessage() + "\"}").build();
        }
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed({"user", "admin"})
    public Response delete(@PathParam("id") Long id) {
        Booking existingBooking = bookingService.getBookingById(id);
        if (existingBooking == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        // Vérifier les permissions
        String currentUser = securityIdentity.getPrincipal().getName();
        if (!securityIdentity.hasRole("admin") && !existingBooking.getOrganizer().equals(currentUser)) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity("Vous n'êtes pas autorisé à supprimer cette réservation").build();
        }

        bookingService.deleteBooking(id);
        return Response.noContent().build();
    }

    @GET
    @Path("/available-equipments")
    @RolesAllowed({"user", "admin"})
    public Response getAvailableEquipments(@QueryParam("start") String start,
                                           @QueryParam("end") String end) {
        if (start == null || end == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Les paramètres 'start' et 'end' sont requis.")
                    .build();
        }

        try {
            LocalDateTime startTime = LocalDateTime.parse(start);
            LocalDateTime endTime = LocalDateTime.parse(end);

            var availabilityList = bookingService.getAvailableEquipmentsForPeriod(startTime, endTime);
            return Response.ok(availabilityList).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Format de date invalide").build();
        }
    }
}