package com.chewworld.chewit.dto;

import java.time.LocalDate;
import java.util.List;

public class StatsDtos {

    private StatsDtos() {
    }

    public record DailyCount(LocalDate date, int total, int completed) {
    }

    public record TaskStats(int total, int completed, double completionRate, List<DailyCount> daily) {
    }

    public record RoutineStats(int expected, int completed, double completionRate, List<DailyCount> daily) {
    }

    public record ChecklistStats(int totalChecklists, int totalItems, int completedItems, double completionRate) {
    }

    public record EventStats(int occurrences) {
    }

    public record MonthlyStatsResponse(
            String month,
            TaskStats taskStats,
            RoutineStats routineStats,
            ChecklistStats checklistStats,
            EventStats eventStats
    ) {
    }
}
