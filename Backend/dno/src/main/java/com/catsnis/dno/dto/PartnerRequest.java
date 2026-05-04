package com.catsnis.dno.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PartnerRequest {
    @NotBlank(message = "Le nom est obligatoire")
    private String partnerName;
    private String logo;
    private String color;
    private String image;
}