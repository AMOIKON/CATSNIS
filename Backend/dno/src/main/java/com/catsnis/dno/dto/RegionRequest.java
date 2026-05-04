package com.catsnis.dno.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegionRequest {

    @NotBlank(message = "Le nom est obligatoire")
    private String regionName;
}