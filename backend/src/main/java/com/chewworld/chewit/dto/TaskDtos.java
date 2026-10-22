package com.chewworld.chewit.dto;

import com.chewworld.chewit.dto.CategoryDtos.CategorySummary;
import com.chewworld.chewit.entity.TaskPriority;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

public class TaskDtos {

    private TaskDtos() {
    }

    public record CreateTaskRequest(
            @NotBlank String title,
            String memo,
            @NotNull LocalDate date,
            Long categoryId,
            TaskPriority priority,
            // "HH:mm" 또는 "HH:mm:ss"를 받는다
            LocalTime startTime
    ) {
    }

    public record UpdateTaskRequest(
            @NotBlank String title,
            String memo,
            @NotNull LocalDate date,
            // PATCH는 전체 교체: categoryId가 null이면 카테고리를 해제한다
            Long categoryId,
            // 전체 교체: priority가 null이면 우선순위를 해제한다
            TaskPriority priority,
            // 전체 교체: startTime이 null이면 시간을 해제한다 ("HH:mm" 또는 "HH:mm:ss")
            LocalTime startTime
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
            CategorySummary category,
            TaskPriority priority,
            @JsonFormat(pattern = "HH:mm") LocalTime startTime
    ) {
    }
}
