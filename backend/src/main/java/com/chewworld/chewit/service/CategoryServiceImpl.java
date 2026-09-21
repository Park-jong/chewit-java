package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.CategoryDtos.CategoryResponse;
import com.chewworld.chewit.dto.CategoryDtos.CreateCategoryRequest;
import com.chewworld.chewit.dto.CategoryDtos.UpdateCategoryRequest;
import com.chewworld.chewit.entity.Category;
import com.chewworld.chewit.exception.DuplicateCategoryException;
import com.chewworld.chewit.exception.ResourceNotFoundException;
import com.chewworld.chewit.repository.CategoryRepository;
import com.chewworld.chewit.repository.ChecklistRepository;
import com.chewworld.chewit.repository.EventRepository;
import com.chewworld.chewit.repository.TaskRepository;
import com.chewworld.chewit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final EventRepository eventRepository;
    private final ChecklistRepository checklistRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> listAll(Long userId) {
        return categoryRepository.findByUser_IdOrderByCreatedAtAsc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public CategoryResponse create(Long userId, CreateCategoryRequest request) {
        String name = request.name().strip();
        if (categoryRepository.existsByUser_IdAndName(userId, name)) {
            throw new DuplicateCategoryException("이미 존재하는 카테고리입니다.");
        }
        Category category = Category.builder()
                .user(userRepository.getReferenceById(userId))
                .name(name)
                .color(request.color())
                .build();
        categoryRepository.save(category);
        return toResponse(category);
    }

    @Override
    @Transactional
    public CategoryResponse update(Long userId, Long categoryId, UpdateCategoryRequest request) {
        Category category = getOwnedCategory(userId, categoryId);
        String name = request.name().strip();
        if (!name.equals(category.getName()) && categoryRepository.existsByUser_IdAndName(userId, name)) {
            throw new DuplicateCategoryException("이미 존재하는 카테고리입니다.");
        }
        category.setName(name);
        category.setColor(request.color());
        return toResponse(category);
    }

    @Override
    @Transactional
    public void delete(Long userId, Long categoryId) {
        getOwnedCategory(userId, categoryId);
        // 벌크 update가 영속성 컨텍스트를 비우므로(clearAutomatically) 엔티티 대신 id로 삭제한다.
        taskRepository.clearCategory(categoryId);
        eventRepository.clearCategory(categoryId);
        checklistRepository.clearCategory(categoryId);
        categoryRepository.deleteById(categoryId);
    }

    @Override
    @Transactional(readOnly = true)
    public Category resolveOwned(Long userId, Long categoryId) {
        if (categoryId == null) {
            return null;
        }
        return getOwnedCategory(userId, categoryId);
    }

    private Category getOwnedCategory(Long userId, Long categoryId) {
        return categoryRepository.findByIdAndUser_Id(categoryId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("카테고리를 찾을 수 없습니다."));
    }

    private CategoryResponse toResponse(Category category) {
        return new CategoryResponse(category.getId(), category.getName(), category.getColor(), category.getCreatedAt());
    }
}
