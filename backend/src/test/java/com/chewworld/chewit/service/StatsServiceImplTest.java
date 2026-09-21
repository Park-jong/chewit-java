package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.EventDtos.EventResponse;
import com.chewworld.chewit.dto.StatsDtos.MonthlyStatsResponse;
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
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
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
        EventResponse occurrence = new EventResponse(1L, "회의", null, LocalDate.of(2026, 9, 1), RecurrenceType.WEEKLY, LocalDate.of(2026, 9, 1), null, null);
        when(eventService.listByMonth(USER_ID, MONTH)).thenReturn(List.of(occurrence, occurrence));

        MonthlyStatsResponse response = statsService.monthly(USER_ID, MONTH);

        assertThat(response.eventStats().occurrences()).isEqualTo(2);
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
}
