package com.catsnis.dno.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "booklets")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Booklet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    private String contact;
    private String email;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "region_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "districts", "booklets"})
    private Region region;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "district_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "booklets"})
    private District district;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "post_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Post post;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "status_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private BookletStatus status;

    // ✅ NOUVEAU (26/08/2026) — signature du booklet (beneficiaire ou personne
    // receptionnaire), au meme format que Person.signatureBase64 : soit dessinee
    // a l'ecran, soit importee (photo/PDF) via SignatureUploadService. Utilisee
    // par InterventionPdfService et DeploymentPdfService sur les fiches PDF.
    @Lob
    @Column(name = "signature_base64", columnDefinition = "LONGTEXT")
    private String signatureBase64;
}