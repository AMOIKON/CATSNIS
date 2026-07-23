package com.catsnis.dno.repository;

import com.catsnis.dno.entity.StructureEtatique;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StructureEtatiqueRepository extends JpaRepository<StructureEtatique, Long> {

    List<StructureEtatique> findAllByOrderByNomAsc();

    Optional<StructureEtatique> findFirstByNomIgnoreCase(String nom);
}