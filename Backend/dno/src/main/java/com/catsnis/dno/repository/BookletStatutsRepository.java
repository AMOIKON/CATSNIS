package com.catsnis.dno.repository;
import java.util.Optional;
import com.catsnis.dno.entity.BookletStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookletStatutsRepository  extends JpaRepository<BookletStatus, Long> {

    // Trouver un statut par son nom
    Optional <BookletStatus> findByStatusNameIgnoreCase(String statusName);

    // Vérifier si un statut existe
    boolean existsByStatusName(String statusName);
}
