package com.catsnis.dno.controller;


import com.catsnis.dno.dto.ArchiveRequest;
import com.catsnis.dno.dto.ArchiveResponse;
import com.catsnis.dno.entity.Archive;
import com.catsnis.dno.service.ArchiveService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.util.Map;

@RestController
@RequestMapping("/api/archives")
@RequiredArgsConstructor
public class ArchiveController {

    private final ArchiveService archiveService;

    // ── Upload document scanné ────────────────────────────────────────────────
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','TECHNICIEN')")
    public ResponseEntity<ArchiveResponse> upload(
            @RequestPart("file") MultipartFile file,
            @RequestPart("data") ArchiveRequest dto
    ) throws IOException {
        return ResponseEntity.ok(archiveService.uploadScanne(file, dto));
    }

    // ── Archiver un document imprimé (sans fichier) ───────────────────────────
    @PostMapping("/imprime")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ArchiveResponse> archiverImprime(@RequestBody ArchiveRequest dto) {
        return ResponseEntity.ok(archiveService.archiverImprime(dto));
    }

    // ── Liste paginée avec filtres ────────────────────────────────────────────
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<ArchiveResponse>> list(
            @RequestParam(required = false) Archive.TypeArchive type,
            @RequestParam(required = false) Archive.CategorieArchive categorie,
            @RequestParam(required = false) String           keyword,
            @RequestParam(defaultValue = "0")  int           page,
            @RequestParam(defaultValue = "10") int           size
    ) {
        return ResponseEntity.ok(archiveService.list(type, categorie, keyword, page, size));
    }

    // ── Télécharger un fichier ────────────────────────────────────────────────
    @GetMapping("/download/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> download(@PathVariable Long id) throws MalformedURLException {
        Resource resource = archiveService.download(id);
        String fileName   = archiveService.getFileName(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }

    // ── Supprimer ─────────────────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        archiveService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ── Stats ─────────────────────────────────────────────────────────────────
    @GetMapping("/stats")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Long>> stats() {
        return ResponseEntity.ok(archiveService.stats());
    }
}