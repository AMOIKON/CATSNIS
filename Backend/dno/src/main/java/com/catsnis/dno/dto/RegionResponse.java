package com.catsnis.dno.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RegionResponse {
    private Integer id;
    private String    regionName;
}