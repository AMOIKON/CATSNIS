package com.catsnis.dno.repository;

import com.catsnis.dno.entity.Evaluation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EvaluationRepository extends JpaRepository<Evaluation, Integer> {
    List<Evaluation> findAllByOrderByEvlNameAsc();

    @Query("SELECT e FROM Evaluation e WHERE " +
            "(:keyword IS NULL OR LOWER(e.evlName) LIKE LOWER(CONCAT('%',:keyword,'%')))")
    Page<Evaluation> findAllWithFilters(Pageable pageable, @Param("keyword") String keyword);
}