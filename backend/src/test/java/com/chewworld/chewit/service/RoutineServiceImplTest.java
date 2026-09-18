package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.RoutineDtos.CreateRoutineRequest;
import com.chewworld.chewit.dto.RoutineDtos.RoutineResponse;
import com.chewworld.chewit.dto.RoutineDtos.UpdateRoutineRequest;
import com.chewworld.chewit.entity.Routine;
import com.chewworld.chewit.entity.RoutineCompletion;
import com.chewworld.chewit.entity.User;
import com.chewworld.chewit.exception.ResourceNotFoundException;
import com.chewworld.chewit.repository.RoutineCompletionRepository;
import com.chewworld.chewit.repository.RoutineRepository;
import com.chewworld.chewit.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RoutineServiceImplTest {

    private static final Long USER_ID = 1L;

    @Mock
    private RoutineRepository routineRepository;

    @Mock
    private RoutineCompletionRepository routineCompletionRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private RoutineServiceImpl routineService;

    @Test
    void listAll_모든_루틴을_done_false로_반환한다() {
        Routine routine = Routine.builder().id(1L).title("운동").daysOfWeek(Set.of(DayOfWeek.MONDAY)).build();
        when(routineRepository.findByUser_IdOrderByCreatedAtAsc(USER_ID)).thenReturn(List.of(routine));

        List<RoutineResponse> responses = routineService.listAll(USER_ID);

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).done()).isFalse();
    }

    @Test
    void listAll_예정된_요일이_없으면_완료율은_0이다() {
        Routine routine = Routine.builder().id(1L).title("운동").daysOfWeek(Set.of()).build();
        when(routineRepository.findByUser_IdOrderByCreatedAtAsc(USER_ID)).thenReturn(List.of(routine));

        List<RoutineResponse> responses = routineService.listAll(USER_ID);

        assertThat(responses.get(0).completionRate()).isEqualTo(0.0);
    }

    @Test
    void listAll_이번주_예정된_날을_모두_완료하면_완료율은_1이다() {
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.minusDays(today.getDayOfWeek().getValue() - 1L); // 이번 주 월요일
        Routine routine = Routine.builder().id(1L).title("운동").daysOfWeek(Set.of(DayOfWeek.values())).build();
        when(routineRepository.findByUser_IdOrderByCreatedAtAsc(USER_ID)).thenReturn(List.of(routine));

        List<RoutineCompletion> completions = weekStart.datesUntil(today.plusDays(1))
                .map(date -> RoutineCompletion.builder().routine(routine).date(date).build())
                .toList();
        when(routineCompletionRepository.findByRoutine_IdInAndDateBetween(List.of(1L), weekStart, today))
                .thenReturn(completions);

        List<RoutineResponse> responses = routineService.listAll(USER_ID);

        // 이번 주 월요일부터 오늘까지 매일 완료했으므로 완료율은 항상 1.0
        assertThat(responses.get(0).completionRate()).isEqualTo(1.0);
    }

    @Test
    void listAll_이번주_완료기록이_없으면_완료율은_0이다() {
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.minusDays(today.getDayOfWeek().getValue() - 1L);
        Routine routine = Routine.builder().id(1L).title("운동").daysOfWeek(Set.of(DayOfWeek.values())).build();
        when(routineRepository.findByUser_IdOrderByCreatedAtAsc(USER_ID)).thenReturn(List.of(routine));
        when(routineCompletionRepository.findByRoutine_IdInAndDateBetween(List.of(1L), weekStart, today))
                .thenReturn(List.of());

        List<RoutineResponse> responses = routineService.listAll(USER_ID);

        // 예정된 날은 있지만(이번 주 월요일~오늘) 완료기록이 없으므로 0.0
        assertThat(responses.get(0).completionRate()).isEqualTo(0.0);
    }

    @Test
    void listByDate_해당_요일에_활성화된_루틴이_없으면_빈_목록이고_완료조회는_안한다() {
        LocalDate date = LocalDate.of(2026, 8, 17); // 월요일
        when(routineRepository.findActiveByUserIdAndDayOfWeek(USER_ID, DayOfWeek.MONDAY)).thenReturn(List.of());

        List<RoutineResponse> responses = routineService.listByDate(USER_ID, date);

        assertThat(responses).isEmpty();
        verify(routineCompletionRepository, never()).findByRoutine_IdInAndDate(anyList(), eq(date));
    }

    @Test
    void listByDate_완료기록이_있는_루틴은_done_true로_매핑한다() {
        LocalDate date = LocalDate.of(2026, 8, 17); // 월요일
        Routine routine1 = Routine.builder().id(1L).title("운동").daysOfWeek(Set.of(DayOfWeek.MONDAY)).build();
        Routine routine2 = Routine.builder().id(2L).title("독서").daysOfWeek(Set.of(DayOfWeek.MONDAY)).build();
        when(routineRepository.findActiveByUserIdAndDayOfWeek(USER_ID, DayOfWeek.MONDAY))
                .thenReturn(List.of(routine1, routine2));
        RoutineCompletion completion = RoutineCompletion.builder().id(10L).routine(routine1).date(date).build();
        when(routineCompletionRepository.findByRoutine_IdInAndDate(List.of(1L, 2L), date))
                .thenReturn(List.of(completion));

        List<RoutineResponse> responses = routineService.listByDate(USER_ID, date);

        assertThat(responses).hasSize(2);
        assertThat(responses.get(0).id()).isEqualTo(1L);
        assertThat(responses.get(0).done()).isTrue();
        assertThat(responses.get(1).id()).isEqualTo(2L);
        assertThat(responses.get(1).done()).isFalse();
    }

    @Test
    void create_요일집합을_포함해_루틴을_생성한다() {
        CreateRoutineRequest request = new CreateRoutineRequest("운동", "메모", Set.of(DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY));
        when(userRepository.getReferenceById(USER_ID)).thenReturn(User.builder().id(USER_ID).build());

        RoutineResponse response = routineService.create(USER_ID, request);

        assertThat(response.title()).isEqualTo("운동");
        assertThat(response.daysOfWeek()).containsExactlyInAnyOrder(DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY);
        assertThat(response.active()).isTrue();
    }

    @Test
    void update_소유한_루틴이면_필드와_요일을_교체한다() {
        Routine routine = Routine.builder().id(1L).title("기존").daysOfWeek(new java.util.HashSet<>(Set.of(DayOfWeek.MONDAY))).active(true).build();
        when(routineRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.of(routine));
        UpdateRoutineRequest request = new UpdateRoutineRequest("수정됨", "새메모", Set.of(DayOfWeek.FRIDAY), false);

        RoutineResponse response = routineService.update(USER_ID, 1L, request);

        assertThat(response.title()).isEqualTo("수정됨");
        assertThat(response.daysOfWeek()).containsExactly(DayOfWeek.FRIDAY);
        assertThat(response.active()).isFalse();
    }

    @Test
    void toggleCompletion_완료기록이_없으면_생성한다() {
        LocalDate date = LocalDate.of(2026, 8, 17);
        Routine routine = Routine.builder().id(1L).build();
        when(routineRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.of(routine));
        when(routineCompletionRepository.findByRoutine_IdAndDate(1L, date)).thenReturn(Optional.empty());

        RoutineResponse response = routineService.toggleCompletion(USER_ID, 1L, date);

        assertThat(response.done()).isTrue();
        ArgumentCaptor<RoutineCompletion> captor = ArgumentCaptor.forClass(RoutineCompletion.class);
        verify(routineCompletionRepository).save(captor.capture());
        assertThat(captor.getValue().getDate()).isEqualTo(date);
    }

    @Test
    void toggleCompletion_완료기록이_있으면_삭제한다() {
        LocalDate date = LocalDate.of(2026, 8, 17);
        Routine routine = Routine.builder().id(1L).build();
        RoutineCompletion completion = RoutineCompletion.builder().id(10L).routine(routine).date(date).build();
        when(routineRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.of(routine));
        when(routineCompletionRepository.findByRoutine_IdAndDate(1L, date)).thenReturn(Optional.of(completion));

        RoutineResponse response = routineService.toggleCompletion(USER_ID, 1L, date);

        assertThat(response.done()).isFalse();
        verify(routineCompletionRepository).delete(completion);
    }

    @Test
    void delete_완료기록을_먼저_지우고_루틴을_삭제한다() {
        Routine routine = Routine.builder().id(1L).build();
        when(routineRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.of(routine));

        routineService.delete(USER_ID, 1L);

        verify(routineCompletionRepository).deleteByRoutine_Id(1L);
        verify(routineRepository).delete(routine);
    }

    @Test
    void update_소유하지_않은_루틴이면_예외() {
        when(routineRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.empty());
        UpdateRoutineRequest request = new UpdateRoutineRequest("x", null, Set.of(DayOfWeek.MONDAY), true);

        assertThatThrownBy(() -> routineService.update(USER_ID, 1L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
