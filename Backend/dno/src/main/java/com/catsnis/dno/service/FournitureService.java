package com.catsnis.dno.service;

import com.catsnis.dno.dto.*;
import com.catsnis.dno.entity.Fourniture.FournitureCategorie;
import com.catsnis.dno.entity.Fourniture.FournitureStatut;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Map;

public interface FournitureService {

    // ── CRUD fournitures ──────────────────────────────────────────────────────
    FournitureResponse getById(Integer id);
    Page<FournitureResponse> getAll(Pageable pageable, FournitureCategorie categorie,
                                    FournitureStatut statut, String keyword);
    List<FournitureResponse> getAllList();
    FournitureResponse save(FournitureRequest request);
    FournitureResponse update(Integer id, FournitureRequest request);
    void delete(Integer id);

    // ── Déploiements ──────────────────────────────────────────────────────────
    FournitureDeploiementResponse deployer(FournitureDeploiementRequest request);
    FournitureDeploiementResponse updateDeploiement(Integer id, FournitureDeploiementRequest request);
    void cloturerDeploiement(Integer id);
    void deleteDeploiement(Integer id);
    Page<FournitureDeploiementResponse> getDeploiements(Pageable pageable,
                                                        Integer fournitureId, Boolean active, String keyword);
    List<FournitureDeploiementResponse> getDeploiementsByFourniture(Integer fournitureId);

    // ── Stats ─────────────────────────────────────────────────────────────────
    Map<String, Long> stats();
}