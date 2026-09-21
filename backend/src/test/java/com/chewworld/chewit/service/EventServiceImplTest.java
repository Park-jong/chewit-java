package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.CategoryDtos.CategorySummary;
import com.chewworld.chewit.dto.EventDtos.CreateEventRequest;
import com.chewworld.chewit.dto.EventDtos.EventResponse;
import com.chewworld.chewit.dto.EventDtos.UpdateEventRequest;
import com.chewworld.chewit.entity.Category;
import com.chewworld.chewit.entity.Event;
import com.chewworld.chewit.entity.RecurrenceType;
import com.chewworld.chewit.entity.User;
import com.chewworld.chewit.exception.ResourceNotFoundException;
import com.chewworld.chewit.repository.EventRepository;
import com.chewworld.chewit.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventServiceImplTest {

    private static final Long USER_ID = 1L;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CategoryService categoryService;

    @InjectMocks
    private EventServiceImpl eventService;

    @Test
    void listByMonth_NONE_해당월에_속하면_한번_포함된다() {
        Event event = Event.builder().id(1L).title("생일").date(LocalDate.of(2026, 8, 15)).recurrence(RecurrenceType.NONE).build();
        when(eventRepository.findByUser_IdOrderByDateAsc(USER_ID)).thenReturn(List.of(event));

        List<EventResponse> responses = eventService.listByMonth(USER_ID, YearMonth.of(2026, 8));

        assertThat(responses).extracting(EventResponse::occurrenceDate).containsExactly(LocalDate.of(2026, 8, 15));
    }

    @Test
    void listByMonth_NONE_다른월이면_제외된다() {
        Event event = Event.builder().id(1L).title("생일").date(LocalDate.of(2026, 7, 15)).recurrence(RecurrenceType.NONE).build();
        when(eventRepository.findByUser_IdOrderByDateAsc(USER_ID)).thenReturn(List.of(event));

        List<EventResponse> responses = eventService.listByMonth(USER_ID, YearMonth.of(2026, 8));

        assertThat(responses).isEmpty();
    }

    @Test
    void listByMonth_WEEKLY_해당월의_모든_회차를_포함한다() {
        Event event = Event.builder().id(1L).title("회의").date(LocalDate.of(2026, 7, 20)).recurrence(RecurrenceType.WEEKLY).build();
        when(eventRepository.findByUser_IdOrderByDateAsc(USER_ID)).thenReturn(List.of(event));

        List<EventResponse> responses = eventService.listByMonth(USER_ID, YearMonth.of(2026, 8));

        assertThat(responses).extracting(EventResponse::occurrenceDate).containsExactly(
                LocalDate.of(2026, 8, 3),
                LocalDate.of(2026, 8, 10),
                LocalDate.of(2026, 8, 17),
                LocalDate.of(2026, 8, 24),
                LocalDate.of(2026, 8, 31)
        );
    }

    @Test
    void listByMonth_MONTHLY_말일_앵커는_짧은달에_말일로_클램프된다() {
        Event event = Event.builder().id(1L).title("월세").date(LocalDate.of(2026, 1, 31)).recurrence(RecurrenceType.MONTHLY).build();
        when(eventRepository.findByUser_IdOrderByDateAsc(USER_ID)).thenReturn(List.of(event));

        List<EventResponse> responses = eventService.listByMonth(USER_ID, YearMonth.of(2026, 2));

        assertThat(responses).extracting(EventResponse::occurrenceDate).containsExactly(LocalDate.of(2026, 2, 28));
    }

    @Test
    void listByMonth_MONTHLY_생성한_달에도_포함된다() {
        Event event = Event.builder().id(1L).title("월세").date(LocalDate.of(2026, 8, 5)).recurrence(RecurrenceType.MONTHLY).build();
        when(eventRepository.findByUser_IdOrderByDateAsc(USER_ID)).thenReturn(List.of(event));

        List<EventResponse> responses = eventService.listByMonth(USER_ID, YearMonth.of(2026, 8));

        assertThat(responses).extracting(EventResponse::occurrenceDate).containsExactly(LocalDate.of(2026, 8, 5));
    }

    @Test
    void listByMonth_YEARLY_윤년_2월29일_앵커는_평년에_2월28일로_클램프된다() {
        Event event = Event.builder().id(1L).title("생일").date(LocalDate.of(2024, 2, 29)).recurrence(RecurrenceType.YEARLY).build();
        when(eventRepository.findByUser_IdOrderByDateAsc(USER_ID)).thenReturn(List.of(event));

        List<EventResponse> responses = eventService.listByMonth(USER_ID, YearMonth.of(2025, 2));

        assertThat(responses).extracting(EventResponse::occurrenceDate).containsExactly(LocalDate.of(2025, 2, 28));
    }

    @Test
    void listByMonth_YEARLY_월이_다르면_제외된다() {
        Event event = Event.builder().id(1L).title("생일").date(LocalDate.of(2020, 3, 10)).recurrence(RecurrenceType.YEARLY).build();
        when(eventRepository.findByUser_IdOrderByDateAsc(USER_ID)).thenReturn(List.of(event));

        List<EventResponse> responses = eventService.listByMonth(USER_ID, YearMonth.of(2026, 5));

        assertThat(responses).isEmpty();
    }

    @Test
    void listByMonth_앵커가_조회월_이후면_제외된다() {
        Event event = Event.builder().id(1L).title("예정").date(LocalDate.of(2026, 9, 1)).recurrence(RecurrenceType.NONE).build();
        when(eventRepository.findByUser_IdOrderByDateAsc(USER_ID)).thenReturn(List.of(event));

        List<EventResponse> responses = eventService.listByMonth(USER_ID, YearMonth.of(2026, 8));

        assertThat(responses).isEmpty();
    }

    @Test
    void create_이벤트를_생성한다() {
        CreateEventRequest request = new CreateEventRequest("회의", "메모", LocalDate.of(2026, 8, 17), RecurrenceType.WEEKLY, null);
        when(userRepository.getReferenceById(USER_ID)).thenReturn(User.builder().id(USER_ID).build());

        EventResponse response = eventService.create(USER_ID, request);

        assertThat(response.title()).isEqualTo("회의");
        assertThat(response.recurrence()).isEqualTo(RecurrenceType.WEEKLY);
        assertThat(response.occurrenceDate()).isEqualTo(LocalDate.of(2026, 8, 17));
    }

    @Test
    void create_categoryId가_있으면_소유한_카테고리를_붙인다() {
        LocalDate date = LocalDate.of(2026, 8, 17);
        Category category = Category.builder().id(5L).name("약속").color("#22C55E").build();
        when(userRepository.getReferenceById(USER_ID)).thenReturn(User.builder().id(USER_ID).build());
        when(categoryService.resolveOwned(USER_ID, 5L)).thenReturn(category);

        EventResponse response = eventService.create(USER_ID,
                new CreateEventRequest("회의", null, date, RecurrenceType.NONE, 5L));

        assertThat(response.category()).isEqualTo(new CategorySummary(5L, "약속", "#22C55E"));
    }

    @Test
    void update_타인의_카테고리면_예외() {
        Event event = Event.builder().id(1L).title("기존").date(LocalDate.of(2026, 8, 1)).recurrence(RecurrenceType.NONE).build();
        when(eventRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.of(event));
        when(categoryService.resolveOwned(USER_ID, 9L)).thenThrow(new ResourceNotFoundException("카테고리를 찾을 수 없습니다."));

        assertThatThrownBy(() -> eventService.update(USER_ID, 1L,
                new UpdateEventRequest("수정", null, LocalDate.now(), RecurrenceType.NONE, 9L)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void update_categoryId가_null이면_카테고리를_해제한다() {
        Category category = Category.builder().id(5L).name("약속").color("#22C55E").build();
        Event event = Event.builder().id(1L).title("기존").date(LocalDate.of(2026, 8, 1))
                .recurrence(RecurrenceType.NONE).category(category).build();
        when(eventRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.of(event));

        EventResponse response = eventService.update(USER_ID, 1L,
                new UpdateEventRequest("기존", null, LocalDate.of(2026, 8, 1), RecurrenceType.NONE, null));

        assertThat(response.category()).isNull();
        assertThat(event.getCategory()).isNull();
    }

    @Test
    void update_소유한_이벤트면_수정한다() {
        Event event = Event.builder().id(1L).title("기존").date(LocalDate.of(2026, 8, 1)).recurrence(RecurrenceType.NONE).build();
        when(eventRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.of(event));
        UpdateEventRequest request = new UpdateEventRequest("수정됨", "새메모", LocalDate.of(2026, 9, 1), RecurrenceType.MONTHLY, null);

        EventResponse response = eventService.update(USER_ID, 1L, request);

        assertThat(response.title()).isEqualTo("수정됨");
        assertThat(response.recurrence()).isEqualTo(RecurrenceType.MONTHLY);
        assertThat(response.date()).isEqualTo(LocalDate.of(2026, 9, 1));
    }

    @Test
    void delete_소유한_이벤트를_삭제한다() {
        Event event = Event.builder().id(1L).build();
        when(eventRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.of(event));

        eventService.delete(USER_ID, 1L);

        verify(eventRepository).delete(event);
    }

    @Test
    void delete_소유하지_않은_이벤트면_예외() {
        when(eventRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> eventService.delete(USER_ID, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
