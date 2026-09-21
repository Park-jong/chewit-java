package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.CategoryDtos.CategoryResponse;
import com.chewworld.chewit.dto.CategoryDtos.CreateCategoryRequest;
import com.chewworld.chewit.dto.CategoryDtos.UpdateCategoryRequest;
import com.chewworld.chewit.entity.Category;

import java.util.List;

public interface CategoryService {

    List<CategoryResponse> listAll(Long userId);

    CategoryResponse create(Long userId, CreateCategoryRequest request);

    CategoryResponse update(Long userId, Long categoryId, UpdateCategoryRequest request);

    void delete(Long userId, Long categoryId);

    /**
     * Task/Event/Checklist가 카테고리를 붙일 때 쓰는 소유권 검증 헬퍼.
     * categoryId가 null이면 카테고리 없음으로 보고 null을 반환하고, 없거나 타인 소유면 404.
     */
    Category resolveOwned(Long userId, Long categoryId);
}
