package com.catsnis.dno.service;

import com.catsnis.dno.common.utils.SecurityUtils;
import com.catsnis.dno.dto.ArchiveRequest;
import com.catsnis.dno.dto.ArchiveUpdateRequest;
import com.catsnis.dno.dto.ArchiveResponse;
import com.catsnis.dno.entity.Archive;
import com.catsnis.dno.entity.Archive.TypeArchive;
import com.catsnis.dno.entity.Archive.CategorieArchive;
import com.catsnis.dno.repository.ArchiveRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ArchiveService {

    private final ArchiveRepository archiveRepository;
    private final SecurityUtils     securityUtils;   // ✅ injection pour archivedBy auto

    // ── Résoudre le nom complet de l'utilisateur courant ─────────────────────
    private String currentUserFullName() {
        return securityUtils.getCurrentUser()
                .map(p -> (p.getFirstName() + " " + p.getLastName()).trim())
                .orElse("Système");
    }

    // ── Upload fichier scanné ─────────────────────────────────────────────────
    // ✅ Stocké en BDD (BLOB) — le disque Render free tier est éphémère.
    @Transactional
    public ArchiveResponse uploadScanne(MultipartFile file, ArchiveRequest dto) throws IOException {
        byte[] bytes = file.getBytes();

        Archive archive = Archive.builder()
                .titre(dto.getTitre())
                .type(TypeArchive.SCANNE)
                .categorie(dto.getCategorie())
                .fileName(file.getOriginalFilename())
                .data(bytes)
                .fileSize((long) bytes.length)
                .mimeType(file.getContentType())
                .description(dto.getDescription())
                .archivedBy(currentUserFullName())   // ✅ auto depuis le token JWT
                .relatedId(dto.getRelatedId())
                .relatedCode(dto.getRelatedCode())
                .build();

        return toResponse(archiveRepository.save(archive));
    }

    // ── Archiver automatiquement un document imprimé (sans fichier) ──────────
    @Transactional
    public ArchiveResponse archiverImprime(ArchiveRequest dto) {
        Archive archive = Archive.builder()
                .titre(dto.getTitre())
                .type(TypeArchive.IMPRIME)
                .categorie(dto.getCategorie() != null ? dto.getCategorie() : CategorieArchive.AUTRE)
                .description(dto.getDescription())
                .archivedBy(currentUserFullName())   // ✅ auto depuis le token JWT
                .relatedId(dto.getRelatedId())
                .relatedCode(dto.getRelatedCode())
                .build();

        return toResponse(archiveRepository.save(archive));
    }

    // ── Archiver (ou remplacer) le PDF généré automatiquement ─────────────────
    //    pour une intervention ou un déploiement. Stocké en BDD (BLOB) —
    //    survit aux redéploiements, contrairement à un fichier sur disque.
    //
    //    Dédoublonnage : si une archive existe déjà pour ce relatedId +
    //    categorie + type=IMPRIME (le PDF a déjà été généré une première fois),
    //    on remplace le contenu existant au lieu d'en créer un nouveau —
    //    important car generateInterventionPdf/generateDeploymentPdf peuvent
    //    être appelées à chaque téléchargement, pas uniquement à la création.
    @Transactional
    public ArchiveResponse archiverPdfGenere(byte[] pdfBytes, String titre,
                                             CategorieArchive categorie,
                                             Long relatedId, String relatedCode) {
        String fileName = titre.replaceAll("[^a-zA-Z0-9-_]", "_") + ".pdf";

        Archive archive = archiveRepository
                .findFirstByRelatedIdAndCategorieAndType(relatedId, categorie, TypeArchive.IMPRIME)
                .orElse(null);

        if (archive != null) {
            archive.setTitre(titre);
            archive.setFileName(fileName);
            archive.setData(pdfBytes);
            archive.setFileSize((long) pdfBytes.length);
            archive.setMimeType("application/pdf");
            archive.setArchivedBy(currentUserFullName());
            archive.setRelatedCode(relatedCode);
        } else {
            archive = Archive.builder()
                    .titre(titre)
                    .type(TypeArchive.IMPRIME)
                    .categorie(categorie)
                    .fileName(fileName)
                    .data(pdfBytes)
                    .fileSize((long) pdfBytes.length)
                    .mimeType("application/pdf")
                    .archivedBy(currentUserFullName())
                    .relatedId(relatedId)
                    .relatedCode(relatedCode)
                    .build();
        }

        return toResponse(archiveRepository.save(archive));
    }

    // ── Mettre à jour les métadonnées uniquement ──────────────────────────────
    @Transactional
    public ArchiveResponse update(Long id, ArchiveUpdateRequest dto) {
        Archive archive = archiveRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Archive introuvable : " + id));

        if (dto.getTitre() != null && !dto.getTitre().isBlank())
            archive.setTitre(dto.getTitre().trim());
        if (dto.getDescription() != null)
            archive.setDescription(dto.getDescription().trim().isEmpty()
                    ? null : dto.getDescription().trim());
        if (dto.getCategorie() != null)
            archive.setCategorie(dto.getCategorie());
        if (dto.getRelatedCode() != null)
            archive.setRelatedCode(dto.getRelatedCode().trim().isEmpty()
                    ? null : dto.getRelatedCode().trim());
        if (dto.getRelatedId() != null)
            archive.setRelatedId(dto.getRelatedId());

        // ✅ Mettre à jour archivedBy avec l'utilisateur qui fait la modification
        archive.setArchivedBy(currentUserFullName());

        return toResponse(archiveRepository.save(archive));
    }

    // ── Mettre à jour avec remplacement du fichier (SCANNE uniquement) ────────
    @Transactional
    public ArchiveResponse updateWithFile(Long id, MultipartFile file, ArchiveUpdateRequest dto)
            throws IOException {
        Archive archive = archiveRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Archive introuvable : " + id));

        if (archive.getType() != TypeArchive.SCANNE)
            throw new RuntimeException("Seuls les documents scannés peuvent avoir un fichier.");

        byte[] bytes = file.getBytes();
        archive.setFileName(file.getOriginalFilename());
        archive.setData(bytes);
        archive.setFileSize((long) bytes.length);
        archive.setMimeType(file.getContentType());

        if (dto.getTitre() != null && !dto.getTitre().isBlank())
            archive.setTitre(dto.getTitre().trim());
        if (dto.getDescription() != null)
            archive.setDescription(dto.getDescription().trim().isEmpty()
                    ? null : dto.getDescription().trim());
        if (dto.getCategorie() != null)
            archive.setCategorie(dto.getCategorie());
        if (dto.getRelatedCode() != null)
            archive.setRelatedCode(dto.getRelatedCode().trim().isEmpty()
                    ? null : dto.getRelatedCode().trim());
        if (dto.getRelatedId() != null)
            archive.setRelatedId(dto.getRelatedId());

        // ✅ Mettre à jour archivedBy avec l'utilisateur qui fait la modification
        archive.setArchivedBy(currentUserFullName());

        return toResponse(archiveRepository.save(archive));
    }

    // ── Liste paginée avec filtres ────────────────────────────────────────────
    public Page<ArchiveResponse> list(TypeArchive type, CategorieArchive categorie,
                                      String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return archiveRepository.search(
                type,
                categorie,
                (keyword != null && !keyword.isBlank()) ? keyword : null,
                pageable
        ).map(this::toResponse);
    }

    // ── Télécharger un fichier ────────────────────────────────────────────────
    // ✅ Servi directement depuis la BDD (BLOB), plus depuis le disque.
    public Resource download(Long id) {
        Archive archive = archiveRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Archive introuvable : " + id));
        if (archive.getData() == null)
            throw new RuntimeException("Aucun fichier associé à cette archive");
        return new ByteArrayResource(archive.getData());
    }

    // ── Nom fichier pour l'entête Content-Disposition ─────────────────────────
    public String getFileName(Long id) {
        return archiveRepository.findById(id)
                .map(a -> a.getFileName() != null ? a.getFileName() : "archive_" + id + ".bin")
                .orElse("archive.bin");
    }

    // ── Supprimer ─────────────────────────────────────────────────────────────
    @Transactional
    public void delete(Long id) {
        archiveRepository.deleteById(id);
    }

    // ── Stats rapides ─────────────────────────────────────────────────────────
    public Map<String, Long> stats() {
        return Map.of(
                "total",         archiveRepository.count(),
                "imprimes",      archiveRepository.countByType(TypeArchive.IMPRIME),
                "scannes",       archiveRepository.countByType(TypeArchive.SCANNE),
                "interventions", archiveRepository.countByCategorie(CategorieArchive.INTERVENTION),
                "deploiements",  archiveRepository.countByCategorie(CategorieArchive.DEPLOIEMENT)
        );
    }

    // ── Mapper ────────────────────────────────────────────────────────────────
    private ArchiveResponse toResponse(Archive a) {
        ArchiveResponse r = new ArchiveResponse();
        r.setId(a.getId());
        r.setTitre(a.getTitre());
        r.setType(a.getType());
        r.setCategorie(a.getCategorie());
        r.setFileName(a.getFileName());
        r.setFileSize(a.getFileSize());
        r.setMimeType(a.getMimeType());
        r.setDescription(a.getDescription());
        r.setArchivedBy(a.getArchivedBy());
        r.setArchivedAt(a.getArchivedAt());
        r.setRelatedId(a.getRelatedId());
        r.setRelatedCode(a.getRelatedCode());
        if (a.getFileName() != null)
            r.setDownloadUrl("/api/archives/download/" + a.getId());
        return r;
    }
}