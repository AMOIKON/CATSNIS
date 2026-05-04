package com.catsnis.dno.repository;

import com.catsnis.dno.entity.Region;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RegionRepository extends JpaRepository<Region, Integer> {
    List<Region> findAllByOrderByRegionNameAsc();
    boolean existsByRegionName(String regionName);

    @Query("SELECT r FROM Region r WHERE " +
            "(:keyword IS NULL OR LOWER(r.regionName) LIKE LOWER(CONCAT('%',:keyword,'%')))")
    Page<Region> findAllWithFilters(Pageable pageable, @Param("keyword") String keyword);
}