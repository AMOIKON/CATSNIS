package com.catsnis.dno.service;

import com.catsnis.dno.entity.Acquisition;
import com.catsnis.dno.entity.Partner;
import com.catsnis.dno.entity.Types;
import com.catsnis.dno.repository.AcquisitionRepository;
import com.catsnis.dno.repository.TypesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AcquisitionQuickCreateService {

    private final AcquisitionRepository acquisitionRepository;
    private final TypesRepository       typesRepository;

    public static final String STATUS_HORS_BASE = "HORS_BASE";

    private static final String FALLBACK_TYPE_NAME = "ÉQUIPEMENT NON SPÉCIFIÉ";

    // ── Trouver ou créer un Types par nom ─────────────────────────────────────
    /**
     * Cherche un Types existant (insensible à la casse).
     * S'il n'existe pas, le crée à la volée.
     * Si aucun nom n'est fourni, retombe sur un type générique "ÉQUIPEMENT NON
     * SPÉCIFIÉ" — la colonne types_id est NOT NULL en base, on ne peut donc
     * jamais retourner null ici.
     */
    private Types resolveTypes(String typeName) {
        String name = (typeName == null || typeName.isBlank())
                ? FALLBACK_TYPE_NAME
                : typeName.trim();
        return typesRepository.findAll().stream()
                .filter(t -> t.getTypeName() != null && t.getTypeName().equalsIgnoreCase(name))
                .findFirst()
                .orElseGet(() -> {
                    Types newType = new Types();
                    newType.setTypeName(name);
                    return typesRepository.save(newType);
                });
    }

    // ── Création rapide depuis le formulaire d'intervention ───────────────────
    /**
     * Enregistre un équipement "hors base" (non inventorié) rencontré lors
     * d'une assistance technique, dans la table `acquisitions` existante.
     *
     * Règle anti-doublon : si un équipement HORS_BASE portant le même nom
     * (stocké dans `tag`) existe déjà, on retourne celui existant sans
     * rien recréer.
     *
     * @param equipmentName  désignation libre de l'équipement (ex : "Concentrateur O2 portable")
     * @param equipmentType  type libre de l'équipement (ex : "Concentrateur d'oxygène") — résolu ou créé dans Types
     * @param partner        partenaire courant (peut être null)
     * @return l'Acquisition existante ou nouvellement créée
     */
    public Acquisition quickCreate(String equipmentName, String equipmentType, Partner partner) {

        String nameNorm = (equipmentName != null ? equipmentName : "").trim().toUpperCase();
        String cleanNameForMatch = nameNorm.replaceAll("[^A-Z0-9]", "").trim();

        // ── 1. Anti-doublon : chercher parmi les équipements HORS_BASE ────────
        //    Le tag étant préfixé "HB-<NOM>-<suffixe>", on compare sur le
        //    segment central plutôt que sur le tag complet.
        List<Acquisition> existing = acquisitionRepository.findByStatus(STATUS_HORS_BASE);
        Optional<Acquisition> found = cleanNameForMatch.isBlank()
                ? Optional.empty()
                : existing.stream()
                .filter(a -> a.getTag() != null
                        && a.getTag().startsWith("HB-" + cleanNameForMatch + "-"))
                .findFirst();

        if (found.isPresent()) return found.get();

        // ── 2. Résoudre (ou créer) le Types correspondant ─────────────────────
        Types types = resolveTypes(equipmentType);

        // ── 3. Générer un tag unique basé sur le nom ──────────────────────────
        //    Format : "HB-<NOM_NORMALISE>-<suffixe court>"
        //    Toujours préfixé "HB-" pour ne jamais entrer en collision avec
        //    un tag d'équipement réellement inventorié (contrainte UNIQUE).
        String suffix = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        String cleanName = nameNorm.replaceAll("[^A-Z0-9]", "").trim();
        String tag = "HB-" + (cleanName.isBlank() ? "EQUIPEMENT" : cleanName) + "-" + suffix;

        // ── 4. Créer l'Acquisition ─────────────────────────────────────────────
        Acquisition newAcquisition = Acquisition.builder()
                .tag(tag)
                .serial(tag)                              // même valeur : pas de numéro de série réel disponible
                .quantity(1)
                .status(STATUS_HORS_BASE)
                .image("")                                // colonne NOT NULL en base, pas d'image pour un équipement hors base
                .deployed(false)
                .dateAcq(new Date())
                .types(types)
                .partner(partner)
                .build();

        return acquisitionRepository.save(newAcquisition);
    }
}