package com.catsnis.dno.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TechnicianSiteRequest {

    @NotNull(message = "Le technicien est obligatoire")
    private Integer personId;

    private Integer regionId;
    private Integer districtId;
    private Integer healthId;
}