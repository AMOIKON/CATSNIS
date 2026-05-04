package com.catsnis.dno.service;

import com.catsnis.dno.entity.Booklet;
import com.catsnis.dno.entity.BookletStatus;
import com.catsnis.dno.repository.BookletRepository;
import com.catsnis.dno.repository.BookletStatutsRepository;  // ✅ nom correct
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BookletService {

    private final BookletRepository       bookletRepository;
    private final BookletStatutsRepository statusRepository;  // ✅ nom correct

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
}