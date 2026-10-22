package com.chewworld.chewit.dto;

import com.chewworld.chewit.entity.RecurrenceType;
import com.chewworld.chewit.entity.TaskPriority;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public class ExportDtos {

    private ExportDtos() {
    }

    /** 내보내기 JSON 문서의 스키마 버전. 구조가 호환되지 않게 바뀌면 올린다. */
    public static final int EXPORT_VERSION = 1;

    // 카테고리 참조는 categoryId(+읽기용 categoryName)로 평탄화한다. 카테고리 없음은 null.
    public record ExportDocument(
            int version,
            Instant exportedAt,
            List<ExportCategory> categories,
            List<ExportTask> tasks,
            List<ExportEvent> events,
            List<ExportChecklist> checklists,
            List<ExportRoutine> routines
    ) {
    }

    public record ExportCategory(Long id, String name, String color, Instant createdAt) {
    }

    public record ExportTask(
            Long id,
            String title,
            String memo,
            LocalDate date,
            boolean done,
            TaskPriority priority,
            @JsonFormat(pattern = "HH:mm") LocalTime startTime,
            Long categoryId,
            String categoryName,
            Instant createdAt
    ) {
    }

    // 시리즈 정의(date는 시리즈 시작일)와 회차 override. 개별 회차를 펼친 값은 내보내지 않는다.
    public record ExportEvent(
            Long id,
            String title,
            String memo,
            LocalDate date,
            RecurrenceType recurrence,
            Long categoryId,
            String categoryName,
            Instant createdAt,
            List<ExportOccurrenceOverride> overrides
    ) {
    }

    public record ExportOccurrenceOverride(LocalDate occurrenceDate, boolean skipped, String title, String memo) {
    }

    public record ExportChecklist(
            Long id,
            String title,
            Long categoryId,
            String categoryName,
            Instant createdAt,
            List<ExportChecklistItem> items
    ) {
    }

    public record ExportChecklistItem(Long id, String content, boolean checked, int sortOrder) {
    }

    // completions: 완료한 날짜(오름차순)
    public record ExportRoutine(
            Long id,
            String title,
            String memo,
            List<DayOfWeek> daysOfWeek,
            boolean active,
            Instant createdAt,
            List<LocalDate> completions
    ) {
    }
}
