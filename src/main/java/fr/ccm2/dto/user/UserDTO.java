package fr.ccm2.dto.user;

public class UserDTO {
    public String id;
    public String username;
    public String firstName;
    public String lastName;
    public String email;
    public String displayName;
    public boolean enabled;

    // Constructeur par défaut
    public UserDTO() {}

    // Constructeur simplifié
    public UserDTO(String username, String displayName) {
        this.username = username;
        this.displayName = displayName;
        this.enabled = true;
    }

    // Constructeur complet
    public UserDTO(String id, String username, String firstName, String lastName, String email, String displayName, boolean enabled) {
        this.id = id;
        this.username = username;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.displayName = displayName;
        this.enabled = enabled;
    }
}