package com.chewworld.chewit.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.time.DayOfWeek;
import java.time.Instant;
import java.util.Set;

public class RoutineDtos {

    private RoutineDtos() {
    }

    public record CreateRoutineRequest(
            @NotBlank String title,
            String memo,
            @NotEmpty Set<DayOfWeek> daysOfWeek
    ) {
    }

    public record UpdateRoutineRequest(
            @NotBlank String title,
            String memo,
            @NotEmpty Set<DayOfWeek> daysOfWeek,
            boolean active
    ) {
    }

    public record RoutineResponse(
            Long id,
            String title,
            String memo,
            Set<DayOfWeek> daysOfWeek,
            boolean active,
            boolean done,
            Instant createdAt,
            double completionRate,
            int currentStreak,
            int longestStreak
    ) {
    }
}
