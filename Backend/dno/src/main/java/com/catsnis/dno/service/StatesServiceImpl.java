package com.catsnis.dno.service;

import com.catsnis.dno.common.exception.ResourceNotFoundException;
import com.catsnis.dno.dto.StatesRequest;
import com.catsnis.dno.dto.StatesResponse;
import com.catsnis.dno.entity.States;
import com.catsnis.dno.repository.StatesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StatesServiceImpl  implements StatesService{
    private final StatesRepository statesRepository;

    @Override
    @Transactional
    public StatesResponse getStatesById(Integer id) {
        States states = statesRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("State non trouvé avec l'id : " + id));
        return mapToResponse(states);
    }

    @Override
    @Transactional
    public Page<StatesResponse> getAllStates(Pageable pageable, String keyword) {
        return statesRepository.findAllWithFilters(pageable, keyword)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public StatesResponse saveStates(StatesRequest request) {
        States states = States.builder()
                .statesName(request.getStatesName())
                .build();
        return mapToResponse(statesRepository.save(states));
    }

    @Override
    @Transactional
    public StatesResponse updateStates(Integer id, StatesRequest request) {
        States states = statesRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("State non trouvé avec l'id : " + id));
        states.setStatesName(request.getStatesName());
        return mapToResponse(statesRepository.save(states));
    }

    @Override
    @Transactional
    public void deleteStates(Integer id) {
        States states = statesRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("State non trouvé avec l'id : " + id));
        statesRepository.delete(states);
    }

    private StatesResponse mapToResponse(States states) {
        return StatesResponse.builder()
                .id(states.getId())
                .statesName(states.getStatesName())
                .build();
    }
}
