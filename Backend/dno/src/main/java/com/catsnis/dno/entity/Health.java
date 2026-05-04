package com.catsnis.dno.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "health_sites")
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