package fr.ccm2.services;

import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.resteasy.reactive.multipart.FileUpload;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@ApplicationScoped
public class ImageService {

    private static final String EQUIPMENT_UPLOAD_DIR = "/uploads/images/equipments/";
    private static final String ROOM_UPLOAD_DIR = "/uploads/images/rooms/";
    private static final long MAX_FILE_SIZE = 200 * 1024 * 1024; // 200 000 Ko = ~195 Mo

    // Méthodes existantes pour les équipements...
    public String saveImage(FileUpload fileUpload) throws IOException {
        return saveImageToDirectory(fileUpload, EQUIPMENT_UPLOAD_DIR, "/images/equipments/");
    }

    // Nouvelles méthodes pour les salles
    public String saveRoomImage(FileUpload fileUpload) throws IOException {
        return saveImageToDirectory(fileUpload, ROOM_UPLOAD_DIR, "/images/rooms/");
    }

    private String saveImageToDirectory(FileUpload fileUpload, String uploadDir, String urlPrefix) throws IOException {
        if (fileUpload == null || fileUpload.size() == 0) {
            throw new IllegalArgumentException("Fichier vide");
        }

        if (fileUpload.size() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Fichier trop volumineux (max 200 Mo)");
        }

        String originalFileName = fileUpload.fileName();
        String extension = getFileExtension(originalFileName);
        if (!isValidImageExtension(extension)) {
            throw new IllegalArgumentException("Type de fichier non supporté. Formats acceptés: JPG, JPEG, PNG");
        }

        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String fileName = UUID.randomUUID() + extension;
        Path filePath = uploadPath.resolve(fileName);

        Files.copy(fileUpload.uploadedFile(), filePath);

        return urlPrefix + fileName;
    }

    private String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
    }

    private boolean isValidImageExtension(String extension) {
        return ".jpg".equals(extension) || ".jpeg".equals(extension) || ".png".equals(extension);
    }

    public byte[] getImage(String fileName) throws IOException {
        return getImageFromDirectory(fileName, EQUIPMENT_UPLOAD_DIR);
    }

    public byte[] getRoomImage(String fileName) throws IOException {
        return getImageFromDirectory(fileName, ROOM_UPLOAD_DIR);
    }

    private byte[] getImageFromDirectory(String fileName, String uploadDir) throws IOException {
        if (fileName.contains("..")) {
            throw new SecurityException("Nom de fichier non valide");
        }

        Path imagePath = Paths.get(uploadDir, fileName);
        if (!Files.exists(imagePath)) {
            return null;
        }

        return Files.readAllBytes(imagePath);
    }

    public String getContentType(String fileName) throws IOException {
        Path imagePath = Paths.get(EQUIPMENT_UPLOAD_DIR, fileName);
        return Files.probeContentType(imagePath);
    }

    public String getRoomContentType(String fileName) throws IOException {
        Path imagePath = Paths.get(ROOM_UPLOAD_DIR, fileName);
        return Files.probeContentType(imagePath);
    }

    public void deleteImageFile(String imageUrl) throws IOException {
        deleteImageFileFromDirectory(imageUrl, "/images/equipments/", EQUIPMENT_UPLOAD_DIR);
    }

    public void deleteRoomImageFile(String imageUrl) throws IOException {
        deleteImageFileFromDirectory(imageUrl, "/images/rooms/", ROOM_UPLOAD_DIR);
    }

    private void deleteImageFileFromDirectory(String imageUrl, String urlPrefix, String uploadDir) throws IOException {
        if (imageUrl == null || !imageUrl.startsWith(urlPrefix)) {
            return;
        }

        String fileName = imageUrl.substring(urlPrefix.length());
        Path imagePath = Paths.get(uploadDir, fileName);

        if (Files.exists(imagePath)) {
            Files.delete(imagePath);
        }
    }
}
