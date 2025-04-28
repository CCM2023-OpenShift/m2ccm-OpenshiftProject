package fr.ccm2.resources;

import fr.ccm2.dto.booking.BookingCreateDTO;
import fr.ccm2.dto.booking.BookingResponseDTO;
import fr.ccm2.dto.booking.BookingUpdateDTO;
import fr.ccm2.dto.equipment.EquipmentResponseDTO;
import fr.ccm2.dto.room.RoomResponseDTO;
import fr.ccm2.entities.Booking;
import fr.ccm2.entities.Room;
import fr.ccm2.services.BookingService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.hibernate.Hibernate;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

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
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response create(@FormParam("title") String title,
                           @FormParam("roomId") Long roomId,
                           @FormParam("startTime") String startTime,
                           @FormParam("endTime") String endTime,
                           @FormParam("attendees") int attendees,
                           @FormParam("organizer") String organizer) {
        BookingCreateDTO dto = new BookingCreateDTO();
        dto.title = title;
        dto.roomId = roomId;
        dto.startTime = startTime;
        dto.endTime = endTime;
        dto.attendees = attendees;
        dto.organizer = organizer;

        System.out.println("Create booking called with:");
        System.out.println("title: " + title);
        System.out.println("roomId: " + roomId);
        System.out.println("startTime: " + startTime);
        System.out.println("endTime: " + endTime);
        System.out.println("attendees: " + attendees);
        System.out.println("organizer: " + organizer);

        Booking booking = bookingService.createBooking(dto);

        if (booking == null) {
            return Response.status(Response.Status.BAD_REQUEST).entity("Booking creation failed").build();
        }

        booking = bookingService.getBookingByIdWithRelations(booking.getId());
        BookingResponseDTO responseDTO = this.toResponseDTO(booking);

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
        dto.startTime = startTime;
        dto.endTime = endTime;
        dto.attendees = attendees;
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

    private BookingResponseDTO toResponseDTO(Booking booking) {
        BookingResponseDTO responseDTO = new BookingResponseDTO();
        responseDTO.id = booking.getId();
        responseDTO.title = booking.getTitle();
        responseDTO.startTime = booking.getStartTime().toString();
        responseDTO.endTime = booking.getEndTime().toString();
        responseDTO.attendees = booking.getAttendees();
        responseDTO.organizer = booking.getOrganizer();

        Room room = booking.getRoom();
        if (room != null) {
            RoomResponseDTO roomDTO = new RoomResponseDTO();
            roomDTO.id = room.getId();
            roomDTO.name = room.getName();
            roomDTO.capacity = room.getCapacity();

            if (room.getEquipment() != null && Hibernate.isInitialized(room.getEquipment())) {
                List<EquipmentResponseDTO> equipmentDTOs = room.getEquipment().stream()
                        .map(equipment -> {
                            EquipmentResponseDTO equipmentDTO = new EquipmentResponseDTO();
                            equipmentDTO.id = equipment.getId();
                            equipmentDTO.name = equipment.getName();
                            equipmentDTO.description = equipment.getDescription();
                            return equipmentDTO;
                        })
                        .collect(Collectors.toList());
                roomDTO.equipment = equipmentDTOs;
            } else {
                roomDTO.equipment = new ArrayList<>();
            }

            responseDTO.room = roomDTO;
        }

        return responseDTO;
    }
}
