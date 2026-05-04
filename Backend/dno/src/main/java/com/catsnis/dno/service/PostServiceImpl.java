package com.catsnis.dno.service;

import com.catsnis.dno.common.exception.ResourceNotFoundException;
import com.catsnis.dno.dto.PostRequest;
import com.catsnis.dno.dto.PostResponse;
import com.catsnis.dno.entity.Post;
import com.catsnis.dno.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
@RequiredArgsConstructor
public class PostServiceImpl  implements PostService{
    private final PostRepository postRepository;

    @Override
    public PostResponse getPostById(Integer id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post non trouvé avec l'id : " + id));
        return mapToResponse(post);
    }

    @Override
    public Page<PostResponse> getAllPosts(Pageable pageable, String keyword) {
        return postRepository.findAllWithFilters(pageable, keyword)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public PostResponse savePost(PostRequest request) {
        Post post = Post.builder()
                .postName(request.getPostName())
                .build();
        return mapToResponse(postRepository.save(post));
    }

    @Override
    @Transactional
    public PostResponse updatePost(Integer id, PostRequest request) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post non trouvé avec l'id : " + id));
        post.setPostName(request.getPostName());
        return mapToResponse(postRepository.save(post));
    }

    @Override
    @Transactional
    public void deletePost(Integer id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post non trouvé avec l'id : " + id));
        postRepository.delete(post);
    }

    private PostResponse mapToResponse(Post post) {
        return PostResponse.builder()
                .id(post.getId())
                .postName(post.getPostName())
                .build();
    }
}
