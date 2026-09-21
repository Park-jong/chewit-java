package com.chewworld.chewit.dto;

import com.chewworld.chewit.entity.Category;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public class CategoryDtos {

    private static final String HEX_COLOR = "^#[0-9a-fA-F]{6}$";

    private CategoryDtos() {
    }

    public record CreateCategoryRequest(
            @NotBlank @Size(max = 30) String name,
            @NotBlank @Pattern(regexp = HEX_COLOR, message = "#RRGGBB 형식이어야 합니다.") String color
    ) {
    }

    public record UpdateCategoryRequest(
            @NotBlank @Size(max = 30) String name,
            @NotBlank @Pattern(regexp = HEX_COLOR, message = "#RRGGBB 형식이어야 합니다.") String color
    ) {
    }

    public record CategoryResponse(
            Long id,
            String name,
            String color,
            Instant createdAt
    ) {
    }

    public record CategorySummary(
            Long id,
            String name,
            String color
    ) {
        public static CategorySummary from(Category category) {
            return category == null ? null : new CategorySummary(category.getId(), category.getName(), category.getColor());
        }
    }
}
