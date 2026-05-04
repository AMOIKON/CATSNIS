package com.catsnis.dno.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DistrictRequest {
    @NotBlank(message = "Le nom du district est obligatoire")
    private String  districtName;
    @NotNull(message = "La région est obligatoire")
    private Integer regionId;
}