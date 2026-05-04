package com.catsnis.dno.repository;

import com.catsnis.dno.entity.VehiculeIncident;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface VehiculeIncidentRepository extends JpaRepository<VehiculeIncident, Integer> {

    @Query("SELECT i FROM VehiculeIncident i WHERE " +
            "(:vehiculeId IS NULL OR i.vehicule.id = :vehiculeId) AND " +
            "(:statut IS NULL OR i.statut = :statut) AND " +
            "(:keyword IS NULL OR LOWER(i.description) LIKE LOWER(CONCAT('%',:keyword,'%')))")
    Page<VehiculeIncident> findAllWithFilters(Pageable pageable,
                                              @Param("vehiculeId") Integer vehiculeId,
                                              @Param("statut")     String statut,
                                              @Param("keyword")    String keyword);
}