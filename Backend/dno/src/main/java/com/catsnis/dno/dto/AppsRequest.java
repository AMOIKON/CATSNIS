package com.catsnis.dno.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AppsRequest {
    @NotBlank(message = "Le nom est obligatoire")
    private String appName;
    private String icon;
    private String color;
    private String image;
}