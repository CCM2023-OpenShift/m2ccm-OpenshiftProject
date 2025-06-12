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

    @ConfigProperty(name = "%prod.app.supabase.bucket", defaultValue = "equipment-images")
    String supabaseBucket;

    private static final String EQUIPMENT_FOLDER = "equipments";
    private static final String ROOM_FOLDER = "rooms";
    private static final long MAX_FILE_SIZE = 200 * 1024 * 1024; // 200 MB

    private final Client client = ClientBuilder.newClient();

    // ========== MÉTHODES POUR ÉQUIPEMENTS ==========
    public String saveImage(FileUpload fileUpload) throws IOException {
        return uploadImageToFolder(fileUpload, EQUIPMENT_FOLDER);
    }

    public byte[] getImage(String fileName) throws IOException {
        return getImageFromFolder(fileName, EQUIPMENT_FOLDER);
    }

    public void deleteImageFile(String imageUrl) throws IOException {
        deleteImageFromFolder(imageUrl, EQUIPMENT_FOLDER);
    }

    // ========== MÉTHODES POUR SALLES ==========
    public String saveRoomImage(FileUpload fileUpload) throws IOException {
        return uploadImageToFolder(fileUpload, ROOM_FOLDER);
    }

    public byte[] getRoomImage(String fileName) throws IOException {
        return getImageFromFolder(fileName, ROOM_FOLDER);
    }

    public void deleteRoomImageFile(String imageUrl) throws IOException {
        deleteImageFromFolder(imageUrl, ROOM_FOLDER);
    }

    public String getRoomContentType(String fileName) throws IOException {
        return getContentType(fileName);
    }

    // ========== MÉTHODES COMMUNES ==========
    private String uploadImageToFolder(FileUpload fileUpload, String folder) throws IOException {
        validateFile(fileUpload);

        String originalFileName = fileUpload.fileName();
        String extension = getFileExtension(originalFileName);
        String fileName = UUID.randomUUID() + extension;

        if ("local".equals(storageType)) {
            uploadImageLocal(fileUpload, fileName, folder);
            return "/images/" + folder + "/" + fileName;
        } else if ("supabase".equals(storageType)) {
            return uploadImageSupabase(fileUpload, fileName, folder);
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

    private void deleteImageFromFolder(String imageUrl, String folder) throws IOException {
        System.out.println("Suppression demandée pour: " + imageUrl + " (folder: " + folder + ")");

        if ("local".equals(storageType)) {
            deleteImageLocal(imageUrl, folder);
        } else if ("supabase".equals(storageType)) {
            deleteImageSupabase(imageUrl);
        }
    }

    private void validateFile(FileUpload fileUpload) {
        if (fileUpload == null || fileUpload.size() == 0) {
            throw new IllegalArgumentException("Fichier vide");
        }

        if (fileUpload.size() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Fichier trop volumineux (max 200 Mo)");
        }

        String extension = getFileExtension(fileUpload.fileName());
        if (!isValidImageExtension(extension)) {
            throw new IllegalArgumentException("Type de fichier non supporté. Formats acceptés: JPG, JPEG, PNG");
        }
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
    private String uploadImageSupabase(FileUpload file, String fileName, String folder) throws IOException {
        // Vérifiez si les configurations Supabase sont présentes
        if (supabaseUrl.isEmpty() || supabaseKey.isEmpty()) {
            throw new IllegalStateException("Configuration Supabase manquante en mode production");
        }

        try {
            byte[] fileBytes = Files.readAllBytes(file.uploadedFile());
            String objectPath = folder + "/" + fileName;
            String uploadUrl = supabaseUrl.get() + "/storage/v1/object/" + supabaseBucket + "/" + objectPath;

            System.out.println("Upload Supabase vers: " + uploadUrl);

            try (Response response = client.target(uploadUrl)
                    .request()
                    .header("Authorization", "Bearer " + supabaseKey.get())
                    .header("Content-Type", getContentTypeFromExtension(getFileExtension(fileName)))
                    .post(Entity.entity(fileBytes, MediaType.APPLICATION_OCTET_STREAM))) {

                if (response.getStatus() == 200 || response.getStatus() == 201) {
                    String publicUrl = supabaseUrl.get() + "/storage/v1/object/public/" + supabaseBucket + "/" + objectPath;
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

    private void deleteImageSupabase(String imageUrl) throws IOException {
        if (supabaseUrl.isEmpty() || supabaseKey.isEmpty()) {
            System.out.println("Configuration Supabase manquante, suppression ignorée");
            return;
        }

        if (imageUrl == null || !imageUrl.contains(supabaseBucket)) {
            System.out.println("URL Supabase invalide: " + imageUrl);
            return;
        }

        try {
            String objectPath = getString(imageUrl);
            String deleteUrl = supabaseUrl.get() + "/storage/v1/object/" + supabaseBucket + "/" + objectPath;

            System.out.println("   Suppression Supabase:");
            System.out.println("   URL originale: " + imageUrl);
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

    private String getString(String imageUrl) {
        String objectPath;
        if (imageUrl.contains("/storage/v1/object/public/" + supabaseBucket + "/")) {
            objectPath = imageUrl.substring(imageUrl.indexOf("/storage/v1/object/public/" + supabaseBucket + "/") +
                    ("/storage/v1/object/public/" + supabaseBucket + "/").length());
        } else {
            objectPath = imageUrl.substring(imageUrl.indexOf(supabaseBucket) + supabaseBucket.length() + 1);
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
        return ".jpg".equals(extension) || ".jpeg".equals(extension) || ".png".equals(extension);
    }
}