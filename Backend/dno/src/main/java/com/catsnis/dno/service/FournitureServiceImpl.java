package com.catsnis.dno.service;

import com.catsnis.dno.common.exception.ResourceNotFoundException;
import com.catsnis.dno.dto.*;
import com.catsnis.dno.entity.*;
import com.catsnis.dno.entity.Fourniture.FournitureCategorie;
import com.catsnis.dno.entity.Fourniture.FournitureStatut;
import com.catsnis.dno.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FournitureServiceImpl implements FournitureService {

    private final FournitureRepository            fournitureRepository;
    private final FournitureDeploiementRepository deploiementRepository;
    private final PersonRepository                personRepository;
    private final BookletRepository               bookletRepository;
    private final RegionRepository                regionRepository;
    private final DistrictRepository              districtRepository;

    // ── Séquence code ─────────────────────────────────────────────────────────
    private synchronized String generateCode() {
        long count = fournitureRepository.count() + 1;
        return String.format("FURN-%04d", count);
    }

    // ── CRUD fournitures ──────────────────────────────────────────────────────

    @Override
    public FournitureResponse getById(Integer id) {
        return mapToResponse(fournitureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fourniture non trouvée : " + id)));
    }

    @Override
    public Page<FournitureResponse> getAll(Pageable pageable, FournitureCategorie categorie,
                                           FournitureStatut statut, String keyword) {
        return fournitureRepository.findAllWithFilters(pageable, categorie, statut, keyword)
                .map(this::mapToResponse);
    }

    @Override
    public List<FournitureResponse> getAllList() {
        return fournitureRepository.findAll().stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override @Transactional
    public FournitureResponse save(FournitureRequest request) {
        String code = generateCode();
        while (fournitureRepository.existsByCode(code)) {
            code = "FURN-" + String.format("%04d", new Random().nextInt(9999));
        }
        Fourniture f = Fourniture.builder()
                .code(code)
                .designation(request.getDesignation())
                .categorie(request.getCategorie())
                .quantite(request.getQuantite() != null ? request.getQuantite() : 0)
                .quantiteDisponible(request.getQuantite() != null ? request.getQuantite() : 0)
                .unite(request.getUnite() != null ? request.getUnite() : "Pièce")
                .description(request.getDescription())
                .dateAcquisition(request.getDateAcquisition())
                .fournisseur(request.getFournisseur())
                .prixUnitaire(request.getPrixUnitaire())
                .statut(FournitureStatut.DISPONIBLE)
                .build();
        return mapToResponse(fournitureRepository.save(f));
    }

    @Override @Transactional
    public FournitureResponse update(Integer id, FournitureRequest request) {
        Fourniture f = fournitureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fourniture non trouvée : " + id));
        f.setDesignation(request.getDesignation());
        f.setCategorie(request.getCategorie());
        if (request.getQuantite() != null) {
            int diff = request.getQuantite() - f.getQuantite();
            f.setQuantite(request.getQuantite());
            f.setQuantiteDisponible(Math.max(0, f.getQuantiteDisponible() + diff));
        }
        if (request.getUnite()          != null) f.setUnite(request.getUnite());
        if (request.getDescription()    != null) f.setDescription(request.getDescription());
        if (request.getDateAcquisition()!= null) f.setDateAcquisition(request.getDateAcquisition());
        if (request.getFournisseur()    != null) f.setFournisseur(request.getFournisseur());
        if (request.getPrixUnitaire()   != null) f.setPrixUnitaire(request.getPrixUnitaire());
        // Recalcul statut
        f.setStatut(computeStatut(f));
        return mapToResponse(fournitureRepository.save(f));
    }

    @Override @Transactional
    public void delete(Integer id) {
        fournitureRepository.delete(fournitureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fourniture non trouvée : " + id)));
    }

    // ── Déploiements ──────────────────────────────────────────────────────────

    @Override @Transactional
    public FournitureDeploiementResponse deployer(FournitureDeploiementRequest request) {
        Fourniture f = fournitureRepository.findById(request.getFournitureId())
                .orElseThrow(() -> new ResourceNotFoundException("Fourniture non trouvée"));

        int qty = request.getQuantiteDeployee() != null ? request.getQuantiteDeployee() : 1;
        if (f.getQuantiteDisponible() < qty)
            throw new IllegalArgumentException(
                    "Stock insuffisant. Disponible : " + f.getQuantiteDisponible());

        FournitureDeploiement.FournitureDeploiementBuilder builder = FournitureDeploiement.builder()
                .fourniture(f)
                .quantiteDeployee(qty)
                .dateDeploiement(request.getDateDeploiement() != null ? request.getDateDeploiement() : new Date())
                .motif(request.getMotif())
                .notes(request.getNotes())
                .active(true);

        // Bénéficiaire : booklet prioritaire sur person
        if (request.getBookletId() != null) {
            Booklet b = bookletRepository.findById(Long.valueOf(request.getBookletId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Booklet non trouvé"));
            builder.booklet(b);
        } else if (request.getPersonId() != null) {
            Person p = personRepository.findById(request.getPersonId())
                    .orElseThrow(() -> new ResourceNotFoundException("Personne non trouvée"));
            builder.person(p);
        }

        if (request.getRegionId()   != null)
            builder.region(regionRepository.findById(request.getRegionId()).orElse(null));
        if (request.getDistrictId() != null)
            builder.district(districtRepository.findById(request.getDistrictId()).orElse(null));

        // Mise à jour stock
        f.setQuantiteDisponible(f.getQuantiteDisponible() - qty);
        f.setStatut(computeStatut(f));
        fournitureRepository.save(f);

        return mapDeploiementToResponse(deploiementRepository.save(builder.build()));
    }

    @Override @Transactional
    public FournitureDeploiementResponse updateDeploiement(Integer id, FournitureDeploiementRequest request) {
        FournitureDeploiement d = deploiementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Déploiement non trouvé : " + id));
        d.setMotif(request.getMotif());
        d.setNotes(request.getNotes());
        if (request.getDateDeploiement() != null) d.setDateDeploiement(request.getDateDeploiement());
        if (request.getRegionId() != null)
            d.setRegion(regionRepository.findById(request.getRegionId()).orElse(null));
        if (request.getDistrictId() != null)
            d.setDistrict(districtRepository.findById(request.getDistrictId()).orElse(null));
        return mapDeploiementToResponse(deploiementRepository.save(d));
    }

    @Override @Transactional
    public void cloturerDeploiement(Integer id) {
        FournitureDeploiement d = deploiementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Déploiement non trouvé : " + id));
        d.setActive(false);
        deploiementRepository.save(d);
        // Restituer la quantité
        Fourniture f = d.getFourniture();
        f.setQuantiteDisponible(f.getQuantiteDisponible() + d.getQuantiteDeployee());
        f.setStatut(computeStatut(f));
        fournitureRepository.save(f);
    }

    @Override @Transactional
    public void deleteDeploiement(Integer id) {
        FournitureDeploiement d = deploiementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Déploiement non trouvé : " + id));
        if (Boolean.TRUE.equals(d.getActive())) {
            Fourniture f = d.getFourniture();
            f.setQuantiteDisponible(f.getQuantiteDisponible() + d.getQuantiteDeployee());
            f.setStatut(computeStatut(f));
            fournitureRepository.save(f);
        }
        deploiementRepository.delete(d);
    }

    @Override
    public Page<FournitureDeploiementResponse> getDeploiements(Pageable pageable,
                                                               Integer fournitureId, Boolean active, String keyword) {
        return deploiementRepository.findAllWithFilters(pageable, fournitureId, active, keyword)
                .map(this::mapDeploiementToResponse);
    }

    @Override
    public List<FournitureDeploiementResponse> getDeploiementsByFourniture(Integer fournitureId) {
        return deploiementRepository.findByFournitureIdOrderByDateDeploiementDesc(fournitureId)
                .stream().map(this::mapDeploiementToResponse).collect(Collectors.toList());
    }

    // ── Stats ─────────────────────────────────────────────────────────────────

    @Override
    public Map<String, Long> stats() {
        Map<String, Long> m = new LinkedHashMap<>();
        m.put("total",           fournitureRepository.count());
        m.put("disponibles",     fournitureRepository.countByStatut(FournitureStatut.DISPONIBLE));
        m.put("deployes",        fournitureRepository.countByStatut(FournitureStatut.DEPLOYE));
        m.put("enRupture",       fournitureRepository.countByStatut(FournitureStatut.EN_RUPTURE));
        m.put("totalDeploiements", deploiementRepository.countByActive(true));
        m.put("informatique",    fournitureRepository.countByCategorie(FournitureCategorie.INFORMATIQUE));
        m.put("mobilier",        fournitureRepository.countByCategorie(FournitureCategorie.MOBILIER));
        m.put("papeterie",       fournitureRepository.countByCategorie(FournitureCategorie.PAPETERIE));
        m.put("bureautique",     fournitureRepository.countByCategorie(FournitureCategorie.BUREAUTIQUE));
        m.put("electromenager",  fournitureRepository.countByCategorie(FournitureCategorie.ELECTROMENAGER));
        return m;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private FournitureStatut computeStatut(Fourniture f) {
        if (f.getQuantiteDisponible() <= 0) return FournitureStatut.EN_RUPTURE;
        if (f.getQuantiteDisponible() < f.getQuantite()) return FournitureStatut.DEPLOYE;
        return FournitureStatut.DISPONIBLE;
    }

    private FournitureResponse mapToResponse(Fourniture f) {
        int deployes = f.getQuantite() - f.getQuantiteDisponible();
        return FournitureResponse.builder()
                .id(f.getId()).code(f.getCode()).designation(f.getDesignation())
                .categorie(f.getCategorie()).quantite(f.getQuantite())
                .quantiteDisponible(f.getQuantiteDisponible())
                .quantiteDeployee(Math.max(0, deployes))
                .unite(f.getUnite()).description(f.getDescription())
                .dateAcquisition(f.getDateAcquisition()).fournisseur(f.getFournisseur())
                .prixUnitaire(f.getPrixUnitaire()).statut(f.getStatut())
                .createdAt(f.getCreatedAt())
                .build();
    }

    private FournitureDeploiementResponse mapDeploiementToResponse(FournitureDeploiement d) {
        String nom = null; String poste = null; String contact = null;
        Integer personId = null; Long bookletId = null;

        if (d.getBooklet() != null) {
            bookletId = d.getBooklet().getId();
            nom       = d.getBooklet().getFirstName() + " " + d.getBooklet().getLastName();
            poste     = d.getBooklet().getPost() != null ? d.getBooklet().getPost().getPostName() : null;
            contact   = d.getBooklet().getContact();
        } else if (d.getPerson() != null) {
            personId  = d.getPerson().getId();
            nom       = d.getPerson().getFirstName() + " " + d.getPerson().getLastName();
            poste     = d.getPerson().getPost() != null ? d.getPerson().getPost().getPostName() : null;
        }

        return FournitureDeploiementResponse.builder()
                .id(d.getId())
                .fournitureId(d.getFourniture().getId())
                .fournitureCode(d.getFourniture().getCode())
                .fournitureDesignation(d.getFourniture().getDesignation())
                .fournitureCategorie(d.getFourniture().getCategorie().name())
                .personId(personId).bookletId(bookletId)
                .beneficiaireNom(nom).beneficiairePoste(poste).beneficiaireContact(contact)
                .quantiteDeployee(d.getQuantiteDeployee())
                .dateDeploiement(d.getDateDeploiement())
                .motif(d.getMotif())
                .regionId(d.getRegion()    != null ? d.getRegion().getId()               : null)
                .regionName(d.getRegion()  != null ? d.getRegion().getRegionName()       : null)
                .districtId(d.getDistrict()   != null ? d.getDistrict().getId()          : null)
                .districtName(d.getDistrict() != null ? d.getDistrict().getDistrictName() : null)
                .notes(d.getNotes()).active(d.getActive()).createdAt(d.getCreatedAt())
                .build();
    }
}