package com.catsnis.dno.repository;

import com.catsnis.dno.entity.TechnicianSite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TechnicianSiteRepository extends JpaRepository<TechnicianSite, Long> {

    // ── Lister les sites d'un technicien ──────────────────────────────────────
    // Spring Data JPA résout automatiquement person.id → personId
    List<TechnicianSite> findByPersonId(Integer personId);

    // ── Anti-doublon avant assignation ────────────────────────────────────────
    // Résout : person.id ET health.id
    boolean existsByPersonIdAndHealthId(Integer personId, Integer healthId);

    // ── IDs pour filtrage frontend / dashboard ────────────────────────────────
    @Query("SELECT ts.health.id FROM TechnicianSite ts " +
            "WHERE ts.person.id = :personId AND ts.health IS NOT NULL")
    List<Integer> findHealthIdsByPersonId(@Param("personId") Integer personId);

    @Query("SELECT DISTINCT ts.region.id FROM TechnicianSite ts " +
            "WHERE ts.person.id = :personId AND ts.region IS NOT NULL")
    List<Integer> findRegionIdsByPersonId(@Param("personId") Integer personId);

    @Query("SELECT DISTINCT ts.district.id FROM TechnicianSite ts " +
            "WHERE ts.person.id = :personId AND ts.district IS NOT NULL")
    List<Integer> findDistrictIdsByPersonId(@Param("personId") Integer personId);
}