package com.chewworld.chewit.controller;

import com.chewworld.chewit.dto.CategoryDtos.CategorySummary;
import com.chewworld.chewit.dto.SearchDtos.SearchChecklistItem;
import com.chewworld.chewit.dto.SearchDtos.SearchEventItem;
import com.chewworld.chewit.dto.SearchDtos.SearchResponse;
import com.chewworld.chewit.dto.SearchDtos.SearchTaskItem;
import com.chewworld.chewit.entity.RecurrenceType;
import com.chewworld.chewit.exception.InvalidRequestException;
import com.chewworld.chewit.exception.ResourceNotFoundException;
import com.chewworld.chewit.service.SearchService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static com.chewworld.chewit.controller.support.ControllerTestSupport.authenticatedAs;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = SearchController.class)
@AutoConfigureMockMvc(addFilters = false)
class SearchControllerTest extends com.chewworld.chewit.controller.support.ControllerSliceTestBase {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SearchService searchService;

    @Test
    void search_결과를_종류별로_반환한다() throws Exception {
        CategorySummary category = new CategorySummary(5L, "업무", "#3B82F6");
        when(searchService.search(1L, "회의", 5L)).thenReturn(new SearchResponse(
                List.of(new SearchTaskItem(1L, "회의 준비", "메모", LocalDate.of(2026, 9, 3), false, category)),
                List.of(new SearchEventItem(2L, "주간 회의", null, LocalDate.of(2026, 9, 1), RecurrenceType.WEEKLY, null)),
                List.of(new SearchChecklistItem(3L, "목록", category, List.of("회의록")))
        ));

        mockMvc.perform(get("/api/search").param("q", "회의").param("categoryId", "5").with(authenticatedAs(1L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tasks[0].id").value(1))
                .andExpect(jsonPath("$.tasks[0].date").value("2026-09-03"))
                .andExpect(jsonPath("$.tasks[0].done").value(false))
                .andExpect(jsonPath("$.tasks[0].category.name").value("업무"))
                .andExpect(jsonPath("$.events[0].recurrence").value("WEEKLY"))
                .andExpect(jsonPath("$.events[0].category").doesNotExist())
                .andExpect(jsonPath("$.checklists[0].matchedItems[0]").value("회의록"));
    }

    @Test
    void search_categoryId가_없으면_null로_전달한다() throws Exception {
        when(searchService.search(1L, "a", null)).thenReturn(new SearchResponse(List.of(), List.of(), List.of()));

        mockMvc.perform(get("/api/search").param("q", "a").with(authenticatedAs(1L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tasks").isEmpty());
        verify(searchService).search(1L, "a", null);
    }

    @Test
    void search_검색어가_잘못되면_400() throws Exception {
        when(searchService.search(1L, " ", null)).thenThrow(new InvalidRequestException("검색어를 입력해 주세요."));

        mockMvc.perform(get("/api/search").param("q", " ").with(authenticatedAs(1L)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("검색어를 입력해 주세요."));
    }

    @Test
    void search_타인_카테고리면_404() throws Exception {
        when(searchService.search(1L, "a", 99L)).thenThrow(new ResourceNotFoundException("카테고리를 찾을 수 없습니다."));

        mockMvc.perform(get("/api/search").param("q", "a").param("categoryId", "99").with(authenticatedAs(1L)))
                .andExpect(status().isNotFound());
    }
}
