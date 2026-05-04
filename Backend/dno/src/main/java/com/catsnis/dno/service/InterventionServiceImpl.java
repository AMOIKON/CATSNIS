package com.catsnis.dno.service;

import com.catsnis.dno.common.exception.ResourceNotFoundException;
import com.catsnis.dno.dto.DeploymentItemResponse;
import com.catsnis.dno.dto.InterventionRequest;
import com.catsnis.dno.dto.InterventionResponse;
import com.catsnis.dno.entity.*;
import com.catsnis.dno.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InterventionServiceImpl implements InterventionService {

    private final InterventionRepository    interventionRepository;
    private final RegionRepository          regionRepository;
    private final DistrictRepository        districtRepository;
    private final HealthRepository          healthRepository;
    private final TypesRepository           typesRepository;
    private final EvaluationRepository      evaluationRepository;
    private final AppsRepository            appsRepository;
    private final DeploymentRepository      deploymentRepository;
    private final PersonRepository          personRepository;
    private final BookletRepository         bookletRepository;
    private final DeploymentItemRepository  deploymentItemRepository;
    private final AcquisitionRepository     acquisitionRepository;
    private final TechnicianSiteRepository  technicianSiteRepository;

    // ── Helper parseDate ──────────────────────────────────────────────────────
    private Date parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return new Date();
        String[] formats = {
                "yyyy-MM-dd",
                "yyyy-MM-dd'T'HH:mm:ss",
                "yyyy-MM-dd'T'HH:mm:ss.SSS",
                "dd/MM/yyyy"
        };
        for (String fmt : formats) {
            try { return new SimpleDateFormat(fmt).parse(dateStr); }
            catch (Exception ignored) {}
        }
        return new Date();
    }

    @Override
    @Transactional
    public InterventionResponse getInterventionById(Integer id) {
        return mapToResponse(interventionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Intervention non trouvée avec l'id : " + id)));
    }

    @Override
    @Transactional
    public Page<InterventionResponse> getAllInterventions(
            Pageable pageable, Integer regionId,
            Integer districtId, Integer healthId, String keyword) {

        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        Person currentUser = personRepository.findByEmail(email).orElse(null);

        if (currentUser == null
                || currentUser.getRole() == Role.SUPER_ADMIN
                || currentUser.getRole() == Role.ADMIN) {
            return interventionRepository
                    .findAllWithFilters(pageable, regionId, districtId,
                            healthId, keyword, null)
                    .map(this::mapToResponse);
        }

        List<Integer> healthIds = technicianSiteRepository
                .findHealthIdsByPersonId(currentUser.getId());
        if (healthIds.isEmpty()) return Page.empty(pageable);

        return interventionRepository
                .findAllWithFilters(pageable, regionId, districtId,
                        healthId, keyword, healthIds)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public InterventionResponse saveIntervention(InterventionRequest request) {

        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        Person technician = personRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Technicien introuvable"));

        Booklet booklet = null;
        if (request.getBookletId() != null) {
            booklet = bookletRepository
                    .findById(Long.valueOf(request.getBookletId()))
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Booklet non trouvé : " + request.getBookletId()));
        }

        Region     region     = regionRepository.findById(request.getRegionId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Région non trouvée : " + request.getRegionId()));
        District   district   = districtRepository.findById(request.getDistrictId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "District non trouvé : " + request.getDistrictId()));
        Health     health     = healthRepository.findById(request.getHealthId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Établissement non trouvé : " + request.getHealthId()));
        Evaluation evaluation = evaluationRepository.findById(request.getEvaluationId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Évaluation non trouvée : " + request.getEvaluationId()));

        Deployment deployment = null;
        if (request.getDeploymentId() != null && request.getDeploymentId() > 0) {
            deployment = deploymentRepository.findById(request.getDeploymentId())
                    .orElse(null);
        }
        if (deployment == null && request.getHealthId() != null) {
            List<Deployment> deps = deploymentRepository
                    .findByHealthId(request.getHealthId());
            if (!deps.isEmpty()) deployment = deps.get(0);
        }
        if (deployment == null) {
            throw new ResourceNotFoundException(
                    "Aucun déploiement trouvé pour ce site");
        }

        Types types = resolveTypes(request.getTypesId(), deployment);
        Apps  apps  = resolveApps(request.getAppsId(), deployment);

        String actionInter = "EN_LIGNE".equals(request.getTypeInter())
                ? "MAINTENANCE"
                : (request.getActionInter() != null
                ? request.getActionInter() : "MAINTENANCE_CURATIVE");

        String codeInter = "INT-" + UUID.randomUUID()
                .toString().substring(0, 8).toUpperCase();

        Intervention intervention = Intervention.builder()
                .codeInter(codeInter)
                .typeInter(request.getTypeInter())
                .actionInter(actionInter)
                .commentInter(request.getCommentInter())
                .dateInter(parseDate(request.getDateInter()))
                .durationMinutes(request.getDurationMinutes())
                .region(region)
                .district(district)
                .health(health)
                .types(types)
                .evaluation(evaluation)
                .apps(apps)
                .deployment(deployment)
                .technician(technician)
                .person(null)
                .booklet(booklet)
                .enAttenteMaintenance(
                        request.getEnAttenteMaintenance() != null
                                ? request.getEnAttenteMaintenance() : false)
                .build();

        Intervention saved = interventionRepository.save(intervention);
        saveItemStatesByIds(request);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public InterventionResponse updateIntervention(Integer id, InterventionRequest request) {
        Intervention intervention = interventionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Intervention non trouvée : " + id));

        Booklet booklet = null;
        if (request.getBookletId() != null) {
            booklet = bookletRepository
                    .findById(Long.valueOf(request.getBookletId()))
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Booklet non trouvé : " + request.getBookletId()));
        }

        Region     region     = regionRepository.findById(request.getRegionId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Région non trouvée : " + request.getRegionId()));
        District   district   = districtRepository.findById(request.getDistrictId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "District non trouvé : " + request.getDistrictId()));
        Health     health     = healthRepository.findById(request.getHealthId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Établissement non trouvé : " + request.getHealthId()));
        Evaluation evaluation = evaluationRepository.findById(request.getEvaluationId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Évaluation non trouvée : " + request.getEvaluationId()));

        Deployment deployment = null;
        if (request.getDeploymentId() != null && request.getDeploymentId() > 0) {
            deployment = deploymentRepository.findById(request.getDeploymentId())
                    .orElse(null);
        }
        if (deployment == null) {
            List<Deployment> deps = deploymentRepository
                    .findByHealthId(request.getHealthId());
            if (!deps.isEmpty()) deployment = deps.get(0);
        }
        if (deployment == null) {
            throw new ResourceNotFoundException(
                    "Aucun déploiement trouvé pour ce site");
        }

        Types types = resolveTypes(request.getTypesId(), deployment);
        Apps  apps  = resolveApps(request.getAppsId(), deployment);

        String actionInter = "EN_LIGNE".equals(request.getTypeInter())
                ? "MAINTENANCE"
                : (request.getActionInter() != null
                ? request.getActionInter() : "MAINTENANCE_CURATIVE");

        intervention.setTypeInter(request.getTypeInter());
        intervention.setActionInter(actionInter);
        intervention.setCommentInter(request.getCommentInter());
        intervention.setDateInter(parseDate(request.getDateInter()));
        intervention.setDurationMinutes(request.getDurationMinutes());
        intervention.setRegion(region);
        intervention.setDistrict(district);
        intervention.setHealth(health);
        intervention.setTypes(types);
        intervention.setEvaluation(evaluation);
        intervention.setApps(apps);
        intervention.setDeployment(deployment);
        intervention.setPerson(null);
        intervention.setBooklet(booklet);
        intervention.setEnAttenteMaintenance(
                request.getEnAttenteMaintenance() != null
                        ? request.getEnAttenteMaintenance() : false);

        Intervention updated = interventionRepository.save(intervention);
        saveItemStatesByIds(request);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteIntervention(Integer id) {
        Intervention intervention = interventionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Intervention non trouvée : " + id));
        interventionRepository.delete(intervention);
    }

    @Override
    public Long getTotalMinutesEnLigne() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        Person currentUser = personRepository.findByEmail(email).orElse(null);
        if (currentUser == null
                || currentUser.getRole() == Role.SUPER_ADMIN
                || currentUser.getRole() == Role.ADMIN) {
            return interventionRepository.sumDurationByType("EN_LIGNE");
        }
        List<Integer> healthIds = technicianSiteRepository
                .findHealthIdsByPersonId(currentUser.getId());
        return healthIds.isEmpty() ? 0L
                : interventionRepository
                .sumDurationByTypeAndSites("EN_LIGNE", healthIds);
    }

    @Override
    public Long getTotalMinutesSurSite() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        Person currentUser = personRepository.findByEmail(email).orElse(null);
        if (currentUser == null
                || currentUser.getRole() == Role.SUPER_ADMIN
                || currentUser.getRole() == Role.ADMIN) {
            return interventionRepository.sumDurationByType("SUR_SITE");
        }
        List<Integer> healthIds = technicianSiteRepository
                .findHealthIdsByPersonId(currentUser.getId());
        return healthIds.isEmpty() ? 0L
                : interventionRepository
                .sumDurationByTypeAndSites("SUR_SITE", healthIds);
    }

    @Override
    public Long getTotalMinutesGlobal() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        Person currentUser = personRepository.findByEmail(email).orElse(null);
        if (currentUser == null
                || currentUser.getRole() == Role.SUPER_ADMIN
                || currentUser.getRole() == Role.ADMIN) {
            return interventionRepository.sumDurationTotal();
        }
        List<Integer> healthIds = technicianSiteRepository
                .findHealthIdsByPersonId(currentUser.getId());
        return healthIds.isEmpty() ? 0L
                : interventionRepository.sumDurationTotalBySites(healthIds);
    }

    // ── Sauvegarder états par IDs ─────────────────────────────────────────────
    private void saveItemStatesByIds(InterventionRequest request) {
        if (request.getSelectedItemIds() == null
                || request.getSelectedItemIds().isEmpty()) return;

        request.getSelectedItemIds().forEach(itemId -> {
            deploymentItemRepository.findById(itemId).ifPresent(item -> {
                boolean changed = false;

                if (request.getEtatsAvant() != null
                        && request.getEtatsAvant().containsKey(itemId)) {
                    item.setEtatAvant(request.getEtatsAvant().get(itemId));
                    changed = true;
                }

                if (request.getEtatsApres() != null
                        && request.getEtatsApres().containsKey(itemId)) {
                    String etatApres = request.getEtatsApres().get(itemId);
                    item.setEtatApres(etatApres);

                    if ("EN_LIGNE".equals(request.getTypeInter())) {
                        if ("NON_FONCTIONNEL".equals(etatApres)
                                || "DEGRADE".equals(etatApres)) {
                            item.setStatus("EN_ATTENTE_INTERVENTION_SITE");
                        } else {
                            item.setStatus(etatApres);
                        }
                    } else {
                        Boolean reussie = request.getMaintenanceReussie() != null
                                ? request.getMaintenanceReussie().get(itemId)
                                : null;
                        if (Boolean.TRUE.equals(reussie)) {
                            item.setStatus("FONCTIONNEL");
                            item.setEtatApres("FONCTIONNEL");
                        } else if (request.getReplacements() != null
                                && request.getReplacements().containsKey(itemId)) {
                            item.setStatus("REMPLACE");
                        } else {
                            item.setStatus(etatApres);
                        }
                    }
                    changed = true;
                }

                if (request.getReplacements() != null
                        && request.getReplacements().containsKey(itemId)) {
                    Integer newAcqId = request.getReplacements().get(itemId);
                    if (newAcqId != null && newAcqId > 0) {
                        acquisitionRepository.findById(Long.valueOf(newAcqId))
                                .ifPresent(newAcq -> {
                                    Acquisition oldAcq = item.getAcquisition();
                                    item.setReplacement(oldAcq);
                                    oldAcq.setDeployed(false);
                                    oldAcq.setStatus("DISPONIBLE");
                                    acquisitionRepository.save(oldAcq);
                                    newAcq.setDeployed(true);
                                    newAcq.setStatus("DEPLOYE");
                                    acquisitionRepository.save(newAcq);
                                    item.setAcquisition(newAcq);
                                    item.setStatus("FONCTIONNEL");
                                    item.setEtatApres("FONCTIONNEL");
                                });
                    }
                    changed = true;
                }

                if (changed) deploymentItemRepository.save(item);
            });
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private Types resolveTypes(Integer typesId, Deployment deployment) {
        if (typesId != null && typesId > 0) {
            return typesRepository.findById(typesId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Type non trouvé : " + typesId));
        }
        if (deployment != null
                && deployment.getItems() != null
                && !deployment.getItems().isEmpty()) {
            return deployment.getItems().get(0).getAcquisition().getTypes();
        }
        throw new ResourceNotFoundException(
                "Impossible de déterminer le type d'équipement");
    }

    private Apps resolveApps(Integer appsId, Deployment deployment) {
        if (appsId != null && appsId > 0) {
            return appsRepository.findById(appsId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Application non trouvée : " + appsId));
        }
        if (deployment != null && deployment.getApps() != null) {
            return deployment.getApps();
        }
        throw new ResourceNotFoundException(
                "Impossible de déterminer l'application");
    }

    // ── Mapping ───────────────────────────────────────────────────────────────
    private InterventionResponse mapToResponse(Intervention intervention) {

        Partner partner = intervention.getTechnician() != null
                && intervention.getTechnician().getPartner() != null
                ? intervention.getTechnician().getPartner() : null;

        Apps apps = intervention.getApps();

        List<DeploymentItemResponse> deploymentItems = new ArrayList<>();
        if (intervention.getDeployment() != null
                && intervention.getDeployment().getItems() != null) {
            deploymentItems = intervention.getDeployment().getItems()
                    .stream()
                    .map(item -> {
                        Acquisition repl = item.getReplacement();
                        return DeploymentItemResponse.builder()
                                .id(item.getId())
                                .acquisitionId(item.getAcquisition().getId())
                                .tag(item.getAcquisition().getTag())
                                .serial(item.getAcquisition().getSerial())
                                .typeName(item.getAcquisition().getTypes().getTypeName())
                                .status(item.getStatus())
                                .etatAvant(item.getEtatAvant())
                                .etatApres(item.getEtatApres())
                                .replacementId(repl != null ? repl.getId()         : null)
                                .replacementTag(repl != null ? repl.getTag()       : null)
                                .replacementSerial(repl != null ? repl.getSerial() : null)
                                .replacementType(repl != null
                                        ? repl.getTypes().getTypeName() : null)
                                .build();
                    })
                    .collect(Collectors.toList());
        }

        String  personName    = null;
        String  personContact = null;
        String  personPost    = null;
        Integer personId      = null;

        if (intervention.getBooklet() != null) {
            Booklet b     = intervention.getBooklet();
            personName    = b.getLastName() + " " + b.getFirstName();
            personId      = b.getId().intValue();
            personContact = b.getContact();
            personPost    = b.getPost() != null ? b.getPost().getPostName() : null;
        } else if (intervention.getPerson() != null) {
            Person p   = intervention.getPerson();
            personName = p.getFirstName() + " " + p.getLastName();
            personId   = p.getId();
        }

        return InterventionResponse.builder()
                .id(intervention.getId())
                .codeInter(intervention.getCodeInter())
                .typeInter(intervention.getTypeInter())
                .actionInter(intervention.getActionInter())
                .commentInter(intervention.getCommentInter())
                .dateInter(intervention.getDateInter())
                .durationMinutes(intervention.getDurationMinutes())
                .regionName(intervention.getRegion().getRegionName())
                .districtName(intervention.getDistrict().getDistrictName())
                .healthName(intervention.getHealth().getHealthName())
                .typeName(intervention.getTypes().getTypeName())
                .evlName(intervention.getEvaluation().getEvlName())
                .regionId(intervention.getRegion()     != null
                        ? intervention.getRegion().getId()     : null)
                .districtId(intervention.getDistrict() != null
                        ? intervention.getDistrict().getId()   : null)
                .healthId(intervention.getHealth()     != null
                        ? intervention.getHealth().getId()     : null)
                .deploymentId(intervention.getDeployment() != null
                        ? intervention.getDeployment().getId() : null)
                .evaluationId(intervention.getEvaluation() != null
                        ? intervention.getEvaluation().getId() : null)
                .typesId(intervention.getTypes() != null
                        ? intervention.getTypes().getId()      : null)
                .appsId(apps != null ? apps.getId() : null)
                .deploymentCode(intervention.getDeployment() != null
                        ? intervention.getDeployment().getCodeDep() : null)
                .deploymentItems(deploymentItems)
                .appName(apps != null ? apps.getAppName() : null)
                .appsIcon(apps  != null && apps.getIcon()  != null
                        ? apps.getIcon()  : "bi-app-indicator")
                .appsColor(apps != null && apps.getColor() != null
                        ? apps.getColor() : "#616161")
                .appsImage(apps != null && apps.getImage() != null
                        ? apps.getImage() : "")
                .technicianName(intervention.getTechnician() != null
                        ? intervention.getTechnician().getFirstName() + " "
                        + intervention.getTechnician().getLastName() : null)
                .partnerName(partner  != null ? partner.getPartnerName() : null)
                .partnerLogo(partner  != null && partner.getLogo()  != null
                        ? partner.getLogo()  : "bi-building")
                .partnerColor(partner != null && partner.getColor() != null
                        ? partner.getColor() : "#616161")
                .partnerImage(partner != null && partner.getImage() != null
                        ? partner.getImage() : "")
                .personId(personId)
                .personName(personName)
                .personContact(personContact)
                .personPost(personPost)
                .enAttenteMaintenance(intervention.getEnAttenteMaintenance())
                .build();
    }
}