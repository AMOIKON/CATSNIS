package com.catsnis.dno.dto;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AppsResponse {
    private Integer id;
    private String  appsName;
    private String  icon;
    private String  color;
    private String  image;
    private String  base64;   // ✅ AJOUT
}