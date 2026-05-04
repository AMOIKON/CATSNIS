package com.catsnis.dno.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Table(name = "vehicule_document_historiques")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class VehiculeDocumentHistorique {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vehicule_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer","handler"})
    private Vehicule vehicule;

    /** ASSURANCE | VISITE_TECHNIQUE | VIGNETTE */
    @Column(name = "type_document", nullable = false)
    private String typeDocument;

    @Column(name = "ancienne_date_debut") @Temporal(TemporalType.DATE)
    private Date ancienneDateDebut;

    @Column(name = "ancienne_date_fin") @Temporal(TemporalType.DATE)
    private Date ancienneDateFin;

    @Column(name = "nouvelle_date_debut", nullable = false) @Temporal(TemporalType.DATE)
    private Date nouvelleDateDebut;

    @Column(name = "nouvelle_date_fin", nullable = false) @Temporal(TemporalType.DATE)
    private Date nouvelleDateFin;

    @Column(name = "date_renouvellement", nullable = false) @Temporal(TemporalType.DATE)
    private Date dateRenouvellement;

    private String notes;
}