package com.catsnis.dno.repository;

import com.catsnis.dno.entity.Image;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ImageRepository extends JpaRepository<Image, Integer> {

    // ✅ Recherche par nom de fichier
    Optional<Image> findByFileName(String fileName);

    // ✅ AJOUT — utilisé par BookletPdfService
    Optional<Image> findFirstByLabelContainingIgnoreCase(String label);

    @Query("SELECT i FROM Image i WHERE " +
            "(:keyword IS NULL OR LOWER(i.label) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(i.fileName) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Image> findAllWithFilters(Pageable pageable, @Param("keyword") String keyword);
}