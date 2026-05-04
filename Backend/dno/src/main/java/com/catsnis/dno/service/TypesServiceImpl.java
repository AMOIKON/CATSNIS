package com.catsnis.dno.service;

import com.catsnis.dno.common.exception.ResourceNotFoundException;
import com.catsnis.dno.dto.TypesRequest;
import com.catsnis.dno.dto.TypesResponse;
import com.catsnis.dno.entity.Types;
import com.catsnis.dno.repository.TypesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@RequiredArgsConstructor
@Service
public class TypesServiceImpl implements TypesService{


    private final TypesRepository typesRepository;
    @Override
    public TypesResponse getTypesById(Integer id) {
        Types types = typesRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Type non trouvé avec l'id : " + id));
        return mapToResponse(types);
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
                .image(request.getImage())   // ← nouveau
                .marque(request.getMarque()) // ← nouveau
                .modele(request.getModele()) // ← nouveau

                .build();
        return mapToResponse(typesRepository.save(types));
    }

    @Override
    @Transactional
    public TypesResponse updateTypes(Integer id, TypesRequest request) {
        Types types = typesRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Type non trouvé avec l'id : " + id));
        types.setTypeName(request.getTypeName());
        types.setImage(request.getImage());   // ← nouveau
        types.setMarque(request.getMarque()); // ← nouveau
        types.setModele(request.getModele()); // ← nouveau

        return mapToResponse(typesRepository.save(types));
    }

    @Override
    @Transactional
    public void deleteTypes(Integer id) {
        Types types = typesRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Type non trouvé avec l'id : " + id));
        typesRepository.delete(types);
    }

    private TypesResponse mapToResponse(Types types) {
        return TypesResponse.builder()
                .id(types.getId())
                .typeName(types.getTypeName())
                .image(types.getImage())     // ← nouveau
                .marque(types.getMarque())   // ← nouveau
                .modele(types.getModele())   // ← nouveau
                .build();
    }


}
