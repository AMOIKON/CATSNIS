package com.catsnis.dno.dto;
import lombok.*;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TypesResponse {
    private Integer id;
    private String  typeName;
    private String  image;
    private String  marque;
    private String  modele;
}