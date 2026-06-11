package com.catsnis.dno.controller;

import com.catsnis.dno.common.response.ApiResponse;
import com.catsnis.dno.dto.ImageRequest;
import com.catsnis.dno.dto.ImageResponse;
import com.catsnis.dno.entity.Image;
import com.catsnis.dno.service.ImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImageController {

    private final ImageService imageService;

    // ── Upload image — stockage en base ──────────────────────────────
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<ImageResponse>> upload(
            @RequestParam("file")  MultipartFile file,
            @RequestParam("label") String label) throws IOException {

        String originalName = file.getOriginalFilename();
        String extension = originalName != null && originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf('.'))
                : ".png";
        String fileName = UUID.randomUUID().toString() + extension;

        ImageRequest request = ImageRequest.builder()
                .fileName(fileName)
                .label(label)
                .mimeType(file.getContentType())
                .fileSize(file.getSize())
                .data(file.getBytes())
                .build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Image uploadée",
                        imageService.create(request)));
    }

    // ── Servir une image depuis la base ──────────────────────────────
    @GetMapping("/file/{fileName:.+}")
    public ResponseEntity<byte[]> serveFile(
            @PathVariable String fileName) {
        try {
            Image image = imageService.getByFileName(fileName);
            if (image == null || image.getData() == null) {
                return ResponseEntity.notFound().build();
            }

            // Détermination du Content-Type : priorité au mimeType stocké,
            // fallback sur l'extension du nom de fichier
            String contentType = resolveContentType(image.getMimeType(), fileName);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                    // FIX: Access-Control-Allow-Origin explicite pour les images publiques
                    // (allowCredentials=false dans CorsConfig → compatible avec "*")
                    .header(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "*")
                    .header("Cross-Origin-Resource-Policy", "cross-origin")
                    .body(image.getData());

        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── Liste complète pour le picker ─────────────────────────────────
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<ImageResponse>>> getAllList() {
        return ResponseEntity.ok(ApiResponse.success(imageService.getAllList()));
    }

    // ── Liste paginée ─────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ImageResponse>>> getAll(
            Pageable pageable,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(ApiResponse.success(
                imageService.getAll(pageable, keyword)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ImageResponse>> getById(
            @PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(
                imageService.getById(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Integer id) {
        imageService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(
                "Image supprimée", null));
    }

    // ── Helper : résolution du Content-Type ──────────────────────────
    private String resolveContentType(String storedMimeType, String fileName) {
        if (storedMimeType != null && !storedMimeType.isBlank()
                && !storedMimeType.equals("application/octet-stream")) {
            return storedMimeType;
        }
        // Fallback sur l'extension
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".png"))              return "image/png";
        if (lower.endsWith(".jpg")
                || lower.endsWith(".jpeg"))     return "image/jpeg";
        if (lower.endsWith(".gif"))             return "image/gif";
        if (lower.endsWith(".webp"))            return "image/webp";
        if (lower.endsWith(".svg"))             return "image/svg+xml";
        return "image/png"; // défaut raisonnable pour CATUSNIS
    }
}