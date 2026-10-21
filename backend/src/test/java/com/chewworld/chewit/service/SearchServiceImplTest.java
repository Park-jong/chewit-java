package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.SearchDtos.SearchChecklistItem;
import com.chewworld.chewit.dto.SearchDtos.SearchResponse;
import com.chewworld.chewit.entity.Category;
import com.chewworld.chewit.entity.Checklist;
import com.chewworld.chewit.entity.ChecklistItem;
import com.chewworld.chewit.entity.Event;
import com.chewworld.chewit.entity.RecurrenceType;
import com.chewworld.chewit.entity.Task;
import com.chewworld.chewit.exception.InvalidRequestException;
import com.chewworld.chewit.exception.ResourceNotFoundException;
import com.chewworld.chewit.repository.ChecklistRepository;
import com.chewworld.chewit.repository.EventRepository;
import com.chewworld.chewit.repository.TaskRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SearchServiceImplTest {

    private static final Long USER_ID = 1L;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private ChecklistRepository checklistRepository;

    @Mock
    private CategoryService categoryService;

    @InjectMocks
    private SearchServiceImpl searchService;

    @Test
    void search_검색어를_trim하고_소문자_패턴으로_리포지토리에_전달한다() {
        when(taskRepository.search(eq(USER_ID), eq("%hello%"), eq(null), any())).thenReturn(List.of());
        when(eventRepository.search(eq(USER_ID), eq("%hello%"), eq(null), any())).thenReturn(List.of());
        when(checklistRepository.search(eq(USER_ID), eq("%hello%"), eq(null), any())).thenReturn(List.of());

        SearchResponse response = searchService.search(USER_ID, "  HeLLo ", null);

        assertThat(response.tasks()).isEmpty();
        assertThat(response.events()).isEmpty();
        assertThat(response.checklists()).isEmpty();
    }

    @Test
    void search_Task와_Event를_응답으로_변환한다() {
        Category category = Category.builder().id(5L).name("업무").color("#3B82F6").build();
        Task task = Task.builder().id(1L).title("회의").memo("메모").date(LocalDate.of(2026, 9, 3))
                .done(true).category(category).build();
        Event event = Event.builder().id(2L).title("회의 일정").memo(null).date(LocalDate.of(2026, 9, 1))
                .recurrence(RecurrenceType.WEEKLY).build();
        when(taskRepository.search(eq(USER_ID), eq("%회의%"), eq(null), any())).thenReturn(List.of(task));
        when(eventRepository.search(eq(USER_ID), eq("%회의%"), eq(null), any())).thenReturn(List.of(event));
        when(checklistRepository.search(eq(USER_ID), eq("%회의%"), eq(null), any())).thenReturn(List.of());

        SearchResponse response = searchService.search(USER_ID, "회의", null);

        assertThat(response.tasks()).hasSize(1);
        assertThat(response.tasks().get(0).title()).isEqualTo("회의");
        assertThat(response.tasks().get(0).done()).isTrue();
        assertThat(response.tasks().get(0).category().name()).isEqualTo("업무");
        assertThat(response.events()).hasSize(1);
        assertThat(response.events().get(0).date()).isEqualTo(LocalDate.of(2026, 9, 1));
        assertThat(response.events().get(0).recurrence()).isEqualTo(RecurrenceType.WEEKLY);
        assertThat(response.events().get(0).category()).isNull();
    }

    @Test
    void search_체크리스트는_맞은_아이템을_최대_3개까지_matchedItems로_담는다() {
        Checklist checklist = Checklist.builder().id(10L).title("장보기").build();
        checklist.getItems().addAll(List.of(
                item("우유 2팩"), item("빵"), item("우유 두유"), item("저지방 우유"), item("우유 초코")));
        when(taskRepository.search(eq(USER_ID), eq("%우유%"), eq(null), any())).thenReturn(List.of());
        when(eventRepository.search(eq(USER_ID), eq("%우유%"), eq(null), any())).thenReturn(List.of());
        when(checklistRepository.search(eq(USER_ID), eq("%우유%"), eq(null), any())).thenReturn(List.of(checklist));
        when(checklistRepository.findWithItemsByIdIn(List.of(10L))).thenReturn(List.of(checklist));

        SearchChecklistItem result = searchService.search(USER_ID, "우유", null).checklists().get(0);

        assertThat(result.title()).isEqualTo("장보기");
        assertThat(result.matchedItems()).containsExactly("우유 2팩", "우유 두유", "저지방 우유");
    }

    @Test
    void search_체크리스트_제목만_맞으면_matchedItems가_비어있다() {
        Checklist checklist = Checklist.builder().id(10L).title("Shopping").build();
        checklist.getItems().add(item("milk"));
        when(taskRepository.search(eq(USER_ID), eq("%shop%"), eq(null), any())).thenReturn(List.of());
        when(eventRepository.search(eq(USER_ID), eq("%shop%"), eq(null), any())).thenReturn(List.of());
        when(checklistRepository.search(eq(USER_ID), eq("%shop%"), eq(null), any())).thenReturn(List.of(checklist));
        when(checklistRepository.findWithItemsByIdIn(List.of(10L))).thenReturn(List.of(checklist));

        SearchChecklistItem result = searchService.search(USER_ID, "SHOP", null).checklists().get(0);

        assertThat(result.matchedItems()).isEmpty();
    }

    @Test
    void search_matchedItems는_대소문자를_무시한다() {
        Checklist checklist = Checklist.builder().id(10L).title("목록").build();
        checklist.getItems().add(item("Milk"));
        when(taskRepository.search(eq(USER_ID), eq("%milk%"), eq(null), any())).thenReturn(List.of());
        when(eventRepository.search(eq(USER_ID), eq("%milk%"), eq(null), any())).thenReturn(List.of());
        when(checklistRepository.search(eq(USER_ID), eq("%milk%"), eq(null), any())).thenReturn(List.of(checklist));
        when(checklistRepository.findWithItemsByIdIn(List.of(10L))).thenReturn(List.of(checklist));

        assertThat(searchService.search(USER_ID, "MILK", null).checklists().get(0).matchedItems())
                .containsExactly("Milk");
    }

    @Test
    void search_카테고리_필터를_리포지토리에_전달한다() {
        when(taskRepository.search(eq(USER_ID), eq("%a%"), eq(7L), any())).thenReturn(List.of());
        when(eventRepository.search(eq(USER_ID), eq("%a%"), eq(7L), any())).thenReturn(List.of());
        when(checklistRepository.search(eq(USER_ID), eq("%a%"), eq(7L), any())).thenReturn(List.of());

        searchService.search(USER_ID, "a", 7L);

        verify(categoryService).resolveOwned(USER_ID, 7L);
        verify(taskRepository).search(eq(USER_ID), eq("%a%"), eq(7L), any());
    }

    @Test
    void search_타인_카테고리면_404이고_검색하지_않는다() {
        when(categoryService.resolveOwned(USER_ID, 99L)).thenThrow(new ResourceNotFoundException("카테고리를 찾을 수 없습니다."));

        assertThatThrownBy(() -> searchService.search(USER_ID, "a", 99L))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(taskRepository, never()).search(any(), any(), any(), any());
    }

    @Test
    void search_빈_검색어는_400이다() {
        assertThatThrownBy(() -> searchService.search(USER_ID, "   ", null))
                .isInstanceOf(InvalidRequestException.class);
        assertThatThrownBy(() -> searchService.search(USER_ID, null, null))
                .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void search_50자_초과_검색어는_400이고_50자는_허용한다() {
        assertThatThrownBy(() -> searchService.search(USER_ID, "a".repeat(51), null))
                .isInstanceOf(InvalidRequestException.class);

        String fifty = "a".repeat(50);
        when(taskRepository.search(eq(USER_ID), eq("%" + fifty + "%"), eq(null), any())).thenReturn(List.of());
        when(eventRepository.search(eq(USER_ID), eq("%" + fifty + "%"), eq(null), any())).thenReturn(List.of());
        when(checklistRepository.search(eq(USER_ID), eq("%" + fifty + "%"), eq(null), any())).thenReturn(List.of());
        assertThat(searchService.search(USER_ID, fifty, null).tasks()).isEmpty();
    }

    @Test
    void toLikePattern_와일드카드와_escape_문자를_이스케이프한다() {
        assertThat(SearchServiceImpl.toLikePattern("100%")).isEqualTo("%100!%%");
        assertThat(SearchServiceImpl.toLikePattern("a_b")).isEqualTo("%a!_b%");
        assertThat(SearchServiceImpl.toLikePattern("hi!")).isEqualTo("%hi!!%");
        assertThat(SearchServiceImpl.toLikePattern("a\\b")).isEqualTo("%a\\b%");
        assertThat(SearchServiceImpl.toLikePattern("AbC")).isEqualTo("%abc%");
    }

    private static ChecklistItem item(String content) {
        return ChecklistItem.builder().content(content).build();
    }
}
