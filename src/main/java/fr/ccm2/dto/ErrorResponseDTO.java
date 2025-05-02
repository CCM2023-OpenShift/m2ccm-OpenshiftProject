package fr.ccm2.dto;

public class ErrorResponseDTO {
    private String error;

    public ErrorResponseDTO() {
    }

    public ErrorResponseDTO(String error) {
        this.error = error;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
}
