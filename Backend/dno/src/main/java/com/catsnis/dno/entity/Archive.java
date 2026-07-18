package com.catsnis.dno.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "archives")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Archive {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeArchive type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CategorieArchive categorie;

    @Column(name = "file_name")
    private String fileName;

    // ⚠️ Conservé pour compatibilité/affichage, mais N'EST PLUS utilisé pour
    //    localiser le fichier réel (le disque Render free tier est éphémère).
    //    Le contenu réel est maintenant dans `data`.
    @Column(name = "file_path")
    private String filePath;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "mime_type")
    private String mimeType;

    // ✅ NOUVEAU — contenu binaire du fichier, stocké directement en base
    //    (MySQL LONGBLOB) pour survivre aux redéploiements sur l'instance
    //    Render free tier qui ne supporte pas les disques persistants.
    @Lob
    @Column(name = "data", columnDefinition = "LONGBLOB")
    private byte[] data;

    private String description;

    @Column(name = "archived_by")
    private String archivedBy;

    @Column(name = "archived_at")
    private LocalDateTime archivedAt;

    @Column(name = "related_id")
    private Long relatedId;

    @Column(name = "related_code")
    private String relatedCode;

    @PrePersist
    public void prePersist() {
        if (archivedAt == null) archivedAt = LocalDateTime.now();
    }

    public enum TypeArchive     { IMPRIME, SCANNE }
    public enum CategorieArchive { INTERVENTION, DEPLOIEMENT, ACQUISITION, BOOKLET, AUTRE, ACTIVE }
}