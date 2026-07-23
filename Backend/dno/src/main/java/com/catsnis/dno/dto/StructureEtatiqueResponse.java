package com.catsnis.dno.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class StructureEtatiqueResponse {
    private Long id;
    private String nom;
    private Integer regionId;
    private String regionName;
    private Integer districtId;
    private String districtName;
    private String contact;
    private String logo;
}