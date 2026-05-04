package com.catsnis.dno.repository;

import com.catsnis.dno.entity.DeploymentItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DeploymentItemRepository extends JpaRepository<DeploymentItem, Long> {

    List<DeploymentItem> findByDeploymentId(Integer deploymentId);

    @Query("SELECT di.deployment.region.regionName, di.status, COUNT(di) " +
            "FROM DeploymentItem di " +
            "WHERE (:regionId IS NULL OR di.deployment.region.id = :regionId) " +
            "AND (:districtId IS NULL OR di.deployment.district.id = :districtId) " +
            "AND (:healthId IS NULL OR di.deployment.health.id = :healthId) " +
            "GROUP BY di.deployment.region.regionName, di.status")
    List<Object[]> countByStatusAndRegion(
            @Param("regionId")   Integer regionId,
            @Param("districtId") Integer districtId,
            @Param("healthId")   Integer healthId);
}