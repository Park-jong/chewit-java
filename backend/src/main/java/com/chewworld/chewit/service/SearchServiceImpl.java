package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.CategoryDtos.CategorySummary;
import com.chewworld.chewit.dto.SearchDtos.SearchChecklistItem;
import com.chewworld.chewit.dto.SearchDtos.SearchEventItem;
import com.chewworld.chewit.dto.SearchDtos.SearchResponse;
import com.chewworld.chewit.dto.SearchDtos.SearchTaskItem;
import com.chewworld.chewit.entity.Checklist;
import com.chewworld.chewit.entity.ChecklistItem;
import com.chewworld.chewit.exception.InvalidRequestException;
import com.chewworld.chewit.repository.ChecklistRepository;
import com.chewworld.chewit.repository.EventRepository;
import com.chewworld.chewit.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchServiceImpl implements SearchService {

    static final int MAX_QUERY_LENGTH = 50;
    static final int MAX_RESULTS_PER_TYPE = 30;
    static final int MAX_MATCHED_ITEMS = 3;
    // LIKE escape 문자. 백슬래시는 HQL/DB별 문자열 리터럴 해석이 달라 모호하므로 '!'를 쓴다.
    static final char LIKE_ESCAPE = '!';

    private static final Pageable LIMIT = PageRequest.of(0, MAX_RESULTS_PER_TYPE);

    private final TaskRepository taskRepository;
    private final EventRepository eventRepository;
    private final ChecklistRepository checklistRepository;
    private final CategoryService categoryService;

    @Override
    @Transactional(readOnly = true)
    public SearchResponse search(Long userId, String query, Long categoryId) {
        String trimmed = query == null ? "" : query.trim();
        if (trimmed.isEmpty()) {
            throw new InvalidRequestException("검색어를 입력해 주세요.");
        }
        if (trimmed.length() > MAX_QUERY_LENGTH) {
            throw new InvalidRequestException("검색어는 " + MAX_QUERY_LENGTH + "자 이하여야 합니다.");
        }
        // 타인 카테고리는 여기서 404
        categoryService.resolveOwned(userId, categoryId);

        String pattern = toLikePattern(trimmed);
        String lowerQuery = trimmed.toLowerCase(Locale.ROOT);

        List<SearchTaskItem> tasks = taskRepository.search(userId, pattern, categoryId, LIMIT).stream()
                .map(t -> new SearchTaskItem(t.getId(), t.getTitle(), t.getMemo(), t.getDate(), t.isDone(),
                        CategorySummary.from(t.getCategory())))
                .toList();

        List<SearchEventItem> events = eventRepository.search(userId, pattern, categoryId, LIMIT).stream()
                .map(e -> new SearchEventItem(e.getId(), e.getTitle(), e.getMemo(), e.getDate(), e.getRecurrence(),
                        CategorySummary.from(e.getCategory())))
                .toList();

        return new SearchResponse(tasks, events, searchChecklists(userId, pattern, lowerQuery, categoryId));
    }

    // 1) 제한·정렬된 체크리스트 조회 2) 아이템을 한 번에 fetch join (컬렉션 fetch + limit의 메모리 페이징 회피)
    private List<SearchChecklistItem> searchChecklists(Long userId, String pattern, String lowerQuery, Long categoryId) {
        List<Checklist> matched = checklistRepository.search(userId, pattern, categoryId, LIMIT);
        if (matched.isEmpty()) {
            return List.of();
        }
        List<Long> ids = matched.stream().map(Checklist::getId).toList();
        Map<Long, Checklist> withItems = checklistRepository.findWithItemsByIdIn(ids).stream()
                .collect(Collectors.toMap(Checklist::getId, Function.identity()));

        return matched.stream()
                .map(c -> {
                    Checklist full = withItems.getOrDefault(c.getId(), c);
                    List<String> matchedItems = full.getItems().stream()
                            .map(ChecklistItem::getContent)
                            .filter(content -> content.toLowerCase(Locale.ROOT).contains(lowerQuery))
                            .limit(MAX_MATCHED_ITEMS)
                            .toList();
                    return new SearchChecklistItem(c.getId(), c.getTitle(),
                            CategorySummary.from(c.getCategory()), matchedItems);
                })
                .toList();
    }

    /** 검색어를 LIKE 리터럴로 취급하도록 %, _, escape 문자를 이스케이프하고 소문자 부분 일치 패턴으로 만든다. */
    static String toLikePattern(String query) {
        StringBuilder sb = new StringBuilder("%");
        for (char ch : query.toLowerCase(Locale.ROOT).toCharArray()) {
            if (ch == '%' || ch == '_' || ch == LIKE_ESCAPE) {
                sb.append(LIKE_ESCAPE);
            }
            sb.append(ch);
        }
        return sb.append('%').toString();
    }
}
