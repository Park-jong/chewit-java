package com.chewworld.chewit.controller;

import com.chewworld.chewit.dto.CalendarDtos.CalendarDayResponse;
import com.chewworld.chewit.dto.CalendarDtos.CalendarEventItem;
import com.chewworld.chewit.dto.CalendarDtos.CalendarMonthResponse;
import com.chewworld.chewit.dto.CalendarDtos.CalendarRoutineItem;
import com.chewworld.chewit.dto.CalendarDtos.CalendarTaskItem;
import com.chewworld.chewit.dto.CategoryDtos.CategorySummary;
import com.chewworld.chewit.service.CalendarService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

import static com.chewworld.chewit.controller.support.ControllerTestSupport.authenticatedAs;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = CalendarController.class)
@AutoConfigureMockMvc(addFilters = false)
class CalendarControllerTest extends com.chewworld.chewit.controller.support.ControllerSliceTestBase {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CalendarService calendarService;

    private static CalendarMonthResponse sampleResponse(String month) {
        CalendarDayResponse day = new CalendarDayResponse(
                LocalDate.of(2026, 3, 2),
                List.of(new CalendarTaskItem(1L, "할일", false, new CategorySummary(5L, "업무", "#3B82F6"))),
                List.of(new CalendarRoutineItem(2L, "운동", true)),
                List.of(new CalendarEventItem(3L, "약속", null))
        );
        return new CalendarMonthResponse(month, List.of(day));
    }

    @Test
    void getMonth_month파라미터로_조회한다() throws Exception {
        when(calendarService.getMonth(1L, YearMonth.of(2026, 3))).thenReturn(sampleResponse("2026-03"));

        mockMvc.perform(get("/api/calendar").param("month", "2026-03").with(authenticatedAs(1L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.month").value("2026-03"))
                .andExpect(jsonPath("$.days[0].tasks[0].title").value("할일"))
                .andExpect(jsonPath("$.days[0].routines[0].done").value(true))
                .andExpect(jsonPath("$.days[0].tasks[0].category.name").value("업무"))
                .andExpect(jsonPath("$.days[0].tasks[0].category.color").value("#3B82F6"))
                .andExpect(jsonPath("$.days[0].events[0].title").value("약속"))
                .andExpect(jsonPath("$.days[0].events[0].category").doesNotExist());
    }

    @Test
    void getMonth_파라미터가_없으면_이번달_기준으로_조회한다() throws Exception {
        when(calendarService.getMonth(eq(1L), eq(YearMonth.now()))).thenReturn(sampleResponse(YearMonth.now().toString()));

        mockMvc.perform(get("/api/calendar").with(authenticatedAs(1L)))
                .andExpect(status().isOk());
    }
}
