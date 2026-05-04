package com.catsnis.dno.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "units")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Units {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "unit_name", nullable = false, unique = true)
    private String unitName;
}