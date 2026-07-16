package com.catsnis.dno.service;

import com.catsnis.dno.dto.InterventionRequest;
import com.catsnis.dno.dto.InterventionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface InterventionService {

    InterventionResponse         getInterventionById(Integer id);

    Page<InterventionResponse>   getAllInterventions(Pageable pageable,
                                                     Integer regionId,
                                                     Integer districtId,
                                                     Integer healthId,
                                                     String  keyword);

    InterventionResponse         saveIntervention(InterventionRequest request);

    InterventionResponse         updateIntervention(Integer id, InterventionRequest request);

    void                         deleteIntervention(Integer id);

    Long                         getTotalMinutesEnLigne();

    Long                         getTotalMinutesSurSite();

    Long                         getTotalMinutesGlobal();

    // ── Assistances techniques (équipement hors base) ──────────────────────────
    Long                         getTotalHorsBase();

    // ── Fiche PDF de l'intervention — téléchargement direct, plus d'envoi SMTP
    byte[]                       generateInterventionPdf(Integer id);
}