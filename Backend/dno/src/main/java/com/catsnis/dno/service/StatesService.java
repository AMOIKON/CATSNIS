package com.catsnis.dno.service;
import com.catsnis.dno.dto.StatesRequest;
import com.catsnis.dno.dto.StatesResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
public interface StatesService {
    StatesResponse        getStatesById(Integer id);
    Page<StatesResponse>  getAllStates(Pageable pageable, String keyword);
    StatesResponse        saveStates(StatesRequest request);
    StatesResponse        updateStates(Integer id, StatesRequest request);
    void                  deleteStates(Integer id);
}