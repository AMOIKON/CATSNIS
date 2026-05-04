package com.catsnis.dno.controller;

import com.catsnis.dno.common.response.ApiResponse;
import com.catsnis.dno.dto.ImageRequest;
import com.catsnis.dno.dto.ImageResponse;
import com.catsnis.dno.service.ImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImageController {

    private final ImageService imageService;

    @Value("${app.upload.dir:/app/uploads/images}")
    private String uploadDir;

    // ── Upload image ──────────────────────────────────────────────────
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<ImageResponse>> upload(
            @RequestParam("file")  MultipartFile file,
            @RequestParam("label") String label) throws IOException {

        // Créer le dossier si inexistant
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Générer un nom unique
        String extension = file.getOriginalFilename()
                .substring(file.getOriginalFilename().lastIndexOf('.'));
        String fileName = UUID.randomUUID().toString() + extension;

        // Sauvegarder le fichier
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath,
                StandardCopyOption.REPLACE_EXISTING);

        // Créer l'entrée en base
        ImageRequest request = ImageRequest.builder()
                .fileName(fileName)
                .label(label)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Image uploadée",
                        imageService.create(request)));
    }

    // ── Servir une image ──────────────────────────────────────────────
    @GetMapping("/file/{fileName:.+}")
    public ResponseEntity<Resource> serveFile(
            @PathVariable String fileName) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(fileName);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = Files.probeContentType(filePath);
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(
                                contentType != null ? contentType : "application/octet-stream"))
                        .body(resource);
            }
            return ResponseEntity.notFound().build();
        } catch (IOException e) {
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
}