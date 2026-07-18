package com.catsnis.dno.service;

import com.catsnis.dno.common.exception.ResourceNotFoundException;
import com.catsnis.dno.dto.*;
import com.catsnis.dno.entity.*;
import com.catsnis.dno.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehiculeServiceImpl implements VehiculeService {

    private final VehiculeRepository                    vehiculeRepository;
    private final VehiculeIncidentRepository            incidentRepository;
    private final VehiculeMaintenanceRepository         maintenanceRepository;
    private final PersonRepository                      personRepository;
    private final RegionRepository                      regionRepository;
    private final DistrictRepository                    districtRepository;
    private final VehiculeAffectationRepository         affectationRepository;
    private final BookletRepository                     bookletRepository;
    private final VehiculeDocumentHistoriqueRepository  documentHistoriqueRepository;
    private final VehiculePdfService                     vehiculePdfService;
    private final ArchiveService                         archiveService;

    // ── Véhicules ─────────────────────────────────────────────────────────────

    @Override
    public VehiculeResponse getById(Integer id) {
        return mapToResponse(vehiculeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Engin non trouvé : " + id)));
    }

    @Override
    public Page<VehiculeResponse> getAll(Pageable pageable, VehiculeType type,
                                         String statut, Integer regionId, String keyword) {
        return vehiculeRepository.findAllWithFilters(pageable, type, statut, regionId, null, keyword)
                .map(this::mapToResponse);
    }

    @Override
    public List<VehiculeResponse> getAllList() {
        return vehiculeRepository.findAll().stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override @Transactional
    public VehiculeResponse save(VehiculeRequest request) {
        if (vehiculeRepository.existsByImmatriculation(request.getImmatriculation()))
            throw new IllegalArgumentException("Immatriculation déjà existante : " + request.getImmatriculation());
        return mapToResponse(vehiculeRepository.save(buildVehicule(new Vehicule(), request)));
    }

    @Override @Transactional
    public VehiculeResponse update(Integer id, VehiculeRequest request) {
        Vehicule v = vehiculeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Engin non trouvé : " + id));
        if (vehiculeRepository.existsByImmatriculationAndIdNot(request.getImmatriculation(), id))
            throw new IllegalArgumentException("Immatriculation déjà existante : " + request.getImmatriculation());
        return mapToResponse(vehiculeRepository.save(buildVehicule(v, request)));
    }

    @Override @Transactional
    public void delete(Integer id) {
        vehiculeRepository.delete(vehiculeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Engin non trouvé : " + id)));
    }

    // ── Historique complet ────────────────────────────────────────────────────

    @Override
    public VehiculeHistoriqueResponse getHistorique(Integer vehiculeId) {
        Vehicule v = vehiculeRepository.findById(vehiculeId)
                .orElseThrow(() -> new ResourceNotFoundException("Engin non trouvé : " + vehiculeId));

        Pageable all = PageRequest.of(0, 100);

        List<VehiculeAffectationResponse> affectations = affectationRepository
                .findAllWithFilters(all, vehiculeId, null, null)
                .getContent().stream().map(this::mapAffectationToResponse).collect(Collectors.toList());

        List<VehiculeIncidentResponse> incidents = incidentRepository
                .findAllWithFilters(all, vehiculeId, null, null)
                .getContent().stream().map(this::mapIncidentToResponse).collect(Collectors.toList());

        List<VehiculeMaintenanceResponse> maintenances = maintenanceRepository
                .findAllWithFilters(all, vehiculeId, null, null)
                .getContent().stream().map(this::mapMaintenanceToResponse).collect(Collectors.toList());

        List<VehiculeAlertResponse> alertes = getAlertes(365).stream()
                .filter(a -> a.getId().equals(vehiculeId))
                .collect(Collectors.toList());

        // ✅ Historique renouvellements documents
        List<VehiculeDocumentHistoriqueResponse> documentsHistorique =
                getDocumentsHistorique(vehiculeId);

        return VehiculeHistoriqueResponse.builder()
                .id(v.getId())
                .immatriculation(v.getImmatriculation())
                .type(v.getType())
                .marque(v.getMarque())
                .modele(v.getModele())
                .couleur(v.getCouleur())
                .dateAcquisition(v.getDateAcquisition())
                .kilometrage(v.getKilometrage())
                .statut(v.getStatut())
                .numeroCarteGrise(v.getNumeroCarteGrise())
                .regionName(v.getRegion()    != null ? v.getRegion().getRegionName()      : null)
                .districtName(v.getDistrict() != null ? v.getDistrict().getDistrictName() : null)
                .conducteurNom(v.getConducteur() != null
                        ? v.getConducteur().getFirstName() + " " + v.getConducteur().getLastName() : null)
                .observations(v.getObservations())
                .image(v.getImage())
                .dateFinAssurance(v.getDateFinAssurance())
                .assuranceExpiree(estExpire(v.getDateFinAssurance()))
                .assuranceBientotExpiree(bientotExpire(v.getDateFinAssurance(), 30))
                .dateFinVisiteTechnique(v.getDateFinVisiteTechnique())
                .visiteTechniqueExpiree(estExpire(v.getDateFinVisiteTechnique()))
                .visiteTechniqueBientotExpiree(bientotExpire(v.getDateFinVisiteTechnique(), 30))
                .dateFinVignette(v.getDateFinVignette())
                .vignetteExpiree(estExpire(v.getDateFinVignette()))
                .vignetteBientotExpiree(bientotExpire(v.getDateFinVignette(), 30))
                .affectations(affectations)
                .incidents(incidents)
                .maintenances(maintenances)
                .alertes(alertes)
                .documentsHistorique(documentsHistorique)
                .build();
    }

    // ── Incidents ─────────────────────────────────────────────────────────────

    @Override @Transactional
    public VehiculeIncidentResponse saveIncident(VehiculeIncidentRequest request) {
        Vehicule v = vehiculeRepository.findById(request.getVehiculeId())
                .orElseThrow(() -> new ResourceNotFoundException("Engin non trouvé"));
        VehiculeIncident incident = VehiculeIncident.builder()
                .vehicule(v)
                .dateIncident(request.getDateIncident())
                .description(request.getDescription())
                .typeIncident(request.getTypeIncident())
                .statut(request.getStatut() != null ? request.getStatut() : "OUVERT")
                .coutEstime(request.getCoutEstime())
                .signalePar(request.getSignalePar())
                .lieuIncident(request.getLieuIncident())
                .observations(request.getObservations())
                .build();
        return mapIncidentToResponse(incidentRepository.save(incident));
    }

    @Override @Transactional
    public VehiculeIncidentResponse updateIncident(Integer id, VehiculeIncidentRequest request) {
        VehiculeIncident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident non trouvé : " + id));
        incident.setDateIncident(request.getDateIncident());
        incident.setDescription(request.getDescription());
        incident.setTypeIncident(request.getTypeIncident());
        incident.setStatut(request.getStatut());
        incident.setCoutEstime(request.getCoutEstime());
        incident.setSignalePar(request.getSignalePar());
        incident.setLieuIncident(request.getLieuIncident());
        incident.setObservations(request.getObservations());
        return mapIncidentToResponse(incidentRepository.save(incident));
    }

    @Override @Transactional
    public void deleteIncident(Integer id) {
        incidentRepository.delete(incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident non trouvé : " + id)));
    }

    @Override
    public Page<VehiculeIncidentResponse> getIncidents(Pageable pageable,
                                                       Integer vehiculeId, String statut, String keyword) {
        return incidentRepository.findAllWithFilters(pageable, vehiculeId, statut, keyword)
                .map(this::mapIncidentToResponse);
    }

    // ── Maintenances ──────────────────────────────────────────────────────────

    @Override @Transactional
    public VehiculeMaintenanceResponse saveMaintenance(VehiculeMaintenanceRequest request) {
        Vehicule v = vehiculeRepository.findById(request.getVehiculeId())
                .orElseThrow(() -> new ResourceNotFoundException("Engin non trouvé"));
        VehiculeMaintenance m = VehiculeMaintenance.builder()
                .vehicule(v)
                .dateMaintenance(request.getDateMaintenance())
                .typeMaintenance(request.getTypeMaintenance())
                .description(request.getDescription())
                .prestataire(request.getPrestataire())
                .coutReel(request.getCoutReel())
                .statut(request.getStatut() != null ? request.getStatut() : "PLANIFIEE")
                .kilometrageIntervention(request.getKilometrageIntervention())
                .observations(request.getObservations())
                .build();
        return mapMaintenanceToResponse(maintenanceRepository.save(m));
    }

    @Override @Transactional
    public VehiculeMaintenanceResponse updateMaintenance(Integer id, VehiculeMaintenanceRequest request) {
        VehiculeMaintenance m = maintenanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance non trouvée : " + id));
        m.setDateMaintenance(request.getDateMaintenance());
        m.setTypeMaintenance(request.getTypeMaintenance());
        m.setDescription(request.getDescription());
        m.setPrestataire(request.getPrestataire());
        m.setCoutReel(request.getCoutReel());
        m.setStatut(request.getStatut());
        m.setKilometrageIntervention(request.getKilometrageIntervention());
        m.setObservations(request.getObservations());
        return mapMaintenanceToResponse(maintenanceRepository.save(m));
    }

    @Override @Transactional
    public void deleteMaintenance(Integer id) {
        maintenanceRepository.delete(maintenanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance non trouvée : " + id)));
    }

    @Override
    public Page<VehiculeMaintenanceResponse> getMaintenances(Pageable pageable,
                                                             Integer vehiculeId, String statut, String keyword) {
        return maintenanceRepository.findAllWithFilters(pageable, vehiculeId, statut, keyword)
                .map(this::mapMaintenanceToResponse);
    }

    // ── Affectations ──────────────────────────────────────────────────────────

    @Override @Transactional
    public VehiculeAffectationResponse affecter(VehiculeAffectationRequest request) {
        Vehicule v = vehiculeRepository.findById(request.getVehiculeId())
                .orElseThrow(() -> new ResourceNotFoundException("Engin non trouvé"));

        affectationRepository.deactivateByVehiculeId(request.getVehiculeId());

        VehiculeAffectation.VehiculeAffectationBuilder builder = VehiculeAffectation.builder()
                .vehicule(v)
                .region(request.getRegionId()   != null ? regionRepository.findById(request.getRegionId()).orElse(null)     : null)
                .district(request.getDistrictId() != null ? districtRepository.findById(request.getDistrictId()).orElse(null) : null)
                .dateAffectation(request.getDateAffectation())
                .dateRetour(request.getDateRetour())
                .motif(request.getMotif())
                .observations(request.getObservations())
                .active(true);

        // Priorité : bookletId > personId
        if (request.getBookletId() != null) {
            Booklet booklet = bookletRepository.findById(Long.valueOf(request.getBookletId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Booklet non trouvé : " + request.getBookletId()));
            builder.booklet(booklet).person(null);
            v.setConducteur(null);
        } else if (request.getPersonId() != null && request.getPersonId() != 0) {
            Person p = personRepository.findById(request.getPersonId())
                    .orElseThrow(() -> new ResourceNotFoundException("Personne non trouvée"));
            builder.person(p).booklet(null);
            v.setConducteur(p);
        }

        v.setStatut(VehiculeStatus.EN_MISSION);
        if (request.getRegionId()   != null) v.setRegion(regionRepository.findById(request.getRegionId()).orElse(null));
        if (request.getDistrictId() != null) v.setDistrict(districtRepository.findById(request.getDistrictId()).orElse(null));
        vehiculeRepository.save(v);

        return mapAffectationToResponse(affectationRepository.save(builder.build()));
    }

    @Override @Transactional
    public VehiculeAffectationResponse updateAffectation(Long id, VehiculeAffectationRequest request) {
        VehiculeAffectation aff = affectationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Affectation non trouvée : " + id));
        aff.setDateRetour(request.getDateRetour());
        aff.setMotif(request.getMotif());
        aff.setObservations(request.getObservations());
        return mapAffectationToResponse(affectationRepository.save(aff));
    }

    @Override @Transactional
    public void cloturerAffectation(Integer vehiculeId) {
        affectationRepository.deactivateByVehiculeId(vehiculeId);
        vehiculeRepository.findById(vehiculeId).ifPresent(v -> {
            v.setStatut(VehiculeStatus.DISPONIBLE);
            v.setConducteur(null);
            vehiculeRepository.save(v);
        });
    }

    @Override
    public Page<VehiculeAffectationResponse> getAffectations(Pageable pageable,
                                                             Integer vehiculeId, Integer personId, Boolean active) {
        return affectationRepository.findAllWithFilters(pageable, vehiculeId, personId, active)
                .map(this::mapAffectationToResponse);
    }

    @Override
    public VehiculeAffectationResponse getAffectationActive(Integer vehiculeId) {
        return affectationRepository.findByVehiculeIdAndActiveTrue(vehiculeId)
                .map(this::mapAffectationToResponse)
                .orElse(null);
    }

    // ── Alertes ───────────────────────────────────────────────────────────────

    @Override
    public List<VehiculeAlertResponse> getAlertes(Integer joursAvance) {
        int jours = joursAvance != null ? joursAvance : 30;
        Date now   = new Date();
        Date limit = new Date(now.getTime() + TimeUnit.DAYS.toMillis(jours));
        List<VehiculeAlertResponse> alertes = new ArrayList<>();
        vehiculeRepository.findAssurancesExpirees(limit).forEach(v -> {
            int j = (int) TimeUnit.MILLISECONDS.toDays(v.getDateFinAssurance().getTime() - now.getTime());
            alertes.add(buildAlerte(v, "ASSURANCE", v.getDateFinAssurance(), j));
        });
        vehiculeRepository.findVisitesTechniquesExpirees(limit).forEach(v -> {
            int j = (int) TimeUnit.MILLISECONDS.toDays(v.getDateFinVisiteTechnique().getTime() - now.getTime());
            alertes.add(buildAlerte(v, "VISITE_TECHNIQUE", v.getDateFinVisiteTechnique(), j));
        });
        vehiculeRepository.findVignettesExpirees(limit).forEach(v -> {
            int j = (int) TimeUnit.MILLISECONDS.toDays(v.getDateFinVignette().getTime() - now.getTime());
            alertes.add(buildAlerte(v, "VIGNETTE", v.getDateFinVignette(), j));
        });
        alertes.sort(Comparator.comparingInt(VehiculeAlertResponse::getJoursRestants));
        return alertes;
    }

    // ── Renouvellement documents ──────────────────────────────────────────────

    @Override @Transactional
    public VehiculeDocumentHistoriqueResponse renouvelerDocument(Integer vehiculeId,
                                                                 VehiculeDocumentRenewalRequest request) {
        Vehicule v = vehiculeRepository.findById(vehiculeId)
                .orElseThrow(() -> new ResourceNotFoundException("Engin non trouvé : " + vehiculeId));

        Date ancienneDebut = null;
        Date ancienneFin   = null;

        switch (request.getTypeDocument()) {
            case "ASSURANCE" -> {
                ancienneDebut = v.getDateAssurance();
                ancienneFin   = v.getDateFinAssurance();
                v.setDateAssurance(request.getNouvelleDateDebut());
                v.setDateFinAssurance(request.getNouvelleDateFin());
            }
            case "VISITE_TECHNIQUE" -> {
                ancienneDebut = v.getDateVisiteTechnique();
                ancienneFin   = v.getDateFinVisiteTechnique();
                v.setDateVisiteTechnique(request.getNouvelleDateDebut());
                v.setDateFinVisiteTechnique(request.getNouvelleDateFin());
            }
            case "VIGNETTE" -> {
                ancienneDebut = v.getDateVignette();
                ancienneFin   = v.getDateFinVignette();
                v.setDateVignette(request.getNouvelleDateDebut());
                v.setDateFinVignette(request.getNouvelleDateFin());
            }
            default -> throw new IllegalArgumentException("Type document invalide : " + request.getTypeDocument());
        }
        vehiculeRepository.save(v);

        VehiculeDocumentHistorique hist = VehiculeDocumentHistorique.builder()
                .vehicule(v)
                .typeDocument(request.getTypeDocument())
                .ancienneDateDebut(ancienneDebut)
                .ancienneDateFin(ancienneFin)
                .nouvelleDateDebut(request.getNouvelleDateDebut())
                .nouvelleDateFin(request.getNouvelleDateFin())
                .dateRenouvellement(new Date())
                .notes(request.getNotes())
                .build();

        return mapDocumentHistToResponse(documentHistoriqueRepository.save(hist));
    }

    @Override
    public List<VehiculeDocumentHistoriqueResponse> getDocumentsHistorique(Integer vehiculeId) {
        return documentHistoriqueRepository
                .findByVehiculeIdOrderByDateRenouvellementDesc(vehiculeId)
                .stream().map(this::mapDocumentHistToResponse).collect(Collectors.toList());
    }

    // ── Fiche PDF + archivage automatique BLOB ────────────────────────────────

    @Override
    @Transactional
    public byte[] generateVehiculePdf(Integer id) {
        Vehicule v = vehiculeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Engin non trouvé : " + id));
        try {
            byte[] pdfBytes = vehiculePdfService.generateVehiculePdf(v);

            // ✅ Archivage automatique BLOB — même mécanisme que pour les
            //    interventions et déploiements. Dédoublonné par relatedId +
            //    categorie + type=IMPRIME : un re-téléchargement remplace
            //    l'archive existante au lieu d'en créer une nouvelle.
            archiveService.archiverPdfGenere(
                    pdfBytes,
                    "Fiche engin - " + v.getImmatriculation(),
                    Archive.CategorieArchive.VEHICULE,
                    Long.valueOf(v.getId()),
                    v.getImmatriculation()
            );

            return pdfBytes;
        } catch (Exception e) {
            throw new RuntimeException("Erreur génération PDF véhicule : " + e.getMessage(), e);
        }
    }

    // ── Consultation publique (QR code) ───────────────────────────────────────

    @Override
    public PublicVehiculeResponse getPublicSummary(Integer id) {
        Vehicule v = vehiculeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Engin non trouvé : " + id));

        String conducteurNom = null;
        if (v.getConducteur() != null) {
            conducteurNom = v.getConducteur().getFirstName() + " " + v.getConducteur().getLastName();
        } else if (v.getConducteurBooklet() != null) {
            conducteurNom = v.getConducteurBooklet().getFirstName() + " " + v.getConducteurBooklet().getLastName();
        }

        return PublicVehiculeResponse.builder()
                .immatriculation(v.getImmatriculation())
                .type(v.getType() != null ? v.getType().name() : null)
                .marque(v.getMarque())
                .modele(v.getModele())
                .couleur(v.getCouleur())
                .statut(v.getStatut() != null ? v.getStatut().name() : null)
                .kilometrage(v.getKilometrage())
                .regionName(v.getRegion() != null ? v.getRegion().getRegionName() : null)
                .districtName(v.getDistrict() != null ? v.getDistrict().getDistrictName() : null)
                .conducteurNom(conducteurNom)
                .dateFinAssurance(v.getDateFinAssurance())
                .dateFinVisiteTechnique(v.getDateFinVisiteTechnique())
                .dateFinVignette(v.getDateFinVignette())
                .build();
    }

    // ── Helpers privés ────────────────────────────────────────────────────────

    private VehiculeAlertResponse buildAlerte(Vehicule v, String typeAlerte, Date dateExp, int joursRestants) {
        return VehiculeAlertResponse.builder()
                .id(v.getId()).immatriculation(v.getImmatriculation())
                .vehiculeType(v.getType().name()).typeAlerte(typeAlerte)
                .niveau(joursRestants <= 0 ? "EXPIRE" : "BIENTOT_EXPIRE")
                .dateExpiration(dateExp).joursRestants(joursRestants).build();
    }

    private Vehicule buildVehicule(Vehicule v, VehiculeRequest r) {
        v.setImmatriculation(r.getImmatriculation());
        v.setType(r.getType());
        v.setMarque(r.getMarque());
        v.setModele(r.getModele());
        v.setCouleur(r.getCouleur());
        v.setDateAcquisition(r.getDateAcquisition());
        v.setKilometrage(r.getKilometrage());
        if (r.getStatut() != null) v.setStatut(VehiculeStatus.valueOf(r.getStatut()));
        v.setNumeroCarteGrise(r.getNumeroCarteGrise());
        v.setDateAssurance(r.getDateAssurance());
        v.setDateFinAssurance(r.getDateFinAssurance());
        v.setDateVisiteTechnique(r.getDateVisiteTechnique());
        v.setDateFinVisiteTechnique(r.getDateFinVisiteTechnique());
        v.setDateVignette(r.getDateVignette());
        v.setDateFinVignette(r.getDateFinVignette());
        v.setImage(r.getImage());
        v.setObservations(r.getObservations());
        // Conducteur : booklet prioritaire sur Person système
        if (r.getConducteurBookletId() != null) {
            bookletRepository.findById(Long.valueOf(r.getConducteurBookletId()))
                    .ifPresent(b -> { v.setConducteurBooklet(b); v.setConducteur(null); });
        } else if (r.getConducteurId() != null) {
            personRepository.findById(r.getConducteurId())
                    .ifPresent(p -> { v.setConducteur(p); v.setConducteurBooklet(null); });
        }
        // Région / District
        if (r.getRegionId() != null)
            v.setRegion(regionRepository.findById(r.getRegionId()).orElse(null));
        if (r.getDistrictId() != null)
            v.setDistrict(districtRepository.findById(r.getDistrictId()).orElse(null));
        // Champs acquisition (tous optionnels)
        v.setPrixAchat(r.getPrixAchat());
        v.setFournisseur(r.getFournisseur());
        v.setModeFinancement(r.getModeFinancement());
        v.setNumeroBonCommande(r.getNumeroBonCommande());
        v.setSourceFinancement(r.getSourceFinancement());
        return v;
    }

    private boolean bientotExpire(Date d, int j) {
        return d != null && d.before(new Date(new Date().getTime() + TimeUnit.DAYS.toMillis(j)));
    }
    private boolean estExpire(Date d) { return d != null && d.before(new Date()); }

    // mapToResponse — conducteurBooklet depuis l'entité, fallback affectation active
    private VehiculeResponse mapToResponse(Vehicule v) {
        Integer conducteurBookletId = null;
        String  conducteurActifNom  = null;

        if (v.getConducteurBooklet() != null) {
            Booklet b = v.getConducteurBooklet();
            conducteurBookletId = b.getId() != null ? b.getId().intValue() : null;
            conducteurActifNom  = b.getFirstName() + " " + b.getLastName();
        } else {
            VehiculeAffectation activeAff = affectationRepository
                    .findByVehiculeIdAndActiveTrue(v.getId()).orElse(null);
            if (activeAff != null) {
                if (activeAff.getBooklet() != null) {
                    conducteurBookletId = activeAff.getBooklet().getId() != null
                            ? activeAff.getBooklet().getId().intValue() : null;
                    conducteurActifNom  = activeAff.getBooklet().getFirstName()
                            + " " + activeAff.getBooklet().getLastName();
                } else if (activeAff.getPerson() != null) {
                    conducteurActifNom  = activeAff.getPerson().getFirstName()
                            + " " + activeAff.getPerson().getLastName();
                }
            }
        }

        return VehiculeResponse.builder()
                .id(v.getId()).immatriculation(v.getImmatriculation())
                .type(v.getType()).marque(v.getMarque()).modele(v.getModele()).couleur(v.getCouleur())
                .dateAcquisition(v.getDateAcquisition()).kilometrage(v.getKilometrage()).statut(v.getStatut())
                .numeroCarteGrise(v.getNumeroCarteGrise())
                .dateAssurance(v.getDateAssurance()).dateFinAssurance(v.getDateFinAssurance())
                .assuranceExpiree(estExpire(v.getDateFinAssurance()))
                .assuranceBientotExpiree(bientotExpire(v.getDateFinAssurance(), 30))
                .dateVisiteTechnique(v.getDateVisiteTechnique()).dateFinVisiteTechnique(v.getDateFinVisiteTechnique())
                .visiteTechniqueExpiree(estExpire(v.getDateFinVisiteTechnique()))
                .visiteTechniqueBientotExpiree(bientotExpire(v.getDateFinVisiteTechnique(), 30))
                .dateVignette(v.getDateVignette()).dateFinVignette(v.getDateFinVignette())
                .vignetteExpiree(estExpire(v.getDateFinVignette()))
                .vignetteBientotExpiree(bientotExpire(v.getDateFinVignette(), 30))
                .conducteurId(v.getConducteur() != null ? v.getConducteur().getId() : null)
                .conducteurNom(v.getConducteur() != null
                        ? v.getConducteur().getFirstName() + " " + v.getConducteur().getLastName() : null)
                .conducteurBookletId(conducteurBookletId)
                .conducteurActifNom(conducteurActifNom)
                .regionId(v.getRegion()    != null ? v.getRegion().getId()               : null)
                .regionName(v.getRegion()  != null ? v.getRegion().getRegionName()       : null)
                .districtId(v.getDistrict()   != null ? v.getDistrict().getId()          : null)
                .districtName(v.getDistrict() != null ? v.getDistrict().getDistrictName() : null)
                .image(v.getImage()).observations(v.getObservations())
                .prixAchat(v.getPrixAchat())
                .fournisseur(v.getFournisseur())
                .modeFinancement(v.getModeFinancement())
                .numeroBonCommande(v.getNumeroBonCommande())
                .sourceFinancement(v.getSourceFinancement())
                .build();
    }

    private VehiculeIncidentResponse mapIncidentToResponse(VehiculeIncident i) {
        return VehiculeIncidentResponse.builder()
                .id(i.getId()).vehiculeId(i.getVehicule().getId())
                .immatriculation(i.getVehicule().getImmatriculation())
                .vehiculeType(i.getVehicule().getType().name())
                .dateIncident(i.getDateIncident()).description(i.getDescription())
                .typeIncident(i.getTypeIncident()).statut(i.getStatut())
                .coutEstime(i.getCoutEstime()).signalePar(i.getSignalePar())
                .lieuIncident(i.getLieuIncident()).observations(i.getObservations()).build();
    }

    private VehiculeMaintenanceResponse mapMaintenanceToResponse(VehiculeMaintenance m) {
        return VehiculeMaintenanceResponse.builder()
                .id(m.getId()).vehiculeId(m.getVehicule().getId())
                .immatriculation(m.getVehicule().getImmatriculation())
                .dateMaintenance(m.getDateMaintenance()).typeMaintenance(m.getTypeMaintenance())
                .description(m.getDescription()).prestataire(m.getPrestataire())
                .coutReel(m.getCoutReel()).statut(m.getStatut())
                .kilometrageIntervention(m.getKilometrageIntervention())
                .observations(m.getObservations()).build();
    }

    private VehiculeAffectationResponse mapAffectationToResponse(VehiculeAffectation a) {
        String  nom      = null;
        String  poste    = null;
        String  contact  = null;
        Integer personId  = null;
        Long    bookletId = null;

        if (a.getBooklet() != null) {
            bookletId = a.getBooklet().getId();
            nom       = a.getBooklet().getFirstName() + " " + a.getBooklet().getLastName();
            poste     = a.getBooklet().getPost() != null ? a.getBooklet().getPost().getPostName() : null;
            contact   = a.getBooklet().getContact();
        } else if (a.getPerson() != null) {
            personId  = a.getPerson().getId();
            nom       = a.getPerson().getFirstName() + " " + a.getPerson().getLastName();
            poste     = a.getPerson().getPost() != null ? a.getPerson().getPost().getPostName() : null;
        }

        return VehiculeAffectationResponse.builder()
                .id(a.getId())
                .vehiculeId(a.getVehicule().getId())
                .immatriculation(a.getVehicule().getImmatriculation())
                .vehiculeType(a.getVehicule().getType().name())
                .vehiculeMarque(a.getVehicule().getMarque())
                .personId(personId)
                .bookletId(bookletId)
                .personNom(nom)
                .personPoste(poste)
                .personContact(contact)
                .regionId(a.getRegion()    != null ? a.getRegion().getId()               : null)
                .regionName(a.getRegion()  != null ? a.getRegion().getRegionName()       : null)
                .districtId(a.getDistrict()   != null ? a.getDistrict().getId()          : null)
                .districtName(a.getDistrict() != null ? a.getDistrict().getDistrictName() : null)
                .dateAffectation(a.getDateAffectation())
                .dateRetour(a.getDateRetour())
                .motif(a.getMotif())
                .observations(a.getObservations())
                .active(a.getActive())
                .build();
    }

    private VehiculeDocumentHistoriqueResponse mapDocumentHistToResponse(VehiculeDocumentHistorique h) {
        return VehiculeDocumentHistoriqueResponse.builder()
                .id(h.getId())
                .vehiculeId(h.getVehicule().getId())
                .immatriculation(h.getVehicule().getImmatriculation())
                .typeDocument(h.getTypeDocument())
                .ancienneDateDebut(h.getAncienneDateDebut())
                .ancienneDateFin(h.getAncienneDateFin())
                .nouvelleDateDebut(h.getNouvelleDateDebut())
                .nouvelleDateFin(h.getNouvelleDateFin())
                .dateRenouvellement(h.getDateRenouvellement())
                .notes(h.getNotes())
                .build();
    }
}