package com.catsnis.dno.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "types")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Types {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "type_name", nullable = false, unique = true)
    private String typeName;

    private String marque;
    private String modele;
    private String image;


    @Column(name = "data", columnDefinition = "LONGBLOB")
    private byte[] data;
}