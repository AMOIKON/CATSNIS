package com.catsnis.dno.repository;

import com.catsnis.dno.entity.Vehicule;
import com.catsnis.dno.entity.VehiculeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Date;
import java.util.List;

@Repository
public interface VehiculeRepository extends JpaRepository<Vehicule, Integer> {

    boolean existsByImmatriculation(String immatriculation);
    boolean existsByImmatriculationAndIdNot(String immatriculation, Integer id);

    @Query("SELECT v FROM Vehicule v WHERE " +
            "(:type IS NULL OR v.type = :type) AND " +
            "(:statut IS NULL OR v.statut = :statut) AND " +
            "(:regionId IS NULL OR v.region.id = :regionId) AND " +
            "(:districtId IS NULL OR v.district.id = :districtId) AND " +
            "(:keyword IS NULL OR LOWER(v.immatriculation) LIKE LOWER(CONCAT('%',:keyword,'%')) " +
            "OR LOWER(v.marque) LIKE LOWER(CONCAT('%',:keyword,'%')) " +
            "OR LOWER(v.modele) LIKE LOWER(CONCAT('%',:keyword,'%')))")
    Page<Vehicule> findAllWithFilters(Pageable pageable,
                                      @Param("type")       VehiculeType type,
                                      @Param("statut")     String statut,
                                      @Param("regionId")   Integer regionId,
                                      @Param("districtId") Integer districtId,
                                      @Param("keyword")    String keyword);

    @Query("SELECT v FROM Vehicule v WHERE v.dateFinAssurance IS NOT NULL AND v.dateFinAssurance <= :dateLimite")
    List<Vehicule> findAssurancesExpirees(@Param("dateLimite") Date dateLimite);

    @Query("SELECT v FROM Vehicule v WHERE v.dateFinVisiteTechnique IS NOT NULL AND v.dateFinVisiteTechnique <= :dateLimite")
    List<Vehicule> findVisitesTechniquesExpirees(@Param("dateLimite") Date dateLimite);

    @Query("SELECT v FROM Vehicule v WHERE v.dateFinVignette IS NOT NULL AND v.dateFinVignette <= :dateLimite")
    List<Vehicule> findVignettesExpirees(@Param("dateLimite") Date dateLimite);

    List<Vehicule> findByConducteurId(Integer conducteurId);
    List<Vehicule> findByRegionId(Integer regionId);
    List<Vehicule> findByDistrictId(Integer districtId);
}