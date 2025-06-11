package fr.ccm2.resources;

import fr.ccm2.dto.equipment.EquipmentCreateDTO;
import fr.ccm2.dto.equipment.EquipmentResponseDTO;
import fr.ccm2.dto.equipment.EquipmentUpdateDTO;
import fr.ccm2.entities.Equipment;
import fr.ccm2.mapper.EquipmentMapper;
import fr.ccm2.services.EquipmentService;
import fr.ccm2.services.ImageService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@Path("/equipment")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class EquipmentResource {

    private static final Logger LOGGER = Logger.getLogger(EquipmentResource.class.getName());

    @Inject
    EquipmentService equipmentService;

    @Inject
    ImageService imageService;

    @GET
    @RolesAllowed({"user", "admin"})
    public Response list() {
        List<EquipmentResponseDTO> dtoList = equipmentService.getAllEquipments()
                .stream()
                .map(EquipmentMapper::toResponse)
                .collect(Collectors.toList());
        return Response.ok(dtoList).build();
    }

    @GET
    @Path("/{id}")
    @RolesAllowed({"user", "admin"})
    public Response get(@PathParam("id") Long id) {
        Equipment equipment = equipmentService.getEquipmentById(id);
        if (equipment == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        EquipmentResponseDTO responseDTO = EquipmentMapper.toResponse(equipment);
        return Response.ok(responseDTO).build();
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed({"admin"})
    public Response create(EquipmentCreateDTO dto) {
        Equipment equipment = equipmentService.createEquipment(dto);
        if (equipment == null) {
            return Response.status(Response.Status.BAD_REQUEST).entity("Equipment creation failed").build();
        }

        EquipmentResponseDTO responseDTO = EquipmentMapper.toResponse(equipment);
        return Response.status(Response.Status.CREATED).entity(responseDTO).build();
    }

    @PUT
    @Path("/{id}")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RolesAllowed({"admin"})
    public Response update(@PathParam("id") Long id,
                           @FormParam("name") String name,
                           @FormParam("description") String description,
                           @FormParam("quantity") int quantity,
                           @FormParam("mobile") boolean mobile) {

        EquipmentUpdateDTO dto = new EquipmentUpdateDTO();
        dto.name = name;
        dto.description = description;
        dto.quantity = quantity;
        dto.mobile = mobile;

        Equipment equipment = equipmentService.updateEquipment(id, dto);
        if (equipment == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        EquipmentResponseDTO responseDTO = EquipmentMapper.toResponse(equipment);
        return Response.ok(responseDTO).build();
    }

    @DELETE
    @Path("/{id}/image")
    @RolesAllowed({"admin"})
    public Response deleteImage(@PathParam("id") Long equipmentId) {
        try {
            LOGGER.info("🔍 Starting image deletion for equipment ID: " + equipmentId);

            Equipment equipment = equipmentService.getEquipmentById(equipmentId);
            if (equipment == null) {
                LOGGER.warning("Equipment not found with ID: " + equipmentId);
                return Response.status(Response.Status.NOT_FOUND)
                        .entity("{\"error\": \"Équipement non trouvé\"}").build();
            }

            String imageUrl = equipment.getImageUrl();
            LOGGER.info("Current image URL: " + imageUrl);

            if (imageUrl != null && !imageUrl.trim().isEmpty()) {
                try {
                    LOGGER.info("Deleting physical image file: " + imageUrl);
                    imageService.deleteImageFile(imageUrl);
                    LOGGER.info("Physical image file deleted successfully");
                } catch (Exception e) {
                    // Fixed: Replaced printStackTrace with proper logging
                    LOGGER.log(Level.WARNING, "Error deleting physical image file: " + e.getMessage(), e);
                    // Continue with database update even if physical deletion fails
                }
            } else {
                LOGGER.info("No image URL to delete");
            }

            LOGGER.info("Updating equipment to remove image URL reference");
            equipmentService.updateImageUrl(equipmentId, null);
            LOGGER.info("Database updated successfully");

            return Response.ok()
                    .entity("{\"message\": \"Image supprimée avec succès\"}")
                    .build();
        } catch (Exception e) {
            // Fixed: Replaced printStackTrace with proper logging
            LOGGER.log(Level.SEVERE, "Error in deleteImage: " + e.getMessage(), e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"Erreur lors de la suppression de l'image: " + e.getMessage() + "\"}").build();
        }
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed({"admin"})
    public Response delete(@PathParam("id") Long id) {
        try {
            Equipment equipment = equipmentService.getEquipmentById(id);
            if (equipment == null) {
                return Response.status(Response.Status.NOT_FOUND).build();
            }

            // Handle image deletion before deleting the equipment
            if (equipment.getImageUrl() != null && !equipment.getImageUrl().trim().isEmpty()) {
                try {
                    imageService.deleteImageFile(equipment.getImageUrl());
                    LOGGER.info("Image deleted for equipment: " + id);
                } catch (Exception e) {
                    LOGGER.log(Level.WARNING, "Failed to delete image: " + e.getMessage(), e);
                    // Continue with equipment deletion even if image deletion fails
                }
            }

            equipmentService.deleteEquipment(id);
            return Response.noContent().build();
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error deleting equipment: " + e.getMessage(), e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"" + e.getMessage() + "\"}").build();
        }
    }

    // ========== ENDPOINTS POUR LES IMAGES (APPROCHE MODERNE) ==========

    @POST
    @Path("/{id}/image")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed({"admin"})
    public Response uploadImage(@PathParam("id") Long equipmentId,
                                @FormParam("file") FileUpload file) {
        try {
            if (equipmentService.getEquipmentById(equipmentId) == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity("{\"error\": \"Équipement non trouvé\"}").build();
            }
            if (file == null || file.size() == 0) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity("{\"error\": \"Aucun fichier fourni\"}").build();
            }
            String imageUrl = imageService.saveImage(file);
            equipmentService.updateImageUrl(equipmentId, imageUrl);

            return Response.ok()
                    .entity("{\"message\": \"Image uploadée avec succès\", \"imageUrl\": \"" + imageUrl + "\"}")
                    .build();

        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"" + e.getMessage() + "\"}").build();
        } catch (IOException e) {
            LOGGER.log(Level.SEVERE, "Error saving image", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"Erreur lors de la sauvegarde de l'image\"}").build();
        }
    }

    // ========== ENDPOINTS POUR UPLOAD SIMPLE (SANS MULTIPART) ==========

    @POST
    @Path("/upload")
    @Consumes(MediaType.APPLICATION_OCTET_STREAM)
    public Response uploadFile(InputStream fileInputStream,
                               // Fixed: Marked the unused parameter with @SuppressWarnings
                               @HeaderParam("Content-Length") @SuppressWarnings("unused") long contentLength,
                               @QueryParam("filename") String filename) {
        try {
            java.nio.file.Path uploadPath = Paths.get("uploads", filename);
            Files.createDirectories(uploadPath.getParent());
            Files.copy(fileInputStream, uploadPath);

            return Response.ok("Fichier uploadé : " + filename).build();
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error uploading file", e);
            return Response.status(500).entity("Erreur : " + e.getMessage()).build();
        }
    }

    @POST
    @Path("/upload-base64")
    @Consumes(MediaType.TEXT_PLAIN)
    public Response uploadFileBase64(String base64Content,
                                     @QueryParam("filename") String filename) {
        try {
            byte[] decodedBytes = java.util.Base64.getDecoder().decode(base64Content);
            java.nio.file.Path uploadPath = Paths.get("uploads", filename);
            Files.createDirectories(uploadPath.getParent());
            Files.write(uploadPath, decodedBytes);

            return Response.ok("Fichier uploadé : " + filename).build();
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error uploading base64 file", e);
            return Response.status(500).entity("Erreur : " + e.getMessage()).build();
        }
    }
}