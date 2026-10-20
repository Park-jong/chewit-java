package com.chewworld.chewit.dto;

import com.chewworld.chewit.dto.CategoryDtos.CategorySummary;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.time.LocalDate;

public class TaskDtos {

    private TaskDtos() {
    }

    public record CreateTaskRequest(
            @NotBlank String title,
            String memo,
            @NotNull LocalDate date,
            Long categoryId
    ) {
    }

    public record UpdateTaskRequest(
            @NotBlank String title,
            String memo,
            @NotNull LocalDate date,
            // PATCH는 전체 교체: categoryId가 null이면 카테고리를 해제한다
            Long categoryId
    ) {
    }

    public record CarryOverRequest(
            @NotNull LocalDate fromDate,
            @NotNull LocalDate toDate
    ) {
    }

    public record CarryOverResponse(
            int movedCount,
            LocalDate toDate
    ) {
    }

    public record TaskResponse(
            Long id,
            String title,
            String memo,
            LocalDate date,
            boolean done,
            Instant createdAt,
            CategorySummary category
    ) {
    }
}
