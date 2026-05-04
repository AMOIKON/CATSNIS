package com.catsnis.dno.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TechnicianSiteResponse {
    private Integer id;
    private Integer personId;
    private String  technicianName;
    private String  technicianEmail;
    private Integer regionId;
    private String  regionName;
    private Integer districtId;
    private String  districtName;
    private Integer healthId;
    private String  healthName;
}