package com.catsnis.dno.dto;
import lombok.*;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ImageResponse {
    private Integer id;
    private String  fileName;
    private String  label;
    private String  url;
}