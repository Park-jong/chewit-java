package com.chewworld.chewit.controller;

import com.chewworld.chewit.dto.EventDtos.CreateEventRequest;
import com.chewworld.chewit.dto.EventDtos.EventResponse;
import com.chewworld.chewit.dto.EventDtos.UpdateEventRequest;
import com.chewworld.chewit.entity.RecurrenceType;
import com.chewworld.chewit.dto.EventDtos.UpdateOccurrenceRequest;
import com.chewworld.chewit.exception.InvalidRequestException;
import com.chewworld.chewit.exception.ResourceNotFoundException;
import com.chewworld.chewit.service.EventService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

import static com.chewworld.chewit.controller.support.ControllerTestSupport.authenticatedAs;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = EventController.class)
@AutoConfigureMockMvc(addFilters = false)
class EventControllerTest extends com.chewworld.chewit.controller.support.ControllerSliceTestBase {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @MockitoBean
    private EventService eventService;

    @Test
    void list_월별로_이벤트를_조회한다() throws Exception {
        LocalDate date = LocalDate.of(2026, 3, 5);
        when(eventService.listByMonth(1L, YearMonth.of(2026, 3))).thenReturn(List.of(
                new EventResponse(1L, "생일", null, date, RecurrenceType.YEARLY, date, null, null, false, "생일", "원본메모")));

        mockMvc.perform(get("/api/events").param("month", "2026-03").with(authenticatedAs(1L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("생일"))
                .andExpect(jsonPath("$[0].seriesTitle").value("생일"))
                .andExpect(jsonPath("$[0].seriesMemo").value("원본메모"));
    }

    @Test
    void list_month파라미터가_없으면_이번달_기준으로_조회한다() throws Exception {
        when(eventService.listByMonth(eq(1L), eq(YearMonth.now()))).thenReturn(List.of());

        mockMvc.perform(get("/api/events").with(authenticatedAs(1L)))
                .andExpect(status().isOk());
    }

    @Test
    void list_잘못된_month형식이면_현재_동작상_500을_반환한다() throws Exception {
        mockMvc.perform(get("/api/events").param("month", "not-a-month").with(authenticatedAs(1L)))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void create_성공하면_생성된_이벤트를_반환한다() throws Exception {
        LocalDate date = LocalDate.of(2026, 3, 5);
        CreateEventRequest request = new CreateEventRequest("생일", null, date, RecurrenceType.YEARLY, null);
        when(eventService.create(eq(1L), any())).thenReturn(
                new EventResponse(1L, "생일", null, date, RecurrenceType.YEARLY, date, null, null, false, "생일", null));

        mockMvc.perform(post("/api/events")
                        .with(authenticatedAs(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("생일"));
    }

    @Test
    void create_제목이_공백이면_400을_반환한다() throws Exception {
        CreateEventRequest request = new CreateEventRequest("  ", null, LocalDate.now(), RecurrenceType.NONE, null);

        mockMvc.perform(post("/api/events")
                        .with(authenticatedAs(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void update_성공하면_수정된_이벤트를_반환한다() throws Exception {
        LocalDate date = LocalDate.of(2026, 3, 6);
        UpdateEventRequest request = new UpdateEventRequest("생일2", null, date, RecurrenceType.NONE, null);
        when(eventService.update(eq(1L), eq(1L), any())).thenReturn(
                new EventResponse(1L, "생일2", null, date, RecurrenceType.NONE, date, null, null, false, "생일2", null));

        mockMvc.perform(patch("/api/events/{id}", 1L)
                        .with(authenticatedAs(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("생일2"));
    }

    @Test
    void update_소유하지_않은_이벤트면_404를_반환한다() throws Exception {
        UpdateEventRequest request = new UpdateEventRequest("생일2", null, LocalDate.now(), RecurrenceType.NONE, null);
        when(eventService.update(eq(1L), eq(1L), any()))
                .thenThrow(new ResourceNotFoundException("이벤트를 찾을 수 없습니다."));

        mockMvc.perform(patch("/api/events/{id}", 1L)
                        .with(authenticatedAs(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void delete_성공하면_200을_반환한다() throws Exception {
        mockMvc.perform(delete("/api/events/{id}", 1L).with(authenticatedAs(1L)))
                .andExpect(status().isOk());
    }

    @Test
    void deleteOccurrence_성공하면_200을_반환한다() throws Exception {
        mockMvc.perform(delete("/api/events/{id}/occurrences/{date}", 1L, "2026-08-10").with(authenticatedAs(1L)))
                .andExpect(status().isOk());
    }

    @Test
    void deleteOccurrence_유효하지_않은_회차면_400을_반환한다() throws Exception {
        doThrow(new InvalidRequestException("유효한 반복 회차가 아닙니다."))
                .when(eventService).deleteOccurrence(1L, 1L, LocalDate.of(2026, 8, 11));

        mockMvc.perform(delete("/api/events/{id}/occurrences/{date}", 1L, "2026-08-11").with(authenticatedAs(1L)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deleteOccurrence_없는_이벤트면_404를_반환한다() throws Exception {
        doThrow(new ResourceNotFoundException("이벤트를 찾을 수 없습니다."))
                .when(eventService).deleteOccurrence(1L, 9L, LocalDate.of(2026, 8, 10));

        mockMvc.perform(delete("/api/events/{id}/occurrences/{date}", 9L, "2026-08-10").with(authenticatedAs(1L)))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateOccurrence_성공하면_수정된_회차를_반환한다() throws Exception {
        LocalDate date = LocalDate.of(2026, 8, 10);
        when(eventService.updateOccurrence(eq(1L), eq(1L), eq(date), any())).thenReturn(
                new EventResponse(1L, "이번만", null, LocalDate.of(2026, 8, 3), RecurrenceType.WEEKLY, date, null, null, true, "매주회의", "원본메모"));

        mockMvc.perform(patch("/api/events/{id}/occurrences/{date}", 1L, "2026-08-10")
                        .with(authenticatedAs(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateOccurrenceRequest("이번만", null))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("이번만"))
                .andExpect(jsonPath("$.overridden").value(true))
                .andExpect(jsonPath("$.seriesTitle").value("매주회의"))
                .andExpect(jsonPath("$.seriesMemo").value("원본메모"));
    }

    @Test
    void updateOccurrence_제목이_공백이면_400을_반환한다() throws Exception {
        mockMvc.perform(patch("/api/events/{id}/occurrences/{date}", 1L, "2026-08-10")
                        .with(authenticatedAs(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateOccurrenceRequest(" ", null))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateOccurrence_없는_이벤트면_404를_반환한다() throws Exception {
        when(eventService.updateOccurrence(eq(1L), eq(9L), any(), any()))
                .thenThrow(new ResourceNotFoundException("이벤트를 찾을 수 없습니다."));

        mockMvc.perform(patch("/api/events/{id}/occurrences/{date}", 9L, "2026-08-10")
                        .with(authenticatedAs(1L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateOccurrenceRequest("x", null))))
                .andExpect(status().isNotFound());
    }
}
