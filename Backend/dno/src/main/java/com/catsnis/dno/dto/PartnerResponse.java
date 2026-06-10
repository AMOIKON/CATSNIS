package com.catsnis.dno.dto;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PartnerResponse {
    private Integer id;
    private String  partnerName;
    private String  logo;
    private String  color;
    private String  image;
    private String  base64;   // ✅ AJOUT
}