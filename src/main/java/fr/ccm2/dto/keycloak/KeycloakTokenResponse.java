package fr.ccm2.dto.keycloak;

import com.fasterxml.jackson.annotation.JsonProperty;

public class KeycloakTokenResponse {
    @JsonProperty("access_token")
    public String accessToken;

    @JsonProperty("expires_in")
    public Integer expiresIn;

    @JsonProperty("token_type")
    public String tokenType;
}
