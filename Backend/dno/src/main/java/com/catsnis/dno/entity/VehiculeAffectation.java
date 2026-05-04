package com.catsnis.dno.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Table(name = "vehicule_affectations")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class VehiculeAffectation {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vehicule_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer","handler","conducteur","region","district"})
    private Vehicule vehicule;

    // ✅ Person système (nullable — peut être null si booklet utilisé)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "person_id", nullable = true)
    @JsonIgnoreProperties({"hibernateLazyInitializer","handler","password","authorities","post","units","partner"})
    private Person person;

    // ✅ Conducteur/convoyeur depuis le registre Booklet
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "booklet_id", nullable = true)
    @JsonIgnoreProperties({"hibernateLazyInitializer","handler","region","district","post","status"})
    private Booklet booklet;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "region_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer","handler"})
    private Region region;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "district_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer","handler","region"})
    private District district;

    @Column(name = "date_affectation", nullable = false)
    @Temporal(TemporalType.DATE)
    private Date dateAffectation;

    @Column(name = "date_retour")
    @Temporal(TemporalType.DATE)
    private Date dateRetour;

    private String motif;
    private String observations;

    @Builder.Default
    private Boolean active = true;
}