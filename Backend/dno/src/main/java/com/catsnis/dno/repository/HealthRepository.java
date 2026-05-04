package com.catsnis.dno.repository;
import com.catsnis.dno.entity.Health;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface HealthRepository extends JpaRepository<Health, Integer> {
    List<Health> findByDistrictIdOrderByHealthNameAsc(Integer districtId);
    List<Health> findByRegionIdOrderByHealthNameAsc(Integer regionId);

    @Query("SELECT h FROM Health h WHERE " +
            "(:districtId IS NULL OR h.district.id = :districtId) AND " +
            "(:regionId IS NULL OR h.region.id = :regionId) AND " +
            "(:keyword IS NULL OR LOWER(h.healthName) LIKE LOWER(CONCAT('%',:keyword,'%')))")
    Page<Health> findAllWithFilters(Pageable pageable,
                                    @Param("districtId") Integer districtId,
                                    @Param("regionId")   Integer regionId,
                                    @Param("keyword")    String keyword);
}