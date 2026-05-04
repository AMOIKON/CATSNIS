package com.catsnis.dno.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import jakarta.persistence.Table;

@Entity
@Table(name = "deployment")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Deployment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "code_dep", nullable = false, unique = true)
    private String codeDep;

    @Column(name = "date_recep")
    private LocalDateTime dateRecep;

    private String comment;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "region_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Region region;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "district_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "region"})
    private District district;

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

    @OneToMany(mappedBy = "deployment", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "deployment"})
    private List<DeploymentItem> items;
}