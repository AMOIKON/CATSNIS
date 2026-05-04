package com.catsnis.dno.repository;

import com.catsnis.dno.entity.VehiculeAffectation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface VehiculeAffectationRepository extends JpaRepository<VehiculeAffectation, Long> {

    // Affectation active courante d'un véhicule
    Optional<VehiculeAffectation> findByVehiculeIdAndActiveTrue(Integer vehiculeId);

    // Historique complet d'un véhicule
    Page<VehiculeAffectation> findByVehiculeIdOrderByDateAffectationDesc(Integer vehiculeId, Pageable pageable);

    // Toutes les affectations avec filtres
    @Query("SELECT a FROM VehiculeAffectation a WHERE " +
            "(:vehiculeId IS NULL OR a.vehicule.id = :vehiculeId) AND " +
            "(:personId   IS NULL OR a.person.id   = :personId)   AND " +
            "(:active     IS NULL OR a.active       = :active)")
    Page<VehiculeAffectation> findAllWithFilters(Pageable pageable,
                                                 @Param("vehiculeId") Integer vehiculeId,
                                                 @Param("personId")   Integer personId,
                                                 @Param("active")     Boolean active);

    // Désactiver toutes les affectations actives d'un véhicule
    @Modifying
    @Query("UPDATE VehiculeAffectation a SET a.active = false, a.dateRetour = CURRENT_DATE " +
            "WHERE a.vehicule.id = :vehiculeId AND a.active = true")
    void deactivateByVehiculeId(@Param("vehiculeId") Integer vehiculeId);
}