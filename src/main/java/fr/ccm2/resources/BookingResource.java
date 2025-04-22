package fr.ccm2.resources;

import fr.ccm2.dto.BookingDTO;
import fr.ccm2.entities.Booking;
import fr.ccm2.services.BookingService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/bookings")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class BookingResource {

    @Inject
    BookingService bookingService;

    @GET
    public List<Booking> list() {
        return bookingService.getAllBookings();
    }

    @POST
    public Response create(BookingDTO dto) {
        bookingService.createBooking(dto);
        return Response.status(Response.Status.CREATED).build();
    }
}
