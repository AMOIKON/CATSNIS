package com.catsnis.dno.dto;

import lombok.Data;

@Data
public class StructureEtatiqueRequest {
    private String nom;
    private Integer regionId;
    private Integer districtId;
    private String contact;
    private String logo;
}