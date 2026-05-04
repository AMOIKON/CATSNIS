package com.catsnis.dno.repository;

import com.catsnis.dno.entity.Partner;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PartnerRepository extends JpaRepository<Partner, Integer> {
    List<Partner> findAllByOrderByPartnerNameAsc();
    boolean existsByPartnerName(String partnerName);
    boolean existsByPartnerNameAndIdNot(String partnerName, Integer id);

    @Query("SELECT p FROM Partner p WHERE " +
            "(:keyword IS NULL OR LOWER(p.partnerName) LIKE LOWER(CONCAT('%',:keyword,'%')))")
    Page<Partner> findAllWithFilters(Pageable pageable, @Param("keyword") String keyword);
}