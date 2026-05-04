package com.catsnis.dno.repository;


import com.catsnis.dno.entity.VehiculeDocumentHistorique;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository


public interface VehiculeDocumentHistoriqueRepository  extends JpaRepository<VehiculeDocumentHistorique, Long> {

    List<VehiculeDocumentHistorique> findByVehiculeIdOrderByDateRenouvellementDesc(Integer vehiculeId);
}
