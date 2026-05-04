package com.catsnis.dno.controller;


import com.catsnis.dno.common.response.ApiResponse;
import com.catsnis.dno.dto.PostRequest;
import com.catsnis.dno.dto.PostResponse;
import com.catsnis.dno.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {
    private final PostService postService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PostResponse>> getPostById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(postService.getPostById(id)));
    }
    @GetMapping
    public ResponseEntity<ApiResponse<Page<PostResponse>>> getAllPosts(
            Pageable pageable,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(ApiResponse.success(postService.getAllPosts(pageable, keyword)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PostResponse>> savePost(@RequestBody PostRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Post créé avec succès", postService.savePost(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PostResponse>> updatePost(
            @PathVariable Integer id,
            @RequestBody PostRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Post mis à jour avec succès", postService.updatePost(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePost(@PathVariable Integer id) {
        postService.deletePost(id);
        return ResponseEntity.ok(ApiResponse.success("Post supprimé avec succès", null));
    }
}
