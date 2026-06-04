package com.catsnis.dno.repository;

import com.catsnis.dno.entity.Deployment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DeploymentRepository extends JpaRepository<Deployment, Integer> {

    // ── Simple ────────────────────────────────────────────────────────────────
    List<Deployment> findByHealthId(Integer healthId);

    // ── Dashboard ─────────────────────────────────────────────────────────────
    List<Deployment> findTop5ByOrderByDateRecepDesc();

    @Query("""
        SELECT d.region.regionName, COUNT(d)
        FROM Deployment d
        WHERE (:regionId   IS NULL OR d.region.id   = :regionId)
          AND (:districtId IS NULL OR d.district.id = :districtId)
          AND (:healthId   IS NULL OR d.health.id   = :healthId)
        GROUP BY d.region.regionName
        ORDER BY COUNT(d) DESC
        """)
    List<Object[]> countGroupByRegion(
            @Param("regionId")   Integer regionId,
            @Param("districtId") Integer districtId,
            @Param("healthId")   Integer healthId);

    // ── FIX removeItem — charge items en JOIN FETCH ───────────────────────────
    @Query("""
        SELECT d FROM Deployment d
        LEFT JOIN FETCH d.items i
        LEFT JOIN FETCH i.acquisition a
        LEFT JOIN FETCH a.types
        WHERE d.id = :id
        """)
    Optional<Deployment> findByIdWithItems(@Param("id") Integer id);

    // ── Sans filtre partenaire (SUPER_ADMIN / ITECH) ──────────────────────────
    // ✅ countQuery explicite — évite le bug Spring Data JPA avec ORDER BY
    @Query(
            value = """
            SELECT d FROM Deployment d
            WHERE (:regionId   IS NULL OR d.region.id   = :regionId)
              AND (:districtId IS NULL OR d.district.id = :districtId)
              AND (:healthId   IS NULL OR d.health.id   = :healthId)
              AND (:keyword    IS NULL
                   OR LOWER(d.codeDep) LIKE LOWER(CONCAT('%',:keyword,'%')))
            ORDER BY d.id DESC
            """,
            countQuery = """
            SELECT COUNT(d) FROM Deployment d
            WHERE (:regionId   IS NULL OR d.region.id   = :regionId)
              AND (:districtId IS NULL OR d.district.id = :districtId)
              AND (:healthId   IS NULL OR d.health.id   = :healthId)
              AND (:keyword    IS NULL
                   OR LOWER(d.codeDep) LIKE LOWER(CONCAT('%',:keyword,'%')))
            """
    )
    Page<Deployment> findAllWithFilters(
            Pageable pageable,
            @Param("regionId")   Integer regionId,
            @Param("districtId") Integer districtId,
            @Param("healthId")   Integer healthId,
            @Param("keyword")    String  keyword);

    // ── Partenaire IS NULL ────────────────────────────────────────────────────
    @Query(
            value = """
            SELECT d FROM Deployment d
            WHERE (:regionId   IS NULL OR d.region.id   = :regionId)
              AND (:districtId IS NULL OR d.district.id = :districtId)
              AND (:healthId   IS NULL OR d.health.id   = :healthId)
              AND (:keyword    IS NULL
                   OR LOWER(d.codeDep) LIKE LOWER(CONCAT('%',:keyword,'%')))
              AND d.partner IS NULL
            ORDER BY d.id DESC
            """,
            countQuery = """
            SELECT COUNT(d) FROM Deployment d
            WHERE (:regionId   IS NULL OR d.region.id   = :regionId)
              AND (:districtId IS NULL OR d.district.id = :districtId)
              AND (:healthId   IS NULL OR d.health.id   = :healthId)
              AND (:keyword    IS NULL
                   OR LOWER(d.codeDep) LIKE LOWER(CONCAT('%',:keyword,'%')))
              AND d.partner IS NULL
            """
    )
    Page<Deployment> findAllWithFiltersAndPartnerNull(
            Pageable pageable,
            @Param("regionId")   Integer regionId,
            @Param("districtId") Integer districtId,
            @Param("healthId")   Integer healthId,
            @Param("keyword")    String  keyword);

    // ── Partenaire spécifique ─────────────────────────────────────────────────
    @Query(
            value = """
            SELECT d FROM Deployment d
            WHERE (:regionId   IS NULL OR d.region.id   = :regionId)
              AND (:districtId IS NULL OR d.district.id = :districtId)
              AND (:healthId   IS NULL OR d.health.id   = :healthId)
              AND (:keyword    IS NULL
                   OR LOWER(d.codeDep) LIKE LOWER(CONCAT('%',:keyword,'%')))
              AND d.partner.id = :partnerId
            ORDER BY d.id DESC
            """,
            countQuery = """
            SELECT COUNT(d) FROM Deployment d
            WHERE (:regionId   IS NULL OR d.region.id   = :regionId)
              AND (:districtId IS NULL OR d.district.id = :districtId)
              AND (:healthId   IS NULL OR d.health.id   = :healthId)
              AND (:keyword    IS NULL
                   OR LOWER(d.codeDep) LIKE LOWER(CONCAT('%',:keyword,'%')))
              AND d.partner.id = :partnerId
            """
    )
    Page<Deployment> findAllWithFiltersAndPartner(
            Pageable pageable,
            @Param("regionId")   Integer regionId,
            @Param("districtId") Integer districtId,
            @Param("healthId")   Integer healthId,
            @Param("keyword")    String  keyword,
            @Param("partnerId")  Long    partnerId);

    // ── Sites technicien + partenaire IS NULL ─────────────────────────────────
    @Query(
            value = """
            SELECT d FROM Deployment d
            WHERE d.health.id IN :healthIds
              AND (:regionId   IS NULL OR d.region.id   = :regionId)
              AND (:districtId IS NULL OR d.district.id = :districtId)
              AND (:healthId   IS NULL OR d.health.id   = :healthId)
              AND (:keyword    IS NULL
                   OR LOWER(d.codeDep) LIKE LOWER(CONCAT('%',:keyword,'%')))
              AND d.partner IS NULL
            ORDER BY d.id DESC
            """,
            countQuery = """
            SELECT COUNT(d) FROM Deployment d
            WHERE d.health.id IN :healthIds
              AND (:regionId   IS NULL OR d.region.id   = :regionId)
              AND (:districtId IS NULL OR d.district.id = :districtId)
              AND (:healthId   IS NULL OR d.health.id   = :healthId)
              AND (:keyword    IS NULL
                   OR LOWER(d.codeDep) LIKE LOWER(CONCAT('%',:keyword,'%')))
              AND d.partner IS NULL
            """
    )
    Page<Deployment> findAllWithHealthFilterAndPartnerNull(
            Pageable      pageable,
            @Param("healthIds")   List<Integer> healthIds,
            @Param("regionId")    Integer       regionId,
            @Param("districtId")  Integer       districtId,
            @Param("healthId")    Integer       healthId,
            @Param("keyword")     String        keyword);

    // ── Sites technicien + partenaire spécifique ──────────────────────────────
    @Query(
            value = """
            SELECT d FROM Deployment d
            WHERE d.health.id IN :healthIds
              AND (:regionId   IS NULL OR d.region.id   = :regionId)
              AND (:districtId IS NULL OR d.district.id = :districtId)
              AND (:healthId   IS NULL OR d.health.id   = :healthId)
              AND (:keyword    IS NULL
                   OR LOWER(d.codeDep) LIKE LOWER(CONCAT('%',:keyword,'%')))
              AND d.partner.id = :partnerId
            ORDER BY d.id DESC
            """,
            countQuery = """
            SELECT COUNT(d) FROM Deployment d
            WHERE d.health.id IN :healthIds
              AND (:regionId   IS NULL OR d.region.id   = :regionId)
              AND (:districtId IS NULL OR d.district.id = :districtId)
              AND (:healthId   IS NULL OR d.health.id   = :healthId)
              AND (:keyword    IS NULL
                   OR LOWER(d.codeDep) LIKE LOWER(CONCAT('%',:keyword,'%')))
              AND d.partner.id = :partnerId
            """
    )
    Page<Deployment> findAllWithHealthFilterAndPartner(
            Pageable      pageable,
            @Param("healthIds")   List<Integer> healthIds,
            @Param("regionId")    Integer       regionId,
            @Param("districtId")  Integer       districtId,
            @Param("healthId")    Integer       healthId,
            @Param("keyword")     String        keyword,
            @Param("partnerId")   Long          partnerId);
}