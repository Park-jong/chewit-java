package com.chewworld.chewit.controller;

import com.chewworld.chewit.dto.TaskDtos.CreateTaskRequest;
import com.chewworld.chewit.dto.TaskDtos.TaskResponse;
import com.chewworld.chewit.dto.TaskDtos.UpdateTaskRequest;
import com.chewworld.chewit.exception.ResourceNotFoundException;
import com.chewworld.chewit.service.TaskService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
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

@WebMvcTest(controllers = TaskController.class)
@AutoConfigureMockMvc(addFilters = false)
class TaskControllerTest extends com.chewworld.chewit.controller.support.ControllerSliceTestBase {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @MockitoBean
    private TaskService taskService;

    @Test
    void list_날짜파라미터로_조회한다() throws Exception {
        LocalDate date = LocalDate.of(2026, 8, 17);
        when(taskService.listByDate(1L, date)).thenReturn(
                List.of(new TaskResponse(1L, "할일", null, date, false, null)));

        mockMvc.perform(get("/api/tasks").param("date", "2026-08-17").with(authenticatedAs(1L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("할일"));
    }

    @Test
    void list_날짜파라미터가_없으면_오늘_기준으로_조회한다() throws Exception {
        when(taskService.listByDate(eq(1L), eq(LocalDate.now()))).thenReturn(List.of());

        mockMvc.perform(get("/api/tasks").with(authenticatedAs(1L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void create_성공하면_생성된_할일을_반환한다() throws Exception {
        LocalDate date = LocalDate.of(2026, 8, 17);
        CreateTaskRequest request = new CreateTaskRequest("새 할일", "메모", date);
        when(taskService.create(eq(1L), any())).thenReturn(
                new TaskResponse(1L, "새 할일", "메모", date, false, null));

        mockMvc.perform(post("/api/tasks")
                        .with(authenticatedAs(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("새 할일"))
                .andExpect(jsonPath("$.done").value(false));
    }

    @Test
    void create_제목이_공백이면_400을_반환한다() throws Exception {
        CreateTaskRequest request = new CreateTaskRequest("  ", null, LocalDate.now());

        mockMvc.perform(post("/api/tasks")
                        .with(authenticatedAs(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void update_성공하면_수정된_할일을_반환한다() throws Exception {
        LocalDate date = LocalDate.of(2026, 8, 20);
        UpdateTaskRequest request = new UpdateTaskRequest("수정됨", "새메모", date);
        when(taskService.update(eq(1L), eq(1L), any())).thenReturn(
                new TaskResponse(1L, "수정됨", "새메모", date, false, null));

        mockMvc.perform(patch("/api/tasks/{id}", 1L)
                        .with(authenticatedAs(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("수정됨"));
    }

    @Test
    void update_소유하지_않은_할일이면_404를_반환한다() throws Exception {
        UpdateTaskRequest request = new UpdateTaskRequest("수정됨", null, LocalDate.now());
        when(taskService.update(eq(1L), eq(1L), any()))
                .thenThrow(new ResourceNotFoundException("할일을 찾을 수 없습니다."));

        mockMvc.perform(patch("/api/tasks/{id}", 1L)
                        .with(authenticatedAs(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void toggle_완료여부를_반전한다() throws Exception {
        when(taskService.toggleDone(1L, 1L)).thenReturn(
                new TaskResponse(1L, "할일", null, LocalDate.now(), true, null));

        mockMvc.perform(patch("/api/tasks/{id}/toggle", 1L).with(authenticatedAs(1L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.done").value(true));
    }

    @Test
    void delete_성공하면_200을_반환한다() throws Exception {
        mockMvc.perform(delete("/api/tasks/{id}", 1L).with(authenticatedAs(1L)))
                .andExpect(status().isOk());
    }

    @Test
    void delete_소유하지_않은_할일이면_404를_반환한다() throws Exception {
        org.mockito.Mockito.doThrow(new ResourceNotFoundException("할일을 찾을 수 없습니다."))
                .when(taskService).delete(1L, 1L);

        mockMvc.perform(delete("/api/tasks/{id}", 1L).with(authenticatedAs(1L)))
                .andExpect(status().isNotFound());
    }
}
