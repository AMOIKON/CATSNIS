package com.catsnis.dno.dto;

import lombok.Data;

@Data
public class SignatureRequest {
    // Image de signature encodée en base64 (avec préfixe data:image/...;base64,)
    private String signatureBase64;
}