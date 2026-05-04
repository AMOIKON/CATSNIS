package com.catsnis.dno.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UnitsRequest {
    @NotBlank(message = "Le nom est obligatoire")
    private String unitName;
}