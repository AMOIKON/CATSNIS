package com.catsnis.dno.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "partners")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Partner {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(name = "partner_name", nullable = false, unique = true)
    private String partnerName;
    private String logo;
    private String color;
    private String image;
}