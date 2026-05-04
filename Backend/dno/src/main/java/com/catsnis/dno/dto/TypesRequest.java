package com.catsnis.dno.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TypesRequest {
    @NotBlank(message = "Le nom du type est obligatoire")
    private String typeName;
    private String marque;
    private String modele;
    private String image;
}