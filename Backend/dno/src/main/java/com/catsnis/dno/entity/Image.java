package com.catsnis.dno.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "images")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Image {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "file_name", nullable = false, unique = true)
    private String fileName;

    @Column(nullable = false)
    private String label;

    @Column(name = "mime_type")
    private String mimeType;

    @Column(name = "file_size")
    private Long fileSize;

    // ✅ AJOUT — stockage binaire en base
    @Lob
    @Column(name = "data", columnDefinition = "LONGBLOB")
    private byte[] data;
}