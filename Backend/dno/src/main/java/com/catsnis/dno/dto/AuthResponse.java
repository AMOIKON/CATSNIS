package com.catsnis.dno.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AuthResponse {
    private String  accessToken;
    private String  refreshToken;
    private String  tokenType;
    private long    expiresIn;
    private Long    id;
    private String  firstName;
    private String  lastName;
    private String  email;
    private String  role;
    private String  partnerName;
    private String  postName;
    private String  unitsName;
}