package com.catsnis.dno.service;

import com.catsnis.dno.common.exception.ResourceNotFoundException;
import com.catsnis.dno.dto.PartnerRequest;
import com.catsnis.dno.dto.PartnerResponse;
import com.catsnis.dno.entity.Image;
import com.catsnis.dno.entity.Partner;
import com.catsnis.dno.repository.PartnerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Base64;

@Service
@RequiredArgsConstructor
public class PartnerServiceImpl implements PartnerService {

    private final PartnerRepository partnerRepository;
    private final ImageService      imageService;   // ✅ AJOUT

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
        if (partnerRepository.existsByPartnerName(request.getPartnerName())) {
            throw new IllegalArgumentException(
                    "Un partenaire avec le nom '" + request.getPartnerName() + "' existe déjà.");
        }
        Partner partner = Partner.builder()
                .partnerName(request.getPartnerName())
                .logo(request.getLogo())
                .color(request.getColor())
                .image(request.getImage())
                .build();
        return mapToResponse(partnerRepository.save(partner));
    }

    @Override
    @Transactional
    public PartnerResponse updatePartner(Integer id, PartnerRequest request) {
        Partner partner = partnerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Partenaire non trouvé avec l'id : " + id));
        if (partnerRepository.existsByPartnerNameAndIdNot(request.getPartnerName(), id)) {
            throw new IllegalArgumentException(
                    "Un partenaire avec le nom '" + request.getPartnerName() + "' existe déjà.");
        }
        partner.setPartnerName(request.getPartnerName());
        partner.setLogo(request.getLogo());
        partner.setColor(request.getColor());
        partner.setImage(request.getImage());
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
        // ✅ Résolution base64 depuis la table images
        String base64 = null;
        String fileName = partner.getImage();
        if (fileName != null && !fileName.isBlank()) {
            try {
                Image image = imageService.getByFileName(fileName);
                if (image != null && image.getData() != null && image.getData().length > 0) {
                    String mime = image.getMimeType() != null ? image.getMimeType() : "image/png";
                    base64 = "data:" + mime + ";base64,"
                            + Base64.getEncoder().encodeToString(image.getData());
                }
            } catch (Exception ignored) {}
        }
        return PartnerResponse.builder()
                .id(partner.getId())
                .partnerName(partner.getPartnerName())
                .logo(partner.getLogo())
                .color(partner.getColor())
                .image(fileName != null ? fileName : "")
                .base64(base64)   // ✅ AJOUT
                .build();
    }
}