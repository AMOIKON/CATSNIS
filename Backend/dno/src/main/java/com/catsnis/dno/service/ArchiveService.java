package com.catsnis.dno.service;

import com.catsnis.dno.dto.ArchiveRequest;
import com.catsnis.dno.dto.ArchiveResponse;
import com.catsnis.dno.entity.Archive;
import com.catsnis.dno.entity.Archive.TypeArchive;
import com.catsnis.dno.entity.Archive.CategorieArchive;
import com.catsnis.dno.repository.ArchiveRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ArchiveService {

    private final ArchiveRepository archiveRepository;

    @Value("${app.upload.archives-dir:uploads/archives}")
    private String uploadDir;

    // ── Upload fichier scanné ─────────────────────────────────────────────────
    @Transactional
    public ArchiveResponse uploadScanne(MultipartFile file, ArchiveRequest dto) throws IOException {
        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path dir = Paths.get(uploadDir);
        Files.createDirectories(dir);
        Files.copy(file.getInputStream(), dir.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);

        Archive archive = Archive.builder()
                .titre(dto.getTitre())
                .type(TypeArchive.SCANNE)
                .categorie(dto.getCategorie())
                .fileName(fileName)
                .filePath(dir.resolve(fileName).toString())
                .fileSize(file.getSize())
                .mimeType(file.getContentType())
                .description(dto.getDescription())
                .archivedBy(dto.getArchivedBy())
                .relatedId(dto.getRelatedId())
                .relatedCode(dto.getRelatedCode())
                .build();

        return toResponse(archiveRepository.save(archive));
    }

    // ── Archiver automatiquement un document imprimé ──────────────────────────
    @Transactional
    public ArchiveResponse archiverImprime(ArchiveRequest dto) {
        Archive archive = Archive.builder()
                .titre(dto.getTitre())
                .type(TypeArchive.IMPRIME)
                .categorie(dto.getCategorie() != null ? dto.getCategorie() : CategorieArchive.AUTRE)
                .description(dto.getDescription())
                .archivedBy(dto.getArchivedBy())
                .relatedId(dto.getRelatedId())
                .relatedCode(dto.getRelatedCode())
                .build();

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
    public Resource download(Long id) throws MalformedURLException {
        Archive archive = archiveRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Archive introuvable : " + id));
        if (archive.getFilePath() == null)
            throw new RuntimeException("Aucun fichier associé à cette archive");
        Path path = Paths.get(archive.getFilePath());
        Resource resource = new UrlResource(path.toUri());
        if (!resource.exists()) throw new RuntimeException("Fichier introuvable sur disque");
        return resource;
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
        Archive archive = archiveRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Archive introuvable : " + id));
        if (archive.getFilePath() != null) {
            try { Files.deleteIfExists(Paths.get(archive.getFilePath())); }
            catch (IOException ignored) {}
        }
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