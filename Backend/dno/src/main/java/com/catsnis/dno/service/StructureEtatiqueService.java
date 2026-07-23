package com.catsnis.dno.service;

import com.catsnis.dno.common.exception.ResourceNotFoundException;
import com.catsnis.dno.dto.StructureEtatiqueRequest;
import com.catsnis.dno.dto.StructureEtatiqueResponse;
import com.catsnis.dno.entity.District;
import com.catsnis.dno.entity.Region;
import com.catsnis.dno.entity.StructureEtatique;
import com.catsnis.dno.repository.DistrictRepository;
import com.catsnis.dno.repository.RegionRepository;
import com.catsnis.dno.repository.StructureEtatiqueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StructureEtatiqueService {

    private final StructureEtatiqueRepository structureEtatiqueRepository;
    private final RegionRepository regionRepository;
    private final DistrictRepository districtRepository;

    public List<StructureEtatiqueResponse> getAllList() {
        return structureEtatiqueRepository.findAllByOrderByNomAsc()
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public StructureEtatiqueResponse getById(Long id) {
        return mapToResponse(structureEtatiqueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Structure étatique non trouvée : " + id)));
    }

    @Transactional
    public StructureEtatiqueResponse update(Long id, StructureEtatiqueRequest request) {
        StructureEtatique s = structureEtatiqueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Structure étatique non trouvée : " + id));
        return mapToResponse(structureEtatiqueRepository.save(build(s, request)));
    }

    @Transactional
    public void delete(Long id) {
        structureEtatiqueRepository.delete(structureEtatiqueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Structure étatique non trouvée : " + id)));
    }

    @Transactional
    public StructureEtatiqueResponse create(StructureEtatiqueRequest request) {
        return mapToResponse(structureEtatiqueRepository.save(build(new StructureEtatique(), request)));
    }

    /**
     * ✅ Utilisé par le mode "Appel / Orientation" : retrouve une structure
     * existante par nom (insensible à la casse), ou la crée à la volée si
     * elle n'existe pas encore — même principe que l'équipement hors base.
     */
    @Transactional
    public StructureEtatique findOrCreate(String nom, Integer regionId, Integer districtId, String contact) {
        return structureEtatiqueRepository.findFirstByNomIgnoreCase(nom.trim())
                .orElseGet(() -> {
                    StructureEtatiqueRequest req = new StructureEtatiqueRequest();
                    req.setNom(nom.trim());
                    req.setRegionId(regionId);
                    req.setDistrictId(districtId);
                    req.setContact(contact);
                    return structureEtatiqueRepository.save(build(new StructureEtatique(), req));
                });
    }

    private StructureEtatique build(StructureEtatique s, StructureEtatiqueRequest r) {
        s.setNom(r.getNom());
        s.setContact(r.getContact());
        // ✅ Logo facultatif — on ne l'écrase pas si non fourni lors d'une update
        if (r.getLogo() != null) {
            s.setLogo(r.getLogo().isBlank() ? null : r.getLogo());
        }
        if (r.getRegionId() != null) {
            Region region = regionRepository.findById(r.getRegionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Région non trouvée : " + r.getRegionId()));
            s.setRegion(region);
        }
        if (r.getDistrictId() != null) {
            District district = districtRepository.findById(r.getDistrictId())
                    .orElseThrow(() -> new ResourceNotFoundException("District non trouvé : " + r.getDistrictId()));
            s.setDistrict(district);
        }
        return s;
    }

    private StructureEtatiqueResponse mapToResponse(StructureEtatique s) {
        return StructureEtatiqueResponse.builder()
                .id(s.getId())
                .nom(s.getNom())
                .regionId(s.getRegion() != null ? s.getRegion().getId() : null)
                .regionName(s.getRegion() != null ? s.getRegion().getRegionName() : null)
                .districtId(s.getDistrict() != null ? s.getDistrict().getId() : null)
                .districtName(s.getDistrict() != null ? s.getDistrict().getDistrictName() : null)
                .contact(s.getContact())
                .logo(s.getLogo())
                .build();
    }
}