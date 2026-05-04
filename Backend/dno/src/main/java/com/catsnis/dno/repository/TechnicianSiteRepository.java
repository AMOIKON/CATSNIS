package com.catsnis.dno.repository;

import com.catsnis.dno.entity.TechnicianSite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TechnicianSiteRepository extends JpaRepository<TechnicianSite, Integer> {
    List<TechnicianSite> findByPersonId(Integer personId);
    boolean existsByPersonIdAndHealthId(Integer personId, Integer healthId);

    @Query("SELECT ts.health.id FROM TechnicianSite ts WHERE ts.person.id = :personId AND ts.health IS NOT NULL")
    List<Integer> findHealthIdsByPersonId(@Param("personId") Integer personId);

    @Query("SELECT ts.district.id FROM TechnicianSite ts WHERE ts.person.id = :personId AND ts.district IS NOT NULL")
    List<Integer> findDistrictIdsByPersonId(@Param("personId") Integer personId);

    @Query("SELECT ts.region.id FROM TechnicianSite ts WHERE ts.person.id = :personId AND ts.region IS NOT NULL")
    List<Integer> findRegionIdsByPersonId(@Param("personId") Integer personId);
}