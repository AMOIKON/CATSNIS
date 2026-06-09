package com.catsnis.dno.service;

import com.catsnis.dno.common.exception.ResourceNotFoundException;
import com.catsnis.dno.dto.ImageRequest;
import com.catsnis.dno.dto.ImageResponse;
import com.catsnis.dno.entity.Image;
import com.catsnis.dno.repository.ImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ImageServiceImpl implements ImageService {

    private final ImageRepository imageRepository;

    @Override
    @Transactional
    public List<ImageResponse> getAllList() {
        return imageRepository
                .findAll(PageRequest.of(0, 100))
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Page<ImageResponse> getAll(Pageable pageable, String keyword) {
        return imageRepository
                .findAllWithFilters(pageable, keyword)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public ImageResponse getById(Integer id) {
        return mapToResponse(imageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Image non trouvée avec l'id : " + id)));
    }

    // ✅ AJOUT — recherche par nom de fichier
    @Override
    @Transactional
    public Image getByFileName(String fileName) {
        return imageRepository.findByFileName(fileName).orElse(null);
    }

    @Override
    @Transactional
    public ImageResponse create(ImageRequest request) {
        Image image = Image.builder()
                .fileName(request.getFileName())
                .label(request.getLabel())
                .mimeType(request.getMimeType())   // ✅ AJOUT
                .fileSize(request.getFileSize())   // ✅ AJOUT
                .data(request.getData())           // ✅ AJOUT
                .build();
        return mapToResponse(imageRepository.save(image));
    }

    @Override
    @Transactional
    public ImageResponse update(Integer id, ImageRequest request) {
        Image image = imageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Image non trouvée avec l'id : " + id));
        image.setFileName(request.getFileName());
        image.setLabel(request.getLabel());
        if (request.getData() != null) {
            image.setData(request.getData());         // ✅ AJOUT
            image.setMimeType(request.getMimeType()); // ✅ AJOUT
            image.setFileSize(request.getFileSize()); // ✅ AJOUT
        }
        return mapToResponse(imageRepository.save(image));
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        Image image = imageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Image non trouvée avec l'id : " + id));
        imageRepository.delete(image);
    }

    // ✅ mapToResponse avec Base64
    private ImageResponse mapToResponse(Image image) {
        String base64 = null;
        if (image.getData() != null && image.getData().length > 0) {
            String mime = image.getMimeType() != null ? image.getMimeType() : "image/png";
            base64 = "data:" + mime + ";base64," +
                    Base64.getEncoder().encodeToString(image.getData());
        }
        return ImageResponse.builder()
                .id(image.getId())
                .fileName(image.getFileName())
                .label(image.getLabel())
                .url("/api/images/file/" + image.getFileName())
                .base64(base64)  // ✅ AJOUT
                .build();
    }
}