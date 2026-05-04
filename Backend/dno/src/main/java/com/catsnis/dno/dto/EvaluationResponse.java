package com.catsnis.dno.dto;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class EvaluationResponse {
    private Integer id;
    private String  evlName;
}