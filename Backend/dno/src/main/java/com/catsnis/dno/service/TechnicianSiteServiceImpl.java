package com.catsnis.dno.service;

import com.catsnis.dno.common.exception.ResourceNotFoundException;
import com.catsnis.dno.dto.TechnicianSiteRequest;
import com.catsnis.dno.dto.TechnicianSiteResponse;
import com.catsnis.dno.entity.*;
import com.catsnis.dno.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TechnicianSiteServiceImpl implements TechnicianSiteService {

    private final TechnicianSiteRepository technicianSiteRepository;
    private final PersonRepository         personRepository;
    private final RegionRepository         regionRepository;
    private final DistrictRepository       districtRepository;
    private final HealthRepository         healthRepository;

    private static final Set<Role> ASSIGNABLE_ROLES = Set.of(
            Role.SUPER_ADMIN, Role.ADMIN, Role.TECHNICIEN, Role.LOGISTICIEN
    );

    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    // ── Assigner ──────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public TechnicianSiteResponse assign(TechnicianSiteRequest request) {
        Person person = personRepository.findById(request.getPersonId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Personne non trouvée : " + request.getPersonId()));

        if (!ASSIGNABLE_ROLES.contains(person.getRole()))
            throw new IllegalArgumentException(
                    "Seuls les Admins, Techniciens et Logisticiens peuvent recevoir des assignations.");

        if (request.getHealthId() != null
                && technicianSiteRepository.existsByPersonIdAndHealthId(
                request.getPersonId(), request.getHealthId()))
            throw new IllegalArgumentException("Ce site est déjà assigné à cette personne.");

        TechnicianSite site = TechnicianSite.builder()
                .person(person)
                .region(resolveRegion(request.getRegionId()))
                .district(resolveDistrict(request.getDistrictId()))
                .health(resolveHealth(request.getHealthId()))
                .build();

        return mapToResponse(technicianSiteRepository.save(site));
    }

    // ── Modifier ──────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public TechnicianSiteResponse update(Integer id, TechnicianSiteRequest request) {
        TechnicianSite existing = technicianSiteRepository.findById(Long.valueOf(id))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Assignation non trouvée : " + id));

        Person person = personRepository.findById(request.getPersonId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Personne non trouvée : " + request.getPersonId()));

        if (!ASSIGNABLE_ROLES.contains(person.getRole()))
            throw new IllegalArgumentException(
                    "Seuls les Admins, Techniciens et Logisticiens peuvent recevoir des assignations.");

        existing.setPerson(person);
        existing.setRegion(resolveRegion(request.getRegionId()));
        existing.setDistrict(resolveDistrict(request.getDistrictId()));
        existing.setHealth(resolveHealth(request.getHealthId()));

        return mapToResponse(technicianSiteRepository.save(existing));
    }

    // ── Sites d'une personne (triés du plus récent au plus ancien) ────────────
    @Override
    @Transactional(readOnly = true)
    public List<TechnicianSiteResponse> getByTechnician(Integer personId) {
        return technicianSiteRepository.findByPersonIdOrderByCreatedAtDesc(personId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // ── Supprimer ─────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public void unassign(Integer id) {
        TechnicianSite site = technicianSiteRepository.findById(Long.valueOf(id))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Assignation non trouvée : " + id));
        technicianSiteRepository.delete(site);
    }

    // ── IDs utilitaires ───────────────────────────────────────────────────────
    @Override @Transactional(readOnly = true)
    public List<Integer> getHealthIdsByTechnician(Integer personId) {
        return technicianSiteRepository.findHealthIdsByPersonId(personId);
    }

    @Override @Transactional(readOnly = true)
    public List<Integer> getDistrictIdsByTechnician(Integer personId) {
        return technicianSiteRepository.findDistrictIdsByPersonId(personId);
    }

    @Override @Transactional(readOnly = true)
    public List<Integer> getRegionIdsByTechnician(Integer personId) {
        return technicianSiteRepository.findRegionIdsByPersonId(personId);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private Region   resolveRegion(Integer id) {
        if (id == null) return null;
        return regionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Région non trouvée : " + id));
    }
    private District resolveDistrict(Integer id) {
        if (id == null) return null;
        return districtRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("District non trouvé : " + id));
    }
    private Health   resolveHealth(Integer id) {
        if (id == null) return null;
        return healthRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Site non trouvé : " + id));
    }

    // ── Mapper ────────────────────────────────────────────────────────────────
    private TechnicianSiteResponse mapToResponse(TechnicianSite ts) {
        // ✅ Calculer le niveau : REGION | DISTRICT | SITE
        String niveau = ts.getHealth()   != null ? "SITE"
                : ts.getDistrict() != null ? "DISTRICT"
                : "REGION";

        return TechnicianSiteResponse.builder()
                .id(ts.getId() != null ? ts.getId().intValue() : null)
                .personId(ts.getPerson().getId())
                .technicianName(ts.getPerson().getFirstName() + " " + ts.getPerson().getLastName())
                .technicianEmail(ts.getPerson().getEmail())
                .personRole(ts.getPerson().getRole().name())
                .regionId(ts.getRegion()       != null ? ts.getRegion().getId()              : null)
                .regionName(ts.getRegion()     != null ? ts.getRegion().getRegionName()      : null)
                .districtId(ts.getDistrict()   != null ? ts.getDistrict().getId()            : null)
                .districtName(ts.getDistrict() != null ? ts.getDistrict().getDistrictName()  : null)
                .healthId(ts.getHealth()       != null ? ts.getHealth().getId()              : null)
                .healthName(ts.getHealth()     != null ? ts.getHealth().getHealthName()      : null)
                .niveau(niveau)
                // ✅ Horodatage formaté pour l'historique
                .createdAt(ts.getCreatedAt() != null ? ts.getCreatedAt().format(FMT) : null)
                .updatedAt(ts.getUpdatedAt() != null ? ts.getUpdatedAt().format(FMT) : null)
                .build();
    }
}