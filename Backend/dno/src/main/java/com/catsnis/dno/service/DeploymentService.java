package com.catsnis.dno.service;

import com.catsnis.dno.dto.DeploymentRequest;
import com.catsnis.dno.dto.DeploymentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface DeploymentService {

    DeploymentResponse           getDeploymentById(Integer id);

    Page<DeploymentResponse>     getAllDeployments(Pageable pageable,
                                                   Integer regionId,
                                                   Integer districtId,
                                                   Integer healthId,
                                                   String  keyword);

    DeploymentResponse           saveDeployment(DeploymentRequest request);

    DeploymentResponse           updateDeployment(Integer id, DeploymentRequest request);

    void                         deleteDeployment(Integer id);
    DeploymentResponse           removeItemFromDeployment(Integer deploymentId, Integer itemId);

}