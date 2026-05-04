package com.catsnis.dno.repository;

import com.catsnis.dno.entity.Booklet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BookletRepository extends JpaRepository<Booklet, Long> {
    boolean existsByEmail(String email);
    List<Booklet> findByLastNameContainingIgnoreCaseOrFirstNameContainingIgnoreCase(String lastName, String firstName);
    List<Booklet> findByRegionId(Long regionId);
    List<Booklet> findByDistrictId(Long districtId);
    List<Booklet> findByStatusId(Long statusId);
    List<Booklet> findByDistrictIdAndRegionId(Long districtId, Long regionId);
    long countByStatusId(Integer statusId);

    @Query("SELECT b.region.id FROM Booklet b WHERE b.id = :healthId")
    Long findRegionIdByHealthId(@Param("healthId") Long healthId);
}