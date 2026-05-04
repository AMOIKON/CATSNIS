package com.catsnis.dno.dto;
import lombok.*;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DistrictResponse {
    private Integer id;
    private String  DistrictName;
    private String  regionDistrict;
}