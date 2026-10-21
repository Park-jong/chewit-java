package com.chewworld.chewit.dto;

import com.chewworld.chewit.dto.CategoryDtos.CategorySummary;
import com.chewworld.chewit.entity.RecurrenceType;

import java.time.LocalDate;
import java.util.List;

public class SearchDtos {

    private SearchDtos() {
    }

    public record SearchTaskItem(
            Long id,
            String title,
            String memo,
            LocalDate date,
            boolean done,
            CategorySummary category
    ) {
    }

    // 시리즈 단위 결과: date는 시리즈 원본 날짜, 회차 override는 검색 대상이 아니다
    public record SearchEventItem(
            Long id,
            String title,
            String memo,
            LocalDate date,
            RecurrenceType recurrence,
            CategorySummary category
    ) {
    }

    // matchedItems: 맞은 아이템 content (최대 3개). 제목만 맞으면 빈 리스트
    public record SearchChecklistItem(
            Long id,
            String title,
            CategorySummary category,
            List<String> matchedItems
    ) {
    }

    public record SearchResponse(
            List<SearchTaskItem> tasks,
            List<SearchEventItem> events,
            List<SearchChecklistItem> checklists
    ) {
    }
}
