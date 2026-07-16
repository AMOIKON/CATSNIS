package com.catsnis.dno.repository;

import com.catsnis.dno.entity.Acquisition;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AcquisitionRepository extends JpaRepository<Acquisition, Long> {

    boolean existsByTag(String tag);
    boolean existsBySerial(String serial);
    boolean existsByTagAndIdNot(String tag, Long id);
    boolean existsBySerialAndIdNot(String serial, Long id);

    // ✅ Méthode conservée — utilisée par DashboardServiceImpl
    @Query("SELECT COUNT(a) FROM Acquisition a WHERE a.deployed = false AND a.status = 'DISPONIBLE'")
    long countStock();

    List<Acquisition> findByStatus(String status);

    // ── Sans filtre partenaire (SUPER_ADMIN / ITECH) ──────────────────────────
    // ✅ status ajouté — filtre optionnel (ex : "HORS_BASE" pour la vue de suivi)
    @Query("""
        SELECT a FROM Acquisition a
        WHERE (:typesId IS NULL OR a.types.id = :typesId)
          AND (:status  IS NULL OR a.status = :status)
          AND (:keyword  IS NULL
               OR LOWER(a.tag)    LIKE LOWER(CONCAT('%',:keyword,'%'))
               OR LOWER(a.serial) LIKE LOWER(CONCAT('%',:keyword,'%')))
        ORDER BY a.id DESC
        """)
    Page<Acquisition> findAllWithFilters(
            Pageable pageable,
            @Param("typesId") Integer typesId,
            @Param("status")  String  status,
            @Param("keyword") String keyword);

    // ── Filtré par partenaire spécifique ─────────────────────────────────────
    @Query("""
        SELECT a FROM Acquisition a
        WHERE (:typesId IS NULL OR a.types.id = :typesId)
          AND (:status  IS NULL OR a.status = :status)
          AND a.partner.id = :partnerId
          AND (:keyword  IS NULL
               OR LOWER(a.tag)    LIKE LOWER(CONCAT('%',:keyword,'%'))
               OR LOWER(a.serial) LIKE LOWER(CONCAT('%',:keyword,'%')))
        ORDER BY a.id DESC
        """)
    Page<Acquisition> findAllWithFiltersAndPartner(
            Pageable pageable,
            @Param("typesId")   Integer typesId,
            @Param("status")    String  status,
            @Param("keyword")   String  keyword,
            @Param("partnerId") Long    partnerId);

    // ── Filtré sur IS NULL ────────────────────────────────────────────────────
    @Query("""
        SELECT a FROM Acquisition a
        WHERE (:typesId IS NULL OR a.types.id = :typesId)
          AND (:status  IS NULL OR a.status = :status)
          AND a.partner IS NULL
          AND (:keyword  IS NULL
               OR LOWER(a.tag)    LIKE LOWER(CONCAT('%',:keyword,'%'))
               OR LOWER(a.serial) LIKE LOWER(CONCAT('%',:keyword,'%')))
        ORDER BY a.id DESC
        """)
    Page<Acquisition> findAllWithFiltersAndPartnerNull(
            Pageable pageable,
            @Param("typesId") Integer typesId,
            @Param("status")  String  status,
            @Param("keyword") String  keyword);

    // ── Disponibles ───────────────────────────────────────────────────────────
    @Query("""
        SELECT a FROM Acquisition a
        WHERE a.deployed = false AND a.status = 'DISPONIBLE'
          AND (:typesId IS NULL OR a.types.id = :typesId)
        """)
    List<Acquisition> findAvailable(@Param("typesId") Integer typesId);

    @Query("""
        SELECT a FROM Acquisition a
        WHERE a.deployed = false AND a.status = 'DISPONIBLE'
          AND (:typesId IS NULL OR a.types.id = :typesId)
          AND a.partner.id = :partnerId
        """)
    List<Acquisition> findAvailableByPartner(
            @Param("typesId")   Integer typesId,
            @Param("partnerId") Long    partnerId);

    @Query("""
        SELECT a FROM Acquisition a
        WHERE a.deployed = false AND a.status = 'DISPONIBLE'
          AND (:typesId IS NULL OR a.types.id = :typesId)
          AND a.partner IS NULL
        """)
    List<Acquisition> findAvailableAndPartnerNull(@Param("typesId") Integer typesId);

    // ✅ Compteur dédié pour la vue de suivi des équipements hors base
    long countByStatus(String status);
}