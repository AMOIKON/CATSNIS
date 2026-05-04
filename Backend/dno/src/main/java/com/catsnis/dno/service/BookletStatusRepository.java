package com.catsnis.dno.service;

import com.catsnis.dno.entity.BookletStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface BookletStatusRepository extends JpaRepository<BookletStatus, Long> {
    // Trouver un statut par son nom
    Optional<BookletStatus> findByStatusNameIgnoreCase(String statusName);

    // Vérifier si un statut existe
    boolean existsByStatusName(String statusName);
}
