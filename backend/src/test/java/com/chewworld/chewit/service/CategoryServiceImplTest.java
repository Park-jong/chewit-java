package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.CategoryDtos.CategoryResponse;
import com.chewworld.chewit.dto.CategoryDtos.CreateCategoryRequest;
import com.chewworld.chewit.dto.CategoryDtos.UpdateCategoryRequest;
import com.chewworld.chewit.entity.Category;
import com.chewworld.chewit.entity.User;
import com.chewworld.chewit.exception.DuplicateCategoryException;
import com.chewworld.chewit.exception.ResourceNotFoundException;
import com.chewworld.chewit.repository.CategoryRepository;
import com.chewworld.chewit.repository.ChecklistRepository;
import com.chewworld.chewit.repository.EventRepository;
import com.chewworld.chewit.repository.TaskRepository;
import com.chewworld.chewit.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoryServiceImplTest {

    private static final Long USER_ID = 1L;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private ChecklistRepository checklistRepository;

    @InjectMocks
    private CategoryServiceImpl categoryService;

    private Category category(Long id, String name, String color) {
        return Category.builder().id(id).name(name).color(color).build();
    }

    @Test
    void listAll_내_카테고리를_반환한다() {
        when(categoryRepository.findByUser_IdOrderByCreatedAtAsc(USER_ID))
                .thenReturn(List.of(category(1L, "업무", "#3B82F6"), category(2L, "운동", "#22C55E")));

        List<CategoryResponse> responses = categoryService.listAll(USER_ID);

        assertThat(responses).extracting(CategoryResponse::name).containsExactly("업무", "운동");
    }

    @Test
    void create_카테고리를_생성한다() {
        when(categoryRepository.existsByUser_IdAndName(USER_ID, "업무")).thenReturn(false);
        when(userRepository.getReferenceById(USER_ID)).thenReturn(User.builder().id(USER_ID).build());

        CategoryResponse response = categoryService.create(USER_ID, new CreateCategoryRequest("  업무 ", "#3B82F6"));

        assertThat(response.name()).isEqualTo("업무");
        assertThat(response.color()).isEqualTo("#3B82F6");
        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    void create_같은_이름이_이미_있으면_예외() {
        when(categoryRepository.existsByUser_IdAndName(USER_ID, "업무")).thenReturn(true);

        assertThatThrownBy(() -> categoryService.create(USER_ID, new CreateCategoryRequest("업무", "#3B82F6")))
                .isInstanceOf(DuplicateCategoryException.class);
        verify(categoryRepository, never()).save(any(Category.class));
    }

    @Test
    void update_소유한_카테고리면_이름과_색을_수정한다() {
        Category category = category(1L, "업무", "#3B82F6");
        when(categoryRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.of(category));
        when(categoryRepository.existsByUser_IdAndName(USER_ID, "회사")).thenReturn(false);

        CategoryResponse response = categoryService.update(USER_ID, 1L, new UpdateCategoryRequest("회사", "#EF4444"));

        assertThat(response.name()).isEqualTo("회사");
        assertThat(response.color()).isEqualTo("#EF4444");
        assertThat(category.getName()).isEqualTo("회사");
    }

    @Test
    void update_이름은_그대로_색만_바꾸면_중복검사를_하지_않는다() {
        Category category = category(1L, "업무", "#3B82F6");
        when(categoryRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.of(category));

        CategoryResponse response = categoryService.update(USER_ID, 1L, new UpdateCategoryRequest("업무", "#EF4444"));

        assertThat(response.color()).isEqualTo("#EF4444");
        verify(categoryRepository, never()).existsByUser_IdAndName(anyLong(), any());
    }

    @Test
    void update_다른_카테고리와_이름이_겹치면_예외() {
        Category category = category(1L, "업무", "#3B82F6");
        when(categoryRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.of(category));
        when(categoryRepository.existsByUser_IdAndName(USER_ID, "운동")).thenReturn(true);

        assertThatThrownBy(() -> categoryService.update(USER_ID, 1L, new UpdateCategoryRequest("운동", "#3B82F6")))
                .isInstanceOf(DuplicateCategoryException.class);
        assertThat(category.getName()).isEqualTo("업무");
    }

    @Test
    void update_소유하지_않은_카테고리면_예외() {
        when(categoryRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.update(USER_ID, 1L, new UpdateCategoryRequest("회사", "#EF4444")))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void delete_참조하는_Task_Event_Checklist를_먼저_정리한_뒤_삭제한다() {
        when(categoryRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.of(category(1L, "업무", "#3B82F6")));

        categoryService.delete(USER_ID, 1L);

        InOrder order = inOrder(taskRepository, eventRepository, checklistRepository, categoryRepository);
        order.verify(taskRepository).clearCategory(1L);
        order.verify(eventRepository).clearCategory(1L);
        order.verify(checklistRepository).clearCategory(1L);
        order.verify(categoryRepository).deleteById(1L);
    }

    @Test
    void delete_소유하지_않은_카테고리면_예외이고_아무것도_정리하지_않는다() {
        when(categoryRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.delete(USER_ID, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(taskRepository, never()).clearCategory(anyLong());
        verify(eventRepository, never()).clearCategory(anyLong());
        verify(checklistRepository, never()).clearCategory(anyLong());
        verify(categoryRepository, never()).deleteById(anyLong());
    }

    @Test
    void resolveOwned_categoryId가_null이면_null을_반환한다() {
        assertThat(categoryService.resolveOwned(USER_ID, null)).isNull();
        verify(categoryRepository, never()).findByIdAndUser_Id(anyLong(), anyLong());
    }

    @Test
    void resolveOwned_소유한_카테고리를_반환한다() {
        Category category = category(1L, "업무", "#3B82F6");
        when(categoryRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.of(category));

        assertThat(categoryService.resolveOwned(USER_ID, 1L)).isSameAs(category);
    }

    @Test
    void resolveOwned_타인의_카테고리면_예외() {
        when(categoryRepository.findByIdAndUser_Id(9L, USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.resolveOwned(USER_ID, 9L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
