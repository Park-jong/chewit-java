package com.chewworld.chewit.dto;

import com.chewworld.chewit.entity.RecurrenceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.time.LocalDate;

public class EventDtos {

    private EventDtos() {
    }

    public record CreateEventRequest(
            @NotBlank String title,
            String memo,
            @NotNull LocalDate date,
            @NotNull RecurrenceType recurrence
    ) {
    }

    public record UpdateEventRequest(
            @NotBlank String title,
            String memo,
            @NotNull LocalDate date,
            @NotNull RecurrenceType recurrence
    ) {
    }

    public record EventResponse(
            Long id,
            String title,
            String memo,
            LocalDate date,
            RecurrenceType recurrence,
            LocalDate occurrenceDate,
            Instant createdAt
    ) {
    }
}
