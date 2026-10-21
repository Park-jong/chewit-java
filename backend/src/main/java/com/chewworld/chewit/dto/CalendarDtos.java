package com.chewworld.chewit.dto;

import com.chewworld.chewit.dto.CategoryDtos.CategorySummary;

import java.time.LocalDate;
import java.util.List;

public class CalendarDtos {

    private CalendarDtos() {
    }

    public record CalendarTaskItem(
            Long id,
            String title,
            boolean done,
            CategorySummary category
    ) {
    }

    public record CalendarRoutineItem(
            Long id,
            String title,
            boolean done
    ) {
    }

    public record CalendarEventItem(
            Long id,
            String title,
            CategorySummary category
    ) {
    }

    public record CalendarDayResponse(
            LocalDate date,
            List<CalendarTaskItem> tasks,
            List<CalendarRoutineItem> routines,
            List<CalendarEventItem> events
    ) {
    }

    public record CalendarMonthResponse(
            String month,
            List<CalendarDayResponse> days
    ) {
    }
}
