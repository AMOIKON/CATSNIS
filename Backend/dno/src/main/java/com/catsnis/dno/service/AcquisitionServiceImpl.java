package com.catsnis.dno.service;

import com.catsnis.dno.common.exception.ResourceNotFoundException;
import com.catsnis.dno.common.utils.SecurityUtils;
import com.catsnis.dno.dto.AcquisitionRequest;
import com.catsnis.dno.dto.AcquisitionResponse;
import com.catsnis.dno.entity.Acquisition;
import com.catsnis.dno.entity.Partner;
import com.catsnis.dno.entity.Types;
import com.catsnis.dno.repository.AcquisitionRepository;
import com.catsnis.dno.repository.PartnerRepository;
import com.catsnis.dno.repository.TypesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AcquisitionServiceImpl implements AcquisitionService {

    private final AcquisitionRepository acquisitionRepository;
    private final TypesRepository       typesRepository;
    private final PartnerRepository     partnerRepository;
    private final SecurityUtils         securityUtils;

    @Override
    @Transactional
    public AcquisitionResponse getAcquisitionById(Integer id) {
        return mapToResponse(acquisitionRepository.findById(Long.valueOf(id))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Acquisition non trouvée avec l'id : " + id)));
    }

    @Override
    @Transactional
    public Page<AcquisitionResponse> getAllAcquisitions(
            Pageable pageable, Integer typesId, String keyword) {

        Long partnerFilter = securityUtils.getPartnerIdFilter();

        if (partnerFilter == null) {
            return acquisitionRepository
                    .findAllWithFilters(pageable, typesId, keyword)
                    .map(this::mapToResponse);
        }
        if (partnerFilter == -1L) {
            return acquisitionRepository
                    .findAllWithFiltersAndPartnerNull(pageable, typesId, keyword)
                    .map(this::mapToResponse);
        }
        return acquisitionRepository
                .findAllWithFiltersAndPartner(pageable, typesId, keyword, partnerFilter)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public AcquisitionResponse saveAcquisition(AcquisitionRequest request) {

        if (acquisitionRepository.existsByTag(request.getTag())) {
            throw new IllegalArgumentException(
                    "Une acquisition avec le tag '" + request.getTag() + "' existe déjà.");
        }
        if (acquisitionRepository.existsBySerial(request.getSerial())) {
            throw new IllegalArgumentException(
                    "Une acquisition avec le serial '" + request.getSerial() + "' existe déjà.");
        }

        Types types = typesRepository.findById(request.getTypesId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Type non trouvé avec l'id : " + request.getTypesId()));

        // ✅ Phase 2 — Résolution du partenaire (priorité : utilisateur connecté)
        Partner partner = null;
        Long currentPartnerId = securityUtils.getCurrentPartnerId();
        if (currentPartnerId != null) {
            // Utilisateur avec partenaire → auto-assignation
            partner = partnerRepository.findById(currentPartnerId.intValue()).orElse(null);
        } else if (request.getPartnerId() != null && request.getPartnerId() > 0) {
            // SUPER_ADMIN sans partenaire → utilise le partenaire choisi dans le formulaire
            partner = partnerRepository.findById(request.getPartnerId()).orElse(null);
        }

        Acquisition acquisition = Acquisition.builder()
                .image(request.getImage())
                .tag(request.getTag())
                .dateAcq(request.getDateAcq())
                .quantity(request.getQuantity())
                .serial(request.getSerial())
                .types(types)
                .status("DISPONIBLE")
                .deployed(false)
                .partner(partner)
                .build();

        return mapToResponse(acquisitionRepository.save(acquisition));
    }

    @Override
    @Transactional
    public AcquisitionResponse updateAcquisition(Integer id, AcquisitionRequest request) {
        Acquisition acquisition = acquisitionRepository.findById(Long.valueOf(id))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Acquisition non trouvée avec l'id : " + id));

        Types types = typesRepository.findById(request.getTypesId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Type non trouvé avec l'id : " + request.getTypesId()));

        if (acquisitionRepository.existsByTagAndIdNot(request.getTag(), Long.valueOf(id))) {
            throw new IllegalArgumentException(
                    "Une acquisition avec le tag '" + request.getTag() + "' existe déjà.");
        }
        if (acquisitionRepository.existsBySerialAndIdNot(request.getSerial(), Long.valueOf(id))) {
            throw new IllegalArgumentException(
                    "Une acquisition avec le serial '" + request.getSerial() + "' existe déjà.");
        }

        acquisition.setImage(request.getImage());
        acquisition.setTag(request.getTag());
        acquisition.setDateAcq(request.getDateAcq());
        acquisition.setQuantity(request.getQuantity());
        acquisition.setSerial(request.getSerial());
        acquisition.setTypes(types);

        // ✅ Phase 2 — SUPER_ADMIN/ITECH peut réassigner le partenaire librement
        if (securityUtils.isUnrestricted()) {
            if (request.getPartnerId() != null && request.getPartnerId() > 0) {
                // Partenaire explicitement choisi dans le formulaire
                partnerRepository.findById(request.getPartnerId())
                        .ifPresent(acquisition::setPartner);
            } else if (request.getPartnerId() != null && request.getPartnerId() == 0) {
                // Valeur 0 = désassigner le partenaire
                acquisition.setPartner(null);
            }
            // Si partnerId est null → on ne touche pas au partenaire existant
        }

        return mapToResponse(acquisitionRepository.save(acquisition));
    }

    @Override
    @Transactional
    public List<AcquisitionResponse> getAvailable(Integer typesId) {
        Long partnerFilter = securityUtils.getPartnerIdFilter();

        if (partnerFilter == null) {
            return acquisitionRepository.findAvailable(typesId)
                    .stream().map(this::mapToResponse).collect(Collectors.toList());
        }
        if (partnerFilter == -1L) {
            return acquisitionRepository.findAvailableAndPartnerNull(typesId)
                    .stream().map(this::mapToResponse).collect(Collectors.toList());
        }
        return acquisitionRepository.findAvailableByPartner(typesId, partnerFilter)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteAcquisition(Integer id) {
        Acquisition acquisition = acquisitionRepository.findById(Long.valueOf(id))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Acquisition non trouvée avec l'id : " + id));
        acquisitionRepository.delete(acquisition);
    }

    // ── Mapping ───────────────────────────────────────────────────────────────

    private AcquisitionResponse mapToResponse(Acquisition acquisition) {
        return AcquisitionResponse.builder()
                .id(acquisition.getId())
                .image(acquisition.getImage())
                .tag(acquisition.getTag())
                .dateAcq(acquisition.getDateAcq())
                .quantity(acquisition.getQuantity())
                .serial(acquisition.getSerial())
                .Type(acquisition.getTypes().getTypeName())
                .status(acquisition.getStatus())
                .deployed(acquisition.getDeployed())
                // ✅ Phase 2 — retourner le partenaire au frontend
                .partnerName(acquisition.getPartner() != null
                        ? acquisition.getPartner().getPartnerName() : null)
                .partnerId(acquisition.getPartner() != null
                        ? acquisition.getPartner().getId() : null)
                .build();
    }
}