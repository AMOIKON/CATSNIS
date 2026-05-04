package com.catsnis.dno.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class HealthRequest {
    @NotBlank(message = "Le nom du site est obligatoire")
    private String  healthName;
    @NotNull(message = "La région est obligatoire")
    private Integer regionId;
    @NotNull(message = "Le district est obligatoire")
    private Integer districtId;
}