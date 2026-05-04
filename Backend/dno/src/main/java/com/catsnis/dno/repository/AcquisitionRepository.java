package com.catsnis.dno.repository;

import com.catsnis.dno.entity.Acquisition;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AcquisitionRepository extends JpaRepository<Acquisition, Long> {
    boolean existsByTag(String tag);
    boolean existsBySerial(String serial);
    boolean existsByTagAndIdNot(String tag, Long id);
    boolean existsBySerialAndIdNot(String serial, Long id);

    @Query("SELECT a FROM Acquisition a WHERE " +
            "(:typesId IS NULL OR a.types.id = :typesId) AND " +
            "(:keyword IS NULL OR LOWER(a.tag) LIKE LOWER(CONCAT('%',:keyword,'%')) " +
            "OR LOWER(a.serial) LIKE LOWER(CONCAT('%',:keyword,'%')))")
    Page<Acquisition> findAllWithFilters(Pageable pageable,
                                         @Param("typesId") Integer typesId,
                                         @Param("keyword") String keyword);

    @Query("SELECT a FROM Acquisition a WHERE a.deployed = false AND a.types.id = :typesId")
    List<Acquisition> findAvailable(@Param("typesId") Integer typesId);

    @Query("SELECT COUNT(a) FROM Acquisition a WHERE a.deployed = false")
    long countAvailable();

    @Query("SELECT COUNT(a) FROM Acquisition a WHERE a.deployed = false")
    long countStock();

    @Query("SELECT COUNT(a) FROM Acquisition a WHERE a.deployed = true")
    long countDeployed();
}