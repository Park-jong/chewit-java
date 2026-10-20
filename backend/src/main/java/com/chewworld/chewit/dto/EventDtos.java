package com.chewworld.chewit.dto;

import com.chewworld.chewit.dto.CategoryDtos.CategorySummary;
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
            @NotNull RecurrenceType recurrence,
            Long categoryId
    ) {
    }

    public record UpdateEventRequest(
            @NotBlank String title,
            String memo,
            @NotNull LocalDate date,
            @NotNull RecurrenceType recurrence,
            // PATCH는 전체 교체: categoryId가 null이면 카테고리를 해제한다
            Long categoryId
    ) {
    }

    public record EventResponse(
            Long id,
            String title,
            String memo,
            LocalDate date,
            RecurrenceType recurrence,
            LocalDate occurrenceDate,
            Instant createdAt,
            CategorySummary category,
            boolean overridden,
            // title/memo는 회차 표시값(override 반영), seriesTitle/seriesMemo는 시리즈 원본
            String seriesTitle,
            String seriesMemo
    ) {
    }

    public record UpdateOccurrenceRequest(
            @NotBlank String title,
            String memo
    ) {
    }
}
