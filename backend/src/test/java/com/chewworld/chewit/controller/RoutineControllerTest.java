package com.chewworld.chewit.controller;

import com.chewworld.chewit.dto.RoutineDtos.CreateRoutineRequest;
import com.chewworld.chewit.dto.RoutineDtos.RoutineResponse;
import com.chewworld.chewit.dto.RoutineDtos.UpdateRoutineRequest;
import com.chewworld.chewit.exception.ResourceNotFoundException;
import com.chewworld.chewit.service.RoutineService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

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

@WebMvcTest(controllers = RoutineController.class)
@AutoConfigureMockMvc(addFilters = false)
class RoutineControllerTest extends com.chewworld.chewit.controller.support.ControllerSliceTestBase {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @MockitoBean
    private RoutineService routineService;

    @Test
    void list_전체_루틴을_반환한다() throws Exception {
        when(routineService.listAll(1L)).thenReturn(List.of(
                new RoutineResponse(1L, "운동", null, Set.of(DayOfWeek.MONDAY), true, false, null)));

        mockMvc.perform(get("/api/routines").with(authenticatedAs(1L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("운동"));
    }

    @Test
    void listByDate_날짜파라미터가_없으면_오늘_기준으로_조회한다() throws Exception {
        when(routineService.listByDate(eq(1L), eq(LocalDate.now()))).thenReturn(List.of());

        mockMvc.perform(get("/api/routines/today").with(authenticatedAs(1L)))
                .andExpect(status().isOk());
    }

    @Test
    void listByDate_날짜파라미터로_조회한다() throws Exception {
        LocalDate date = LocalDate.of(2026, 8, 17);
        when(routineService.listByDate(1L, date)).thenReturn(List.of());

        mockMvc.perform(get("/api/routines/today").param("date", "2026-08-17").with(authenticatedAs(1L)))
                .andExpect(status().isOk());
    }

    @Test
    void create_성공하면_생성된_루틴을_반환한다() throws Exception {
        CreateRoutineRequest request = new CreateRoutineRequest("운동", null, Set.of(DayOfWeek.MONDAY));
        when(routineService.create(eq(1L), any())).thenReturn(
                new RoutineResponse(1L, "운동", null, Set.of(DayOfWeek.MONDAY), true, false, null));

        mockMvc.perform(post("/api/routines")
                        .with(authenticatedAs(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("운동"));
    }

    @Test
    void create_요일이_비어있으면_400을_반환한다() throws Exception {
        CreateRoutineRequest request = new CreateRoutineRequest("운동", null, Set.of());

        mockMvc.perform(post("/api/routines")
                        .with(authenticatedAs(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void update_성공하면_수정된_루틴을_반환한다() throws Exception {
        UpdateRoutineRequest request = new UpdateRoutineRequest("운동2", null, Set.of(DayOfWeek.TUESDAY), false);
        when(routineService.update(eq(1L), eq(1L), any())).thenReturn(
                new RoutineResponse(1L, "운동2", null, Set.of(DayOfWeek.TUESDAY), false, false, null));

        mockMvc.perform(patch("/api/routines/{id}", 1L)
                        .with(authenticatedAs(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("운동2"));
    }

    @Test
    void toggle_완료여부를_반전한다() throws Exception {
        LocalDate date = LocalDate.of(2026, 8, 17);
        when(routineService.toggleCompletion(1L, 1L, date)).thenReturn(
                new RoutineResponse(1L, "운동", null, Set.of(DayOfWeek.MONDAY), true, true, null));

        mockMvc.perform(patch("/api/routines/{id}/toggle", 1L)
                        .param("date", "2026-08-17")
                        .with(authenticatedAs(1L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.done").value(true));
    }

    @Test
    void toggle_date파라미터가_없으면_현재_동작상_500을_반환한다() throws Exception {
        mockMvc.perform(patch("/api/routines/{id}/toggle", 1L).with(authenticatedAs(1L)))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void delete_성공하면_200을_반환한다() throws Exception {
        mockMvc.perform(delete("/api/routines/{id}", 1L).with(authenticatedAs(1L)))
                .andExpect(status().isOk());
    }

    @Test
    void delete_소유하지_않은_루틴이면_404를_반환한다() throws Exception {
        org.mockito.Mockito.doThrow(new ResourceNotFoundException("루틴을 찾을 수 없습니다."))
                .when(routineService).delete(1L, 1L);

        mockMvc.perform(delete("/api/routines/{id}", 1L).with(authenticatedAs(1L)))
                .andExpect(status().isNotFound());
    }
}
