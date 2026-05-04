package com.catsnis.dno.repository;

import com.catsnis.dno.entity.District;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DistrictRepository extends JpaRepository<District, Integer> {
    List<District> findByRegionIdOrderByDistrictNameAsc(Integer regionId);
    boolean existsByDistrictName(String districtName);

    @Query("SELECT d FROM District d WHERE " +
            "(:regionId IS NULL OR d.region.id = :regionId) AND " +
            "(:keyword IS NULL OR LOWER(d.districtName) LIKE LOWER(CONCAT('%',:keyword,'%')))")
    Page<District> findAllWithFilters(Pageable pageable,
                                      @Param("regionId") Integer regionId,
                                      @Param("keyword")  String keyword);
}