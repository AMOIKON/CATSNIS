package com.catsnis.dno.repository;

import com.catsnis.dno.entity.Deployment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DeploymentRepository extends JpaRepository<Deployment, Integer> {

    @Query("SELECT d FROM Deployment d WHERE " +
            "(:regionId IS NULL OR d.region.id = :regionId) AND " +
            "(:districtId IS NULL OR d.district.id = :districtId) AND " +
            "(:healthId IS NULL OR d.health.id = :healthId) AND " +
            "(:keyword IS NULL OR LOWER(d.codeDep) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "ORDER BY d.dateRecep DESC")
    Page<Deployment> findAllWithFilters(
            Pageable pageable,
            @Param("regionId")   Integer regionId,
            @Param("districtId") Integer districtId,
            @Param("healthId")   Integer healthId,
            @Param("keyword")    String keyword);

    @Query("SELECT d FROM Deployment d WHERE " +
            "(:healthIds IS NULL OR d.health.id IN :healthIds) AND " +
            "(:regionId IS NULL OR d.region.id = :regionId) AND " +
            "(:districtId IS NULL OR d.district.id = :districtId) AND " +
            "(:healthId IS NULL OR d.health.id = :healthId) AND " +
            "(:keyword IS NULL OR LOWER(d.codeDep) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "ORDER BY d.dateRecep DESC")
    Page<Deployment> findAllWithHealthFilter(
            Pageable pageable,
            @Param("healthIds")  List<Integer> healthIds,
            @Param("regionId")   Integer regionId,
            @Param("districtId") Integer districtId,
            @Param("healthId")   Integer healthId,
            @Param("keyword")    String keyword);

    @Query("SELECT d FROM Deployment d WHERE d.health.id = :healthId ORDER BY d.dateRecep DESC")
    List<Deployment> findByHealthId(@Param("healthId") Integer healthId);

    // ── Dashboard — déploiements par région avec filtres ✅ ───────────────────
    @Query("SELECT r.regionName, COUNT(d) FROM Deployment d JOIN d.region r " +
            "WHERE (:regionId IS NULL OR d.region.id = :regionId) " +
            "AND (:districtId IS NULL OR d.district.id = :districtId) " +
            "AND (:healthId IS NULL OR d.health.id = :healthId) " +
            "GROUP BY r.regionName ORDER BY COUNT(d) DESC")
    List<Object[]> countGroupByRegion(
            @Param("regionId")   Integer regionId,
            @Param("districtId") Integer districtId,
            @Param("healthId")   Integer healthId);

    List<Deployment> findTop5ByOrderByDateRecepDesc();
}