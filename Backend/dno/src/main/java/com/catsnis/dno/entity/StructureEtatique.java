package com.catsnis.dno.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "structures_etatiques")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class StructureEtatique {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "region_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Region region;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "district_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "region"})
    private District district;

    private String contact;

    // ✅ NOUVEAU — Logo optionnel, stocké en base64 (même principe que
    // partners/apps). Facultatif : peut rester null.
    @Lob
    @Column(name = "logo", columnDefinition = "LONGTEXT")
    private String logo;

    @Column(name = "created_at", updatable = false, insertable = false)
    private LocalDateTime createdAt;
}