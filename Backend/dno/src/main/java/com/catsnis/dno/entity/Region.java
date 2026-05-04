package com.catsnis.dno.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "regions")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Region {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "region_name", nullable = false, unique = true)
    private String regionName;
}