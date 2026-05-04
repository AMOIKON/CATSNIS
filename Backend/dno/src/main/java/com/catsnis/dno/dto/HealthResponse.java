package com.catsnis.dno.dto;
import lombok.*;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class HealthResponse {
    private Integer id;
    private String  healthName;
    private Integer regionId;
    private String  Region;
    private Integer districtId;
    private String  districtName;
}