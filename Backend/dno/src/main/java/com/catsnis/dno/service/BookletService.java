package com.catsnis.dno.service;

import com.catsnis.dno.entity.Booklet;
import com.catsnis.dno.entity.BookletStatus;
import com.catsnis.dno.entity.District;
import com.catsnis.dno.entity.Region;
import com.catsnis.dno.repository.BookletRepository;
import com.catsnis.dno.repository.BookletStatutsRepository;
import com.catsnis.dno.repository.DistrictRepository;
import com.catsnis.dno.entity.Post;
import com.catsnis.dno.repository.PostRepository;
import com.catsnis.dno.repository.RegionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BookletService {

    private final BookletRepository        bookletRepository;
    private final BookletStatutsRepository statusRepository;
    private final RegionRepository         regionRepository;
    private final DistrictRepository       districtRepository;
    private final PostRepository           postRepository;

    public Booklet create(Booklet booklet) {
        if (bookletRepository.existsByEmail(booklet.getEmail())) {
            throw new RuntimeException("Email déjà utilisé !");
        }
        return bookletRepository.save(booklet);
    }

    public List<Booklet> getAll() {
        return bookletRepository.findAll();
    }

    public Booklet getById(Long id) {
        return bookletRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booklet introuvable avec l'id : " + id));
    }

    public List<Booklet> searchByName(String keyword) {
        return bookletRepository
                .findByLastNameContainingIgnoreCaseOrFirstNameContainingIgnoreCase(keyword, keyword);
    }

    public List<Booklet> getByRegion(Long regionId) {
        return bookletRepository.findByRegionId(regionId);
    }

    public List<Booklet> getByDistrict(Long districtId) {
        return bookletRepository.findByDistrictId(districtId);
    }

    public List<Booklet> getByStatus(Long statusId) {
        return bookletRepository.findByStatusId(statusId);
    }

    public List<Booklet> getByDistrictAndHealth(Long districtId, Long healthId) {
        if (healthId != null) {
            Long regionId = bookletRepository.findRegionIdByHealthId(healthId);
            if (regionId != null) {
                return bookletRepository.findByDistrictIdAndRegionId(districtId, regionId);
            }
        }
        return bookletRepository.findByDistrictId(districtId);
    }

    public Map<String, Long> getStatsByStatus() {
        List<BookletStatus> statuses = statusRepository.findAll();
        Map<String, Long> stats = new LinkedHashMap<>();
        for (BookletStatus status : statuses) {
            long count = bookletRepository.countByStatusId(status.getId());
            stats.put(status.getStatusName(), count);
        }
        return stats;
    }

    public Booklet update(Long id, Booklet updated) {
        Booklet existing = getById(id);
        existing.setFirstName(updated.getFirstName());
        existing.setLastName(updated.getLastName());
        existing.setContact(updated.getContact());
        existing.setEmail(updated.getEmail());
        existing.setRegion(updated.getRegion());
        existing.setDistrict(updated.getDistrict());
        existing.setPost(updated.getPost());
        existing.setStatus(updated.getStatus());
        return bookletRepository.save(existing);
    }

    public void delete(Long id) {
        bookletRepository.deleteById(id);
    }

    // ── Trouver ou créer un post par nom ──────────────────────────────────────
    /**
     * Cherche un Post existant (insensible à la casse).
     * S'il n'existe pas, le crée.
     */
    private Post resolvePost(String postName) {
        if (postName == null || postName.isBlank()) return null;
        String name = postName.trim();
        return postRepository.findAll().stream()
                .filter(p -> p.getPostName().equalsIgnoreCase(name))
                .findFirst()
                .orElseGet(() -> {
                    Post newPost = new Post();
                    newPost.setPostName(name);
                    return postRepository.save(newPost);
                });
    }

    // ── Création rapide depuis un formulaire d'intervention ───────────────────
    /**
     * Crée un booklet minimal depuis les données saisies dans le formulaire
     * d'intervention (mode "personne manuelle").
     *
     * Règle anti-doublon : si un booklet avec le même lastName existe déjà
     * dans le même district, on retourne celui existant sans rien créer.
     *
     * Le Post est automatiquement créé s'il n'existe pas encore.
     *
     * @param lastName   nom de famille (ex : "DIABAGATE")
     * @param firstName  prénom (ex : "MADOUSSOU")
     * @param contact    numéro de téléphone
     * @param postName   intitulé du poste (ex : "Infirmier", "Médecin-chef"…)
     * @param regionId   ID de la région Spring-entity
     * @param districtId ID du district Spring-entity
     * @return le Booklet existant ou nouvellement créé
     */
    public Booklet quickCreate(String lastName, String firstName,
                               String contact, String postName,
                               Long regionId, Long districtId) {

        // ── 1. Anti-doublon : chercher par lastName dans le même district ─────
        String lastNameNorm = (lastName != null ? lastName : "").toUpperCase().trim();
        List<Booklet> existing = bookletRepository.findByDistrictId(districtId);

        Optional<Booklet> found = existing.stream()
                .filter(b -> b.getLastName() != null
                        && b.getLastName().equalsIgnoreCase(lastNameNorm))
                .findFirst();

        if (found.isPresent()) return found.get();

        // ── 2. Charger les entités Region / District ──────────────────────────
        Region   region   = regionId   != null
                ? regionRepository.findById(regionId.intValue()).orElse(null)   : null;
        District district = districtId != null
                ? districtRepository.findById(districtId.intValue()).orElse(null) : null;

        // ── 3. Statut par défaut (premier disponible) ─────────────────────────
        BookletStatus defaultStatus = statusRepository.findAll()
                .stream().findFirst()
                .orElseThrow(() -> new RuntimeException(
                        "Aucun statut booklet disponible — créez au moins un statut."));

        // ── 4. Générer un email unique pour éviter la contrainte UNIQUE ───────
        //    Format : "auto.<lastName>.<districtId>@catusnis.internal"
        //    Cela évite le rejet sur la colonne email NOT NULL UNIQUE.
        String autoEmail = "auto."
                + lastNameNorm.toLowerCase().replaceAll("[^a-z0-9]", "")
                + "." + districtId
                + "@catusnis.internal";

        // Si cet email existe déjà (même personne recréée) → retourner l'existant
        if (bookletRepository.existsByEmail(autoEmail)) {
            return bookletRepository.findAll().stream()
                    .filter(b -> autoEmail.equals(b.getEmail()))
                    .findFirst()
                    .orElseThrow();
        }

        // ── 5. Créer le booklet ───────────────────────────────────────────────
        Booklet newBooklet = Booklet.builder()
                .lastName(lastNameNorm)
                .firstName(firstName != null ? firstName.trim() : "")
                .contact(contact != null ? contact.trim() : "")
                .email(autoEmail)           // email auto-généré, non-vide, unique
                .region(region)
                .district(district)
                .post(resolvePost(postName))
                .status(defaultStatus)
                .build();

        return bookletRepository.save(newBooklet);
    }
}