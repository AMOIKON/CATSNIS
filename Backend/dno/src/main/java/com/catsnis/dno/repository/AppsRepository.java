package com.catsnis.dno.repository;

import com.catsnis.dno.entity.Apps;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AppsRepository extends JpaRepository<Apps, Integer> {
    List<Apps> findAllByOrderByAppNameAsc();
    boolean existsByAppName(String appName);

    @Query("SELECT a FROM Apps a WHERE " +
            "(:keyword IS NULL OR LOWER(a.appName) LIKE LOWER(CONCAT('%',:keyword,'%')))")
    Page<Apps> findAllWithFilters(Pageable pageable, @Param("keyword") String keyword);
}