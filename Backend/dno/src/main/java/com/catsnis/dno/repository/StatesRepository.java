package com.catsnis.dno.repository;
import com.catsnis.dno.entity.States;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
@Repository
public interface StatesRepository extends JpaRepository<States, Integer> {
    @Query("SELECT s FROM States s WHERE (:keyword IS NULL OR LOWER(s.statesName) LIKE LOWER(CONCAT('%',:keyword,'%')))")
    Page<States> findAllWithFilters(Pageable pageable, @Param("keyword") String keyword);
}