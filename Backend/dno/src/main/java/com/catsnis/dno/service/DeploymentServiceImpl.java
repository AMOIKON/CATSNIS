package com.catsnis.dno.service;

import com.catsnis.dno.common.exception.ResourceNotFoundException;
import com.catsnis.dno.common.utils.SecurityUtils;
import com.catsnis.dno.dto.*;
import com.catsnis.dno.entity.*;
import com.catsnis.dno.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    private final PartnerRepository          partnerRepository;
    private final TechnicianSiteRepository   technicianSiteRepository;
    private final InterventionRepository     interventionRepository;  // ✅ pour unlinkFromDeployment
    private final SecurityUtils              securityUtils;

    // ── Lecture par ID ────────────────────────────────────────────────────────

    @Override
    @Transactional
    public DeploymentResponse getDeploymentById(Integer id) {
        return mapToResponse(deploymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Déploiement non trouvé : " + id)));
    }

    // ── Liste paginée avec filtre partenaire ──────────────────────────────────

    @Override
    @Transactional
    public Page<DeploymentResponse> getAllDeployments(
            Pageable pageable, Integer regionId,
            Integer districtId, Integer healthId, String keyword) {

        Long partnerFilter = securityUtils.getPartnerIdFilter();

        if (partnerFilter == null) {
            return deploymentRepository
                    .findAllWithFilters(pageable, regionId, districtId, healthId, keyword)
                    .map(this::mapToResponse);
        }

        Person currentUser = securityUtils.getCurrentUser().orElse(null);

        if (currentUser != null && currentUser.getRole() == Role.TECHNICIEN) {
            List<Integer> healthIds = technicianSiteRepository
                    .findHealthIdsByPersonId(currentUser.getId());
            if (healthIds.isEmpty()) return Page.empty(pageable);

            if (partnerFilter == -1L) {
                return deploymentRepository
                        .findAllWithHealthFilterAndPartnerNull(
                                pageable, healthIds, regionId, districtId, healthId, keyword)
                        .map(this::mapToResponse);
            }
            // ✅ Sans booléen — correspond à la signature du repository
            return deploymentRepository
                    .findAllWithHealthFilterAndPartner(
                            pageable, healthIds, regionId, districtId,
                            healthId, keyword, partnerFilter)
                    .map(this::mapToResponse);
        }

        if (partnerFilter == -1L) {
            return deploymentRepository
                    .findAllWithFiltersAndPartnerNull(
                            pageable, regionId, districtId, healthId, keyword)
                    .map(this::mapToResponse);
        }
        // ✅ Sans booléen — correspond à la signature du repository
        return deploymentRepository
                .findAllWithFiltersAndPartner(
                        pageable, regionId, districtId, healthId, keyword,
                        partnerFilter)
                .map(this::mapToResponse);
    }

    // ── Créer un déploiement ──────────────────────────────────────────────────

    @Override
    @Transactional
    public DeploymentResponse saveDeployment(DeploymentRequest request) {
        Person technician = securityUtils.getCurrentUserOrThrow();

        // ✅ Résolution du partenaire : SUPER_ADMIN peut choisir, sinon auto depuis le technicien
        Partner deployPartner = null;
        if (request.getPartnerId() != null && request.getPartnerId() > 0) {
            deployPartner = partnerRepository.findById(request.getPartnerId()).orElse(null);
        }
        if (deployPartner == null) {
            deployPartner = technician.getPartner();
        }

        Deployment deployment = Deployment.builder()
                .codeDep(request.getCodeDep())
                .dateRecep(request.getDateRecep())
                .comment(request.getComment())
                .region(findRegion(request.getRegionId()))
                .district(findDistrict(request.getDistrictId()))
                .health(findHealth(request.getHealthId()))
                .apps(findApps(request.getAppsId()))
                .createdBy(technician)
                .partner(deployPartner)
                .build();

        Deployment saved = deploymentRepository.saveAndFlush(deployment);

        if (request.getItems() != null) {
            java.util.Set<Long> seenIds = new java.util.HashSet<>();
            for (DeploymentItemRequest itemReq : request.getItems()) {
                Long acqId = Long.valueOf(itemReq.getAcquisitionId());
                if (!seenIds.add(acqId)) continue;

                Acquisition acquisition = acquisitionRepository
                        .findById(acqId)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Acquisition non trouvée : " + acqId));

                DeploymentItem newItem = DeploymentItem.builder()
                        .deployment(saved)
                        .acquisition(acquisition)
                        .status(itemReq.getStatus())
                        .build();
                saved.getItems().add(newItem);

                if ("FONCTIONNEL".equals(itemReq.getStatus())) {
                    acquisition.setStatus("DEPLOYE");
                    acquisition.setDeployed(true);
                } else {
                    acquisition.setStatus("NON_FONCTIONNEL");
                    acquisition.setDeployed(false);
                }
                acquisitionRepository.save(acquisition);
            }
        }

        Deployment fresh = deploymentRepository.saveAndFlush(saved);
        return mapToResponse(fresh);
    }

    // ── Modifier un déploiement ───────────────────────────────────────────────

    @Override
    @Transactional
    public DeploymentResponse updateDeployment(Integer id, DeploymentRequest request) {
        Deployment deployment = deploymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Déploiement non trouvé : " + id));

        List<DeploymentItem> oldItems = new java.util.ArrayList<>(deployment.getItems());
        for (DeploymentItem oldItem : oldItems) {
            Acquisition acq = acquisitionRepository
                    .findById(Long.valueOf(oldItem.getAcquisition().getId()))
                    .orElse(null);
            if (acq != null) {
                acq.setStatus("DISPONIBLE");
                acq.setDeployed(false);
                acquisitionRepository.saveAndFlush(acq);
            }
        }

        deployment.getItems().clear();
        deploymentRepository.saveAndFlush(deployment);
        deploymentItemRepository.deleteAll(oldItems);
        deploymentItemRepository.flush();

        deployment.setCodeDep(request.getCodeDep());
        deployment.setDateRecep(request.getDateRecep());
        deployment.setComment(request.getComment());
        deployment.setRegion(findRegion(request.getRegionId()));
        deployment.setDistrict(findDistrict(request.getDistrictId()));
        deployment.setHealth(findHealth(request.getHealthId()));
        deployment.setApps(findApps(request.getAppsId()));

        if (request.getPartnerId() != null && request.getPartnerId() > 0) {
            partnerRepository.findById(request.getPartnerId())
                    .ifPresent(deployment::setPartner);
        }

        Deployment saved = deploymentRepository.saveAndFlush(deployment);

        if (request.getItems() != null) {
            for (DeploymentItemRequest itemReq : request.getItems()) {
                Acquisition acquisition = acquisitionRepository
                        .findById(Long.valueOf(itemReq.getAcquisitionId()))
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Acquisition non trouvée : " + itemReq.getAcquisitionId()));

                DeploymentItem newItem = DeploymentItem.builder()
                        .deployment(saved)
                        .acquisition(acquisition)
                        .status(itemReq.getStatus())
                        .build();
                deploymentItemRepository.saveAndFlush(newItem);

                if ("FONCTIONNEL".equals(itemReq.getStatus())) {
                    acquisition.setStatus("DEPLOYE");
                    acquisition.setDeployed(true);
                } else {
                    acquisition.setStatus("NON_FONCTIONNEL");
                    acquisition.setDeployed(false);
                }
                acquisitionRepository.save(acquisition);
            }
        }

        Deployment fresh = deploymentRepository.findById(saved.getId()).orElse(saved);
        return mapToResponse(fresh);
    }

    // ── Supprimer ─────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void deleteDeployment(Integer id) {
        Deployment deployment = deploymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Déploiement non trouvé : " + id));

        // ✅ Remettre les équipements en stock
        for (DeploymentItem item : deployment.getItems()) {
            Acquisition acq = item.getAcquisition();
            acq.setStatus("DISPONIBLE");
            acq.setDeployed(false);
            acquisitionRepository.save(acq);
        }

        // ✅ FIX — délier les interventions AVANT suppression
        // Évite DataIntegrityViolationException sur FK deployment_id → 400
        interventionRepository.unlinkFromDeployment(id);

        deploymentRepository.delete(deployment);
    }

    // ── Retirer un équipement — remet en stock ────────────────────────────────

    @Override
    @Transactional
    public DeploymentResponse removeItemFromDeployment(Integer deploymentId, Integer itemId) {

        // ✅ FIX — JOIN FETCH évite le problème LAZY (items collection vide)
        Deployment deployment = deploymentRepository.findByIdWithItems(deploymentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Déploiement non trouvé : " + deploymentId));

        // ✅ FIX — charger l'item directement (plus fiable que filter sur collection)
        DeploymentItem item = deploymentItemRepository.findById(Long.valueOf(itemId))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Item non trouvé : " + itemId));

        // ✅ Vérifier que l'item appartient bien à ce déploiement
        if (!item.getDeployment().getId().equals(deploymentId)) {
            throw new ResourceNotFoundException(
                    "L'item " + itemId + " n'appartient pas au déploiement " + deploymentId);
        }

        // Recharger l'acquisition depuis la BDD
        Acquisition acquisition = acquisitionRepository
                .findById(Long.valueOf(item.getAcquisition().getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Acquisition non trouvée"));

        acquisition.setStatus("DISPONIBLE");
        acquisition.setDeployed(false);
        acquisition.setQuantity(1);
        acquisitionRepository.save(acquisition);

        // Supprimer l'item
        deployment.getItems().removeIf(i -> i.getId().equals(Long.valueOf(itemId)));
        deploymentItemRepository.delete(item);
        deploymentItemRepository.flush();

        // ✅ Si plus aucun équipement — délier les interventions puis supprimer le déploiement
        if (deployment.getItems().isEmpty()) {
            interventionRepository.unlinkFromDeployment(deploymentId);
            deploymentRepository.delete(deployment);
            return DeploymentResponse.builder()
                    .id(deploymentId)
                    .codeDep("")
                    .build();
        }

        Deployment fresh = deploymentRepository.findByIdWithItems(deploymentId)
                .orElse(deployment);
        return mapToResponse(fresh);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Region   findRegion(Integer id)   { return regionRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Région : " + id)); }
    private District findDistrict(Integer id) { return districtRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("District : " + id)); }
    private Health   findHealth(Integer id)   { return healthRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Health : " + id)); }
    private Apps     findApps(Integer id)     { return appsRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Apps : " + id)); }

    // ── Mapper ────────────────────────────────────────────────────────────────

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
                .map(this::mapItemToResponse).collect(Collectors.toList())
                : List.of();

        String techName  = "";
        String partName  = "";
        String partLogo  = "bi-building";
        String partColor = "#616161";
        String partImage = "";

        if (deployment.getCreatedBy() != null) {
            Person tech = deployment.getCreatedBy();
            techName = tech.getFirstName() + " " + tech.getLastName();
        }

        // ✅ Lire le partenaire depuis deployment.getPartner() en priorité
        Partner effectivePartner = deployment.getPartner();
        if (effectivePartner == null && deployment.getCreatedBy() != null) {
            effectivePartner = deployment.getCreatedBy().getPartner();
        }
        if (effectivePartner != null) {
            partName  = effectivePartner.getPartnerName();
            partLogo  = effectivePartner.getLogo()  != null ? effectivePartner.getLogo()  : "bi-building";
            partColor = effectivePartner.getColor() != null ? effectivePartner.getColor() : "#616161";
            partImage = effectivePartner.getImage() != null ? effectivePartner.getImage() : "";
        }

        Apps   apps      = deployment.getApps();
        String appsName  = apps != null && apps.getAppName() != null ? apps.getAppName()  : "App supprimée";
        String appsIcon  = apps != null && apps.getIcon()    != null ? apps.getIcon()     : "bi-app-indicator";
        String appsColor = apps != null && apps.getColor()   != null ? apps.getColor()    : "#616161";
        String appsImage = apps != null && apps.getImage()   != null ? apps.getImage()    : "";

        Integer partId = deployment.getPartner() != null ? deployment.getPartner().getId() : null;

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
                .partnerId(partId)
                .items(items)
                .appsId(apps != null ? apps.getId() : null)
                .regionId(deployment.getRegion()   != null ? deployment.getRegion().getId()   : null)
                .districtId(deployment.getDistrict() != null ? deployment.getDistrict().getId() : null)
                .healthId(deployment.getHealth()   != null ? deployment.getHealth().getId()   : null)
                .build();
    }
}