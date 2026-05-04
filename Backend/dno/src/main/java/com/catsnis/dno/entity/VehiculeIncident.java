package com.catsnis.dno.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Table(name = "vehicule_incidents")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class VehiculeIncident {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vehicule_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "conducteur", "region", "district"})
    private Vehicule vehicule;

    @Column(name = "date_incident", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date dateIncident;

    @Column(nullable = false)
    private String description;

    @Column(name = "type_incident") private String typeIncident;
    private String statut;

    @Column(name = "cout_estime")   private Double  coutEstime;
    @Column(name = "signale_par")   private String  signalePar;
    @Column(name = "lieu_incident") private String  lieuIncident;
    private String observations;
}