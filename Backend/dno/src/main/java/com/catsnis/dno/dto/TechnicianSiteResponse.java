package com.catsnis.dno.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TechnicianSiteResponse {

    private Integer id;

    // Personne assignée
    private Integer personId;
    private String  technicianName;
    private String  technicianEmail;
    private String  personRole;

    // Périmètre géographique
    private Integer regionId;
    private String  regionName;
    private Integer districtId;
    private String  districtName;
    private Integer healthId;
    private String  healthName;

    // ✅ Niveau calculé : REGION | DISTRICT | SITE
    private String  niveau;

    // ✅ Horodatage pour l'historique
    private String  createdAt;
    private String  updatedAt;
}