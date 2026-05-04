package com.catsnis.dno.entity;
import jakarta.persistence.*;
import lombok.*;
@Entity
@Table(name = "appreciations")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Appreciation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(name = "appreciate_name", nullable = false, unique = true)
    private String appreciateName;
}