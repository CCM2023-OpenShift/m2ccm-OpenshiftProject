package fr.ccm2.resources;

import fr.ccm2.dto.booking.BookingCreateDTO;
import fr.ccm2.dto.booking.BookingUpdateDTO;
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
    public Response list() {
        return Response.ok(bookingService.getAllBookings()).build();
    }

    @GET
    @Path("/{id}")
    public Response get(@PathParam("id") Long id) {
        Booking booking = bookingService.getBookingById(id);
        if (booking == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(booking).build();
    }

    @POST
    public Response create(@FormParam("title") String title,
                           @FormParam("roomId") Long roomId,
                           @FormParam("startTime") String startTime,
                           @FormParam("endTime") String endTime,
                           @FormParam("attendees") int attendees,
                           @FormParam("equipment") List<Long> equipment,
                           @FormParam("organizer") String organizer) {
        BookingCreateDTO dto = new BookingCreateDTO();
        dto.title = title;
        dto.roomId = roomId;
        dto.startTime = startTime;
        dto.endTime = endTime;
        dto.attendees = attendees;
        dto.equipment = equipment;
        dto.organizer = organizer;

        Booking booking = bookingService.createBooking(dto);
        if (booking == null) {
            return Response.status(Response.Status.BAD_REQUEST).entity("Equipment creation failed").build();
        }
        return Response.status(Response.Status.CREATED).entity(booking).build();
    }

    @PUT
    @Path("/{id}")
    public Response update(@PathParam("id") Long id,
                           @FormParam("title") String title,
                           @FormParam("roomId") Long roomId,
                           @FormParam("startTime") String startTime,
                           @FormParam("endTime") String endTime,
                           @FormParam("attendees") int attendees,
                           @FormParam("equipment") List<Long> equipment,
                           @FormParam("organizer") String organizer) {
        BookingUpdateDTO dto = new BookingUpdateDTO();
        dto.title = title;
        dto.roomId = roomId;
        dto.startTime = startTime;
        dto.endTime = endTime;
        dto.attendees = attendees;
        dto.equipment = equipment;
        dto.organizer = organizer;

        Booking booking = bookingService.updateBooking(id, dto);
        if (booking == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(booking).build();
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        bookingService.deleteBooking(id);
        return Response.noContent().build();
    }


}
