package com.catsnis.dno.service;
import com.catsnis.dno.dto.ImageRequest;
import com.catsnis.dno.dto.ImageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
public interface ImageService {
    List<ImageResponse>   getAllList();
    Page<ImageResponse>   getAll(Pageable pageable, String keyword);
    ImageResponse         getById(Integer id);
    ImageResponse         create(ImageRequest request);
    ImageResponse         update(Integer id, ImageRequest request);
    void                  delete(Integer id);
}