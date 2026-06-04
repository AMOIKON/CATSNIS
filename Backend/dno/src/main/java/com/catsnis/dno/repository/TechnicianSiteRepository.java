package com.catsnis.dno.repository;

import com.catsnis.dno.entity.TechnicianSite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TechnicianSiteRepository extends JpaRepository<TechnicianSite, Long> {

    // Sites d'une personne (ordre chronologique inverse — plus récent en premier)
    List<TechnicianSite> findByPersonIdOrderByCreatedAtDesc(Integer personId);

    // Vérifier doublon site
    boolean existsByPersonIdAndHealthId(Integer personId, Integer healthId);

    // IDs utilitaires
    @Query("SELECT ts.health.id FROM TechnicianSite ts " +
            "WHERE ts.person.id = :personId AND ts.health IS NOT NULL")
    List<Integer> findHealthIdsByPersonId(@Param("personId") Integer personId);

    @Query("SELECT DISTINCT ts.district.id FROM TechnicianSite ts " +
            "WHERE ts.person.id = :personId AND ts.district IS NOT NULL")
    List<Integer> findDistrictIdsByPersonId(@Param("personId") Integer personId);

    @Query("SELECT DISTINCT ts.region.id FROM TechnicianSite ts " +
            "WHERE ts.person.id = :personId AND ts.region IS NOT NULL")
    List<Integer> findRegionIdsByPersonId(@Param("personId") Integer personId);
}