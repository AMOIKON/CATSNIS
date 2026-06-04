package com.catsnis.dno.repository;

import com.catsnis.dno.entity.Intervention;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface InterventionRepository extends JpaRepository<Intervention, Integer> {

    // ── Dashboard ─────────────────────────────────────────────────────────────

    List<Intervention> findTop5ByOrderByDateInterDesc();

    @Query("""
        SELECT i.typeInter, COUNT(i)
        FROM Intervention i
        GROUP BY i.typeInter
        """)
    List<Object[]> countGroupByType();

    @Query("""
        SELECT i.region.regionName, COUNT(i)
        FROM Intervention i
        WHERE (:regionId   IS NULL OR i.region.id   = :regionId)
          AND (:districtId IS NULL OR i.district.id = :districtId)
          AND (:healthId   IS NULL OR i.health.id   = :healthId)
        GROUP BY i.region.regionName
        ORDER BY COUNT(i) DESC
        """)
    List<Object[]> countGroupByRegion(
            @Param("regionId")   Integer regionId,
            @Param("districtId") Integer districtId,
            @Param("healthId")   Integer healthId);

    @Query("""
        SELECT YEAR(i.dateInter), MONTH(i.dateInter), COUNT(i)
        FROM Intervention i
        WHERE (YEAR(i.dateInter)  > :startYear
            OR (YEAR(i.dateInter) = :startYear
               AND MONTH(i.dateInter) >= :startMonth))
          AND (YEAR(i.dateInter)  < :endYear
            OR (YEAR(i.dateInter) = :endYear
               AND MONTH(i.dateInter) <= :endMonth))
        GROUP BY YEAR(i.dateInter), MONTH(i.dateInter)
        ORDER BY YEAR(i.dateInter), MONTH(i.dateInter)
        """)
    List<Object[]> countGroupByMonth(
            @Param("startYear")  int startYear,
            @Param("startMonth") int startMonth,
            @Param("endYear")    int endYear,
            @Param("endMonth")   int endMonth);

    // ── FIX suppression déploiement — délier avant DELETE ─────────────────────
    @Modifying
    @Transactional
    @Query(value = "UPDATE intervention SET deployment_id = NULL WHERE deployment_id = :deploymentId",
            nativeQuery = true)
    void unlinkFromDeployment(@Param("deploymentId") Integer deploymentId);

    // ── Liste paginée — SUPER_ADMIN / ITECH (tout voir) ──────────────────────
    // ✅ countQuery explicite — évite le bug Spring Data JPA avec ORDER BY
    @Query(
            value = """
            SELECT i FROM Intervention i
            WHERE (:regionId   IS NULL OR i.region.id   = :regionId)
              AND (:districtId IS NULL OR i.district.id = :districtId)
              AND (:healthId   IS NULL OR i.health.id   = :healthId)
              AND (:keyword    IS NULL
                   OR LOWER(i.codeInter) LIKE LOWER(CONCAT('%',:keyword,'%')))
              AND (:healthIds  IS NULL OR i.health.id IN :healthIds)
            ORDER BY i.id DESC
            """,
            countQuery = """
            SELECT COUNT(i) FROM Intervention i
            WHERE (:regionId   IS NULL OR i.region.id   = :regionId)
              AND (:districtId IS NULL OR i.district.id = :districtId)
              AND (:healthId   IS NULL OR i.health.id   = :healthId)
              AND (:keyword    IS NULL
                   OR LOWER(i.codeInter) LIKE LOWER(CONCAT('%',:keyword,'%')))
              AND (:healthIds  IS NULL OR i.health.id IN :healthIds)
            """
    )
    Page<Intervention> findAllWithFilters(
            Pageable       pageable,
            @Param("regionId")   Integer       regionId,
            @Param("districtId") Integer       districtId,
            @Param("healthId")   Integer       healthId,
            @Param("keyword")    String        keyword,
            @Param("healthIds")  List<Integer> healthIds);

    // ── Liste paginée — partner IS NULL ───────────────────────────────────────
    @Query(
            value = """
            SELECT i FROM Intervention i
            WHERE (:regionId   IS NULL OR i.region.id   = :regionId)
              AND (:districtId IS NULL OR i.district.id = :districtId)
              AND (:healthId   IS NULL OR i.health.id   = :healthId)
              AND (:keyword    IS NULL
                   OR LOWER(i.codeInter) LIKE LOWER(CONCAT('%',:keyword,'%')))
              AND (:healthIds  IS NULL OR i.health.id IN :healthIds)
              AND i.partner IS NULL
            ORDER BY i.id DESC
            """,
            countQuery = """
            SELECT COUNT(i) FROM Intervention i
            WHERE (:regionId   IS NULL OR i.region.id   = :regionId)
              AND (:districtId IS NULL OR i.district.id = :districtId)
              AND (:healthId   IS NULL OR i.health.id   = :healthId)
              AND (:keyword    IS NULL
                   OR LOWER(i.codeInter) LIKE LOWER(CONCAT('%',:keyword,'%')))
              AND (:healthIds  IS NULL OR i.health.id IN :healthIds)
              AND i.partner IS NULL
            """
    )
    Page<Intervention> findAllWithFiltersAndPartnerNull(
            Pageable       pageable,
            @Param("regionId")   Integer       regionId,
            @Param("districtId") Integer       districtId,
            @Param("healthId")   Integer       healthId,
            @Param("keyword")    String        keyword,
            @Param("healthIds")  List<Integer> healthIds);

    // ── Liste paginée — partner.id = :partnerId ───────────────────────────────
    @Query(
            value = """
            SELECT i FROM Intervention i
            WHERE (:regionId   IS NULL OR i.region.id   = :regionId)
              AND (:districtId IS NULL OR i.district.id = :districtId)
              AND (:healthId   IS NULL OR i.health.id   = :healthId)
              AND (:keyword    IS NULL
                   OR LOWER(i.codeInter) LIKE LOWER(CONCAT('%',:keyword,'%')))
              AND (:healthIds  IS NULL OR i.health.id IN :healthIds)
              AND i.partner.id = :partnerId
            ORDER BY i.id DESC
            """,
            countQuery = """
            SELECT COUNT(i) FROM Intervention i
            WHERE (:regionId   IS NULL OR i.region.id   = :regionId)
              AND (:districtId IS NULL OR i.district.id = :districtId)
              AND (:healthId   IS NULL OR i.health.id   = :healthId)
              AND (:keyword    IS NULL
                   OR LOWER(i.codeInter) LIKE LOWER(CONCAT('%',:keyword,'%')))
              AND (:healthIds  IS NULL OR i.health.id IN :healthIds)
              AND i.partner.id = :partnerId
            """
    )
    Page<Intervention> findAllWithFiltersAndPartner(
            Pageable       pageable,
            @Param("regionId")   Integer       regionId,
            @Param("districtId") Integer       districtId,
            @Param("healthId")   Integer       healthId,
            @Param("keyword")    String        keyword,
            @Param("healthIds")  List<Integer> healthIds,
            @Param("partnerId")  Long          partnerId);

    // ── Stats durée — sans filtre ─────────────────────────────────────────────
    @Query("SELECT COALESCE(SUM(i.durationMinutes), 0) FROM Intervention i WHERE i.typeInter = :type")
    Long sumDurationByType(@Param("type") String type);

    @Query("SELECT COALESCE(SUM(i.durationMinutes), 0) FROM Intervention i WHERE i.typeInter = :type AND i.health.id IN :healthIds")
    Long sumDurationByTypeAndSites(
            @Param("type")      String        type,
            @Param("healthIds") List<Integer> healthIds);

    @Query("SELECT COALESCE(SUM(i.durationMinutes), 0) FROM Intervention i")
    Long sumDurationTotal();

    @Query("SELECT COALESCE(SUM(i.durationMinutes), 0) FROM Intervention i WHERE i.health.id IN :healthIds")
    Long sumDurationTotalBySites(@Param("healthIds") List<Integer> healthIds);

    // ── Stats durée — partner IS NULL ─────────────────────────────────────────
    @Query("SELECT COALESCE(SUM(i.durationMinutes), 0) FROM Intervention i WHERE i.typeInter = :type AND i.partner IS NULL")
    Long sumDurationByTypeAndPartnerNull(@Param("type") String type);

    @Query("SELECT COALESCE(SUM(i.durationMinutes), 0) FROM Intervention i WHERE i.partner IS NULL")
    Long sumDurationTotalByPartnerNull();

    // ── Stats durée — partner.id = :partnerId ─────────────────────────────────
    @Query("SELECT COALESCE(SUM(i.durationMinutes), 0) FROM Intervention i WHERE i.typeInter = :type AND i.partner.id = :partnerId")
    Long sumDurationByTypeAndPartner(
            @Param("type")      String type,
            @Param("partnerId") Long   partnerId);

    @Query("SELECT COALESCE(SUM(i.durationMinutes), 0) FROM Intervention i WHERE i.partner.id = :partnerId")
    Long sumDurationTotalByPartner(@Param("partnerId") Long partnerId);
}