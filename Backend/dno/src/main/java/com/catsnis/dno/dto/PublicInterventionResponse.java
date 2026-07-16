package com.catsnis.dno.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

/**
 * Version allégée de InterventionResponse pour la consultation PUBLIQUE
 * via QR code (sans connexion) — expose uniquement les informations déjà
 * visibles sur la fiche PDF, rien de plus sensible (pas d'email, pas de
 * contact téléphonique, pas d'identifiants internes de navigation).
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PublicInterventionResponse {
    private String codeInter;
    private String typeInter;
    private String actionInter;
    private String commentInter;
    private Date   dateInter;
    private Integer durationMinutes;
    private String regionName;
    private String districtName;
    private String healthName;
    private String structureName;      // si structure hors base
    private String appName;
    private String technicianName;
    private String personName;
    private String manualEquipmentName;
    private String manualEquipmentType;
    private boolean structureEnregistree;
    private boolean equipementHorsBase;
    private List<PublicDeploymentItem> deploymentItems;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class PublicDeploymentItem {
        private String typeName;
        private String tag;
        private String etatAvant;
        private String etatApres;
    }
}