package com.catsnis.dno.service;
import com.catsnis.dno.dto.TypesRequest;
import com.catsnis.dno.dto.TypesResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
public interface TypesService {
    TypesResponse         getTypesById(Integer id);
    Page<TypesResponse>   getAllTypes(Pageable pageable, String keyword);
    TypesResponse         saveTypes(TypesRequest request);
    TypesResponse         updateTypes(Integer id, TypesRequest request);
    void                  deleteTypes(Integer id);
}