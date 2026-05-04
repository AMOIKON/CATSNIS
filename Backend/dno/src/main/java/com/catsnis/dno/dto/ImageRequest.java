package com.catsnis.dno.dto;
import lombok.*;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ImageRequest {
    private String fileName;
    private String label;
}