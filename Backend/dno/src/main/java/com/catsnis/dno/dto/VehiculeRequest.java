package com.catsnis.dno.dto;

import com.catsnis.dno.entity.VehiculeType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.Date;

@Data
public class VehiculeRequest {

    // ── Champs obligatoires ───────────────────────────────────────────────────
    @NotBlank
    private String       immatriculation;
    @NotNull
    private VehiculeType type;

    // ── Identification ────────────────────────────────────────────────────────
    private String  marque;
    private String  modele;
    private String  couleur;
    private String  numeroCarteGrise;
    private Integer kilometrage;
    private String  statut;
    private String  image;
    private String  observations;

    // ── Dates documents ───────────────────────────────────────────────────────
    private Date dateAcquisition;
    private Date dateAssurance;
    private Date dateFinAssurance;
    private Date dateVisiteTechnique;
    private Date dateFinVisiteTechnique;
    private Date dateVignette;
    private Date dateFinVignette;

    // ── Affectation ───────────────────────────────────────────────────────────
    private Integer conducteurId;
    private Integer conducteurBookletId;   // conducteur depuis registre Booklet
    private Integer regionId;
    private Integer districtId;

    // ── Acquisition (tous optionnels) ─────────────────────────────────────────
    private Double  prixAchat;
    private String  fournisseur;
    private String  modeFinancement;       // ACHAT_DIRECT, DON, LEASING, AUTRE
    private String  numeroBonCommande;
    private String  sourceFinancement;     // Ex: Budget état, Unicef, Banque mondiale
}