package com.catsnis.dno.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PostRequest {

    @NotBlank(message = "Le nom est obligatoire")
    private String postName;
}