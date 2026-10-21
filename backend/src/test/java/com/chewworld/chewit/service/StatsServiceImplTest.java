package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.EventDtos.EventResponse;
import com.chewworld.chewit.dto.StatsDtos.MonthlyStatsResponse;
import com.chewworld.chewit.dto.StatsDtos.RoutineStreak;
import com.chewworld.chewit.entity.Checklist;
import com.chewworld.chewit.entity.ChecklistItem;
import com.chewworld.chewit.entity.RecurrenceType;
import com.chewworld.chewit.entity.Routine;
import com.chewworld.chewit.entity.RoutineCompletion;
import com.chewworld.chewit.entity.Task;
import com.chewworld.chewit.repository.ChecklistRepository;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StatsServiceImplTest {

    private static final Long USER_ID = 1L;
    private static final YearMonth MONTH = YearMonth.of(2026, 9);

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private RoutineRepository routineRepository;

    @Mock
    private RoutineCompletionRepository routineCompletionRepository;

    @Mock
    private ChecklistRepository checklistRepository;

    @Mock
    private EventService eventService;

    @InjectMocks
    private StatsServiceImpl statsService;

    @Test
    void monthly_Task_완료율을_계산한다() {
        Task done = Task.builder().date(LocalDate.of(2026, 9, 3)).done(true).build();
        Task notDone = Task.builder().date(LocalDate.of(2026, 9, 3)).done(false).build();
        when(taskRepository.findByUser_IdAndDateBetween(USER_ID, MONTH.atDay(1), MONTH.atEndOfMonth()))
                .thenReturn(List.of(done, notDone));
        when(routineRepository.findByUser_IdOrderByCreatedAtAsc(USER_ID)).thenReturn(List.of());
        when(checklistRepository.findByUser_IdOrderByCreatedAtAsc(USER_ID)).thenReturn(List.of());
        when(eventService.listByMonth(USER_ID, MONTH)).thenReturn(List.of());

        MonthlyStatsResponse response = statsService.monthly(USER_ID, MONTH);

        assertThat(response.taskStats().total()).isEqualTo(2);
        assertThat(response.taskStats().completed()).isEqualTo(1);
        assertThat(response.taskStats().completionRate()).isEqualTo(0.5);
        assertThat(response.taskStats().daily()).hasSize(30);
    }

    @Test
    void monthly_Routine_요일에_맞는_날짜만_기대치로_집계한다() {
        Routine mondayRoutine = Routine.builder().id(10L).active(true).daysOfWeek(Set.of(DayOfWeek.MONDAY)).build();
        when(taskRepository.findByUser_IdAndDateBetween(USER_ID, MONTH.atDay(1), MONTH.atEndOfMonth())).thenReturn(List.of());
        when(routineRepository.findByUser_IdOrderByCreatedAtAsc(USER_ID)).thenReturn(List.of(mondayRoutine));
        LocalDate firstMonday = LocalDate.of(2026, 9, 7);
        when(routineCompletionRepository.findByRoutine_IdInAndDateBetween(List.of(10L), MONTH.atDay(1), MONTH.atEndOfMonth()))
                .thenReturn(List.of(RoutineCompletion.builder().routine(mondayRoutine).date(firstMonday).build()));
        lenient().when(routineCompletionRepository.findByRoutine_IdInAndDateBetween(
                List.of(10L), MONTH.atEndOfMonth().minusDays(365), MONTH.atEndOfMonth())).thenReturn(List.of());
        when(checklistRepository.findByUser_IdOrderByCreatedAtAsc(USER_ID)).thenReturn(List.of());
        when(eventService.listByMonth(USER_ID, MONTH)).thenReturn(List.of());

        MonthlyStatsResponse response = statsService.monthly(USER_ID, MONTH);

        // 2026년 9월의 월요일: 7, 14, 21, 28일 (4번)
        assertThat(response.routineStats().expected()).isEqualTo(4);
        assertThat(response.routineStats().completed()).isEqualTo(1);
        assertThat(response.routineStats().completionRate()).isEqualTo(0.25);
    }

    @Test
    void monthly_활성_루틴이_없으면_기대치_0() {
        when(taskRepository.findByUser_IdAndDateBetween(USER_ID, MONTH.atDay(1), MONTH.atEndOfMonth())).thenReturn(List.of());
        when(routineRepository.findByUser_IdOrderByCreatedAtAsc(USER_ID)).thenReturn(List.of());
        when(checklistRepository.findByUser_IdOrderByCreatedAtAsc(USER_ID)).thenReturn(List.of());
        when(eventService.listByMonth(USER_ID, MONTH)).thenReturn(List.of());

        MonthlyStatsResponse response = statsService.monthly(USER_ID, MONTH);

        assertThat(response.routineStats().expected()).isZero();
        assertThat(response.routineStats().completionRate()).isZero();
        assertThat(response.routineStats().daily()).hasSize(30);
    }

    @Test
    void monthly_Checklist_아이템_완료율을_계산한다() {
        ChecklistItem checked = ChecklistItem.builder().checked(true).build();
        ChecklistItem unchecked = ChecklistItem.builder().checked(false).build();
        Checklist checklist = Checklist.builder().items(List.of(checked, unchecked)).build();
        when(taskRepository.findByUser_IdAndDateBetween(USER_ID, MONTH.atDay(1), MONTH.atEndOfMonth())).thenReturn(List.of());
        when(routineRepository.findByUser_IdOrderByCreatedAtAsc(USER_ID)).thenReturn(List.of());
        when(checklistRepository.findByUser_IdOrderByCreatedAtAsc(USER_ID)).thenReturn(List.of(checklist));
        when(eventService.listByMonth(USER_ID, MONTH)).thenReturn(List.of());

        MonthlyStatsResponse response = statsService.monthly(USER_ID, MONTH);

        assertThat(response.checklistStats().totalChecklists()).isEqualTo(1);
        assertThat(response.checklistStats().totalItems()).isEqualTo(2);
        assertThat(response.checklistStats().completedItems()).isEqualTo(1);
        assertThat(response.checklistStats().completionRate()).isEqualTo(0.5);
    }

    @Test
    void monthly_Event_해당월_occurrence_개수를_그대로_사용한다() {
        when(taskRepository.findByUser_IdAndDateBetween(USER_ID, MONTH.atDay(1), MONTH.atEndOfMonth())).thenReturn(List.of());
        when(routineRepository.findByUser_IdOrderByCreatedAtAsc(USER_ID)).thenReturn(List.of());
        when(checklistRepository.findByUser_IdOrderByCreatedAtAsc(USER_ID)).thenReturn(List.of());
        EventResponse occurrence = new EventResponse(1L, "회의", null, LocalDate.of(2026, 9, 1), RecurrenceType.WEEKLY, LocalDate.of(2026, 9, 1), null, null, false, "회의", null);
        when(eventService.listByMonth(USER_ID, MONTH)).thenReturn(List.of(occurrence, occurrence));

        MonthlyStatsResponse response = statsService.monthly(USER_ID, MONTH);

        assertThat(response.eventStats().occurrences()).isEqualTo(2);
    }

    @Test
    void monthly_이벤트_건수는_EventService_listByMonth_결과_크기를_사용한다() {
        // override(삭제/수정) 반영 자체는 EventServiceImplTest에서 검증한다.
        when(taskRepository.findByUser_IdAndDateBetween(USER_ID, MONTH.atDay(1), MONTH.atEndOfMonth())).thenReturn(List.of());
        when(routineRepository.findByUser_IdOrderByCreatedAtAsc(USER_ID)).thenReturn(List.of());
        when(checklistRepository.findByUser_IdOrderByCreatedAtAsc(USER_ID)).thenReturn(List.of());
        // 주간 반복 중 skipped 회차는 EventService가 이미 제외한 상태
        LocalDate d = LocalDate.of(2026, 9, 1);
        when(eventService.listByMonth(USER_ID, MONTH)).thenReturn(List.of(
                new EventResponse(1L, "회의", null, d, RecurrenceType.WEEKLY, d, null, null, false, "회의", null),
                new EventResponse(1L, "회의", null, d, RecurrenceType.WEEKLY, d.plusWeeks(2), null, null, false, "회의", null),
                new EventResponse(1L, "특별", null, d, RecurrenceType.WEEKLY, d.plusWeeks(3), null, null, true, "특별", null)));

        MonthlyStatsResponse response = statsService.monthly(USER_ID, MONTH);

        assertThat(response.eventStats().occurrences()).isEqualTo(3);
    }

    @Test
    void monthly_month_문자열은_YYYY_MM_형식이다() {
        when(taskRepository.findByUser_IdAndDateBetween(USER_ID, MONTH.atDay(1), MONTH.atEndOfMonth())).thenReturn(List.of());
        when(routineRepository.findByUser_IdOrderByCreatedAtAsc(USER_ID)).thenReturn(List.of());
        when(checklistRepository.findByUser_IdOrderByCreatedAtAsc(USER_ID)).thenReturn(List.of());
        when(eventService.listByMonth(USER_ID, MONTH)).thenReturn(List.of());

        MonthlyStatsResponse response = statsService.monthly(USER_ID, MONTH);

        assertThat(response.month()).isEqualTo("2026-09");
    }

    private void stubEmptyExceptRoutines(List<Routine> routines) {
        when(taskRepository.findByUser_IdAndDateBetween(USER_ID, MONTH.atDay(1), MONTH.atEndOfMonth())).thenReturn(List.of());
        when(routineRepository.findByUser_IdOrderByCreatedAtAsc(USER_ID)).thenReturn(routines);
        when(checklistRepository.findByUser_IdOrderByCreatedAtAsc(USER_ID)).thenReturn(List.of());
        when(eventService.listByMonth(USER_ID, MONTH)).thenReturn(List.of());
    }

    @Test
    void monthly_routineStreaks_과거_월은_말일_기준으로_현재_연속_내림차순_최대_5개를_반환한다() {
        LocalDate monthEnd = MONTH.atEndOfMonth(); // 2026-09-30
        List<Routine> routines = new ArrayList<>();
        List<RoutineCompletion> completions = new ArrayList<>();
        // 루틴 1..6: 매일 루틴, 말일 직전까지 id 만큼 연속 완료 (루틴 7은 기록 없음)
        for (long id = 1; id <= 7; id++) {
            Routine routine = Routine.builder().id(id).title("루틴" + id).active(true)
                    .daysOfWeek(Set.of(DayOfWeek.values())).build();
            routines.add(routine);
            if (id <= 6) {
                for (int i = 0; i < id; i++) {
                    completions.add(RoutineCompletion.builder().routine(routine).date(monthEnd.minusDays(i)).build());
                }
            }
        }
        stubEmptyExceptRoutines(routines);
        List<Long> ids = List.of(1L, 2L, 3L, 4L, 5L, 6L, 7L);
        when(routineCompletionRepository.findByRoutine_IdInAndDateBetween(ids, MONTH.atDay(1), monthEnd))
                .thenReturn(List.of());
        when(routineCompletionRepository.findByRoutine_IdInAndDateBetween(ids, monthEnd.minusDays(365), monthEnd))
                .thenReturn(completions);

        MonthlyStatsResponse response = statsService.monthly(USER_ID, MONTH);

        assertThat(response.routineStreaks()).extracting(RoutineStreak::routineId)
                .containsExactly(6L, 5L, 4L, 3L, 2L);
        assertThat(response.routineStreaks().get(0)).isEqualTo(new RoutineStreak(6L, "루틴6", 6, 6));
    }

    @Test
    void monthly_routineStreaks_비활성_루틴과_연속이_전혀_없는_루틴은_제외한다() {
        LocalDate monthEnd = MONTH.atEndOfMonth();
        Routine inactive = Routine.builder().id(1L).title("비활성").active(false)
                .daysOfWeek(Set.of(DayOfWeek.values())).build();
        Routine none = Routine.builder().id(2L).title("기록없음").active(true)
                .daysOfWeek(Set.of(DayOfWeek.values())).build();
        stubEmptyExceptRoutines(List.of(inactive, none));
        lenient().when(routineCompletionRepository.findByRoutine_IdInAndDateBetween(List.of(2L), MONTH.atDay(1), monthEnd))
                .thenReturn(List.of());
        lenient().when(routineCompletionRepository.findByRoutine_IdInAndDateBetween(List.of(2L), monthEnd.minusDays(365), monthEnd))
                .thenReturn(List.of());

        MonthlyStatsResponse response = statsService.monthly(USER_ID, MONTH);

        assertThat(response.routineStreaks()).isEmpty();
    }

    @Test
    void monthly_routineStreaks_미래_월이면_빈_목록이다() {
        YearMonth future = YearMonth.now().plusMonths(2);
        Routine routine = Routine.builder().id(1L).title("운동").active(true)
                .daysOfWeek(Set.of(DayOfWeek.values())).build();
        when(taskRepository.findByUser_IdAndDateBetween(USER_ID, future.atDay(1), future.atEndOfMonth())).thenReturn(List.of());
        when(routineRepository.findByUser_IdOrderByCreatedAtAsc(USER_ID)).thenReturn(List.of(routine));
        lenient().when(routineCompletionRepository.findByRoutine_IdInAndDateBetween(
                List.of(1L), future.atDay(1), future.atEndOfMonth())).thenReturn(List.of());
        when(checklistRepository.findByUser_IdOrderByCreatedAtAsc(USER_ID)).thenReturn(List.of());
        when(eventService.listByMonth(USER_ID, future)).thenReturn(List.of());

        MonthlyStatsResponse response = statsService.monthly(USER_ID, future);

        assertThat(response.routineStreaks()).isEmpty();
    }

    @Test
    void monthly_routineStreaks_이번_달은_오늘까지를_기준으로_센다() {
        YearMonth thisMonth = YearMonth.now();
        LocalDate today = LocalDate.now();
        Routine routine = Routine.builder().id(1L).title("운동").active(true)
                .daysOfWeek(Set.of(DayOfWeek.values())).build();
        when(taskRepository.findByUser_IdAndDateBetween(USER_ID, thisMonth.atDay(1), thisMonth.atEndOfMonth())).thenReturn(List.of());
        when(routineRepository.findByUser_IdOrderByCreatedAtAsc(USER_ID)).thenReturn(List.of(routine));
        lenient().when(routineCompletionRepository.findByRoutine_IdInAndDateBetween(
                List.of(1L), thisMonth.atDay(1), thisMonth.atEndOfMonth())).thenReturn(List.of());
        when(routineCompletionRepository.findByRoutine_IdInAndDateBetween(List.of(1L), today.minusDays(365), today))
                .thenReturn(List.of(
                        RoutineCompletion.builder().routine(routine).date(today).build(),
                        RoutineCompletion.builder().routine(routine).date(today.minusDays(1)).build()));
        when(checklistRepository.findByUser_IdOrderByCreatedAtAsc(USER_ID)).thenReturn(List.of());
        when(eventService.listByMonth(USER_ID, thisMonth)).thenReturn(List.of());

        MonthlyStatsResponse response = statsService.monthly(USER_ID, thisMonth);

        assertThat(response.routineStreaks()).containsExactly(new RoutineStreak(1L, "운동", 2, 2));
    }
}
