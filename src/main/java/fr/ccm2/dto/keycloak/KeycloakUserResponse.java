package fr.ccm2.dto.keycloak;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public class KeycloakUserResponse {
    public String id;
    public String username;
    public String email;
    public String firstName;
    public String lastName;
    public Boolean enabled;
    public Long createdTimestamp;

    @JsonProperty("attributes")
    public Map<String, List<String>> attributes;
}
