package com.catsnis.dno.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "apps")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Apps {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "app_name", nullable = false, unique = true)
    private String appName;

    private String icon;
    private String color;
    private String image;
}