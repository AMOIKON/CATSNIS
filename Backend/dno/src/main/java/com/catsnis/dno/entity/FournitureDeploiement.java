package com.catsnis.dno.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Table(name = "fourniture_deploiements")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class FournitureDeploiement {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "fourniture_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Fourniture fourniture;

    // Bénéficiaire : Person système OU Booklet (même logique que VehiculeAffectation)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "person_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "role"})
    private Person person;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "booklet_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "region", "district"})
    private Booklet booklet;

    @Column(name = "quantite_deployee", nullable = false)
    private Integer quantiteDeployee;

    @Column(name = "date_deploiement", nullable = false)
    @Temporal(TemporalType.DATE)
    private Date dateDeploiement;

    @Column(length = 500)
    private String motif;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "region_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Region region;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "district_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private District district;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Builder.Default
    private Boolean active = true;

    @Column(name = "created_at")
    @Temporal(TemporalType.TIMESTAMP)
    @Builder.Default
    private Date createdAt = new Date();
}