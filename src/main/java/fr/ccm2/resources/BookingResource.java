package fr.ccm2.resources;

import fr.ccm2.dto.booking.BookingCreateDTO;
import fr.ccm2.dto.booking.BookingResponseDTO;
import fr.ccm2.dto.booking.BookingUpdateDTO;
import fr.ccm2.entities.Booking;
import fr.ccm2.mapper.BookingMapper;
import fr.ccm2.services.BookingService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.time.LocalDateTime;

@Path("/bookings")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class BookingResource {

    @Inject
    BookingService bookingService;

    @GET
    public Response list() {
        return Response.ok(bookingService.getBookingsWithRelations()).build();
    }

    @GET
    @Path("/{id}")
    public Response get(@PathParam("id") Long id) {
        Booking booking = bookingService.getBookingByIdWithRelations(id);
        if (booking == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        BookingResponseDTO responseDTO = BookingMapper.toResponse(booking, true, true);
        return Response.ok(responseDTO).build();
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    public Response create(BookingCreateDTO dto) {
        Booking booking = bookingService.createBooking(dto);
        booking = bookingService.getBookingByIdWithRelations(booking.getId());

        BookingResponseDTO responseDTO = BookingMapper.toResponse(booking, true, true);
        return Response.status(Response.Status.CREATED).entity(responseDTO).build();
    }

    @PUT
    @Path("/{id}")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response update(@PathParam("id") Long id,
                           @FormParam("title") String title,
                           @FormParam("roomId") Long roomId,
                           @FormParam("startTime") String startTime,
                           @FormParam("endTime") String endTime,
                           @FormParam("attendees") int attendees,
                           @FormParam("organizer") String organizer) {

        BookingUpdateDTO dto = new BookingUpdateDTO();
        dto.title = title;
        dto.roomId = roomId;
        dto.startTime = LocalDateTime.parse(startTime);
        dto.endTime = LocalDateTime.parse(endTime);
        dto.attendees = attendees;
        dto.organizer = organizer;

        Booking booking = bookingService.updateBooking(id, dto);
        if (booking == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        BookingResponseDTO responseDTO = BookingMapper.toResponse(booking, true, true);
        return Response.ok(responseDTO).build();
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        bookingService.deleteBooking(id);
        return Response.noContent().build();
    }
}
