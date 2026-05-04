package com.catsnis.dno.dto;
import lombok.*;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DeploymentItemResponse {
    private Long    id;
    private Long    acquisitionId;
    private String  tag;
    private String  serial;
    private String  typeName;
    private String  status;
    private String  etatAvant;
    private String  etatApres;
    private Long    replacementId;
    private String  replacementTag;
    private String  replacementSerial;
    private String  replacementType;
}