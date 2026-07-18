package com.catsnis.dno.repository;

import com.catsnis.dno.entity.Archive;
import com.catsnis.dno.entity.Archive.TypeArchive;
import com.catsnis.dno.entity.Archive.CategorieArchive;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ArchiveRepository extends JpaRepository<Archive, Long> {

    @Query("""
        SELECT a FROM Archive a
        WHERE (:type IS NULL OR a.type = :type)
          AND (:categorie IS NULL OR a.categorie = :categorie)
          AND (:keyword IS NULL OR LOWER(a.titre) LIKE LOWER(CONCAT('%',:keyword,'%'))
               OR LOWER(a.relatedCode) LIKE LOWER(CONCAT('%',:keyword,'%')))
        ORDER BY a.archivedAt DESC
    """)
    Page<Archive> search(
            @Param("type")      TypeArchive      type,
            @Param("categorie") CategorieArchive categorie,
            @Param("keyword")   String           keyword,
            Pageable            pageable
    );

    long countByType(TypeArchive type);
    long countByCategorie(CategorieArchive categorie);

    // ✅ NOUVEAU — permet de retrouver l'archive PDF déjà générée pour une
    //    intervention/déploiement donnée, afin d'éviter les doublons à chaque
    //    nouveau téléchargement (archiverPdfGenere fait un update au lieu
    //    d'un insert si une archive existe déjà pour ce relatedId+categorie+type).
    Optional<Archive> findFirstByRelatedIdAndCategorieAndType(
            Long relatedId, CategorieArchive categorie, TypeArchive type);
}