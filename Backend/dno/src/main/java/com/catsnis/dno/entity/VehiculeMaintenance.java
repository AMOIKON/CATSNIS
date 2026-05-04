package com.catsnis.dno.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Table(name = "vehicule_maintenances")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class VehiculeMaintenance {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vehicule_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "conducteur", "region", "district"})
    private Vehicule vehicule;

    @Column(name = "date_maintenance", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date dateMaintenance;

    @Column(name = "type_maintenance") private String  typeMaintenance;
    @Column(nullable = false)          private String  description;
    private String  prestataire;

    @Column(name = "cout_reel")                  private Double  coutReel;
    private String statut;
    @Column(name = "kilometrage_intervention")   private Integer kilometrageIntervention;
    private String observations;
}