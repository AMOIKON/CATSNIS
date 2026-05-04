package com.catsnis.dno.service;

import com.catsnis.dno.common.exception.ResourceNotFoundException;
import com.catsnis.dno.dto.ImageRequest;
import com.catsnis.dno.dto.ImageResponse;
import com.catsnis.dno.entity.Image;
import com.catsnis.dno.repository.ImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ImageServiceImpl implements ImageService{
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

    @Override
    @Transactional
    public ImageResponse create(ImageRequest request) {
        Image image = Image.builder()
                .fileName(request.getFileName())
                .label(request.getLabel())
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





    private ImageResponse mapToResponse(Image image) {
        return ImageResponse.builder()
                .id(image.getId())
                .fileName(image.getFileName())
                .label(image.getLabel())
                .url("/api/images/file/" + image.getFileName()) // ← URL
                .build();
    }



}
