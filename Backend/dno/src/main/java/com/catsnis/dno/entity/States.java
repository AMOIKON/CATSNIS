package com.catsnis.dno.entity;
import jakarta.persistence.*;
import lombok.*;
@Entity
@Table(name = "states")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class States {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(name = "states_name", nullable = false, unique = true)
    private String statesName;
}