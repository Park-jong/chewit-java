package com.chewworld.chewit.controller;

import com.chewworld.chewit.dto.CategoryDtos.CategoryResponse;
import com.chewworld.chewit.dto.CategoryDtos.CreateCategoryRequest;
import com.chewworld.chewit.dto.CategoryDtos.UpdateCategoryRequest;
import com.chewworld.chewit.security.UserPrincipal;
import com.chewworld.chewit.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public List<CategoryResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return categoryService.listAll(principal.userId());
    }

    @PostMapping
    public CategoryResponse create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateCategoryRequest request
    ) {
        return categoryService.create(principal.userId(), request);
    }

    @PatchMapping("/{id}")
    public CategoryResponse update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateCategoryRequest request
    ) {
        return categoryService.update(principal.userId(), id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        categoryService.delete(principal.userId(), id);
    }
}
