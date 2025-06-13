package fr.ccm2.services;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.client.Client;
import jakarta.ws.rs.client.ClientBuilder;
import jakarta.ws.rs.client.Entity;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class ImageService {

    @ConfigProperty(name = "%prod.app.image.storage.type", defaultValue = "local")
    String storageType;

    @ConfigProperty(name = "%prod.app.image.upload.directory", defaultValue = "/tmp/uploads/images")
    String localUploadDirectory;

    @ConfigProperty(name = "%prod.app.supabase.url")
    Optional<String> supabaseUrl;

    @ConfigProperty(name = "%prod.app.supabase.key")
    Optional<String> supabaseKey;

    @ConfigProperty(name = "%prod.app.supabase.equipment.bucket", defaultValue = "equipment-images")
    String equipmentBucket;

    @ConfigProperty(name = "%prod.app.supabase.rooms.bucket", defaultValue = "rooms_images")
    String roomsBucket;

    private static final String EQUIPMENT_FOLDER = "equipments";
    private static final String ROOM_FOLDER = "rooms";

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "webp");
    private static final List<String> ALLOWED_MIME_TYPES = Arrays.asList("image/jpeg", "image/png", "image/webp");

    private final Client client = ClientBuilder.newClient();

    public UploadConfig getUploadConfig() {
        return new UploadConfig(MAX_FILE_SIZE, ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES);
    }

    // ========== MÉTHODES POUR ÉQUIPEMENTS ==========
    public String saveImage(FileUpload fileUpload) throws IOException {
        return uploadImageToFolder(fileUpload, EQUIPMENT_FOLDER, equipmentBucket);
    }

    public byte[] getImage(String fileName) throws IOException {
        return getImageFromFolder(fileName, EQUIPMENT_FOLDER);
    }

    public void deleteImageFile(String imageUrl) throws IOException {
        deleteImageFromFolder(imageUrl, EQUIPMENT_FOLDER, equipmentBucket);
    }

    // ========== MÉTHODES POUR SALLES ==========
    public String saveRoomImage(FileUpload fileUpload) throws IOException {
        return uploadImageToFolder(fileUpload, ROOM_FOLDER, roomsBucket);
    }

    public byte[] getRoomImage(String fileName) throws IOException {
        return getImageFromFolder(fileName, ROOM_FOLDER);
    }

    public void deleteRoomImageFile(String imageUrl) throws IOException {
        deleteImageFromFolder(imageUrl, ROOM_FOLDER, roomsBucket);
    }

    public String getRoomContentType(String fileName) throws IOException {
        return getContentType(fileName);
    }

    // ========== MÉTHODES COMMUNES ==========
    private String uploadImageToFolder(FileUpload fileUpload, String folder, String bucket) throws IOException {
        validateFile(fileUpload);

        String originalFileName = fileUpload.fileName();
        String extension = getFileExtension(originalFileName);
        String fileName = UUID.randomUUID() + extension;

        if ("local".equals(storageType)) {
            uploadImageLocal(fileUpload, fileName, folder);
            return "/images/" + folder + "/" + fileName;
        } else if ("supabase".equals(storageType)) {
            return uploadImageSupabase(fileUpload, fileName, folder, bucket);
        } else {
            throw new IllegalStateException("Type de stockage inconnu: " + storageType);
        }
    }

    private byte[] getImageFromFolder(String fileName, String folder) throws IOException {
        if ("local".equals(storageType)) {
            return getImageLocal(fileName, folder);
        } else if ("supabase".equals(storageType)) {
            return null;
        }
        throw new IllegalStateException("Type de stockage inconnu: " + storageType);
    }

    private void deleteImageFromFolder(String imageUrl, String folder, String bucket) throws IOException {
        System.out.println("Suppression demandée pour: " + imageUrl + " (folder: " + folder + ", bucket: " + bucket + ")");

        if ("local".equals(storageType)) {
            deleteImageLocal(imageUrl, folder);
        } else if ("supabase".equals(storageType)) {
            deleteImageSupabase(imageUrl, bucket);
        }
    }

    private void validateFile(FileUpload fileUpload) {
        if (fileUpload == null || fileUpload.size() == 0) {
            throw new IllegalArgumentException("Fichier vide");
        }

        if (fileUpload.size() > MAX_FILE_SIZE) {
            long maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
            throw new IllegalArgumentException("Fichier trop volumineux (max " + maxSizeMB + " Mo)");
        }

        String extension = getFileExtension(fileUpload.fileName());
        if (!isValidImageExtension(extension)) {
            String acceptedList = String.join(", ", ALLOWED_EXTENSIONS).toUpperCase();
            throw new IllegalArgumentException("Type de fichier non supporté. Formats acceptés: " + acceptedList);
        }

        validateImageContent(fileUpload);
    }

    private void validateImageContent(FileUpload fileUpload) {
        try {
            byte[] header = new byte[12];
            Files.newInputStream(fileUpload.uploadedFile()).read(header);

            if (!isValidImageHeader(header)) {
                throw new IllegalArgumentException("Le fichier n'est pas une image valide");
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("Impossible de lire le fichier");
        }
    }

    private boolean isValidImageHeader(byte[] header) {
        // JPEG: FF D8 FF
        if (header[0] == (byte) 0xFF && header[1] == (byte) 0xD8 && header[2] == (byte) 0xFF) {
            return true;
        }
        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if (header[0] == (byte) 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47) {
            return true;
        }
        // WebP: 52 49 46 46 ... 57 45 42 50
        if (header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46 &&
                header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50) {
            return true;
        }
        return false;
    }

    // ========== IMPLÉMENTATIONS LOCALES ==========
    private byte[] getImageLocal(String fileName, String folder) throws IOException {
        if (fileName.contains("..")) {
            throw new SecurityException("Nom de fichier non valide");
        }

        Path filePath = Paths.get(localUploadDirectory, folder, fileName);
        if (!Files.exists(filePath)) {
            return null;
        }
        return Files.readAllBytes(filePath);
    }

    private void uploadImageLocal(FileUpload file, String fileName, String folder) throws IOException {
        Path uploadDir = Paths.get(localUploadDirectory, folder);
        Files.createDirectories(uploadDir);

        Path filePath = uploadDir.resolve(fileName);
        Files.copy(file.uploadedFile(), filePath);
        System.out.println("Image stockée localement: " + filePath);
    }

    private void deleteImageLocal(String imageUrl, String folder) throws IOException {
        if (imageUrl == null || !imageUrl.startsWith("/images/" + folder + "/")) {
            System.out.println("URL invalide pour suppression locale: " + imageUrl);
            return;
        }

        String fileName = imageUrl.substring(("/images/" + folder + "/").length());
        Path filePath = Paths.get(localUploadDirectory, folder, fileName);

        if (Files.exists(filePath)) {
            Files.delete(filePath);
            System.out.println("Image supprimée localement: " + filePath);
        } else {
            System.out.println("Fichier non trouvé pour suppression: " + filePath);
        }
    }

    // ========== IMPLÉMENTATIONS SUPABASE ==========
    private String uploadImageSupabase(FileUpload file, String fileName, String folder, String bucket) throws IOException {
        if (supabaseUrl.isEmpty() || supabaseKey.isEmpty()) {
            throw new IllegalStateException("Configuration Supabase manquante en mode production");
        }

        try {
            byte[] fileBytes = Files.readAllBytes(file.uploadedFile());
            String objectPath = folder + "/" + fileName;
            String uploadUrl = supabaseUrl.get() + "/storage/v1/object/" + bucket + "/" + objectPath;

            System.out.println("Upload Supabase vers: " + uploadUrl + " (bucket: " + bucket + ")");

            try (Response response = client.target(uploadUrl)
                    .request()
                    .header("Authorization", "Bearer " + supabaseKey.get())
                    .header("Content-Type", getContentTypeFromExtension(getFileExtension(fileName)))
                    .post(Entity.entity(fileBytes, MediaType.APPLICATION_OCTET_STREAM))) {

                if (response.getStatus() == 200 || response.getStatus() == 201) {
                    String publicUrl = supabaseUrl.get() + "/storage/v1/object/public/" + bucket + "/" + objectPath;
                    System.out.println("Image uploadée sur Supabase: " + publicUrl);
                    return publicUrl;
                } else {
                    String errorBody = response.readEntity(String.class);
                    throw new IOException("Erreur upload Supabase: " + response.getStatus() + " - " + errorBody);
                }
            }
        } catch (Exception e) {
            throw new IOException("Erreur lors de l'upload vers Supabase: " + e.getMessage(), e);
        }
    }

    private void deleteImageSupabase(String imageUrl, String bucket) throws IOException {
        if (supabaseUrl.isEmpty() || supabaseKey.isEmpty()) {
            System.out.println("Configuration Supabase manquante, suppression ignorée");
            return;
        }

        if (imageUrl == null || !imageUrl.contains(bucket)) {
            System.out.println("URL Supabase invalide pour bucket " + bucket + ": " + imageUrl);
            return;
        }

        try {
            String objectPath = getObjectPath(imageUrl, bucket);
            String deleteUrl = supabaseUrl.get() + "/storage/v1/object/" + bucket + "/" + objectPath;

            System.out.println("   Suppression Supabase:");
            System.out.println("   URL originale: " + imageUrl);
            System.out.println("   Bucket: " + bucket);
            System.out.println("   Object path: " + objectPath);
            System.out.println("   Delete URL: " + deleteUrl);

            try (Response response = client.target(deleteUrl)
                    .request()
                    .header("Authorization", "Bearer " + supabaseKey.get())
                    .delete()) {

                if (response.getStatus() == 200 || response.getStatus() == 204) {
                    System.out.println("Image supprimée de Supabase: " + objectPath);
                } else {
                    String errorBody = response.readEntity(String.class);
                    System.out.println("Erreur suppression Supabase: " + response.getStatus() + " - " + errorBody);
                    throw new IOException("Erreur suppression Supabase: " + response.getStatus() + " - " + errorBody);
                }
            }
        } catch (Exception e) {
            System.out.println("Exception lors de la suppression Supabase: " + e.getMessage());
            throw new IOException("Erreur lors de la suppression Supabase: " + e.getMessage(), e);
        }
    }

    private String getObjectPath(String imageUrl, String bucket) {
        String objectPath;
        if (imageUrl.contains("/storage/v1/object/public/" + bucket + "/")) {
            objectPath = imageUrl.substring(imageUrl.indexOf("/storage/v1/object/public/" + bucket + "/") +
                    ("/storage/v1/object/public/" + bucket + "/").length());
        } else {
            objectPath = imageUrl.substring(imageUrl.indexOf(bucket) + bucket.length() + 1);
        }
        return objectPath;
    }

    // ========== MÉTHODES UTILITAIRES ==========
    @Deprecated
    public String uploadImage(FileUpload file) throws IOException {
        return saveImage(file);
    }

    public void deleteImage(String imageUrlOrFileName) throws IOException {
        System.out.println("deleteImage appelée avec: " + imageUrlOrFileName);

        if (imageUrlOrFileName != null && (imageUrlOrFileName.startsWith("http") || imageUrlOrFileName.startsWith("/images/"))) {
            deleteImageFile(imageUrlOrFileName);
        } else {
            String imageUrl = "/images/" + EQUIPMENT_FOLDER + "/" + imageUrlOrFileName;
            deleteImageFile(imageUrl);
        }
    }

    public String getContentType(String fileName) {
        return getContentTypeFromExtension(getFileExtension(fileName));
    }

    private String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return ".jpg";
        }
        return fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
    }

    private String getContentTypeFromExtension(String extension) {
        String contentType;
        switch (extension.toLowerCase()) {
            case ".png":
                contentType = "image/png";
                break;
            case ".gif":
                contentType = "image/gif";
                break;
            case ".webp":
                contentType = "image/webp";
                break;
            default:
                contentType = "image/jpeg";
                break;
        }
        return contentType;
    }

    private boolean isValidImageExtension(String extension) {
        String cleanExtension = extension.startsWith(".") ? extension.substring(1) : extension;
        return ALLOWED_EXTENSIONS.contains(cleanExtension.toLowerCase());
    }

    public static class UploadConfig {
        public final Long maxFileSize;
        public final List<String> allowedExtensions;
        public final List<String> allowedMimeTypes;

        public UploadConfig(Long maxFileSize, List<String> allowedExtensions, List<String> allowedMimeTypes) {
            this.maxFileSize = maxFileSize;
            this.allowedExtensions = allowedExtensions;
            this.allowedMimeTypes = allowedMimeTypes;
        }
    }
}