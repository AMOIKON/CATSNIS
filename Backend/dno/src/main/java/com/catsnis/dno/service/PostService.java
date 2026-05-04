package com.catsnis.dno.service;
import com.catsnis.dno.dto.PostRequest;
import com.catsnis.dno.dto.PostResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
public interface PostService {
    PostResponse         getPostById(Integer id);
    Page<PostResponse>   getAllPosts(Pageable pageable, String keyword);
    PostResponse         savePost(PostRequest request);
    PostResponse         updatePost(Integer id, PostRequest request);
    void                 deletePost(Integer id);
}