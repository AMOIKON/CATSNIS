package com.catsnis.dno.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DeploymentResponse {
    private Integer                    id;
    private String                     codeDep;
    private LocalDateTime              dateRecep;
    private String                     comment;
    private String                     regionDeploy;
    private String                     districtDeploy;
    private String                     healthDeploy;
    private String                     appsDeploy;
    private String                     appsIcon;
    private String                     appsColor;
    private String                     appsImage;
    private Integer                    appsId;
    private Integer                    regionId;
    private Integer                    districtId;
    private Integer                    healthId;
    private String                     technicianName;
    private String                     partnerName;
    private String                     partnerLogo;
    private String                     partnerColor;
    private String                     partnerImage;
    private List<DeploymentItemResponse> items;
}