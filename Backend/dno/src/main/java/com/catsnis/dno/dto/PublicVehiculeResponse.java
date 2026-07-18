package com.catsnis.dno.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * Version allégée de VehiculeResponse pour la consultation PUBLIQUE
 * via QR code (sans connexion) — mêmes informations que la fiche PDF.
 * Volontairement sans données sensibles (coûts, fournisseur, financement).
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PublicVehiculeResponse {
    private String immatriculation;
    private String type;
    private String marque;
    private String modele;
    private String couleur;
    private String statut;
    private Integer kilometrage;
    private String regionName;
    private String districtName;
    private String conducteurNom;
    private Date dateFinAssurance;
    private Date dateFinVisiteTechnique;
    private Date dateFinVignette;
}