package com.catsnis.dno.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EvaluationRequest {

    @NotBlank(message = "Le nom est obligatoire")
    private String evlName;
}