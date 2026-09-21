package com.chewworld.chewit.controller;

import com.chewworld.chewit.controller.support.ControllerSliceTestBase;
import com.chewworld.chewit.dto.CategoryDtos.CategoryResponse;
import com.chewworld.chewit.dto.CategoryDtos.CreateCategoryRequest;
import com.chewworld.chewit.dto.CategoryDtos.UpdateCategoryRequest;
import com.chewworld.chewit.exception.DuplicateCategoryException;
import com.chewworld.chewit.exception.ResourceNotFoundException;
import com.chewworld.chewit.service.CategoryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static com.chewworld.chewit.controller.support.ControllerTestSupport.authenticatedAs;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = CategoryController.class)
@AutoConfigureMockMvc(addFilters = false)
class CategoryControllerTest extends ControllerSliceTestBase {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @MockitoBean
    private CategoryService categoryService;

    @Test
    void list_내_카테고리를_반환한다() throws Exception {
        when(categoryService.listAll(1L)).thenReturn(List.of(
                new CategoryResponse(1L, "업무", "#3B82F6", null),
                new CategoryResponse(2L, "운동", "#22C55E", null)));

        mockMvc.perform(get("/api/categories").with(authenticatedAs(1L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("업무"))
                .andExpect(jsonPath("$[1].color").value("#22C55E"));
    }

    @Test
    void create_성공하면_생성된_카테고리를_반환한다() throws Exception {
        when(categoryService.create(eq(1L), any()))
                .thenReturn(new CategoryResponse(1L, "업무", "#3B82F6", null));

        mockMvc.perform(post("/api/categories")
                        .with(authenticatedAs(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateCategoryRequest("업무", "#3B82F6"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("업무"));
    }

    @Test
    void create_이름이_공백이면_400을_반환한다() throws Exception {
        mockMvc.perform(post("/api/categories")
                        .with(authenticatedAs(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateCategoryRequest("  ", "#3B82F6"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_이름이_30자를_넘으면_400을_반환한다() throws Exception {
        mockMvc.perform(post("/api/categories")
                        .with(authenticatedAs(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateCategoryRequest("가".repeat(31), "#3B82F6"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_색상_형식이_잘못되면_400을_반환한다() throws Exception {
        mockMvc.perform(post("/api/categories")
                        .with(authenticatedAs(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateCategoryRequest("업무", "blue"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_같은_이름이_있으면_409를_반환한다() throws Exception {
        when(categoryService.create(eq(1L), any()))
                .thenThrow(new DuplicateCategoryException("이미 존재하는 카테고리입니다."));

        mockMvc.perform(post("/api/categories")
                        .with(authenticatedAs(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateCategoryRequest("업무", "#3B82F6"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("이미 존재하는 카테고리입니다."));
    }

    @Test
    void update_성공하면_수정된_카테고리를_반환한다() throws Exception {
        when(categoryService.update(eq(1L), eq(1L), any()))
                .thenReturn(new CategoryResponse(1L, "회사", "#EF4444", null));

        mockMvc.perform(patch("/api/categories/{id}", 1L)
                        .with(authenticatedAs(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateCategoryRequest("회사", "#EF4444"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("회사"))
                .andExpect(jsonPath("$.color").value("#EF4444"));
    }

    @Test
    void update_검증에_실패하면_400을_반환한다() throws Exception {
        mockMvc.perform(patch("/api/categories/{id}", 1L)
                        .with(authenticatedAs(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateCategoryRequest("회사", "#12345"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void update_같은_이름이_있으면_409를_반환한다() throws Exception {
        when(categoryService.update(eq(1L), eq(1L), any()))
                .thenThrow(new DuplicateCategoryException("이미 존재하는 카테고리입니다."));

        mockMvc.perform(patch("/api/categories/{id}", 1L)
                        .with(authenticatedAs(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateCategoryRequest("운동", "#22C55E"))))
                .andExpect(status().isConflict());
    }

    @Test
    void update_소유하지_않은_카테고리면_404를_반환한다() throws Exception {
        when(categoryService.update(eq(1L), eq(1L), any()))
                .thenThrow(new ResourceNotFoundException("카테고리를 찾을 수 없습니다."));

        mockMvc.perform(patch("/api/categories/{id}", 1L)
                        .with(authenticatedAs(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateCategoryRequest("회사", "#EF4444"))))
                .andExpect(status().isNotFound());
    }

    @Test
    void delete_성공하면_200을_반환한다() throws Exception {
        mockMvc.perform(delete("/api/categories/{id}", 1L).with(authenticatedAs(1L)))
                .andExpect(status().isOk());
    }

    @Test
    void delete_소유하지_않은_카테고리면_404를_반환한다() throws Exception {
        Mockito.doThrow(new ResourceNotFoundException("카테고리를 찾을 수 없습니다."))
                .when(categoryService).delete(1L, 1L);

        mockMvc.perform(delete("/api/categories/{id}", 1L).with(authenticatedAs(1L)))
                .andExpect(status().isNotFound());
    }
}
