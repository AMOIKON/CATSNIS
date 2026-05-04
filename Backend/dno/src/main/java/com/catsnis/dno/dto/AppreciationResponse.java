package com.catsnis.dno.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor

public class AppreciationResponse {

    private Integer id;
    private String appreciateName;
}
