package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.CalendarDtos.CalendarDayResponse;
import com.chewworld.chewit.dto.CalendarDtos.CalendarMonthResponse;
import com.chewworld.chewit.dto.EventDtos.EventResponse;
import com.chewworld.chewit.entity.Routine;
import com.chewworld.chewit.entity.RoutineCompletion;
import com.chewworld.chewit.entity.Task;
import com.chewworld.chewit.repository.RoutineCompletionRepository;
import com.chewworld.chewit.repository.RoutineRepository;
import com.chewworld.chewit.repository.TaskRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CalendarServiceImplTest {

    private static final Long USER_ID = 1L;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private RoutineRepository routineRepository;

    @Mock
    private RoutineCompletionRepository routineCompletionRepository;

    @Mock
    private EventService eventService;

    @InjectMocks
    private CalendarServiceImpl calendarService;

    @Test
    void getMonth_날짜별로_할일_루틴_이벤트를_모은다() {
        YearMonth month = YearMonth.of(2026, 3);
        LocalDate monthStart = month.atDay(1);
        LocalDate monthEnd = month.atEndOfMonth();
        LocalDate target = LocalDate.of(2026, 3, 2); // 월요일

        Task task = Task.builder().id(1L).title("장보기").date(target).done(false).build();
        when(taskRepository.findByUser_IdAndDateBetween(USER_ID, monthStart, monthEnd)).thenReturn(List.of(task));

        Routine mondayRoutine = Routine.builder().id(10L).title("운동").daysOfWeek(Set.of(DayOfWeek.MONDAY)).active(true).build();
        Routine sundayRoutine = Routine.builder().id(11L).title("독서").daysOfWeek(Set.of(DayOfWeek.SUNDAY)).active(true).build();
        when(routineRepository.findByUser_IdOrderByCreatedAtAsc(USER_ID)).thenReturn(List.of(mondayRoutine, sundayRoutine));

        RoutineCompletion completion = RoutineCompletion.builder().id(100L).routine(mondayRoutine).date(target).build();
        when(routineCompletionRepository.findByRoutine_IdInAndDateBetween(List.of(10L, 11L), monthStart, monthEnd))
                .thenReturn(List.of(completion));

        EventResponse event = new EventResponse(20L, "약속", null, target, null, target, null, null, false, "약속", null);
        when(eventService.listByMonth(USER_ID, month)).thenReturn(List.of(event));

        CalendarMonthResponse response = calendarService.getMonth(USER_ID, month);

        assertThat(response.month()).isEqualTo("2026-03");
        CalendarDayResponse day = response.days().stream()
                .filter(d -> d.date().equals(target))
                .findFirst()
                .orElseThrow();

        assertThat(day.tasks()).hasSize(1);
        assertThat(day.tasks().get(0).title()).isEqualTo("장보기");
        assertThat(day.tasks().get(0).done()).isFalse();

        assertThat(day.routines()).hasSize(1);
        assertThat(day.routines().get(0).id()).isEqualTo(10L);
        assertThat(day.routines().get(0).done()).isTrue();

        assertThat(day.events()).hasSize(1);
        assertThat(day.events().get(0).title()).isEqualTo("약속");
    }

    @Test
    void getMonth_EventService가_반환한_회차를_날짜별로_그룹핑한다() {
        // override(삭제/수정) 반영 자체는 EventServiceImplTest에서 검증한다.
        YearMonth month = YearMonth.of(2026, 3);
        LocalDate d2 = LocalDate.of(2026, 3, 2);
        LocalDate d9 = LocalDate.of(2026, 3, 9);
        LocalDate d16 = LocalDate.of(2026, 3, 16);
        when(taskRepository.findByUser_IdAndDateBetween(USER_ID, month.atDay(1), month.atEndOfMonth())).thenReturn(List.of());
        when(routineRepository.findByUser_IdOrderByCreatedAtAsc(USER_ID)).thenReturn(List.of());
        // 3/9 회차는 EventService가 이미 제외한 결과를 돌려준다고 가정
        when(eventService.listByMonth(USER_ID, month)).thenReturn(List.of(
                new EventResponse(20L, "회의", null, d2, null, d2, null, null, false, "회의", null),
                new EventResponse(20L, "특별회의", null, d2, null, d16, null, null, true, "특별회의", null)));

        CalendarMonthResponse response = calendarService.getMonth(USER_ID, month);

        assertThat(response.days().stream().filter(d -> d.date().equals(d9)).findFirst().orElseThrow().events()).isEmpty();
        assertThat(response.days().stream().filter(d -> d.date().equals(d16)).findFirst().orElseThrow().events())
                .extracting(e -> e.title()).containsExactly("특별회의");
    }

    @Test
    void getMonth_요일이_맞지_않는_루틴은_해당_날짜에_포함되지_않는다() {
        YearMonth month = YearMonth.of(2026, 3);
        LocalDate monthStart = month.atDay(1);
        LocalDate monthEnd = month.atEndOfMonth();
        LocalDate monday = LocalDate.of(2026, 3, 2); // 월요일

        when(taskRepository.findByUser_IdAndDateBetween(USER_ID, monthStart, monthEnd)).thenReturn(List.of());

        Routine sundayRoutine = Routine.builder().id(11L).title("독서").daysOfWeek(Set.of(DayOfWeek.SUNDAY)).active(true).build();
        when(routineRepository.findByUser_IdOrderByCreatedAtAsc(USER_ID)).thenReturn(List.of(sundayRoutine));
        when(routineCompletionRepository.findByRoutine_IdInAndDateBetween(List.of(11L), monthStart, monthEnd))
                .thenReturn(List.of());
        when(eventService.listByMonth(USER_ID, month)).thenReturn(List.of());

        CalendarMonthResponse response = calendarService.getMonth(USER_ID, month);

        CalendarDayResponse mondayResponse = response.days().stream()
                .filter(d -> d.date().equals(monday))
                .findFirst()
                .orElseThrow();

        assertThat(mondayResponse.routines()).isEmpty();
    }

    @Test
    void getMonth_비활성_루틴은_제외한다() {
        YearMonth month = YearMonth.of(2026, 3);
        LocalDate monthStart = month.atDay(1);
        LocalDate monthEnd = month.atEndOfMonth();

        when(taskRepository.findByUser_IdAndDateBetween(USER_ID, monthStart, monthEnd)).thenReturn(List.of());

        Routine inactiveRoutine = Routine.builder().id(12L).title("명상").daysOfWeek(Set.of(DayOfWeek.MONDAY)).active(false).build();
        when(routineRepository.findByUser_IdOrderByCreatedAtAsc(USER_ID)).thenReturn(List.of(inactiveRoutine));
        when(eventService.listByMonth(USER_ID, month)).thenReturn(List.of());

        CalendarMonthResponse response = calendarService.getMonth(USER_ID, month);

        assertThat(response.days()).allSatisfy(day -> assertThat(day.routines()).isEmpty());
    }

    @Test
    void getMonth_완료기록이_없는_루틴은_done_false다() {
        YearMonth month = YearMonth.of(2026, 3);
        LocalDate monthStart = month.atDay(1);
        LocalDate monthEnd = month.atEndOfMonth();
        LocalDate monday = LocalDate.of(2026, 3, 2);

        when(taskRepository.findByUser_IdAndDateBetween(USER_ID, monthStart, monthEnd)).thenReturn(List.of());

        Routine mondayRoutine = Routine.builder().id(10L).title("운동").daysOfWeek(Set.of(DayOfWeek.MONDAY)).active(true).build();
        when(routineRepository.findByUser_IdOrderByCreatedAtAsc(USER_ID)).thenReturn(List.of(mondayRoutine));
        when(routineCompletionRepository.findByRoutine_IdInAndDateBetween(List.of(10L), monthStart, monthEnd))
                .thenReturn(List.of());
        when(eventService.listByMonth(USER_ID, month)).thenReturn(List.of());

        CalendarMonthResponse response = calendarService.getMonth(USER_ID, month);

        CalendarDayResponse mondayResponse = response.days().stream()
                .filter(d -> d.date().equals(monday))
                .findFirst()
                .orElseThrow();

        assertThat(mondayResponse.routines()).hasSize(1);
        assertThat(mondayResponse.routines().get(0).done()).isFalse();
    }
}
