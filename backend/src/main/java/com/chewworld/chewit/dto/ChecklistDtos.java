package com.chewworld.chewit.dto;

import com.chewworld.chewit.dto.CategoryDtos.CategorySummary;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.time.Instant;
import java.util.List;

public class ChecklistDtos {

    private ChecklistDtos() {
    }

    public record CreateChecklistRequest(
            @NotBlank String title,
            Long categoryId
    ) {
    }

    public record UpdateChecklistRequest(
            @NotBlank String title,
            Long categoryId
    ) {
    }

    public record CreateChecklistItemRequest(
            @NotBlank String content
    ) {
    }

    public record UpdateChecklistItemRequest(
            @NotBlank String content
    ) {
    }

    public record ReorderItemsRequest(
            @NotEmpty List<Long> itemIds
    ) {
    }

    public record ChecklistItemResponse(
            Long id,
            String content,
            boolean checked,
            int sortOrder
    ) {
    }

    public record ChecklistResponse(
            Long id,
            String title,
            List<ChecklistItemResponse> items,
            Instant createdAt,
            CategorySummary category
    ) {
    }
}
