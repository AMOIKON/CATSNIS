package com.catsnis.dno.dto;

import com.catsnis.dno.entity.VehiculeType;
import com.catsnis.dno.entity.VehiculeStatus;
import lombok.*;
import java.util.Date;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class VehiculeResponse {

    private Integer        id;
    private String         immatriculation;
    private VehiculeType   type;
    private String         marque;
    private String         modele;
    private String         couleur;
    private Integer        kilometrage;
    private VehiculeStatus statut;
    private String         numeroCarteGrise;
    private String         image;
    private String         observations;

    private Date    dateAcquisition;
    private Date    dateAssurance;
    private Date    dateFinAssurance;
    private boolean assuranceExpiree;
    private boolean assuranceBientotExpiree;
    private Date    dateVisiteTechnique;
    private Date    dateFinVisiteTechnique;
    private boolean visiteTechniqueExpiree;
    private boolean visiteTechniqueBientotExpiree;
    private Date    dateVignette;
    private Date    dateFinVignette;
    private boolean vignetteExpiree;
    private boolean vignetteBientotExpiree;

    // Conducteur — Person système
    private Integer conducteurId;
    private String  conducteurNom;

    // ✅ Conducteur depuis affectation active (booklet ou person)
    private Integer conducteurBookletId;   // Long.intValue() de Booklet.id
    private String  conducteurActifNom;    // nom depuis affectation active

    private Integer regionId;
    private String  regionName;
    private Integer districtId;
    private String  districtName;

    // Acquisition (optionnels)
    private Double prixAchat;
    private String fournisseur;
    private String modeFinancement;
    private String numeroBonCommande;
    private String sourceFinancement;
}