package com.catsnis.dno.service;

import com.catsnis.dno.common.exception.ResourceNotFoundException;
import com.catsnis.dno.dto.PartnerRequest;
import com.catsnis.dno.dto.PartnerResponse;
import com.catsnis.dno.entity.Partner;
import com.catsnis.dno.repository.PartnerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PartnerServiceImpl implements PartnerService {

    private final PartnerRepository partnerRepository;

    @Override
    @Transactional
    public PartnerResponse getPartnerById(Integer id) {
        Partner partner = partnerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Partenaire non trouvé avec l'id : " + id));
        return mapToResponse(partner);
    }

    @Override
    @Transactional
    public Page<PartnerResponse> getAllPartners(Pageable pageable, String keyword) {
        return partnerRepository.findAllWithFilters(pageable, keyword)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public PartnerResponse savePartner(PartnerRequest request) {

        // ✅ Vérification doublon
        if (partnerRepository.existsByPartnerName(request.getPartnerName())) {
            throw new IllegalArgumentException(
                    "Un partenaire avec le nom '" + request.getPartnerName() + "' existe déjà.");
        }

        Partner partner = Partner.builder()
                .partnerName(request.getPartnerName())
                .logo(request.getLogo())       // ✅ ajouté
                .color(request.getColor())     // ✅ ajouté
                .image(request.getImage())     // ✅ ajouté
                .build();
        return mapToResponse(partnerRepository.save(partner));
    }

    @Override
    @Transactional
    public PartnerResponse updatePartner(Integer id, PartnerRequest request) {
        Partner partner = partnerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Partenaire non trouvé avec l'id : " + id));

        // ✅ Vérification doublon (exclure l'enregistrement actuel)
        if (partnerRepository.existsByPartnerNameAndIdNot(
                request.getPartnerName(), id)) {
            throw new IllegalArgumentException(
                    "Un partenaire avec le nom '" + request.getPartnerName() + "' existe déjà.");
        }

        partner.setPartnerName(request.getPartnerName());
        partner.setLogo(request.getLogo());    // ✅ ajouté
        partner.setColor(request.getColor()); // ✅ ajouté
        partner.setImage(request.getImage()); // ✅ ajouté

        return mapToResponse(partnerRepository.save(partner));
    }

    @Override
    @Transactional
    public void deletePartner(Integer id) {
        Partner partner = partnerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Partenaire non trouvé avec l'id : " + id));
        partnerRepository.delete(partner);
    }

    private PartnerResponse mapToResponse(Partner partner) {
        return PartnerResponse.builder()
                .id(partner.getId())
                .partnerName(partner.getPartnerName())
                .logo(partner.getLogo())       // ✅ ajouté
                .color(partner.getColor())     // ✅ ajouté
                .image(partner.getImage())     // ✅ ajouté
                .build();
    }
}