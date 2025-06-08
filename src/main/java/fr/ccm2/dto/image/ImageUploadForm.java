package fr.ccm2.dto.image;

import org.jboss.resteasy.reactive.multipart.FileUpload;
import jakarta.ws.rs.FormParam;

public class ImageUploadForm {
    @FormParam("file")
    public FileUpload file;
}
