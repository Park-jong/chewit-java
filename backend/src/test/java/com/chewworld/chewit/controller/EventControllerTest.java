package com.chewworld.chewit.controller;

import com.chewworld.chewit.dto.EventDtos.CreateEventRequest;
import com.chewworld.chewit.dto.EventDtos.EventResponse;
import com.chewworld.chewit.dto.EventDtos.UpdateEventRequest;
import com.chewworld.chewit.entity.RecurrenceType;
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
                new EventResponse(1L, "생일", null, date, RecurrenceType.YEARLY, date, null, null)));

        mockMvc.perform(get("/api/events").param("month", "2026-03").with(authenticatedAs(1L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("생일"));
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
                new EventResponse(1L, "생일", null, date, RecurrenceType.YEARLY, date, null, null));

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
                new EventResponse(1L, "생일2", null, date, RecurrenceType.NONE, date, null, null));

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
}
