package com.catsnis.dno.repository;

import com.catsnis.dno.entity.Fourniture;
import com.catsnis.dno.entity.Fourniture.FournitureCategorie;
import com.catsnis.dno.entity.Fourniture.FournitureStatut;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface FournitureRepository extends JpaRepository<Fourniture, Integer> {

    boolean existsByCode(String code);

    Optional<Fourniture> findByCode(String code);

    @Query("""
        SELECT f FROM Fourniture f
        WHERE (:categorie IS NULL OR f.categorie = :categorie)
          AND (:statut    IS NULL OR f.statut    = :statut)
          AND (:keyword   IS NULL OR LOWER(f.designation) LIKE LOWER(CONCAT('%',:keyword,'%'))
                                  OR LOWER(f.code)        LIKE LOWER(CONCAT('%',:keyword,'%')))
        ORDER BY f.designation ASC
        """)
    Page<Fourniture> findAllWithFilters(
            Pageable pageable,
            @Param("categorie") FournitureCategorie categorie,
            @Param("statut")    FournitureStatut    statut,
            @Param("keyword")   String              keyword
    );

    long countByStatut(FournitureStatut statut);
    long countByCategorie(FournitureCategorie categorie);

    @Query("SELECT COALESCE(SUM(f.quantite), 0) FROM Fourniture f")
    long sumQuantite();

    @Query("SELECT COALESCE(SUM(f.quantiteDisponible), 0) FROM Fourniture f")
    long sumQuantiteDisponible();

    List<Fourniture> findByStatut(FournitureStatut statut);
}