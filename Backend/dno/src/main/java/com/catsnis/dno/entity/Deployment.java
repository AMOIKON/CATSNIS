package com.catsnis.dno.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "deployment")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Deployment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "code_dep", nullable = false, unique = true)
    private String codeDep;

    @Column(name = "date_recept", nullable = true)
    private LocalDateTime dateRecep;

    private String comment;

    // ── Géolocalisation ───────────────────────────────────────────────────────
    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "region_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Region region;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "district_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "region"})
    private District district;

    // ✅ MODIFIÉ — nullable en base (health_id BIGINT NULL) : facultatif
    // quand la personne réceptionnaire a le poste "Convoyeur"
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "health_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "district", "region"})
    private Health health;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "apps_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Apps apps;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "authorities"})
    private Person createdBy;

    @OneToMany(
            mappedBy      = "deployment",
            cascade       = CascadeType.ALL,
            orphanRemoval = true,
            fetch         = FetchType.EAGER
    )
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "deployment"})
    @Builder.Default
    private List<DeploymentItem> items = new ArrayList<>();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "partner_id")
    private Partner partner;

    // ── Personne réceptionnaire ──────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "received_by_booklet_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "region", "district", "post", "status"})
    private Booklet receivedByBooklet;

    @Column(name = "received_by_name")
    private String receivedByName;

    @Column(name = "received_by_contact")
    private String receivedByContact;

    @Column(name = "received_by_post")
    private String receivedByPost;
}