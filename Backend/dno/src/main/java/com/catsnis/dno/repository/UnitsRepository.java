package com.catsnis.dno.repository;

import com.catsnis.dno.entity.Units;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UnitsRepository extends JpaRepository<Units, Integer> {
    List<Units> findAllByOrderByUnitNameAsc();
    boolean existsByUnitName(String unitName);
    boolean existsByUnitNameAndIdNot(String unitName, Integer id);

    @Query("SELECT u FROM Units u WHERE " +
            "(:keyword IS NULL OR LOWER(u.unitName) LIKE LOWER(CONCAT('%',:keyword,'%')))")
    Page<Units> findAllWithFilters(Pageable pageable, @Param("keyword") String keyword);
}