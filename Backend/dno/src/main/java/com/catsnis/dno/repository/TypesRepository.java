package com.catsnis.dno.repository;

import com.catsnis.dno.entity.Types;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TypesRepository extends JpaRepository<Types, Integer> {
    List<Types> findAllByOrderByTypeNameAsc();
    boolean existsByTypeName(String typeName);

    @Query("SELECT t FROM Types t WHERE " +
            "(:keyword IS NULL OR LOWER(t.typeName) LIKE LOWER(CONCAT('%',:keyword,'%')))")
    Page<Types> findAllWithFilters(Pageable pageable, @Param("keyword") String keyword);
}