package com.catsnis.dno.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "deployment_items")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DeploymentItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "deployment_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "items"})
    private Deployment deployment;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "acquisition_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Acquisition acquisition;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "replacement_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Acquisition replacement;

    private String status;

    @Column(name = "etat_avant")
    private String etatAvant;

    @Column(name = "etat_apres")
    private String etatApres;
}