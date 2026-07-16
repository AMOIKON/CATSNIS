package com.catsnis.dno.service;

import com.catsnis.dno.common.exception.ResourceNotFoundException;
import com.catsnis.dno.common.utils.SecurityUtils;
import com.catsnis.dno.dto.DeploymentItemResponse;
import com.catsnis.dno.dto.InterventionRequest;
import com.catsnis.dno.dto.InterventionResponse;
import com.catsnis.dno.entity.*;
import com.catsnis.dno.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

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
    private final SecurityUtils             securityUtils;
    private final BookletService            bookletService;
    private final AcquisitionQuickCreateService acquisitionService;
    private final PartnerRepository         partnerRepository;
    private final InterventionPdfService     interventionPdfService;

    private static final String PERSON_TAG    = "[Personne assistee]";
    private static final String EQUIPMENT_TAG = "[Equipement hors base]";
    private static final String STRUCTURE_TAG = "[Structure hors base]";

    private Date parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return new Date();
        String[] formats = {
                "yyyy-MM-dd", "yyyy-MM-dd'T'HH:mm:ss",
                "yyyy-MM-dd'T'HH:mm:ss.SSS", "dd/MM/yyyy"
        };
        for (String fmt : formats) {
            try { return new SimpleDateFormat(fmt).parse(dateStr); }
            catch (Exception ignored) {}
        }
        return new Date();
    }

    private String[] splitName(String fullName) {
        if (fullName == null || fullName.isBlank()) return new String[]{"", ""};
        String[] parts = fullName.trim().split(" ", 2);
        return new String[]{
                parts[0].toUpperCase(),
                parts.length > 1 ? parts[1] : ""
        };
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

        Long partnerFilter = securityUtils.getPartnerIdFilter();
        Person currentUser = securityUtils.getCurrentUser().orElse(null);

        if (partnerFilter == null) {
            return interventionRepository
                    .findAllWithFilters(pageable, regionId, districtId, healthId, keyword, null)
                    .map(this::mapToResponse);
        }

        if (currentUser != null && currentUser.getRole() == Role.TECHNICIEN) {
            List<Integer> healthIds = technicianSiteRepository
                    .findHealthIdsByPersonId(currentUser.getId());
            if (healthIds.isEmpty()) return Page.empty(pageable);

            if (partnerFilter == -1L) {
                return interventionRepository
                        .findAllWithFiltersAndPartnerNull(
                                pageable, regionId, districtId, healthId, keyword, healthIds)
                        .map(this::mapToResponse);
            }
            return interventionRepository
                    .findAllWithFiltersAndPartner(
                            pageable, regionId, districtId, healthId, keyword, healthIds, partnerFilter)
                    .map(this::mapToResponse);
        }

        if (partnerFilter == -1L) {
            return interventionRepository
                    .findAllWithFiltersAndPartnerNull(
                            pageable, regionId, districtId, healthId, keyword, null)
                    .map(this::mapToResponse);
        }
        return interventionRepository
                .findAllWithFiltersAndPartner(
                        pageable, regionId, districtId, healthId, keyword, null, partnerFilter)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public InterventionResponse saveIntervention(InterventionRequest request) {
        Person technician = securityUtils.getCurrentUserOrThrow();

        Booklet booklet = null;
        if (request.getBookletId() != null) {
            booklet = bookletRepository.findById(Long.valueOf(request.getBookletId()))
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Booklet non trouvé : " + request.getBookletId()));
        }

        boolean hasManualStructure = request.getManualStructureName() != null
                && !request.getManualStructureName().isBlank();

        Region region = resolveRegion(request.getRegionId(), hasManualStructure);
        District district = resolveDistrict(request.getDistrictId(), hasManualStructure);
        Health health = resolveHealth(request.getHealthId(), hasManualStructure);

        Evaluation evaluation = evaluationRepository.findById(request.getEvaluationId())
                .orElseThrow(() -> new ResourceNotFoundException("Évaluation non trouvée : " + request.getEvaluationId()));

        boolean hasManualEquipment = request.getManualEquipmentName() != null
                && !request.getManualEquipmentName().isBlank();

        Deployment deployment = resolveDeployment(request, hasManualEquipment);
        Types      types      = resolveTypes(request.getTypesId(), deployment, hasManualEquipment);
        Apps       apps       = resolveApps(request.getAppsId(), deployment, hasManualEquipment);

        Partner partnerForEquipment = technician.getPartner();
        if (request.getPartnerId() != null && request.getPartnerId() > 0) {
            partnerForEquipment = partnerRepository.findById(request.getPartnerId()).orElse(partnerForEquipment);
        }
        if (hasManualEquipment && types == null) {
            try {
                Acquisition createdAcquisition = acquisitionService.quickCreate(
                        request.getManualEquipmentName(),
                        request.getManualEquipmentType(),
                        partnerForEquipment
                );
                types = createdAcquisition.getTypes();
            } catch (Exception e) {
                System.err.println("[WARN] Création acquisition hors base échouée : " + e.getMessage());
            }
        }

        String actionInter = "EN_LIGNE".equals(request.getTypeInter())
                ? "MAINTENANCE"
                : (request.getActionInter() != null ? request.getActionInter() : "MAINTENANCE_CURATIVE");

        String codeInter = "INT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        boolean hasManualPerson = booklet == null
                && request.getManualPersonName() != null
                && !request.getManualPersonName().isBlank();

        String commentFinal = appendManualTags(request.getCommentInter(), request,
                hasManualPerson, hasManualEquipment, hasManualStructure);

        Partner partner = partnerForEquipment;

        Intervention intervention = Intervention.builder()
                .codeInter(codeInter)
                .typeInter(request.getTypeInter())
                .actionInter(actionInter)
                .commentInter(commentFinal)
                .dateInter(parseDate(request.getDateInter()))
                .durationMinutes(request.getDurationMinutes())
                .region(region).district(district).health(health)
                .types(types).evaluation(evaluation).apps(apps)
                .deployment(deployment)
                .technician(technician)
                .person(null)
                .booklet(booklet)
                .partner(partner)
                .enAttenteMaintenance(request.getEnAttenteMaintenance() != null
                        ? request.getEnAttenteMaintenance() : false)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .build();

        Intervention saved = interventionRepository.save(intervention);

        if (!hasManualEquipment) {
            saveItemStatesByIds(request);
        }

        if (hasManualPerson) {
            try {
                String[] nameParts = splitName(request.getManualPersonName());
                bookletService.quickCreate(
                        nameParts[0], nameParts[1],
                        request.getManualPersonContact(),
                        request.getManualPersonPost(),
                        request.getRegionId() != null ? Long.valueOf(request.getRegionId()) : null,
                        request.getDistrictId() != null ? Long.valueOf(request.getDistrictId()) : null
                );
            } catch (Exception e) {
                System.err.println("[WARN] Création booklet automatique échouée : " + e.getMessage());
            }
        }

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public InterventionResponse updateIntervention(Integer id, InterventionRequest request) {
        Intervention intervention = interventionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Intervention non trouvée : " + id));

        Booklet booklet = null;
        if (request.getBookletId() != null) {
            booklet = bookletRepository.findById(Long.valueOf(request.getBookletId()))
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Booklet non trouvé : " + request.getBookletId()));
        }

        boolean hasManualStructure = request.getManualStructureName() != null
                && !request.getManualStructureName().isBlank();

        Region region = resolveRegion(request.getRegionId(), hasManualStructure);
        District district = resolveDistrict(request.getDistrictId(), hasManualStructure);
        Health health = resolveHealth(request.getHealthId(), hasManualStructure);

        Evaluation evaluation = evaluationRepository.findById(request.getEvaluationId())
                .orElseThrow(() -> new ResourceNotFoundException("Évaluation non trouvée : " + request.getEvaluationId()));

        boolean hasManualEquipment = request.getManualEquipmentName() != null
                && !request.getManualEquipmentName().isBlank();

        Deployment deployment = resolveDeployment(request, hasManualEquipment);
        Types      types      = resolveTypes(request.getTypesId(), deployment, hasManualEquipment);
        Apps       apps       = resolveApps(request.getAppsId(), deployment, hasManualEquipment);

        Partner partner = intervention.getPartner() != null
                ? intervention.getPartner()
                : (intervention.getTechnician() != null ? intervention.getTechnician().getPartner() : null);
        if (request.getPartnerId() != null && request.getPartnerId() > 0) {
            partner = partnerRepository.findById(request.getPartnerId()).orElse(partner);
        }

        if (hasManualEquipment && types == null) {
            try {
                Acquisition createdAcquisition = acquisitionService.quickCreate(
                        request.getManualEquipmentName(),
                        request.getManualEquipmentType(),
                        partner
                );
                types = createdAcquisition.getTypes();
            } catch (Exception e) {
                System.err.println("[WARN] Création acquisition hors base (update) échouée : " + e.getMessage());
            }
        }

        String actionInter = "EN_LIGNE".equals(request.getTypeInter())
                ? "MAINTENANCE"
                : (request.getActionInter() != null ? request.getActionInter() : "MAINTENANCE_CURATIVE");

        boolean hasManualPerson = booklet == null
                && request.getManualPersonName() != null
                && !request.getManualPersonName().isBlank();

        String baseComment = request.getCommentInter() != null ? request.getCommentInter() : "";
        int idxPerson    = baseComment.indexOf(" | " + PERSON_TAG);
        int idxEquipment = baseComment.indexOf(" | " + EQUIPMENT_TAG);
        int idxStructure = baseComment.indexOf(" | " + STRUCTURE_TAG);
        int cutIdx = Stream.of(idxPerson, idxEquipment, idxStructure)
                .filter(i -> i >= 0)
                .min(Integer::compareTo)
                .orElse(-1);
        if (cutIdx >= 0) baseComment = baseComment.substring(0, cutIdx);

        String commentFinal = appendManualTags(baseComment, request,
                hasManualPerson, hasManualEquipment, hasManualStructure);

        intervention.setTypeInter(request.getTypeInter());
        intervention.setActionInter(actionInter);
        intervention.setCommentInter(commentFinal);
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
        intervention.setPartner(partner);
        intervention.setEnAttenteMaintenance(
                request.getEnAttenteMaintenance() != null ? request.getEnAttenteMaintenance() : false);
        if (request.getLatitude()  != null) intervention.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) intervention.setLongitude(request.getLongitude());

        Intervention updated = interventionRepository.save(intervention);

        if (!hasManualEquipment) {
            saveItemStatesByIds(request);
        }

        if (hasManualPerson) {
            try {
                String[] nameParts = splitName(request.getManualPersonName());
                bookletService.quickCreate(
                        nameParts[0], nameParts[1],
                        request.getManualPersonContact(),
                        request.getManualPersonPost(),
                        request.getRegionId() != null ? Long.valueOf(request.getRegionId()) : null,
                        request.getDistrictId() != null ? Long.valueOf(request.getDistrictId()) : null
                );
            } catch (Exception e) {
                System.err.println("[WARN] Création booklet automatique (update) échouée : " + e.getMessage());
            }
        }

        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteIntervention(Integer id) {
        Intervention intervention = interventionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Intervention non trouvée : " + id));
        interventionRepository.delete(intervention);
    }

    @Override
    public Long getTotalMinutesEnLigne() {
        Long partnerFilter = securityUtils.getPartnerIdFilter();
        if (partnerFilter == null) return interventionRepository.sumDurationByType("EN_LIGNE");
        Person currentUser = securityUtils.getCurrentUser().orElse(null);
        if (currentUser != null && currentUser.getRole() == Role.TECHNICIEN) {
            List<Integer> healthIds = technicianSiteRepository.findHealthIdsByPersonId(currentUser.getId());
            return healthIds.isEmpty() ? 0L : interventionRepository.sumDurationByTypeAndSites("EN_LIGNE", healthIds);
        }
        if (partnerFilter == -1L) return interventionRepository.sumDurationByTypeAndPartnerNull("EN_LIGNE");
        return interventionRepository.sumDurationByTypeAndPartner("EN_LIGNE", partnerFilter);
    }

    @Override
    public Long getTotalMinutesSurSite() {
        Long partnerFilter = securityUtils.getPartnerIdFilter();
        if (partnerFilter == null) return interventionRepository.sumDurationByType("SUR_SITE");
        Person currentUser = securityUtils.getCurrentUser().orElse(null);
        if (currentUser != null && currentUser.getRole() == Role.TECHNICIEN) {
            List<Integer> healthIds = technicianSiteRepository.findHealthIdsByPersonId(currentUser.getId());
            return healthIds.isEmpty() ? 0L : interventionRepository.sumDurationByTypeAndSites("SUR_SITE", healthIds);
        }
        if (partnerFilter == -1L) return interventionRepository.sumDurationByTypeAndPartnerNull("SUR_SITE");
        return interventionRepository.sumDurationByTypeAndPartner("SUR_SITE", partnerFilter);
    }

    @Override
    public Long getTotalMinutesGlobal() {
        Long partnerFilter = securityUtils.getPartnerIdFilter();
        if (partnerFilter == null) return interventionRepository.sumDurationTotal();
        Person currentUser = securityUtils.getCurrentUser().orElse(null);
        if (currentUser != null && currentUser.getRole() == Role.TECHNICIEN) {
            List<Integer> healthIds = technicianSiteRepository.findHealthIdsByPersonId(currentUser.getId());
            return healthIds.isEmpty() ? 0L : interventionRepository.sumDurationTotalBySites(healthIds);
        }
        if (partnerFilter == -1L) return interventionRepository.sumDurationTotalByPartnerNull();
        return interventionRepository.sumDurationTotalByPartner(partnerFilter);
    }

    @Override
    public Long getTotalHorsBase() {
        Long partnerFilter = securityUtils.getPartnerIdFilter();
        if (partnerFilter == null) return interventionRepository.countHorsBase();
        Person currentUser = securityUtils.getCurrentUser().orElse(null);
        if (currentUser != null && currentUser.getRole() == Role.TECHNICIEN) {
            List<Integer> healthIds = technicianSiteRepository.findHealthIdsByPersonId(currentUser.getId());
            return healthIds.isEmpty() ? 0L : interventionRepository.countHorsBaseBySites(healthIds);
        }
        if (partnerFilter == -1L) return interventionRepository.countHorsBaseAndPartnerNull();
        return interventionRepository.countHorsBaseAndPartner(partnerFilter);
    }

    @Override
    @Transactional
    public byte[] generateInterventionPdf(Integer interventionId) {
        Intervention intervention = interventionRepository.findById(interventionId)
                .orElseThrow(() -> new ResourceNotFoundException("Intervention non trouvée : " + interventionId));

        Person technician = securityUtils.getCurrentUserOrThrow();

        try {
            return interventionPdfService.generateInterventionPdf(intervention, technician);
        } catch (Exception e) {
            throw new IllegalStateException(
                    "Impossible de générer la fiche PDF de l'intervention : " + e.getMessage(), e);
        }
    }

    // ── Helpers privés ────────────────────────────────────────────────────────

    /** Résout la région ; retourne null si structure manuelle et aucune région fournie. */
    private Region resolveRegion(Integer regionId, boolean hasManualStructure) {
        if (regionId != null && regionId > 0) {
            return regionRepository.findById(regionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Région non trouvée : " + regionId));
        }
        if (hasManualStructure) return null;
        throw new ResourceNotFoundException("Région non trouvée : " + regionId);
    }

    private District resolveDistrict(Integer districtId, boolean hasManualStructure) {
        if (districtId != null && districtId > 0) {
            return districtRepository.findById(districtId)
                    .orElseThrow(() -> new ResourceNotFoundException("District non trouvé : " + districtId));
        }
        if (hasManualStructure) return null;
        throw new ResourceNotFoundException("District non trouvé : " + districtId);
    }

    private Health resolveHealth(Integer healthId, boolean hasManualStructure) {
        if (healthId != null && healthId > 0) {
            return healthRepository.findById(healthId)
                    .orElseThrow(() -> new ResourceNotFoundException("Établissement non trouvé : " + healthId));
        }
        if (hasManualStructure) return null;
        throw new ResourceNotFoundException("Établissement non trouvé : " + healthId);
    }

    /** Concatène les marqueurs manuels dans le commentaire. */
    private String appendManualTags(String base, InterventionRequest request,
                                    boolean hasManualPerson, boolean hasManualEquipment,
                                    boolean hasManualStructure) {
        String result = base;
        if (hasManualPerson) {
            result = (result != null ? result : "")
                    + " | " + PERSON_TAG + " " + request.getManualPersonName().trim()
                    + (request.getManualPersonContact() != null
                    ? " | Tel: " + request.getManualPersonContact() : "")
                    + (request.getManualPersonPost() != null
                    ? " | Poste: " + request.getManualPersonPost() : "")
                    + (request.getManualPersonEmail() != null && !request.getManualPersonEmail().isBlank()
                    ? " | Email: " + request.getManualPersonEmail().trim() : "");
        }
        if (hasManualEquipment) {
            result = (result != null ? result : "")
                    + " | " + EQUIPMENT_TAG + " " + request.getManualEquipmentName().trim()
                    + (request.getManualEquipmentType() != null && !request.getManualEquipmentType().isBlank()
                    ? " | Type: " + request.getManualEquipmentType().trim() : "");
        }
        if (hasManualStructure) {
            result = (result != null ? result : "")
                    + " | " + STRUCTURE_TAG + " " + request.getManualStructureName().trim();
        }
        return result;
    }

    private Deployment resolveDeployment(InterventionRequest request, boolean hasManualEquipment) {
        Deployment deployment = null;
        if (request.getDeploymentId() != null && request.getDeploymentId() > 0)
            deployment = deploymentRepository.findById(request.getDeploymentId()).orElse(null);
        if (deployment == null && request.getHealthId() != null) {
            List<Deployment> deps = deploymentRepository.findByHealthId(request.getHealthId());
            if (!deps.isEmpty()) deployment = deps.get(0);
        }
        if (deployment == null && !hasManualEquipment)
            throw new ResourceNotFoundException("Aucun déploiement trouvé pour ce site");
        return deployment;
    }

    private Types resolveTypes(Integer typesId, Deployment deployment, boolean hasManualEquipment) {
        if (typesId != null && typesId > 0)
            return typesRepository.findById(typesId)
                    .orElseThrow(() -> new ResourceNotFoundException("Type non trouvé : " + typesId));
        if (deployment != null && deployment.getItems() != null && !deployment.getItems().isEmpty())
            return deployment.getItems().get(0).getAcquisition().getTypes();
        if (hasManualEquipment) return null;
        throw new ResourceNotFoundException("Impossible de déterminer le type d'équipement");
    }

    private Apps resolveApps(Integer appsId, Deployment deployment, boolean hasManualEquipment) {
        if (appsId != null && appsId > 0)
            return appsRepository.findById(appsId)
                    .orElseThrow(() -> new ResourceNotFoundException("Application non trouvée : " + appsId));
        if (deployment != null && deployment.getApps() != null)
            return deployment.getApps();
        if (hasManualEquipment) return null;
        throw new ResourceNotFoundException("Impossible de déterminer l'application");
    }

    private void saveItemStatesByIds(InterventionRequest request) {
        if (request.getSelectedItemIds() == null || request.getSelectedItemIds().isEmpty()) return;
        request.getSelectedItemIds().forEach(itemId -> {
            deploymentItemRepository.findById(itemId).ifPresent(item -> {
                boolean changed = false;
                if (request.getEtatsAvant() != null && request.getEtatsAvant().containsKey(itemId)) {
                    item.setEtatAvant(request.getEtatsAvant().get(itemId)); changed = true;
                }
                if (request.getEtatsApres() != null && request.getEtatsApres().containsKey(itemId)) {
                    String etatApres = request.getEtatsApres().get(itemId);
                    item.setEtatApres(etatApres);
                    if ("EN_LIGNE".equals(request.getTypeInter())) {
                        item.setStatus("NON_FONCTIONNEL".equals(etatApres) || "DEGRADE".equals(etatApres)
                                ? "EN_ATTENTE_INTERVENTION_SITE" : etatApres);
                    } else {
                        Boolean reussie = request.getMaintenanceReussie() != null
                                ? request.getMaintenanceReussie().get(itemId) : null;
                        if (Boolean.TRUE.equals(reussie)) {
                            item.setStatus("FONCTIONNEL"); item.setEtatApres("FONCTIONNEL");
                        } else if (request.getReplacements() != null && request.getReplacements().containsKey(itemId)) {
                            item.setStatus("REMPLACE");
                        } else {
                            item.setStatus(etatApres);
                        }
                    }
                    changed = true;
                }
                if (request.getReplacements() != null && request.getReplacements().containsKey(itemId)) {
                    Integer newAcqId = request.getReplacements().get(itemId);
                    if (newAcqId != null && newAcqId > 0) {
                        acquisitionRepository.findById(Long.valueOf(newAcqId)).ifPresent(newAcq -> {
                            Acquisition oldAcq = item.getAcquisition();
                            item.setReplacement(oldAcq);
                            oldAcq.setDeployed(false); oldAcq.setStatus("DISPONIBLE"); acquisitionRepository.save(oldAcq);
                            newAcq.setDeployed(true);  newAcq.setStatus("DEPLOYE");   acquisitionRepository.save(newAcq);
                            item.setAcquisition(newAcq); item.setStatus("FONCTIONNEL"); item.setEtatApres("FONCTIONNEL");
                        });
                    }
                    changed = true;
                }
                if (changed) deploymentItemRepository.save(item);
            });
        });
    }

    private InterventionResponse mapToResponse(Intervention intervention) {
        Partner partner = intervention.getPartner() != null
                ? intervention.getPartner()
                : (intervention.getTechnician() != null
                ? intervention.getTechnician().getPartner() : null);
        Apps apps = intervention.getApps();

        List<DeploymentItemResponse> deploymentItems = new ArrayList<>();
        if (intervention.getDeployment() != null && intervention.getDeployment().getItems() != null) {
            deploymentItems = intervention.getDeployment().getItems().stream().map(item -> {
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
                        .replacementId(repl != null ? repl.getId() : null)
                        .replacementTag(repl != null ? repl.getTag() : null)
                        .replacementSerial(repl != null ? repl.getSerial() : null)
                        .replacementType(repl != null ? repl.getTypes().getTypeName() : null)
                        .build();
            }).collect(Collectors.toList());
        }

        String personName = null, personContact = null, personPost = null, manualPersonEmail = null;
        Integer personId = null;
        String manualEquipmentName = null, manualEquipmentType = null, manualStructureName = null;

        if (intervention.getBooklet() != null) {
            Booklet b = intervention.getBooklet();
            personName    = b.getLastName() + " " + b.getFirstName();
            personId      = b.getId().intValue();
            personContact = b.getContact();
            personPost    = b.getPost() != null ? b.getPost().getPostName() : null;
            manualPersonEmail = b.getEmail();
        } else if (intervention.getPerson() != null) {
            Person p = intervention.getPerson();
            personName = p.getFirstName() + " " + p.getLastName();
            personId   = p.getId();
        }

        if (intervention.getCommentInter() != null) {
            String comment = intervention.getCommentInter();

            if (personName == null && comment.contains(PERSON_TAG)) {
                int startIdx = comment.indexOf(PERSON_TAG + " ");
                if (startIdx >= 0) {
                    String rest = comment.substring(startIdx + (PERSON_TAG + " ").length());
                    String[] parts = rest.split(" \\| ");
                    if (parts.length > 0) personName = parts[0].trim();
                    for (String part : parts) {
                        if (part.startsWith("Tel: "))    personContact = part.substring(5).trim();
                        if (part.startsWith("Poste: "))  personPost    = part.substring(7).trim();
                        if (part.startsWith("Email: "))  manualPersonEmail = part.substring(7).trim();
                    }
                }
            }

            if (comment.contains(EQUIPMENT_TAG)) {
                int startIdx = comment.indexOf(EQUIPMENT_TAG + " ");
                if (startIdx >= 0) {
                    String rest = comment.substring(startIdx + (EQUIPMENT_TAG + " ").length());
                    String[] parts = rest.split(" \\| ");
                    if (parts.length > 0) manualEquipmentName = parts[0].trim();
                    for (String part : parts) {
                        if (part.startsWith("Type: ")) manualEquipmentType = part.substring(6).trim();
                    }
                }
            }

            if (comment.contains(STRUCTURE_TAG)) {
                int startIdx = comment.indexOf(STRUCTURE_TAG + " ");
                if (startIdx >= 0) {
                    String rest = comment.substring(startIdx + (STRUCTURE_TAG + " ").length());
                    // s'arrête au prochain marqueur " | [" s'il y en a un après
                    int nextTag = rest.indexOf(" | [");
                    manualStructureName = (nextTag >= 0 ? rest.substring(0, nextTag) : rest).trim();
                }
            }
        }

        return InterventionResponse.builder()
                .id(intervention.getId()).codeInter(intervention.getCodeInter())
                .typeInter(intervention.getTypeInter()).actionInter(intervention.getActionInter())
                .commentInter(intervention.getCommentInter()).dateInter(intervention.getDateInter())
                .durationMinutes(intervention.getDurationMinutes())
                .regionName(intervention.getRegion() != null ? intervention.getRegion().getRegionName() : manualStructureName)
                .districtName(intervention.getDistrict() != null ? intervention.getDistrict().getDistrictName() : null)
                .healthName(intervention.getHealth() != null ? intervention.getHealth().getHealthName() : manualStructureName)
                .typeName(intervention.getTypes() != null
                        ? intervention.getTypes().getTypeName() : manualEquipmentType)
                .evlName(intervention.getEvaluation().getEvlName())
                .regionId(intervention.getRegion()     != null ? intervention.getRegion().getId()     : null)
                .districtId(intervention.getDistrict() != null ? intervention.getDistrict().getId()   : null)
                .healthId(intervention.getHealth()     != null ? intervention.getHealth().getId()     : null)
                .deploymentId(intervention.getDeployment() != null ? intervention.getDeployment().getId() : null)
                .evaluationId(intervention.getEvaluation() != null ? intervention.getEvaluation().getId() : null)
                .typesId(intervention.getTypes() != null ? intervention.getTypes().getId() : null)
                .appsId(apps != null ? apps.getId() : null)
                .deploymentCode(intervention.getDeployment() != null ? intervention.getDeployment().getCodeDep() : null)
                .deploymentItems(deploymentItems)
                .appName(apps != null ? apps.getAppName() : null)
                .appsIcon(apps  != null && apps.getIcon()  != null ? apps.getIcon()  : "bi-app-indicator")
                .appsColor(apps != null && apps.getColor() != null ? apps.getColor() : "#616161")
                .appsImage(apps != null && apps.getImage() != null ? apps.getImage() : "")
                .technicianName(intervention.getTechnician() != null
                        ? intervention.getTechnician().getFirstName() + " " + intervention.getTechnician().getLastName() : null)
                .partnerName(partner  != null ? partner.getPartnerName() : null)
                .partnerLogo(partner  != null && partner.getLogo()  != null ? partner.getLogo()  : "bi-building")
                .partnerColor(partner != null && partner.getColor() != null ? partner.getColor() : "#616161")
                .partnerImage(partner != null && partner.getImage() != null ? partner.getImage() : "")
                .partnerId(partner != null ? partner.getId() : null)
                .personId(personId).personName(personName)
                .personContact(personContact).personPost(personPost)
                .enAttenteMaintenance(intervention.getEnAttenteMaintenance())
                .latitude(intervention.getLatitude())
                .longitude(intervention.getLongitude())
                .manualEquipmentName(manualEquipmentName)
                .manualEquipmentType(manualEquipmentType)
                .manualStructureName(manualStructureName)
                .personEmail(manualPersonEmail)
                .canSendEmail(manualPersonEmail != null && !manualPersonEmail.isBlank())
                .build();
    }
}