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

    private static final String UPLOAD_DIR = "/opt/uploads/equipments/";
    private static final long MAX_FILE_SIZE = 2 * 1024 * 1024; // Calculer 2 Mo

    public String saveImage(FileUpload fileUpload) throws IOException {
        if (fileUpload == null || fileUpload.size() == 0) {
            throw new IllegalArgumentException("Fichier vide");
        }

        if (fileUpload.size() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Fichier trop volumineux (max 2Mo)");
        }

        // Déterminer l'extension à partir du nom de fichier
        String originalFileName = fileUpload.fileName();
        String extension = getFileExtension(originalFileName);
        if (!isValidImageExtension(extension)) {
            throw new IllegalArgumentException("Type de fichier non supporté. Formats acceptés: JPG, JPEG, PNG");
        }

        // Créer le répertoire s'il n'existe pas
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Générer un nom unique
        String fileName = UUID.randomUUID() + extension;
        Path filePath = uploadPath.resolve(fileName);

        // Sauvegarder le fichier
        Files.copy(fileUpload.uploadedFile(), filePath);

        return "/images/equipments/" + fileName;
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
        if (fileName.contains("..")) {
            throw new SecurityException("Nom de fichier non valide");
        }

        Path imagePath = Paths.get(UPLOAD_DIR, fileName);
        if (!Files.exists(imagePath)) {
            return null;
        }

        return Files.readAllBytes(imagePath);
    }

    public String getContentType(String fileName) throws IOException {
        Path imagePath = Paths.get(UPLOAD_DIR, fileName);
        return Files.probeContentType(imagePath);
    }

    // Méthode optionnelle pour supprimer physiquement les fichiers
    public void deleteImageFile(String imageUrl) throws IOException {
        if (imageUrl == null || !imageUrl.startsWith("/images/equipments/")) {
            return;
        }

        String fileName = imageUrl.substring("/images/equipments/".length());
        Path imagePath = Paths.get(UPLOAD_DIR, fileName);

        if (Files.exists(imagePath)) {
            Files.delete(imagePath);
        }
    }
}