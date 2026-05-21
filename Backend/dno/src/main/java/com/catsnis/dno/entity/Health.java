package com.catsnis.dno.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
// ✅ Correction — pointer sur "health" (table référencée par les FK deployment, intervention, etc.)
// "health_sites" était incorrect et causait les erreurs de contrainte FK
@Table(name = "health")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Health {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "health_name", nullable = false)
    private String healthName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "district_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "region"})
    private District district;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "region_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Region region;
}