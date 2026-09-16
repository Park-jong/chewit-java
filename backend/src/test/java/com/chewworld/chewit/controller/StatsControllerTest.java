package com.chewworld.chewit.controller;

import com.chewworld.chewit.dto.StatsDtos.ChecklistStats;
import com.chewworld.chewit.dto.StatsDtos.EventStats;
import com.chewworld.chewit.dto.StatsDtos.MonthlyStatsResponse;
import com.chewworld.chewit.dto.StatsDtos.RoutineStats;
import com.chewworld.chewit.dto.StatsDtos.TaskStats;
import com.chewworld.chewit.service.StatsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.YearMonth;
import java.util.List;

import static com.chewworld.chewit.controller.support.ControllerTestSupport.authenticatedAs;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = StatsController.class)
@AutoConfigureMockMvc(addFilters = false)
class StatsControllerTest extends com.chewworld.chewit.controller.support.ControllerSliceTestBase {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private StatsService statsService;

    private static MonthlyStatsResponse sampleResponse(String month) {
        return new MonthlyStatsResponse(
                month,
                new TaskStats(10, 7, 0.7, List.of()),
                new RoutineStats(20, 15, 0.75, List.of()),
                new ChecklistStats(3, 12, 8, 8.0 / 12),
                new EventStats(2)
        );
    }

    @Test
    void monthly_month파라미터로_조회한다() throws Exception {
        when(statsService.monthly(1L, YearMonth.of(2026, 3))).thenReturn(sampleResponse("2026-03"));

        mockMvc.perform(get("/api/stats/monthly").param("month", "2026-03").with(authenticatedAs(1L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.month").value("2026-03"))
                .andExpect(jsonPath("$.taskStats.total").value(10))
                .andExpect(jsonPath("$.routineStats.expected").value(20))
                .andExpect(jsonPath("$.checklistStats.totalChecklists").value(3))
                .andExpect(jsonPath("$.eventStats.occurrences").value(2));
    }

    @Test
    void monthly_파라미터가_없으면_이번달_기준으로_조회한다() throws Exception {
        when(statsService.monthly(eq(1L), eq(YearMonth.now()))).thenReturn(sampleResponse(YearMonth.now().toString()));

        mockMvc.perform(get("/api/stats/monthly").with(authenticatedAs(1L)))
                .andExpect(status().isOk());
    }
}
