package com.catsnis.dno.repository;

import com.catsnis.dno.entity.FournitureDeploiement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface FournitureDeploiementRepository extends JpaRepository<FournitureDeploiement, Integer> {

    @Query("""
        SELECT d FROM FournitureDeploiement d
        WHERE (:fournitureId IS NULL OR d.fourniture.id = :fournitureId)
          AND (:active       IS NULL OR d.active        = :active)
          AND (:keyword      IS NULL OR LOWER(d.fourniture.designation) LIKE LOWER(CONCAT('%',:keyword,'%'))
                                     OR LOWER(d.motif) LIKE LOWER(CONCAT('%',:keyword,'%')))
        ORDER BY d.dateDeploiement DESC
        """)
    Page<FournitureDeploiement> findAllWithFilters(
            Pageable pageable,
            @Param("fournitureId") Integer fournitureId,
            @Param("active")       Boolean active,
            @Param("keyword")      String  keyword
    );

    List<FournitureDeploiement> findByFournitureIdOrderByDateDeploiementDesc(Integer fournitureId);

    @Query("SELECT COALESCE(SUM(d.quantiteDeployee), 0) FROM FournitureDeploiement d WHERE d.active = true")
    long sumQuantiteDeployee();

    long countByActive(Boolean active);
}