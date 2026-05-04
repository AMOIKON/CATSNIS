package com.catsnis.dno.service;

import com.catsnis.dno.common.exception.ResourceNotFoundException;
import com.catsnis.dno.dto.*;
import com.catsnis.dno.entity.*;
import com.catsnis.dno.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeploymentServiceImpl implements DeploymentService {

    private final DeploymentRepository       deploymentRepository;
    private final RegionRepository           regionRepository;
    private final DistrictRepository         districtRepository;
    private final HealthRepository           healthRepository;
    private final AppsRepository             appsRepository;
    private final AcquisitionRepository      acquisitionRepository;
    private final DeploymentItemRepository   deploymentItemRepository;
    private final PersonRepository           personRepository;
    private final TechnicianSiteRepository   technicianSiteRepository;

    @Override
    @Transactional
    public DeploymentResponse getDeploymentById(Integer id) {
        return mapToResponse(deploymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Déploiement non trouvé : " + id)));
    }

    @Override
    @Transactional
    public Page<DeploymentResponse> getAllDeployments(
            Pageable pageable, Integer regionId,
            Integer districtId, Integer healthId, String keyword) {

        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        Person currentUser = personRepository.findByEmail(email).orElse(null);

        // SUPER_ADMIN et ADMIN voient tout
        if (currentUser == null
                || currentUser.getRole() == Role.SUPER_ADMIN
                || currentUser.getRole() == Role.ADMIN) {
            return deploymentRepository
                    .findAllWithFilters(pageable, regionId, districtId, healthId, keyword)
                    .map(this::mapToResponse);
        }

        // TECHNICIEN — filtrer par ses sites assignés
        List<Integer> healthIds = technicianSiteRepository
                .findHealthIdsByPersonId(currentUser.getId());

        if (healthIds.isEmpty()) {
            return Page.empty(pageable);
        }

        return deploymentRepository
                .findAllWithHealthFilter(pageable, healthIds, regionId, districtId, healthId, keyword)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public DeploymentResponse saveDeployment(DeploymentRequest request) {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        Person technician = personRepository.findByEmail(email).orElse(null);

        Deployment deployment = Deployment.builder()
                .codeDep(request.getCodeDep())
                .dateRecep(request.getDateRecep())
                .comment(request.getComment())
                .region(findRegion(request.getRegionId()))
                .district(findDistrict(request.getDistrictId()))
                .health(findHealth(request.getHealthId()))
                .apps(findApps(request.getAppsId()))
                .createdBy(technician)
                .build();

        Deployment saved = deploymentRepository.save(deployment);

        if (request.getItems() != null) {
            for (DeploymentItemRequest itemReq : request.getItems()) {
                Acquisition acquisition = acquisitionRepository
                        .findById(Long.valueOf(itemReq.getAcquisitionId()))
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Acquisition non trouvée : " + itemReq.getAcquisitionId()));

                deploymentItemRepository.save(DeploymentItem.builder()
                        .deployment(saved)
                        .acquisition(acquisition)
                        .status(itemReq.getStatus())
                        .build());

                if ("FONCTIONNEL".equals(itemReq.getStatus())) {
                    acquisition.setStatus("DEPLOYE");
                    acquisition.setDeployed(true);
                    acquisition.setQuantity(Math.max(acquisition.getQuantity() - 1, 0));
                } else {
                    acquisition.setStatus("NON_FONCTIONNEL");
                    acquisition.setDeployed(false);
                    acquisition.setQuantity(acquisition.getQuantity() + 1);
                }
                acquisitionRepository.save(acquisition);
            }
        }
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public DeploymentResponse updateDeployment(Integer id, DeploymentRequest request) {
        Deployment deployment = deploymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Déploiement non trouvé : " + id));

        for (DeploymentItem oldItem : deployment.getItems()) {
            Acquisition acq = oldItem.getAcquisition();
            acq.setStatus("DISPONIBLE");
            acq.setDeployed(false);
            acq.setQuantity(acq.getQuantity() + 1);
            acquisitionRepository.save(acq);
        }
        deployment.getItems().clear();

        deployment.setCodeDep(request.getCodeDep());
        deployment.setDateRecep(request.getDateRecep());
        deployment.setComment(request.getComment());
        deployment.setRegion(findRegion(request.getRegionId()));
        deployment.setDistrict(findDistrict(request.getDistrictId()));
        deployment.setHealth(findHealth(request.getHealthId()));
        deployment.setApps(findApps(request.getAppsId()));

        Deployment saved = deploymentRepository.save(deployment);

        if (request.getItems() != null) {
            for (DeploymentItemRequest itemReq : request.getItems()) {
                Acquisition acquisition = acquisitionRepository
                        .findById(Long.valueOf(itemReq.getAcquisitionId()))
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Acquisition non trouvée : " + itemReq.getAcquisitionId()));

                deploymentItemRepository.save(DeploymentItem.builder()
                        .deployment(saved)
                        .acquisition(acquisition)
                        .status(itemReq.getStatus())
                        .build());

                if ("FONCTIONNEL".equals(itemReq.getStatus())) {
                    acquisition.setStatus("DEPLOYE");
                    acquisition.setDeployed(true);
                    acquisition.setQuantity(Math.max(acquisition.getQuantity() - 1, 0));
                } else {
                    acquisition.setStatus("NON_FONCTIONNEL");
                    acquisition.setDeployed(false);
                    acquisition.setQuantity(acquisition.getQuantity() + 1);
                }
                acquisitionRepository.save(acquisition);
            }
        }
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void deleteDeployment(Integer id) {
        Deployment deployment = deploymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Déploiement non trouvé : " + id));

        for (DeploymentItem item : deployment.getItems()) {
            Acquisition acq = item.getAcquisition();
            acq.setStatus("DISPONIBLE");
            acq.setDeployed(false);
            acq.setQuantity(acq.getQuantity() + 1);
            acquisitionRepository.save(acq);
        }
        deploymentRepository.delete(deployment);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private Region   findRegion(Integer id)   { return regionRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Région : " + id)); }
    private District findDistrict(Integer id) { return districtRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("District : " + id)); }
    private Health   findHealth(Integer id)   { return healthRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Health : " + id)); }
    private Apps     findApps(Integer id)     { return appsRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Apps : " + id)); }

    private DeploymentItemResponse mapItemToResponse(DeploymentItem item) {
        return DeploymentItemResponse.builder()
                .id(item.getId())
                .acquisitionId(item.getAcquisition().getId())
                .tag(item.getAcquisition().getTag())
                .serial(item.getAcquisition().getSerial())
                .typeName(item.getAcquisition().getTypes().getTypeName())
                .status(item.getStatus())
                .build();
    }

    private DeploymentResponse mapToResponse(Deployment deployment) {
        List<DeploymentItemResponse> items = deployment.getItems() != null
                ? deployment.getItems().stream()
                .map(this::mapItemToResponse)
                .collect(Collectors.toList())
                : List.of();

        String techName  = "";
        String partName  = "";
        String partLogo  = "bi-building";
        String partColor = "#616161";
        String partImage = "";

        if (deployment.getCreatedBy() != null) {
            Person tech = deployment.getCreatedBy();
            techName = tech.getFirstName() + " " + tech.getLastName();
            if (tech.getPartner() != null) {
                Partner partner = tech.getPartner();
                partName  = partner.getPartnerName();
                partLogo  = partner.getLogo()  != null ? partner.getLogo()  : "bi-building";
                partColor = partner.getColor() != null ? partner.getColor() : "#616161";
                partImage = partner.getImage() != null ? partner.getImage() : "";
            }
        }

        Apps   apps      = deployment.getApps();
        String appsName  = apps != null && apps.getAppName() != null ? apps.getAppName() : "App supprimée";
        String appsIcon  = apps != null && apps.getIcon()    != null ? apps.getIcon()    : "bi-app-indicator";
        String appsColor = apps != null && apps.getColor()   != null ? apps.getColor()   : "#616161";
        String appsImage = apps != null && apps.getImage()   != null ? apps.getImage()   : "";

        return DeploymentResponse.builder()
                .id(deployment.getId())
                .codeDep(deployment.getCodeDep())
                .dateRecep(deployment.getDateRecep())
                .comment(deployment.getComment())
                .regionDeploy(deployment.getRegion().getRegionName())
                .districtDeploy(deployment.getDistrict().getDistrictName())
                .healthDeploy(deployment.getHealth().getHealthName())
                .appsDeploy(appsName)
                .appsIcon(appsIcon)
                .appsColor(appsColor)
                .appsImage(appsImage)
                .technicianName(techName)
                .partnerName(partName)
                .partnerLogo(partLogo)
                .partnerColor(partColor)
                .partnerImage(partImage)
                .items(items)
                .appsId(apps != null ? apps.getId() : null)
                .regionId(deployment.getRegion()   != null ? deployment.getRegion().getId()   : null)
                .districtId(deployment.getDistrict() != null ? deployment.getDistrict().getId() : null)
                .healthId(deployment.getHealth()   != null ? deployment.getHealth().getId()   : null)
                .build();
    }
}