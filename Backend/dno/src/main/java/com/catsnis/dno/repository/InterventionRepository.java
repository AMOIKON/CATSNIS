package com.catsnis.dno.repository;
import com.catsnis.dno.entity.Intervention;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface InterventionRepository extends JpaRepository<Intervention, Integer> {

    @Query("SELECT i FROM Intervention i WHERE " +
            "(:regionId IS NULL OR i.region.id = :regionId) AND " +
            "(:districtId IS NULL OR i.district.id = :districtId) AND " +
            "(:healthId IS NULL OR i.health.id = :healthId) AND " +
            "(:keyword IS NULL OR LOWER(i.codeInter) LIKE LOWER(CONCAT('%',:keyword,'%'))) AND " +
            "(:healthIds IS NULL OR i.health.id IN :healthIds)")
    Page<Intervention> findAllWithFilters(Pageable pageable,
                                          @Param("regionId")   Integer regionId,
                                          @Param("districtId") Integer districtId,
                                          @Param("healthId")   Integer healthId,
                                          @Param("keyword")    String  keyword,
                                          @Param("healthIds")  List<Integer> healthIds);

    @Query("SELECT i.region.regionName, COUNT(i) FROM Intervention i " +
            "WHERE (:regionId IS NULL OR i.region.id = :regionId) " +
            "AND (:districtId IS NULL OR i.district.id = :districtId) " +
            "AND (:healthId IS NULL OR i.health.id = :healthId) " +
            "GROUP BY i.region.regionName ORDER BY COUNT(i) DESC")
    List<Object[]> countGroupByRegion(
            @Param("regionId")   Integer regionId,
            @Param("districtId") Integer districtId,
            @Param("healthId")   Integer healthId);

    @Query("SELECT i.typeInter, COUNT(i) FROM Intervention i GROUP BY i.typeInter")
    List<Object[]> countGroupByType();

    @Query("SELECT YEAR(i.dateInter), MONTH(i.dateInter), COUNT(i) FROM Intervention i " +
            "WHERE (YEAR(i.dateInter) > :startYear OR (YEAR(i.dateInter) = :startYear AND MONTH(i.dateInter) >= :startMonth)) " +
            "AND (YEAR(i.dateInter) < :endYear OR (YEAR(i.dateInter) = :endYear AND MONTH(i.dateInter) <= :endMonth)) " +
            "GROUP BY YEAR(i.dateInter), MONTH(i.dateInter)")
    List<Object[]> countGroupByMonth(
            @Param("startYear")  int startYear,
            @Param("startMonth") int startMonth,
            @Param("endYear")    int endYear,
            @Param("endMonth")   int endMonth);

    List<Intervention> findTop5ByOrderByDateInterDesc();

    @Query("SELECT SUM(i.durationMinutes) FROM Intervention i WHERE i.typeInter = :type")
    Long sumDurationByType(@Param("type") String type);

    @Query("SELECT SUM(i.durationMinutes) FROM Intervention i WHERE i.typeInter = :type AND i.health.id IN :healthIds")
    Long sumDurationByTypeAndSites(@Param("type") String type, @Param("healthIds") List<Integer> healthIds);

    @Query("SELECT SUM(i.durationMinutes) FROM Intervention i")
    Long sumDurationTotal();

    @Query("SELECT SUM(i.durationMinutes) FROM Intervention i WHERE i.health.id IN :healthIds")
    Long sumDurationTotalBySites(@Param("healthIds") List<Integer> healthIds);
}