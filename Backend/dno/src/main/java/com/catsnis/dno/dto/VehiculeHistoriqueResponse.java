package com.catsnis.dno.dto;

import com.catsnis.dno.entity.VehiculeType;
import com.catsnis.dno.entity.VehiculeStatus;
import lombok.*;
import java.util.Date;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class VehiculeHistoriqueResponse {

    // ── Infos véhicule ────────────────────────────────────────────────────────
    private Integer        id;
    private String         immatriculation;
    private VehiculeType   type;
    private String         marque;
    private String         modele;
    private String         couleur;
    private Date           dateAcquisition;
    private Integer        kilometrage;
    private VehiculeStatus statut;
    private String         numeroCarteGrise;
    private String         regionName;
    private String         districtName;
    private String         conducteurNom;
    private String         observations;
    private String         image;

    // ── Documents actuels ─────────────────────────────────────────────────────
    private Date    dateFinAssurance;
    private boolean assuranceExpiree;
    private boolean assuranceBientotExpiree;
    private Date    dateFinVisiteTechnique;
    private boolean visiteTechniqueExpiree;
    private boolean visiteTechniqueBientotExpiree;
    private Date    dateFinVignette;
    private boolean vignetteExpiree;
    private boolean vignetteBientotExpiree;

    // ── Historique ────────────────────────────────────────────────────────────
    private List<VehiculeAffectationResponse>        affectations;
    private List<VehiculeIncidentResponse>           incidents;
    private List<VehiculeMaintenanceResponse>        maintenances;
    private List<VehiculeAlertResponse>              alertes;
    private List<VehiculeDocumentHistoriqueResponse> documentsHistorique;
}