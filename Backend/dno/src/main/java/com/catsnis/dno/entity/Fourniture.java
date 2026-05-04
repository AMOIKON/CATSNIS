package com.catsnis.dno.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Table(name = "fournitures")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Fourniture {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true, nullable = false, length = 50)
    private String code;

    @Column(nullable = false, length = 200)
    private String designation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FournitureCategorie categorie;

    @Column(nullable = false)
    @Builder.Default
    private Integer quantite = 0;

    @Column(name = "quantite_disponible", nullable = false)
    @Builder.Default
    private Integer quantiteDisponible = 0;

    @Column(length = 50)
    @Builder.Default
    private String unite = "Pièce";

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "date_acquisition")
    @Temporal(TemporalType.DATE)
    private Date dateAcquisition;

    @Column(length = 200)
    private String fournisseur;

    @Column(name = "prix_unitaire")
    private Double prixUnitaire;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private FournitureStatut statut = FournitureStatut.DISPONIBLE;

    @Column(name = "created_at")
    @Temporal(TemporalType.TIMESTAMP)
    @Builder.Default
    private Date createdAt = new Date();

    // ── Enums internes ────────────────────────────────────────────────────────

    public enum FournitureCategorie {
        INFORMATIQUE, MOBILIER, PAPETERIE, BUREAUTIQUE, ELECTROMENAGER, AUTRE
    }

    public enum FournitureStatut {
        DISPONIBLE, DEPLOYE, EN_RUPTURE
    }
}