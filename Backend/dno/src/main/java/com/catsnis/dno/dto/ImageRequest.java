package com.catsnis.dno.dto;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ImageRequest {
    private String fileName;
    private String label;
    private String mimeType;  // ✅ AJOUT
    private Long   fileSize;  // ✅ AJOUT
    private byte[] data;      // ✅ AJOUT — contenu binaire
}