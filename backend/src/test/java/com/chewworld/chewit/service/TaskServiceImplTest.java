package com.chewworld.chewit.service;

import com.chewworld.chewit.dto.CategoryDtos.CategorySummary;
import com.chewworld.chewit.dto.TaskDtos.CarryOverRequest;
import com.chewworld.chewit.dto.TaskDtos.CarryOverResponse;
import com.chewworld.chewit.dto.TaskDtos.CreateTaskRequest;
import com.chewworld.chewit.dto.TaskDtos.TaskResponse;
import com.chewworld.chewit.dto.TaskDtos.UpdateTaskRequest;
import com.chewworld.chewit.entity.Category;
import com.chewworld.chewit.entity.Task;
import com.chewworld.chewit.entity.User;
import com.chewworld.chewit.exception.InvalidRequestException;
import com.chewworld.chewit.exception.ResourceNotFoundException;
import com.chewworld.chewit.repository.TaskRepository;
import com.chewworld.chewit.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskServiceImplTest {

    private static final Long USER_ID = 1L;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CategoryService categoryService;

    @InjectMocks
    private TaskServiceImpl taskService;

    @Test
    void listByDate_해당_날짜의_할일을_반환한다() {
        LocalDate date = LocalDate.of(2026, 8, 17);
        Task task = Task.builder().id(1L).title("할일").date(date).build();
        when(taskRepository.findByUser_IdAndDateOrderByCreatedAtAsc(USER_ID, date))
                .thenReturn(List.of(task));

        List<TaskResponse> responses = taskService.listByDate(USER_ID, date);

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).title()).isEqualTo("할일");
    }

    @Test
    void create_할일을_생성한다() {
        LocalDate date = LocalDate.of(2026, 8, 17);
        CreateTaskRequest request = new CreateTaskRequest("새 할일", "메모", date, null);
        User userRef = User.builder().id(USER_ID).build();
        when(userRepository.getReferenceById(USER_ID)).thenReturn(userRef);

        TaskResponse response = taskService.create(USER_ID, request);

        assertThat(response.title()).isEqualTo("새 할일");
        assertThat(response.memo()).isEqualTo("메모");
        assertThat(response.date()).isEqualTo(date);
        assertThat(response.done()).isFalse();
        verify(taskRepository).save(any(Task.class));
    }

    @Test
    void update_소유한_할일이면_수정한다() {
        Task task = Task.builder().id(1L).title("기존").date(LocalDate.of(2026, 8, 1)).build();
        when(taskRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.of(task));
        LocalDate newDate = LocalDate.of(2026, 8, 20);
        UpdateTaskRequest request = new UpdateTaskRequest("수정됨", "새메모", newDate, null);

        TaskResponse response = taskService.update(USER_ID, 1L, request);

        assertThat(response.title()).isEqualTo("수정됨");
        assertThat(response.memo()).isEqualTo("새메모");
        assertThat(response.date()).isEqualTo(newDate);
    }

    @Test
    void update_소유하지_않은_할일이면_예외() {
        when(taskRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.empty());
        UpdateTaskRequest request = new UpdateTaskRequest("수정됨", null, LocalDate.now(), null);

        assertThatThrownBy(() -> taskService.update(USER_ID, 1L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_categoryId가_있으면_소유한_카테고리를_붙인다() {
        LocalDate date = LocalDate.of(2026, 8, 17);
        Category category = Category.builder().id(5L).name("업무").color("#3B82F6").build();
        when(userRepository.getReferenceById(USER_ID)).thenReturn(User.builder().id(USER_ID).build());
        when(categoryService.resolveOwned(USER_ID, 5L)).thenReturn(category);

        TaskResponse response = taskService.create(USER_ID, new CreateTaskRequest("새 할일", null, date, 5L));

        assertThat(response.category()).isEqualTo(new CategorySummary(5L, "업무", "#3B82F6"));
    }

    @Test
    void create_타인의_카테고리면_예외이고_저장하지_않는다() {
        when(userRepository.getReferenceById(USER_ID)).thenReturn(User.builder().id(USER_ID).build());
        when(categoryService.resolveOwned(USER_ID, 9L)).thenThrow(new ResourceNotFoundException("카테고리를 찾을 수 없습니다."));

        assertThatThrownBy(() -> taskService.create(USER_ID, new CreateTaskRequest("새 할일", null, LocalDate.now(), 9L)))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(taskRepository, never()).save(any(Task.class));
    }

    @Test
    void update_categoryId가_null이면_카테고리를_해제한다() {
        Category category = Category.builder().id(5L).name("업무").color("#3B82F6").build();
        Task task = Task.builder().id(1L).title("기존").date(LocalDate.of(2026, 8, 1)).category(category).build();
        when(taskRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.of(task));

        TaskResponse response = taskService.update(USER_ID, 1L,
                new UpdateTaskRequest("기존", null, LocalDate.of(2026, 8, 1), null));

        assertThat(response.category()).isNull();
        assertThat(task.getCategory()).isNull();
    }

    @Test
    void update_타인의_카테고리면_예외() {
        Task task = Task.builder().id(1L).title("기존").date(LocalDate.of(2026, 8, 1)).build();
        when(taskRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.of(task));
        when(categoryService.resolveOwned(USER_ID, 9L)).thenThrow(new ResourceNotFoundException("카테고리를 찾을 수 없습니다."));

        assertThatThrownBy(() -> taskService.update(USER_ID, 1L,
                new UpdateTaskRequest("수정", null, LocalDate.now(), 9L)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void toggleDone_완료여부를_반전한다() {
        Task task = Task.builder().id(1L).title("할일").date(LocalDate.now()).done(false).build();
        when(taskRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.of(task));

        TaskResponse response = taskService.toggleDone(USER_ID, 1L);

        assertThat(response.done()).isTrue();
        assertThat(task.isDone()).isTrue();
    }

    @Test
    void carryOver_미완료_할일만_대상_날짜로_이동한다() {
        LocalDate from = LocalDate.of(2026, 9, 20);
        LocalDate to = LocalDate.of(2026, 9, 21);
        Task first = Task.builder().id(1L).title("할일1").date(from).build();
        Task second = Task.builder().id(2L).title("할일2").date(from).build();
        when(taskRepository.findByUser_IdAndDateAndDoneFalse(USER_ID, from))
                .thenReturn(List.of(first, second));

        CarryOverResponse response = taskService.carryOver(USER_ID, new CarryOverRequest(from, to));

        assertThat(response.movedCount()).isEqualTo(2);
        assertThat(response.toDate()).isEqualTo(to);
        assertThat(first.getDate()).isEqualTo(to);
        assertThat(second.getDate()).isEqualTo(to);
    }

    @Test
    void carryOver_미완료_할일이_없으면_0건을_반환한다() {
        LocalDate from = LocalDate.of(2026, 9, 20);
        LocalDate to = LocalDate.of(2026, 9, 21);
        when(taskRepository.findByUser_IdAndDateAndDoneFalse(USER_ID, from)).thenReturn(List.of());

        CarryOverResponse response = taskService.carryOver(USER_ID, new CarryOverRequest(from, to));

        assertThat(response.movedCount()).isZero();
        assertThat(response.toDate()).isEqualTo(to);
    }

    @Test
    void carryOver_완료된_할일은_조회_대상이_아니므로_날짜가_유지된다() {
        LocalDate from = LocalDate.of(2026, 9, 20);
        LocalDate to = LocalDate.of(2026, 9, 21);
        Task done = Task.builder().id(1L).title("완료").date(from).done(true).build();
        Task pending = Task.builder().id(2L).title("미완료").date(from).build();
        // 리포지토리가 done=false만 반환하는 계약을 mock으로 재현
        when(taskRepository.findByUser_IdAndDateAndDoneFalse(USER_ID, from))
                .thenReturn(List.of(pending));

        CarryOverResponse response = taskService.carryOver(USER_ID, new CarryOverRequest(from, to));

        assertThat(response.movedCount()).isEqualTo(1);
        assertThat(pending.getDate()).isEqualTo(to);
        assertThat(done.getDate()).isEqualTo(from);
    }

    @Test
    void carryOver_시작일과_대상일이_같으면_예외() {
        LocalDate date = LocalDate.of(2026, 9, 20);

        assertThatThrownBy(() -> taskService.carryOver(USER_ID, new CarryOverRequest(date, date)))
                .isInstanceOf(InvalidRequestException.class);
        verify(taskRepository, never()).findByUser_IdAndDateAndDoneFalse(anyLong(), any());
    }

    @Test
    void carryOver_대상일이_시작일보다_과거면_예외() {
        LocalDate from = LocalDate.of(2026, 9, 20);
        LocalDate to = LocalDate.of(2026, 9, 19);

        assertThatThrownBy(() -> taskService.carryOver(USER_ID, new CarryOverRequest(from, to)))
                .isInstanceOf(InvalidRequestException.class);
        verify(taskRepository, never()).findByUser_IdAndDateAndDoneFalse(anyLong(), any());
    }

    @Test
    void carryOver_요청한_유저의_할일만_조회한다() {
        LocalDate from = LocalDate.of(2026, 9, 20);
        LocalDate to = LocalDate.of(2026, 9, 21);
        Task othersTask = Task.builder().id(9L).title("남의 할일").date(from).build();
        when(taskRepository.findByUser_IdAndDateAndDoneFalse(USER_ID, from)).thenReturn(List.of());

        CarryOverResponse response = taskService.carryOver(USER_ID, new CarryOverRequest(from, to));

        assertThat(response.movedCount()).isZero();
        assertThat(othersTask.getDate()).isEqualTo(from);
        verify(taskRepository).findByUser_IdAndDateAndDoneFalse(USER_ID, from);
        verify(taskRepository, never()).findByUser_IdAndDateAndDoneFalse(eq(2L), any());
    }

    @Test
    void delete_소유한_할일을_삭제한다() {
        Task task = Task.builder().id(1L).build();
        when(taskRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.of(task));

        taskService.delete(USER_ID, 1L);

        verify(taskRepository).delete(task);
    }

    @Test
    void delete_소유하지_않은_할일이면_예외() {
        when(taskRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.delete(USER_ID, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
