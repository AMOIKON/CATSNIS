package com.catsnis.dno.controller;

import com.catsnis.dno.entity.BookletStatus;
import com.catsnis.dno.repository.BookletStatutsRepository;   // ✅ bon package + bon nom
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/booklet-status")
@RequiredArgsConstructor
public class BookletStatusController {

    private final BookletStatutsRepository bookletStatutsRepository;  // ✅ nom corrigé

    @GetMapping
    public ResponseEntity<List<BookletStatus>> getAll() {
        return ResponseEntity.ok(bookletStatutsRepository.findAll());
    }
}