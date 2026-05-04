package com.catsnis.dno.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Table(name = "vehicules")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Vehicule {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "immatriculation", nullable = false, unique = true)
    private String immatriculation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VehiculeType type;

    private String  marque;
    private String  modele;
    private String  couleur;
    private Integer kilometrage;
    private String  image;
    private String  observations;

    @Column(name = "numero_carte_grise")
    private String numeroCarteGrise;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private VehiculeStatus statut = VehiculeStatus.DISPONIBLE;

    // ── Dates documents ───────────────────────────────────────────────────────
    @Column(name = "date_acquisition")          @Temporal(TemporalType.DATE) private Date dateAcquisition;
    @Column(name = "date_assurance")            @Temporal(TemporalType.DATE) private Date dateAssurance;
    @Column(name = "date_fin_assurance")        @Temporal(TemporalType.DATE) private Date dateFinAssurance;
    @Column(name = "date_visite_technique")     @Temporal(TemporalType.DATE) private Date dateVisiteTechnique;
    @Column(name = "date_fin_visite_technique") @Temporal(TemporalType.DATE) private Date dateFinVisiteTechnique;
    @Column(name = "date_vignette")             @Temporal(TemporalType.DATE) private Date dateVignette;
    @Column(name = "date_fin_vignette")         @Temporal(TemporalType.DATE) private Date dateFinVignette;

    // ── Acquisition (optionnels) ──────────────────────────────────────────────
    @Column(name = "prix_achat")         private Double prixAchat;
    @Column(name = "fournisseur")        private String fournisseur;
    @Column(name = "mode_financement")   private String modeFinancement;
    @Column(name = "numero_bon_commande")private String numeroBonCommande;
    @Column(name = "source_financement") private String sourceFinancement;

    // ── Relations ─────────────────────────────────────────────────────────────
    // Conducteur système (Person)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "conducteur_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer","handler","password","role"})
    private Person conducteur;

    // ✅ Conducteur booklet (registre)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "conducteur_booklet_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer","handler","region","district","post","status"})
    private Booklet conducteurBooklet;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "region_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer","handler"})
    private Region region;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "district_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer","handler"})
    private District district;
}