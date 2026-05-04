package com.catsnis.dno.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "booklet_statuses")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class BookletStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "status_name", nullable = false, unique = true)
    private String statusName;
}