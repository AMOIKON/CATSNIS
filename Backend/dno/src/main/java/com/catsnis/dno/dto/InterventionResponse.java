package com.catsnis.dno.dto;

import lombok.*;
import java.util.Date;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class InterventionResponse {
    private Integer                    id;
    private String                     codeInter;
    private String                     typeInter;
    private String                     actionInter;
    private String                     commentInter;
    private Date                       dateInter;
    private Integer                    durationMinutes;
    private String                     regionName;
    private String                     districtName;
    private String                     healthName;
    private String                     typeName;
    private String                     evlName;
    private Integer                    regionId;
    private Integer                    districtId;
    private Integer                    healthId;
    private Integer                    deploymentId;
    private Integer                    evaluationId;
    private Integer                    typesId;
    private Integer                    appsId;
    private String                     deploymentCode;
    private List<DeploymentItemResponse> deploymentItems;
    private String                     appName;
    private String                     appsIcon;
    private String                     appsColor;
    private String                     appsImage;
    private String                     technicianName;
    private String                     partnerName;
    private String                     partnerLogo;
    private String                     partnerColor;
    private String                     partnerImage;
    private Integer                    personId;
    private String                     personName;
    private String                     personContact;
    private String                     personPost;
    private Boolean                    enAttenteMaintenance;
    private Integer                    partnerId;

    // ── Géolocalisation ───────────────────────────────────────────────────────
    private Double                     latitude;
    private Double                     longitude;
}