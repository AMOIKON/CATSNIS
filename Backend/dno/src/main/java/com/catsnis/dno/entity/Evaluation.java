package com.catsnis.dno.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "evaluations")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Evaluation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(name = "evl_name", nullable = false, unique = true)
    private String evlName;
}