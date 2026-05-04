package com.catsnis.dno.repository;
import com.catsnis.dno.entity.Appreciation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
@Repository
public interface AppreciationRepository extends JpaRepository<Appreciation, Integer> {
    @Query("SELECT a FROM Appreciation a WHERE (:keyword IS NULL OR LOWER(a.appreciateName) LIKE LOWER(CONCAT('%',:keyword,'%')))")
    Page<Appreciation> findAllWithFilters(Pageable pageable, @Param("keyword") String keyword);
}