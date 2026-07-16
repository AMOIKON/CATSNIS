package com.catsnis.dno.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SignatureResponse {
    private boolean configured;
    private String  signatureBase64; // renvoyée pour prévisualisation dans le profil
}