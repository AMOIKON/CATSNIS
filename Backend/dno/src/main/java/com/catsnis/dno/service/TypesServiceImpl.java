package com.catsnis.dno.service;

import com.catsnis.dno.common.exception.ResourceNotFoundException;
import com.catsnis.dno.dto.TypesRequest;
import com.catsnis.dno.dto.TypesResponse;
import com.catsnis.dno.entity.Image;
import com.catsnis.dno.entity.Types;
import com.catsnis.dno.repository.TypesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Base64;

@RequiredArgsConstructor
@Service
public class TypesServiceImpl implements TypesService {

    private final TypesRepository typesRepository;
    private final ImageService    imageService;   // ✅ AJOUT

    @Override
    public TypesResponse getTypesById(Integer id) {
        return mapToResponse(typesRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Type non trouvé avec l'id : " + id)));
    }

    @Override
    public Page<TypesResponse> getAllTypes(Pageable pageable, String keyword) {
        return typesRepository.findAllWithFilters(pageable, keyword)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public TypesResponse saveTypes(TypesRequest request) {
        Types types = Types.builder()
                .typeName(request.getTypeName())
                .image(request.getImage())
                .marque(request.getMarque())
                .modele(request.getModele())
                .build();

        // ✅ Charger les bytes de l'image depuis la table images
        if (request.getImage() != null && !request.getImage().isBlank()) {
            try {
                Image img = imageService.getByFileName(request.getImage());
                if (img != null && img.getData() != null) {
                    types.setData(img.getData());
                }
            } catch (Exception ignored) {}
        }

        return mapToResponse(typesRepository.save(types));
    }

    @Override
    @Transactional
    public TypesResponse updateTypes(Integer id, TypesRequest request) {
        Types types = typesRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Type non trouvé avec l'id : " + id));

        types.setTypeName(request.getTypeName());
        types.setMarque(request.getMarque());
        types.setModele(request.getModele());

        // ✅ Toujours recharger l'image depuis la table images
        if (request.getImage() != null && !request.getImage().isBlank()) {
            types.setImage(request.getImage());
            try {
                Image img = imageService.getByFileName(request.getImage());
                if (img != null && img.getData() != null) {
                    types.setData(img.getData());
                } else {
                    // ✅ Si image non trouvée, vider data pour éviter d'afficher l'ancienne
                    types.setData(null);
                }
            } catch (Exception e) {
                types.setData(null);
            }
        } else {
            // ✅ Si aucune image sélectionnée, vider les deux champs
            types.setImage(null);
            types.setData(null);
        }

        return mapToResponse(typesRepository.save(types));
    }

    @Override
    @Transactional
    public void deleteTypes(Integer id) {
        Types types = typesRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Type non trouvé avec l'id : " + id));
        typesRepository.delete(types);
    }

    private TypesResponse mapToResponse(Types types) {

        String base64 = null;
        if (types.getData() != null && types.getData().length > 0) {
            base64 = Base64.getEncoder().encodeToString(types.getData());
        }

        return TypesResponse.builder()
                .id(types.getId())
                .typeName(types.getTypeName())
                .image(types.getImage())
                .marque(types.getMarque())
                .modele(types.getModele())
                .base64(base64)
                .build();
    }
}