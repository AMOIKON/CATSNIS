package com.catsnis.dno.service;

import com.catsnis.dno.common.exception.ResourceNotFoundException;
import com.catsnis.dno.dto.AcquisitionRequest;
import com.catsnis.dno.dto.AcquisitionResponse;
import com.catsnis.dno.entity.Acquisition;
import com.catsnis.dno.entity.Types;
import com.catsnis.dno.repository.AcquisitionRepository;
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
    private final TypesRepository typesRepository;

    @Override
    @Transactional
    public AcquisitionResponse getAcquisitionById(Integer id) {
        Acquisition acquisition = acquisitionRepository.findById(Long.valueOf(id))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Acquisition non trouvée avec l'id : " + id));
        return mapToResponse(acquisition);
    }

    @Override
    @Transactional
    public Page<AcquisitionResponse> getAllAcquisitions(Pageable pageable, Integer typesId, String keyword) {
        return acquisitionRepository.findAllWithFilters(pageable, typesId, keyword)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public AcquisitionResponse saveAcquisition(AcquisitionRequest request) {

        // ✅ Vérification doublon tag
        if (acquisitionRepository.existsByTag(request.getTag())) {
            throw new IllegalArgumentException(
                    "Une acquisition avec le tag '" + request.getTag() + "' existe déjà.");
        }

        // ✅ Vérification doublon serial
        if (acquisitionRepository.existsBySerial(request.getSerial())) {
            throw new IllegalArgumentException(
                    "Une acquisition avec le serial '" + request.getSerial() + "' existe déjà.");
        }

        Types types = typesRepository.findById(request.getTypesId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Type non trouvé avec l'id : " + request.getTypesId()));

        Acquisition acquisition = Acquisition.builder()
                .image(request.getImage())
                .tag(request.getTag())
                .dateAcq(request.getDateAcq())
                .quantity(request.getQuantity())
                .serial(request.getSerial())
                .types(types)
                .status("DISPONIBLE")
                .deployed(false)
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

        // ✅ Exclure l'enregistrement actuel de la vérification doublon
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

        return mapToResponse(acquisitionRepository.save(acquisition));
    }

    @Override
    @Transactional
    public List<AcquisitionResponse> getAvailable(Integer typesId) {
        return acquisitionRepository.findAvailable(typesId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteAcquisition(Integer id) {
        Acquisition acquisition = acquisitionRepository.findById(Long.valueOf(id))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Acquisition non trouvée avec l'id : " + id));
        acquisitionRepository.delete(acquisition);
    }

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
                .build();
    }
}