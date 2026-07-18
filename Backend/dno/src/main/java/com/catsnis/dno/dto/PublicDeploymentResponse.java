package com.catsnis.dno.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Version allégée de DeploymentResponse pour la consultation PUBLIQUE
 * via QR code (sans connexion) — mêmes informations que la fiche PDF.
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PublicDeploymentResponse {
    private String codeDep;
    private LocalDateTime dateRecep;
    private String comment;
    private String regionDeploy;
    private String districtDeploy;
    private String healthDeploy;
    private String appsDeploy;
    private String technicianName;
    private String partnerName;
    private List<PublicDeploymentItem> items;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class PublicDeploymentItem {
        private String typeName;
        private String tag;
        private String status;
    }
}