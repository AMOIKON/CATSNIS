package com.catsnis.dno.controller;

import com.catsnis.dno.entity.Booklet;
import com.catsnis.dno.repository.BookletRepository;
import com.catsnis.dno.service.BookletPdfService;
import com.catsnis.dno.service.BookletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/booklets")
@RequiredArgsConstructor
public class BookletController {

    private final BookletService    bookletService;
    private final BookletPdfService bookletPdfService;
    private final BookletRepository bookletRepository;

    // ── Créer ─────────────────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<Booklet> create(@RequestBody Booklet booklet) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bookletService.create(booklet));
    }

    // ── Lister tous ───────────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<Booklet>> getAll() {
        return ResponseEntity.ok(bookletService.getAll());
    }

    // ── Recherche ─────────────────────────────────────────────────────────
    @GetMapping("/search")
    public ResponseEntity<List<Booklet>> search(@RequestParam String keyword) {
        return ResponseEntity.ok(bookletService.searchByName(keyword));
    }

    // ── Par région ────────────────────────────────────────────────────────
    @GetMapping("/region/{regionId}")
    public ResponseEntity<List<Booklet>> byRegion(@PathVariable Long regionId) {
        return ResponseEntity.ok(bookletService.getByRegion(regionId));
    }

    // ── Par district ──────────────────────────────────────────────────────
    @GetMapping("/district/{districtId}")
    public ResponseEntity<List<Booklet>> byDistrict(@PathVariable Long districtId) {
        return ResponseEntity.ok(bookletService.getByDistrict(districtId));
    }

    // ── Par statut ────────────────────────────────────────────────────────
    @GetMapping("/status/{statusId}")
    public ResponseEntity<List<Booklet>> byStatus(@PathVariable Long statusId) {
        return ResponseEntity.ok(bookletService.getByStatus(statusId));
    }

    // ── Stats ─────────────────────────────────────────────────────────────
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> stats() {
        return ResponseEntity.ok(bookletService.getStatsByStatus());
    }

    // ✅ Export PDF général — AVANT /{id}/pdf pour éviter le conflit
    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportAllPdf() throws Exception {
        List<Booklet> booklets = bookletRepository.findAll()
                .stream()
                .filter(b -> b.getStatus() != null &&
                        (b.getStatus().getStatusName().equals("Affecté") ||
                                b.getStatus().getStatusName().equals("Réaffecté")))
                .toList();

        byte[] pdfBytes = bookletPdfService.generateListPdf(booklets);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "booklets_export.pdf");
        return ResponseEntity.ok().headers(headers).body(pdfBytes);
    }

    // ✅ Filtrer booklets par district + site — AVANT /{id} ────────────────
    @GetMapping("/by-site")
    public ResponseEntity<List<Booklet>> getBySite(
            @RequestParam Long districtId,                         // ✅ Long
            @RequestParam(required = false) Long healthId) {       // ✅ Long
        return ResponseEntity.ok(
                bookletService.getByDistrictAndHealth(districtId, healthId));
    }

    // ── Par ID ────────────────────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<Booklet> getById(@PathVariable Long id) {
        return ResponseEntity.ok(bookletService.getById(id));
    }

    // ── Modifier ──────────────────────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<Booklet> update(
            @PathVariable Long id,
            @RequestBody Booklet booklet) {
        return ResponseEntity.ok(bookletService.update(id, booklet));
    }

    // ── Supprimer ─────────────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        bookletService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ✅ PDF individuel — APRÈS /export/pdf et /by-site ───────────────────
    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long id) throws Exception {
        Booklet booklet = bookletService.getById(id);
        byte[] pdfBytes = bookletPdfService.generateBookletPdf(booklet);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData(
                "attachment",
                "booklet_" + booklet.getLastName() + ".pdf"
        );
        return ResponseEntity.ok().headers(headers).body(pdfBytes);
    }
}