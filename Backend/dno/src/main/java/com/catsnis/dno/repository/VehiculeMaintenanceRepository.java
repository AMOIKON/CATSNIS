package com.catsnis.dno.repository;

import com.catsnis.dno.entity.VehiculeMaintenance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface VehiculeMaintenanceRepository extends JpaRepository<VehiculeMaintenance, Integer> {

    @Query("SELECT m FROM VehiculeMaintenance m WHERE " +
            "(:vehiculeId IS NULL OR m.vehicule.id = :vehiculeId) AND " +
            "(:statut IS NULL OR m.statut = :statut) AND " +
            "(:keyword IS NULL OR LOWER(m.description) LIKE LOWER(CONCAT('%',:keyword,'%')))")
    Page<VehiculeMaintenance> findAllWithFilters(Pageable pageable,
                                                 @Param("vehiculeId") Integer vehiculeId,
                                                 @Param("statut")     String statut,
                                                 @Param("keyword")    String keyword);
}