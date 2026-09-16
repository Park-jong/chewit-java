package com.chewworld.chewit.controller;

import com.chewworld.chewit.dto.ChecklistDtos.ChecklistItemResponse;
import com.chewworld.chewit.dto.ChecklistDtos.ChecklistResponse;
import com.chewworld.chewit.dto.ChecklistDtos.CreateChecklistItemRequest;
import com.chewworld.chewit.dto.ChecklistDtos.CreateChecklistRequest;
import com.chewworld.chewit.dto.ChecklistDtos.ReorderItemsRequest;
import com.chewworld.chewit.dto.ChecklistDtos.UpdateChecklistItemRequest;
import com.chewworld.chewit.dto.ChecklistDtos.UpdateChecklistRequest;
import com.chewworld.chewit.service.ChecklistService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
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

@WebMvcTest(controllers = ChecklistController.class)
@AutoConfigureMockMvc(addFilters = false)
class ChecklistControllerTest extends com.chewworld.chewit.controller.support.ControllerSliceTestBase {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @MockitoBean
    private ChecklistService checklistService;

    @Test
    void list_전체_체크리스트를_반환한다() throws Exception {
        when(checklistService.listAll(1L)).thenReturn(List.of(
                new ChecklistResponse(1L, "장보기", List.of(), null)));

        mockMvc.perform(get("/api/checklists").with(authenticatedAs(1L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("장보기"));
    }

    @Test
    void create_성공하면_생성된_체크리스트를_반환한다() throws Exception {
        CreateChecklistRequest request = new CreateChecklistRequest("장보기");
        when(checklistService.create(eq(1L), any())).thenReturn(
                new ChecklistResponse(1L, "장보기", List.of(), null));

        mockMvc.perform(post("/api/checklists")
                        .with(authenticatedAs(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("장보기"));
    }

    @Test
    void create_제목이_공백이면_400을_반환한다() throws Exception {
        CreateChecklistRequest request = new CreateChecklistRequest("  ");

        mockMvc.perform(post("/api/checklists")
                        .with(authenticatedAs(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rename_성공하면_변경된_제목을_반환한다() throws Exception {
        UpdateChecklistRequest request = new UpdateChecklistRequest("장보기2");
        when(checklistService.rename(eq(1L), eq(1L), any())).thenReturn(
                new ChecklistResponse(1L, "장보기2", List.of(), null));

        mockMvc.perform(patch("/api/checklists/{id}", 1L)
                        .with(authenticatedAs(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("장보기2"));
    }

    @Test
    void delete_성공하면_200을_반환한다() throws Exception {
        mockMvc.perform(delete("/api/checklists/{id}", 1L).with(authenticatedAs(1L)))
                .andExpect(status().isOk());
    }

    @Test
    void addItem_성공하면_아이템이_추가된_체크리스트를_반환한다() throws Exception {
        CreateChecklistItemRequest request = new CreateChecklistItemRequest("우유");
        when(checklistService.addItem(eq(1L), eq(1L), any())).thenReturn(
                new ChecklistResponse(1L, "장보기", List.of(new ChecklistItemResponse(1L, "우유", false, 0)), null));

        mockMvc.perform(post("/api/checklists/{id}/items", 1L)
                        .with(authenticatedAs(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].content").value("우유"));
    }

    @Test
    void addItem_내용이_공백이면_400을_반환한다() throws Exception {
        CreateChecklistItemRequest request = new CreateChecklistItemRequest("  ");

        mockMvc.perform(post("/api/checklists/{id}/items", 1L)
                        .with(authenticatedAs(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateItem_성공하면_변경된_내용을_반환한다() throws Exception {
        UpdateChecklistItemRequest request = new UpdateChecklistItemRequest("두유");
        when(checklistService.updateItem(eq(1L), eq(1L), eq(1L), any())).thenReturn(
                new ChecklistResponse(1L, "장보기", List.of(new ChecklistItemResponse(1L, "두유", false, 0)), null));

        mockMvc.perform(patch("/api/checklists/{id}/items/{itemId}", 1L, 1L)
                        .with(authenticatedAs(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].content").value("두유"));
    }

    @Test
    void toggleItem_체크여부를_반전한다() throws Exception {
        when(checklistService.toggleItem(1L, 1L, 1L)).thenReturn(
                new ChecklistResponse(1L, "장보기", List.of(new ChecklistItemResponse(1L, "우유", true, 0)), null));

        mockMvc.perform(patch("/api/checklists/{id}/items/{itemId}/toggle", 1L, 1L)
                        .with(authenticatedAs(1L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].checked").value(true));
    }

    @Test
    void deleteItem_성공하면_삭제된_결과의_체크리스트를_반환한다() throws Exception {
        when(checklistService.deleteItem(1L, 1L, 1L)).thenReturn(
                new ChecklistResponse(1L, "장보기", List.of(), null));

        mockMvc.perform(delete("/api/checklists/{id}/items/{itemId}", 1L, 1L)
                        .with(authenticatedAs(1L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isEmpty());
    }

    @Test
    void reorderItems_성공하면_재정렬된_체크리스트를_반환한다() throws Exception {
        ReorderItemsRequest request = new ReorderItemsRequest(List.of(2L, 1L));
        when(checklistService.reorderItems(eq(1L), eq(1L), any())).thenReturn(
                new ChecklistResponse(1L, "장보기", List.of(
                        new ChecklistItemResponse(2L, "두유", false, 0),
                        new ChecklistItemResponse(1L, "우유", false, 1)
                ), null));

        mockMvc.perform(patch("/api/checklists/{id}/items/reorder", 1L)
                        .with(authenticatedAs(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(2));
    }

    @Test
    void reorderItems_빈배열이면_400을_반환한다() throws Exception {
        ReorderItemsRequest request = new ReorderItemsRequest(List.of());

        mockMvc.perform(patch("/api/checklists/{id}/items/reorder", 1L)
                        .with(authenticatedAs(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
