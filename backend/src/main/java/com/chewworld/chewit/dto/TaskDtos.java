package com.chewworld.chewit.dto;

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
            @NotNull LocalDate date
    ) {
    }

    public record UpdateTaskRequest(
            @NotBlank String title,
            String memo,
            @NotNull LocalDate date
    ) {
    }

    public record TaskResponse(
            Long id,
            String title,
            String memo,
            LocalDate date,
            boolean done,
            Instant createdAt
    ) {
    }
}
